/* Exotic Açaí · núcleo compartido (landing, flujo y admin)
   Fase 1: datos mock (data/seed.js) + localStorage. Fase 2: reemplazar este archivo por llamadas a Supabase. */
(function () {
  'use strict';
  const CFG = window.CFG, SEED = window.EA_SEED || { subs: [], pagos: [], funnel: [], platos: [], semana: {}, gastos: [], categorias: [] };
  const EA = (window.EA = {});
  const P = 'ea_demo1_';

  /* ───────── utilidades ───────── */
  EA.$ = (s, r) => (r || document).querySelector(s);
  EA.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  EA.esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf = (d) => new Intl.NumberFormat('es-EC', { minimumFractionDigits: d, maximumFractionDigits: d });
  const nfs = {};
  const num = (n, d = 0) => (nfs[d] || (nfs[d] = nf(d))).format(n || 0);
  EA.fmt = {
    num,
    money: (n, d = 2) => '$' + num(n, d),
    pct: (n, d = 1) => num(n, d) + '%',
    fecha: (iso) => { if (!iso) return '—'; const d = EA.D(iso); return d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear(); },
    fechaCorta: (iso) => { const d = EA.D(iso); return d.getDate() + ' ' + MESES[d.getMonth()]; },
    mes: (iso) => { const d = EA.D(iso); return MESES[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2); },
    mesLargo: (iso) => { const d = EA.D(iso); return MESES_L[d.getMonth()] + ' ' + d.getFullYear(); }
  };
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  EA.DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  EA.D = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  EA.iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  EA.addDias = (iso, n) => { const d = EA.D(iso); d.setDate(d.getDate() + n); return EA.iso(d); };
  EA.addMeses = (iso, k) => { const d = EA.D(iso); const day = Math.min(d.getDate(), 28); const x = new Date(d.getFullYear(), d.getMonth() + k, day, 12); return EA.iso(x); };
  EA.dow = (iso) => EA.D(iso).getDay(); // 0 dom … 6 sáb
  EA.hoy = () => CFG.hoyDemo;
  EA.rango = (a, b) => { const out = []; for (let d = a; d <= b; d = EA.addDias(d, 1)) out.push(d); return out; };
  EA.plan = (id) => CFG.plans[id];
  EA.zona = (id) => CFG.zonas.find((z) => z.id === id);
  EA.slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  EA.precioSub = (planId, frec) => CFG.plans[planId]['precio' + frec];
  EA.porDia = (planId, frec) => EA.precioSub(planId, frec) / CFG.frecuencias[frec].almuerzos;
  EA.neto = (bruto) => bruto / (1 + CFG.negocio.iva);
  EA.wa = (texto) => 'https://wa.me/' + CFG.negocio.whatsapp + (texto ? '?text=' + encodeURIComponent(texto) : '');

  /* ───────── almacenamiento local ───────── */
  const L = {
    get(k, def) { try { const v = localStorage.getItem(P + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) { /* cupo lleno o modo privado */ } },
    del(k) { try { localStorage.removeItem(P + k); } catch (e) {} }
  };
  EA.L = L;
  EA.resetDemo = () => { try { Object.keys(localStorage).filter((k) => k.startsWith(P)).forEach((k) => localStorage.removeItem(k)); sessionStorage.clear(); } catch (e) {} };

  /* ───────── estado compuesto (semilla + cambios del usuario) ───────── */
  EA.state = {};
  EA.reload = () => {
    const sp = L.get('subPatch', {}), pp = L.get('pagoPatch', {}), gx = L.get('gastos', { add: [], edit: {}, del: [] }), pl = L.get('platos', { edit: {}, add: [] });
    const S = EA.state;
    S.subs = SEED.subs.map((s) => Object.assign({}, s, sp[s.id] || {})).concat(L.get('subsNew', []));
    S.pagos = SEED.pagos.map((p) => Object.assign({}, p, pp[p.id] || {})).concat(L.get('pagosNew', []));
    S.gastos = SEED.gastos.filter((g) => !gx.del.includes(g.id)).map((g) => Object.assign({}, g, gx.edit[g.id] || {})).concat(gx.add);
    S.platos = SEED.platos.map((p) => Object.assign({}, p, pl.edit[p.id] || {})).concat(pl.add);
    const mm = L.get('mermas', { add: [], del: [] });
    S.mermas = (SEED.mermas || []).filter((m) => !mm.del.includes(m.id)).concat(mm.add);
    S.cambios = L.get('cambios', {});
    S.votos = L.get('votos', {});
    S.semana = L.get('semana', SEED.semana);
    S.categorias = SEED.categorias;
    S.events = L.get('events', []);
    S.entregas = L.get('entregas', {});
    S.perms = L.get('perms', {});
    EA._cache = {};
  };
  EA.reload();
  EA.plato = (id) => EA.state.platos.find((p) => p.id === id);

  /* mutaciones */
  EA.patchSub = (id, patch) => { const sp = L.get('subPatch', {}); const nuevos = L.get('subsNew', []); const i = nuevos.findIndex((s) => s.id === id); if (i >= 0) { Object.assign(nuevos[i], patch); L.set('subsNew', nuevos); } else { sp[id] = Object.assign(sp[id] || {}, patch); L.set('subPatch', sp); } EA.reload(); };
  EA.patchPago = (id, patch) => { const pp = L.get('pagoPatch', {}); const nuevos = L.get('pagosNew', []); const i = nuevos.findIndex((s) => s.id === id); if (i >= 0) { Object.assign(nuevos[i], patch); L.set('pagosNew', nuevos); } else { pp[id] = Object.assign(pp[id] || {}, patch); L.set('pagoPatch', pp); } EA.reload(); };
  EA.guardarGasto = (g) => { const gx = L.get('gastos', { add: [], edit: {}, del: [] }); const i = gx.add.findIndex((x) => x.id === g.id); if (i >= 0) gx.add[i] = g; else if (g.id && SEED.gastos.some((x) => x.id === g.id)) gx.edit[g.id] = g; else { g.id = 'G' + Date.now().toString(36).toUpperCase(); gx.add.push(g); } L.set('gastos', gx); EA.reload(); };
  EA.borrarGasto = (id) => { const gx = L.get('gastos', { add: [], edit: {}, del: [] }); const i = gx.add.findIndex((x) => x.id === id); if (i >= 0) gx.add.splice(i, 1); else gx.del.push(id); L.set('gastos', gx); EA.reload(); };
  EA.guardarPlato = (p) => { const pl = L.get('platos', { edit: {}, add: [] }); const i = pl.add.findIndex((x) => x.id === p.id); if (i >= 0) pl.add[i] = p; else if (SEED.platos.some((x) => x.id === p.id)) pl.edit[p.id] = p; else { p.id = 'dx' + Date.now().toString(36); pl.add.push(p); } L.set('platos', pl); EA.reload(); return p; };
  EA.guardarMerma = (m) => { const mm = L.get('mermas', { add: [], del: [] }); m.id = 'MN' + Date.now().toString(36).toUpperCase(); mm.add.push(m); L.set('mermas', mm); EA.reload(); };
  EA.borrarMerma = (id) => { const mm = L.get('mermas', { add: [], del: [] }); const i = mm.add.findIndex((x) => x.id === id); if (i >= 0) mm.add.splice(i, 1); else mm.del.push(id); L.set('mermas', mm); EA.reload(); };
  EA.mermasRango = (a, b) => EA.state.mermas.filter((m) => m.f >= a && m.f <= b);
  EA.cambiarPlato = (subId, fecha, platoId) => { const c = L.get('cambios', {}); c[subId] = c[subId] || {}; if (platoId) c[subId][fecha] = platoId; else delete c[subId][fecha]; L.set('cambios', c); EA.reload(); };
  EA.valorarPlato = (subId, fecha, platoId, estrellas, comentario) => {
    const v = L.get('votos', {}); const k = subId + '|' + fecha; if (v[k]) return false; v[k] = estrellas; L.set('votos', v);
    const p = EA.plato(platoId); if (!p) return false; const n = p.votos + 1;
    EA.guardarPlato(Object.assign({}, p, { rating: +((p.rating * p.votos + estrellas) / n).toFixed(2), votos: n, comentarios: (comentario ? [comentario].concat(p.comentarios || []) : p.comentarios || []).slice(0, 8) }));
    return true;
  };
  EA.guardarSemana = (s) => { L.set('semana', s); EA.reload(); };
  EA.marcarEntrega = (fecha, subId, v) => { const e = L.get('entregas', {}); e[fecha] = e[fecha] || {}; if (v) e[fecha][subId] = 1; else delete e[fecha][subId]; L.set('entregas', e); EA.reload(); };
  EA.guardarPerms = (p) => { L.set('perms', p); EA.reload(); };

  /* ───────── seguimiento del embudo (landing + flujo) ───────── */
  const normFuente = (f) => { f = (f || '').toLowerCase(); if (/insta|^ig$/.test(f)) return 'instagram'; if (/whats|^wa$|wsp/.test(f)) return 'whatsapp'; if (/refer|amig/.test(f)) return 'referidos'; return f ? f : 'directo'; };
  EA.fuente = () => {
    let u = null; try { u = JSON.parse(sessionStorage.getItem(P + 'utm') || 'null'); } catch (e) {}
    if (u) return u;
    const q = new URLSearchParams(location.search);
    let fuente = q.get('utm_source'), campana = q.get('utm_campaign') || '';
    if (!fuente) { const r = document.referrer || ''; fuente = /instagram/.test(r) ? 'instagram' : /whatsapp|wa\.me/.test(r) ? 'whatsapp' : 'directo'; }
    u = { fuente: normFuente(fuente), campana, medio: q.get('utm_medium') || '' };
    try { sessionStorage.setItem(P + 'utm', JSON.stringify(u)); } catch (e) {}
    return u;
  };
  EA.track = (tipo, extra) => {
    const u = EA.fuente();
    const ev = Object.assign({ f: EA.hoy(), ts: Date.now(), tipo, fuente: u.fuente, campana: u.campana }, extra || {});
    const evs = L.get('events', []); evs.push(ev); if (evs.length > 800) evs.shift(); L.set('events', evs);
  };
  EA.trackOnce = (tipo, key) => { try { const k = P + 'once_' + (key || tipo); if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); } catch (e) {} EA.track(tipo); };

  /* ───────── lógica de negocio compartida ───────── */
  const feriados = new Set(CFG.feriados);
  EA.activoEn = (s, d) => s.inicio <= d && (!s.fin || d < s.fin);
  EA.enPausa = (s, d) => (s.pausas || []).some((p) => d >= p[0] && (p[1] == null || d < p[1]));
  EA.vigente = (s, d) => EA.activoEn(s, d) && !EA.enPausa(s, d);
  EA.esLaborable = (d) => { const w = EA.dow(d); return w >= 1 && w <= 5 && !feriados.has(d); };
  EA.recibe = (s, d) => { if (!EA.esLaborable(d) || !EA.vigente(s, d)) return false; return s.frec === 20 ? true : [1, 3, 5].includes(EA.dow(d)); };
  EA.entregasDia = (d) => { const c = EA._cache; const k = 'e' + d; if (c[k] == null) c[k] = EA.state.subs.reduce((n, s) => n + (EA.recibe(s, d) ? 1 : 0), 0); return c[k]; };
  EA.proximaRenovacion = (s, desde) => { desde = desde || EA.hoy(); for (let k = 1; k < 60; k++) { const f = EA.addMeses(s.inicio, k); if (f > desde) return f; } return null; };
  /* qué plato recibe un suscriptor un día dado (según su plan y restricciones) */
  EA.platoPara = (s, d) => {
    const camb = EA.state.cambios[s.id] && EA.state.cambios[s.id][d];
    if (camb && EA.plato(camb)) return { plato: EA.plato(camb), ajuste: false, cambiado: true };
    const w = EA.dow(d); const ids = EA.state.semana[String(w)] || []; const dishes = ids.map(EA.plato).filter(Boolean);
    if (!dishes.length) return null;
    const slotPlan = { oficina: 0, fit: 1, especial: 2 }[s.plan];
    const ok = dishes.filter((p) => (s.restricciones || []).every((r) => p.tags.includes(r)));
    if (ok.length) return { plato: ok.find((p) => p.slot === slotPlan) || ok[0], ajuste: false };
    return { plato: dishes.find((p) => p.slot === slotPlan) || dishes[0], ajuste: (s.restricciones || []).length > 0 };
  };

  /* filas de embudo: semilla + eventos en vivo del demo */
  EA.funnelRows = () => {
    if (EA._cache.fr) return EA._cache.fr;
    const rows = SEED.funnel.slice();
    const map = { visita: 'visitas', inicio: 'inicio', paso1: 'p1', paso2: 'p2', paso3: 'p3', paso4: 'p4', pago: 'pago' };
    const idx = {};
    EA.state.events.forEach((e) => {
      const k = e.f + '|' + e.fuente + '|' + (e.campana || ''); const col = map[e.tipo]; if (!col) return;
      if (!idx[k]) { idx[k] = { f: e.f, fuente: e.fuente, campana: e.campana || '', visitas: 0, inicio: 0, p1: 0, p2: 0, p3: 0, p4: 0, pago: 0, live: true }; rows.push(idx[k]); }
      idx[k][col]++;
    });
    EA._cache.fr = rows; return rows;
  };

  /* períodos */
  EA.periodo = (tipo, c) => {
    const hoy = EA.hoy(); let a, b, pa, pb, label;
    const d = EA.D(hoy);
    const ini = (y, m) => EA.iso(new Date(y, m, 1, 12));
    const finMes = (y, m) => EA.iso(new Date(y, m + 1, 0, 12));
    if (tipo === 'hoy') { a = b = hoy; pa = pb = EA.addDias(hoy, -1); label = 'Hoy'; }
    else if (tipo === 'semana') { const lun = EA.addDias(hoy, -((d.getDay() + 6) % 7)); a = lun; b = hoy; pa = EA.addDias(lun, -7); pb = EA.addDias(hoy, -7); label = 'Esta semana'; }
    else if (tipo === 'mes') { a = ini(d.getFullYear(), d.getMonth()); b = hoy; pa = ini(d.getFullYear(), d.getMonth() - 1); const fm = finMes(d.getFullYear(), d.getMonth() - 1); pb = EA.addDias(pa, d.getDate() - 1); if (pb > fm) pb = fm; label = 'Este mes'; }
    else if (tipo === 'mes_ant') { a = ini(d.getFullYear(), d.getMonth() - 1); b = finMes(d.getFullYear(), d.getMonth() - 1); pa = ini(d.getFullYear(), d.getMonth() - 2); pb = finMes(d.getFullYear(), d.getMonth() - 2); label = 'Mes anterior'; }
    else { a = (c && c.a) || EA.addDias(hoy, -29); b = (c && c.b) || hoy; if (a > b) { const t = a; a = b; b = t; } const n = EA.rango(a, b).length; pb = EA.addDias(a, -1); pa = EA.addDias(a, -n); label = 'Personalizado'; }
    return { tipo, a, b, pa, pb, label };
  };

  const suma = (arr, f) => arr.reduce((n, x) => n + f(x), 0);
  EA.snapshot = (d) => { const v = EA.state.subs.filter((s) => EA.vigente(s, d)); return { n: v.length, mrr: suma(v, (s) => EA.neto(s.precio)), costo: suma(v, (s) => EA.plan(s.plan).costo * CFG.frecuencias[s.frec].almuerzos), neto: suma(v, (s) => EA.neto(s.precio)) }; };
  EA.kpisRango = (a, b) => {
    const S = EA.state; const snap = EA.snapshot(b); const ini = EA.snapshot(EA.addDias(a, -1));
    const nuevos = S.subs.filter((s) => s.inicio >= a && s.inicio <= b).length;
    const canc = S.subs.filter((s) => s.fin && s.fin >= a && s.fin <= b).length;
    const pg = S.pagos.filter((p) => p.estado === 'cobrado' && p.f >= a && p.f <= b);
    const cobrado = suma(pg, (p) => p.monto);
    const f = EA.funnelRows().filter((r) => r.f >= a && r.f <= b);
    const visitas = suma(f, (r) => r.visitas), inicios = suma(f, (r) => r.inicio), pagos = suma(f, (r) => r.pago);
    let entregados = 0; EA.rango(a, b).forEach((d) => { entregados += EA.entregasDia(d); });
    return {
      activos: snap.n, nuevos, cancelados: canc, churn: ini.n ? (canc / ini.n) * 100 : 0, mrr: snap.mrr, cobrado,
      margen: snap.neto ? (1 - snap.costo / snap.neto) * 100 : 0, entregados, ticket: pg.length ? cobrado / pg.length : 0,
      visitas, inicios, pagos, conversion: visitas ? (pagos / visitas) * 100 : 0
    };
  };
  EA.valoracionMedia = () => { const p = EA.state.platos; const v = suma(p, (x) => x.votos); return v ? suma(p, (x) => x.rating * x.votos) / v : 0; };
  EA.porcionesDia = (d) => EA.entregasDia(d);
  EA.delta = (cur, prev) => (prev ? ((cur - prev) / prev) * 100 : null);

  /* alertas automáticas del Panel de Resultados */
  EA.alertas = () => {
    const S = EA.state, hoy = EA.hoy(), out = [];
    const fall = S.pagos.filter((p) => p.estado === 'fallido');
    if (fall.length) out.push({ id: 'pagos', icon: 'alert', titulo: fall.length + ' pago' + (fall.length > 1 ? 's fallidos' : ' fallido'), detalle: EA.fmt.money(suma(fall, (p) => p.monto), 0) + ' por recuperar. Revisa en Finanzas › Ingresos.', ir: 'finanzas' });
    const pend = S.pagos.filter((p) => p.estado === 'pendiente');
    if (pend.length) out.push({ id: 'pendientes', icon: 'clock', titulo: pend.length + ' cobros pendientes', detalle: EA.fmt.money(suma(pend, (p) => p.monto), 0) + ' esperando confirmación.', ir: 'finanzas' });
    const lim = EA.addDias(hoy, 7);
    const ven = S.subs.filter((s) => EA.activoEn(s, hoy) && !s.fin).map((s) => ({ s, f: EA.proximaRenovacion(s) })).filter((x) => x.f && x.f <= lim);
    if (ven.length) out.push({ id: 'vencen', icon: 'calendar', titulo: ven.length + ' suscripciones vencen en 7 días', detalle: 'Se renuevan entre el ' + EA.fmt.fechaCorta(EA.addDias(hoy, 1)) + ' y el ' + EA.fmt.fechaCorta(lim) + '. Confirma que el cobro quede listo.', ir: 'suscriptores' });
    S.platos.filter((p) => p.votos >= 10 && p.rating < 3.8).forEach((p) => out.push({ id: 'plato', icon: 'star', titulo: 'Plato con baja valoración: ' + p.nombre, detalle: p.rating.toFixed(1) + ' / 5 con ' + p.votos + ' votos. Leo puede ajustarlo en Menús.', ir: 'menus' }));
    const mS = suma(EA.mermasRango(EA.addDias(hoy, -6), hoy), (m) => m.costo), mP = suma(EA.mermasRango(EA.addDias(hoy, -34), EA.addDias(hoy, -7)), (m) => m.costo) / 4;
    if (mP && mS > mP * 1.5) out.push({ id: 'mermas', icon: 'alert', titulo: 'Las mermas subieron esta semana', detalle: EA.fmt.money(mS, 0) + ' vs ' + EA.fmt.money(mP, 0) + ' de promedio semanal. Revisa los motivos en Cocina › Mermas.', ir: 'cocina' });
    const fr = EA.funnelRows();
    const rate = (a, b) => { const x = fr.filter((r) => r.f >= a && r.f <= b); const v = suma(x, (r) => r.visitas); return v ? suma(x, (r) => r.inicio) / v : 0; };
    const sem = rate(EA.addDias(hoy, -6), hoy), prev = rate(EA.addDias(hoy, -34), EA.addDias(hoy, -7));
    if (prev && sem < prev * 0.8) out.push({ id: 'conversion', icon: 'funnel', titulo: 'Cayó la conversión de visita a inicio', detalle: 'Esta semana ' + EA.fmt.pct(sem * 100) + ' vs ' + EA.fmt.pct(prev * 100) + ' en las 4 semanas previas. Revisa la fuente de las visitas en Marketing.', ir: 'marketing' });
    return out;
  };

  /* suscripción creada desde el flujo */
  EA.crearSuscripcion = (d) => {
    const nuevos = L.get('subsNew', []);
    const n = SEED.subs.length + nuevos.length + 1;
    const s = { id: 'S' + String(n).padStart(3, '0'), nombre: d.nombre, tel: d.tel, email: d.email, plan: d.plan, frec: d.frec, porcion: d.porcion || 'normal', publico: d.publico, restricciones: d.restricciones || [], alergias: d.alergias || [], notas: d.notas || '', zona: d.zona, direccion: d.direccion || '', ventana: d.ventana || '', inicio: d.inicio, fin: null, pausas: [], precio: EA.precioSub(d.plan, d.frec), fuente: EA.fuente().fuente, campana: EA.fuente().campana, demo: true };
    nuevos.push(s); L.set('subsNew', nuevos);
    const pn = L.get('pagosNew', []);
    const extra = (EA.zona(d.zona) || {}).extra || 0;
    const monto = s.precio + extra;
    pn.push({ id: 'PN' + Date.now().toString(36).toUpperCase(), sub: s.id, f: EA.hoy(), plan: s.plan, frec: s.frec, monto, iva: +(monto - EA.neto(monto)).toFixed(2), neto: +EA.neto(monto).toFixed(2), estado: 'cobrado', metodo: 'Tarjeta (simulada)', nuevo: true, demo: true });
    L.set('pagosNew', pn);
    EA.reload();
    return s;
  };

  /* ───────── sesión del admin y permisos ───────── */
  EA.usuario = () => { const id = L.get('user', null); return CFG.equipo.find((u) => u.id === id) || null; };
  EA.login = (id) => L.set('user', id);
  EA.logout = () => L.del('user');
  EA.permisos = (rol) => { const base = CFG.permisos[rol] || {}; if (rol === 'admin') return base; return Object.assign({}, base, EA.state.perms[rol] || {}); };
  EA.nivel = (seccion) => { const u = EA.usuario(); if (!u) return null; const v = EA.permisos(u.rol)[seccion]; return v && v !== 'none' ? v : null; };

  /* ───────── UI compartida ───────── */
  const ICONS = {
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    pot: '<path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"/><path d="M6 17h12"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    funnel: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z"/>',
    coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', check: '<path d="M20 6 9 17l-5-5"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>', back: '<path d="M19 12H5M12 19l-7-7 7-7"/>', down: '<path d="m6 9 6 6 6-6"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    store: '<path d="M3 9l1-5h16l1 5"/><path d="M4 9v11h16V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M10 20v-5h4v5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', plus: '<path d="M5 12h14M12 5v14"/>',
    edit: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/>',
    briefcase: '<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>', pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    sprout: '<path d="M7 20h10M10 20c5.5-2.5.8-6.4 3-10M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8zM14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>', refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>', pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>', card: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>', target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 6v2M12 16v2"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>'
  };
  EA.icon = (n, cls) => '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || '') + '</svg>';

  EA.toast = (msg) => {
    let t = EA.$('#ea-toast'); if (!t) { t = document.createElement('div'); t.id = 'ea-toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on'); clearTimeout(EA._tt); EA._tt = setTimeout(() => t.classList.remove('on'), 2600);
  };
  EA.modal = (opts) => {
    const wrap = document.createElement('div'); wrap.className = 'modal-wrap';
    wrap.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-label="' + EA.esc(opts.title) + '"><header><h3>' + EA.esc(opts.title) + '</h3><button class="icon-btn" data-close aria-label="Cerrar">' + EA.icon('x') + '</button></header><div class="modal-body">' + opts.body + '</div></div>';
    const close = () => { wrap.remove(); document.body.classList.remove('lock'); };
    wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
    document.body.appendChild(wrap); document.body.classList.add('lock');
    if (opts.onOpen) opts.onOpen(wrap, close);
    const f = wrap.querySelector('input,select,textarea,button:not([data-close])'); if (f && !opts.noFocus) f.focus();
    return { el: wrap, close };
  };
  EA.download = (nombre, contenido, mime) => {
    const blob = new Blob([contenido], { type: mime || 'text/csv;charset=utf-8' }); const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  EA.csv = (cols, filas) => '﻿' + [cols.map((c) => c.t).join(',')].concat(filas.map((f) => cols.map((c) => { let v = c.v(f); if (v == null) v = ''; v = String(v).replace(/"/g, '""'); return /[",\n]/.test(v) ? '"' + v + '"' : v; }).join(','))).join('\r\n');
  EA.xls = (titulo, cols, filas) => '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><title>' + EA.esc(titulo) + '</title></head><body><table border="1"><tr>' + cols.map((c) => '<th>' + EA.esc(c.t) + '</th>').join('') + '</tr>' + filas.map((f) => '<tr>' + cols.map((c) => '<td>' + EA.esc(c.v(f)) + '</td>').join('') + '</tr>').join('') + '</table></body></html>';
})();
