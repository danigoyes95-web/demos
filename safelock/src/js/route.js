import { distM, hasLoc } from './geo.js';
// Ruta del día: vecino más cercano partiendo de mi posición. Si hay secuencia del PDF (mismo MRU),
// solo es elegible la de menor secuencia de cada MRU. Sin ubicación: van al final por secuencia.
export function planRoute(orders, from) {
  const pend = orders.filter(o => o.estado === 'pendiente');
  const withLoc = pend.filter(hasLoc), noLoc = pend.filter(o => !hasLoc(o)).sort((a, b) => (a.mru + a.secuencia).localeCompare(b.mru + b.secuencia));
  const left = [...withLoc], out = [];
  let cur = from || (left[0] ? left[0].loc : null);
  while (left.length) {
    const minSeq = {}; left.forEach(o => { if (o.secuencia) minSeq[o.mru] = Math.min(minSeq[o.mru] ?? 1e9, o.secuencia); });
    const elig = left.filter(o => !o.secuencia || o.secuencia === minSeq[o.mru]);
    let best = elig[0], bd = Infinity;
    for (const o of elig) { const d = cur ? distM(cur, o.loc) : 0; if (d < bd) { bd = d; best = o; } }
    out.push(best); left.splice(left.indexOf(best), 1); cur = best.loc;
  }
  return [...out, ...noLoc];
}
export const routeLength = (route, from) => { let d = 0, c = from; for (const o of route) { if (!hasLoc(o)) continue; if (c) d += distM(c, o.loc); c = o.loc; } return d; };
