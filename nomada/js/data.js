// ============================================================================
//  data.js — ÚNICO punto de acceso a datos de la demo Nómada.
//  MODO DEMO: todo vive en localStorage (clave nomada.demo.db) a partir de data/seed.json.
//  Para conectar Supabase (ver docs/PLAN-CONEXION.md) solo se reemplaza este archivo:
//  las firmas async se mantienen y ninguna otra pantalla toca el almacenamiento.
// ============================================================================

const DB_KEY = 'nomada.demo.db';
const ME_KEY = 'nomada.demo.me';
const DEVICE_KEY = 'nomada.demo.device';
const SESSION_KEY = 'nomada.demo.session';
const DB_VERSION = 3;
const SEED_URL = new URL('../data/seed.json', import.meta.url);

let cache = null;
let loading = null;

// ---------- helpers internos ----------
const DAY = 864e5;
const pad = n => String(n).padStart(2, '0');
const sod = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const eod = d => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const monday = d => { const x = sod(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const diffDays = (a, b) => Math.round((sod(b) - sod(a)) / DAY);
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const digits = s => String(s || '').replace(/\D/g, '');
const uid = (p = 'id') => p + '-' + Math.random().toString(36).slice(2, 8);
const hash = s => { let x = 2166136261; for (const c of String(s)) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return (x >>> 0); };
const clone = o => JSON.parse(JSON.stringify(o));
const deepMerge = (a, b) => { if (Array.isArray(b) || typeof b !== 'object' || b === null) return b; const o = { ...(a || {}) }; for (const k of Object.keys(b)) o[k] = deepMerge(a?.[k], b[k]); return o; };
const idOf = n => 'NOM-' + String(n).padStart(4, '0');
const STAFF = ['Mesero · Andrea', 'Mesero · Luis', 'Mesero · Camilo'];

// ---------- persistencia ----------
function persist(silent) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(cache)); } catch (e) { console.warn('No se pudo guardar', e); }
  if (!silent) window.dispatchEvent(new CustomEvent('nomada:change'));
}

async function load() {
  if (cache) return cache;
  if (loading) return loading;
  loading = (async () => {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) { const db = JSON.parse(raw); if (db.version === DB_VERSION) return (cache = db); }
    } catch { /* se regenera */ }
    const seed = await (await fetch(SEED_URL)).json();
    cache = materialize(seed);
    persist(true);
    return cache;
  })();
  try { return await loading; } finally { loading = null; }
}

window.addEventListener('storage', e => {
  if (e.key === DB_KEY) { cache = null; window.dispatchEvent(new CustomEvent('nomada:change', { detail: { remote: true } })); }
});

/** Suscribirse a cambios (misma pestaña u otra pestaña del mismo navegador). */
export function onChange(cb) { const f = e => cb(e.detail || {}); window.addEventListener('nomada:change', f); return () => window.removeEventListener('nomada:change', f); }

