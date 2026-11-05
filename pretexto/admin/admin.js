import * as S from '../js/state.js';
import { icon } from '../js/icons.js';
import { $, esc, toast } from '../js/ui.js';
import { buildMock, fromReal, randomOrder } from './mock-data.js';

const { store } = S;
const DAY = 864e5;
const STAT = ['nuevo', 'preparando', 'en camino', 'entregado'];
const STAT_COL = { nuevo: '#FF5257', preparando: '#FFB84D', 'en camino': '#6FD6CC', entregado: '#43D98B' };
const GO = { nuevo: 'Pasar a preparando', preparando: 'Enviar en camino', 'en camino': 'Marcar entregado' };
const root = $('#root');
let role = sessionStorage.getItem('pz_role'), tab = null, filter = 'activos', fresh = new Set(), auto = null, mockCount = 0;
const asnd = () => S.rd('pz_asnd', false);

(async function init() {
  if (new URLSearchParams(location.search).has('reset')) { Object.values(S.K).forEach(k => localStorage.removeItem(k)); location.replace(location.pathname); return; }
  await S.load('../');
  seedOrders();
  role ? shell() : login();
  S.onBroadcast(m => { if (!role) return; if (m.type === 'new') alertNew(m.id); if (tab === 'pedidos') view(); });
})();

function seedOrders() {
  if (S.rd(S.K.seeded, false)) return;
  S.wr(S.K.seeded, true);
  if (S.orders().length) return;
  const n = Date.now(), ids = ['0119', '0120', '0121', '0122'];
  const sts = ['entregado', 'en camino', 'preparando', 'nuevo'], ago = [48, 27, 12, 3];
  const os = ids.map((id, i) => { const o = randomOrder(S, id); o.ts = n - ago[i] * 6e4; o.status = sts[i]; return o; });
  S.saveOrders(os.reverse());
  S.wr(S.K.seq, 122);
}

// ---------- Login simulado ----------
function login() {
  root.innerHTML = `<div class="login"><img src="../icons/logo-160.png" alt="El Pretexto"><h1>Panel El Pretexto</h1><p>Acceso de demostración. Elige tu rol.</p>
    <button class="btn" data-role="dueno" type="button">Entrar como Dueño</button><button class="btn ghost" data-role="despachador" type="button">Entrar como Despachador</button>
    <p style="font-size:13px"><a href="../" style="color:var(--tx2)">← Volver a la tienda</a></p></div>`;
  root.querySelectorAll('[data-role]').forEach(b => b.onclick = () => { role = b.dataset.role; sessionStorage.setItem('pz_role', role); tab = null; shell(); });
}
const tabsFor = () => role === 'dueno' ? [['resultados', 'Resultados'], ['pedidos', 'Pedidos'], ['productos', 'Productos'], ['config', 'Configuración']] : [['pedidos', 'Pedidos'], ['productos', 'Productos']];

function shell() {
  const ts = tabsFor(); tab = tab || ts[0][0];
  root.innerHTML = `<header class="a-head"><div class="a-top"><img src="../icons/logo-160.png" alt=""><b>Panel</b><span class="role">${role === 'dueno' ? 'Dueño' : 'Despachador'}</span><button class="out" type="button" id="out">Salir</button></div>
    <nav class="tabs" role="tablist">${ts.map(([id, l]) => `<button class="tab" role="tab" data-tab="${id}" aria-selected="${id === tab}">${l}${id === 'pedidos' ? '<span class="cnt" id="cnt" hidden></span>' : ''}</button>`).join('')}</nav></header><main id="view"></main>`;
  $('#out').onclick = () => { sessionStorage.removeItem('pz_role'); clearInterval(auto); role = null; login(); };
  root.querySelectorAll('.tab').forEach(t => t.onclick = () => { tab = t.dataset.tab; root.querySelectorAll('.tab').forEach(x => x.setAttribute('aria-selected', x === t)); view(); });
  view(); countBadge();
  clearInterval(auto); auto = setInterval(() => { if (S.rd('pz_auto', true) && mockCount < 12 && tab === 'pedidos') incoming(); }, 55000);
  setInterval(() => { if (tab === 'pedidos') view(true); }, 30000);
}
const view = (soft) => { const v = $('#view'); if (!v) return; v.onchange = null; const y = scrollY; ({ resultados, pedidos, productos, config }[tab])(v); countBadge(); if (soft) scrollTo(0, y); };
function countBadge() { const c = $('#cnt'); if (!c) return; const n = S.orders().filter(o => o.status === 'nuevo').length; c.hidden = !n; c.textContent = n; }

