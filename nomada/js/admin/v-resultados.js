// Resultados (inicio del Dueño): indicadores con variación + gráficos (Chart.js local).
import * as DB from '../data.js';
import { h, $, money, money0, fDate, toInputDate, fromInputDate, addDays } from '../util.js';
import { icon } from '../icons.js';
import { ORIGENES, BEBIDAS } from './shared.js';

let range = 'mes', custom = null, charts = [];
const C0 = { copper: '#c8873e', bone: '#ece6db', sage: '#8fa57a', slate: '#7c8a99', stone: '#6f6a63', wine: '#a1534a' };

export function destroy() { charts.forEach(c => c.destroy()); charts = []; }

export async function render(el) {
  destroy();
  el.innerHTML = '';
  const tab = (id, l) => h('button', { class: range === id ? 'on' : '', onclick: () => { range = id; render(el); } }, l);
  const today = new Date();
  const c = custom || { from: toInputDate(addDays(today, -13)), to: toInputDate(today) };
  el.append(h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Resultados'), h('p', { id: 'rg-txt' }, '')),
    h('div', { class: 'row gap wrap' }, h('div', { class: 'tabs' }, tab('semana', 'Semana'), tab('mes', 'Mes'), tab('mesAnterior', 'Mes anterior'), tab('custom', 'Personalizado')),
      range === 'custom' ? h('div', { class: 'row gap' }, h('input', { type: 'date', class: 'input', style: { minHeight: '42px', width: 'auto' }, value: c.from, onchange: e => { custom = { ...c, from: e.target.value }; render(el); } }), h('span', { class: 'muted' }, 'a'), h('input', { type: 'date', class: 'input', style: { minHeight: '42px', width: 'auto' }, value: c.to, onchange: e => { custom = { ...c, to: e.target.value }; render(el); } })) : null)));
  const spec = range === 'custom' ? { from: fromInputDate(c.from), to: fromInputDate(c.to) } : range;
  const S = await DB.getStats(spec);
  const rg = S.rango;
  $('#rg-txt').textContent = `${fDate(rg.from, { year: true })} – ${fDate(rg.to, { year: true })} · comparado con los ${rg.dias} días anteriores`;
  const K = S.kpis, ch = S.charts;

  const kpi = (label, key, fmt, { inverse = false, alert = false } = {}) => {
    const d = K[key].delta, up = d > 0.5, down = d < -0.5;
    const good = inverse ? down : up, bad = inverse ? up : down;
    return h('div', { class: 'kpi' + (alert ? ' alert' : '') }, h('span', { class: 'k' }, label), h('span', { class: 'v' }, fmt(K[key].valor)),
      h('span', { class: 'd ' + (good ? 'up' : bad ? 'down' : '') }, `${up ? '▲' : down ? '▼' : '■'} ${Math.abs(d).toFixed(0)} % vs. anterior`));
  };
  el.append(h('div', { class: 'kpis' },
    kpi('Miembros totales', 'miembros', v => v), kpi('Nuevos miembros', 'nuevos', v => v), kpi('Visitas registradas', 'visitas', v => v),
    kpi('Clientes que vuelven', 'retorno', v => v.toFixed(0) + ' %'), kpi('Frecuencia promedio', 'frecuencia', v => v ? v.toFixed(0) + ' d' : '—', { inverse: true }),
    kpi('Ticket promedio', 'ticket', v => money(v.toFixed(1).replace(/\.0$/, ''))), kpi('Gasto de miembros', 'gasto', v => money0(v)), kpi('Premios canjeados', 'canjes', v => v),
    kpi('Clientes en riesgo', 'riesgo', v => v, { inverse: true, alert: true })));

  const box = (title, id, cls = '') => h('div', { class: 'card' }, h('h3', {}, title), h('div', { class: 'chart-box ' + cls }, h('canvas', { id })));
  el.append(
    h('div', { class: 'grid g2' }, box('Nuevos miembros por semana y origen', 'c-nuevos'), box('Visitas por día de la semana', 'c-dia')),
    h('div', { class: 'grid g3' }, box('Visitas por franja horaria', 'c-hora'), box('Distribución por nivel', 'c-nivel'), funnel(ch.embudo)),
    h('div', { class: 'grid g2' }, cohortTable(ch.cohortes), h('div', { class: 'grid' }, bars('Bebida preferida declarada', ch.gustos.bebidas.map(b => ({ k: BEBIDAS[b.k] || b.k, v: b.v }))), bars('Platos favoritos declarados', ch.gustos.platos))),
    h('div', { class: 'card' }, h('h3', {}, 'Ocupación de eventos'), h('div', { class: 'bars' }, ...ch.ocupacion.map(o => {
      const pct = Math.round(o.reservados / o.cupos * 100);
      return h('div', { class: 'bar-row' }, h('div', {}, h('b', {}, o.titulo), h('small', { class: 'muted', style: { display: 'block' } }, `${fDate(o.fecha, { year: true })} · ${o.reservados}/${o.cupos} cupos${o.pasado ? ` · asistieron ${o.asistieron}` : ''}`), h('div', { class: 'b', style: { marginTop: '6px' } }, h('i', { style: { width: pct + '%' } }))), h('b', { style: { textAlign: 'right', fontFamily: 'var(--f-display)', fontSize: '26px' } }, pct + ' %'));
    }))));

  // ---- Chart.js
  const Ch = window.Chart;
  Ch.defaults.color = '#b8b1a4'; Ch.defaults.font.family = "'Inter', system-ui, sans-serif"; Ch.defaults.font.size = 12; Ch.defaults.borderColor = '#2a2622';
  const common = { responsive: true, maintainAspectRatio: false, animation: { duration: 600 }, plugins: { legend: { labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } }, tooltip: { backgroundColor: '#1a1816', borderColor: '#3b362f', borderWidth: 1, titleColor: '#ece6db', bodyColor: '#ece6db', padding: 10 } } };
  const grid = { grid: { color: '#221f1c' }, ticks: { precision: 0 } };
  const colors = { juego: C0.copper, menu: C0.bone, landing: C0.sage, mesero: C0.slate };
  charts.push(new Ch($('#c-nuevos'), { type: 'bar', data: { labels: ch.nuevosSemana.labels, datasets: Object.entries(ch.nuevosSemana.series).map(([k, d]) => ({ label: ORIGENES[k], data: d, backgroundColor: colors[k], borderRadius: 3 })) }, options: { ...common, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, ...grid } } } }));
  charts.push(new Ch($('#c-dia'), { type: 'bar', data: { labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], datasets: [{ label: 'Visitas', data: ch.porDia, backgroundColor: C0.copper, borderRadius: 4 }] }, options: { ...common, plugins: { ...common.plugins, legend: { display: false } }, scales: { x: { grid: { display: false } }, y: grid } } }));
  charts.push(new Ch($('#c-hora'), { type: 'bar', data: { labels: ch.franjas.map(f => f + ' h'), datasets: [{ label: 'Visitas', data: ch.porHora, backgroundColor: C0.bone, borderRadius: 4 }] }, options: { ...common, plugins: { ...common.plugins, legend: { display: false } }, scales: { x: { grid: { display: false } }, y: grid } } }));
  const nl = Object.keys(ch.niveles);
  charts.push(new Ch($('#c-nivel'), { type: 'doughnut', data: { labels: nl, datasets: [{ data: Object.values(ch.niveles), backgroundColor: [C0.stone, C0.copper, C0.bone], borderColor: '#121110', borderWidth: 3 }] }, options: { ...common, cutout: '62%', plugins: { ...common.plugins, legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } } } } }));
}

