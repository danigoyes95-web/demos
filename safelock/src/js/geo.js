import { useState, useEffect } from 'preact/hooks';

const R = 6371000, rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
export function distM(a, b) {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export function bearing(a, b) {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}
export const cardinal = b => ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'][Math.round(b / 45) % 8];
export const fmtDist = m => m == null ? '—' : m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
export const etaMin = (m, rural) => Math.max(1, Math.round((m * 1.35) / ((rural ? 32 : 24) * 1000 / 60)));
export const hasLoc = o => o?.loc && Number.isFinite(o.loc.lat) && Number.isFinite(o.loc.lng);

// ---------- Store de GPS (singleton) ----------
const st = { pos: null, status: 'idle', sim: false, listeners: new Set(), watchId: null };
const emit = () => st.listeners.forEach(f => f({ pos: st.pos, status: st.status, sim: st.sim }));
const SIM_START = { lat: -1.2395, lng: -78.6180 };
export function startGps() {
  if (st.watchId != null || st.sim) return;
  if (!('geolocation' in navigator)) { st.status = 'error'; return emit(); }
  st.status = 'ask'; emit();
  st.watchId = navigator.geolocation.watchPosition(
    p => { st.pos = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, t: Date.now(), speed: p.coords.speed }; st.status = 'ok'; emit(); },
    e => { st.status = e.code === 1 ? 'denied' : 'error'; emit(); },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
}
export function stopGps() { if (st.watchId != null) navigator.geolocation.clearWatch(st.watchId); st.watchId = null; }
export const getPos = () => st.pos;
export const gpsAllowed = () => localStorage.getItem('sl_gps_ok') === '1';
// GPS de demostración (para probar en PC): se mueve hacia el destino activo
export function setSim(on) {
  st.sim = on; localStorage.setItem('sl_sim', on ? '1' : '0');
  if (on) { stopGps(); st.pos = st.pos && st.sim && st.pos.sim ? st.pos : { ...SIM_START, acc: 6, t: Date.now(), sim: true }; st.status = 'ok'; emit(); }
  else { st.pos = null; st.status = 'idle'; emit(); startGps(); }
}
export const isSim = () => st.sim;
export function simStepToward(target, meters) {
  if (!st.sim || !st.pos) return;
  const d = distM(st.pos, target); if (d < 1) return;
  const f = Math.min(1, meters / d);
  st.pos = { ...st.pos, lat: st.pos.lat + (target.lat - st.pos.lat) * f, lng: st.pos.lng + (target.lng - st.pos.lng) * f, t: Date.now(), acc: 6 }; emit();
}
export function simTeleport(p) { if (st.sim) { st.pos = { ...p, acc: 6, t: Date.now(), sim: true }; emit(); } }
if (localStorage.getItem('sl_sim') === '1') { st.sim = true; st.pos = { ...SIM_START, acc: 6, t: Date.now(), sim: true }; st.status = 'ok'; }
export function useGps() {
  const [s, set] = useState({ pos: st.pos, status: st.status, sim: st.sim });
  useEffect(() => { st.listeners.add(set); set({ pos: st.pos, status: st.status, sim: st.sim }); return () => st.listeners.delete(set); }, []);
  return s;
}

// ---------- Wake Lock ----------
let lock = null;
export async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) lock = await navigator.wakeLock.request('screen');
    else if (lock) { await lock.release(); lock = null; }
  } catch { /* sin soporte */ }
}
export function useWakeLock() { useEffect(() => { keepAwake(true); const f = () => document.visibilityState === 'visible' && keepAwake(true); document.addEventListener('visibilitychange', f); return () => { document.removeEventListener('visibilitychange', f); keepAwake(false); }; }, []); }
export const vibrate = p => { try { navigator.vibrate?.(p); } catch { /* */ } };
