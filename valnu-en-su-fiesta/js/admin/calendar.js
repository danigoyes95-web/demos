/* 2.3 Calendario + control de alquileres */
import { getQuotes, getAvailability, getItems, getOccasions, quoteCode } from '../data.js';
import { $, $$, esc, fmtDate } from '../util.js';
import { STATUS, STATUS_ORDER, dayKey } from './ui.js';

let cursor = new Date(), view = 'month', selected = dayKey(new Date());
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DOW = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export async function render(el, { go }) {
  const [quotes, items, occasions] = await Promise.all([getQuotes(), getItems(), getOccasions()]);
  const events = quotes.filter((q) => q.eventDate && q.status !== 'lost');
  const byDay = {}; events.forEach((q) => (byDay[q.eventDate] ||= []).push(q));
  const occName = (id) => occasions.find((o) => o.id === id)?.name || id;
  const mondayOf = (d) => { const x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const today = dayKey(new Date());

  async function draw() {
    let days = [];
    if (view === 'month') {
      const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 12), start = mondayOf(first);
      const weeks = Math.ceil(((first.getDay() + 6) % 7 + new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()) / 7);
      days = Array.from({ length: weeks * 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
    } else { const s = mondayOf(cursor); days = Array.from({ length: 7 }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return d; }); }
    const title = view === 'month' ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}` : `${days[0].getDate()} ${MONTHS[days[0].getMonth()].slice(0, 3)} – ${days[6].getDate()} ${MONTHS[days[6].getMonth()].slice(0, 3)} ${days[6].getFullYear()}`;
    const cell = (d) => {
      const k = dayKey(d), ev = byDay[k] || [], out = view === 'month' && d.getMonth() !== cursor.getMonth();
      const pills = ev.slice(0, view === 'week' ? 20 : 3).map((q) => `<span class="pillc" style="--bc:${STATUS[q.status].c}" data-q="${q.id}">${esc(q.contact.name.split(' ')[0])} · ${esc(occName(q.occasion).split(' ')[0])}</span>`).join('');
      return `<div class="day ${out ? 'out' : ''} ${k === today ? 'today' : ''} ${k === selected ? 'sel' : ''}" data-d="${k}"><span class="dn">${d.getDate()}</span><div class="pills">${pills}${ev.length > 3 && view === 'month' ? `<span class="more">+${ev.length - 3}</span>` : ''}</div><div class="dots">${ev.slice(0, 6).map((q) => `<i style="background:${STATUS[q.status].c}"></i>`).join('')}</div></div>`;
    };
    el.innerHTML = `<div class="bar wrapbar"><div class="navc"><button class="btn ghost sm" id="pv">‹</button><b class="mtitle">${title}</b><button class="btn ghost sm" id="nx">›</button><button class="btn ghost sm" id="td">Hoy</button></div>
      <div class="seg-a"><button data-v="month" class="${view === 'month' ? 'on' : ''}">Mes</button><button data-v="week" class="${view === 'week' ? 'on' : ''}">Semana</button></div></div>
      <div class="legend">${STATUS_ORDER.filter((s) => s !== 'lost').map((s) => `<span><i style="background:${STATUS[s].c}"></i>${STATUS[s].n}</span>`).join('')}</div>
      <div class="card cal ${view}"><div class="dow">${DOW.map((x) => `<span>${x}</span>`).join('')}</div><div class="days">${days.map(cell).join('')}</div></div>
      <div class="card pad" id="dayp"></div>`;
    $('#pv', el).onclick = () => { view === 'month' ? cursor.setMonth(cursor.getMonth() - 1) : cursor.setDate(cursor.getDate() - 7); draw(); };
    $('#nx', el).onclick = () => { view === 'month' ? cursor.setMonth(cursor.getMonth() + 1) : cursor.setDate(cursor.getDate() + 7); draw(); };
    $('#td', el).onclick = () => { cursor = new Date(); selected = today; draw(); };
    $$('[data-v]', el).forEach((b) => (b.onclick = () => { view = b.dataset.v; draw(); }));
    $$('.day', el).forEach((d) => d.addEventListener('click', (e) => { const q = e.target.closest('[data-q]'); if (q) return go(`#/cotizaciones/${q.dataset.q}`); selected = d.dataset.d; $$('.day', el).forEach((x) => x.classList.toggle('sel', x === d)); dayPanel(); }));
    dayPanel();
  }

  async function dayPanel() {
    const ev = byDay[selected] || [], av = await getAvailability(selected);
    const rentals = items.filter((i) => i.rental);
    $('#dayp', el).innerHTML = `<h3>${fmtDate(selected)}</h3>
      ${ev.length ? `<div class="evlist">${ev.map((q) => `<div class="ev" data-q="${q.id}" style="--bc:${STATUS[q.status].c}"><b>#${quoteCode(q.id)} · ${esc(q.contact.name)}</b><span class="muted sm">${esc(occName(q.occasion))} · ${q.guests || '—'} inv. · ${STATUS[q.status].n}</span><small class="muted">${q.items.map((l) => esc(l.name)).join(', ') || 'Sin elementos'}</small></div>`).join('')}</div>` : '<p class="muted">Sin eventos este día. 🎈</p>'}
      <h4 style="margin:18px 0 8px">Control de alquileres</h4><p class="muted sm" style="margin-top:0">Solo cuentan las reservas con anticipo pagado. Si no queda stock, la landing muestra el elemento como «no disponible» para esta fecha.</p>
      <div class="rent">${rentals.map((i) => { const a = av[i.id]; return `<div class="r-row ${a.available ? '' : 'full'}"><span>${esc(i.name)}</span><span class="muted sm">${a.used}/${a.stock} en uso</span><b class="${a.available ? 'ok' : 'bad'}">${a.available ? `${a.free} libre${a.free === 1 ? '' : 's'}` : (a.used > a.stock ? 'Cruzado' : 'Agotado')}</b></div>`; }).join('')}</div>`;
    $$('[data-q]', $('#dayp', el)).forEach((e) => (e.onclick = () => go(`#/cotizaciones/${e.dataset.q}`)));
  }
  await draw();
}
