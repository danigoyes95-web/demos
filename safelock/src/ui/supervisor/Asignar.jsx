import { useState, useMemo } from 'preact/hooks';
import { useData } from './Supervisor.jsx';
import MapView from '../MapView.jsx';
import { assignOrders, dayKey } from '../../js/data.js';
import { distM, hasLoc } from '../../js/geo.js';
import { nom, Skeleton, TypeBadge, toast, Empty } from '../common.jsx';
import { Icon } from '../icons.jsx';

// Balanceo sugerido: reparte RUTAS DE LECTURA completas (MRU) entre los operarios por cantidad de órdenes y, si hay coordenadas, por cercanía.
// Una cuadrilla recibe rutas enteras: así recorre calles seguidas y no mezcla zonas.
export function suggestBalance(orders, ops) {
  const load = Object.fromEntries(ops.map(o => [o.id, orders.filter(x => x.asignadoA === o.id).length]));
  const cent = Object.fromEntries(ops.map(o => { const m = orders.filter(x => x.asignadoA === o.id && hasLoc(x)); return [o.id, m.length ? { lat: m.reduce((a, x) => a + x.loc.lat, 0) / m.length, lng: m.reduce((a, x) => a + x.loc.lng, 0) / m.length } : null]; }));
  const groups = {}; orders.filter(o => !o.asignadoA && o.estado === 'pendiente').forEach(o => (groups[o.mru || o.sector || '-'] ||= []).push(o));
  const out = {};
  for (const g of Object.values(groups).sort((a, b) => b.length - a.length)) {
    const loc = g.filter(hasLoc), c = loc.length ? { lat: loc.reduce((a, x) => a + x.loc.lat, 0) / loc.length, lng: loc.reduce((a, x) => a + x.loc.lng, 0) / loc.length } : null;
    let best = null, bc = Infinity;
    for (const op of ops) { const km = c && cent[op.id] ? distM(c, cent[op.id]) / 1000 : 0; const cost = km + load[op.id] * 0.6; if (cost < bc) { bc = cost; best = op.id; } }
    g.forEach(o => { out[o.id] = best; }); load[best] += g.length; if (c) cent[best] = c;
  }
  return out;
}
export default function Asignar({ tipos, user }) {
  const [d, reload] = useData(dayKey()); const [sel, setSel] = useState(new Set()), [corners, setCorners] = useState(null), [draw, setDraw] = useState(false), [sector, setSector] = useState(''), [ruta, setRuta] = useState(''), [plan, setPlan] = useState(null);
  const orders = d?.orders || [];
  const poly = corners && corners.length === 2 ? [corners[0], corners[1]] : null;
  const sectores = useMemo(() => [...new Set(orders.map(o => o.sector))].sort(), [orders.length]);
  const rutas = useMemo(() => Object.entries(orders.reduce((a, o) => (o.mru && (a[o.mru] = (a[o.mru] || 0) + 1), a), {})).sort(), [orders.length]);
  if (!d) return <Skeleton />;
  const { ops } = d; const sin = orders.filter(o => !o.asignadoA && o.estado === 'pendiente').length;
  const toggle = id => { const s = new Set(sel); s.has(id) ? s.delete(id) : s.add(id); setSel(s); };
  const onMap = p => { if (!draw) return; if (!corners || corners.length === 2) setCorners([[p.lat, p.lng]]); else { const c = [corners[0], [p.lat, p.lng]]; setCorners(c); const [a, b] = c; const s = new Set(); orders.forEach(o => { if (hasLoc(o) && o.loc.lat >= Math.min(a[0], b[0]) && o.loc.lat <= Math.max(a[0], b[0]) && o.loc.lng >= Math.min(a[1], b[1]) && o.loc.lng <= Math.max(a[1], b[1])) s.add(o.id); }); setSel(s); setDraw(false); } };
  const assign = async (opId) => { await assignOrders([...sel], opId, user.id); toast(`✓ ${sel.size} órdenes asignadas`); setSel(new Set()); setCorners(null); reload(); };
  const apply = async () => { const byOp = {}; Object.entries(plan).forEach(([id, op]) => (byOp[op] ||= []).push(id)); for (const [op, ids] of Object.entries(byOp)) await assignOrders(ids, op, user.id); toast('✓ Balanceo aplicado'); setPlan(null); reload(); };
  const planCount = plan ? ops.map(o => [o, Object.values(plan).filter(x => x === o.id).length]) : null;
  const colorOf = id => ops.find(o => o.id === id)?.color;
  return <div class="col" style={{ gap: 12 }}>
    <div class="row wrap"><h1 class="grow">Asignar órdenes</h1><span class={'badge ' + (sin ? 'b-warn' : 'b-ok')}>{sin} sin asignar</span></div>
    <div class="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))' }}>{ops.map(op => { const m = orders.filter(o => o.asignadoA === op.id); return <div class="card row" style={{ borderLeft: `8px solid ${op.color}` }}><div class="grow"><div class="b">{op.nombre}</div><div class="small muted">{op.cuadrilla}</div></div><div class="num b" style={{ fontSize: 26 }}>{m.length}</div></div>; })}</div>
    <div class="card col">
      <div class="row wrap">
        <select id="sel-ruta" style={{ width: 210 }} value={ruta} onChange={e => setRuta(e.target.value)}><option value="">Por ruta de lectura…</option>{rutas.map(([r, n]) => <option value={r}>{r} · {n} órdenes</option>)}</select>
        <button class="btn sm" id="btn-sel-ruta" disabled={!ruta} onClick={() => setSel(new Set(orders.filter(o => o.mru === ruta && o.estado === 'pendiente').map(o => o.id)))}>Seleccionar ruta</button>
        <select style={{ width: 200 }} value={sector} onChange={e => setSector(e.target.value)}><option value="">Por distrito…</option>{sectores.map(s => <option>{s}</option>)}</select>
        <button class="btn sm" disabled={!sector} onClick={() => setSel(new Set(orders.filter(o => o.sector === sector && o.estado === 'pendiente').map(o => o.id)))}>Seleccionar distrito</button>
        <button class={'btn sm' + (draw ? ' primary' : '')} id="btn-draw" onClick={() => { setDraw(!draw); setCorners(null); }}><Icon n="map" size={20} />{draw ? 'Toca 2 esquinas en el mapa…' : 'Dibujar área en el mapa'}</button>
        <button class="btn sm ghost" onClick={() => { setSel(new Set(orders.filter(o => !o.asignadoA).map(o => o.id))); }}>Seleccionar sin asignar</button>
        <button class="btn sm ghost" onClick={() => { setSel(new Set()); setCorners(null); }}>Limpiar</button>
        <div class="grow" /><button class="btn sm dark" id="btn-balance" disabled={!sin} onClick={() => setPlan(suggestBalance(orders, ops))}><Icon n="users" size={20} />Balanceo sugerido</button></div>
      {plan && <div class="alert info"><Icon n="info" /><div class="grow">Propuesta para {Object.keys(plan).length} órdenes: {planCount.map(([o, n]) => `${o.nombre.split(' ')[0]} +${n}`).join(' · ')}</div><button class="btn sm primary" onClick={apply}>APLICAR</button><button class="btn sm ghost" onClick={() => setPlan(null)}>Descartar</button></div>}
      <div class="row wrap"><b>{sel.size} seleccionadas</b><span class="muted">→ asignar a:</span>{ops.map(op => <button class="btn sm" style={{ borderColor: op.color }} disabled={!sel.size} onClick={() => assign(op.id)}>{op.nombre.split(' ')[0]}</button>)}<button class="btn sm ghost" disabled={!sel.size} onClick={() => assign(null)}>Quitar</button></div>
    </div>
    <div class="card" style={{ padding: 0, height: 380, position: 'relative', overflow: 'hidden' }}><div style={{ position: 'absolute', inset: 0 }}><MapView orders={orders} tipos={tipos} selIds={sel} polygon={poly} onMapClick={onMap} fitKey="asg" /></div></div>
    {orders.length === 0 ? <Empty icon="box" title="No hay órdenes hoy" text="Carga un PDF primero." /> : <div class="tw" style={{ maxHeight: '45vh' }}><table class="t"><thead><tr><th></th><th>Tipo</th><th>CUEN</th><th>Cliente / dirección</th><th>Distrito</th><th>Ruta-sec.</th><th>Asignada a</th></tr></thead>
      <tbody>{orders.slice(0, 300).map(o => <tr class="click" onClick={() => toggle(o.id)}><td><input type="checkbox" checked={sel.has(o.id)} style={{ width: 22, minHeight: 22 }} onChange={() => toggle(o.id)} /></td><td><TypeBadge tipo={o.tipo} /></td><td class="num">{o.cuen}</td><td>{nom(o)}</td><td>{o.sector}</td><td class="num">{o.mru}{o.secuencia ? '-' + o.secuencia : ''}</td><td>{o.asignadoA ? <span class="b" style={{ color: colorOf(o.asignadoA) }}>● {ops.find(x => x.id === o.asignadoA)?.nombre}</span> : <span class="badge b-warn">Sin asignar</span>}{plan?.[o.id] && <span class="badge b-info" style={{ marginLeft: 6 }}>→ {ops.find(x => x.id === plan[o.id])?.nombre.split(' ')[0]}</span>}</td></tr>)}</tbody></table></div>}
    {orders.length > 300 && <div class="muted small">Mostrando 300 de {orders.length} órdenes. Usa los selectores por ruta o distrito para seleccionarlas todas.</div>}
  </div>;
}