// ---------- Pedidos ----------
function incoming() {
  const o = randomOrder(S, S.nextId()); mockCount++;
  S.pushOrder(o); alertNew(o.id);
}
function alertNew(id) {
  const a = $('#alert'), o = S.orders().find(x => x.id === id);
  fresh.add(id);
  a.innerHTML = `${icon('bell', 22)}<span>Nuevo pedido #${esc(id)}${o ? ' · ' + S.money(o.total) : ''}</span>`;
  a.classList.add('show'); setTimeout(() => a.classList.remove('show'), 4500);
  if (asnd()) beep();
  document.title = `(1) Pedido #${id} · Panel`; setTimeout(() => { document.title = 'Panel · El Pretexto'; }, 5000);
  if (tab === 'pedidos') view(); countBadge();
}
let actx; function beep() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); [880, 1175].forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = f; g.gain.value = .08; o.connect(g); g.connect(actx.destination); o.start(actx.currentTime + i * .16); o.stop(actx.currentTime + i * .16 + .14); }); } catch { /* sin audio */ } }
const ago = ts => { const m = Math.max(0, Math.round((Date.now() - ts) / 6e4)); return m < 1 ? 'ahora' : m < 60 ? `hace ${m} min` : `hace ${Math.floor(m / 60)} h`; };

