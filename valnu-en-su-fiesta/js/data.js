/* ============================================================
   data.js — ÚNICO archivo que toca el almacenamiento.
   MODO DEMO: localStorage + data/seed.json. Sin red, sin backend.
   Todas las funciones son async para que, al conectar Supabase,
   solo haya que reescribir ESTE archivo (ver docs/PLAN-CONEXION.md).
   ============================================================ */

const PFX = 'valnu:';
const SEED_URL = new URL('../data/seed.json', import.meta.url);
const PHOTOS_URL = new URL('../data/photos.json', import.meta.url);
const DAY = 86400000;
const STORAGE_LIMIT_CHARS = 5_000_000; // cuota aprox. de localStorage

/* ---------- utilidades de fecha (zona local) ---------- */
export const isoDay = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (n, base = new Date()) => isoDay(new Date(startOfDay(base).getTime() + n * DAY + DAY / 2));
const dayOffset = (ts) => Math.round((startOfDay().getTime() - startOfDay(ts).getTime()) / DAY); // 0 = hoy

/* ---------- almacenamiento crudo (único punto con localStorage) ---------- */
const store = {
  get(k, fallback = null) {
    try { const v = localStorage.getItem(PFX + k); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(k, v) {
    try { localStorage.setItem(PFX + k, JSON.stringify(v)); }
    catch (e) { const err = new Error('El almacenamiento del navegador está lleno. Elimina fotos o reinicia el demo.'); err.code = 'QUOTA'; throw err; }
  },
  del(k) { try { localStorage.removeItem(PFX + k); } catch {} },
  keys() { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PFX)) out.push(k); } } catch {} return out; },
};

/* ---------- semilla ---------- */
let seedPromise = null;
const loadSeed = () => (seedPromise ??= fetch(SEED_URL).then((r) => r.json()));

function materialize(seed) {
  const now = Date.now();
  const quotes = seed.quotes.map((q) => {
    const created = new Date(now - q.daysAgo * DAY - q.hoursAgo * 3600000);
    const { daysAgo, hoursAgo, eventInDays, ...rest } = q;
    return { ...rest, createdAt: created.toISOString(), eventDate: addDays(eventInDays), updatedAt: created.toISOString() };
  });
  const content = structuredClone(seed.content);
  content.season.start = addDays(-content.season.startDaysAgo);
  content.season.end = addDays(content.season.endDaysFromNow);
  delete content.season.startDaysAgo; delete content.season.endDaysFromNow;
  return {
    version: seed.version, settings: seed.settings, occasions: seed.occasions, categories: seed.categories,
    items: seed.items, suggestions: seed.suggestions, content, quotes, funnelDaily: seed.funnelDaily,
  };
}

async function ensureSeed() {
  const v = store.get('version');
  const seed = await loadSeed();
  if (v === seed.version && store.get('quotes')) return;
  writeAll(materialize(seed));
}
function writeAll(m) {
  for (const k of store.keys()) store.del(k.slice(PFX.length));
  store.set('version', m.version);
  for (const k of ['settings', 'occasions', 'categories', 'items', 'suggestions', 'content', 'quotes', 'funnelDaily']) store.set(k, m[k]);
  store.set('events', []);
  store.set('uploads', []);
}
const read = async (k, fb) => { await ensureSeed(); return store.get(k, fb); };

/* ---------- fotos subidas (simulado): referencia upload:ID <-> data URL ---------- */
function uploadMaps() {
  const ups = store.get('uploads', []);
  const byRef = new Map(ups.map((u) => [`upload:${u.id}`, u.dataUrl]));
  const byUrl = new Map(ups.map((u) => [u.dataUrl, `upload:${u.id}`]));
  return { ups, byRef, byUrl };
}
function walk(o, fn) {
  if (typeof o === 'string') return fn(o);
  if (Array.isArray(o)) return o.map((x) => walk(x, fn));
  if (o && typeof o === 'object') { const r = {}; for (const k in o) r[k] = k === 'snapshot' ? o[k] : walk(o[k], fn); return r; }
  return o;
}
const hydrate = (o) => { const { byRef } = uploadMaps(); return byRef.size ? walk(o, (s) => (s.startsWith('upload:') ? byRef.get(s) || '' : s)) : o; };
const dehydrate = (o) => { const { byUrl } = uploadMaps(); return byUrl.size ? walk(o, (s) => (s.startsWith('data:image') ? byUrl.get(s) || s : s)) : o; };

