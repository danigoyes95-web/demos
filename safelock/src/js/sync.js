import { useState, useEffect } from 'preact/hooks';
import { countPending, syncAll } from './data.js';
// Estado de conexión + cola de sincronización (la cola son las órdenes con sync:'pendiente' en IndexedDB).
const L = new Set(); let online = navigator.onLine, forced = localStorage.getItem('sl_offline') === '1';
const eff = () => online && !forced;
const notify = () => L.forEach(f => f(eff()));
addEventListener('online', () => { online = true; notify(); autoSync(); });
addEventListener('offline', () => { online = false; notify(); });
export const isOnline = eff;
export const forceOffline = v => { forced = v; localStorage.setItem('sl_offline', v ? '1' : '0'); notify(); if (!v) autoSync(); };
export const isForced = () => forced;
export function useOnline() { const [o, s] = useState(eff()); useEffect(() => { L.add(s); return () => L.delete(s); }, []); return o; }
let busy = false; const SL = new Set();
export const onSynced = f => { SL.add(f); return () => SL.delete(f); };
export async function autoSync(op) {
  if (busy || !eff()) return 0; busy = true;
  try { const n = await syncAll(op); if (n) SL.forEach(f => f(n)); return n; } finally { busy = false; }
}
export function usePending(op, dep) {
  const [n, set] = useState(0);
  useEffect(() => { let alive = true; const f = () => countPending(op).then(v => alive && set(v)); f(); const i = setInterval(f, 2500); const un = onSynced(f); return () => { alive = false; clearInterval(i); un(); }; }, [op, dep]);
  return n;
}
