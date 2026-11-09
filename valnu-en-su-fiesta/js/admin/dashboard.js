/* 2.1 Inicio / Resultados */
import { getDashboard } from '../data.js';
import { $, $$, esc, money } from '../util.js';

const RANGES = [['today', 'Hoy'], ['week', 'Semana'], ['month', 'Mes'], ['prevmonth', 'Mes anterior']];
const COLORS = ['#F06FA6', '#7FD1C7', '#B59BE0', '#F4C95D', '#9ED8F0', '#C2467A', '#2A9488', '#F28C28', '#7152B8', '#A6D930', '#C0C4CC'];
let range = 'month', charts = [];

function delta(cur, prev, pp = false) {
  if (pp) { const d = Math.round((cur - prev) * 100); return `<span class="dlt ${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d)} pp</span>`; }
  if (!prev) return cur ? '<span class="dlt up">▲ nuevo</span>' : '<span class="dlt flat">—</span>';
  const d = Math.round(((cur - prev) / prev) * 100);
  return `<span class="dlt ${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d)}%</span>`;
}

export async function render(view, { go }) {
  const draw = async () => {
    charts.forEach((c) => c.destroy()); charts = [];
    const D = await getDashboard(range), c = D.cur, p = D.prev;
    const prevLabel = { today: 'ayer', week: 'sem. anterior', month: 'mes anterior', prevmonth: '2 meses atrás' }[range];
    view.innerHTML = `
    <div class="bar"><div class="seg-a" id="rng">${RANGES.map(([k, l]) => `<button data-r="${k}" class="${k === range ? 'on' : ''}">${l}</button>`).join('')}</div><span class="muted sm">vs. ${prevLabel}</span></div>
    ${D.alerts.length ? `<div class="card alerts"><h3>Requiere atención <span class="pill">${D.alerts.length}</span></h3><ul>${D.alerts.slice(0, 6).map((a) => `<li data-q="${a.quoteId}" class="al-${a.type}"><b class="ak ${a.type}">${{ unanswered: 'Sin responder', nodeposit: 'Sin anticipo', conflict: 'Fechas cruzadas' }[a.type]}</b>${esc(a.text)}<i>Ver →</i></li>`).join('')}${D.alerts.length > 6 ? `<li class="more-al">y ${D.alerts.length - 6} más en Cotizaciones…</li>` : ''}</ul></div>` : ''}
    <div class="kpis">
      <div class="kpi"><small>Cotizaciones recibidas</small><b>${c.received}</b>${delta(c.received, p.received)}</div>
      <div class="kpi"><small>Reservas confirmadas</small><b>${c.booked}</b>${delta(c.booked, p.booked)}</div>
      <div class="kpi"><small>Tasa de cierre</small><b>${Math.round(c.closeRate * 100)}%</b>${delta(c.closeRate, p.closeRate, true)}</div>
      <div class="kpi"><small>Ingresos reservados</small><b>${money(c.income)}</b>${delta(c.income, p.income)}</div>
      <div class="kpi"><small>Ticket promedio</small><b>${money(c.avgTicket)}</b>${delta(c.avgTicket, p.avgTicket)}</div>
      <div class="kpi hi"><small>Próximos eventos (7 días)</small><b>${c.upcoming}</b><span class="dlt flat">con anticipo</span></div>
    </div>
    ${D.chartsNote ? `<p class="muted sm">${D.chartsNote}</p>` : ''}
    <div class="grid2">
      <div class="card pad"><h3>Cotizaciones por semana</h3><div class="cv"><canvas id="cWeeks"></canvas></div></div>
      <div class="card pad"><h3>Ocasiones más pedidas</h3><div class="cv"><canvas id="cOcc"></canvas></div></div>
      <div class="card pad"><h3>Elementos más agregados en el armador</h3><div class="cv tall"><canvas id="cItems"></canvas></div></div>
      <div class="card pad"><h3>Embudo de la landing</h3><div class="funnel" id="funnel"></div>
        <div class="sugg-stat"><div><small>Sugerencias «también llevaron» aceptadas</small><b>${Math.round(D.sugg.rate * 100)}%</b></div><div class="meterbar"><i style="width:${Math.min(100, D.sugg.rate * 100)}%"></i></div><small class="muted">${D.sugg.accepted} aceptadas de ${D.sugg.shown} mostradas</small></div></div>
    </div>
    <p class="muted sm" style="margin-top:14px">Los eventos del embudo se registran en este navegador desde la landing y se suman a los datos históricos de ejemplo.</p>`;

    $$('#rng button', view).forEach((b) => (b.onclick = () => { range = b.dataset.r; draw(); }));
    $$('[data-q]', view).forEach((li) => (li.onclick = () => go(`#/cotizaciones/${li.dataset.q}`)));
    const max = D.funnel[0].n || 1;
    $('#funnel', view).innerHTML = D.funnel.map((f, i) => {
      const conv = i ? (D.funnel[i - 1].n ? Math.round((f.n / D.funnel[i - 1].n) * 100) : 0) : 100;
      return `<div class="fn"><div class="fn-l"><span>${f.label}</span><b>${f.n.toLocaleString('es-EC')}</b></div><div class="fn-b"><i style="width:${Math.max(3, (f.n / max) * 100)}%"></i></div>${i ? `<small>${conv}% del paso anterior</small>` : ''}</div>`;
    }).join('');

    if (window.Chart) {
      Chart.defaults.font.family = 'DM Sans, system-ui, sans-serif'; Chart.defaults.color = '#6A5873';
      const mk = (id, cfg) => { const cv = $('#' + id, view); if (cv) charts.push(new Chart(cv, cfg)); };
      mk('cWeeks', { type: 'bar', data: { labels: D.weeks.map((w) => w.label), datasets: [{ data: D.weeks.map((w) => w.n), backgroundColor: '#F06FA6', borderRadius: 6 }] }, options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#F1E3EB' } }, x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } } } } });
      mk('cOcc', { type: 'doughnut', data: { labels: D.byOccasion.map((o) => o.name), datasets: [{ data: D.byOccasion.map((o) => o.n), backgroundColor: COLORS, borderWidth: 2, borderColor: '#fff' }] }, options: { maintainAspectRatio: false, cutout: '58%', plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } } } } });
      mk('cItems', { type: 'bar', data: { labels: D.topItems.map((i) => i.name), datasets: [{ data: D.topItems.map((i) => i.n), backgroundColor: '#7FD1C7', borderRadius: 6 }] }, options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#F1E3EB' } }, y: { grid: { display: false }, ticks: { font: { size: 11 } } } } } });
    }
  };
  await draw();
  return () => charts.forEach((c) => c.destroy());
}
