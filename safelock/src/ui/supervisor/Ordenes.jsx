import { useState, useMemo, useEffect } from 'preact/hooks';
import { useData } from './Supervisor.jsx';
import MapView from '../MapView.jsx';
import { TypeBadge, EstadoBadge, CalidadBadge, Modal, Skeleton, Empty, hhmm, money, useRoute } from '../common.jsx';
import { Icon } from '../icons.jsx';
import { photoURL, getHistory, getPhotoRecord } from '../../js/data.js';
import { distM } from '../../js/geo.js';

export default function Ordenes({ tipos, motivos }) {
  const [d] = useData(); const route = useRoute();
  const [f, setF] = useState({ tipo: '', estado: '', operario: '', sector: '', desde: '', hasta: '', q: '' }); const [sel, setSel] = useState(null);
  useEffect(() => { if (route.q.id && d) setSel(d.orders.find(o => o.id === route.q.id) || null); }, [route.q.id, !!d]);
  const rows = useMemo(() => d ? d.orders.filter(o => (!f.tipo || o.tipo === f.tipo) && (!f.estado || o.estado === f.estado) && (!f.operario || o.asignadoA === f.operario) && (!f.sector || o.sector === f.sector) && (!f.desde || o.fecha >= f.desde) && (!f.hasta || o.fecha <= f.hasta) && (!f.q || [o.cuen, o.medidor, o.cliente, o.direccion].some(v => String(v).toLowerCase().includes(f.q.toLowerCase()))))
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.ejecucion?.hora || 0) - (a.ejecucion?.hora || 0)) : [], [d, f]);
  if (!d) return <Skeleton />;
  const sectores = [...new Set(d.orders.map(o => o.sector))].sort(); const S = k => e => setF({ ...f, [k]: e.target.value });
  const opName = id => d.ops.find(o => o.id === id)?.nombre || '—';
  return <div class="col" style={{ gap: 12 }}>
    <h1>Órdenes y evidencias</h1>
    <div class="card grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8 }}>
      <input type="search" placeholder="Buscar…" value={f.q} onInput={S('q')} /><input type="date" value={f.desde} onInput={S('desde')} aria-label="Desde" /><input type="date" value={f.hasta} onInput={S('hasta')} aria-label="Hasta" />
      <select value={f.tipo} onChange={S('tipo')}><option value="">Todos los tipos</option>{Object.entries(tipos).map(([k, t]) => <option value={k}>{t.label}</option>)}</select>
      <select value={f.estado} onChange={S('estado')}><option value="">Todos los estados</option><option value="pendiente">Pendiente</option><option value="hecha">Hecha</option><option value="no_ejecutada">No ejecutada</option></select>
      <select value={f.operario} onChange={S('operario')}><option value="">Todos los operarios</option>{d.ops.map(o => <option value={o.id}>{o.nombre}</option>)}</select>
      <select value={f.sector} onChange={S('sector')}><option value="">Todos los sectores</option>{sectores.map(s => <option>{s}</option>)}</select>
    </div>
    <div class="muted small">{rows.length} órdenes {rows.length > 150 && '(mostrando 150)'}</div>
    {rows.length === 0 ? <Empty icon="search" title="Sin resultados" text="Cambia los filtros." /> : <div class="tw" style={{ maxHeight: '65vh' }}><table class="t"><thead><tr><th>Fecha</th><th>Tipo</th><th>CUEN</th><th>Cliente</th><th>Sector</th><th>Operario</th><th>Estado</th><th>Ubicación</th><th>Fotos</th></tr></thead>
      <tbody>{rows.slice(0, 150).map(o => <tr class="click" onClick={() => setSel(o)}><td class="num">{o.fecha}</td><td><TypeBadge tipo={o.tipo} /></td><td class="num">{o.cuen}</td><td>{o.cliente}</td><td>{o.sector}</td><td>{opName(o.asignadoA)}</td><td><EstadoBadge o={o} /></td><td><CalidadBadge o={o} /></td><td class="num">{o.ejecucion ? o.ejecucion.fotos.length : '—'}</td></tr>)}</tbody></table></div>}
    {sel && <Detalle o={sel} tipos={tipos} motivos={motivos} opName={opName} onClose={() => setSel(null)} />}
  </div>;
}