function pedidos(v) {
  const all = S.orders(), cnt = s => all.filter(o => o.status === s).length;
  const list = all.filter(o => filter === 'activos' ? o.status !== 'entregado' : o.status === filter);
  v.innerHTML = `<div class="chips" role="group" aria-label="Filtro">${[['activos', 'Activos'], ...STAT.map(s => [s, s[0].toUpperCase() + s.slice(1)])].map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${filter === k}">${l}${k !== 'activos' ? ' · ' + cnt(k) : ''}</button>`).join('')}</div>
    <div class="orders">${list.length ? list.map(card).join('') : '<div class="empty wide">No hay pedidos en esta lista.</div>'}</div>
    <div class="tools"><label class="sw"><input type="checkbox" id="auto" ${S.rd('pz_auto', true) ? 'checked' : ''}><i></i>Pedidos de prueba automáticos</label>
    <label class="sw"><input type="checkbox" id="asnd" ${asnd() ? 'checked' : ''}><i></i>Sonido de alerta</label><button class="btn ghost" id="sim" type="button">Simular pedido entrante</button></div>`;
  v.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filter = b.dataset.f; pedidos(v); });
  v.querySelectorAll('[data-adv]').forEach(b => b.onclick = () => { const l = S.orders(), o = l.find(x => x.id === b.dataset.adv); o.status = STAT[STAT.indexOf(o.status) + 1]; S.saveOrders(l); fresh.delete(o.id); pedidos(v); countBadge(); });
  $('#sim').onclick = incoming;
  $('#auto').onchange = e => S.wr('pz_auto', e.target.checked);
  $('#asnd').onchange = e => { S.wr('pz_asnd', e.target.checked); if (e.target.checked) beep(); };
  setTimeout(() => fresh.clear(), 2600);
}
function card(o) {
  const pay = { efectivo: 'Efectivo', transferencia: 'Transferencia', link: 'Link de pago' }[o.pay];
  return `<article class="oc${fresh.has(o.id) ? ' fresh' : ''}" style="--c:${STAT_COL[o.status]}"><div class="hd"><b>#${esc(o.id)}</b><span class="tg" style="color:${STAT_COL[o.status]}">${o.status}</span><small>${ago(o.ts)}</small></div>
    <div class="it">${o.items.map(i => `${i.qty} × ${esc(i.name)}`).join(' · ')}</div>
    <div class="meta"><b>${S.money(o.total)}</b><span>${esc(o.name)} · ${esc(o.phone)}</span><span>${o.mode === 'entrega' ? esc((o.zone || '') + ' · ' + (o.address || '')) : 'Retiro en local'}</span><span>${pay}</span>${o.hasCig ? '<span class="tg">Incluye tabaco: verificar cédula</span>' : ''}${o.src === 'mock' ? '<span class="tg">demo</span>' : ''}</div>
    ${GO[o.status] ? `<button class="btn go" type="button" data-adv="${o.id}">${GO[o.status]}</button>` : ''}</article>`;
}

// ---------- Productos ----------
function productos(v) {
  const q = (v.dataset.q || '').toLowerCase(), own = role === 'dueno';
  const pr = store.prods.filter(p => !q || (p.name + ' ' + p.short + ' ' + p.cat).toLowerCase().includes(q));
  const cats = [...store.cats, { id: 'cigarrillos', name: 'Cigarrillos (solo agregado en checkout)' }];
  v.innerHTML = `<div class="find"><input class="in" id="q" placeholder="Buscar producto…" value="${esc(v.dataset.q || '')}" aria-label="Buscar producto">${own ? '<button class="btn" id="new" type="button">+ Nuevo</button>' : ''}</div>
    <p class="sub">${own ? 'Los cambios se guardan al salir de cada campo.' : 'Como despachador puedes cambiar stock y marcar agotado.'} Un producto agotado se ve tachado; si se agota toda la categoría, su círculo se apaga.</p>
    ${cats.map(c => { const l = pr.filter(p => p.cat === c.id); return l.length ? `<h2 class="sec">${esc(c.name)}</h2>${l.map(p => pcard(p, own, cats)).join('')}` : ''; }).join('')}`;
  $('#q').oninput = e => { v.dataset.q = e.target.value; const pos = e.target.selectionStart; productos(v); const i = $('#q'); i.focus(); i.setSelectionRange(pos, pos); };
  const nb = $('#new'); if (nb) nb.onclick = () => { store.prods.unshift({ id: 'p-' + Date.now().toString(36), cat: 'cerveza', name: 'Nuevo producto', short: 'Nuevo', size: '750 ml', price: 1, best: false, stock: 20, soldOut: false, img: '' }); S.saveProds(); v.dataset.q = ''; productos(v); toast('Producto creado: edítalo'); };
  v.querySelectorAll('.pr-card').forEach(c => {
    const p = S.prod(c.dataset.id);
    c.addEventListener('change', e => {
      const k = e.target.dataset.k; if (!k) return;
      let val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      if (k === 'price' || k === 'stock') val = Math.max(0, parseFloat(val) || 0);
      p[k] = val; if (k === 'name') p.short = p.short === 'Nuevo' || !p.short ? val : p.short;
      S.saveProds(); toast('Guardado', { ms: 900 }); if (k === 'soldOut' || k === 'stock' || k === 'cat') productos(v);
    });
    const d = c.querySelector('.x'); if (d) d.onclick = () => { if (confirm(`¿Eliminar "${p.name}"?`)) { store.prods.splice(store.prods.indexOf(p), 1); S.saveProds(); productos(v); } };
  });
}
function pcard(p, own, cats) {
  const dis = own ? '' : ' disabled';
  return `<div class="pr-card${S.isOut(p) ? ' out' : ''}" data-id="${p.id}">
    <label class="f w">Nombre<input class="in nm" data-k="name" value="${esc(p.name)}"${dis}></label>
    <label class="f">Precio ($)<input class="in" data-k="price" type="number" step="0.05" min="0" inputmode="decimal" value="${p.price}"${dis}></label>
    <label class="f">Stock<input class="in" data-k="stock" type="number" min="0" inputmode="numeric" value="${p.stock ?? ''}"></label>
    <label class="f">Categoría<select class="in" data-k="cat"${dis}>${cats.map(c => `<option value="${c.id}"${c.id === p.cat ? ' selected' : ''}>${esc(c.name.split(' (')[0])}</option>`).join('')}</select></label>
    <label class="f w">Foto (archivo)<input class="in" data-k="img" placeholder="img/${p.id}.jpg" value="${esc(p.img || '')}"${dis}></label>
    <label class="sw"><input type="checkbox" data-k="soldOut" ${p.soldOut ? 'checked' : ''}><i></i>Agotado</label>
    ${own ? '<button class="x" type="button">Eliminar</button>' : ''}</div>`;
}

// ---------- Configuración ----------
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
function config(v) {
  const c = store.cfg;
  v.innerHTML = `<div class="cfg" style="margin-top:14px">
    <div class="card"><h3>Estado de la tienda</h3>
      <label class="sw"><input type="checkbox" data-k="leySeca.on" ${c.leySeca.on ? 'checked' : ''}><i></i>Ley seca / cerrado temporalmente</label>
      <label class="f" style="margin-top:8px">Mensaje al cliente<input class="in" data-k="leySeca.msg" value="${esc(c.leySeca.msg)}"></label>
      <div style="height:10px"></div>
      <label class="sw"><input type="checkbox" data-k="venderCigarrillos" ${c.venderCigarrillos ? 'checked' : ''}><i></i>Vender cigarrillos (solo como agregado en el checkout)</label>
      <label class="sw"><input type="checkbox" data-k="realImages" ${c.realImages ? 'checked' : ''}><i></i>Usar fotos reales de producto (carpeta img/)</label></div>
    <div class="card"><h3>Pedidos</h3>
      <label class="f">Pedido mínimo ($)<input class="in" data-k="minOrder" type="number" step="0.5" min="0" inputmode="decimal" value="${c.minOrder}"></label>
      <label class="f" style="margin-top:8px">Número de WhatsApp (con 593, sin +)<input class="in" data-k="whatsapp" inputmode="tel" value="${esc(c.whatsapp)}"></label>
      <div class="row2" style="margin-top:8px"><label class="f">Entrega (min)<input class="in" data-k="etaMin" type="number" min="5" value="${c.etaMin}"></label><label class="f">Retiro (min)<input class="in" data-k="pickupMin" type="number" min="5" value="${c.pickupMin || 15}"></label></div></div>
    <div class="card"><h3>Horario de venta por día</h3><p class="note" style="margin:0 0 8px">Si cierra es menor que abre, pasa de medianoche (10:00–02:00).</p>
      ${[1, 2, 3, 4, 5, 6, 0].map(d => { const h = c.hours[d]; return `<div class="hrs"><b>${DIAS[d]}</b><input class="in" type="time" data-k="hours.${d}.open" value="${h.open}" aria-label="Abre ${DIAS[d]}"><input class="in" type="time" data-k="hours.${d}.close" value="${h.close}" aria-label="Cierra ${DIAS[d]}"><label class="sw"><input type="checkbox" data-k="hours.${d}.closed" ${h.closed ? 'checked' : ''}><i></i>Cerrado</label></div>`; }).join('')}</div>
    <div class="card"><h3>Zonas y costo de envío</h3><div id="zones">${c.zones.map((z, i) => `<div class="zrow"><input class="in" data-k="zones.${i}.name" value="${esc(z.name)}" aria-label="Zona"><input class="in" type="number" step="0.25" min="0" inputmode="decimal" data-k="zones.${i}.cost" value="${z.cost}" aria-label="Costo"><button class="x" data-delz="${i}" type="button" aria-label="Eliminar zona" style="border-radius:12px;border:1px solid var(--line)">${icon('close', 18)}</button></div>`).join('')}</div>
      <button class="btn ghost" id="addz" type="button" style="height:44px;font-size:14px">+ Agregar zona</button></div>
    <div class="card wide"><h3>Datos de demostración</h3><p class="note" style="margin:0 0 10px">Borra pedidos, cambios de productos y configuración guardados en este navegador y vuelve a los datos de ejemplo.</p><button class="danger" id="rst" type="button">Restaurar datos demo</button></div></div>`;
  v.onchange = e => {
    const k = e.target.dataset.k; if (!k) return;
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value;
    const path = k.split('.'); let o = store.cfg; path.slice(0, -1).forEach(p => o = o[p]); o[path.at(-1)] = val;
    S.saveCfg(); toast('Guardado', { ms: 900 });
  };
  $('#addz').onclick = () => { store.cfg.zones.push({ id: 'z' + Date.now().toString(36), name: 'Nueva zona', cost: 2 }); S.saveCfg(); config(v); };
  v.querySelectorAll('[data-delz]').forEach(b => b.onclick = () => { store.cfg.zones.splice(+b.dataset.delz, 1); S.saveCfg(); config(v); });
  $('#rst').onclick = () => { if (confirm('¿Restaurar todos los datos demo?')) { Object.values(S.K).forEach(k => localStorage.removeItem(k)); location.reload(); } };
}

// ---------- Resultados ----------
const pct = (a, b) => b ? (a - b) / b * 100 : 0;
const dl = d => `<span class="dl ${d >= 0 ? 'up' : 'dn'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(0)}%</span>`;
const bar = (l, v, max, right, col) => `<div class="br"><span>${esc(l)}</span><span class="t"><i style="width:${Math.max(2, v / max * 100)}%;${col ? 'background:' + col : ''}"></i></span><em>${right}</em></div>`;