// ---------- materializar semilla (fechas relativas a HOY) ----------
function materialize(seed) {
  const now = new Date();
  const mon = monday(now);
  const dateAt = (k, t) => { const [hh, mm] = t.split(':').map(Number); const d = addD(mon, k); d.setHours(hh, mm, 0, 0); return d; };
  const cfg = clone(seed.config);

  const members = seed.members.map(m => ({
    id: idOf(m.i + 1), nombre: m.n, telefono: m.tel, origen: m.o,
    bebida: m.bebida, alergias: m.ale, fav: m.fav,
    cumple: (() => { const d = addD(sod(now), m.bo); return { dia: d.getDate(), mes: d.getMonth() + 1 }; })(),
    consent: { datos: true, novedades: m.news },
    tags: m.tags || [], notas: (m.notas || []).map(n => ({ ts: dateAt(n.k, '12:00').toISOString(), by: n.by, txt: n.txt })),
    alta: null
  }));

  // Visitas: la primera visita de cada miembro no puede quedar en el futuro (se corre 7 días atrás)
  const firstK = {};
  seed.visits.forEach(v => { if (!(v.m in firstK) || v.k < firstK[v.m]) firstK[v.m] = v.k; });
  const visits = [];
  for (const v of seed.visits) {
    let k = v.k;
    let d = dateAt(k, v.t);
    if (d > now) { if (k === firstK[v.m] && !v.ev) { k -= 7; d = dateAt(k, v.t); } else continue; }
    visits.push({ id: uid('v'), memberId: idOf(v.m + 1), ts: d.toISOString(), monto: v.a, personas: v.p, by: STAFF[(v.m + v.k + 99) % 3], ...(v.ev ? { eventId: v.ev } : {}) });
  }
  visits.sort((a, b) => a.ts.localeCompare(b.ts));
  const firstTs = {};
  visits.forEach(v => { if (!firstTs[v.memberId]) firstTs[v.memberId] = v.ts; });
  members.forEach(m => { m.alta = firstTs[m.id] || now.toISOString(); });

  const events = seed.events.map(e => ({
    id: e.id, titulo: e.titulo, colab: e.colab, desc: e.desc, precio: e.precio, cupos: e.cupos,
    fecha: dateAt(e.k, '20:00').toISOString(), img: e.img,
    preventa: !!e.preventa, preventaHasta: e.preventa ? eod(addD(now, e.preventaHasta)).toISOString() : null,
    reservas: (e.reservas || []).filter(r => r.m < members.length).map(r => ({ memberId: idOf(r.m + 1), asistio: r.asistio && dateAt(e.k, '20:00') < now }))
  }));

  const menu = seed.menu.map(x => ({
    id: x.id, categoria: x.c, nombre: x.n, precio: x.p, precioBotella: x.bot, descripcion: x.desc, ingredientes: x.ing,
    foto: x.foto, etiquetas: x.tags, alergenos: x.al, maridajes: x.m, agotado: x.ag, glifo: x.glifo,
    temporadaHasta: x.t != null ? eod(addD(now, x.t)).toISOString() : null, orden: x.o
  }));

  const tracking = seed.tracking.map(t => ({ e: t.e, ts: dateAt(t.k, '20:00').toISOString() })).filter(t => new Date(t.ts) <= now);
  const gameScores = seed.scores.map(s => ({ nombre: s.n, seg: s.t, ts: new Date(now - s.h * 36e5).toISOString() }));

  const db = { version: DB_VERSION, creado: now.toISOString(), config: cfg, menu, events, members, visits, rewards: [], tracking, gameScores };
  // Premios derivados del historial (la mayoría de los antiguos ya canjeados)
  const idx = buildIndex(db);
  for (const m of db.members) syncRewards(db, m, idx.get(m.id) || [], { seed: true });
  return db;
}

// ---------- cálculo de miembro ----------
function buildIndex(db) {
  const idx = new Map();
  for (const v of db.visits) { if (!idx.has(v.memberId)) idx.set(v.memberId, []); idx.get(v.memberId).push(v); }
  for (const a of idx.values()) a.sort((x, y) => x.ts.localeCompare(y.ts));
  return idx;
}

function nivelDe(cfg, sellos) { let n = cfg.niveles[0]; for (const l of cfg.niveles) if (sellos >= l.min) n = l; return n; }

export function diasParaCumple(m, ref = new Date()) {
  const hoy = sod(ref); let b = new Date(hoy.getFullYear(), m.cumple.mes - 1, m.cumple.dia);
  if (b < hoy) b = new Date(hoy.getFullYear() + 1, m.cumple.mes - 1, m.cumple.dia);
  return diffDays(hoy, b);
}
function enSemanaDeCumple(m, ref = new Date()) {
  const hoy = sod(ref); const b = new Date(hoy.getFullYear(), m.cumple.mes - 1, m.cumple.dia);
  return Math.abs(diffDays(b, hoy)) <= 3;
}

