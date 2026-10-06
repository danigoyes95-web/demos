/* gym-mock.js · backend de DEMOSTRACIÓN del módulo de gimnasio. Corre en el navegador y guarda todo en localStorage.
   Imita las funciones SQL de modulos/gimnasio/supabase/migrations (mismos nombres, mismos parámetros p_*, misma forma de respuesta y las mismas reglas:
   cupos y lista de espera, devolución de clases con 6 h de aviso, una asistencia por día, topes por actividad, retos aprobados por el personal, roles).
   En producción gym-api.js llama a Supabase con estas mismas funciones: las páginas no cambian.
   Los datos son inventados. El token de sesión de la socia (token) y el del QR (qr_token) son distintos, igual que en producción (§4.7). */
(() => {
  const TZ = 'America/Guayaquil', DIA = 864e5, HORA = 36e5;
  const D = window.DEMO || {}, CLAVE = (D.claveDemo || 'gym_demo') + '_v2';
  const fmtDia = t => new Date(t).toLocaleDateString('en-CA', { timeZone: TZ });                 // YYYY-MM-DD en Guayaquil
  const hoyEC = () => fmtDia(Date.now());
  const mkTs = (dia, hhmm) => { const [h, m] = hhmm.split(':').map(Number); const base = new Date(dia + 'T00:00:00-05:00').getTime(); return base + (h * 60 + m) * 60000; };
  const dow = dia => { const d = new Date(dia + 'T12:00:00-05:00').getUTCDay(); return d === 0 ? 7 : d; };    // 1 = lunes … 7 = domingo
  const sumaDias = (dia, n) => fmtDia(new Date(dia + 'T12:00:00-05:00').getTime() + n * DIA);
  const lunes = dia => sumaDias(dia, 1 - dow(dia));
  const fallo = m => { throw new Error(m); };
  const tel = p => { const d = String(p || '').replace(/\D/g, ''); return /^09\d{8}$/.test(d) ? '593' + d.slice(1) : /^593\d{9}$/.test(d) ? d : ''; };
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const tok = () => Array.from({ length: 24 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
  const clon = o => JSON.parse(JSON.stringify(o));

  /* ------------------------------------------------------------------ fotos de ejemplo (SVG, sin archivos) */
  const foto = (a, b, rotulo) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>` +
    `<rect width="400" height="400" fill="url(#g)"/><g fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="10" stroke-linecap="round"><path d="M110 250h180M140 215v70M260 215v70M115 235v30M285 235v30"/><circle cx="200" cy="150" r="34"/></g>` +
    `<text x="200" y="350" text-anchor="middle" font-family="Arial" font-size="22" fill="#fff" fill-opacity=".8">${rotulo}</text></svg>`);

  /* ------------------------------------------------------------------ datos iniciales */
  function semilla() {
    const hoy = hoyEC(), ahora = Date.now();
    const M = (window.GYMDATA && window.GYMDATA.mock) || {}, PRE = M.prefijo || 'GY';     // lo propio de cada cliente (sedes, niveles, merch, prefijo del código) llega en cliente.json → gimnasio.mock
    const S = { v: 2, id: 100, pre: PRE, plan: 'pro', staffSel: null,
      sedes: (M.sedes || ['Centro', 'Norte']).map((nombre, i) => ({ id: i + 1, nombre, activa: true })),
      tipos: M.tipos || [{ clave: 'fuerza', nombre: 'Fuerza', descripcion: 'Barra, mancuernas y técnica con progresión semanal.' },
        { clave: 'hiit', nombre: 'HIIT', descripcion: 'Intervalos de alta intensidad: quemas más en menos tiempo.' },
        { clave: 'spinning', nombre: 'Spinning', descripcion: 'Ciclismo indoor con música y ritmo de pelotón.' },
        { clave: 'funcional', nombre: 'Funcional', descripcion: 'Movimientos completos para moverte mejor todos los días.' },
        { clave: 'boxeo', nombre: 'Boxeo fit', descripcion: 'Golpeo, cardio y coordinación sin contacto.' },
        { clave: 'movilidad', nombre: 'Movilidad', descripcion: 'Flexibilidad y recuperación para entrenar sin lesiones.' }],
      planes: M.planes ? M.planes.map((p, i) => Object.assign({ id: i + 1 }, p)) : [{ id: 1, nombre: 'Fit 8', descripcion: '8 clases al mes', clases_mes: 8 }, { id: 2, nombre: 'Full', descripcion: 'Clases ilimitadas', clases_mes: null }, { id: 3, nombre: 'Élite', descripcion: 'Ilimitado + plan personalizado', clases_mes: null }],
      niveles: M.niveles || [{ nombre: 'Inicio', desde: 0, desc_eventos: 0, desc_merch: 0, prioridad_merch: false, beneficios: 'Sumas estrellas desde tu primera clase.' },
        { nombre: 'Constante', desde: 30, desc_eventos: 10, desc_merch: 10, prioridad_merch: false, beneficios: '10% en eventos pagos y 10% en merch.' },
        { nombre: 'Élite', desde: 100, desc_eventos: 20, desc_merch: 15, prioridad_merch: true, beneficios: '20% en eventos pagos, 15% en merch y prioridad en lanzamientos de merch.' }],
      actividades: [
        { clave: 'clase', nombre: 'Clase', estrellas: 1, por_monto: null, tope_dia: 1, roles: ['admin', 'recepcion', 'coach'], en_panel: true },
        { clave: 'evento', nombre: 'Evento / aire libre', estrellas: 3, por_monto: null, tope_dia: 1, roles: ['admin', 'recepcion'], en_panel: true },
        { clave: 'amiga', nombre: 'Trajo un amigo', estrellas: 5, por_monto: null, tope_dia: 2, roles: ['admin', 'recepcion'], en_panel: true },
        { clave: 'merch', nombre: 'Compra de merch', estrellas: 1, por_monto: 5, tope_dia: null, roles: ['admin', 'recepcion'], en_panel: true },
        { clave: 'renueva', nombre: 'Renovó a tiempo', estrellas: 3, por_monto: null, tope_dia: 1, roles: ['admin', 'recepcion'], en_panel: true },
        { clave: 'reto', nombre: 'Reto aprobado', estrellas: 1, por_monto: null, tope_dia: 1, roles: ['admin', 'recepcion', 'coach'], en_panel: false },
        { clave: 'rutina', nombre: 'Rutina semanal cumplida', estrellas: 2, por_monto: null, tope_dia: null, roles: ['admin', 'coach'], en_panel: false }],
      cfg: { reserva_dias: 7, cancelar_horas: 6, max_reservas_activas: 5, max_mensajes_hora: 20, max_fotos_dia: 5, max_sumas_hora_personal: 80 },
      staff: [{ user_id: 'u-admin', nombre: 'Ana', rol: 'admin', email: 'ana@' + (M.dominio || 'ejemplo.ec') }, { user_id: 'u-recep', nombre: 'Rosa', rol: 'recepcion', email: 'rosa@' + (M.dominio || 'ejemplo.ec') }, { user_id: 'u-coach', nombre: 'Caro', rol: 'coach', email: 'caro@' + (M.dominio || 'ejemplo.ec') }],
      socias: [], clases: [], reservas: [], movimientos: [], notas: [], fotos: [], plantillas: [], rutinas: [], mensajes: [],
      retos: [{ id: 1, titulo: 'Reto 7 días de constancia', descripcion: 'Una foto al día de tu entrenamiento durante una semana.', estrellas: 2, inicio: sumaDias(hoy, -2), fin: sumaDias(hoy, 5) }],
      reto_envios: [],
      merch: M.merch ? M.merch.map((m, i) => Object.assign({ id: i + 1, descripcion: null, tallas: null, solo_nivel: null, activo: true }, m)) : [{ id: 1, nombre: 'Camiseta', descripcion: 'Algodón peinado, corte atlético.', precio: 18, tallas: 'S · M · L · XL', solo_nivel: null, activo: true },
        { id: 2, nombre: 'Gorra', descripcion: 'Visera curva con bordado en relieve.', precio: 12, tallas: 'Única', solo_nivel: null, activo: true },
        { id: 3, nombre: 'Botella 1 L', descripcion: 'Acero inoxidable, mantiene el frío 12 horas.', precio: 16, tallas: null, solo_nivel: null, activo: true },
        { id: 4, nombre: 'Straps de levantamiento', descripcion: 'Preventa de la colección de otoño.', precio: 14, tallas: null, solo_nivel: 'Élite', activo: true }],
      horario: [] };
    S.plantillas = M.plantillas ? M.plantillas.map((p, i) => Object.assign({ id: i + 1, activa: true }, p)) : [{ id: 1, nombre: 'Fuerza en casa · Básico', descripcion: 'Dos bloques para días sin clase', activa: true, bloques: [{ nombre: 'Rutina A', texto: 'Sentadilla 4×12 · Flexiones 3×10 · Plancha 3×40 s' }, { nombre: 'Rutina B', texto: 'Peso muerto con mancuernas 4×10 · Remo 3×12 · Puente de glúteo 3×15' }] },
      { id: 2, nombre: 'Cardio express', descripcion: '20 minutos', activa: true, bloques: [{ nombre: 'Circuito', texto: '40 s trabajo / 20 s descanso × 6 rondas: burpees, saltos, escaladores' }] }];
    // horario base: lunes a viernes 6 franjas por sede; sábado 3
    const coaches = M.coaches || ['Coach Andrés', 'Coach Paola', 'Coach Mateo', 'Coach Dani'];
    const rot = S.tipos.map(t => t.clave), H = M.horas || {};            // los tipos de clase del cliente rotan en el horario; M.horas (semana, sabado, domingo) cambia las franjas
    let hid = 1;
    for (const sede of S.sedes.map(x => x.id)) for (let d = 1; d <= 7; d++) {
      const horas = d === 7 ? (H.domingo || ['09:00', '10:00']) : d === 6 ? (H.sabado || ['08:00', '09:00', '10:00']) : (H.semana || ['06:00', '07:00', '08:00', '17:00', '18:00', '19:00']);
      horas.forEach((h, i) => S.horario.push({ id: hid++, dia_semana: d, hora: h, tipo: rot[(d + i + sede) % rot.length], sede_id: sede, coach: coaches[(d + i + sede) % 4], cupos: sede === 1 ? 12 : 10 }));
    }
    const mk = (nombre, telefono, plan, extra) => S.socias.push(Object.assign({ id: S.socias.length + 1, token: tok(), qr_token: tok().slice(0, 16), carpeta: tok(), codigo: '', nombre, telefono, plan_id: plan, clases_restantes: plan === 1 ? 5 : null,
      plan_vence: sumaDias(hoy, 12 + S.socias.length * 7), sede_id: 1, horario_fijo: null, objetivo: null, lesiones: null, nacimiento: null, foto_perfil: null, creado: ahora - 70 * DIA }, extra || {}));
    mk('Valentina Ruiz', '593991234567', 2, { codigo: PRE + '-7K3Q9V', objetivo: 'Ganar fuerza, Tonificar', nacimiento: '1994-03-18', plan_vence: sumaDias(hoy, 5), horario_fijo: 'Lun-Mié-Vie 18:00' });
    mk('Camila Torres', '593987654321', 1, { codigo: PRE + '-4HJ2PM', objetivo: 'Bajar de peso', clases_restantes: 3, sede_id: 2 });
    mk('Sofía León', '593970001111', 2, { codigo: PRE + '-9QW3EA', plan_vence: sumaDias(hoy, -3), sede_id: 2 });
    mk('Daniela Vega', '593960002222', 3, { codigo: PRE + '-2MX7KB', objetivo: 'Resistencia', lesiones: 'Rodilla izquierda · sin saltos', plan_vence: sumaDias(hoy, 40) });
    mk('Mateo Andrade', '593950003333', 1, { codigo: PRE + '-6RT8NC', clases_restantes: 8, creado: ahora - 2 * DIA });
    mk('Andrés Paredes', '593940004444', 2, { codigo: PRE + '-3LP5ZD', objetivo: 'Rendimiento' });
    ['Paula Mena', 'Carlos Yépez', 'Lucía Naranjo', 'Jorge Salazar', 'Mónica Cevallos', 'Diego Ortiz', 'Karen Villacís', 'Esteban Rea', 'Nicole Arias', 'Santiago Mora'].forEach((n, i) =>
      mk(n, '5939' + String(20000000 + i * 1111111), i % 3 === 0 ? 1 : 2, { codigo: PRE + '-' + (100000 + i * 7919).toString(36).toUpperCase().padStart(6, 'X'), sede_id: i % 2 ? 2 : 1, plan_vence: sumaDias(hoy, 4 + i * 5), clases_restantes: i % 3 === 0 ? 2 + i : null }));
    // clases: 14 días atrás … 8 adelante, a partir del horario base
    for (let off = -14; off <= 8; off++) {
      const dia = sumaDias(hoy, off);
      S.horario.filter(h => h.dia_semana === dow(dia)).forEach(h => S.clases.push({ id: S.id++, tipo: h.tipo, sede_id: h.sede_id, coach: h.coach, inicio: mkTs(dia, h.hora), duracion_min: 60, cupos: h.cupos, cancelada: false }));
    }
    // reservas e historial de asistencia
    const asistir = (s, c, estado) => S.reservas.push({ id: S.id++, clase_id: c.id, socia_id: s.id, estado, creado: c.inicio - 2 * DIA });
    const futuras = S.clases.filter(c => c.inicio > ahora), pasadas = S.clases.filter(c => c.inicio < ahora - HORA);
    const movs = (s, c) => S.movimientos.push({ id: S.id++, socia_id: s.id, actividad: 'clase', titulo: 'Clase', estrellas: 1, monto: null, staff_id: 'u-coach', anulado: false, creado: c.inicio + 5 * 60000 });
    S.socias.forEach((s, i) => {
      const veces = [26, 14, 4, 40, 1, 9][i] ?? 8 + (i % 5) * 2;
      let n = 0;
      for (const c of pasadas.filter(c => c.sede_id === s.sede_id).filter((_, k) => (k + i) % 2 === 0)) {
        if (n >= veces) break;
        if (rnd() < .85) { asistir(s, c, 'asistio'); movs(s, c); n++; } else asistir(s, c, 'falta');
      }
    });
    const bono = (s, act, titulo, est, monto, dias) => S.movimientos.push({ id: S.id++, socia_id: s.id, actividad: act, titulo, estrellas: est, monto: monto || null, staff_id: 'u-recep', anulado: false, creado: ahora - dias * DIA });
    bono(S.socias[0], 'evento', 'Evento / aire libre', 3, null, 12); bono(S.socias[0], 'amiga', 'Trajo un amigo', 5, null, 20); bono(S.socias[0], 'merch', 'Compra de merch', 4, 20, 25); bono(S.socias[0], 'renueva', 'Renovó a tiempo', 3, null, 33);
    bono(S.socias[3], 'evento', 'Evento / aire libre', 3, null, 9); bono(S.socias[3], 'amiga', 'Trajo un amigo', 5, null, 18); bono(S.socias[3], 'merch', 'Compra de merch', 12, 60, 30);
    // ocupación realista: clases pasadas y próximas con varias socias (sin tocar sus estrellas), y una completa para la lista de espera
    const otras = S.socias.slice(1), llenar = (c, k, estado) => { const ya = new Set(S.reservas.filter(r => r.clase_id === c.id).map(r => r.socia_id)); otras.filter(s => !ya.has(s.id)).sort(() => rnd() - .5).slice(0, k).forEach(s => asistir(s, c, estado)); };
    pasadas.forEach(c => llenar(c, Math.round(c.cupos * (.45 + rnd() * .5)) - S.reservas.filter(r => r.clase_id === c.id).length, 'asistio'));
    futuras.filter(c => c.inicio < ahora + 4 * DIA).forEach(c => llenar(c, Math.round(c.cupos * (.35 + rnd() * .55)), 'confirmada'));
    const llena = futuras.find(c => c.inicio > ahora + 5 * HORA && c.sede_id === 1);
    if (llena) { S.reservas = S.reservas.filter(r => r.clase_id !== llena.id); llena.cupos = 8; llenar(llena, 8, 'confirmada'); S.reservas.filter(r => r.clase_id === llena.id).forEach(r => r.socia_id === 1 && (r.estado = 'cancelada')); }
    const prox = futuras.filter(c => c.sede_id === 1 && c.id !== llena?.id && c.inicio > ahora + 20 * HORA).slice(0, 2);
    prox.forEach(c => asistir(S.socias[0], c, 'confirmada'));
    // nota de coach, rutina de la semana y mensajes
    S.notas.push({ id: S.id++, socia_id: 1, staff_id: 'u-coach', texto: 'Muy buena técnica en sentadilla. Subir carga el próximo mes.', creado: ahora - 6 * DIA },
      { id: S.id++, socia_id: 4, staff_id: null, texto: 'La socia actualizó sus patologías / lesiones desde su app: Rodilla izquierda · sin saltos', creado: ahora - 3 * DIA });
    S.rutinas.push({ id: 1, socia_id: 1, semana: lunes(hoy), plantilla_id: 1, titulo: S.plantillas[0].nombre, bloques: S.plantillas[0].bloques, nota: S.plantillas[0].nota || 'Haz A y B dos veces en la semana, en días sin clase.', estado: 'asignada', coach_nombre: 'Caro', movimiento_id: null });
    S.mensajes.push({ id: 1, rutina_id: 1, autor: 'coach', autor_nombre: 'Caro', texto: 'Cualquier duda con los ejercicios me escribes por aquí.', creado: ahora - 2 * DIA },
      { id: 2, rutina_id: 1, autor: 'socia', autor_nombre: 'Valentina', texto: '¡Gracias! Hoy hice la A.', creado: ahora - 1 * DIA });
    // retos: 3 aprobados y públicos, 2 pendientes de revisión
    const ev = (sid, a, b, rot, estado, publico, dias) => S.reto_envios.push({ id: S.id++, reto_id: 1, socia_id: sid, foto_path: foto(a, b, rot), dia: sumaDias(hoy, -dias), estado, publico, movimiento_id: null, creado: ahora - dias * DIA });
    const CO = M.colores || [['#0b0b0c', '#5b6b00'], ['#1b1b22', '#c8ff00'], ['#2a1b00', '#d98a00']];   // colores de las fotos de ejemplo (M.colores: tres pares de la marca)
    ev(2, CO[0][0], CO[0][1], 'Reto 7 días', 'aprobado', true, 1); ev(4, CO[1][0], CO[1][1], 'Reto 7 días', 'aprobado', true, 1); ev(6, CO[2][0], CO[2][1], 'Reto 7 días', 'aprobado', true, 2);
    ev(3, '#14202e', '#2d6a9f', 'Reto 7 días', 'pendiente', false, 0); ev(5, '#2a0b1c', '#9f2d63', 'Reto 7 días', 'pendiente', false, 0);
    S.fotos.push({ id: S.id++, socia_id: 1, path: foto('#0b0b0c', '#3a3a40', 'Semana 1'), nota: 'Punto de partida', subida_por: null, creado: ahora - 30 * DIA }, { id: S.id++, socia_id: 1, path: foto('#0b0b0c', '#5b6b00', 'Semana 6'), nota: null, subida_por: null, creado: ahora - 2 * DIA });
    return S;
  }

  /* ------------------------------------------------------------------ estado */
  let S;
  const cargar = () => { try { const t = JSON.parse(localStorage.getItem(CLAVE)); if (t && t.v === 2) return t; } catch (e) {} return semilla(); };
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(S)); } catch (e) {} };
  const reponerClases = () => {   // como generar_clases: mantiene 8 días por delante
    const hoy = hoyEC();
    for (let off = 0; off <= 8; off++) {
      const dia = sumaDias(hoy, off);
      S.horario.filter(h => h.dia_semana === dow(dia)).forEach(h => {
        const ini = mkTs(dia, h.hora);
        if (!S.clases.some(c => c.inicio === ini && c.tipo === h.tipo && c.sede_id === h.sede_id)) S.clases.push({ id: S.id++, tipo: h.tipo, sede_id: h.sede_id, coach: h.coach, inicio: ini, duracion_min: 60, cupos: h.cupos, cancelada: false });
      });
    }
  };
  S = cargar(); reponerClases(); guardar();

  /* ------------------------------------------------------------------ ayudas (las internas de 002/003) */
  const total = id => S.movimientos.filter(m => m.socia_id === id).reduce((a, m) => a + m.estrellas, 0);
  const nivel = t => ({ actual: clon([...S.niveles].reverse().find(n => n.desde <= t)), siguiente: clon(S.niveles.find(n => n.desde > t) || null) });
  const nombrePlan = id => (S.planes.find(p => p.id === id) || {}).nombre || null;
  const nombreSede = id => (S.sedes.find(s => s.id === id) || {}).nombre || null;
  const nombreTipo = c => (S.tipos.find(t => t.clave === c) || {}).nombre || c;
  const ocupados = c => S.reservas.filter(r => r.clase_id === c.id && ['confirmada', 'asistio', 'falta'].includes(r.estado)).length;
  const espera = c => S.reservas.filter(r => r.clase_id === c.id && r.estado === 'espera').length;
  const porToken = t => S.socias.find(s => s.token === t) || null;
  const porRef = r => { const q = String(r || '').trim().replace(/^.*[?&]t=/, ''); return S.socias.find(s => s.qr_token === q || s.codigo.toUpperCase() === q.toUpperCase()) || null; };
  const sesionStaff = () => S.staffSel ? S.staff.find(u => u.user_id === S.staffSel) : null;
  const rol = () => (sesionStaff() || {}).rol || null;
  const esStaff = () => !!rol();
  const esCA = () => ['coach', 'admin'].includes(rol());
  const nombreStaff = id => id ? (S.staff.find(u => u.user_id === id) || {}).nombre || null : null;
  const reqSocia = t => porToken(t) || fallo('No encontramos tu tarjeta.');
  const reqStaff = () => esStaff() || fallo('No autorizado');
  const reqCA = () => esCA() || fallo('Solo coaches o admin.');
  const reqRef = r => porRef(r) || fallo('No encontramos esa tarjeta.');

  const jsonSocia = (s, privado) => ({
    nombre: s.nombre, codigo: s.codigo, qr: privado ? undefined : s.qr_token, ref: privado ? s.qr_token : undefined, telefono: privado ? s.telefono : undefined,
    plan: nombrePlan(s.plan_id), plan_vence: s.plan_vence, clases_restantes: s.clases_restantes,
    estrellas: total(s.id), nivel: nivel(total(s.id)), niveles: clon(S.niveles),
    actividades: S.actividades.filter(a => a.en_panel || !privado).map(a => ({ clave: a.clave, nombre: a.nombre, estrellas: a.estrellas, por_monto: a.por_monto, roles: a.roles })),
    clase_hoy: S.movimientos.some(m => m.socia_id === s.id && m.actividad === 'clase' && !m.anulado && fmtDia(m.creado) === hoyEC()),
    movimientos: S.movimientos.filter(m => m.socia_id === s.id).sort((a, b) => b.creado - a.creado).slice(0, 60).map(m => ({ id: m.id, actividad: m.actividad, titulo: m.titulo, estrellas: m.estrellas, monto: m.monto, creado: new Date(m.creado).toISOString(), anulado: m.anulado,
      staff: privado ? nombreStaff(m.staff_id) : undefined, propio_reciente: privado && m.staff_id === S.staffSel && Date.now() - m.creado < 30 * 60000 && !m.anulado && m.actividad !== 'anulacion' })) });
  const jsonMiCore = (s, privado) => {
    const rs = S.reservas.filter(r => r.socia_id === s.id && ['asistio', 'falta'].includes(r.estado)).filter(r => { const c = S.clases.find(x => x.id === r.clase_id); return c && c.inicio < Date.now() && c.inicio > Date.now() - 90 * DIA; });
    const a = rs.filter(r => r.estado === 'asistio').length, f = rs.filter(r => r.estado === 'falta').length;
    return { nombre: s.nombre, foto_perfil: s.foto_perfil, nacimiento: s.nacimiento, sede: nombreSede(s.sede_id), sede_id: s.sede_id, objetivo: s.objetivo, lesiones: s.lesiones, plan: nombrePlan(s.plan_id), plan_id: s.plan_id,
      plan_vence: s.plan_vence, clases_restantes: s.clases_restantes, horario_fijo: s.horario_fijo, asistidas_90: a, faltas_90: f, pct_asistencia: a + f > 0 ? Math.round(100 * a / (a + f)) : null,
      carpeta: privado ? undefined : s.carpeta, carpeta_archivos: privado ? s.carpeta : undefined,
      fotos: S.fotos.filter(x => x.socia_id === s.id).sort((x, y) => y.creado - x.creado).map(x => ({ id: x.id, path: x.path, nota: x.nota, creado: new Date(x.creado).toISOString() })) };
  };
  const jsonRutinas = sid => S.rutinas.filter(r => r.socia_id === sid).sort((a, b) => b.semana.localeCompare(a.semana)).slice(0, 12).map(r => ({ id: r.id, semana: r.semana, titulo: r.titulo, bloques: r.bloques, nota: r.nota, estado: r.estado, coach: r.coach_nombre, plantilla_id: r.plantilla_id,
    mensajes: S.mensajes.filter(m => m.rutina_id === r.id).sort((a, b) => a.creado - b.creado).map(m => ({ id: m.id, autor: m.autor, nombre: m.autor_nombre, texto: m.texto, creado: new Date(m.creado).toISOString() })) }));

  /* mov(): reglas de _mov() de 003 — rol, tope por día, tope por hora del personal, monto mínimo, actividades del sistema */
  const mov = (s, clave, monto, manual, estrellas) => {
    const a = S.actividades.find(x => x.clave === clave) || fallo('Actividad no válida.');
    if (manual) {
      if (!a.en_panel) fallo('Esa actividad la registra el sistema.');
      if (!a.roles.includes(rol())) fallo('Tu rol no puede registrar esta actividad.');
      if (S.movimientos.filter(m => m.staff_id === S.staffSel && m.actividad !== 'anulacion' && m.creado > Date.now() - HORA).length >= S.cfg.max_sumas_hora_personal) fallo('Registraste demasiadas actividades en la última hora. Avisa al administrador.');
    }
    let n;
    if (a.por_monto) { if (!(monto > 0 && monto <= 5000)) fallo('Escribe el monto de la compra.'); n = Math.floor(monto / a.por_monto) * a.estrellas; if (n < 1) fallo('La compra debe ser de al menos $' + a.por_monto + '.'); }
    else n = !manual && estrellas ? estrellas : a.estrellas;
    if (a.tope_dia && S.movimientos.filter(m => m.socia_id === s.id && m.actividad === a.clave && !m.anulado && fmtDia(m.creado) === hoyEC()).length >= a.tope_dia) fallo(a.clave === 'clase' ? 'Ya marcó asistencia hoy.' : 'Esa actividad ya se registró hoy.');
    const m = { id: S.id++, socia_id: s.id, actividad: a.clave, titulo: a.nombre, estrellas: n, monto: a.por_monto ? monto : null, staff_id: S.staffSel, anulado: false, creado: Date.now() };
    S.movimientos.push(m); return m;
  };

  /* ------------------------------------------------------------------ funciones que llama la socia (002) */
  const F = {
    ping: () => true,
    catalogo: () => ({ sedes: S.sedes.filter(s => s.activa), tipos: clon(S.tipos), planes: clon(S.planes), niveles: clon(S.niveles),
      actividades: S.actividades.map(a => ({ clave: a.clave, nombre: a.nombre, estrellas: a.estrellas, por_monto: a.por_monto })), merch: clon(S.merch.filter(m => m.activo)),
      retos: S.retos.filter(r => hoyEC() >= r.inicio && hoyEC() <= r.fin).map(r => ({ id: r.id, titulo: r.titulo, descripcion: r.descripcion, estrellas: r.estrellas, fin: r.fin })) }),
    agenda: ({ p_token } = {}) => { const s = porToken(p_token); const lim = Date.now() + S.cfg.reserva_dias * DIA;
      return { clases: S.clases.filter(c => !c.cancelada && c.inicio > Date.now() - 2 * HORA && c.inicio < lim).sort((a, b) => a.inicio - b.inicio || a.sede_id - b.sede_id).map(c => { const r = s && S.reservas.find(x => x.clase_id === c.id && x.socia_id === s.id && ['confirmada', 'espera', 'asistio'].includes(x.estado));
        return { id: c.id, tipo: c.tipo, tipo_nombre: nombreTipo(c.tipo), coach: c.coach, inicio: new Date(c.inicio).toISOString(), duracion_min: c.duracion_min, cupos: c.cupos, ocupados: ocupados(c), en_espera: espera(c), sede_id: c.sede_id, mi_reserva: r ? { id: r.id, estado: r.estado } : null }; }) }; },
    acceder: ({ p_codigo, p_ultimos4 }) => { const s = S.socias.find(x => x.codigo.toUpperCase() === String(p_codigo || '').trim().toUpperCase() && x.telefono.slice(-4) === String(p_ultimos4 || '').replace(/\D/g, ''));
      S.intentos = S.intentos || {}; const k = String(p_codigo || '').trim().toUpperCase(), i = S.intentos[k] || { n: 0, hasta: 0 };
      if (i.hasta > Date.now()) return { ok: false, bloqueado: true, mensaje: 'Demasiados intentos. Prueba de nuevo en un rato o escríbenos por WhatsApp.' };
      if (s) { delete S.intentos[k]; return { ok: true, token: s.token }; }
      i.n++; if (i.n >= 5) { i.hasta = Date.now() + 30 * 60000; i.n = 0; } S.intentos[k] = i;
      return { ok: false, mensaje: 'Código o últimos 4 dígitos incorrectos.' }; },
    tarjeta: ({ p_token }) => jsonSocia(reqSocia(p_token), false),
    reservar: ({ p_token, p_clase }) => {
      const s = reqSocia(p_token), c = S.clases.find(x => x.id === p_clase && !x.cancelada) || fallo('Clase no disponible.');
      if (c.inicio < Date.now()) fallo('La clase ya empezó.');
      if (c.inicio > Date.now() + S.cfg.reserva_dias * DIA) fallo(`Puedes reservar con hasta ${S.cfg.reserva_dias} días de anticipación.`);
      if (s.plan_vence && s.plan_vence < hoyEC()) fallo('Tu plan está vencido. Renuévalo para reservar.');
      const activas = S.reservas.filter(r => r.socia_id === s.id && ['confirmada', 'espera'].includes(r.estado)).map(r => S.clases.find(x => x.id === r.clase_id)).filter(x => x && !x.cancelada && x.inicio > Date.now());
      if (activas.some(x => x.inicio === c.inicio && x.id !== c.id)) fallo('Ya tienes otra clase a esa hora.');
      if (activas.length >= S.cfg.max_reservas_activas) fallo(`Ya tienes ${S.cfg.max_reservas_activas} reservas por atender. Cancela una para reservar otra.`);
      const est = ocupados(c) < c.cupos ? 'confirmada' : 'espera';
      if (est === 'confirmada' && s.clases_restantes !== null && s.clases_restantes <= 0) fallo('No te quedan clases en tu plan.');
      const ex = S.reservas.find(r => r.clase_id === c.id && r.socia_id === s.id);
      if (ex && ex.estado !== 'cancelada') fallo('Ya tienes esta clase reservada.');
      if (ex) { ex.estado = est; ex.creado = Date.now(); } else S.reservas.push({ id: S.id++, clase_id: c.id, socia_id: s.id, estado: est, creado: Date.now() });
      if (est === 'confirmada' && s.clases_restantes !== null) s.clases_restantes--;
      return est; },
    cancelar: ({ p_token, p_reserva }) => {
      const s = reqSocia(p_token), r = S.reservas.find(x => x.id === p_reserva && x.socia_id === s.id) || fallo('Reserva no encontrada.');
      if (!['confirmada', 'espera'].includes(r.estado)) fallo('Esta reserva ya no se puede cancelar.');
      const c = S.clases.find(x => x.id === r.clase_id); if (c.inicio < Date.now()) fallo('La clase ya empezó.');
      const era = r.estado; r.estado = 'cancelada';
      if (era === 'confirmada') {
        if (c.inicio - Date.now() >= S.cfg.cancelar_horas * HORA && s.clases_restantes !== null) s.clases_restantes++;
        const sig = S.reservas.filter(x => x.clase_id === c.id && x.estado === 'espera').sort((a, b) => a.creado - b.creado).find(x => { const q = S.socias.find(y => y.id === x.socia_id); return q.clases_restantes === null || q.clases_restantes > 0; });
        if (sig) { sig.estado = 'confirmada'; const q = S.socias.find(y => y.id === sig.socia_id); if (q.clases_restantes !== null) q.clases_restantes--; }
      } return null; },
    mi_core: ({ p_token }) => { const s = porToken(p_token); return s ? jsonMiCore(s, false) : null; },
    mi_core_guardar: ({ p_token, p_nacimiento, p_sede, p_objetivo, p_lesiones }) => {
      const s = reqSocia(p_token), nueva = String(p_lesiones || '').trim().slice(0, 500) || null;
      if (p_nacimiento && (p_nacimiento > hoyEC() || p_nacimiento < '1930-01-01')) fallo('Revisa tu fecha de nacimiento.');
      const antes = s.lesiones; Object.assign(s, { nacimiento: p_nacimiento || null, sede_id: p_sede || null, objetivo: String(p_objetivo || '').trim().slice(0, 200) || null, lesiones: nueva });
      if (nueva !== antes) S.notas.push({ id: S.id++, socia_id: s.id, staff_id: null, texto: 'La socia actualizó sus patologías / lesiones desde su app: ' + (nueva || '(las borró)'), creado: Date.now() });
      return jsonMiCore(s, false); },
    mis_rutinas: ({ p_token }) => { const s = porToken(p_token); return s ? jsonRutinas(s.id) : []; },
    rutina_comentar: ({ p_token, p_rutina, p_texto }) => {
      const s = reqSocia(p_token); if (!S.rutinas.some(r => r.id === p_rutina && r.socia_id === s.id)) fallo('Rutina no encontrada.');
      if (!String(p_texto || '').trim()) fallo('Escribe tu mensaje.');
      const rec = S.mensajes.filter(m => m.autor === 'socia' && m.creado > Date.now() - HORA && S.rutinas.find(r => r.id === m.rutina_id).socia_id === s.id).length;
      if (rec >= S.cfg.max_mensajes_hora) fallo('Enviaste muchos mensajes seguidos. Intenta en un rato.');
      S.mensajes.push({ id: S.id++, rutina_id: p_rutina, autor: 'socia', autor_nombre: s.nombre.split(' ')[0], texto: String(p_texto).trim().slice(0, 1000), creado: Date.now() });
      return jsonRutinas(s.id); },
    mi_foto: ({ p_token, p_tipo, p_path }) => {
      const s = reqSocia(p_token); if (!['perfil', 'progreso'].includes(p_tipo) || !p_path) fallo('Ruta no válida.');
      if (p_tipo === 'perfil') s.foto_perfil = p_path;
      else { if (S.fotos.filter(f => f.socia_id === s.id && f.creado > Date.now() - DIA).length >= S.cfg.max_fotos_dia) fallo('Hoy ya subiste varias fotos. Sigue mañana.'); S.fotos.push({ id: S.id++, socia_id: s.id, path: p_path, nota: null, subida_por: null, creado: Date.now() }); }
      return jsonMiCore(s, false); },
    mi_foto_borrar: ({ p_token, p_id }) => { const s = reqSocia(p_token), i = S.fotos.findIndex(f => f.id === p_id && f.socia_id === s.id); if (i < 0) fallo('Foto no encontrada.');
      const pth = S.fotos[i].path; S.fotos.splice(i, 1); return Object.assign(jsonMiCore(s, false), { borrada: pth }); },
    subir_reto: ({ p_token, p_path, p_reto }) => {
      const s = reqSocia(p_token); if (!p_path) fallo('Ruta de foto no válida.');
      if (p_reto && !S.retos.some(r => r.id === p_reto && hoyEC() >= r.inicio && hoyEC() <= r.fin)) fallo('Ese reto ya no está activo.');
      if (S.reto_envios.some(e => e.socia_id === s.id && e.dia === hoyEC())) fallo('Ya subiste tu foto de hoy. Vuelve mañana.');
      S.reto_envios.push({ id: S.id++, reto_id: p_reto || null, socia_id: s.id, foto_path: p_path, dia: hoyEC(), estado: 'pendiente', publico: false, movimiento_id: null, creado: Date.now() });
      return { ok: true, estado: 'pendiente' }; },
    galeria: () => S.reto_envios.filter(e => e.estado === 'aprobado' && e.publico).sort((a, b) => b.creado - a.creado).slice(0, 24).map(e => ({ path: e.foto_path, autor: S.socias.find(s => s.id === e.socia_id).nombre.split(' ')[0], dia: e.dia, reto: (S.retos.find(r => r.id === e.reto_id) || {}).titulo || null })),

    /* ---------------------------------------------------------------- funciones del personal (003) */
    yo: () => { const u = sesionStaff(); return u ? { nombre: u.nombre, rol: u.rol } : null; },
    buscar: ({ p_q }) => { reqStaff(); const q = String(p_q || '').trim().toLowerCase(), d = String(p_q || '').replace(/\D/g, '').replace(/^0+/, '');
      return S.socias.filter(s => (q.length >= 2 && s.nombre.toLowerCase().includes(q)) || (d.length >= 4 && s.telefono.includes(d)) || s.codigo.toLowerCase() === q).sort((a, b) => a.nombre.localeCompare(b.nombre)).slice(0, 20)
        .map(s => ({ ref: s.qr_token, codigo: s.codigo, nombre: s.nombre, telefono: s.telefono, estrellas: total(s.id) })); },
    ficha: ({ p_ref }) => { reqStaff(); return jsonSocia(reqRef(p_ref), true); },
    registrar: ({ p_nombre, p_telefono, p_plan }) => {
      if (!esStaff() || rol() === 'coach') fallo('No autorizado');
      const t = tel(p_telefono); if (String(p_nombre || '').trim().length < 2) fallo('Escribe el nombre.'); if (!t) fallo('Escribe un WhatsApp válido (09...).');
      const ex = S.socias.find(s => s.telefono === t); if (ex) return { existente: true, ficha: jsonSocia(ex, true) };
      const pl = p_plan ? S.planes.find(x => x.id === p_plan) || fallo('Plan no válido.') : null;
      const cod = (S.pre || 'GY') + '-' + Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
      const s = { id: S.socias.length + 1, token: tok(), qr_token: tok().slice(0, 16), carpeta: tok(), codigo: cod, nombre: p_nombre.trim().slice(0, 80), telefono: t, plan_id: pl ? pl.id : null, clases_restantes: pl ? pl.clases_mes : null,
        plan_vence: null, sede_id: null, horario_fijo: null, objetivo: null, lesiones: null, nacimiento: null, foto_perfil: null, creado: Date.now() };
      S.socias.push(s); return { existente: false, ficha: jsonSocia(s, true) }; },
    sumar: ({ p_ref, p_actividad, p_monto }) => {
      reqStaff(); const s = reqRef(p_ref), antes = total(s.id), nv = nivel(antes).actual.nombre, m = mov(s, p_actividad, p_monto, true);
      if (p_actividad === 'clase') { const r = S.reservas.filter(x => x.socia_id === s.id && x.estado === 'confirmada').map(x => ({ x, c: S.clases.find(c => c.id === x.clase_id) })).filter(o => fmtDia(o.c.inicio) === hoyEC()).sort((a, b) => Math.abs(a.c.inicio - Date.now()) - Math.abs(b.c.inicio - Date.now()))[0]; if (r) r.x.estado = 'asistio'; }
      return { sumadas: m.estrellas, antes, nivel_antes: nv, ficha: jsonSocia(s, true) }; },
    checkin_previo: ({ p_ref }) => {
      reqStaff(); const s = reqRef(p_ref), t = Date.now();
      const ahora = S.clases.filter(c => !c.cancelada && t >= c.inicio - 45 * 60000 && t <= c.inicio + Math.min(c.duracion_min, 90) * 60000).map(c => Object.assign({}, c, { mi: (S.reservas.find(r => r.clase_id === c.id && r.socia_id === s.id) || {}).estado }));
      const base = c => ({ id: c.id, tipo: c.tipo, coach: c.coach, inicio: new Date(c.inicio).toISOString(), sede_id: c.sede_id });
      const mia = ahora.filter(c => ['confirmada', 'asistio'].includes(c.mi)).sort((a, b) => Math.abs(a.inicio - t) - Math.abs(b.inicio - t))[0];
      return { ya_marco: S.movimientos.some(m => m.socia_id === s.id && m.actividad === 'clase' && !m.anulado && fmtDia(m.creado) === hoyEC()),
        mia: mia ? Object.assign(base(mia), { estado: mia.mi }) : null, actual: ahora.sort((a, b) => a.inicio - b.inicio).map(c => Object.assign(base(c), { cupos: c.cupos, ocupados: ocupados(c) })),
        otras: S.reservas.filter(r => r.socia_id === s.id && ['confirmada', 'espera'].includes(r.estado)).map(r => ({ r, c: S.clases.find(c => c.id === r.clase_id) })).filter(o => !o.c.cancelada && fmtDia(o.c.inicio) === hoyEC() && !ahora.some(a => a.id === o.c.id))
          .map(o => ({ tipo: o.c.tipo, inicio: new Date(o.c.inicio).toISOString(), sede_id: o.c.sede_id, estado: o.r.estado })) }; },
    marcar_clase: ({ p_ref, p_clase }) => {
      reqStaff(); const s = reqRef(p_ref), c = S.clases.find(x => x.id === p_clase && !x.cancelada) || fallo('Clase no disponible.');
      if (fmtDia(c.inicio) !== hoyEC()) fallo('Solo se marca asistencia de las clases de hoy.');
      const antes = total(s.id), nv = nivel(antes).actual.nombre, m = mov(s, 'clase', null, true);
      let r = S.reservas.find(x => x.clase_id === c.id && x.socia_id === s.id);
      if (!r || !['confirmada', 'asistio'].includes(r.estado)) {
        if (ocupados(c) >= c.cupos) { S.movimientos.splice(S.movimientos.indexOf(m), 1); fallo(`La clase está llena (${ocupados(c)}/${c.cupos}).`); }
        if (r) r.estado = 'asistio'; else S.reservas.push({ id: S.id++, clase_id: c.id, socia_id: s.id, estado: 'asistio', creado: Date.now() });
        if (s.clases_restantes !== null && s.clases_restantes > 0) s.clases_restantes--;
      } else r.estado = 'asistio';
      return { sumadas: m.estrellas, antes, nivel_antes: nv, ficha: jsonSocia(s, true), clase: { id: c.id, tipo: c.tipo, coach: c.coach, inicio: new Date(c.inicio).toISOString(), sede_id: c.sede_id } }; },
    anular: ({ p_mov }) => {
      reqStaff(); const m = S.movimientos.find(x => x.id === p_mov) || fallo('Movimiento no encontrado.');
      if (m.anulado || m.actividad === 'anulacion') fallo('Ese movimiento ya está anulado.');
      if (rol() !== 'admin' && (m.staff_id !== S.staffSel || Date.now() - m.creado > 30 * 60000)) fallo('Solo puedes anular tus movimientos de los últimos 30 minutos.');
      m.anulado = true; S.movimientos.push({ id: S.id++, socia_id: m.socia_id, actividad: 'anulacion', titulo: 'Anulación', estrellas: -m.estrellas, monto: null, staff_id: S.staffSel, anulado: false, ref: m.id, creado: Date.now() });
      if (m.actividad === 'reto') S.reto_envios.filter(e => e.movimiento_id === m.id).forEach(e => { e.estado = 'rechazado'; e.publico = false; });
      if (m.actividad === 'rutina') S.rutinas.filter(r => r.movimiento_id === m.id).forEach(r => { r.estado = 'asignada'; r.movimiento_id = null; });
      return jsonSocia(S.socias.find(s => s.id === m.socia_id), true); },
    hoy: () => { reqStaff(); const l = S.movimientos.filter(m => fmtDia(m.creado) === hoyEC()).sort((a, b) => b.creado - a.creado);
      return { asistencias: l.filter(m => m.actividad === 'clase' && !m.anulado).length, estrellas: l.reduce((a, m) => a + m.estrellas, 0),
        lista: l.map(m => ({ socia: S.socias.find(s => s.id === m.socia_id).nombre, actividad: m.actividad, titulo: m.titulo, estrellas: m.estrellas, monto: m.monto, creado: new Date(m.creado).toISOString(), anulado: m.anulado, staff: nombreStaff(m.staff_id) })) }; },
    clases_dia: ({ p_dia } = {}) => { reqStaff(); const d = p_dia || hoyEC(), verTel = ['admin', 'recepcion'].includes(rol());
      return S.clases.filter(c => !c.cancelada && fmtDia(c.inicio) === d).sort((a, b) => a.inicio - b.inicio || a.sede_id - b.sede_id).map(c => ({ id: c.id, tipo: c.tipo, tipo_nombre: nombreTipo(c.tipo), coach: c.coach, inicio: new Date(c.inicio).toISOString(), cupos: c.cupos, ocupados: ocupados(c), sede_id: c.sede_id,
        alumnas: S.reservas.filter(r => r.clase_id === c.id && ['confirmada', 'asistio', 'espera', 'falta'].includes(r.estado)).map(r => ({ r, s: S.socias.find(x => x.id === r.socia_id) })).sort((a, b) => (a.r.estado === 'espera') - (b.r.estado === 'espera') || a.s.nombre.localeCompare(b.s.nombre))
          .map(o => ({ ref: o.s.qr_token, nombre: o.s.nombre, objetivo: o.s.objetivo, lesiones: o.s.lesiones, estado: o.r.estado, telefono: verTel ? o.s.telefono : null })) })); },
    socias_lista: () => { reqStaff(); const mes = hoyEC().slice(0, 7);
      return S.socias.map(s => { const cl = S.movimientos.filter(m => m.socia_id === s.id && m.actividad === 'clase' && !m.anulado), ru = S.rutinas.find(r => r.socia_id === s.id && r.semana === lunes(hoyEC()));
        return { ref: s.qr_token, nombre: s.nombre, codigo: s.codigo, plan: nombrePlan(s.plan_id), plan_vence: s.plan_vence, objetivo: s.objetivo, lesion: !!s.lesiones, estrellas: total(s.id), nivel: nivel(total(s.id)).actual.nombre,
          clases_mes: cl.filter(m => fmtDia(m.creado).slice(0, 7) === mes).length, ultima: cl.length ? new Date(Math.max(...cl.map(m => m.creado))).toISOString() : null, rutina: ru ? ru.estado : null, creado: new Date(s.creado).toISOString() }; })
        .sort((a, b) => a.nombre.localeCompare(b.nombre)); },
    resumen: () => { if (!['admin', 'recepcion'].includes(rol())) fallo('No autorizado'); const hoy = hoyEC(), mes = hoy.slice(0, 7), t = Date.now();
      const pas = S.clases.filter(c => !c.cancelada && c.inicio > t - 7 * DIA && c.inicio < t), cup = pas.reduce((a, c) => a + c.cupos, 0), oc = pas.reduce((a, c) => a + ocupados(c), 0);
      return { socias: S.socias.length, nuevas_mes: S.socias.filter(s => fmtDia(s.creado).slice(0, 7) === mes).length,
        activas_mes: new Set(S.movimientos.filter(m => m.actividad === 'clase' && !m.anulado && fmtDia(m.creado).slice(0, 7) === mes).map(m => m.socia_id)).size,
        vencen_7d: S.socias.filter(s => s.plan_vence && s.plan_vence >= hoy && s.plan_vence <= sumaDias(hoy, 7)).length, vencidas: S.socias.filter(s => s.plan_vence && s.plan_vence < hoy).length,
        asistencias_mes: S.movimientos.filter(m => m.actividad === 'clase' && !m.anulado && fmtDia(m.creado).slice(0, 7) === mes).length, ocupacion_7d: cup ? Math.round(100 * oc / cup) : null,
        estrellas_mes: S.movimientos.filter(m => fmtDia(m.creado).slice(0, 7) === mes).reduce((a, m) => a + m.estrellas, 0), retos_pendientes: S.reto_envios.filter(e => e.estado === 'pendiente').length }; },
    progreso: ({ p_ref }) => { if (!rol()) fallo('No autorizado'); const s = reqRef(p_ref), clases = S.movimientos.filter(m => m.socia_id === s.id && m.actividad === 'clase' && !m.anulado);
      const sem = new Set(clases.map(m => lunes(fmtDia(m.creado)))); let w = lunes(hoyEC()); if (!sem.has(w)) w = sumaDias(w, -7); let racha = 0; while (sem.has(w)) { racha++; w = sumaDias(w, -7); }
      const meses = []; for (let i = 5; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i, 1); const k = fmtDia(d).slice(0, 7); meses.push({ mes: k, n: clases.filter(m => fmtDia(m.creado).slice(0, 7) === k).length }); }
      const tipos = {}; S.reservas.filter(r => r.socia_id === s.id && r.estado === 'asistio').forEach(r => { const c = S.clases.find(x => x.id === r.clase_id); tipos[c.tipo] = (tipos[c.tipo] || 0) + 1; });
      return { objetivo: s.objetivo, lesiones: s.lesiones, racha, meses, ultima: clases.length ? new Date(Math.max(...clases.map(m => m.creado))).toISOString() : null, tipos: Object.keys(tipos).length ? tipos : null,
        retos: S.reto_envios.filter(e => e.socia_id === s.id && e.estado === 'aprobado').length, ve_notas: esCA(), edita: esCA(),
        notas: esCA() ? S.notas.filter(n => n.socia_id === s.id).sort((a, b) => b.creado - a.creado).map(n => ({ id: n.id, texto: n.texto, creado: new Date(n.creado).toISOString(), autor: nombreStaff(n.staff_id), mia: n.staff_id === S.staffSel })) : null }; },
    perfil: ({ p_ref, p_objetivo, p_lesiones }) => { reqCA(); const s = reqRef(p_ref); s.objetivo = String(p_objetivo || '').trim().slice(0, 200) || null; s.lesiones = String(p_lesiones || '').trim().slice(0, 500) || null; return F.progreso({ p_ref }); },
    nota: ({ p_ref, p_texto }) => { reqCA(); if (String(p_texto || '').trim().length < 2) fallo('Escribe la nota.'); const s = reqRef(p_ref); S.notas.push({ id: S.id++, socia_id: s.id, staff_id: S.staffSel, texto: p_texto.trim().slice(0, 1000), creado: Date.now() }); return F.progreso({ p_ref }); },
    borrar_nota: ({ p_id }) => { reqCA(); const i = S.notas.findIndex(n => n.id === p_id); if (i < 0) fallo('Nota no encontrada.'); const n = S.notas[i];
      if (n.staff_id !== S.staffSel && rol() !== 'admin') fallo('Solo puedes borrar tus notas.'); S.notas.splice(i, 1); return F.progreso({ p_ref: S.socias.find(s => s.id === n.socia_id).qr_token }); },
    mycore: ({ p_ref }) => { if (!rol()) fallo('No autorizado'); const j = jsonMiCore(reqRef(p_ref), true); if (!esCA()) delete j.fotos; return Object.assign(j, { ve_fotos: esCA(), edita_datos: ['recepcion', 'admin'].includes(rol()) }); },
    mycore_guardar: ({ p_ref, p_nacimiento, p_sede, p_plan, p_vence, p_horario, p_clases }) => {
      if (!['recepcion', 'admin'].includes(rol())) fallo('Solo recepción o admin pueden editar estos datos.'); const s = reqRef(p_ref), pl = p_plan ? S.planes.find(x => x.id === p_plan) || fallo('Plan no válido.') : null;
      if (p_clases !== null && p_clases !== undefined && (p_clases < 0 || p_clases > 1000)) fallo('Clases restantes no válidas.');
      Object.assign(s, { nacimiento: p_nacimiento || null, sede_id: p_sede || null, plan_id: p_plan || null, plan_vence: p_vence || null, horario_fijo: String(p_horario || '').trim().slice(0, 120) || null, clases_restantes: p_clases ?? (pl ? pl.clases_mes : null) });
      return F.mycore({ p_ref }); },
    foto_progreso: ({ p_ref, p_path, p_nota }) => { reqCA(); const s = reqRef(p_ref); S.fotos.push({ id: S.id++, socia_id: s.id, path: p_path, nota: String(p_nota || '').trim().slice(0, 300) || null, subida_por: S.staffSel, creado: Date.now() }); return F.mycore({ p_ref }); },
    foto_progreso_borrar: ({ p_id }) => { reqCA(); const i = S.fotos.findIndex(f => f.id === p_id); if (i < 0) fallo('Foto no encontrada.'); const f = S.fotos.splice(i, 1)[0];
      return Object.assign(F.mycore({ p_ref: S.socias.find(s => s.id === f.socia_id).qr_token }), { borrada: f.path }); },
    plantillas: () => { reqCA(); return clon(S.plantillas.filter(p => p.activa).sort((a, b) => a.nombre.localeCompare(b.nombre)).map(p => ({ id: p.id, nombre: p.nombre, descripcion: p.descripcion, bloques: p.bloques }))); },
    plantilla_guardar: ({ p_id, p_nombre, p_descripcion, p_bloques }) => { reqCA(); if (String(p_nombre || '').trim().length < 2) fallo('Ponle nombre a la plantilla.'); if (!Array.isArray(p_bloques || []) || (p_bloques || []).length > 20) fallo('Bloques no válidos.');
      if (!p_id) S.plantillas.push({ id: S.id++, nombre: p_nombre.trim().slice(0, 80), descripcion: String(p_descripcion || '').trim().slice(0, 300) || null, bloques: p_bloques || [], activa: true });
      else Object.assign(S.plantillas.find(p => p.id === p_id) || {}, { nombre: p_nombre.trim().slice(0, 80), descripcion: String(p_descripcion || '').trim().slice(0, 300) || null, bloques: p_bloques || [] }); return F.plantillas(); },
    plantilla_borrar: ({ p_id }) => { reqCA(); const p = S.plantillas.find(x => x.id === p_id); if (p) p.activa = false; return F.plantillas(); },
    rutinas_socia: ({ p_ref }) => { reqStaff(); return jsonRutinas(reqRef(p_ref).id); },
    rutina_asignar: ({ p_ref, p_semana, p_plantilla, p_titulo, p_bloques, p_nota }) => { reqCA(); const s = reqRef(p_ref), sem = lunes(p_semana || hoyEC());
      if (String(p_titulo || '').trim().length < 2) fallo('Ponle un título a la rutina.'); const ex = S.rutinas.find(r => r.socia_id === s.id && r.semana === sem);
      if (ex && ex.estado === 'cumplida') fallo('Esa semana ya fue confirmada como cumplida.');
      const dato = { plantilla_id: p_plantilla || null, titulo: p_titulo.trim().slice(0, 80), bloques: p_bloques || [], nota: String(p_nota || '').trim().slice(0, 500) || null, coach_nombre: sesionStaff().nombre };
      if (ex) Object.assign(ex, dato); else S.rutinas.push(Object.assign({ id: S.id++, socia_id: s.id, semana: sem, estado: 'asignada', movimiento_id: null }, dato)); return jsonRutinas(s.id); },
    rutina_asignar_varias: ({ p_plantilla, p_refs, p_semana }) => { reqCA(); const p = S.plantillas.find(x => x.id === p_plantilla && x.activa) || fallo('Plantilla no encontrada.'), sem = lunes(p_semana || hoyEC()); let n = 0;
      S.socias.filter(s => (p_refs || []).includes(s.qr_token)).forEach(s => { const ex = S.rutinas.find(r => r.socia_id === s.id && r.semana === sem); if (ex && ex.estado === 'cumplida') return; n++;
        const dato = { plantilla_id: p.id, titulo: p.nombre, bloques: clon(p.bloques), coach_nombre: sesionStaff().nombre }; if (ex) Object.assign(ex, dato); else S.rutinas.push(Object.assign({ id: S.id++, socia_id: s.id, semana: sem, estado: 'asignada', nota: null, movimiento_id: null }, dato)); }); return n; },
    rutina_confirmar: ({ p_rutina }) => { reqCA(); const r = S.rutinas.find(x => x.id === p_rutina) || fallo('Rutina no encontrada.'); if (r.estado === 'cumplida') fallo('Esta semana ya está confirmada.');
      const m = mov(S.socias.find(s => s.id === r.socia_id), 'rutina', null, false); r.estado = 'cumplida'; r.movimiento_id = m.id; return jsonRutinas(r.socia_id); },
    rutina_responder: ({ p_rutina, p_texto }) => { reqCA(); if (!String(p_texto || '').trim()) fallo('Escribe tu respuesta.'); const r = S.rutinas.find(x => x.id === p_rutina) || fallo('Rutina no encontrada.');
      S.mensajes.push({ id: S.id++, rutina_id: r.id, autor: 'coach', autor_nombre: sesionStaff().nombre, texto: p_texto.trim().slice(0, 1000), creado: Date.now() }); return jsonRutinas(r.socia_id); },
    retos_pendientes: () => { reqStaff(); return S.reto_envios.filter(e => e.estado === 'pendiente').sort((a, b) => a.creado - b.creado).map(e => { const s = S.socias.find(x => x.id === e.socia_id);
      return { id: e.id, path: e.foto_path, dia: e.dia, socia: s.nombre, ref: s.qr_token, reto: (S.retos.find(r => r.id === e.reto_id) || {}).titulo || null, creado: new Date(e.creado).toISOString() }; }); },
    reto_revisar: ({ p_envio, p_aprobar, p_publico }) => { reqStaff(); const e = S.reto_envios.find(x => x.id === p_envio) || fallo('Envío no encontrado.'); if (e.estado !== 'pendiente') fallo('Esa foto ya fue revisada.');
      if (p_aprobar) { const rt = S.retos.find(r => r.id === e.reto_id), m = mov(S.socias.find(s => s.id === e.socia_id), 'reto', null, false, rt ? rt.estrellas : null); Object.assign(e, { estado: 'aprobado', publico: !!p_publico, movimiento_id: m.id }); }
      else Object.assign(e, { estado: 'rechazado', publico: false }); return F.retos_pendientes(); },
    clase_cancelar: ({ p_clase }) => { if (rol() !== 'admin') fallo('Solo admin.'); const c = S.clases.find(x => x.id === p_clase) || fallo('Clase no encontrada.'); if (c.cancelada) return null;
      S.reservas.filter(r => r.clase_id === c.id && r.estado === 'confirmada').forEach(r => { const s = S.socias.find(x => x.id === r.socia_id); if (s.clases_restantes !== null) s.clases_restantes++; });
      S.reservas.filter(r => r.clase_id === c.id && ['confirmada', 'espera'].includes(r.estado)).forEach(r => { r.estado = 'cancelada'; }); c.cancelada = true; return null; },
    config_admin: () => { if (rol() !== 'admin') fallo('Solo admin.'); return { config: clon(S.cfg), equipo: clon(S.staff) }; },
  };

  /* ------------------------------------------------------------------ interfaz hacia gym-api.js */
  window.GYM_MOCK = {
    rpc: async (fn, args) => { await new Promise(r => setTimeout(r, 120 + Math.random() * 140)); if (!F[fn]) fallo('Función no disponible: ' + fn); const r = F[fn](args || {}); guardar(); return r === undefined ? null : JSON.parse(JSON.stringify(r)); },
    entrarStaff: rolPedido => { const u = S.staff.find(x => x.rol === rolPedido); if (!u) fallo('Rol no válido.'); S.staffSel = u.user_id; guardar(); return { nombre: u.nombre, rol: u.rol }; },
    salirStaff: () => { S.staffSel = null; guardar(); },
    staff: () => sesionStaff() ? { nombre: sesionStaff().nombre, rol: sesionStaff().rol } : null,
    plan: p => { if (p) { S.plan = p; guardar(); } return S.plan; },
    reiniciar: () => { localStorage.removeItem(CLAVE); location.reload(); },
    ejemplo: () => ({ codigo: S.socias[0].codigo, ultimos4: S.socias[0].telefono.slice(-4), token: S.socias[0].token, ref: S.socias[0].qr_token }),
    foto, hoyEC, fmtDia,
  };
})();
