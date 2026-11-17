import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import MapView from '../MapView.jsx';
import { useApp, go, TypeBadge, CalidadBadge, EstadoBadge, Modal, toast, money, hhmm } from '../common.jsx';
import { Icon } from '../icons.jsx';
import { useGps, distM, fmtDist, etaMin, hasLoc, useWakeLock, vibrate, startGps } from '../../js/geo.js';
import { setLocation, photoURL } from '../../js/data.js';
import { useToday, useRoutePlan, navUrl, NAV_KEY } from './hooks.js';

export default function Mapa({ id }) {
  const { user, tipos, cfg } = useApp();
  const [orders, reload] = useToday(user.id);
  const { pos } = useGps();
  const [modal, setModal] = useState(null), [edit, setEdit] = useState(null), [nota, setNota] = useState(null);
  const mapRef = useRef(); const warned = useRef('');
  useWakeLock();
  useEffect(() => { startGps(); }, []);
  const { route, rank } = useRoutePlan(orders, pos, user.id, cfg);
  const sel = orders?.find(o => o.id === id);
  const d = sel && pos && hasLoc(sel) ? distM(pos, sel.loc) : null;
  const arrived = d != null && d <= cfg.radioLlegada;
  useEffect(() => { if (arrived && warned.current !== sel.id) { warned.current = sel.id; vibrate([200, 100, 200]); toast('📍 Llegaste al punto. Toca LLEGUÉ'); } }, [arrived, sel?.id]);
  const routeIds = useMemo(() => route.slice(0, 40).map(o => o.id), [route]);
  const navigate = () => { const app = localStorage.getItem(NAV_KEY); if (!app) return setModal('navpref'); window.open(navUrl(sel, app), '_blank', 'noopener'); };
  const onSelect = i => go('/mapa/' + i, true);
  const saveEdit = async () => { await setLocation(sel.id, edit.lat, edit.lng, user.id); setEdit(null); toast('✓ Ubicación guardada como verificada'); reload(); };

  return <div class="shell">
    <header class="top"><button aria-label="Volver" onClick={() => go('/')} style={{ color: '#fff' }}><Icon n="back" size={28} /></button>
      <div class="grow b" style={{ fontSize: 18 }}>{sel ? 'Ir a la orden' : 'Mapa de hoy'}</div>
      <div class="seg" style={{ width: 150, background: '#26405f' }}><button style={{ color: '#fff' }} onClick={() => go('/')}>Lista</button><button class="on" style={{ color: 'var(--ink)' }}>Mapa</button></div></header>
    <div class="mapwrap">
      {orders && <MapView orders={orders} tipos={tipos} pos={pos} rank={rank} routeIds={routeIds} selId={id} onSelect={onSelect} editPoint={edit} onEdit={setEdit}
        onMapClick={p => edit && setEdit({ lat: p.lat, lng: p.lng })} focus={sel && hasLoc(sel) ? sel.loc : null} fitKey={id} onReady={m => (mapRef.current = m)} />}
      <div style={{ position: 'absolute', left: 10, top: 10, zIndex: 900 }}>
        <button class="btn sm" aria-label="Centrar en mí" style={{ minWidth: 48, padding: 0 }} onClick={() => pos && mapRef.current?.setView([pos.lat, pos.lng], 17)}><Icon n="pin" /></button>
      </div>
      {edit && <div class="sheet"><div class="col"><div class="b">Arrastra el pin hasta el medidor (o toca el mapa)</div>
        <div class="qrow">{pos && <button class="btn" onClick={() => setEdit({ lat: pos.lat, lng: pos.lng })}>Usar mi GPS</button>}<button class="btn primary" onClick={saveEdit}>GUARDAR UBICACIÓN</button></div>
        <button class="btn ghost sm" onClick={() => setEdit(null)}>Cancelar</button></div></div>}
      {sel && !edit && <div class="sheet" id="sheet">
        <div class="row wrap" style={{ gap: 6 }}><TypeBadge tipo={sel.tipo} /><CalidadBadge o={sel} full /><EstadoBadge o={sel} /></div>
        <h2 style={{ margin: '8px 0 2px' }}>{sel.cliente}</h2>
        <div class="muted">{sel.direccion} · {sel.sector}</div>
        <div class="row" style={{ margin: '8px 0', gap: 16 }}>
          <div><span class="b num" style={{ fontSize: 26 }}>{d != null ? fmtDist(d) : '—'}</span> <span class="muted small">{d != null && `· ${etaMin(d, sel.rural)} min aprox.`}</span></div>
          <div class="muted small num">Med. <b>{sel.medidor}</b> · CUEN {sel.cuen}</div>
        </div>
        {arrived && sel.estado === 'pendiente' && <div class="alert ok" style={{ marginBottom: 8 }}><Icon n="pin" />Estás a {Math.round(d)} m. ¡Llegaste!</div>}
        {!hasLoc(sel) && <div class="alert warn" style={{ marginBottom: 8 }}><Icon n="warn" /><div>Sin ubicación guardada. Usa la dirección y las notas, o ubica el punto en el mapa para que la próxima vez sea fácil.</div></div>}
        <div class="qrow" style={{ marginBottom: 10 }}>
          <button class="btn dark" id="btn-nav" onClick={navigate}><Icon n="nav" />NAVEGAR</button>
          {hasLoc(sel) ? <button class="btn dark" id="btn-brujula" onClick={() => go('/brujula/' + sel.id)}><Icon n="compass" />BRÚJULA</button>
            : <button class="btn dark" onClick={() => setEdit(pos ? { lat: pos.lat, lng: pos.lng } : mapRef.current.getCenter())}><Icon n="pin" />UBICAR EN MAPA</button>}
        </div>
        {sel.estado === 'pendiente' ? <button class={'btn primary xl' + (arrived ? ' pulse' : '')} id="btn-llegue" style={{ minHeight: 68 }} onClick={() => go('/registro/' + sel.id)}><Icon n="check" size={28} />LLEGUÉ · REGISTRAR</button>
          : !sel.cerrada && <button class="btn block" onClick={() => go('/registro/' + sel.id)}><Icon n="gear" />Corregir registro</button>}
        <div class="row wrap" style={{ marginTop: 10, gap: 8 }}>
          <button class="btn ghost sm" onClick={() => setModal('foto')} disabled={!sel.fotoLugar}><Icon n="camera" size={20} />Foto del lugar</button>
          <button class="btn ghost sm" onClick={() => setModal('nota')}><Icon n="doc" size={20} />Cómo llegar</button>
          {hasLoc(sel) && <button class="btn ghost sm" onClick={() => setEdit({ lat: sel.loc.lat, lng: sel.loc.lng })}><Icon n="pin" size={20} />Corregir ubicación</button>}
          <button class="btn ghost sm" onClick={() => setModal('mas')}><Icon n="info" size={20} />Más datos</button>
        </div>
      </div>}
      {!sel && orders && <div class="sheet" style={{ padding: 12 }}><div class="row"><Icon n="info" /><div class="grow small">Toca un pin para ver la orden. Los números indican el orden de la ruta sugerida.</div>{route[0] && <button class="btn primary sm" onClick={() => onSelect(route[0].id)}>SIGUIENTE</button>}</div></div>}
    </div>
    {modal === 'navpref' && <Modal onClose={() => setModal(null)}><h2>¿Con qué app navegas?</h2><p class="muted">La elegimos una sola vez. Se abre con giro a giro hasta el medidor.</p>
      <div class="col"><button class="btn dark block" onClick={() => { localStorage.setItem(NAV_KEY, 'google'); setModal(null); window.open(navUrl(sel, 'google'), '_blank', 'noopener'); }}>Google Maps</button>
        <button class="btn dark block" onClick={() => { localStorage.setItem(NAV_KEY, 'waze'); setModal(null); window.open(navUrl(sel, 'waze'), '_blank', 'noopener'); }}>Waze</button></div></Modal>}
    {modal === 'foto' && <FotoLugar o={sel} onClose={() => setModal(null)} />}
    {modal === 'nota' && <Modal onClose={() => setModal(null)}><h2>Cómo llegar</h2>{sel.notaLlegada ? <p style={{ fontSize: 18 }}>“{sel.notaLlegada}”</p> : <p class="muted">Aún no hay referencias de operarios anteriores. Al registrar esta orden podrás dejar una nota para el próximo.</p>}
      <div class="muted small">Dirección: {sel.direccion}, {sel.sector}</div><button class="btn dark block" style={{ marginTop: 12 }} onClick={() => setModal(null)}>CERRAR</button></Modal>}
    {modal === 'mas' && <Modal onClose={() => setModal(null)}><h2>Datos de la orden</h2><table class="t"><tbody>{[['CUEN', sel.cuen], ['Cuenta contrato', sel.cuentaContrato], ['Medidor', sel.medidor], ['Cliente', sel.cliente], ['Dirección', sel.direccion], ['Sector', sel.sector], ['MRU', sel.mru], ['Ruralidad', sel.rural ? 'Rural' : 'Urbano'], ['Secuencia', sel.secuencia], ['Valor adeudado', money(sel.deuda)], ['Planillas', sel.planillas], ['Lectura anterior', sel.lecturaAnterior ?? '—']].map(([k, v]) => <tr><td class="muted">{k}</td><td class="b num">{v}</td></tr>)}</tbody></table>
      <div class="row" style={{ marginTop: 10 }}><span class="small muted grow">App de navegación: {localStorage.getItem(NAV_KEY) || 'sin elegir'}</span><button class="btn ghost sm" onClick={() => { localStorage.removeItem(NAV_KEY); toast('Elige de nuevo al navegar'); }}>Cambiar</button></div>
      <button class="btn dark block" style={{ marginTop: 12 }} onClick={() => setModal(null)}>CERRAR</button></Modal>}
  </div>;
}
function FotoLugar({ o, onClose }) {
  const [u, setU] = useState(null); useEffect(() => { photoURL(o.fotoLugar).then(setU); }, []);
  return <Modal onClose={onClose}><h2>Foto del lugar</h2><p class="muted small">De la visita anterior</p>{u && <img src={u} alt="Fachada y medidor" style={{ width: '100%', borderRadius: 12 }} />}<button class="btn dark block" style={{ marginTop: 12 }} onClick={onClose}>CERRAR</button></Modal>;
}
