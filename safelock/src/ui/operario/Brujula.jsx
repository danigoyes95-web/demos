import { useState, useEffect, useRef } from 'preact/hooks';
import { useApp, go, TypeBadge } from '../common.jsx';
import { Icon } from '../icons.jsx';
import { useGps, distM, bearing, cardinal, fmtDist, hasLoc, useWakeLock, vibrate, startGps, isSim, simStepToward } from '../../js/geo.js';
import { useOrder } from './hooks.js';

export default function Brujula({ id }) {
  const { cfg } = useApp(); const [o] = useOrder(id); const { pos } = useGps();
  const [heading, setHeading] = useState(null), [needPerm, setNeedPerm] = useState(false), [walk, setWalk] = useState(false);
  const fired = useRef(false); useWakeLock();
  useEffect(() => { startGps(); }, []);
  useEffect(() => {
    const on = e => { const h = e.webkitCompassHeading ?? (e.absolute || e.type === 'deviceorientationabsolute' ? (360 - e.alpha) % 360 : null); if (h != null && !Number.isNaN(h)) setHeading(h); };
    const D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === 'function') setNeedPerm(true); // iOS: requiere un toque
    else { addEventListener('deviceorientationabsolute', on, true); addEventListener('deviceorientation', on, true); }
    return () => { removeEventListener('deviceorientationabsolute', on, true); removeEventListener('deviceorientation', on, true); };
  }, []);
  const askPerm = async () => { try { const r = await DeviceOrientationEvent.requestPermission(); if (r === 'granted') { setNeedPerm(false); addEventListener('deviceorientation', e => e.webkitCompassHeading != null && setHeading(e.webkitCompassHeading), true); } } catch { /* */ } };
  // Caminata simulada hacia el medidor (demo en PC)
  useEffect(() => { if (!walk || !o) return; const i = setInterval(() => simStepToward(o.loc, 9), 1000); return () => clearInterval(i); }, [walk, o?.id]);
  const ok = o && hasLoc(o);
  const d = ok && pos ? distM(pos, o.loc) : null, b = ok && pos ? bearing(pos, o.loc) : null;
  const arrived = d != null && d <= cfg.radioLlegada;
  useEffect(() => { if (arrived && !fired.current) { fired.current = true; vibrate([300, 120, 300, 120, 600]); } if (!arrived) fired.current = false; }, [arrived]);
  if (!o) return <div class="shell" />;
  if (!ok) { go('/mapa/' + id, true); return null; }
  const rot = b == null ? 0 : heading != null ? b - heading : b;
  const sensor = heading != null;
  return <div class="shell" style={{ background: 'var(--bg)' }}>
    <header class="top"><button aria-label="Volver" onClick={() => go('/mapa/' + id)} style={{ color: '#fff' }}><Icon n="back" size={28} /></button><div class="grow b" style={{ fontSize: 18 }}>Últimos metros</div><TypeBadge tipo={o.tipo} /></header>
    <div class="scroll col" style={{ alignItems: 'stretch', paddingTop: 20 }}>
      <div class="center"><div class="b" style={{ fontSize: 20 }}>{o.cliente}</div><div class="muted">{o.direccion} · {o.sector}</div></div>
      <div class="compass" aria-label="Flecha hacia el medidor" style={arrived ? { borderColor: 'var(--ok)' } : undefined}>
        <svg viewBox="0 0 100 100" style={{ transform: `rotate(${rot}deg)` }}><path d="M50 6 80 62 50 50 20 62z" fill={arrived ? '#0B7A4B' : '#FFC21A'} stroke="#0E1B2C" stroke-width="4" stroke-linejoin="round" /></svg>
      </div>
      <div class="center"><div id="dist" class="num b" style={{ fontSize: 64, lineHeight: 1 }}>{d == null ? '—' : d < 1000 ? Math.round(d) : (d / 1000).toFixed(1)}<span style={{ fontSize: 26 }}> {d != null && d >= 1000 ? 'km' : 'm'}</span></div>
        <div id="rumbo" class="muted" style={{ fontSize: 18 }}>{d != null && b != null && `${Math.round(d)} m al ${cardinal(b)}`}{!sensor && d != null && <span class="small"> · flecha apunta con el norte arriba</span>}</div></div>
      {!pos && <div class="alert warn"><Icon n="warn" />Esperando tu ubicación GPS…</div>}
      {pos && pos.acc > cfg.precisionMala && <div class="alert warn"><Icon n="warn" />Señal GPS débil (±{Math.round(pos.acc)} m). La distancia puede variar.</div>}
      {needPerm && <button class="btn dark block" onClick={askPerm}>ACTIVAR BRÚJULA</button>}
      {arrived && <div class="alert ok" id="arrived" role="alert"><Icon n="check" />¡Llegaste! Estás a menos de {cfg.radioLlegada} m del medidor.</div>}
      {isSim() && <button class="btn ghost block" onClick={() => setWalk(w => !w)}><Icon n="nav" />{walk ? 'Detener caminata simulada' : 'Simular caminata hacia el medidor'}</button>}
    </div>
    <div class="fab"><button class={'btn primary xl' + (arrived ? ' pulse' : '')} id="btn-llegue" onClick={() => go('/registro/' + id)}><Icon n="check" size={28} />LLEGUÉ · REGISTRAR</button></div>
  </div>;
}