/* ============================================================
   API PÚBLICA
   ============================================================ */

/* ---- Catálogo ---- */
export async function getItems({ onlyActive = false } = {}) {
  const items = hydrate(await read('items', []));
  return onlyActive ? items.filter((i) => i.active) : items;
}
export async function saveItem(item) {
  const items = await read('items', []);
  item = dehydrate(item);
  if (!item.id) item.id = 'it-' + Math.random().toString(36).slice(2, 8);
  const i = items.findIndex((x) => x.id === item.id);
  i >= 0 ? (items[i] = item) : items.push(item);
  store.set('items', items);
  return item;
}
export async function deleteItem(id) {
  store.set('items', (await read('items', [])).filter((i) => i.id !== id));
  const sg = await read('suggestions', {});
  for (const k in sg) sg[k] = sg[k].filter((x) => x !== id);
  store.set('suggestions', sg);
}
export const getCategories = async () => read('categories', []);

/* ---- Ocasiones y sugerencias ---- */
export const getOccasions = async () => (await read('occasions', [])).filter((o) => o.active !== false);
export const getAllOccasions = async () => read('occasions', []);
export async function saveOccasions(list) { await ensureSeed(); store.set('occasions', list); return list; }
export const getSuggestions = async () => read('suggestions', {});
export async function saveSuggestions(map) { await ensureSeed(); store.set('suggestions', map); return map; }

/* ---- Contenido de la landing ---- */
export const getContent = async () => hydrate(await read('content', {}));
export async function saveContent(content) { await ensureSeed(); store.set('content', dehydrate(content)); return content; }

/* ---- Configuración ---- */
export const getSettings = async () => read('settings', {});
export async function saveSettings(s) { await ensureSeed(); store.set('settings', s); return s; }