function view(db, m, idx, ref = new Date()) {
  const vs = idx.get(m.id) || [];
  const reales = vs.filter(v => !v.regalo);
  const sellos = vs.length;
  const gasto = reales.reduce((s, v) => s + (v.monto || 0), 0);
  const ultima = reales.length ? reales[reales.length - 1].ts : null;
  let frecuencia = null;
  if (reales.length > 1) frecuencia = (new Date(ultima) - new Date(reales[0].ts)) / DAY / (reales.length - 1);
  const nivel = nivelDe(db.config, sellos);
  const sig = db.config.premios.filter(p => p.sellos > sellos).sort((a, b) => a.sellos - b.sellos)[0] || null;
  const disp = db.rewards.filter(r => r.memberId === m.id && r.estado === 'disponible').length;
  return {
    ...m, sellos, visitas: reales.length, gasto, ultima, frecuencia,
    ticket: reales.length ? gasto / reales.length : 0,
    nivelId: nivel.id, nivelNombre: nivel.nombre,
    siguiente: sig ? { premio: sig, faltan: sig.sellos - sellos } : null,
    diasSin: ultima ? diffDays(ultima, ref) : null,
    diasCumple: diasParaCumple(m, ref),
    premiosDisponibles: disp
  };
}

function newReward(db, m, base) {
  const r = { id: uid('r'), memberId: m.id, estado: 'disponible', codigo: 'NOM-' + Math.random().toString(36).slice(2, 6).toUpperCase(), ganadoTs: new Date().toISOString(), ...base };
  db.rewards.push(r); return r;
}

/** Emite los premios que le corresponden (hitos por sellos y cumpleaños). Devuelve los nuevos. */
function syncRewards(db, m, vs, { seed = false } = {}) {
  const out = [];
  const sellos = vs.length;
  for (const p of db.config.premios) {
    if (sellos >= p.sellos && !db.rewards.some(r => r.memberId === m.id && r.premioId === p.id)) {
      const ganado = vs[p.sellos - 1]?.ts || new Date().toISOString();
      const r = newReward(db, m, { tipo: 'hito', premioId: p.id, nombre: p.nombre, desc: p.desc, alcohol: !!p.alcohol, alt: p.alt, ganadoTs: ganado });
      if (seed && hash(m.id + p.id) % 100 < 72 && diffDays(ganado, new Date()) > 2) {
        r.estado = 'canjeado'; r.canjeadoPor = STAFF[hash(r.id) % 3];
        r.canjeadoTs = new Date(Math.min(Date.now() - DAY, new Date(ganado).getTime() + (1 + hash(m.id) % 9) * DAY)).toISOString();
      }
      out.push(r);
    }
  }
  const c = db.config.cumple;
  const year = new Date().getFullYear();
  if (c?.activo && enSemanaDeCumple(m) && !db.rewards.some(r => r.memberId === m.id && r.tipo === 'cumple' && r.anio === year)) {
    out.push(newReward(db, m, { tipo: 'cumple', anio: year, nombre: c.nombre, desc: c.desc, alcohol: !!c.alcohol, alt: c.alt }));
  }
  return out;
}

const getM = (db, id) => db.members.find(m => m.id === id);

// ============================================================================
//  API PÚBLICA (todas async)
// ============================================================================

// ---------- configuración ----------
export async function getConfig() { return clone((await load()).config); }
export async function saveConfig(patch) { const db = await load(); db.config = deepMerge(db.config, patch); persist(); return clone(db.config); }

// ---------- menú ----------
export async function getMenu() { return clone((await load()).menu).sort((a, b) => a.orden - b.orden); }
export const esTemporada = (d, ref = new Date()) => d.etiquetas.includes('temporada') && (!d.temporadaHasta || new Date(d.temporadaHasta) >= sod(ref));