function funnel(f) {
  const max = Math.max(1, f[0].value);
  return h('div', { class: 'card' }, h('h3', {}, 'Embudo del minijuego'), h('div', { class: 'bars' }, ...f.map((s, i) => h('div', {}, h('div', { class: 'row between' }, h('span', {}, s.label), h('b', {}, s.value, i > 0 && f[i - 1].value ? h('span', { class: 'muted', style: { fontWeight: 400 } }, ` · ${Math.round(s.value / f[i - 1].value * 100)} %`) : '')), h('div', { class: 'bar-row', style: { gridTemplateColumns: '1fr' } }, h('div', { class: 'b', style: { height: '12px' } }, h('i', { style: { width: Math.max(2, s.value / max * 100) + '%', opacity: 1 - i * 0.18 } })))))));
}
function bars(title, rows) {
  const max = Math.max(1, ...rows.map(r => r.v));
  return h('div', { class: 'card' }, h('h3', {}, title), h('div', { class: 'bars' }, ...rows.map(r => h('div', { class: 'bar-row' }, h('div', {}, h('div', { class: 'row between' }, h('span', {}, r.k), h('b', {}, r.v)), h('div', { class: 'b', style: { marginTop: '5px' } }, h('i', { style: { width: r.v / max * 100 + '%' } }))), h('span', {})))));
}
function cohortTable(rows) {
  const cell = v => { const a = (v / 100 * 0.55).toFixed(2); return h('td', {}, h('span', { class: 'heat', style: { background: `rgba(200,135,62,${a})` } }, v + ' %')); };
  return h('div', { class: 'card' }, h('h3', {}, 'Retención por mes de registro'), h('div', { class: 'tbl-wrap', style: { border: 0 } }, h('table', { class: 'tbl cohort', style: { minWidth: 0 } },
    h('thead', {}, h('tr', {}, h('th', {}, 'Cohorte'), h('th', {}, 'Miembros'), h('th', {}, '1+ visita'), h('th', {}, '2+ visitas'), h('th', {}, '3+ visitas'), h('th', {}, '5+ visitas'))),
    h('tbody', {}, ...rows.map(r => h('tr', {}, h('td', {}, h('b', {}, r.label)), h('td', {}, r.miembros), cell(r.p1), cell(r.p2), cell(r.p3), cell(r.p5)))))),
    h('p', { class: 'hint', style: { marginTop: '8px' } }, 'Porcentaje de cada cohorte que alcanzó ese número de visitas.'));
}
