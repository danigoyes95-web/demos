import { useState, useEffect, useCallback } from 'preact/hooks';
import { listToday, getOrder } from '../../js/data.js';
import { ensureRoute } from '../../js/route.js';
import { getPos } from '../../js/geo.js';
export function useToday(op) {
  const [orders, set] = useState(null);
  const load = useCallback(() => listToday(op).then(set), [op]);
  useEffect(() => { load(); }, [load]);
  return [orders, load];
}
export function useOrder(id) { const [o, set] = useState(null); const load = useCallback(() => getOrder(id).then(set), [id]); useEffect(() => { load(); }, [load]); return [o, load]; }
export const NAV_KEY = 'sl_nav';
export function navUrl(o, app) {
  const { lat, lng } = o.loc || {};
  if (Number.isFinite(lat)) return app === 'waze' ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  const q = encodeURIComponent(`${o.direccion}, ${o.sector}, Ambato, Ecuador`);
  return app === 'waze' ? `https://waze.com/ul?q=${q}&navigate=yes` : `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// Ruta del día estable: se calcula una vez y solo se recalcula si cambian las órdenes o el operario lo pide.
export function useRoutePlan(orders, pos, userId, cfg) {
  const [st, set] = useState({ route: [], plan: null });
  const run = useCallback(async force => { if (orders) set(await ensureRoute(userId, orders, getPos(), cfg, force)); }, [orders, userId, cfg]);
  const key = orders ? orders.map(o => o.id + o.estado).join(',') : '';
  useEffect(() => { run(false); }, [key, !!pos, cfg?.respetarSecuencia]);
  const rank = Object.fromEntries(st.route.map((o, i) => [o.id, i + 1]));
  return { ...st, rank, reorder: () => run(true) };
}