export async function saveDish(dish) {
  const db = await load();
  const d = clone(dish);
  if (!d.id) { d.id = (norm(d.nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || uid('plato')); if (db.menu.some(x => x.id === d.id)) d.id += '-' + Math.random().toString(36).slice(2, 4); }
  const i = db.menu.findIndex(x => x.id === d.id);
  const prev = i >= 0 ? db.menu[i] : null;
  if (i < 0) { d.orden = Math.max(0, ...db.menu.map(x => x.orden)) + 1; db.menu.push(d); } else { d.orden = prev.orden; db.menu[i] = d; }
  // maridajes simétricos
  const nuevos = new Set(d.maridajes || []), antes = new Set(prev?.maridajes || []);
  for (const o of db.menu) {
    if (o.id === d.id) continue;
    if (nuevos.has(o.id) && !o.maridajes.includes(d.id)) o.maridajes.push(d.id);
    if (!nuevos.has(o.id) && antes.has(o.id)) o.maridajes = o.maridajes.filter(x => x !== d.id);
  }
  persist(); return clone(d);
}
export async function deleteDish(id) {
  const db = await load();
  db.menu = db.menu.filter(x => x.id !== id);
  db.menu.forEach(x => { x.maridajes = x.maridajes.filter(m => m !== id); });
  persist();
}

// ---------- eventos ----------
function evView(ev, db) {
  const reservados = ev.reservas.length;
  return { ...clone(ev), reservados, asistieron: ev.reservas.filter(r => r.asistio).length, restantes: Math.max(0, ev.cupos - reservados), pasado: new Date(ev.fecha) < new Date() };
}
export async function getEvents() { const db = await load(); return db.events.map(e => evView(e, db)).sort((a, b) => a.fecha.localeCompare(b.fecha)); }
export async function saveEvent(ev) {
  const db = await load(); const e = clone(ev);
  if (!e.id) { e.id = uid('ev'); e.reservas = e.reservas || []; }
  const i = db.events.findIndex(x => x.id === e.id);
  if (i < 0) db.events.push({ reservas: [], ...e }); else db.events[i] = { ...db.events[i], ...e, reservas: db.events[i].reservas };
  persist(); return evView(db.events.find(x => x.id === e.id), db);
}
export async function deleteEvent(id) { const db = await load(); db.events = db.events.filter(e => e.id !== id); persist(); }
export async function addReservation(eventId, memberId) {
  const db = await load(); const ev = db.events.find(e => e.id === eventId);
  if (!ev) return { error: 'evento' };
  if (ev.reservas.some(r => r.memberId === memberId)) return { error: 'ya-reservado' };
  if (ev.reservas.length >= ev.cupos) return { error: 'sin-cupos' };
  ev.reservas.push({ memberId, asistio: false }); persist(); return { ok: true };
}
export async function removeReservation(eventId, memberId) {
  const db = await load(); const ev = db.events.find(e => e.id === eventId);
  ev.reservas = ev.reservas.filter(r => r.memberId !== memberId);
  db.visits = db.visits.filter(v => !(v.eventId === eventId && v.memberId === memberId));
  persist();
}
/** Marca asistencia: crea una visita (suma sello) o la deshace. */
export async function markAttendance(eventId, memberId, asistio = true, by = 'Panel') {
  const db = await load(); const ev = db.events.find(e => e.id === eventId);
  const r = ev.reservas.find(x => x.memberId === memberId);
  if (!r) return { error: 'sin-reserva' };
  if (asistio && !r.asistio) {
    r.asistio = true;
    const visit = { id: uid('v'), memberId, ts: new Date().toISOString(), monto: ev.precio, personas: 1, by, eventId };
    db.visits.push(visit);
    const idx = buildIndex(db); const m = getM(db, memberId);
    const nuevos = syncRewards(db, m, idx.get(memberId) || []);
    persist(); return { ok: true, nuevosPremios: clone(nuevos) };
  }
  if (!asistio && r.asistio) { r.asistio = false; db.visits = db.visits.filter(v => !(v.eventId === eventId && v.memberId === memberId)); persist(); }
  return { ok: true };
}

// ---------- miembros ----------
export async function getMembers() {
  const db = await load(); const idx = buildIndex(db); const ref = new Date();
  return db.members.map(m => view(db, m, idx, ref));
}

export async function getMember(id) {
  const db = await load(); const m = getM(db, id); if (!m) return null;
  let idx = buildIndex(db);
  const nuevos = syncRewards(db, m, idx.get(id) || []);
  if (nuevos.length) persist(true);
  idx = buildIndex(db);
  return {
    ...view(db, m, idx),
    historial: clone((idx.get(id) || [])).reverse(),
    premios: clone(db.rewards.filter(r => r.memberId === id)).sort((a, b) => b.ganadoTs.localeCompare(a.ganadoTs)),
    eventos: db.events.filter(e => e.reservas.some(r => r.memberId === id)).map(e => ({ id: e.id, titulo: e.titulo, fecha: e.fecha, asistio: e.reservas.find(r => r.memberId === id).asistio }))
  };
}

export async function findMember(q) {
  const db = await load(); const idx = buildIndex(db);
  let s = String(q || '').trim(); if (!s) return [];
  s = s.replace(/^NOMADA:/i, '');
  const dg = digits(s).replace(/^593/, '0'), n = norm(s);
  const out = db.members.filter(m => m.id.toLowerCase() === s.toLowerCase() || (dg.length >= 4 && digits(m.telefono).includes(dg.replace(/^0/, ''))) || norm(m.nombre).includes(n));
  return out.slice(0, 12).map(m => view(db, m, idx));
}

export async function updateMember(id, patch) {
  const db = await load(); const m = getM(db, id); if (!m) return null;
  for (const k of ['nombre', 'telefono', 'bebida', 'alergias', 'fav', 'tags', 'cumple']) if (k in patch) m[k] = patch[k];
  if (patch.consent) m.consent = { ...m.consent, ...patch.consent };
  persist(); return getMember(id);
}
export async function addNote(id, txt, by = 'Panel') { const db = await load(); getM(db, id).notas.unshift({ ts: new Date().toISOString(), by, txt }); persist(); }

export async function registerMember(p, { origen = 'landing', juego = null } = {}) {
  const db = await load();
  const tel = digits(p.telefono).replace(/^593/, '0');
  if (!p.nombre?.trim() || !/^09\d{8}$/.test(tel) || !p.consent?.datos) return { error: 'datos-invalidos' };
  const ya = db.members.find(m => digits(m.telefono).replace(/^593/, '0') === tel);
  if (ya) return { error: 'telefono-existente', member: await getMember(ya.id) };
  const n = Math.max(0, ...db.members.map(m => +m.id.slice(4))) + 1;
  const m = {
    id: idOf(n), nombre: p.nombre.trim().replace(/\s+/g, ' '), telefono: tel, origen,
    bebida: p.bebida || null, alergias: p.alergias || [], fav: p.fav || null,
    cumple: { dia: +p.cumple?.dia || 1, mes: +p.cumple?.mes || 1 },
    consent: { datos: true, novedades: !!p.consent.novedades }, tags: [], notas: [], alta: new Date().toISOString()
  };
  db.members.push(m);
  let premioJuego = null;
  if (juego === 'sello') {
    db.visits.push({ id: uid('v'), memberId: m.id, ts: new Date().toISOString(), monto: 0, personas: 0, by: 'Minijuego', regalo: true });
    premioJuego = { tipo: 'sello', nombre: db.config.juego.textoSello };
  } else if (juego === 'bebida' || juego === 'bebida0') {
    const r = newReward(db, m, { tipo: 'juego', nombre: juego === 'bebida0' ? 'Bebida de bienvenida sin alcohol' : 'Bebida de bienvenida', desc: 'Válida en tu primera visita.', alcohol: juego === 'bebida' });
    premioJuego = { tipo: 'bebida', nombre: r.nombre };
  }
  const idx = buildIndex(db);
  syncRewards(db, m, idx.get(m.id) || []);
  trackEventSync(db, 'passport_created', { origen, juego: !!juego });
  persist();
  return { created: true, member: await getMember(m.id), premioJuego };
}

export const getCurrentMemberId = () => localStorage.getItem(ME_KEY);
export const setCurrentMember = id => id ? localStorage.setItem(ME_KEY, id) : localStorage.removeItem(ME_KEY);
export async function getCurrentMember() { const id = getCurrentMemberId(); return id ? getMember(id) : null; }

// ---------- visitas y premios ----------
export async function addVisit(memberId, { monto, personas = 1, by = 'Mesero', eventId = null } = {}) {
  const db = await load(); const m = getM(db, memberId);
  if (!m) return { error: 'no-existe' };
  monto = Math.max(0, +monto || 0);
  const antes = view(db, m, buildIndex(db));
  const visit = { id: uid('v'), memberId, ts: new Date().toISOString(), monto, personas: Math.max(1, +personas || 1), by, ...(eventId ? { eventId } : {}) };
  db.visits.push(visit);
  const idx = buildIndex(db);
  const nuevosPremios = syncRewards(db, m, idx.get(memberId) || []);
  const despues = view(db, m, idx);
  persist();
  return { visit: clone(visit), member: despues, nuevosPremios: clone(nuevosPremios), subioNivel: antes.nivelId !== despues.nivelId ? { de: antes.nivelNombre, a: despues.nivelNombre } : null };
}

export async function getRewards(memberId) { const db = await load(); return clone(db.rewards.filter(r => !memberId || r.memberId === memberId)); }

export async function redeemReward(codeOrId, by = 'Mesero') {
  const db = await load();
  const c = String(codeOrId || '').trim().toUpperCase();
  const r = db.rewards.find(x => x.id === codeOrId || x.codigo === c);
  if (!r) return { error: 'no-existe' };
  const m = getM(db, r.memberId);
  if (r.estado === 'canjeado') return { error: 'ya-canjeado', reward: clone(r), member: m && { id: m.id, nombre: m.nombre } };
  r.estado = 'canjeado'; r.canjeadoTs = new Date().toISOString(); r.canjeadoPor = by;
  persist(); return { reward: clone(r), member: { id: m.id, nombre: m.nombre } };
}

// ---------- segmentos ----------
export async function getSegments() {
  const db = await load(); const idx = buildIndex(db); const ref = new Date();
  const all = db.members.map(m => view(db, m, idx, ref));
  const conVisita = all.filter(m => m.visitas > 0).sort((a, b) => b.gasto - a.gasto);
  const vip = conVisita.slice(0, Math.max(1, Math.ceil(conVisita.length * 0.1)));
  const defs = [
    { id: 'vip', label: 'VIP', desc: 'Top 10 % por gasto', miembros: vip, plantilla: 'vip' },
    { id: 'riesgo', label: 'En riesgo', desc: 'Más de 45 días sin venir, con 2+ visitas', miembros: all.filter(m => m.visitas >= 2 && m.diasSin > 45), plantilla: 'riesgo' },
    { id: 'nuevos', label: 'Nuevos', desc: 'Una sola visita', miembros: all.filter(m => m.visitas === 1), plantilla: 'nuevos' },
    { id: 'cumple', label: 'Cumpleañeros de la semana', desc: 'Cumplen en los próximos 7 días', miembros: all.filter(m => m.diasCumple <= 6).sort((a, b) => a.diasCumple - b.diasCumple), plantilla: 'cumple' },
    { id: 'cerveza', label: 'Amantes de la cerveza', desc: 'Declararon preferir cerveza', miembros: all.filter(m => m.bebida === 'cerveza'), plantilla: 'cerveza' },
    { id: 'cocteleria', label: 'Amantes de la coctelería', desc: 'Declararon preferir cócteles', miembros: all.filter(m => m.bebida === 'coctel'), plantilla: 'cocteleria' }
  ];
  return defs.map(d => ({ ...d, miembros: clone(d.miembros), total: d.miembros.length, conConsentimiento: d.miembros.filter(m => m.consent.novedades).length }));
}

export async function exportSegmentCSV(segmentId) {
  const seg = (await getSegments()).find(s => s.id === segmentId); if (!seg) return '';
  const rows = [['Nombre', 'Teléfono', 'Nivel', 'Visitas', 'Gasto total', 'Última visita', 'Cumpleaños', 'Bebida preferida', 'Alergias', 'Origen', 'Acepta novedades']];
  seg.miembros.forEach(m => rows.push([m.nombre, m.telefono, m.nivelNombre, m.visitas, m.gasto, m.ultima ? m.ultima.slice(0, 10) : '', `${m.cumple.dia}/${m.cumple.mes}`, m.bebida || '', (m.alergias || []).join(' · '), m.origen, m.consent.novedades ? 'sí' : 'no']));
  return rows;
}

// ---------- tracking y juego ----------
function trackEventSync(db, e, props = {}) { db.tracking.push({ e, ts: new Date().toISOString(), ...props }); if (db.tracking.length > 4000) db.tracking.splice(0, db.tracking.length - 4000); }
export async function trackEvent(e, props = {}) { const db = await load(); trackEventSync(db, e, props); persist(true); }

export async function getGameScores(n = 8) {
  const db = await load(); const lim = Date.now() - 7 * DAY;
  return clone(db.gameScores.filter(s => new Date(s.ts).getTime() > lim)).sort((a, b) => a.seg - b.seg).slice(0, n);
}
export async function saveGameScore(nombre, seg) { const db = await load(); db.gameScores.push({ nombre: String(nombre || 'Viajero').trim().split(/\s+/)[0].slice(0, 14) || 'Viajero', seg: +seg, ts: new Date().toISOString() }); persist(true); }

/** Estado local del dispositivo para el minijuego (1 partida premiada por dispositivo). */
export const device = {
  get() { try { return JSON.parse(localStorage.getItem(DEVICE_KEY)) || {}; } catch { return {}; } },
  set(patch) { localStorage.setItem(DEVICE_KEY, JSON.stringify({ ...this.get(), ...patch })); }
};

// ---------- sesión del panel (simulada) ----------
export async function login(rol, pin) {
  const { pin: pins } = (await load()).config;
  const ok = rol === 'dueno' ? pin === pins.dueno : rol === 'mesero' ? pin === pins.mesero : false;
  if (!ok) return null;
  const s = { rol, nombre: rol === 'dueno' ? 'Dueño' : 'Mesero · Demo', ts: Date.now() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); return s;
}
export const getSession = () => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; } };
export const logout = () => sessionStorage.removeItem(SESSION_KEY);
export async function verifyStaffPin(pin) { const { pin: p } = (await load()).config; return pin === p.mesero || pin === p.dueno; }

