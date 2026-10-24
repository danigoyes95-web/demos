// Supabase Edge Function "avisos": envía las notificaciones push (mensualidad por vencer y check-in del sábado).
// Se programa con programar-avisos.sql. Despliegue y secretos: ver LEEME.md (sección Notificaciones push).
// Secretos necesarios: VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT, CRON_SECRET. (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya existen.)
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { db: { schema: 'carlos' } });
webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT')!, Deno.env.get('VAPID_PUBLIC')!, Deno.env.get('VAPID_PRIVATE')!);

const SITIO = Deno.env.get('SITIO') ?? 'https://fitzonetraining.github.io/';
// Ecuador es UTC-5 todo el año (sin horario de verano).
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const hoyEC = () => new Date(Date.now() - 5 * 3600e3);
const sumar = (d: Date, n: number) => new Date(d.getTime() + n * 864e5);

type Aviso = { titulo: string; cuerpo: string; url: string; tag: string };

async function enviar(subs: any[], aviso: Aviso) {
  let ok = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(aviso));
      ok++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await db.from('push_subs').delete().eq('endpoint', s.endpoint); // celular que ya no existe
    }
  }
  return ok;
}

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return new Response('forbidden', { status: 403 });
  const tipo = new URL(req.url).searchParams.get('tipo');
  const { data: clientes } = await db.from('clientes').select('id, datos, user_id, activo').eq('activo', true).not('user_id', 'is', null);
  const { data: subs } = await db.from('push_subs').select('endpoint, user_id, rol, p256dh, auth');
  const porUsuario = (uid: string) => (subs ?? []).filter((s) => s.user_id === uid);
  const coaches = (subs ?? []).filter((s) => s.rol === 'coach');
  let enviados = 0;

  if (tipo === 'mensualidad') {
    // Cada día: al cliente cuando le faltan 7, 3, 1 o 0 días; a Carlos un resumen de los que vencen en 7 días o menos.
    const hoy = ymd(hoyEC()); const porVencer: string[] = [];
    for (const c of clientes ?? []) {
      const v = c.datos?.vence; if (!/^\d{4}-\d{2}-\d{2}$/.test(v ?? '')) continue;
      const d = Math.round((Date.parse(v) - Date.parse(hoy)) / 864e5);
      if (d <= 7 && d >= 0) porVencer.push(`${c.datos?.nombre ?? 'Cliente'} (${d === 0 ? 'hoy' : d + ' d'})`);
      if ([7, 3, 1, 0].includes(d)) {
        enviados += await enviar(porUsuario(c.user_id), {
          titulo: d === 0 ? 'Tu mensualidad vence hoy' : `Tu mensualidad vence en ${d} día${d === 1 ? '' : 's'}`,
          cuerpo: 'Escríbele a Carlos para renovar y no perder tu ritmo 💪', url: SITIO + 'cliente.html', tag: 'mensualidad' });
      }
    }
    if (porVencer.length) enviados += await enviar(coaches, { titulo: `${porVencer.length} mensualidad${porVencer.length === 1 ? '' : 'es'} por vencer`, cuerpo: porVencer.slice(0, 6).join(', '), url: SITIO + 'panel.html', tag: 'mensualidad-coach' });
  } else if (tipo === 'checkin') {
    // Viernes 18:00: a los clientes que aún no subieron sus 3 fotos del sábado; a Carlos un resumen.
    const sabado = ymd(sumar(hoyEC(), 1));
    const { data: fotos } = await db.from('fotos').select('cliente_id, vista').eq('fecha', sabado);
    const conteo = new Map<string, number>(); for (const f of fotos ?? []) conteo.set(f.cliente_id, (conteo.get(f.cliente_id) ?? 0) + 1);
    let faltan = 0;
    for (const c of clientes ?? []) {
      if ((conteo.get(c.id) ?? 0) >= 3) continue; faltan++;
      enviados += await enviar(porUsuario(c.user_id), { titulo: 'Mañana es tu check-in 📸', cuerpo: 'Sube tus 3 fotos (frente, lateral y espalda) en tu portal.', url: SITIO + 'cliente.html', tag: 'checkin' });
    }
    if (faltan) enviados += await enviar(coaches, { titulo: 'Check-in de mañana', cuerpo: `${faltan} cliente${faltan === 1 ? '' : 's'} aún no sube${faltan === 1 ? '' : 'n'} sus fotos. Avísales desde el Resumen.`, url: SITIO + 'panel.html', tag: 'checkin-coach' });
  } else if (tipo === 'prueba') {
    enviados += await enviar(coaches, { titulo: 'Prueba de notificaciones ✅', cuerpo: 'Si ves esto, las notificaciones funcionan.', url: SITIO + 'panel.html', tag: 'prueba' });
  } else return new Response('tipo inválido', { status: 400 });

  return new Response(JSON.stringify({ tipo, enviados }), { headers: { 'content-type': 'application/json' } });
});
