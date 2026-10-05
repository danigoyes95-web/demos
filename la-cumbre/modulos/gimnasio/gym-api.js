/* gym-api.js · puente entre las páginas y la base. Mismo código para la demo y para producción.
   modo "demo": todo corre en el navegador (gym-mock.js, datos inventados, se guarda en localStorage).
   modo "supabase": llama a las funciones SQL de modulos/gimnasio/supabase/migrations por la API REST de Supabase (sin librerías).
     La socia llama con la clave anon y su token de sesión como parámetro; el personal inicia sesión con correo y clave
     (Authentication) y llama con su JWT. Las fotos suben a Storage con el header x-socia-token (006_storage.sql).
   Configuración en config.js:  DEMO.gym = { modo: 'supabase', url: 'https://xxxx.supabase.co', anonKey: '…', schema: 'monster_gym' }
   Nunca va la clave service_role aquí (CLAUDE.md §4.11): solo la anon, que es pública por diseño. */
(() => {
  const D = window.DEMO || {}, G = D.gym || {};
  const modo = G.modo === 'supabase' ? 'supabase' : 'demo';
  const K = (D.claveDemo || 'gym') + '_';
  const ls = { get: k => { try { return localStorage.getItem(K + k); } catch (e) { return null; } }, set: (k, v) => { try { v === null ? localStorage.removeItem(K + k) : localStorage.setItem(K + k, v); } catch (e) {} } };
  const jwt = () => ls.get('staff_jwt');

  async function http(url, opts) {
    let r;
    try { r = await fetch(url, opts); } catch (e) { throw new Error('Sin conexión. Revisa tu internet e intenta de nuevo.'); }
    const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
    if (!r.ok) throw new Error((j && (j.message || j.msg || j.error_description)) || 'No se pudo completar la acción.');
    return j;
  }
  const cab = extra => Object.assign({ apikey: G.anonKey, Authorization: 'Bearer ' + (jwt() || G.anonKey), 'Content-Type': 'application/json', 'Content-Profile': G.schema, 'Accept-Profile': G.schema }, extra || {});

  const rpc = (fn, args) => modo === 'demo' ? window.GYM_MOCK.rpc(fn, args)
    : http(`${G.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: cab(), body: JSON.stringify(args || {}) });

  /* Sesión de la socia: guarda el token que devuelve acceder() (nunca el del QR). */
  const socia = {
    token: () => ls.get('token'),
    async entrar(codigo, ultimos4) {
      const r = await rpc('acceder', { p_codigo: codigo, p_ultimos4: ultimos4 });
      if (!r || !r.ok) throw new Error((r && r.mensaje) || 'No pudimos abrir tu tarjeta.');
      ls.set('token', String(r.token)); return r.token;
    },
    salir: () => ls.set('token', null),
  };

  /* Sesión del personal. Demo: se elige un rol. Producción: correo y clave de Supabase Authentication. */
  const staff = {
    async sesion() { if (modo === 'demo') return window.GYM_MOCK.staff(); if (!jwt()) return null; try { return await rpc('yo'); } catch (e) { ls.set('staff_jwt', null); return null; } },
    async entrar(a, b) {
      if (modo === 'demo') return window.GYM_MOCK.entrarStaff(a);
      const j = await http(`${G.url}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: G.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: a, password: b }) }).catch(e => { throw new Error('Correo o clave incorrectos.'); });
      ls.set('staff_jwt', j.access_token); const yo = await rpc('yo'); if (!yo) { ls.set('staff_jwt', null); throw new Error('Esa cuenta no es del equipo.'); } return yo;
    },
    salir() { if (modo === 'demo') window.GYM_MOCK.salirStaff(); ls.set('staff_jwt', null); },
  };

  /* Fotos. Demo: se reduce la imagen y queda como data URL. Producción: sube a Storage y devuelve la ruta <carpeta>/<tipo>/<archivo>. */
  function reducir(file, lado = 720) {
    return new Promise((ok, no) => {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return no(new Error('Sube una foto JPG, PNG o WebP.'));
      const img = new Image(), u = URL.createObjectURL(file);
      img.onload = () => { const e = Math.min(1, lado / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * e); c.height = Math.round(img.height * e);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob(b => b ? ok(b) : no(new Error('No se pudo leer la foto.')), 'image/jpeg', .82); };
      img.onerror = () => no(new Error('No se pudo leer la foto.')); img.src = u;
    });
  }
  const aDataUrl = b => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); });
  async function subirFoto(file, tipo, carpeta) {      // tipo: perfil | progreso | reto
    const blob = await reducir(file);
    if (blob.size > 3 * 1024 * 1024) throw new Error('La foto pesa más de 3 MB.');
    if (modo === 'demo') return aDataUrl(blob);
    const bucket = tipo === 'reto' ? G.schema + '-retos' : G.schema + '-socias', ruta = `${carpeta}/${tipo}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.jpg`;
    await http(`${G.url}/storage/v1/object/${bucket}/${ruta}`, { method: 'POST', headers: { apikey: G.anonKey, Authorization: 'Bearer ' + (jwt() || G.anonKey), 'Content-Type': 'image/jpeg', 'x-socia-token': socia.token() || '' }, body: blob });
    return ruta;
  }
  const cache = {};
  async function urlFoto(path, tipo) {                 // devuelve algo que se pueda poner en <img src>
    if (!path || /^(data:|https?:)/.test(path) || modo === 'demo') return path || '';
    const bucket = tipo === 'reto' ? G.schema + '-retos' : G.schema + '-socias';
    if (tipo === 'reto') return `${G.url}/storage/v1/object/public/${bucket}/${path}`;
    if (cache[path] && cache[path].t > Date.now()) return cache[path].u;
    const j = await http(`${G.url}/storage/v1/object/sign/${bucket}/${path}`, { method: 'POST', headers: { apikey: G.anonKey, Authorization: 'Bearer ' + (jwt() || G.anonKey), 'Content-Type': 'application/json', 'x-socia-token': socia.token() || '' }, body: JSON.stringify({ expiresIn: 600 }) });
    const u = `${G.url}/storage/v1${j.signedURL}`; cache[path] = { u, t: Date.now() + 540000 }; return u;
  }

  /* Plan que se está mostrando en la demo (Esencial / Pro): solo en modo demo, para enseñar qué cambia. */
  const plan = p => modo === 'demo' ? window.GYM_MOCK.plan(p) : 'pro';

  /* Mide cada clic a WhatsApp como conversión si la página ya tiene analítica (gtag o plausible). */
  const evento = (n, d) => { try { if (window.gtag) window.gtag('event', n, d || {}); if (window.plausible) window.plausible(n, { props: d || {} }); } catch (e) {} };
  const wa = texto => { const a = `https://wa.me/${String(D.waCliente || '').replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`; return a; };

  window.GYM = { modo, rpc, socia, staff, subirFoto, urlFoto, plan, evento, wa, ejemplo: () => modo === 'demo' ? window.GYM_MOCK.ejemplo() : null, reiniciar: () => modo === 'demo' && window.GYM_MOCK.reiniciar() };
})();