// ---------- estadísticas ----------
export function rangeOf(spec, ref = new Date()) {
  let from, to;
  if (spec === 'semana') { to = eod(ref); from = sod(addD(ref, -6)); }
  else if (spec === 'mes') { to = eod(ref); from = sod(addD(ref, -29)); }
  else if (spec === 'mesAnterior') { from = new Date(ref.getFullYear(), ref.getMonth() - 1, 1); to = eod(new Date(ref.getFullYear(), ref.getMonth(), 0)); }
  else { from = sod(spec.from); to = eod(spec.to); }
  const len = diffDays(from, to) + 1;
  return { from, to, prevFrom: sod(addD(from, -len)), prevTo: eod(addD(from, -1)), dias: len };
}

export async function getStats(spec = 'mes') {
  const db = await load(); const idx = buildIndex(db);
  const rg = rangeOf(spec);
  const reales = db.visits.filter(v => !v.regalo);
  const inR = (ts, a, b) => { const t = new Date(ts); return t >= a && t <= b; };

  const kpis = (a, b) => {
    const vs = reales.filter(v => inR(v.ts, a, b));
    const gasto = vs.reduce((s, v) => s + v.monto, 0);
    const miembros = db.members.filter(m => new Date(m.alta) <= b);
    // retención y frecuencia con historia hasta el final del período
    let conV = 0, conDos = 0, gaps = 0, nGaps = 0, riesgo = 0;
    for (const m of miembros) {
      const mv = (idx.get(m.id) || []).filter(v => !v.regalo && new Date(v.ts) <= b);
      if (mv.length >= 1) conV++;
      if (mv.length >= 2) { conDos++; gaps += (new Date(mv[mv.length - 1].ts) - new Date(mv[0].ts)) / DAY; nGaps += mv.length - 1; if (diffDays(mv[mv.length - 1].ts, b) > 45) riesgo++; }
    }
    return {
      miembros: miembros.length,
      nuevos: db.members.filter(m => inR(m.alta, a, b)).length,
      visitas: vs.length, gasto, ticket: vs.length ? gasto / vs.length : 0,
      retorno: conV ? conDos / conV * 100 : 0,
      frecuencia: nGaps ? gaps / nGaps : 0,
      canjes: db.rewards.filter(r => r.canjeadoTs && inR(r.canjeadoTs, a, b)).length,
      riesgo
    };
  };
  const cur = kpis(rg.from, rg.to), prev = kpis(rg.prevFrom, rg.prevTo);
  const delta = k => prev[k] ? (cur[k] - prev[k]) / prev[k] * 100 : (cur[k] ? 100 : 0);
  const K = Object.fromEntries(Object.keys(cur).map(k => [k, { valor: cur[k], prev: prev[k], delta: delta(k) }]));

  // Nuevos miembros por semana (12 semanas hasta el final del rango) y origen
  const lunesFin = monday(rg.to);
  const semanas = []; for (let i = 11; i >= 0; i--) semanas.push(addD(lunesFin, -7 * i));
  const origenes = ['juego', 'menu', 'landing', 'mesero'];
  const nuevosSemana = { labels: semanas.map(d => `${d.getDate()}/${d.getMonth() + 1}`), series: Object.fromEntries(origenes.map(o => [o, semanas.map(() => 0)])) };
  for (const m of db.members) { const t = new Date(m.alta); const i = semanas.findIndex(s => t >= s && t < addD(s, 7)); if (i >= 0 && nuevosSemana.series[m.origen]) nuevosSemana.series[m.origen][i]++; }

  const vsR = reales.filter(v => inR(v.ts, rg.from, rg.to));
  const porDia = [0, 0, 0, 0, 0, 0, 0]; // lun..dom
  vsR.forEach(v => { porDia[(new Date(v.ts).getDay() + 6) % 7]++; });
  const franjas = ['18–19', '19–20', '20–21', '21–22', '22–23'];
  const porHora = franjas.map(() => 0);
  vsR.forEach(v => { const hh = new Date(v.ts).getHours(); const i = Math.min(4, Math.max(0, hh - 18)); porHora[i]++; });

  const idxAll = db.members.map(m => view(db, m, idx));
  const niveles = Object.fromEntries(db.config.niveles.map(n => [n.nombre, 0]));
  idxAll.forEach(m => { niveles[m.nivelNombre]++; });

  const cohortes = [];
  const ref = new Date();
  for (let i = 4; i >= 0; i--) {
    const d0 = new Date(ref.getFullYear(), ref.getMonth() - i, 1), d1 = new Date(ref.getFullYear(), ref.getMonth() - i + 1, 1);
    const ms = idxAll.filter(m => { const t = new Date(m.alta); return t >= d0 && t < d1; });
    if (!ms.length) continue;
    const pct = n => Math.round(ms.filter(m => m.visitas >= n).length / ms.length * 100);
    cohortes.push({ label: `${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][d0.getMonth()]} ${d0.getFullYear()}`, miembros: ms.length, p1: pct(1), p2: pct(2), p3: pct(3), p5: pct(5) });
  }

  const bebidas = {}; const platos = {};
  db.members.forEach(m => { if (m.bebida) bebidas[m.bebida] = (bebidas[m.bebida] || 0) + 1; if (m.fav) platos[m.fav] = (platos[m.fav] || 0) + 1; });
  const nombreDe = id => db.menu.find(x => x.id === id)?.nombre || id;
  const gustos = {
    bebidas: Object.entries(bebidas).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v),
    platos: Object.entries(platos).map(([k, v]) => ({ k: nombreDe(k), v })).sort((a, b) => b.v - a.v).slice(0, 6)
  };

  const trk = db.tracking.filter(t => inR(t.ts, rg.from, rg.to));
  const juegoMiembros = db.members.filter(m => m.origen === 'juego' && inR(m.alta, rg.from, rg.to));
  const embudo = [
    { label: 'Jugaron', value: trk.filter(t => t.e === 'game_play').length },
    { label: 'Ganaron', value: trk.filter(t => t.e === 'game_win').length },
    { label: 'Crearon pasaporte', value: juegoMiembros.length },
    { label: 'Primera visita', value: juegoMiembros.filter(m => (idx.get(m.id) || []).some(v => !v.regalo)).length }
  ];

  const ocupacion = db.events.map(e => evView(e, db)).sort((a, b) => a.fecha.localeCompare(b.fecha)).map(e => ({ titulo: e.titulo, fecha: e.fecha, cupos: e.cupos, reservados: e.reservados, asistieron: e.asistieron, pasado: e.pasado }));

  return { rango: rg, kpis: K, charts: { nuevosSemana, porDia, franjas, porHora, niveles, cohortes, gustos, embudo, ocupacion } };
}

// ---------- reinicio ----------
export async function resetDemo() {
  cache = null;
  [DB_KEY, ME_KEY, DEVICE_KEY].forEach(k => localStorage.removeItem(k));
  const db = await load();
  window.dispatchEvent(new CustomEvent('nomada:change'));
  return db.version;
}
