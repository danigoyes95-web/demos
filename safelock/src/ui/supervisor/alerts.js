import { distM } from '../../js/geo.js';
// Alertas del monitoreo: inactividad, registro lejos del punto y fotos faltantes.
export function computeAlerts(orders, positions, ops, cfg, now = Date.now()) {
  const out = [];
  for (const op of ops) {
    const mine = orders.filter(o => o.asignadoA === op.id);
    const pend = mine.filter(o => o.estado === 'pendiente').length; if (!pend) continue;
    const lastExec = Math.max(0, ...mine.filter(o => o.ejecucion).map(o => o.ejecucion.hora));
    const p = positions.find(x => x.op === op.id); const last = Math.max(lastExec, p?.t || 0);
    const min = Math.round((now - last) / 60000);
    if (min > cfg.inactividadMin) out.push({ k: 'inactivo', lvl: 'warn', op: op.id, texto: `${op.nombre} sin actividad hace ${min} min (${pend} pendientes)` });
  }
  for (const o of orders) {
    const e = o.ejecucion; if (!e) continue;
    const dist = e.distPunto ?? (e.gps && o.loc?.lat != null ? Math.round(distM(e.gps, o.loc)) : null);
    if (e.si && dist != null && dist > cfg.distanciaSospechosa) out.push({ k: 'lejos', lvl: 'bad', id: o.id, op: o.asignadoA, texto: `Orden ${o.cuen} registrada a ${dist} m del punto — posible inconsistencia` });
    if (e.si && (!e.fotos || e.fotos.length === 0)) out.push({ k: 'foto', lvl: 'bad', id: o.id, op: o.asignadoA, texto: `Orden ${o.cuen} ejecutada sin fotos de evidencia` });
  }
  return out;
}
