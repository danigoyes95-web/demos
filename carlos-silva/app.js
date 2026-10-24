/* Datos, plantillas, calculadoras, PDF y enlace del cliente. MODO DEMO: localStorage del navegador. */
(() => {
  const C = window.COACH, KEY = 'cs_demo_v1';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'),   // fecha LOCAL (UTC cambia el día después de las 19:00 en Ecuador)
    hoy = () => ymd(new Date()), uid = () => Math.random().toString(36).slice(2, 9);
  const fecha = d => d ? new Date(d + 'T12:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const dias = n => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
  const d = (nombre, foco, ex) => ({ nombre, foco, ej: ex.map(([id, s, r, dsc, nota]) => ({ id, series: s, reps: r, desc: dsc, nota: nota || '' })) });
  /* ---- plantillas de rutina ---- */
  const RUTINAS = {
    'Hipertrofia · 4 días': { nombre: 'Hipertrofia 4 días (torso/pierna)', semanas: 8, dias: [
      d('Día 1 · Torso A', 'Pecho y espalda', [['press-banca', 4, '6-8', '90 s'], ['remo-barra', 4, '8-10', '90 s'], ['press-inclinado', 3, '10-12', '75 s'], ['jalon', 3, '10-12', '75 s'], ['curl-barra', 3, '10-12', '60 s'], ['pushdown', 3, '10-12', '60 s']]),
      d('Día 2 · Pierna A', 'Cuádriceps y glúteo', [['sentadilla', 4, '6-8', '2 min'], ['rumano', 3, '8-10', '90 s'], ['zancadas', 3, '10 c/pierna', '75 s'], ['ext-cuad', 3, '12-15', '60 s'], ['talones', 4, '15', '45 s'], ['plancha', 3, '45 s', '45 s']]),
      d('Día 3 · Torso B', 'Hombro y brazos', [['press-militar', 4, '6-8', '90 s'], ['dominadas', 3, 'al fallo -1', '2 min', 'Con banda si no llega a 6'], ['elev-frontal', 3, '12-15', '60 s'], ['press-frances', 3, '10-12', '60 s'], ['curl-barra', 3, '10-12', '60 s']]),
      d('Día 4 · Pierna B', 'Glúteo e isquios', [['peso-muerto', 4, '5', '2-3 min'], ['hip-thrust', 4, '8-10', '90 s'], ['zancadas', 3, '12 c/pierna', '75 s'], ['crunch', 3, '15-20', '45 s'], ['elev-piernas', 3, '12-15', '45 s']])] },
    'Fuerza · 3 días full body': { nombre: 'Fuerza 3 días (cuerpo completo)', semanas: 8, dias: [
      d('Día A', 'Sentadilla + empuje', [['sentadilla', 5, '5', '3 min'], ['press-banca', 5, '5', '3 min'], ['remo-barra', 4, '6-8', '2 min'], ['plancha', 3, '45 s', '45 s']]),
      d('Día B', 'Peso muerto + hombro', [['peso-muerto', 4, '4-5', '3 min'], ['press-militar', 4, '6', '2 min'], ['dominadas', 4, '5-8', '2 min'], ['crunch', 3, '15', '45 s']]),
      d('Día C', 'Pierna + pecho', [['sentadilla', 4, '6', '2 min'], ['press-inclinado', 4, '8', '90 s'], ['rumano', 3, '8', '90 s'], ['mountain', 3, '30 s', '45 s']])] },
    'Definición · 4 días + cardio': { nombre: 'Definición 4 días', semanas: 6, dias: [
      d('Día 1', 'Pierna y core', [['sentadilla', 4, '10-12', '60 s'], ['zancadas', 3, '12 c/pierna', '45 s'], ['hip-thrust', 3, '12', '60 s'], ['plancha', 3, '60 s', '30 s']]),
      d('Día 2', 'Torso (empuje)', [['press-inclinado', 4, '10-12', '60 s'], ['press-militar', 3, '10-12', '60 s'], ['flexiones', 3, 'al fallo -2', '45 s'], ['pushdown', 3, '12-15', '45 s']]),
      d('Día 3', 'Cardio + core', [['mountain', 5, '40 s', '20 s', 'Circuito HIIT'], ['elev-piernas', 4, '15', '30 s'], ['crunch', 4, '20', '30 s']]),
      d('Día 4', 'Torso (tirón)', [['jalon', 4, '10-12', '60 s'], ['remo-barra', 4, '10-12', '60 s'], ['curl-barra', 3, '12-15', '45 s'], ['elev-frontal', 3, '15', '45 s']])] },
    'Principiante · 3 días': { nombre: 'Adaptación 3 días', semanas: 4, dias: [
      d('Día 1', 'Cuerpo completo', [['sentadilla', 3, '12', '75 s', 'Sin carga o barra vacía'], ['flexiones', 3, '8-12', '60 s', 'Con rodillas si hace falta'], ['jalon', 3, '12', '60 s'], ['plancha', 3, '30 s', '45 s']]),
      d('Día 2', 'Cuerpo completo', [['zancadas', 3, '10 c/pierna', '60 s'], ['press-militar', 3, '12', '60 s'], ['rumano', 3, '12', '75 s'], ['crunch', 3, '12', '45 s']]),
      d('Día 3', 'Cuerpo completo', [['hip-thrust', 3, '12', '60 s'], ['press-inclinado', 3, '12', '60 s'], ['remo-barra', 3, '12', '60 s'], ['elev-piernas', 3, '10', '45 s']])] }
  };
  /* ---- calculadoras ---- */
  const calc = {
    edad: nac => nac ? Math.floor((Date.now() - new Date(nac)) / 31557600000) : 30,
    tmb: (sx, kg, cm, ed) => 10 * kg + 6.25 * cm - 5 * ed + (sx === 'F' ? -161 : 5),   // Mifflin-St Jeor
    imc: (kg, cm) => kg / ((cm / 100) ** 2),
    macros(kcal, kg, obj) { const p = Math.round(kg * (obj === 'definicion' ? 2.2 : 1.9)), g = Math.round(kg * (obj === 'volumen' ? 1 : 0.9)), c = Math.max(0, Math.round((kcal - p * 4 - g * 9) / 4)); return { p, g, c }; },
    kcalObj(tdee, obj) { return Math.round(tdee * (obj === 'definicion' ? 0.8 : obj === 'volumen' ? 1.1 : 1)); },
    rm: (kg, reps) => Math.round(kg * (1 + reps / 30)),                                   // Epley
    fcMax: ed => 220 - ed
  };
  const SCHED = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
  /* día de la semana (0=lunes) de cada día de rutina: el elegido por el coach o un reparto por defecto */
  const diaSem = (r, i) => { const d = r.dias[i]; return d.dow !== undefined && d.dow !== '' && d.dow !== null ? +d.dow : (SCHED[Math.min(7, r.dias.length)] || [])[i]; };
  const ACT = { 1.2: 'Sedentario', 1.375: 'Ligero (1-3 días)', 1.55: 'Moderado (3-5 días)', 1.725: 'Alto (6-7 días)' };
  const planBase = (kcal, m) => ({ kcal, p: m.p, c: m.c, g: m.g, agua: '3 L al día', notas: 'Pesar los alimentos en crudo. Ajustamos cada 2 semanas según el chequeo.',
    comidas: [
      { h: '07:00', n: 'Desayuno', it: ['3 huevos enteros + 2 claras', '60 g de avena con canela', '1 fruta'] },
      { h: '10:00', n: 'Colación', it: ['1 yogur griego natural', '20 g de nueces'] },
      { h: '13:00', n: 'Almuerzo', it: ['180 g de pechuga de pollo', '200 g de arroz cocido', 'Ensalada libre + 1 cdta de aceite de oliva'] },
      { h: '16:30', n: 'Pre-entreno', it: ['1 plátano', '1 scoop de proteína (opcional)'] },
      { h: '20:00', n: 'Cena', it: ['170 g de carne magra o pescado', '200 g de camote o papa', 'Verduras al vapor'] }] });
  /* ---- métricas de cumplimiento (compartidas por panel y portal). H = { 'YYYY-MM-DD': [idx de ejercicios hechos], 'mYYYY-MM-DD': [comidas] } ---- */
  const dowDe = f => (new Date(f + 'T12:00').getDay() + 6) % 7;
  const diaDe = (c, f) => { const r = c.rutina; if (!r) return null; const i = r.dias.findIndex((_, k) => diaSem(r, k) === dowDe(f)); return i < 0 ? null : r.dias[i]; };
  const M = {
    dia(c, H, f) { const d = diaDe(c, f); if (!d || !d.ej.length) return null; return { hecho: Math.min((H[f] || []).length, d.ej.length), total: d.ej.length }; },
    pct(c, H, desde = 0, n = 7) { let h = 0, t = 0; for (let i = desde; i < desde + n; i++) { const x = M.dia(c, H, dias(i)); if (x) { h += x.hecho; t += x.total; } } return t ? h / t * 100 : null; },
    completos(c, H, desde = 0, n = 7) { let k = 0; for (let i = desde; i < desde + n; i++) { const x = M.dia(c, H, dias(i)); if (x && x.hecho >= x.total) k++; } return k; },
    racha(c, H) { let r = 0; for (let i = 0; i < 60; i++) { const x = M.dia(c, H, dias(i)); if (!x) continue; if (x.hecho >= x.total) r++; else if (i === 0) continue; else break; } return r; }
  };
  /* ---- mensualidad, check-in y medidas corporales ---- */
  const MC = [['cuello', 'Cuello'], ['hombros', 'Hombros'], ['pecho', 'Pecho'], ['brazo', 'Brazo'], ['cintura', 'Cintura'], ['abdomen', 'Abdomen'], ['cadera', 'Cadera'], ['muslo', 'Muslo'], ['pantorrilla', 'Pantorrilla']];
  const DIAS_N = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  /* check-in = sábado. Se sube desde el viernes al mediodía; el aviso "mañana es tu check-in" sale el viernes desde las 18:00. */
  const ventana = (now = new Date()) => { const w = (now.getDay() + 6) % 7, h = now.getHours(), d = new Date(now); d.setDate(d.getDate() + (w <= 5 ? 5 - w : -1));
    return { fecha: ymd(d), estado: w === 5 ? 'hoy' : w === 6 ? 'pasado' : (w === 4 && h >= 18) ? 'aviso' : 'proximo', puede: (w === 4 && h >= 12) || w >= 5 }; };
  const venceDias = (c, now = new Date()) => { if (!c.vence) return null; const a = new Date(c.vence + 'T00:00'), b = new Date(ymd(now) + 'T00:00'); return Math.round((a - b) / 864e5); };
  const msgVence = c => { const d = venceDias(c); return `Hola ${c.nombre.split(' ')[0]}, tu mensualidad ${d < 0 ? 'venció' : d === 0 ? 'vence hoy' : 'vence en ' + d + ' día' + (d === 1 ? '' : 's')} (${fecha(c.vence)}). ¿Renovamos para que sigas sin pausa? 💪`; };
  const msgCheckin = (c, e = 'aviso') => `Hola ${c.nombre.split(' ')[0]}, ${e === 'aviso' ? 'mañana sábado es tu check-in 📸' : e === 'hoy' ? 'hoy es tu check-in 📸' : 'te faltan las fotos de tu check-in 📸'} Sube tus 3 fotos (frente, lateral y espalda) en tu portal para que pueda hacer tu comparativa.`;
  const activa = c => !!(c.vence && c.vence >= hoy());
  const hastaDe = (c, fPago, dias) => { const base = c.vence && c.vence >= fPago ? c.vence : fPago, d = new Date(base + 'T12:00'); d.setDate(d.getDate() + dias); return ymd(d); };
  const activar = (c, p) => { const hasta = hastaDe(c, p.f, p.dias); (c.pagos ??= []).push({ id: uid(), f: p.f, monto: p.monto, metodo: p.metodo, ref: p.ref || '', dias: p.dias, prev: c.vence || '', hasta }); c.vence = hasta; c.estado = 'activo'; return hasta; };
  const anularPago = c => { const p = (c.pagos || []).pop(); if (p) c.vence = p.prev || ''; return p; };
  const msgActiva = c => `Hola ${c.nombre.split(' ')[0]}, recibí tu pago ✅ Tu mensualidad está activa hasta el ${fecha(c.vence)}. ¡A entrenar! 💪`;
  const dinero = n => '$' + (+n).toFixed(2).replace('.', ',').replace(/,00$/, '');
  const renovar = (c, dias = 30) => { const b = c.vence && c.vence > hoy() ? new Date(c.vence + 'T12:00') : new Date(); b.setDate(b.getDate() + dias); c.vence = ymd(b); };
  const notificar = (clave, titulo, cuerpo) => { try { if (!('Notification' in window) || Notification.permission !== 'granted') return; const k = 'cs_nt_' + clave + '_' + hoy(); if (localStorage.getItem(k)) return; localStorage.setItem(k, '1'); new Notification(titulo, { body: cuerpo, icon: 'assets/carlos.jpg' }); } catch (e) {} };
  /* siluetas de ejemplo para la demo de fotos */
  const silueta = (vista, k) => { const w = 38 * k, sh = vista === 'lateral' ? 20 : w * 1.15, p = vista === 'lateral' ? 24 * k : w * .75;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320"><rect width="240" height="320" fill="#0b1a22"/><rect x="0" y="296" width="240" height="24" fill="#12303b"/><g fill="#19e3ee" fill-opacity=".85"><circle cx="120" cy="52" r="20"/><rect x="${120 - sh}" y="76" width="${sh * 2}" height="100" rx="26"/><rect x="${120 - p}" y="172" width="${p * 2}" height="40" rx="14"/><rect x="${120 - p + 2}" y="208" width="${p - 6}" height="88" rx="9"/><rect x="${124}" y="208" width="${p - 6}" height="88" rx="9"/></g><text x="120" y="312" fill="#8fb0b8" font-size="11" text-anchor="middle" font-family="sans-serif">foto de ejemplo · ${vista}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg); };
  /* reduce la foto antes de subirla (ahorra datos y espacio) */
  const comprimir = async (file, max = 1280, q = .82) => { const bm = await createImageBitmap(file, { imageOrientation: 'from-image' }), k = Math.min(1, max / Math.max(bm.width, bm.height)), cv = document.createElement('canvas');
    cv.width = Math.round(bm.width * k); cv.height = Math.round(bm.height * k); cv.getContext('2d').drawImage(bm, 0, 0, cv.width, cv.height);
    return new Promise((ok, no) => cv.toBlob(b => b ? ok(b) : no(new Error('No se pudo procesar la foto.')), 'image/jpeg', q)); };
  const blobUrl = b => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); });
  /* ---- temporizadores y registro de series ---- */
  const seg = t => { const m = String(t || '').match(/(\d+)(?:\s*-\s*(\d+))?\s*(min|m|s|seg)\b/i); if (!m) return 90; const a = +m[1], b = m[2] ? +m[2] : a, u = /^m/i.test(m[3]) ? 60 : 1; return Math.max(10, Math.round((a + b) / 2 * u / 15) * 15); };
  const trabajo = r => { const m = String(r || '').match(/^\s*(\d+)\s*(s|seg)\b/i); return m ? +m[1] : null; };   // "45 s" => ejercicio por tiempo
  const nSeries = x => Math.max(1, Math.min(12, parseInt(x.series) || 3));
  const repsObj = r => { const m = String(r || '').match(/\d+/); return m ? +m[0] : ''; };
  const SR = {
    mejor: (L, e) => L.filter(x => x.e === e).reduce((m, x) => !m || x.kg > m.kg || (x.kg === m.kg && x.r > m.r) ? x : m, null),
    sesiones: (L, e) => { const o = {}; L.filter(x => x.e === e).forEach(x => (o[x.f] ??= []).push(x)); return Object.keys(o).sort().map(f => ({ f, sets: o[f].sort((a, b) => a.s - b.s), max: Math.max(...o[f].map(x => x.kg)) })); },
    ejercicios: L => [...new Set(L.map(x => x.e))]
  };
  /* ---- almacenamiento ---- */
  function semilla() {
    const mk = (id, nombre, sx, nac, cm, obj, mod, tel, ml) => ({ id, nombre, sx, nac, cm, obj, mod, tel, nivel: 'Intermedio', lesiones: '', inicio: dias(70), estado: 'activo', parq: { corazon: false, dolor: false, mareo: false, hueso: false, medic: false, embarazo: false }, notas: '', rutina: null, plan: null, supl: [], medidas: ml, evals: [], sesiones: [] });
    const A = mk('c1', 'Mateo Andrade', 'M', '1996-04-12', 176, 'volumen', 'presencial', '593991112233', [
      { f: dias(62), kg: 71.2, gr: 17.5, mm: 31.4, vis: 6, agua: 52 }, { f: dias(32), kg: 73.6, gr: 16.9, mm: 33.0, vis: 5, agua: 53 }, { f: dias(3), kg: 75.4, gr: 16.2, mm: 34.5, vis: 5, agua: 53.4 }]);
    A.rutina = JSON.parse(JSON.stringify(RUTINAS['Hipertrofia · 4 días'])); A.rutina.obj = 'Ganar masa muscular'; [[0, 0, 35], [0, 1, 30], [0, 2, 24], [0, 3, 45], [0, 4, 15], [0, 5, 20]].forEach(([a, b, kg]) => A.rutina.dias[a].ej[b].kg = kg);
    const t = calc.tmb('M', 75.4, 176, 29) * 1.55; A.plan = planBase(calc.kcalObj(t, 'volumen'), calc.macros(calc.kcalObj(t, 'volumen'), 75.4, 'volumen'));
    A.supl = [{ n: 'Creatina monohidratada', dosis: '5 g', mom: 'Cualquier hora, todos los días' }, { n: 'Proteína whey', dosis: '1 scoop (30 g)', mom: 'Post-entreno o para completar proteína' }];
    A.evals = [{ f: dias(5), nota: 'Buena profundidad en sentadilla. Cuidar rodillas hacia adentro en la subida.', it: [{ id: 'sentadilla', pt: 4, n: 'Rodillas ligeramente adentro' }, { id: 'press-banca', pt: 5, n: 'Excelente trayectoria' }, { id: 'remo-barra', pt: 3, n: 'Espalda redondea con carga alta' }] }];
    A.sesiones = [{ f: dias(2), rpe: 8, n: 'Torso A' }, { f: dias(4), rpe: 7, n: 'Pierna A' }];
    const B = mk('c2', 'Valentina Ruiz', 'F', '1999-09-03', 164, 'definicion', 'virtual', '593984445566', [
      { f: dias(40), kg: 66.8, gr: 31.0, mm: 22.1, vis: 4, agua: 47 }, { f: dias(9), kg: 63.9, gr: 28.2, mm: 22.4, vis: 3, agua: 48.5 }]);
    B.rutina = JSON.parse(JSON.stringify(RUTINAS['Definición · 4 días + cardio'])); B.rutina.obj = 'Perder grasa y tonificar';
    const t2 = calc.tmb('F', 63.9, 164, 26) * 1.375; B.plan = planBase(calc.kcalObj(t2, 'definicion'), calc.macros(calc.kcalObj(t2, 'definicion'), 63.9, 'definicion'));
    const Cc = mk('c3', 'Sebastián Mora', 'M', '1988-01-20', 181, 'salud', 'presencial', '593977778899', []); Cc.nivel = 'Principiante'; Cc.inicio = dias(3); Cc.parq.dolor = true; Cc.lesiones = 'Dolor lumbar ocasional';
    const sembrar = (c, nivel) => { c.marcas = {}; for (let i = 1; i < 28; i++) { const f = dias(i), d = diaDe(c, f); if (!d) continue; const ok = ((i * 37 + c.nombre.length) % 10) < nivel; c.marcas[f] = d.ej.map((_, k) => k).slice(0, ok ? d.ej.length : Math.floor(d.ej.length / 2)); if (ok) c.marcas['m' + f] = [0, 1, 2, 3]; } };
    sembrar(A, 9); sembrar(B, 6);
    try { if (!localStorage.getItem('cs_ficha_c1')) localStorage.setItem('cs_ficha_c1', JSON.stringify({ completa: true, datos: { v: 1, fecha: dias(70), consent: dias(70),
      cuerpo: { peso: 71.2, estatura: 176, grasa: 17.5, edad: 29, peso3m: 69, pesoMax: 74 },
      dieta: [{ h: '07:00', d: '3 huevos + 2 tostadas integrales (60 g) + 1 plátano' }, { h: '13:00', d: 'Arroz 200 g, pechuga 150 g, ensalada' }, { h: '20:00', d: 'Atún 1 lata, pan 80 g, aguacate 50 g' }], dietaNotas: 'Fines de semana como fuera de casa.',
      entreno: { dias: { 0: 'Pecho y tríceps · press banca 4×8, aperturas 3×12 · descanso 90 s · tempo 2-0-1', 2: 'Espalda y bíceps · dominadas 4×6, remo 4×8', 4: 'Pierna · sentadilla 4×8, prensa 3×12' }, pesasH: '18:00', pesasDur: '75 min', cardioH: '07:00 (sábado)', cardioDur: '30 min' },
      rutina: { levanta: '06:00', acuesta: '22:30', trabajo: '08:30 a 17:30', trabajoFisico: 'no', trabajoDetalle: 'Trabajo de oficina' },
      comida: { prefer: 'Pollo, arroz, huevos, aguacate, frutas', rechaza: 'Hígado, coliflor', alergias: 'Ninguna', intol: 'Lactosa (leve)', liquidos: 2.5 },
      salud: { lesiones: 'Molestia en hombro derecho (2022), ya recuperada.', fam: { hipertension: true }, famOtros: '', meds: 'no', medsLista: [] } } })); } catch (e) {}
    A.vence = dias(-5); B.vence = dias(-22); Cc.vence = dias(-27);   // A vence en 5 días: se ve el aviso
    A.pagos = [{ id: 'p1', f: dias(55), monto: 45, metodo: 'Transferencia', ref: 'TR-0987', dias: 30, prev: '', hasta: dias(25) }, { id: 'p2', f: dias(25), monto: 45, metodo: 'Transferencia', ref: 'TR-1042', dias: 30, prev: dias(25), hasta: dias(-5) }];
    B.pagos = [{ id: 'p3', f: dias(8), monto: 45, metodo: 'Transferencia', ref: 'TR-1100', dias: 30, prev: '', hasta: dias(-22) }];
    A.medcorp = [{ f: dias(62), cuello: 37, hombros: 112, pecho: 98, brazo: 32, cintura: 82, abdomen: 86, cadera: 98, muslo: 56, pantorrilla: 37 }, { f: dias(32), cuello: 37.5, hombros: 114, pecho: 100, brazo: 33.5, cintura: 81, abdomen: 84, cadera: 99, muslo: 57, pantorrilla: 37.5 }, { f: dias(3), cuello: 38, hombros: 116, pecho: 102, brazo: 35, cintura: 80, abdomen: 83, cadera: 100, muslo: 58.5, pantorrilla: 38 }];
    B.medcorp = [{ f: dias(40), cuello: 31, hombros: 98, pecho: 92, brazo: 28, cintura: 78, abdomen: 88, cadera: 102, muslo: 60, pantorrilla: 36 }, { f: dias(9), cuello: 30.5, hombros: 98, pecho: 90, brazo: 27.5, cintura: 73, abdomen: 82, cadera: 99, muslo: 58, pantorrilla: 35.5 }];
    return { clientes: [A, B, Cc], custom: [] };
  }
  const LS = { get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }, set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} } };
  /* ---- Supabase (REST sin librería). Sin url/anonKey en config.js = modo demo ---- */
  const SB = C.supabase || {}, remoto = !!(SB.url && SB.anonKey), SES = 'cs_sesion';
  const ses = { get() { try { return JSON.parse(localStorage.getItem(SES)); } catch (e) { return null; } }, set(v) { try { v ? localStorage.setItem(SES, JSON.stringify(v)) : localStorage.removeItem(SES); } catch (e) {} } };
  const guardarSes = j => ses.set({ at: j.access_token, rt: j.refresh_token });
  async function refrescar() { const s = ses.get(); if (!s || !s.rt) return false;
    const r = await fetch(`${SB.url}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: { apikey: SB.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.rt }) }).catch(() => null);
    if (!r || !r.ok) { ses.set(null); return false; } guardarSes(await r.json()); return true; }
  async function http(path, o = {}) {
    const ir = () => { const s = ses.get(); return fetch(`${SB.url}${path}`, { method: o.method || 'GET', keepalive: !!o.keepalive, headers: Object.assign({ apikey: SB.anonKey, Authorization: 'Bearer ' + (s && !o.anon ? s.at : SB.anonKey), 'Content-Type': 'application/json', 'Content-Profile': SB.schema, 'Accept-Profile': SB.schema }, o.prefer ? { Prefer: o.prefer } : {}), body: o.body ? JSON.stringify(o.body) : undefined }); };
    let r = await ir(); if (r.status === 401 && ses.get() && await refrescar()) r = await ir();
    const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
    if (!r.ok) { const e = new Error((j && (j.message || j.msg)) || 'Error de conexión'); e.status = r.status; throw e; } return j; }
  const api = { activo: remoto, hayCuenta: () => !!ses.get(), salir() { ses.set(null); },
    async login(correo, clave) { const r = await fetch(`${SB.url}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: SB.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: correo, password: clave }) });
      if (!r.ok) throw new Error('Correo o clave incorrectos.'); guardarSes(await r.json()); },
    async registrar(correo, clave) { const r = await fetch(`${SB.url}/auth/v1/signup`, { method: 'POST', headers: { apikey: SB.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: correo, password: clave }) });
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(/registered|exists/i.test(j.msg || j.message || j.error_description || '') ? 'Ese correo ya tiene cuenta: ingresa con tu clave.' : (j.msg || j.message || 'No se pudo crear la cuenta.'));
      if (j.access_token) { guardarSes(j); return true; } return false; },
    async cambiarClave(nueva, token) { const r = await fetch(`${SB.url}/auth/v1/user`, { method: 'PUT', headers: { apikey: SB.anonKey, Authorization: 'Bearer ' + (token || (ses.get() || {}).at), 'Content-Type': 'application/json' }, body: JSON.stringify({ password: nueva }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(/same|different/i.test(j.msg || j.message || '') ? 'La clave nueva debe ser distinta a la anterior.' : /weak|short|least/i.test(j.msg || j.message || '') ? 'La clave es muy débil: usa al menos 8 caracteres con letras y números.' : (j.msg || j.message || 'No se pudo cambiar la clave.')); } },
    async recuperar(correo) { await fetch(`${SB.url}/auth/v1/recover`, { method: 'POST', headers: { apikey: SB.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: correo }) }); },
    rest: (p, o) => http('/rest/v1/' + p, o), rpc: (fn, args, o) => http('/rest/v1/rpc/' + fn, Object.assign({ method: 'POST', body: args || {} }, o)) };
  const sha256 = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
  const token = () => { const u = crypto.getRandomValues(new Uint8Array(32)); return btoa(String.fromCharCode(...u)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  let db = remoto ? { clientes: [], custom: [] } : (LS.get() || semilla()), snap = new Map(), snapC = new Map(), vinc = new Map(), tmr = null, estadoFn = () => {};
  const regCustom = () => db.custom.forEach(c => { if (!EJ.get(c.id)) { const e = EJ.agregarPersonalizado(c); e.id = c.id; } });
  regCustom();
  async function flush() {
    try { for (const c of db.clientes) { const s = JSON.stringify(c); if (snap.get(c.id) !== s) { await api.rest('clientes?on_conflict=id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: { id: c.id, datos: c, activo: c.estado === 'activo' } }); snap.set(c.id, s); } }
      for (const x of db.custom) { const s = JSON.stringify(x); if (snapC.get(x.id) !== s) { await api.rest('ejercicios_custom?on_conflict=id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: { id: x.id, datos: x } }); snapC.set(x.id, s); } }
      estadoFn('ok'); } catch (e) { estadoFn('error', e.message); } }
  const Store = { db: () => db, remoto, api, estado(fn) { estadoFn = fn; },
    async init() { if (!remoto) return; const f = await api.rest('clientes?select=id,datos,user_id,codigo_hash&order=created_at.desc'), x = await api.rest('ejercicios_custom?select=id,datos');
      db = { clientes: f.map(r => Object.assign({}, r.datos, { id: r.id })), custom: x.map(r => r.datos) }; vinc = new Map(f.map(r => [r.id, { vinculado: !!r.user_id, codigo: !!r.codigo_hash }])); snap = new Map(db.clientes.map(c => [c.id, JSON.stringify(c)])); snapC = new Map(db.custom.map(c => [c.id, JSON.stringify(c)])); regCustom(); },
    save() { if (!remoto) { LS.set(db); return; } estadoFn('guardando'); clearTimeout(tmr); tmr = setTimeout(flush, 700); }, flush: () => { clearTimeout(tmr); return flush(); },
    fotos: {
      DEMO_KEY: 'cs_fotos_demo', _cache: {},
      _ls() { try { return JSON.parse(localStorage.getItem('cs_fotos_demo')) || {}; } catch (e) { return {}; } },
      async lista(cid, coach) { if (remoto) return coach ? (await api.rest(`fotos?cliente_id=eq.${encodeURIComponent(cid)}&order=fecha.desc&select=fecha,vista`)).map(x => ({ f: x.fecha, v: x.vista })) : await api.rpc('mis_fotos');
        const out = [], L = Store.fotos._ls()[cid] || {}; Object.keys(L).forEach(f => Object.keys(L[f]).forEach(v => out.push({ f, v })));
        if (cid === 'c1') [dias(42), dias(7)].forEach((f, i) => ['frente', 'lateral', 'espalda'].forEach(v => out.push({ f, v, demo: i }))); return out.sort((x, y) => x.f < y.f ? 1 : -1); },
      async estado(fecha) { if (remoto) { const r = await api.rest(`fotos?fecha=eq.${fecha}&select=cliente_id,vista`), o = {}; r.forEach(x => o[x.cliente_id] = (o[x.cliente_id] || 0) + 1); return o; }
        const L = Store.fotos._ls(), o = {}; Object.keys(L).forEach(cid => { const n = Object.keys(L[cid][fecha] || {}).length; if (n) o[cid] = n; }); return o; },
      async subir(cid, fecha, vista, file) {
        if (!remoto) { const b = await comprimir(file, 800, .7), u = await blobUrl(b), L = Store.fotos._ls(); (L[cid] ??= {})[fecha] ??= {}; L[cid][fecha][vista] = u;
          try { localStorage.setItem('cs_fotos_demo', JSON.stringify(L)); } catch (e) { throw new Error('No hay espacio en el navegador para más fotos de la demo.'); } return; }
        const b = await comprimir(file), path = `${cid}/${fecha}/${vista}.jpg`;
        const ir = () => fetch(`${SB.url}/storage/v1/object/fotos/${path}`, { method: 'POST', headers: { apikey: SB.anonKey, Authorization: 'Bearer ' + ses.get().at, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }, body: b });
        let r = await ir(); if (r.status === 401 && await refrescar()) r = await ir(); if (!r.ok) throw new Error('No se pudo subir la foto (' + r.status + ').');
        if (!(await api.rpc('registrar_foto', { p_fecha: fecha, p_vista: vista, p_path: path }))) throw new Error('La foto no se pudo registrar.'); delete Store.fotos._cache[path]; },
      async url(cid, f, v, demo) { if (!remoto) { const x = (Store.fotos._ls()[cid] || {})[f]; return x && x[v] ? x[v] : silueta(v, demo === 0 ? 1.18 : 1); }
        const path = `${cid}/${f}/${v}.jpg`, c = Store.fotos._cache[path]; if (c) return c;
        const ir = () => fetch(`${SB.url}/storage/v1/object/sign/fotos/${path}`, { method: 'POST', headers: { apikey: SB.anonKey, Authorization: 'Bearer ' + ses.get().at, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 3600 }) });
        let r = await ir(); if (r.status === 401 && await refrescar()) r = await ir(); if (!r.ok) return ''; const j = await r.json(); return Store.fotos._cache[path] = SB.url + '/storage/v1' + j.signedURL; }
    },
    series: {
      _ls(cid) { try { return JSON.parse(localStorage.getItem('cs_series_' + cid)) || []; } catch (e) { return []; } },
      _demo(cid) { const c = Store.cliente(cid); if (!c || !c.rutina || cid !== 'c1') return []; const out = [];
        for (let i = 1; i < 42; i++) { const f = dias(i), d = diaDe(c, f); if (!d) continue; const hechos = (c.marcas || {})[f] || [];
          d.ej.forEach((x, j) => { if (!hechos.includes(j) || trabajo(x.reps)) return; const sem = Math.floor(i / 7), base = Math.max(5, (+x.kg || 20) - sem * 2.5), r0 = repsObj(x.reps) || 10;
            for (let s = 1; s <= nSeries(x); s++) out.push({ f, e: x.id, s, kg: base, r: Math.max(1, r0 - (s > 3 ? 1 : 0)) }); }); } return out; },
      async cargar(cid, coach) { if (remoto) return coach ? (await api.rest(`series?cliente_id=eq.${encodeURIComponent(cid)}&order=fecha.desc&limit=3000&select=fecha,ejercicio,serie,kg,reps`)).map(x => ({ f: x.fecha, e: x.ejercicio, s: x.serie, kg: +x.kg, r: x.reps })) : (await api.rpc('mis_series', { p_desde: dias(120) })).map(x => ({ f: x.f, e: x.e, s: x.s, kg: +x.kg, r: x.r }));
        return Store.series._demo(cid).concat(Store.series._ls(cid)); },
      async guardar(cid, f, e, s, kg, r) { if (remoto) { if (!(await api.rpc('guardar_serie', { p_fecha: f, p_ej: e, p_serie: s, p_kg: kg, p_reps: r }))) throw new Error('No se pudo guardar la serie.'); return; }
        const L = Store.series._ls(cid).filter(x => !(x.f === f && x.e === e && x.s === s)); L.push({ f, e, s, kg, r }); try { localStorage.setItem('cs_series_' + cid, JSON.stringify(L)); } catch (x) {} }
    },
    ficha: {
      _ls(cid) { try { return JSON.parse(localStorage.getItem('cs_ficha_' + cid)); } catch (e) { return null; } },
      async cargar(cid, coach) { if (remoto) { if (coach) { const r = await api.rest(`fichas?cliente_id=eq.${encodeURIComponent(cid)}&select=datos,completa`); return r[0] || null; } return await api.rpc('mi_ficha'); } return Store.ficha._ls(cid); },
      async guardar(cid, datos, completa) { if (remoto) { if (!(await api.rpc('guardar_ficha', { p_datos: datos, p_completa: completa }))) throw new Error('No se pudo guardar la ficha.'); return; }
        try { localStorage.setItem('cs_ficha_' + cid, JSON.stringify({ datos, completa })); } catch (e) { throw new Error('No hay espacio en el navegador.'); } },
      async estado() { if (remoto) { const r = await api.rest('fichas?select=cliente_id,completa'), o = {}; r.forEach(x => o[x.cliente_id] = x.completa); return o; } const o = {}; db.clientes.forEach(c => { const f = Store.ficha._ls(c.id); if (f) o[c.id] = f.completa; }); return o; }
    },
    examenes: {
      _ls(cid) { try { return JSON.parse(localStorage.getItem('cs_exam_' + cid)) || []; } catch (e) { return []; } },
      async lista(cid, coach) { if (remoto) return coach ? (await api.rest(`examenes?cliente_id=eq.${encodeURIComponent(cid)}&order=created_at.desc&select=id,nombre,created_at,path`)).map(x => ({ id: x.id, n: x.nombre, f: x.created_at.slice(0, 10), p: x.path })) : await api.rpc('mis_examenes'); return Store.examenes._ls(cid); },
      async subir(cid, file) { const tipos = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' }; let ext = tipos[file.type]; if (!ext) throw new Error('Solo PDF o foto (JPG/PNG).');
        let blob = file; if (ext !== 'pdf') { blob = await comprimir(file, 1800, .85); ext = 'jpg'; } if (blob.size > (remoto ? 10485760 : 1500000)) throw new Error(remoto ? 'El archivo pesa más de 10 MB.' : 'En la demo el límite es 1,5 MB.');
        const nombre = (file.name || 'Examen').replace(/\.[^.]+$/, '').slice(0, 100) || 'Examen';
        if (!remoto) { const L = Store.examenes._ls(cid); L.unshift({ id: uid(), n: nombre, f: hoy(), u: await blobUrl(blob) }); try { localStorage.setItem('cs_exam_' + cid, JSON.stringify(L)); } catch (e) { throw new Error('No hay espacio en el navegador.'); } return; }
        const path = `${cid}/${crypto.randomUUID()}.${ext}`, ir = () => fetch(`${SB.url}/storage/v1/object/examenes/${path}`, { method: 'POST', headers: { apikey: SB.anonKey, Authorization: 'Bearer ' + ses.get().at, 'Content-Type': blob.type || 'application/pdf' }, body: blob });
        let r = await ir(); if (r.status === 401 && await refrescar()) r = await ir(); if (!r.ok) throw new Error('No se pudo subir el archivo (' + r.status + ').');
        if (!(await api.rpc('registrar_examen', { p_nombre: nombre, p_path: path }))) throw new Error('No se pudo registrar el examen.'); },
      async url(x) { if (!remoto) return x.u; const ir = () => fetch(`${SB.url}/storage/v1/object/sign/examenes/${x.p}`, { method: 'POST', headers: { apikey: SB.anonKey, Authorization: 'Bearer ' + ses.get().at, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 600 }) });
        let r = await ir(); if (r.status === 401 && await refrescar()) r = await ir(); if (!r.ok) return ''; return SB.url + '/storage/v1' + (await r.json()).signedURL; }
    },
    vinculo: id => vinc.get(id) || {},
    async nuevoCodigo(id) { const t = token(); await api.rest('clientes?id=eq.' + encodeURIComponent(id), { method: 'PATCH', prefer: 'return=minimal', body: { codigo_hash: await sha256(t) } }); vinc.set(id, Object.assign({}, vinc.get(id), { codigo: true })); return t; },
    async desvincular(id) { await api.rest('clientes?id=eq.' + encodeURIComponent(id), { method: 'PATCH', prefer: 'return=minimal', body: { user_id: null, codigo_hash: null } }); vinc.set(id, {}); },
    async actividadTodos() { if (!remoto) return Object.fromEntries(db.clientes.map(c => [c.id, c.marcas || {}]));
      const r = await api.rest(`marcas?fecha=gte.${dias(28)}&select=cliente_id,fecha,clave&limit=5000`), o = {};
      r.forEach(x => { const k = x.clave[0] === 'm' ? 'm' + x.fecha : x.fecha; ((o[x.cliente_id] ??= {})[k] ??= []).push(+x.clave.slice(1)); }); return o; },
    async actividad(id) { const q = encodeURIComponent(id); const [m, r] = await Promise.all([api.rest(`marcas?cliente_id=eq.${q}&order=fecha.desc&limit=300`), api.rest(`reportes?cliente_id=eq.${q}&order=created_at.desc&limit=15`)]); return { marcas: m, reportes: r }; },
    miPlan: () => api.rpc('mi_plan'), reclamar: c => api.rpc('reclamar', { p_codigo: c }),
    marcar: (f, k, on) => api.rpc('marcar', { p_fecha: f, p_clave: k, p_on: on }), marcas: d => api.rpc('mis_marcas', { p_desde: d }),
    reportar: (peso, rpe, nota) => api.rpc('reportar', { p_peso: peso || null, p_rpe: rpe || null, p_nota: nota || '' }),
    reset() { if (remoto) return; db = semilla(); LS.set(db); }, cliente: id => db.clientes.find(c => c.id === id),
    nuevo() { const c = { id: remoto ? crypto.randomUUID() : uid(), nombre: 'Nuevo cliente', sx: 'M', nac: '1995-01-01', cm: 170, obj: 'salud', mod: 'presencial', tel: '', nivel: 'Principiante', lesiones: '', inicio: hoy(), estado: 'activo', parq: {}, notas: '', rutina: null, plan: null, supl: [], medidas: [], evals: [], sesiones: [], consent: '', vence: (() => { const d = new Date(); d.setDate(d.getDate() + (C.diasPrimerMes ?? 30)); return ymd(d); })() }; db.clientes.unshift(c); Store.save(); return c; } };
  /* ---- semáforo de seguimiento ---- */
  const pend = c => { const u = c.medidas.at(-1), e = c.evals.at(-1);
    return { inbody: !u || (Date.now() - new Date(u.f)) / 864e5 > 30, eval: !e || (Date.now() - new Date(e.f)) / 864e5 > 7, riesgo: Object.values(c.parq || {}).some(Boolean) }; };
  /* ---- PDF: documento imprimible → "Guardar como PDF" ---- */
  const cab = (t, c) => `<div class="cab"><div><h1>${esc(t)}</h1><small>${esc(c.nombre)} · ${esc(fecha(hoy()))}</small></div><div style="text-align:right"><b>${esc(C.nombre)}</b><br><small>${esc(C.titulo)} · WhatsApp +${esc(C.wa)}<br>@${esc(C.ig)}</small></div></div>`;
  const pie = `<div class="pie">Programa personalizado. Detén el ejercicio y consulta si sientes dolor agudo, mareo o falta de aire. Este documento no sustituye una valoración médica. Escríbele a tu coach por WhatsApp para dudas o ajustes.</div>`;
  const Doc = {
    rutina(c) { const r = c.rutina; if (!r) return '<p>Sin rutina asignada.</p>';
      return `<div class="doc">${cab('Rutina · ' + r.nombre, c)}<p><b>Objetivo:</b> ${esc(r.obj || c.obj)} · <b>Duración:</b> ${esc(r.semanas)} semanas · <b>Nivel:</b> ${esc(c.nivel)}</p>` +
        r.dias.map((di, di_i) => `<h2>${esc(di.nombre)} — ${esc(di.foco)} <small>(${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][diaSem(r, di_i)] || ''})</small></h2>` + di.ej.map(x => { const e = EJ.get(x.id); if (!e) return '';
          return `<div class="ex">${EJ.frames(e)}<div><b>${esc(e.n)}</b><br><small>${esc(e.mus)}</small><br><b>${esc(x.series)} × ${esc(x.reps)}</b>${x.kg ? ' · ' + esc(x.kg) + ' kg' : ''} · descanso ${esc(x.desc)}${x.nota ? `<br><i>${esc(x.nota)}</i>` : ''}<ol style="margin:4px 0 0 16px;padding:0;font-size:9.5pt">${e.pasos.map(p => `<li>${esc(p)}</li>`).join('')}</ol><small>⚠ ${esc(e.err[0] || '')}</small></div></div>`; }).join('')).join('') + pie + '</div>'; },
    plan(c) { const p = c.plan; if (!p) return '<p>Sin plan alimenticio asignado.</p>';
      return `<div class="doc">${cab('Plan alimenticio', c)}<table><tr><th>Calorías</th><th>Proteína</th><th>Carbohidratos</th><th>Grasas</th><th>Agua</th></tr><tr><td>${esc(p.kcal)} kcal</td><td>${esc(p.p)} g</td><td>${esc(p.c)} g</td><td>${esc(p.g)} g</td><td>${esc(p.agua)}</td></tr></table>` +
        p.comidas.map(m => `<h2>${esc(m.h)} · ${esc(m.n)}</h2><ul>${m.it.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`).join('') +
        (p.notas ? `<h2>Indicaciones</h2><p>${esc(p.notas)}</p>` : '') + (c.supl.length ? `<h2>Suplementación</h2><table><tr><th>Producto</th><th>Dosis</th><th>Cuándo</th></tr>${c.supl.map(s => `<tr><td>${esc(s.n)}</td><td>${esc(s.dosis)}</td><td>${esc(s.mom)}</td></tr>`).join('')}</table>` : '') + pie + '</div>'; },
    progreso(c) { const m = c.medidas; return `<div class="doc">${cab('Reporte de progreso', c)}${m.length ? `<table><tr><th>Fecha</th><th>Peso (kg)</th><th>% grasa</th><th>Masa muscular (kg)</th><th>Grasa visceral</th><th>Agua %</th></tr>${m.map(x => `<tr><td>${esc(fecha(x.f))}</td><td>${esc(x.kg)}</td><td>${esc(x.gr)}</td><td>${esc(x.mm)}</td><td>${esc(x.vis)}</td><td>${esc(x.agua)}</td></tr>`).join('')}</table>` : '<p>Aún no hay chequeos InBody.</p>'}` +
        (c.medcorp && c.medcorp.length ? `<h2>Medidas corporales (cm)</h2><table><tr><th>Fecha</th>${MC.map(x => `<th>${x[1]}</th>`).join('')}</tr>${c.medcorp.map(m => `<tr><td>${esc(fecha(m.f))}</td>${MC.map(x => `<td>${esc(m[x[0]] ?? '—')}</td>`).join('')}</tr>`).join('')}</table>` : '') +
        c.evals.slice(-3).map(e => `<h2>Evaluación técnica · ${esc(fecha(e.f))}</h2><p>${esc(e.nota)}</p><table><tr><th>Ejercicio</th><th>Técnica (1-5)</th><th>Comentario</th></tr>${e.it.map(i => `<tr><td>${esc(EJ.get(i.id)?.n || i.id)}</td><td>${esc(i.pt)}</td><td>${esc(i.n)}</td></tr>`).join('')}</table>`).join('') + pie + '</div>'; },
    imprimir(html, titulo) { const r = document.getElementById('print-root'); r.innerHTML = html; const t = document.title; document.title = titulo; window.print(); document.title = t; setTimeout(() => r.innerHTML = '', 500); }
  };
  /* ---- enlace del cliente: el plan viaja dentro del link (sin servidor) ---- */
  const b64 = u8 => btoa(String.fromCharCode(...u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const Link = {
    paquete: c => { const ok = activa(c); return ({ v: 1, activa: ok, nombre: c.nombre, obj: c.obj, nivel: c.nivel, rutina: ok ? c.rutina : null, plan: ok ? c.plan : null, supl: ok ? c.supl : [], medidas: ok ? c.medidas.slice(-6) : [], evals: ok ? c.evals.slice(-3) : [], cm: c.cm, sx: c.sx, cid: c.id, vence: c.vence, medcorp: ok ? (c.medcorp || []).slice(-6) : [], marcas: c.marcas || {}, creado: hoy(), custom: (db.custom || []).filter(x => (c.rutina?.dias || []).some(dd => dd.ej.some(e => e.id === x.id))) }); },
    async codificar(o) { const u = new TextEncoder().encode(JSON.stringify(o));
      if (window.CompressionStream) { const cs = new Response(new Blob([u]).stream().pipeThrough(new CompressionStream('gzip'))); return 'g.' + b64(new Uint8Array(await cs.arrayBuffer())); }
      return 'j.' + b64(u); },
    async decodificar(s) { const [t, v] = [s.slice(0, 2), s.slice(2)]; let u = unb64(v);
      if (t === 'g.') u = new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
      return JSON.parse(new TextDecoder().decode(u)); },
    async url(c) { return new URL('cliente.html', location.href).href + '#p=' + await Link.codificar(Link.paquete(c)); }
  };
  const wa = (tel, txt) => `https://wa.me/${tel}?text=${encodeURIComponent(txt)}`;
  const ICONOS = { apple: 'M12 7c-2-2-6-1-6 4 0 4 3 9 5 9 .8 0 1-.5 2-.5s1.2.5 2 .5c2 0 5-5 5-9 0-5-4-6-6-4zM12 7c0-2 1-4 3-4', plate: 'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0zM8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0z', scale: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8 9a4 3 0 0 1 8 0M12 9l2-2', chat: 'M4 5h16v11H9l-5 4zM8 10h8', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6', dumbbell: 'M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12', check: 'M4 12l5 5L20 6', pin: 'M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', pill: 'M8 3l13 13a4 4 0 0 1-6 6L2 9a4 4 0 0 1 6-6zM8 9l5 5' };
  const ico = n => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONOS[n] || ICONOS.check}"/></svg>`;
  window.CS = { activa, hastaDe, activar, anularPago, msgActiva, dinero, blobUrl, seg, trabajo, nSeries, repsObj, SR, ymd, MC, DIAS_N, ventana, venceDias, msgVence, msgCheckin, renovar, notificar, comprimir, M, diaDe, dias, remoto, diaSem, esc, hoy, uid, fecha, RUTINAS, calc, ACT, planBase, Store, pend, Doc, Link, wa, ico };
})();
