/* clinica-mock.js · backend de DEMOSTRACIÓN en el navegador: imita las funciones SQL de modulos/clinica/supabase/migrations con las mismas reglas
   (consentimiento, topes, precio desde el tarifario, caja y presupuestos inmutables, resumen solo para admin). Los datos son de ejemplo y se guardan
   solo en este navegador (localStorage). En producción este archivo no se carga: clinica-api.js llama a Supabase.
   Los nombres y tratamientos salen de window.CLINICA_SEED (clinica-seed.js, generado desde cliente.json → clinica.mock). */
(() => {
  const SEED = window.CLINICA_SEED || {}, P = ((window.DEMO || {}).claveDemo || 'clinica') + '_mock_';
  const TZ = 'America/Guayaquil', AHORA = () => new Date();
  const ymd = d => d.toLocaleDateString('en-CA', { timeZone: TZ });
  const hoy = () => ymd(AHORA());
  const suma = (s, n) => { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const dif = (a, b) => Math.round((new Date(a + 'T12:00:00Z') - new Date(b + 'T12:00:00Z')) / 864e5);
  const dow = s => (new Date(s + 'T12:00:00Z').getUTCDay() + 6) % 7 + 1;      // 1 = lunes … 7 = domingo
  const hm = () => AHORA().toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  const mins = h => +h.slice(0, 2) * 60 + +h.slice(3, 5);
  const hhmm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const err = m => { throw new Error(m); };
  const R2 = n => Math.round(n * 100) / 100;

  /* Datos de ejemplo reproducibles (PRNG con semilla) */
  function sembrar() {
    let s = 20261015; const r = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296, pick = a => a[Math.floor(r() * a.length)];
    const E = { sec: 0, id: () => ++E.sec };
    const servicios = (SEED.servicios || []).map((n, i) => ({ id: i + 1, nombre: n, categoria: 'General', descripcion: null, duracion_min: SEED.duracion || 30, precio: null, activo: true }));
    const doctores = (SEED.doctores || []).map((d, i) => ({ id: i + 1, nombre: d.nombre, especialidad: d.especialidad || null, color: d.color, activo: true }));
    const tarifario = (SEED.tarifario || []).map((t, i) => ({ id: i + 1, nombre: t.nombre, precio: t.precio, activo: true }));
    const nombres = SEED.pacientes || ['Camila R.', 'Andrés M.', 'Lucía P.', 'Mateo S.', 'Valeria T.', 'Joaquín L.', 'Sofía N.', 'Daniel C.', 'Paula V.', 'Martín A.'];
    const h = hoy(), pacientes = nombres.map((n, i) => ({ id: i + 1, nombre: n, telefono: '59398' + String(1000000 + i * 7919).slice(0, 7), creado: suma(h, -Math.floor(r() * 80)) }));
    const citas = [], caja = [], pres = [], sols = [];
    for (let d = -60; d <= 7; d++) {
      const dia = suma(h, d); if (dow(dia) === 7) continue;
      const n = 3 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) {
        const hi = 8 * 60 + Math.floor(r() * 16) * 30, sv = pick(servicios), p = pick(pacientes), dc = pick(doctores);
        const pasado = d < 0, est = !pasado ? (r() < .3 ? 'pendiente' : 'confirmada') : (r() < .84 ? 'atendida' : r() < .5 ? 'no_vino' : 'cancelada');
        const c = { id: E.id(), pac: p.id, servicio_id: sv.id, dia, hora: hhmm(hi), duracion: sv.duracion_min, estado: est, doctor_id: dc.id }; citas.push(c);
        if (est === 'atendida') {
          const t = tarifario.find(x => x.nombre === sv.nombre) || pick(tarifario);
          caja.push({ id: E.id(), dia, hora: hhmm(hi + 40), descripcion: t.nombre, importe: R2(t.precio * (r() < .2 ? 2 : 1)), tipo: 'ing', doctor_id: dc.id, anulado: false, cli: p.id });
        }
      }
      if (r() < .35) caja.push({ id: E.id(), dia, hora: '16:10', descripcion: pick(['Guantes descartables', 'Material de curación', 'Limpieza']), importe: R2(8 + r() * 40), tipo: 'egr', doctor_id: null, anulado: false });
      if (d < 0 && r() < .45) {
        const t = pick(tarifario), cant = 1 + Math.floor(r() * 3), tot = R2(t.precio * cant), edad = -d, est = edad > 12 ? (r() < .55 ? 'aceptado' : 'rechazado') : (r() < .45 ? 'aceptado' : 'enviado');
        const pp = pick(pacientes); pres.push({ id: E.id(), cli: pp.id, paciente: pp.nombre, doctor_id: pick(doctores).id, descuento: 0, total: tot, estado: est, seguimiento: est === 'enviado' ? suma(dia, 5) : null, creado: dia, items: [{ descripcion: t.nombre, cant, precio: t.precio }] });
      }
    }
    for (let k = 0; k < 14; k++) { const dia = suma(h, -Math.floor(r() * 40)); sols.push({ id: E.id(), nombre: pick(nombres), telefono: pick(pacientes).telefono, servicio_ids: [pick(servicios).id], dia, franja: pick(['manana', 'tarde']), para_menor: false, representante: null, estado: r() < .75 ? 'agendada' : 'descartada', creado: dia + 'T10:00:00' }); }
    [['Ejemplo: Ana L.', 'tarde'], ['Ejemplo: Familia Vega (niño)', 'manana'], ['Ejemplo: Rodrigo B.', 'cualquiera']].forEach(([n, f], i) => sols.push({ id: E.id(), nombre: n.replace('Ejemplo: ', ''), telefono: '5939' + (70000000 + i * 1111111), servicio_ids: [servicios[i % servicios.length].id], dia: suma(h, 2 + i), franja: f, para_menor: i === 1, representante: i === 1 ? 'Marcela Vega' : null, estado: 'nueva', creado: AHORA().toISOString() }));
    const horario = [1, 2, 3, 4, 5, 6, 7].map(d => ({ dia: d, abre: d < 7 ? '09:00' : null, cierra: d < 7 ? '18:00' : null, pausa_ini: d < 7 ? '13:00' : null, pausa_fin: d < 7 ? '14:00' : null }));
    const staff = [{ user_id: 'u-admin', nombre: 'Dueña (demo)', email: 'duena@demo.test', rol: 'admin' }, { user_id: 'u-recep', nombre: 'Recepción (demo)', email: 'recepcion@demo.test', rol: 'recepcion' }];
    const consent = [], clin = [], odo = [], evo = [], aud = [];
    pacientes.slice(0, 4).forEach((p, i) => { p.datos = { cedula: '17' + String(10000000 + i * 137).slice(0, 8), nacimiento: ['1988-03-14', '1975-09-02', '2014-06-21', '1996-12-30'][i], email: `paciente${i + 1}@ejemplo.test`, direccion: 'Dirección de ejemplo', contacto_nombre: 'Contacto de ejemplo', contacto_tel: '0990000000', representante: i === 2 ? 'Madre de ejemplo' : null };
      consent.push({ cli: p.id, tipo: 'tratamiento', otorgado: true, quien: i === 2 ? 'Madre de ejemplo' : p.nombre, dia: suma(h, -30) });
      clin.push({ cli: p.id, alergias: i === 0 ? 'Penicilina (ejemplo)' : null, medicamentos: i === 1 ? 'Losartán (ejemplo)' : null, antecedentes_medicos: i === 1 ? 'Hipertensión controlada (ejemplo)' : null, antecedentes_odonto: 'Limpieza previa (ejemplo)', habitos: null, observaciones: i === 2 ? 'Niño con ansiedad al sillón (ejemplo)' : null, actualizado: suma(h, -30) + ' 10:00' });
      odo.push({ cli: p.id, diente: i === 2 ? 54 : 16, estado: 'caries', nota: 'Ejemplo', dia: suma(h, -30) }, { cli: p.id, diente: i === 2 ? 54 : 16, estado: 'resina', nota: 'Tratada (ejemplo)', dia: suma(h, -20) });
      evo.push({ id: E.id(), cli: p.id, dia: suma(h, -30) + ' 10:30', motivo: 'Dolor al masticar (ejemplo)', diagnostico: 'Caries oclusal (ejemplo)', procedimiento: 'Resina (ejemplo)', indicaciones: 'Evitar masticar 2 horas (ejemplo)', doctor_id: 1, autor: 'Dra. Micaela', corrige_id: null, cita_id: null }); });
    return { sec: E.sec, consent, clin, odo, evo, aud, horario, staff, servicios, doctores, tarifario, pacientes, citas, caja, pres, sols, capacidad: SEED.capacidad || 2, max_hora: 20, rol: null };
  }
  let db; const cargar = () => { try { db = JSON.parse(localStorage.getItem(P + 'db')); } catch (e) {} if (!db || db.v !== 4) { db = sembrar(); db.v = 4; } return db; };
  const guardar = () => { try { localStorage.setItem(P + 'db', JSON.stringify(db)); } catch (e) {} };
  const id = () => ++db.sec;
  const quien = () => { const r = db.rol; if (!r) err('No autorizado'); return r; };
  const admin = () => { if (quien() !== 'admin') err('Solo admin.'); };
  const sv = i => db.servicios.find(s => s.id === i), dc = i => db.doctores.find(d => d.id === i), pc = i => db.pacientes.find(p => p.id === i);
  const tel = t => { const d = String(t || '').replace(/\D/g, ''); return /^09\d{8}$/.test(d) ? '593' + d.slice(1) : /^593\d{9}$/.test(d) ? d : ''; };

  const esClinico = () => db.rol === 'admin' || db.rol === 'doctor';
  const clinico = () => { if (!esClinico()) err('No autorizado'); };
  const consiente = i => { if (!db.pacientes.find(x => x.id === i)) err('Paciente no encontrado.'); const c = db.consent.filter(x => x.cli === i && x.tipo === 'tratamiento'); if (!c.length || !c[c.length - 1].otorgado) err('Primero registra el consentimiento de tratamiento del paciente.'); };
  const audita = (i, accion, detalle) => db.aud.push({ cuando: hoy() + ' ' + hm(), quien: db.rol === 'admin' ? 'Dueña (demo)' : 'Doctor (demo)', accion, paciente: (db.pacientes.find(x => x.id === i) || {}).nombre, detalle: detalle || null, cli: i });
  const FDI = [11,12,13,14,15,16,17,18,21,22,23,24,25,26,27,28,31,32,33,34,35,36,37,38,41,42,43,44,45,46,47,48,51,52,53,54,55,61,62,63,64,65,71,72,73,74,75,81,82,83,84,85];
  const validar = (dia, hora, dur) => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora || '')) err('Hora no válida.');
    const h = db.horario.find(x => x.dia === dow(dia) && x.abre); if (!h) err('Ese día no atendemos.');
    const i = mins(hora), a = mins(h.abre), c = mins(h.cierra);
    if (i < a || i + dur > c) err('Ese horario está fuera del horario de atención.');
    if (h.pausa_ini && i < mins(h.pausa_fin) && i + dur > mins(h.pausa_ini)) err('Ese horario no está disponible (hora de almuerzo).');
  };
  const llena = (dia, hora, dur, excluir) => db.citas.filter(c => c.id !== excluir && c.dia === dia && ['pendiente', 'confirmada'].includes(c.estado) && mins(c.hora) < mins(hora) + dur && mins(c.hora) + c.duracion > mins(hora)).length >= db.capacidad;
  const F = {
    yo() { return db.rol ? { nombre: { admin: 'Dueña (demo)', doctor: 'Doctor (demo)', recepcion: 'Recepción (demo)' }[db.rol], rol: db.rol } : null; },
    servicios_lista() { return db.servicios.filter(s => s.activo); },
    solicitar_cita(a) {
      const t = tel(a.p_telefono), h = hoy(); const ids = [...new Set(a.p_servicios || [])];
      if (a.p_consentimiento !== true) err('Para enviar tu solicitud, acepta el tratamiento de tus datos.');
      if (String(a.p_nombre || '').trim().length < 2) err('Escribe tu nombre y apellido.');
      if (!t) err('Escribe un celular válido (09...).');
      if (!a.p_dia || a.p_dia < h || a.p_dia > suma(h, 60)) err('Elige un día dentro de los próximos 60 días.');
      if (!['manana', 'tarde', 'cualquiera'].includes(a.p_franja)) err('Elige mañana o tarde.');
      if (a.p_menor && String(a.p_representante || '').trim().length < 2) err('Si el paciente es menor de edad, escribe el nombre de quien autoriza.');
      if (!ids.length || ids.length > 4 || ids.some(i => !sv(i) || !sv(i).activo)) err('Elige entre 1 y 4 tratamientos de la lista.');
      const reciente = db.sols.filter(s => s.creado > new Date(Date.now() - 36e5).toISOString()).length; if (reciente >= db.max_hora) err('Hay muchas solicitudes en este momento. Intenta en un rato o escríbenos por WhatsApp.');
      if (db.sols.filter(s => s.telefono === t && s.creado > new Date(Date.now() - 864e5).toISOString()).length >= 3) err('Ya recibimos tus solicitudes de hoy. Te escribiremos para confirmar.');
      const n = { id: id(), nombre: String(a.p_nombre).trim().slice(0, 80), telefono: t, servicio_ids: ids, dia: a.p_dia, franja: a.p_franja, para_menor: !!a.p_menor, representante: a.p_menor ? String(a.p_representante).trim().slice(0, 80) : null, estado: 'nueva', creado: AHORA().toISOString() };
      db.sols.push(n); guardar(); return { ok: true, ref: n.id };
    },
    solicitudes_lista(a) { quien(); const e = a.p_estado || 'nueva'; return db.sols.filter(s => s.estado === e).sort((x, y) => x.creado < y.creado ? -1 : 1).map(s => ({ id: s.id, nombre: s.nombre, telefono: s.telefono, dia: s.dia, franja: s.franja, para_menor: s.para_menor, representante: s.representante, servicios: s.servicio_ids.map(i => ({ id: i, nombre: sv(i).nombre })), creado: s.creado, estado: s.estado })); },
    solicitud_descartar(a) { quien(); const s = db.sols.find(x => x.id === a.p_id && x.estado === 'nueva'); if (!s) err('Solicitud no encontrada o ya atendida.'); s.estado = 'descartada'; guardar(); return null; },
    solicitud_agendar(a) {
      quien(); const s = db.sols.find(x => x.id === a.p_id); if (!s || s.estado !== 'nueva') err('Solicitud no encontrada o ya atendida.');
      if (a.p_doctor != null && !(dc(a.p_doctor) || {}).activo) err('Doctor no válido.');
      if (!s.servicio_ids.includes(a.p_servicio)) err('Elige uno de los tratamientos de la solicitud.');
      const dur = sv(a.p_servicio).duracion_min; validar(a.p_dia, a.p_hora, dur);
      if (llena(a.p_dia, a.p_hora, dur)) err('Ese horario se acaba de llenar. Elige otro, por favor.');
      let p = db.pacientes.find(x => x.telefono === s.telefono); if (!p) { p = { id: id(), nombre: s.nombre, telefono: s.telefono, creado: hoy() }; db.pacientes.push(p); }
      const c = { id: id(), pac: p.id, servicio_id: a.p_servicio, dia: a.p_dia, hora: a.p_hora, duracion: dur, estado: 'confirmada', doctor_id: a.p_doctor ?? null }; db.citas.push(c);
      s.estado = 'agendada'; guardar(); return { cita: c.id, nombre: p.nombre, telefono: p.telefono };
    },
    doctores_lista() { quien(); return db.doctores.slice(); },
    doctor_guardar(a) { admin(); if (String(a.p_nombre || '').trim().length < 2) err('Escribe el nombre del doctor.'); if (!/^#[0-9a-f]{6}$/i.test(a.p_color || '')) err('Color no válido.');
      let d = a.p_id ? dc(a.p_id) : null; if (!d) { d = { id: id() }; db.doctores.push(d); } Object.assign(d, { nombre: a.p_nombre.trim(), especialidad: (a.p_especialidad || '').trim() || null, color: a.p_color, activo: a.p_activo !== false }); guardar(); return d.id; },
    tarifario_lista() { quien(); return db.tarifario.slice(); },
    tarifario_guardar(a) { admin(); if (String(a.p_nombre || '').trim().length < 2) err('Escribe el nombre del tratamiento.'); if (!(a.p_precio >= 0 && a.p_precio <= 100000)) err('Precio no válido.');
      let t = a.p_id ? db.tarifario.find(x => x.id === a.p_id) : null; if (!t) { t = { id: id() }; db.tarifario.push(t); } Object.assign(t, { nombre: a.p_nombre.trim(), precio: R2(a.p_precio), activo: a.p_activo !== false }); guardar(); return t.id; },
    clinica_agenda(a) { quien(); if (!a.p_desde || !a.p_hasta || a.p_hasta < a.p_desde || dif(a.p_hasta, a.p_desde) > 62) err('Rango de fechas no válido.');
      return db.citas.filter(c => c.dia >= a.p_desde && c.dia <= a.p_hasta && c.estado !== 'cancelada').sort((x, y) => (x.dia + x.hora) < (y.dia + y.hora) ? -1 : 1).map(c => ({ id: c.id, estado: c.estado, dia: c.dia, hora: c.hora, duracion: c.duracion, servicio: sv(c.servicio_id).nombre, nombre: pc(c.pac).nombre, telefono: pc(c.pac).telefono, doctor_id: c.doctor_id })); },
    cita_nueva(a) {
      quien(); const t = tel(a.p_telefono), h = hoy(); if (!t) err('Escribe un celular válido (09...).'); const v = sv(a.p_servicio); if (!v || !v.activo) err('Tratamiento no disponible.');
      if (a.p_doctor != null && !(dc(a.p_doctor) || {}).activo) err('Doctor no válido.'); if (!a.p_dia || a.p_dia < h) err('Elige un día desde hoy.');
      validar(a.p_dia, a.p_hora, v.duracion_min); if (llena(a.p_dia, a.p_hora, v.duracion_min)) err('Ese horario ya está lleno.');
      let p = db.pacientes.find(x => x.telefono === t); if (!p) { if (String(a.p_nombre || '').trim().length < 2) err('Escribe el nombre del paciente.'); p = { id: id(), nombre: a.p_nombre.trim().slice(0, 80), telefono: t, creado: h }; db.pacientes.push(p); }
      const c = { id: id(), pac: p.id, servicio_id: v.id, dia: a.p_dia, hora: a.p_hora, duracion: v.duracion_min, estado: 'confirmada', doctor_id: a.p_doctor ?? null }; db.citas.push(c); guardar(); return { cita: c.id, nombre: p.nombre, telefono: p.telefono };
    },
    mover_cita(a) { quien(); const c = db.citas.find(x => x.id === a.p_cita); if (!c) err('Cita no encontrada.'); validar(a.p_dia, a.p_hora, c.duracion); if (llena(a.p_dia, a.p_hora, c.duracion, c.id)) err('Ese horario ya está lleno.');
      c.dia = a.p_dia; c.hora = a.p_hora; if (['cancelada', 'no_vino'].includes(c.estado)) c.estado = 'confirmada'; guardar(); return null; },
    config_admin() { quien(); return { config: { capacidad: db.capacidad, paso_min: 20, sellos_meta: 5 }, servicios: db.servicios.map((s, i) => ({ ...s, orden: i + 1, fidelidad: false })), horario: db.horario.map(h => ({ ...h })),
      equipo: db.rol === 'admin' ? db.staff.map(m => ({ ...m, yo: m.rol === db.rol })) : undefined }; },
    config_guardar(a) { admin(); if (!(a.p_capacidad >= 1 && a.p_capacidad <= 10)) err('Cabinas entre 1 y 10.'); db.capacidad = a.p_capacidad; guardar(); return null; },
    servicio_guardar(a) { admin(); if (String(a.p_nombre || '').trim().length < 2) err('Escribe el nombre del servicio.'); if (!(a.p_duracion >= 15 && a.p_duracion <= 240)) err('Duración entre 15 y 240 min.');
      let s = a.p_id ? sv(a.p_id) : null; if (!s) { s = { id: id(), categoria: 'Tratamientos', descripcion: null, precio: null }; db.servicios.push(s); } Object.assign(s, { nombre: a.p_nombre.trim(), duracion_min: a.p_duracion, activo: a.p_activo !== false }); guardar(); return s.id; },
    horario_guardar(a) { admin(); const h = db.horario.find(x => x.dia === a.p_dia); if (!h) err('Día no válido.');
      if (!a.p_abre || !a.p_cierra) { Object.assign(h, { abre: null, cierra: null, pausa_ini: null, pausa_fin: null }); guardar(); return null; }
      if (a.p_cierra <= a.p_abre) err('La hora de cierre debe ser después de la de apertura.'); if (h.pausa_ini && (h.pausa_ini < a.p_abre || h.pausa_fin > a.p_cierra)) err('new row for relation "horario" violates check constraint "horario_pausa_ok"'); Object.assign(h, { abre: a.p_abre, cierra: a.p_cierra }); guardar(); return null; },
    horario_pausa_guardar(a) { admin(); const h = db.horario.find(x => x.dia === a.p_dia); if (!a.p_ini || !a.p_fin) { if (h) { h.pausa_ini = null; h.pausa_fin = null; guardar(); } return null; }
      if (!h || !h.abre) err('Primero define el horario de ese día.'); if (a.p_ini < h.abre || a.p_fin > h.cierra || a.p_fin <= a.p_ini) err('new row for relation "horario" violates check constraint "horario_pausa_ok"'); h.pausa_ini = a.p_ini; h.pausa_fin = a.p_fin; guardar(); return null; },
    equipo_guardar(a) { admin(); if (!['admin', 'doctor', 'recepcion'].includes(a.p_rol)) err('Rol no válido.'); if (!/^[^@\s]+@[^@\s]+$/.test(a.p_email || '')) err('Ese correo no tiene usuario. Créalo primero en Supabase › Authentication › Add user.');
      let m = db.staff.find(x => x.email === a.p_email.toLowerCase()); if (!m) { m = { user_id: 'u-' + id(), email: a.p_email.toLowerCase() }; db.staff.push(m); } Object.assign(m, { nombre: a.p_nombre || a.p_email.split('@')[0], rol: a.p_rol }); guardar(); return null; },
    equipo_quitar(a) { admin(); const m = db.staff.find(x => x.user_id === a.p_user); if (!m) return null; if (m.rol === db.rol) err('No puedes quitarte tu propio acceso.'); db.staff = db.staff.filter(x => x !== m); guardar(); return null; },
    pacientes_buscar(a) { quien(); const q = String(a.p_q || '').trim().toLowerCase(), h = hoy();
      return db.pacientes.filter(p => q.length < 2 || p.nombre.toLowerCase().includes(q) || p.telefono.includes(q) || ((p.datos || {}).cedula || '').toLowerCase().includes(q)).slice().reverse().slice(0, 40).map(p => {
        const cs = db.citas.filter(c => c.pac === p.id && c.estado !== 'cancelada'), pas = cs.filter(c => c.dia <= h).map(c => c.dia).sort(), fut = db.citas.filter(c => c.pac === p.id && c.dia > h && ['pendiente', 'confirmada'].includes(c.estado)).map(c => c.dia).sort();
        return { id: p.id, nombre: p.nombre, telefono: p.telefono, cedula: (p.datos || {}).cedula || null, citas: cs.length, ultima: pas.length ? pas[pas.length - 1] : null, proxima: fut[0] || null }; }); },
    paciente_ficha(a) { quien(); const p = db.pacientes.find(x => x.id === a.p_id); if (!p) err('Paciente no encontrado.'); const clin = esClinico();
      if (clin) db.aud.push({ cuando: hoy() + ' ' + hm(), quien: db.rol === 'admin' ? 'Dueña (demo)' : 'Doctor (demo)', accion: 'ver_ficha', paciente: p.nombre, detalle: null, cli: p.id });
      const cons = {}; db.consent.filter(c => c.cli === p.id).forEach(c => cons[c.tipo] = c);
      const odo = {}; db.odo.filter(o => o.cli === p.id).forEach(o => odo[o.diente] = o); const cv = db.clin.filter(c => c.cli === p.id);
      guardar(); return { id: p.id, nombre: p.nombre, telefono: p.telefono, creado: p.creado, datos: p.datos || null,
        citas: db.citas.filter(c => c.pac === p.id).sort((x, y) => (y.dia + y.hora) < (x.dia + x.hora) ? -1 : 1).map(c => ({ id: c.id, dia: c.dia, hora: c.hora, duracion: c.duracion, servicio: sv(c.servicio_id).nombre, estado: c.estado, doctor: (dc(c.doctor_id) || {}).nombre || null })),
        cobros: db.caja.filter(m => m.cli === p.id).sort((x, y) => y.id - x.id).map(m => ({ id: m.id, dia: m.dia, descripcion: m.descripcion, importe: m.importe, tipo: m.tipo, anulado: m.anulado })),
        presupuestos: db.pres.filter(x => x.cli === p.id).sort((x, y) => y.id - x.id).map(x => ({ id: x.id, dia: x.creado, total: x.total, estado: x.estado, descuento: x.descuento, items: x.items })),
        consentimientos: Object.values(cons).map(c => ({ tipo: c.tipo, otorgado: c.otorgado, quien: c.quien, dia: c.dia })), acceso_clinico: clin,
        clinico: clin ? (cv.length ? cv[cv.length - 1] : null) : null, odontograma: clin ? Object.values(odo).map(o => ({ diente: o.diente, estado: o.estado, nota: o.nota, dia: o.dia })) : null,
        evoluciones: clin ? db.evo.filter(e => e.cli === p.id).sort((x, y) => y.id - x.id) : null }; },
    paciente_guardar(a) { quien(); const t = tel(a.p_telefono), h = hoy(); if (String(a.p_nombre || '').trim().length < 2) err('Escribe el nombre del paciente.'); if (!t) err('Escribe un celular válido (09...).');
      if (a.p_nacimiento && (a.p_nacimiento > h || a.p_nacimiento < '1900-01-01')) err('La fecha de nacimiento no es válida.');
      if (a.p_nacimiento && a.p_nacimiento > suma(h, -365 * 18) && String(a.p_representante || '').trim().length < 2) err('Para un menor de edad escribe el nombre de su representante.');
      if (a.p_cedula && !/^[0-9A-Za-z-]{5,20}$/.test(a.p_cedula)) err('La cédula no es válida.');
      if (db.pacientes.some(x => x.id !== a.p_id && (x.telefono === t || (a.p_cedula && (x.datos || {}).cedula === a.p_cedula)))) err('Ya existe un paciente con ese celular o esa cédula.');
      let p = a.p_id ? db.pacientes.find(x => x.id === a.p_id) : null; if (a.p_id && !p) err('Paciente no encontrado.'); if (!p) { p = { id: id(), creado: h }; db.pacientes.push(p); }
      Object.assign(p, { nombre: a.p_nombre.trim().slice(0, 80), telefono: t, datos: { cedula: a.p_cedula || null, nacimiento: a.p_nacimiento || null, email: a.p_email || null, direccion: a.p_direccion || null, contacto_nombre: a.p_contacto_nombre || null, contacto_tel: a.p_contacto_tel || null, representante: a.p_representante || null } }); guardar(); return { id: p.id }; },
    consentimiento_registrar(a) { quien(); if (!['datos', 'tratamiento', 'imagenes'].includes(a.p_tipo)) err('Tipo no válido.'); if (String(a.p_quien || '').trim().length < 2) err('Escribe el nombre de quien da el consentimiento (el paciente o su representante).'); if (!db.pacientes.find(x => x.id === a.p_id)) err('Paciente no encontrado.');
      db.consent.push({ cli: a.p_id, tipo: a.p_tipo, otorgado: !!a.p_otorgado, quien: a.p_quien.trim(), dia: hoy() }); guardar(); return null; },
    paciente_clinico_guardar(a) { clinico(); consiente(a.p_id); db.clin.push({ cli: a.p_id, alergias: a.p_alergias || null, medicamentos: a.p_medicamentos || null, antecedentes_medicos: a.p_antecedentes_medicos || null, antecedentes_odonto: a.p_antecedentes_odonto || null, habitos: a.p_habitos || null, observaciones: a.p_observaciones || null, actualizado: hoy() + ' ' + hm() }); audita(a.p_id, 'editar_clinico'); guardar(); return null; },
    odontograma_marcar(a) { clinico(); consiente(a.p_id); if (!FDI.includes(a.p_diente) || !['sano', 'caries', 'resina', 'endodoncia', 'corona', 'brackets', 'implante', 'protesis', 'ausente'].includes(a.p_estado)) err('Diente o estado no válido.');
      db.odo.push({ cli: a.p_id, diente: a.p_diente, estado: a.p_estado, nota: a.p_nota || null, dia: hoy() }); audita(a.p_id, 'odontograma', a.p_diente + ' ' + a.p_estado); guardar(); return null; },
    evolucion_guardar(a) { clinico(); consiente(a.p_id); if (String(a.p_motivo || '').trim().length < 3) err('Escribe el motivo de la consulta.'); if (a.p_doctor != null && !dc(a.p_doctor)) err('Doctor no válido.');
      if (a.p_cita != null && !db.citas.some(c => c.id === a.p_cita && c.pac === a.p_id)) err('Esa cita no es de este paciente.'); if (a.p_corrige != null && !db.evo.some(e => e.id === a.p_corrige && e.cli === a.p_id)) err('La nota que corriges no es de este paciente.');
      const e = { id: id(), cli: a.p_id, dia: hoy() + ' ' + hm(), motivo: a.p_motivo.trim(), diagnostico: a.p_diagnostico || null, procedimiento: a.p_procedimiento || null, indicaciones: a.p_indicaciones || null, doctor: (dc(a.p_doctor) || {}).nombre || null, autor: db.rol === 'admin' ? 'Dueña (demo)' : 'Doctor (demo)', corrige_id: a.p_corrige ?? null, cita_id: a.p_cita ?? null };
      db.evo.push(e); audita(a.p_id, a.p_corrige ? 'corrige_evolucion' : 'evolucion', String(e.id)); guardar(); return e.id; },
    auditoria_lista(a) { admin(); return db.aud.filter(x => !a.p_id || x.cli === a.p_id).slice().reverse().slice(0, a.p_limite || 100).map(x => ({ cuando: x.cuando, quien: x.quien, accion: x.accion, paciente: x.paciente, detalle: x.detalle })); },
    cita_estado(a) { quien(); if (!['pendiente', 'confirmada', 'atendida', 'cancelada', 'no_vino'].includes(a.p_estado)) err('Estado no válido.'); const c = db.citas.find(x => x.id === a.p_cita); if (!c) err('Cita no encontrada.'); c.estado = a.p_estado; guardar(); return null; },
    cita_doctor(a) { quien(); if (a.p_doctor != null && !(dc(a.p_doctor) || {}).activo) err('Doctor no válido.'); const c = db.citas.find(x => x.id === a.p_cita); if (!c) err('Cita no encontrada.'); c.doctor_id = a.p_doctor; guardar(); return null; },
    caja_dia(a) { quien(); const m = db.caja.filter(x => x.dia === a.p_dia), v = m.filter(x => !x.anulado), s = t => R2(v.filter(x => x.tipo === t).reduce((q, x) => q + x.importe, 0));
      return { items: m.sort((x, y) => x.hora < y.hora ? -1 : 1).map(x => ({ id: x.id, hora: x.hora, descripcion: x.descripcion, importe: x.importe, tipo: x.tipo, doctor_id: x.doctor_id, anulado: x.anulado, motivo: x.motivo || null })), ingresos: s('ing'), egresos: s('egr') }; },
    caja_registrar(a) { quien(); if (String(a.p_descripcion || '').trim().length < 2) err('Escribe una descripción.'); if (!(a.p_importe > 0 && a.p_importe <= 100000)) err('Importe no válido.'); if (!['ing', 'egr'].includes(a.p_tipo)) err('Tipo no válido.');
      const m = { id: id(), dia: hoy(), hora: hm(), descripcion: a.p_descripcion.trim().slice(0, 80), importe: R2(a.p_importe), tipo: a.p_tipo, doctor_id: a.p_doctor ?? null, anulado: false, cli: a.p_clienta ?? null }; if (a.p_clienta != null && !db.pacientes.find(x => x.id === a.p_clienta)) err('Paciente no encontrado.'); db.caja.push(m); guardar(); return m.id; },
    caja_anular(a) { quien(); if (String(a.p_motivo || '').trim().length < 3) err('Escribe el motivo de la anulación.'); const m = db.caja.find(x => x.id === a.p_id && !x.anulado); if (!m) err('Movimiento no encontrado o ya anulado.'); m.anulado = true; m.motivo = a.p_motivo.trim().slice(0, 120); guardar(); return null; },
    presupuesto_guardar(a) { quien(); if (String(a.p_paciente || '').trim().length < 2) err('Escribe el nombre del paciente.'); if (!(a.p_descuento >= 0 && a.p_descuento <= 50)) err('El descuento va de 0 a 50 %.');
      const its = a.p_items; if (!Array.isArray(its) || !its.length || its.length > 20) err('Agrega de 1 a 20 tratamientos.'); let sub = 0; const lin = its.map(x => { const t = db.tarifario.find(y => y.id === x.tarifario_id && y.activo); if (!t) err('Tratamiento no válido.'); if (!(x.cant >= 1 && x.cant <= 20)) err('Cantidad entre 1 y 20.'); sub += t.precio * x.cant; return { descripcion: t.nombre, cant: x.cant, precio: t.precio }; });
      if (a.p_clienta != null && !db.pacientes.find(x => x.id === a.p_clienta)) err('Paciente no encontrado.'); const p = { id: id(), cli: a.p_clienta ?? null, paciente: a.p_paciente.trim().slice(0, 80), doctor_id: a.p_doctor ?? null, descuento: a.p_descuento, total: R2(sub * (100 - a.p_descuento) / 100), estado: 'enviado', seguimiento: a.p_seguimiento || null, creado: hoy(), items: lin }; db.pres.push(p); guardar(); return { id: p.id, total: p.total }; },
    presupuestos_lista(a) { quien(); return db.pres.filter(p => !a.p_estado || p.estado === a.p_estado).sort((x, y) => y.id - x.id).slice(0, 100); },
    presupuesto_estado(a) { quien(); if (!['aceptado', 'rechazado'].includes(a.p_estado)) err('Estado no válido.'); const p = db.pres.find(x => x.id === a.p_id && x.estado === 'enviado'); if (!p) err('Presupuesto no encontrado o ya decidido.'); p.estado = a.p_estado; guardar(); return null; },
    dueno_resumen(a) {
      admin(); const d0 = a.p_desde, d1 = a.p_hasta; if (!d0 || !d1 || d1 < d0 || dif(d1, d0) > 365) err('Rango de fechas no válido (máximo 1 año).');
      const dias = dif(d1, d0) + 1, p0 = suma(d0, -dias), p1 = suma(d0, -1), h = hoy(), en = (x, i, f) => x >= i && x <= f;
      const C = db.citas.filter(c => en(c.dia, d0, d1)), V = C.filter(c => c.estado !== 'cancelada'), n = (l, e) => l.filter(c => c.estado === e).length;
      const cuenta = (arr, k) => { const m = new Map(); arr.forEach(x => m.set(k(x), (m.get(k(x)) || 0) + 1)); return m; };
      const doctorDe = i => dc(i) || { nombre: 'Sin asignar', color: '#8E8F94' };
      const pdoc = new Map(); V.forEach(c => { const d = doctorDe(c.doctor_id), o = pdoc.get(d.nombre) || { doctor: d.nombre, color: d.color, citas: 0, atendidas: 0 }; o.citas++; if (c.estado === 'atendida') o.atendidas++; pdoc.set(d.nombre, o); });
      const ptrat = [...cuenta(V, c => sv(c.servicio_id).nombre)].map(([nombre, n]) => ({ nombre, n })).sort((x, y) => y.n - x.n).slice(0, 8);
      const K = db.caja.filter(m => !m.anulado), Ki = m => m.tipo === 'ing' && !m.anulado, suma_ = (l, f) => R2(l.filter(f).reduce((q, x) => q + x.importe, 0));
      const Kr = db.caja.filter(m => en(m.dia, d0, d1)), ing = suma_(Kr, Ki), egr = suma_(Kr, m => m.tipo === 'egr' && !m.anulado);
      const serie = Array.from({ length: dias }, (_, k) => { const dia = suma(d0, k); return { dia, ing: suma_(Kr, m => m.dia === dia && Ki(m)), egr: suma_(Kr, m => m.dia === dia && m.tipo === 'egr' && !m.anulado) }; });
      const ddoc = new Map(); Kr.filter(Ki).forEach(m => { const d = doctorDe(m.doctor_id), o = ddoc.get(d.nombre) || { doctor: d.nombre, color: d.color, ingresos: 0 }; o.ingresos = R2(o.ingresos + m.importe); ddoc.set(d.nombre, o); });
      const PR = db.pres.filter(p => en(p.creado, d0, d1)), S = db.sols.filter(s => en(s.creado.slice(0, 10), d0, d1)), pa = (l, e) => l.filter(p => p.estado === e);
      const A = { c: db.citas.filter(c => en(c.dia, p0, p1) && c.estado === 'atendida').length, i: suma_(db.caja.filter(m => en(m.dia, p0, p1)), Ki), n: db.pacientes.filter(p => en(p.creado, p0, p1)).length, s: db.sols.filter(s => en(s.creado.slice(0, 10), p0, p1)).length, m: R2(db.pres.filter(p => en(p.creado, p0, p1) && p.estado === 'aceptado').reduce((q, p) => q + p.total, 0)) };
      return {
        desde: d0, hasta: d1, dias,
        citas: { total: V.length, atendidas: n(C, 'atendida'), no_vino: n(C, 'no_vino'), canceladas: n(C, 'cancelada'), por_doctor: [...pdoc.values()].sort((x, y) => y.citas - x.citas), por_tratamiento: ptrat,
          por_dia_semana: [1, 2, 3, 4, 5, 6, 7].map(k => ({ dia: k, n: V.filter(c => dow(c.dia) === k).length })), por_franja: { manana: V.filter(c => mins(c.hora) < 780).length, tarde: V.filter(c => mins(c.hora) >= 780).length } },
        solicitudes: { recibidas: S.length, agendadas: n(S, 'agendada'), descartadas: n(S, 'descartada'), pendientes: db.sols.filter(s => s.estado === 'nueva').length },
        caja: { ingresos: ing, egresos: egr, cobros: Kr.filter(Ki).length, anulados: Kr.filter(m => m.anulado).length, serie, por_doctor: [...ddoc.values()].sort((x, y) => y.ingresos - x.ingresos) },
        presupuestos: { enviados: PR.length, aceptados: pa(PR, 'aceptado').length, rechazados: pa(PR, 'rechazado').length, monto_enviado: R2(PR.reduce((q, p) => q + p.total, 0)), monto_aceptado: R2(pa(PR, 'aceptado').reduce((q, p) => q + p.total, 0)),
          seguimientos: db.pres.filter(p => p.estado === 'enviado' && p.seguimiento && p.seguimiento <= h).sort((x, y) => x.seguimiento < y.seguimiento ? -1 : 1).slice(0, 10).map(p => ({ id: p.id, paciente: p.paciente, total: p.total, seguimiento: p.seguimiento, dias_vencido: dif(h, p.seguimiento) })) },
        pacientes: { nuevos: db.pacientes.filter(p => en(p.creado, d0, d1)).length, total: db.pacientes.length },
        anterior: { citas_atendidas: A.c, ingresos: A.i, nuevos: A.n, solicitudes: A.s, monto_aceptado: A.m }
      };
    }
  };

  window.CLINICA_MOCK = {
    rpc(fn, args) { cargar(); const f = F[fn]; if (!f) return Promise.reject(new Error('Función no disponible en la demo: ' + fn));
      return new Promise((ok, no) => setTimeout(() => { try { ok(JSON.parse(JSON.stringify(f(args) ?? null))); } catch (e) { no(e); } }, 120)); },
    sesion() { cargar(); return Promise.resolve(F.yo()); },
    entrar(rol) { cargar(); db.rol = ['admin', 'doctor'].includes(rol) ? rol : 'recepcion'; guardar(); return Promise.resolve(F.yo()); },
    salir() { cargar(); db.rol = null; guardar(); },
    reiniciar() { try { localStorage.removeItem(P + 'db'); } catch (e) {} db = null; }
  };
})();