function Detalle({ o, tipos, motivos, opName, onClose }) {
  const [urls, setUrls] = useState([]), [hist, setHist] = useState([]), [big, setBig] = useState(null), [meta, setMeta] = useState({});
  useEffect(() => { (async () => { const e = o.ejecucion; if (e) { setUrls(await Promise.all(e.fotos.map(async id => ({ id, url: await photoURL(id), meta: (await getPhotoRecord(id))?.meta })))); } setHist(await getHistory(o.id)); })(); }, [o.id]);
  const e = o.ejecucion, tipo = tipos[o.tipo];
  const dist = e?.gps && o.loc?.lat != null ? Math.round(e.distPunto ?? distM(e.gps, o.loc)) : null;
  const campos = e?.si ? tipo.fields.filter(f => !['photos', 'notes', 'nextnote'].includes(f.kind)).map(f => [f.label, (f.options?.find(x => x[0] === e.campos[f.key])?.[1]) ?? e.campos[f.key] ?? '—']) : [];
  return <Modal wide onClose={onClose}><div style={{ minWidth: 0 }}>
    <div class="row wrap"><TypeBadge tipo={o.tipo} /><EstadoBadge o={o} /><CalidadBadge o={o} full /><div class="grow" /><button class="btn ghost sm" onClick={onClose}><Icon n="x" /></button></div>
    <h2 style={{ margin: '8px 0 2px' }}>{o.cliente}</h2><div class="muted">{o.direccion} · {o.sector}</div>
    <div class="grid g4" style={{ margin: '12px 0' }}>{[['CUEN', o.cuen], ['Medidor', o.medidor], ['Cuenta contrato', o.cuentaContrato], ['Operario', opName(o.asignadoA)], ['Fecha', o.fecha], ['Deuda', money(o.deuda)]].map(([k, v]) => <div><div class="small muted">{k}</div><div class="b num">{v}</div></div>)}</div>
    {e ? <>
      {!e.si && <div class="alert bad"><Icon n="x" />No ejecutada: {motivos.find(m => m[0] === e.motivo)?.[1] || e.motivo}</div>}
      {dist != null && dist > 100 && e.si && <div class="alert bad" style={{ marginTop: 8 }}><Icon n="warn" />Registrada a {dist} m del punto de la orden (posible inconsistencia).</div>}
      {e.si && e.fotos.length === 0 && <div class="alert bad" style={{ marginTop: 8 }}><Icon n="warn" />Sin fotos de evidencia.</div>}
      {campos.length > 0 && <table class="t" style={{ margin: '10px 0' }}><tbody>{campos.map(([k, v]) => <tr><td class="muted">{k}</td><td class="b num">{String(v)}</td></tr>)}</tbody></table>}
      {e.obs && <p><b>Observaciones:</b> {e.obs}</p>}
      <div class="small muted">Registrado {new Date(e.hora).toLocaleString('es-EC')} · {opName(e.operario)} · {e.durSeg} s · GPS {e.gps ? `${e.gps.lat.toFixed(5)}, ${e.gps.lng.toFixed(5)} (±${Math.round(e.gps.acc)} m)` : 'no disponible'}</div>
      {urls.length > 0 && <><h3 style={{ margin: '12px 0 6px' }}>Evidencias</h3><div class="thumbs">{urls.map(u => u.url ? <img src={u.url} alt="Evidencia" style={{ cursor: 'zoom-in' }} onClick={() => setBig(u.url)} /> : <div class="vid">🎥</div>)}</div></>}
      {e.gps && <div style={{ height: 220, margin: '12px 0', position: 'relative', borderRadius: 12, overflow: 'hidden' }}><MapView orders={[o]} tipos={tipos} focus={e.gps} extra={[{ id: 'e', lat: e.gps.lat, lng: e.gps.lng, color: '#0B7A4B', label: '✓', title: 'Punto de ejecución' }]} /></div>}
    </> : <div class="alert info"><Icon n="info" />Aún sin registro del operario.</div>}
    <h3 style={{ margin: '12px 0 6px' }}>Historial de cambios</h3>
    {hist.length === 0 ? <div class="muted small">Sin cambios.</div> : hist.map(h => <div class="row small" style={{ padding: '4px 0', borderTop: '1px solid var(--line)' }}><span class="num muted">{new Date(h.t).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })}</span><b>{opName(h.quien) !== '—' ? opName(h.quien) : h.quien}</b><span>{h.que}</span></div>)}
    {big && <div class="modal" style={{ zIndex: 4000 }} onClick={() => setBig(null)}><img src={big} style={{ maxWidth: '95%', maxHeight: '90%', borderRadius: 12 }} /></div>}
  </div></Modal>;
}