function resultados(v) {
  const mock = buildMock(store.prods), real = S.orders().map(o => fromReal({ ...o, items: o.items.map(i => ({ ...i, cat: i.cat || S.prod(i.id)?.cat })) }));
  const all = mock.concat(real), now = Date.now();
  const t0 = new Date(); t0.setHours(0, 0, 0, 0); const d0 = t0.getTime();
  const rg = (a, b) => all.filter(o => o.ts >= a && o.ts < b), sum = l => l.reduce((s, o) => s + o.total, 0);
  const hoy = rg(d0, now + 1), ayer = rg(d0 - DAY, now - DAY + 1), s7 = rg(now - 7 * DAY, now + 1), p7 = rg(now - 14 * DAY, now - 7 * DAY), s30 = rg(now - 30 * DAY, now + 1), p30 = rg(now - 60 * DAY, now - 30 * DAY);
  const tk = l => l.length ? sum(l) / l.length : 0;

  // productos y categorías (30 días)
  const pu = {}, cu = {};
  s30.forEach(o => o.items.forEach(i => { (pu[i.id] ||= { u: 0, r: 0 }); pu[i.id].u += i.qty; pu[i.id].r += i.qty * i.price; (cu[i.cat] ||= 0); cu[i.cat] += i.qty * i.price; }));
  const top = Object.entries(pu).sort((a, b) => b[1].u - a[1].u).slice(0, 5), topMax = top[0]?.[1].u || 1;
  const cats = store.cats.map(c => [c, cu[c.id] || 0]).sort((a, b) => b[1] - a[1]), catMax = cats[0][1] || 1;

  // ventas por día (30 d)
  const days = []; for (let i = 29; i >= 0; i--) { const a = d0 - i * DAY, l = rg(a, a + DAY); days.push({ a, v: sum(l), dow: new Date(a + 12 * 36e5).getDay() }); }
  const dmax = Math.max(...days.map(d => d.v), 1), bw = 100 / 30;
  const spark = `<svg class="spark" viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label="Ventas diarias de los últimos 30 días">${days.map((d, i) => `<rect x="${i * bw + .25}" y="${40 - d.v / dmax * 38}" width="${bw - .5}" height="${d.v / dmax * 38}" rx=".5" fill="${[4, 5, 6].includes(d.dow) ? '#FF5257' : '#8a817d'}"><title>${new Date(d.a).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })}: ${S.money(d.v)}</title></rect>`).join('')}</svg>`;

  // heatmap día × hora (90 d)
  const hm = Array.from({ length: 7 }, () => Array(16).fill(0));
  all.forEach(o => { const d = new Date(o.ts); let h = d.getHours(), w = d.getDay(); if (h < 3) { w = (w + 6) % 7; h += 24; } if (h >= 11) hm[w][h - 11]++; });
  const hmax = Math.max(...hm.flat(), 1), order = [1, 2, 3, 4, 5, 6, 0], LD = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const heat = `<div class="heat" role="img" aria-label="Mapa de pedidos por día y hora, pico de jueves a sábado por la noche"><span></span>${Array.from({ length: 16 }, (_, i) => `<span class="h">${i % 3 === 0 ? (11 + i) % 24 : ''}</span>`).join('')}${order.map(w => `<span class="l">${LD[w]}</span>${hm[w].map((n, i) => `<span class="c" title="${LD[w]} ${(11 + i) % 24}:00 · ${n} pedidos" style="background:rgba(255,82,87,${(.06 + .94 * n / hmax).toFixed(2)})"></span>`).join('')}`).join('')}</div>`;

  // embudo (30 d): mock derivado + eventos reales
  const ev = S.rd(S.K.events, []).filter(e => e.t > now - 30 * DAY), evc = n => ev.filter(e => e.n === n).length;
  const sent = s30.length, cart = Math.round(sent / .74) + evc('cart'), age = Math.round(cart / .33), vis = Math.round(age / .93);
  const f = [['Entró a la página', vis + evc('visit')], ['Pasó el age gate', age + evc('age_ok')], ['Agregó al carrito', cart], ['Envió el pedido', sent]];

  // clientes
  const first = new Map(); all.forEach(o => { if (!first.has(o.cust)) first.set(o.cust, o.ts); });
  const cs = new Map(); s30.forEach(o => { (cs.get(o.cust) || cs.set(o.cust, { n: 0 }).get(o.cust)).n++; });
  let nuevos = 0, recur = 0; cs.forEach((x, c) => first.get(c) >= now - 30 * DAY ? nuevos++ : recur++);
  const ct = nuevos + recur || 1;

  // upsell y combos
  const shown = s30.filter(o => o.ups >= 1), acc = shown.filter(o => o.ups === 2), cmb = s30.filter(o => o.combo);

  v.innerHTML = `<div class="kpis">
    <div class="kpi"><small>Ventas hoy</small><b>${S.money(sum(hoy))}</b>${dl(pct(sum(hoy), sum(ayer)))} <small style="display:inline">vs ayer a esta hora</small></div>
    <div class="kpi"><small>Últimos 7 días</small><b>${S.money(sum(s7))}</b>${dl(pct(sum(s7), sum(p7)))} <small style="display:inline">vs 7 previos</small></div>
    <div class="kpi"><small>Últimos 30 días</small><b>${S.money(sum(s30))}</b>${dl(pct(sum(s30), sum(p30)))} <small style="display:inline">vs 30 previos</small></div>
    <div class="kpi"><small>Ticket promedio</small><b>${S.money(tk(s30))}</b>${dl(pct(tk(s30), tk(p30)))}</div>
    <div class="kpi"><small>Pedidos (30 d)</small><b>${s30.length}</b>${dl(pct(s30.length, p30.length))}</div></div>
    <p class="sub" style="margin-top:10px">Datos de demostración generados para 3 meses; los pedidos nuevos de la tienda se suman en vivo.</p>
    <div class="grid2">
    <section class="card wide"><h3>Ventas diarias · 30 días</h3>${spark}<div class="lg"><span style="--c:#FF5257">Jue–Sáb</span><span style="--c:#8a817d">Resto de la semana</span></div></section>
    <section class="card"><h3>Top 5 productos · 30 días</h3><div class="bars">${top.map(([id, x]) => bar(S.prod(id)?.short || id, x.u, topMax, `${x.u} u · ${S.money(x.r)}`)).join('')}</div></section>
    <section class="card"><h3>Ventas por categoría · 30 días</h3><div class="bars">${cats.map(([c, val]) => bar(c.name, val, catMax, S.money(val), c.accent)).join('')}</div></section>
    <section class="card wide"><h3>Pedidos por día y hora · 90 días</h3>${heat}<p class="note">Los picos están de jueves a sábado entre las 20:00 y la 1:00.</p></section>
    <section class="card"><h3>Embudo · 30 días</h3><div class="fun">${f.map(([l, n], i) => `<div class="st"><span>${l}</span><b>${n.toLocaleString('es-EC')}</b><span class="t"><i style="width:${n / f[0][1] * 100}%"></i></span>${i ? `<small>${(n / f[i - 1][1] * 100).toFixed(0)}% del paso anterior</small>` : '<small>&nbsp;</small>'}</div>`).join('')}</div></section>
    <section class="card"><h3>Clientes · 30 días</h3><div class="split"><i style="width:${recur / ct * 100}%;background:#FF5257"></i><i style="width:${nuevos / ct * 100}%;background:#E2CFC8"></i></div>
      <div class="lg"><span style="--c:#FF5257">Recurrentes ${recur} (${(recur / ct * 100).toFixed(0)}%)</span><span style="--c:#E2CFC8">Nuevos ${nuevos} (${(nuevos / ct * 100).toFixed(0)}%)</span></div>
      <h3 style="margin-top:16px">Combos y sugerencias</h3>
      <div class="bars">${bar('Sugerencia hielo y cola aceptada', acc.length, Math.max(shown.length, 1), `${shown.length ? (acc.length / shown.length * 100).toFixed(0) : 0}% de ${shown.length}`)}${bar('Pedidos con combo', cmb.length, Math.max(s30.length, 1), `${(cmb.length / Math.max(s30.length, 1) * 100).toFixed(0)}% de ${s30.length}`)}</div></section></div>`;
}
