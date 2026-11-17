import { useState, useMemo, useEffect, useRef } from 'preact/hooks';
import { Chart } from 'chart.js/auto';
import { useData } from './Supervisor.jsx';
import { dayKey } from '../../js/data.js';
import { exportCSV, exportXLSX, exportPDF } from '../../js/exports.js';
import { Skeleton, toast } from '../common.jsx';
import { Icon } from '../icons.jsx';

function Canvas({ cfg, h = 260 }) {
  const el = useRef(), ch = useRef();
  useEffect(() => { const st = getComputedStyle(document.documentElement); Chart.defaults.color = st.getPropertyValue('--ink2').trim() || '#555'; Chart.defaults.borderColor = st.getPropertyValue('--line').trim() || '#ddd'; Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
    ch.current?.destroy(); ch.current = new Chart(el.current, { ...cfg, options: { responsive: true, maintainAspectRatio: false, ...cfg.options } }); return () => ch.current?.destroy(); }, [JSON.stringify(cfg)]);
  return <div style={{ height: h, position: 'relative' }}><canvas ref={el} /></div>;
}
const days = n => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return dayKey(d); });
export default function Reportes({ tipos, motivos, cfg }) {
  const [d] = useData(); const [rango, setRango] = useState(14); const [fechaPdf, setFechaPdf] = useState(dayKey());
  const R = useMemo(() => {
    if (!d) return null; const ds = days(rango); const all = d.orders.filter(o => ds.includes(o.fecha));
    const reg = all.filter(o => o.ejecucion); const ok = reg.filter(o => o.estado === 'hecha');
    const porDia = ds.map(f => ({ f, h: reg.filter(o => o.fecha === f && o.estado === 'hecha').length, n: reg.filter(o => o.fecha === f && o.estado === 'no_ejecutada').length }));
    const mot = {}; reg.filter(o => o.estado === 'no_ejecutada').forEach(o => { const k = motivos.find(m => m[0] === o.ejecucion.motivo)?.[1] || o.ejecucion.motivo; mot[k] = (mot[k] || 0) + 1; });
    const prod = d.ops.map(op => ({ op, n: ok.filter(o => o.ejecucion.operario === op.id).length, t: avg(ok.filter(o => o.ejecucion.operario === op.id).map(o => o.ejecucion.durSeg)) }));
    const ver = ds.map(f => { const m = all.filter(o => o.fecha === f); return m.length ? Math.round(m.filter(o => o.loc.calidad === 'verificada').length / m.length * 100) : null; });
    return { ds, all, reg, ok, porDia, mot, prod, ver, efect: reg.length ? Math.round(ok.length / reg.length * 100) : 0, tmed: avg(ok.map(o => o.ejecucion.durSeg)) };
  }, [d, rango]);
  if (!R) return <Skeleton />;
  const base = { tipos, motivos, ops: d.ops };
  const files = (kind) => async () => { const rows = R.all.filter(o => o.estado !== 'pendiente'); const name = `safelock-ordenes-${R.ds[0]}_${R.ds[R.ds.length - 1]}`; try { kind === 'csv' ? exportCSV(rows, tipos, motivos, d.ops, name) : await exportXLSX(rows, tipos, motivos, d.ops, name); toast('✓ Archivo generado'); } catch (e) { toast('No se pudo exportar: ' + e.message); } };
  const pdf = async () => { toast('Generando PDF…'); await exportPDF(d.orders.filter(o => o.fecha === fechaPdf), fechaPdf, tipos, motivos, d.ops, cfg.empresa); };
  const col = { ok: '#0B7A4B', bad: '#B3261E', info: '#1F5FBF', amber: '#FFC21A' };
  return <div class="col" style={{ gap: 14 }}>
    <div class="row wrap"><h1 class="grow">Reportes</h1><div class="seg" style={{ width: 230 }}>{[7, 14].map(n => <button class={rango === n ? 'on' : ''} onClick={() => setRango(n)}>{n} días</button>)}</div></div>
    <div class="grid g4">
      <div class="card kpi"><span class="muted small b">ÓRDENES REGISTRADAS</span><b class="num">{R.reg.length}</b></div>
      <div class="card kpi"><span class="muted small b">EFECTIVIDAD</span><b class="num" style={{ color: 'var(--ok)' }}>{R.efect}%</b></div>
      <div class="card kpi"><span class="muted small b">TIEMPO PROMEDIO / ORDEN</span><b class="num">{R.tmed ? Math.round(R.tmed / 60 * 10) / 10 + ' min' : '—'}</b></div>
      <div class="card kpi"><span class="muted small b">UBICACIONES VERIFICADAS (HOY)</span><b class="num">{R.ver[R.ver.length - 1] ?? 0}%</b></div>
    </div>
    <div class="grid g2">
      <div class="card"><h3>Órdenes por día</h3><Canvas cfg={{ type: 'bar', data: { labels: R.ds.map(f => f.slice(5)), datasets: [{ label: 'Ejecutadas', data: R.porDia.map(x => x.h), backgroundColor: col.ok }, { label: 'No ejecutadas', data: R.porDia.map(x => x.n), backgroundColor: col.bad }] }, options: { scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } } }} /></div>
      <div class="card"><h3>Motivos de no ejecución</h3><Canvas cfg={{ type: 'bar', data: { labels: Object.keys(R.mot), datasets: [{ label: 'Órdenes', data: Object.values(R.mot), backgroundColor: col.bad }] }, options: { indexAxis: 'y', plugins: { legend: { display: false } } } }} /></div>
      <div class="card"><h3>Productividad por operario</h3><Canvas cfg={{ type: 'bar', data: { labels: R.prod.map(p => p.op.nombre), datasets: [{ label: 'Ejecutadas', data: R.prod.map(p => p.n), backgroundColor: R.prod.map(p => p.op.color) }] }, options: { plugins: { legend: { display: false } } } }} />
        <div class="small muted" style={{ marginTop: 6 }}>{R.prod.map(p => `${p.op.nombre.split(' ')[0]}: ${p.t ? Math.round(p.t / 60) + ' min/orden' : '—'}`).join(' · ')}</div></div>
      <div class="card"><h3>% de ubicaciones verificadas (crece con el uso)</h3><Canvas cfg={{ type: 'line', data: { labels: R.ds.map(f => f.slice(5)), datasets: [{ label: '% verificadas', data: R.ver, borderColor: col.info, backgroundColor: col.info, tension: .3, spanGaps: true }] }, options: { scales: { y: { min: 0, max: 100 } }, plugins: { legend: { display: false } } } }} /></div>
    </div>
    <div class="card col"><h3>Exportar</h3><div class="muted small">Formato supuesto, una fila por orden. Se ajusta al formato que pida la empresa eléctrica.</div>
      <div class="row wrap"><button class="btn" id="exp-csv" onClick={files('csv')}><Icon n="download" />CSV</button><button class="btn" id="exp-xlsx" onClick={files('xlsx')}><Icon n="download" />Excel (.xlsx)</button>
        <div class="grow" /><input type="date" style={{ width: 170 }} value={fechaPdf} onInput={e => setFechaPdf(e.target.value)} /><button class="btn dark" id="exp-pdf" onClick={pdf}><Icon n="doc" />Reporte PDF con evidencias</button></div></div>
  </div>;
}
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