/* ---- Cotizaciones ---- */
export const quoteCode = (id) => String(id).padStart(4, '0');
export async function getQuotes() { return hydrate(await read('quotes', [])).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
export async function getQuote(id) { return (await getQuotes()).find((q) => q.id === Number(id)) || null; }
export async function createQuote(data) {
  const quotes = await read('quotes', []);
  const id = quotes.reduce((m, q) => Math.max(m, q.id), 0) + 1;
  const q = {
    status: 'new', lostReason: null, finalTotal: null, deposit: 0, notes: '', items: [], colors: [], source: 'armador',
    ...data, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  quotes.push(q);
  store.set('quotes', quotes);
  await trackEvent('quote_sent', { id, source: q.source });
  return { ...q, code: quoteCode(id) };
}
export async function updateQuote(id, patch) {
  const quotes = await read('quotes', []);
  const i = quotes.findIndex((q) => q.id === Number(id));
  if (i < 0) throw new Error('Cotización no encontrada');
  quotes[i] = { ...quotes[i], ...dehydrate(patch), updatedAt: new Date().toISOString() };
  store.set('quotes', quotes);
  return quotes[i];
}
export async function deleteQuote(id) { store.set('quotes', (await read('quotes', [])).filter((q) => q.id !== Number(id))); }

/* ---- Disponibilidad de alquileres por fecha ---- */
const BLOCKING = ['deposit', 'done'];
export async function getAvailability(dateISO) {
  const [items, quotes] = await Promise.all([read('items', []), read('quotes', [])]);
  const out = {};
  for (const it of items.filter((i) => i.rental)) {
    const used = quotes.filter((q) => q.eventDate === dateISO && BLOCKING.includes(q.status) && q.items.some((l) => l.itemId === it.id)).length;
    out[it.id] = { stock: it.stock, used, free: Math.max(0, it.stock - used), available: it.stock - used > 0 };
  }
  return out;
}

/* ---- Analítica local ---- */
function sid() { try { let s = sessionStorage.getItem('valnu:sid'); if (!s) { s = Math.random().toString(36).slice(2); sessionStorage.setItem('valnu:sid', s); } return s; } catch { return 'x'; } }
export async function trackEvent(name, payload = {}) {
  try {
    await ensureSeed();
    const ev = store.get('events', []);
    if (name === 'visit' && ev.some((e) => e.name === 'visit' && e.sid === sid())) return; // 1 visita por sesión
    ev.push({ t: Date.now(), name, sid: sid(), ...payload });
    store.set('events', ev.slice(-3000));
  } catch { /* la analítica nunca debe romper la landing */ }
}
export const getEvents = async () => read('events', []);

/* ---- Tablero de resultados (en Supabase esto sería una vista/RPC) ---- */
const RANGES = { today: [0, 1], week: [0, 7], month: [0, 30], prevmonth: [30, 60] };
const PREV = { today: [1, 2], week: [7, 14], month: [30, 60], prevmonth: [60, 90] };
const inWin = (off, [a, b]) => off >= a && off < b;
const amount = (q) => q.finalTotal ?? Math.round((q.rangeMin + q.rangeMax) / 2);

export async function getDashboard(range = 'month') {
  const [quotes, daily, events, items, occasions] = await Promise.all([
    read('quotes', []), read('funnelDaily', []), read('events', []), read('items', []), read('occasions', []),
  ]);
  const win = RANGES[range], pw = PREV[range];
  const off = (q) => dayOffset(q.createdAt);
  const kpi = (w) => {
    const qs = quotes.filter((q) => inWin(off(q), w));
    const booked = qs.filter((q) => BLOCKING.includes(q.status));
    const income = booked.reduce((s, q) => s + amount(q), 0);
    return { received: qs.length, booked: booked.length, closeRate: qs.length ? booked.length / qs.length : 0, income, avgTicket: booked.length ? income / booked.length : 0 };
  };
  const cur = kpi(win), prev = kpi(pw);
  const today = isoDay(), in7 = addDays(7);
  cur.upcoming = quotes.filter((q) => q.status === 'deposit' && q.eventDate >= today && q.eventDate <= in7).length;

  const cw = range === 'today' ? RANGES.week : win; // gráficos: si es "hoy", muestra la semana
  const cq = quotes.filter((q) => inWin(off(q), cw));
  const byOccasion = occasions.map((o) => ({ id: o.id, name: o.name, n: cq.filter((q) => q.occasion === o.id).length })).filter((x) => x.n).sort((a, b) => b.n - a.n);
  const cnt = {};
  cq.forEach((q) => q.items.forEach((l) => { cnt[l.itemId] = (cnt[l.itemId] || 0) + 1; }));
  const topItems = Object.entries(cnt).map(([id, n]) => ({ id, n, name: items.find((i) => i.id === id)?.name || id })).sort((a, b) => b.n - a.n).slice(0, 7);
  const weeks = [];
  for (let w = 11; w >= 0; w--) weeks.push({ label: w === 0 ? 'Esta sem.' : `-${w} sem.`, n: quotes.filter((q) => Math.floor(off(q) / 7) === w).length });

  const evIn = (n) => events.filter((e) => e.name === n && inWin(dayOffset(e.t), cw)).length;
  const dsum = (k) => daily.filter((d) => inWin(d.daysAgo, cw)).reduce((s, d) => s + d[k], 0);
  const funnel = [
    { label: 'Visitaron la landing', n: dsum('visit') + evIn('visit') },
    { label: 'Abrieron el armador', n: dsum('opened') + evIn('builder_open') },
    { label: 'Agregaron 3 o más elementos', n: dsum('added3') + evIn('items3') },
    { label: 'Enviaron cotización', n: cq.length },
    { label: 'Reservaron', n: cq.filter((q) => BLOCKING.includes(q.status)).length },
  ];
  const shown = dsum('suggShown') + evIn('sugg_shown'), acc = dsum('suggAccepted') + evIn('sugg_accepted');

  const nowMs = Date.now(), tomorrow = addDays(1);
  const alerts = [];
  quotes.filter((q) => q.status === 'new' && nowMs - new Date(q.createdAt).getTime() > 2 * 3600000).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .forEach((q) => alerts.push({ type: 'unanswered', quoteId: q.id, text: `Cotización #${quoteCode(q.id)} de ${q.contact.name} sin responder hace ${Math.floor((nowMs - new Date(q.createdAt)) / 3600000)} h` }));
  quotes.filter((q) => q.eventDate === tomorrow && ['new', 'quoted'].includes(q.status))
    .forEach((q) => alerts.push({ type: 'nodeposit', quoteId: q.id, text: `Evento de mañana sin anticipo: #${quoteCode(q.id)} · ${q.contact.name}` }));
  const rentals = items.filter((i) => i.rental);
  const byDate = {};
  quotes.filter((q) => BLOCKING.includes(q.status) && q.eventDate >= today).forEach((q) => (byDate[q.eventDate] ||= []).push(q));
  for (const [date, qs] of Object.entries(byDate)) for (const it of rentals) {
    const using = qs.filter((q) => q.items.some((l) => l.itemId === it.id));
    if (using.length > it.stock) alerts.push({ type: 'conflict', date, quoteId: using[0].id, text: `Fecha cruzada ${date}: «${it.name}» reservado ${using.length} veces (stock ${it.stock})` });
  }
  return { range, cur, prev, byOccasion, topItems, weeks, funnel, sugg: { shown, accepted: acc, rate: shown ? acc / shown : 0 }, alerts, chartsNote: range === 'today' ? 'Gráficos de los últimos 7 días' : '' };
}

/* ---- Fotos y almacenamiento ---- */
export async function getPhotoLibrary() {
  const base = await fetch(PHOTOS_URL).then((r) => r.json()).catch(() => []);
  const ups = store.get('uploads', []).map((u) => ({ path: `upload:${u.id}`, folder: 'subidas', name: u.name, preview: u.dataUrl, kb: u.kb }));
  return [...base.map((p) => ({ ...p, preview: new URL('../' + p.path, import.meta.url).pathname })), ...ups];
}
export async function saveUpload({ dataUrl, name }) {
  await ensureSeed();
  const ups = store.get('uploads', []);
  const id = Date.now().toString(36);
  ups.push({ id, name, dataUrl, kb: Math.round(dataUrl.length * 0.75 / 1024) });
  store.set('uploads', ups);
  return `upload:${id}`;
}
export async function deleteUpload(ref) { store.set('uploads', store.get('uploads', []).filter((u) => `upload:${u.id}` !== ref)); }
export function getStorageUsage() {
  let chars = 0; for (const k of store.keys()) chars += k.length + (localStorage.getItem(k) || '').length;
  return { chars, limit: STORAGE_LIMIT_CHARS, pct: chars / STORAGE_LIMIT_CHARS };
}

/* ---- Sesión simulada del panel ---- */
export const login = async () => { try { sessionStorage.setItem('valnu:admin', '1'); } catch {} return true; };
export const logout = async () => { try { sessionStorage.removeItem('valnu:admin'); } catch {} };
export const isLoggedIn = () => { try { return sessionStorage.getItem('valnu:admin') === '1'; } catch { return false; } };

/* ---- Reiniciar demo ---- */
export async function resetDemo() {
  seedPromise = null;
  writeAll(materialize(await loadSeed()));
  try { sessionStorage.removeItem('valnu:sid'); } catch {}
  return true;
}
