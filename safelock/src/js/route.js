import { distM, hasLoc } from './geo.js';
import { getRoutePlan, saveRoutePlan, dayKey } from './data.js';

// ---------- Optimización de ruta (100 % local, sin internet) ----------
// 1) Agrupa por MRU/sector (se termina una zona antes de pasar a otra, ordenadas por cercanía).
// 2) Dentro de cada zona: vecino más cercano + 2-opt (desenreda cruces y vueltas).
// 3) Sin ubicación: se insertan al final de su zona (junto a las demás de ese sector).
// 4) Opcional: respetar la secuencia del PDF dentro de cada MRU (cfg.respetarSecuencia).
const d = (a, b) => distM(a.loc || a, b.loc || b);
function pathLen(p) { let s = 0; for (let i = 1; i < p.length; i++) s += d(p[i - 1], p[i]); return s; }

function twoOpt(path) { // path[0] es el punto de partida fijo
  let improved = true, guard = 0; const n = path.length;
  while (improved && guard++ < 60) {
    improved = false;
    for (let i = 1; i < n - 1; i++) for (let j = i + 1; j < n; j++) {
      const a = path[i - 1], b = path[i], c = path[j], e = path[j + 1];
      const delta = d(a, c) + (e ? d(b, e) : 0) - d(a, b) - (e ? d(c, e) : 0);
      if (delta < -1) { path.splice(i, j - i + 1, ...path.slice(i, j + 1).reverse()); improved = true; }
    }
  }
  return path;
}
function nnPath(start, items) {
  const left = [...items], out = [start]; let cur = start;
  while (left.length) { let bi = 0, bd = Infinity; left.forEach((o, i) => { const x = d(cur, o); if (x < bd) { bd = x; bi = i; } }); cur = left.splice(bi, 1)[0]; out.push(cur); }
  return out;
}
export function optimizeRoute(orders, from, opts = {}) {
  const pend = orders.filter(o => o.estado === 'pendiente');
  const groups = {}; pend.forEach(o => (groups[o.mru || o.sector || '-'] ||= []).push(o));
  const all = Object.entries(groups).map(([k, g]) => ({ k, all: g, loc: g.filter(hasLoc), noLoc: g.filter(o => !hasLoc(o)) }));
  const withLoc = all.filter(g => g.loc.length), noLocGroups = all.filter(g => !g.loc.length).sort((a, b) => a.k.localeCompare(b.k));
  const bySeq = arr => [...arr].sort((a, b) => (a.secuencia || 1e9) - (b.secuencia || 1e9));
  const out = []; let cur = from || withLoc[0]?.loc[0]?.loc || null;
  let list = [...withLoc];
  while (list.length) {
    // siguiente zona/ruta: la que tiene un punto más cercano a donde estoy
    let bi = 0, bd = Infinity;
    list.forEach((g, i) => { const m = cur ? Math.min(...g.loc.map(o => d(cur, o))) : 0; if (m < bd) { bd = m; bi = i; } });
    const g = list.splice(bi, 1)[0];
    // Sin coordenadas suficientes (o si se pide), se sigue la secuencia de lectura de la empresa: ya es un recorrido por calles.
    const seqMode = opts.respetarSecuencia || g.loc.length < 0.6 * g.all.length;
    let seq;
    if (seqMode && g.all.some(o => o.secuencia)) {
      seq = bySeq(g.all); const lc = seq.filter(hasLoc);
      if (cur && lc.length > 1 && d(cur, lc[lc.length - 1]) < d(cur, lc[0])) seq.reverse();
    } else {
      const start = cur ? { lat: cur.lat ?? cur.loc.lat, lng: cur.lng ?? cur.loc.lng } : g.loc[0].loc;
      seq = [...twoOpt(nnPath(start, g.loc)).slice(1), ...bySeq(g.noLoc)];
    }
    out.push(...seq); const last = [...seq].reverse().find(hasLoc); if (last) cur = last.loc;
  }
  for (const g of noLocGroups) out.push(...bySeq(g.all)); // rutas sin ninguna coordenada: por código de ruta y secuencia
  return out;
}
export const planRoute = (orders, from, cfg) => optimizeRoute(orders, from, cfg);
export function routeLength(route, from) { let s = 0, c = from; for (const o of route) { if (!hasLoc(o)) continue; if (c) s += distM(c, o.loc); c = o.loc; } return s; }
// Orden "de papel" (como viene en el PDF) para comparar el ahorro
export const baselineRoute = orders => [...orders.filter(o => o.estado === 'pendiente')].sort((a, b) => a.id.localeCompare(b.id));

// ---------- Ruta del día FIJA (se guarda y solo se recalcula si cambian las órdenes o el operario lo pide) ----------
export async function ensureRoute(userId, orders, from, cfg = {}, force = false) {
  const pend = orders.filter(o => o.estado === 'pendiente');
  let plan = await getRoutePlan(userId);
  const known = new Set(plan?.ids || []);
  const stale = force || !plan || pend.some(o => !known.has(o.id)) || (plan.sinPos && !!from);
  if (stale) {
    const route = optimizeRoute(pend, from, cfg);
    const k = 1.3; // línea recta → distancia por calle (aprox.)
    plan = { ids: route.map(o => o.id), km: routeLength(route, from) * k / 1000, kmBase: routeLength(baselineRoute(orders), from) * k / 1000, sinPos: !from, paradas: route.length, t: Date.now() };
    await saveRoutePlan(userId, plan);
  }
  const byId = Object.fromEntries(orders.map(o => [o.id, o]));
  return { route: plan.ids.map(id => byId[id]).filter(o => o && o.estado === 'pendiente'), plan };
}
