import { useMemo } from 'preact/hooks';
import { useData } from './Supervisor.jsx';
import MapView from '../MapView.jsx';
import { dayKey } from '../../js/data.js';
import { computeAlerts } from './alerts.js';
import { Icon } from '../icons.jsx';
import { nom, hhmm, Skeleton, go } from '../common.jsx';

export default function Monitoreo({ tipos, cfg }) {
  const [d] = useData(dayKey());
  const alerts = useMemo(() => d ? computeAlerts(d.orders, d.pos, d.ops, cfg) : [], [d, cfg]);
  if (!d) return <Skeleton />;
  const { orders, ops, pos } = d; const c = s => orders.filter(o => o.estado === s).length;
  const ver = orders.length ? Math.round(orders.filter(o => o.loc.calidad === 'verificada').length / orders.length * 100) : 0;
  const extra = pos.map(p => { const op = ops.find(o => o.id === p.op); return op && { id: p.op, lat: p.lat, lng: p.lng, color: op.color, label: op.nombre.split(' ').map(x => x[0]).join(''), title: `${op.nombre} · ${hhmm(p.t)}`, stale: Date.now() - p.t > cfg.inactividadMin * 60000 }; }).filter(Boolean);
  const timeline = orders.filter(o => o.ejecucion).sort((a, b) => b.ejecucion.hora - a.ejecucion.hora).slice(0, 14);
  return <div class="col" style={{ gap: 14 }}>
    <div class="row wrap"><h1 class="grow">Monitoreo en vivo</h1><span class="badge b-ok"><Icon n="wifi" />Actualiza cada 5 s</span></div>
    <div class="grid g4">
      <div class="card kpi"><span class="muted small b">ÓRDENES DE HOY</span><b class="num">{orders.length}</b></div>
      <div class="card kpi"><span class="muted small b">PENDIENTES</span><b class="num" style={{ color: 'var(--info)' }}>{c('pendiente')}</b></div>
      <div class="card kpi"><span class="muted small b">HECHAS</span><b class="num" style={{ color: 'var(--ok)' }}>{c('hecha')}</b></div>
      <div class="card kpi"><span class="muted small b">NO EJECUTADAS</span><b class="num" style={{ color: 'var(--bad)' }}>{c('no_ejecutada')}</b></div>
      <div class="card kpi"><span class="muted small b">UBICACIONES VERIFICADAS</span><b class="num">{ver}%</b></div>
    </div>
    <div class="grid g2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))' }}>
      <div class="card" style={{ padding: 0, overflow: 'hidden', minHeight: 440, position: 'relative' }}><div style={{ position: 'absolute', inset: 0 }}><MapView orders={orders} tipos={tipos} extra={extra} fitKey="mon" /></div></div>
      <div class="col">
        <div class="card"><h3 style={{ marginBottom: 8 }}>Alertas {alerts.length > 0 && <span class="badge b-bad">{alerts.length}</span>}</h3>
          {alerts.length === 0 && <div class="muted">Sin alertas. Todo en orden.</div>}
          <div class="col" style={{ gap: 8 }}>{alerts.map(a => <div class={'alert ' + a.lvl} style={{ cursor: a.id ? 'pointer' : 'default' }} onClick={() => a.id && go('/sup/ordenes?id=' + a.id)}><Icon n="warn" />{a.texto}</div>)}</div></div>
        <div class="card"><h3 style={{ marginBottom: 8 }}>Operarios</h3>{ops.map(op => { const m = orders.filter(o => o.asignadoA === op.id), h = m.filter(o => o.estado !== 'pendiente').length; return <div class="row" style={{ padding: '6px 0' }}><span style={{ width: 14, height: 14, borderRadius: 99, background: op.color }} /><span class="grow">{op.nombre}</span><span class="num b">{h}/{m.length}</span></div>; })}</div>
        <div class="card" style={{ maxHeight: 340, overflow: 'auto' }}><h3 style={{ marginBottom: 8 }}>Línea de tiempo de la jornada</h3>
          {timeline.length === 0 && <div class="muted">Aún no hay registros hoy.</div>}
          {timeline.map(o => <div class="row small" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}><b class="num">{hhmm(o.ejecucion.hora)}</b><span class={'badge ' + (o.estado === 'hecha' ? 'b-ok' : 'b-bad')}><Icon n={o.estado === 'hecha' ? 'check' : 'x'} /></span><span class="grow ellip">{tipos[o.tipo].label} · {nom(o)}</span><span class="muted">{ops.find(x => x.id === o.ejecucion.operario)?.nombre.split(' ')[0]}</span></div>)}</div>
      </div>
    </div>
  </div>;
}
