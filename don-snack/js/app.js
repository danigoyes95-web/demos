/* APP DEL CLIENTE — Don Snack. Toda lectura/escritura pasa por Data (js/data.js). */
(() => {
const $ = s => document.querySelector(s), app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$' + Number(n).toFixed(2);
const vib = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
const ls = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
const ss = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} } };
const S = { me: null, club: null, cart: ls.get('ds_cart', []), set: null, P: {}, prods: [], combos: [], cats: [], camps: [], del: null, pay: 'efectivo', cash: 'exact', gift: { on: false, msg: '', name: '', other: false, custom: '' }, form: { name: '', phone: '' },
  source: 'normal', q: null, addingTo: null, adv: {}, more: {}, filt: {}, lists: {}, iceNo: false, calc: 6, status: null, route: '' };
const confetti = o => { if (window.confetti && !reduced) window.confetti({ colors: ['#B8894A', '#D2A464', '#FFE14D', '#FF3E8A', '#29C4F0'], disableForReducedMotion: true, ...o }); };

/* ---------- catálogo / estado ---------- */
async function refresh() {
  const [set, prods, combos, cats, camps] = await Promise.all([Data.getSettings(), Data.getProducts(), Data.getCombos(), Data.getCategories(), Data.getCampaigns({ activeOnly: true })]);
  Object.assign(S, { set, prods, combos, cats, camps, P: Object.fromEntries(prods.map(p => [p.id, p])) });
  const id = ls.get('ds_me', null); if (id) { S.me = await Data.getCustomer(id); if (S.me) S.club = await Data.getClub(S.me.id); }
  S.cart = S.cart.filter(l => l.k === 'c' ? S.combos.find(c => c.id === l.id) : S.P[l.id]); await requote();
}
async function requote() { S.q = await Data.quote(S.cart, { customerId: S.me && S.me.id, pickup: S.del && S.del.mode === 'pickup', zoneId: S.del && S.del.zone }); }
const nameOf = (k, id) => k === 'c' ? (S.combos.find(c => c.id === id) || {}).name : (S.P[id] || {}).name;
const qtyOf = (k, id) => (S.cart.find(l => l.k === k && l.id === id) || {}).qty || 0;
const cartN = () => S.cart.reduce((a, l) => a + l.qty, 0);

/* ---------- carrito + deshacer ---------- */
function toastUndo(label, prev) {
  $('#layer .toast')?.remove(); clearTimeout(toastUndo.t);
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.innerHTML = `<span>${esc(label)}</span><button data-a="undo">Deshacer<i></i></button>`;
  t._prev = prev; $('#layer').appendChild(t); toastUndo.t = setTimeout(() => t.remove(), 5000);
}
function toast(msg) { $('#layer .toast')?.remove(); clearTimeout(toastUndo.t); const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<span>${msg}</span>`; $('#layer').appendChild(t); toastUndo.t = setTimeout(() => t.remove(), 3500); }
async function setCart(lines, label, prev) { S.cart = lines; ls.set('ds_cart', lines); await requote(); syncQty(); renderCartbar(); if (S.route === 'checkout') renderCheckout(); if (label) toastUndo(label, prev); }
function fly(from) {
  if (reduced || !from) return; const r = from.getBoundingClientRect(), b = $('#cartbar .cartbtn'); if (!b) return; const t = b.getBoundingClientRect();
  const f = document.createElement('div'); f.className = 'fly'; f.style.left = r.left + r.width / 2 - 17 + 'px'; f.style.top = r.top + r.height / 2 - 17 + 'px'; document.body.appendChild(f);
  requestAnimationFrame(() => { f.style.transform = `translate(${t.left + 30 - r.left - r.width / 2}px,${t.top + 30 - r.top - r.height / 2}px) scale(.4)`; f.style.opacity = '.2'; }); setTimeout(() => f.remove(), 380);
}
async function addLine(k, id, d, from) {
  const prev = JSON.parse(JSON.stringify(S.cart)), cart = JSON.parse(JSON.stringify(S.cart)); let l = cart.find(x => x.k === k && x.id === id);
  if (l) { l.qty = Math.min(20, l.qty + d); if (l.qty <= 0) cart.splice(cart.indexOf(l), 1); } else if (d > 0) cart.push({ k, id, qty: d }); else return;
  S.source = 'normal'; vib(d > 0 ? 12 : 8); if (d > 0) { fly(from); if (!ss.get('ds_added')) { ss.set('ds_added', 1); Data.trackEvent('add'); } }
  const b = $('#cartbar .cartbtn'); b && (b.classList.remove('bump'), void b.offsetWidth, b.classList.add('bump'));
  await setCart(cart, (d > 0 ? 'Agregaste ' : 'Quitaste ') + nameOf(k, id), prev);
}
function qtyHtml(k, id) {
  const q = qtyOf(k, id), p = k === 'p' ? S.P[id] : null; if (p && p.stock <= 0) return '<span class="mut">Agotado</span>';
  return q ? `<div class="qty"><button data-a="add" data-k="${k}" data-id="${id}" data-d="-1" aria-label="Quitar uno">−</button><b>${q}</b><button class="plus" data-a="add" data-k="${k}" data-id="${id}" data-d="1" aria-label="Agregar uno">+</button></div>`
    : `<div class="qty one"><button class="plus" data-a="add" data-k="${k}" data-id="${id}" data-d="1">+ Agregar</button></div>`;
}
function syncQty() { document.querySelectorAll('[data-qk]').forEach(e => { e.innerHTML = qtyHtml(e.dataset.qk, e.dataset.qid); }); }

/* ---------- piezas de UI ---------- */
const disc = p => p.camp ? Math.round((1 - p.unit / p.price) * 100) : 0;
function prodCard(p, o = {}) {
  const cig = p.cat === 'cigarrillos';
  return `<div class="prod ${cig ? 'nophoto' : ''}">${p.camp ? `<span class="tag">-${disc(p)}%</span>` : ''}${cig ? '' : Mascot.imgTag(p)}<div><div class="nm">${esc(p.name)}</div><div class="sz">${esc(p.size)}${p.grape ? ' · ' + esc(p.grape) : ''}${p.country ? ' · ' + esc(p.country) : ''}</div>
${o.cava && p.note ? `<div class="note">“${esc(p.note)}”</div>` : ''}${p.pick && !cig ? '<div><span class="tag" style="position:static;background:var(--gold);color:#121110">ELEGIDO POR DON SNACK</span></div>' : ''}
<div class="pr"><span class="price">${money(p.unit)}</span>${p.camp ? `<span class="old">${money(p.price)}</span>` : ''}</div>${cig ? '<div class="cig">Prohibida la venta a menores de 18 años</div>' : ''}<div data-qk="p" data-qid="${p.id}"></div></div></div>`;
}
const head = (title, skin = '') => `<div class="top ${skin}"><a class="back" href="#/" data-a="back" aria-label="Volver" style="display:grid;place-items:center">←</a><h2>${title}</h2></div>`;
const resp = () => '<div class="resp">CELEBRA RESPONSABLEMENTE · SOLO MAYORES DE 18</div>';
const bannerHtml = skin => {
  let cs = S.camps.filter(c => c.enabled); const only = cs.filter(c => c.skin === skin); if (skin && only.length) cs = only; if (!cs.length) return '';
  return `<div id="banners">${cs.map((c, i) => `<a class="banner ${c.skin} ${i ? 'hide' : ''}" href="#/promo/${c.id}" data-i="${i}"><i>CAMPAÑA</i><b>${esc(c.title)}</b><span>${esc(c.sub)}</span>${cs.length > 1 ? `<div class="dots">${cs.map((_, j) => `<u class="${j === i ? 'on' : ''}"></u>`).join('')}</div>` : ''}</a>`).join('')}</div>`;
};
function rotateBanners() { clearInterval(rotateBanners.t); const bs = [...document.querySelectorAll('#banners .banner')]; if (bs.length < 2) return; let i = 0; rotateBanners.t = setInterval(() => { if (!document.querySelector('#banners')) return clearInterval(rotateBanners.t); bs[i].classList.add('hide'); i = (i + 1) % bs.length; bs[i].classList.remove('hide'); }, 4500); }
function overlay(html, mid, close = true) { const o = document.createElement('div'); o.className = 'ov' + (mid ? ' mid' : ''); o.innerHTML = `<div class="sheet" role="dialog">${html}</div>`; if (close) o.addEventListener('click', e => { if (e.target === o) o.remove(); }); $('#layer').appendChild(o); return o; }
const closeOv = () => document.querySelectorAll('#layer .ov').forEach(o => o.remove());

/* ---------- compuertas: edad y horario ---------- */
function ageGate() {
  document.body.className = ''; app.innerHTML = `<div class="big-state"><div class="cork-hop">${Mascot.don('hello', 190)}</div>${Mascot.logo(52)}<h1>¿Eres mayor de 18?</h1><p class="mut" style="margin:0">Venta de licores solo a mayores de edad.</p>
<div class="row" style="width:100%"><button class="btn big" data-a="age" data-v="1">SÍ, SOY MAYOR</button></div><button class="btn sec" data-a="age" data-v="0">NO</button></div>`; $('#cartbar').innerHTML = '';
}
function ageBlock() { document.body.className = ''; app.innerHTML = `<div class="big-state">${Mascot.don('sad', 170)}<h1>¡Nos vemos pronto!</h1><p class="mut">Esta tienda es solo para mayores de 18 años. Vuelve cuando cumplas la mayoría de edad, aquí te esperamos.</p></div>`; $('#cartbar').innerHTML = ''; }
function closedScreen(st) {
  document.body.className = ''; app.innerHTML = `<div class="big-state">${Mascot.don('sleep', 180)}<h1>${st.reason === 'seca' ? 'Hoy descansamos' : 'Estamos cerrados'}</h1><p class="price gold" style="font-size:26px;margin:0">${esc(st.text)}</p><p class="mut">Por ahora no recibimos pedidos. Mientras tanto, puedes ver el catálogo en la tienda.</p>
<p class="mut" style="font-size:15px">Celebra responsablemente 🍷</p><button class="btn ghost" style="min-height:56px;font-size:16px" data-a="skiphours">Modo demo: entrar igual</button></div>`; $('#cartbar').innerHTML = '';
}

/* ---------- inicio ---------- */
async function home() {
  document.body.className = ''; const me = S.me; let usual = null, ronda = null, recent = [];
  if (me) { [usual, ronda, recent] = await Promise.all([Data.getUsual(me.id), Data.getRonda(me.id), Data.getRecent(me.id, 4)]); if (usual) recent = recent.filter(r => r.orderId !== usual.orderId).slice(0, 3); else recent = recent.slice(0, 3); }
  S.lists = { usual, ronda, recent }; const top = await Data.getTopProducts(6);
  const feat = S.camps.flatMap(c => S.prods.filter(p => p.camp === c.id)).filter((p, i, a) => a.findIndex(x => x.id === p.id) === i).slice(0, 4);
  app.innerHTML = `<div style="padding-top:14px;display:flex;justify-content:space-between;align-items:center">${Mascot.logo(40)}${me && S.club ? `<a href="#/club" class="tier ${S.club.tier}">${Data.tierName(S.club.tier)}</a>` : (me ? '<a href="#/club" class="tier socio">Únete al Club</a>' : '')}</div>${bannerHtml()}
${me ? `<div class="hello"><h1>Hola, ${esc(me.name.split(' ')[0])} 👋</h1><div>${Mascot.don('hello', 84)}</div></div>` : `<div class="hello"><h1>¿Qué se te antoja hoy?</h1><div>${Mascot.don('hello', 84)}</div></div>`}
${usual ? `<button class="usual" data-a="usual"><small>Un toque y listo</small><h2>¿LO DE SIEMPRE?</h2><p>${esc(usual.text)}</p><p style="opacity:.8;font-size:16px;margin-top:4px">${usual.pickup ? 'Retiro en tienda' : 'a tu dirección de siempre'}</p><span class="price">${money(usual.total)}</span></button>` : ''}
${ronda ? `<div class="gap"></div><button class="btn big sec" data-a="ronda" style="justify-content:space-between"><span>🍻 Otra ronda</span><span style="font-size:15px;font-weight:600;color:var(--mut);text-align:right;max-width:55%">${esc(ronda.text.slice(0, 38))}${ronda.text.length > 38 ? '…' : ''}</span></button>` : ''}
${recent.length ? `<div class="sect"><h3>Tus pedidos anteriores</h3></div><div class="minirow">${recent.map((r, i) => `<button class="mini" data-a="repeat" data-i="${i}"><b>${esc(new Date(r.at).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric' }))}</b><small>${esc(r.text.slice(0, 70))}${r.text.length > 70 ? '…' : ''}</small><span class="price">${money(r.total)}</span></button>`).join('')}</div>` : ''}
<div class="doors"><a class="door previa" href="#/previa"><em>🔥</em><b>Para la<br>previa</b><span>Combos de fiesta y pedido rápido</span></a><a class="door cava" href="#/cava"><em>🍷</em><b>Cava y regalos</b><span>Vinos, espumantes y licores premium. Te ayudamos a elegir.</span></a></div>
${feat.length ? `<div class="sect"><h2>${esc(S.camps.find(c => c.id === feat[0].camp).title)}</h2></div>${feat.map(p => prodCard(p, { cava: p.door === 'cava' })).join('')}` : ''}
<div class="sect"><h2>Lo más pedido en Ambato esta semana</h2></div>${top.map(p => prodCard(p)).join('')}
<a class="btn ghost" href="#/fans" style="margin-top:10px">⭐ Fans fav. del mes</a>${resp()}`;
}

/* ---------- puerta PREVIA ---------- */
async function previa() {
  document.body.className = 'skin-pop'; const combos = S.combos.filter(c => c.door === 'previa'), cats = S.cats.filter(c => c.door === 'previa');
  const n = S.calc, plan = calcPlan(n);
  app.innerHTML = `<div class="pop">${head('Para la previa', 'pop')}${bannerHtml('pop')}<h2>Combos listos</h2><div class="gap"></div><div class="combos">${combos.map(c => comboCard(c)).join('')}</div>
<div class="calc"><h2>¿Cuántos son?</h2><div style="display:flex;align-items:baseline;gap:10px"><b class="n" id="calcN">${n}</b><span style="font-weight:800">personas</span></div><input type="range" min="2" max="20" value="${n}" id="calcR" aria-label="Cantidad de personas"><div id="calcT" style="font-weight:700;margin:4px 0 10px">${plan.text}</div><button class="btn" style="background:#121110;color:#fff" data-a="calc">Agregar todo · <span id="calcP">${money(plan.total)}</span></button></div>
<h2>Categorías</h2><div class="gap"></div><div class="tiles">${cats.map(c => `<a class="tile" href="#/cat/${c.id}"><em>${c.emoji}</em>${esc(c.name)}</a>`).join('')}</div></div>${resp()}`;
  rotateBanners();
}
function comboCard(c) {
  const lines = c.items.map(i => `${i.qty} ${(S.P[i.id] || {}).name || ''}`).join(', ');
  return `<button class="combo" data-a="add" data-k="c" data-id="${c.id}" data-d="1"><b>${esc(c.name)}</b><p>${esc(c.desc)}</p><span class="price">${money(c.price)}</span><s>${money(c.old)}</s><br><span class="addtxt">+ Agregar combo${qtyOf('c', c.id) ? ' (' + qtyOf('c', c.id) + ' en tu pedido)' : ''}</span></button>`;
}
function calcPlan(n) {
  const L = [{ id: 'ron-abuelo', qty: Math.ceil(n / 5) }, { id: 'cola-2l', qty: Math.ceil(n / 3) }, { id: 'hielo-2', qty: Math.ceil(n / 4) }, { id: 'papas', qty: Math.ceil(n / 4) }, { id: 'vasos-50', qty: 1 }].filter(l => S.P[l.id]);
  return { L, total: L.reduce((a, l) => a + S.P[l.id].unit * l.qty, 0), text: L.map(l => `${l.qty} ${S.P[l.id].name}${S.P[l.id].size.includes('L') ? ' ' + S.P[l.id].size : ''}`).join(' · ') };
}

/* ---------- categorías ---------- */
async function category(id) {
  const cat = S.cats.find(c => c.id === id); if (!cat) return (location.hash = '#/');
  const cava = cat.door === 'cava'; document.body.className = cava ? 'skin-cava' : 'skin-pop';
  let list = S.prods.filter(p => p.cat === id).sort((a, b) => (b.best - a.best) || (b.pick - a.pick) || b.sales - a.sales);
  const f = S.filt[id] || {}; let chips = '';
  if (id === 'vinos') { const gs = [...new Set(list.map(p => p.grape))], cs = [...new Set(list.map(p => p.country))];
    chips = `<div class="chips" style="margin-bottom:8px"><button class="chip ${!f.grape ? 'on' : ''}" data-a="filt" data-f="grape" data-v="">Todas las cepas</button>${gs.map(g => `<button class="chip ${f.grape === g ? 'on' : ''}" data-a="filt" data-f="grape" data-v="${esc(g)}">${esc(g)}</button>`).join('')}</div><div class="chips" style="margin-bottom:14px"><button class="chip ${!f.country ? 'on' : ''}" data-a="filt" data-f="country" data-v="">Todos los países</button>${cs.map(g => `<button class="chip ${f.country === g ? 'on' : ''}" data-a="filt" data-f="country" data-v="${esc(g)}">${esc(g)}</button>`).join('')}</div>`;
    list = list.filter(p => (!f.grape || p.grape === f.grape) && (!f.country || p.country === f.country)); }
  const all = S.more[id], shown = all ? list : list.slice(0, 8);
  app.innerHTML = `<div class="${cava ? 'cava' : 'pop'}">${head(esc(cat.name), cava ? '' : 'pop')}${cat.id === 'cigarrillos' ? '<p class="cig">Prohibida la venta a menores de 18 años.</p>' : ''}${chips}${shown.map(p => prodCard(p, { cava })).join('') || '<p class="mut">No hay productos con ese filtro.</p>'}${list.length > 8 && !all ? `<button class="more" data-a="more" data-id="${id}">Ver ${list.length - 8} más</button>` : ''}</div>${resp()}`;
}
async function promo(id) {
  const c = (await Data.getCampaigns()).find(x => x.id === id); if (!c) return (location.hash = '#/');
  document.body.className = c.skin === 'pop' ? 'skin-pop' : 'skin-cava'; const ps = S.prods.filter(p => c.productIds.includes(p.id) || c.cats.includes(p.cat));
  app.innerHTML = `<div class="${c.skin === 'pop' ? 'pop' : 'cava'}">${head('Campaña', c.skin === 'pop' ? 'pop' : '')}<div class="banner ${c.skin}"><b>${esc(c.title)}</b><span>${esc(c.sub)}</span></div>${ps.map(p => prodCard(p, { cava: p.door === 'cava' })).join('') || '<p class="mut">Mira nuestras puertas para elegir.</p>'}</div>${resp()}`;
}

/* ---------- puerta CAVA ---------- */
const QA = {
  occ: [['cena', '🍽️ Cena'], ['regalo', '🎁 Regalo'], ['celebracion', '🥂 Celebración'], ['yo', '😌 Para mí']],
  kind: [['tinto', '🍷 Tinto'], ['blanco', '🥂 Blanco'], ['espumante', '🍾 Espumante'], ['premium', '✨ Licor premium'], ['nose', '🤷 No sé']],
  budget: [['15', 'Hasta $15'], ['30', '$15–30'], ['60', '$30–60'], ['99', 'Más de $60']] };
async function cava() {
  document.body.className = 'skin-cava'; const a = S.adv, step = !a.occ ? 1 : !a.kind ? 2 : !a.budget ? 3 : 4; let box = '';
  if (step < 4) { const key = ['', 'occ', 'kind', 'budget'][step], q = ['', '¿Para qué es?', '¿Qué te gusta?', '¿Cuál es tu presupuesto?'][step];
    box = `<div class="card advq"><small class="gold" style="font-weight:800">PREGUNTA ${step} DE 3</small><h2 style="margin:4px 0 12px">${q}</h2><div class="chips grid">${QA[key].map(([v, l]) => `<button class="chip" data-a="adv" data-k="${key}" data-v="${v}">${l}</button>`).join('')}</div></div>`; }
  else { const recs = await Data.recommendWine({ occasion: a.occ, kind: a.kind, budget: +a.budget }); S.recs = recs; if (!a.counted) { a.counted = 1; Data.trackEvent('adv'); }
    box = `<h2 style="margin:4px 0 10px">Te recomendamos</h2>${recs.map(p => `<div class="rec"><span class="by">ELEGIDO POR DON SNACK</span><div style="display:grid;grid-template-columns:92px 1fr;gap:12px">${Mascot.imgTag(p, '')}<div><div class="nm">${esc(p.name)}</div><div class="mut" style="font-size:15px">${esc(p.size)}${p.grape ? ' · ' + esc(p.grape) : ''}</div><div class="pr"><span class="price">${money(p.unit)}</span>${p.camp ? `<span class="old" style="text-decoration:line-through;color:var(--mut);margin-left:8px">${money(p.price)}</span>` : ''}</div></div></div><div class="why">“${esc(p.why)}”</div><div data-qk="p" data-qid="${p.id}" data-adv="1"></div></div>`).join('') || '<p class="mut">Sin recomendaciones con esos filtros.</p>'}<button class="btn sec" data-a="advreset">↺ Volver a elegir</button>`; }
  const wc = S.combos.filter(c => c.door === 'cava'), cats = S.cats.filter(c => c.door === 'cava');
  app.innerHTML = `<div class="cava">${head('Cava y regalos')}${bannerHtml('elegante')}<h1 style="font-size:30px;margin:8px 0 12px;color:var(--gold2)">Te ayudamos a elegir</h1>${box}
<div class="sect"><h2>Wine Combos</h2></div><div class="combos">${wc.map(c => comboCard(c)).join('')}</div><div class="sect"><h2>Catálogo</h2></div><div class="tiles">${cats.map(c => `<a class="tile" href="#/cat/${c.id}"><em>${c.emoji}</em>${esc(c.name)}</a>`).join('')}</div></div>${resp()}`; rotateBanners();
}

/* ---------- checkout ---------- */
const km = (a, b, c, d) => { const R = 6371, t = x => x * Math.PI / 180, dl = t(c - a), dg = t(d - b), h = Math.sin(dl / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(dg / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
function nearestZone(lat, lng) { let best = null, bd = 1e9; S.set.zones.forEach(z => { const d = km(lat, lng, z.lat, z.lng); if (d < bd) { bd = d; best = z; } }); return best && bd <= best.r + 0.8 ? best.id : ''; }
function initDel() { if (S.del) return; const m = S.me; S.del = m && m.address && m.address.lat ? { mode: 'saved', lat: m.address.lat, lng: m.address.lng, zone: m.zone || nearestZone(m.address.lat, m.address.lng), text: m.address.text, ref: m.address.ref || '' } : { mode: null, ref: '' }; }
function canOrder() {
  if (!S.cart.length || !S.q) return false; const d = S.del || {}; if (!S.me && !(S.form.name.trim().length >= 2 && S.form.phone.replace(/\D/g, '').length >= 9)) return false;
  if (!d.mode || d.locating) return false; if (d.mode !== 'pickup' && !d.zone) return false; return S.q.minOk;
}
async function renderCheckout() {
  if (S.route !== 'checkout') return; document.body.className = ''; await Promise.all([]);
  if (!S.cart.length) { app.innerHTML = `${head('Tu pedido')}<div class="big-state" style="min-height:50vh">${Mascot.don('sad', 130)}<h2>Tu carrito está vacío</h2><a class="btn" href="#/">Ver el catálogo</a></div>`; $('#cartbar').innerHTML = ''; return; }
  initDel(); await requote(); const q = S.q, d = S.del, set = S.set, total = q.total + (S.gift.on ? set.giftWrap : 0), hasCig = S.cart.some(l => l.k === 'p' && S.P[l.id] && S.P[l.id].cat === 'cigarrillos');
  if (S.pay === 'efectivo' && typeof S.cash === 'number' && S.cash < total) S.cash = 'exact';
  const z = set.zones.find(x => x.id === d.zone), cashOpts = [20, 50, 100].filter(v => v >= total).slice(0, 2);
  const lines = q.lines.map(l => `<div class="line"><div><div class="nm">${esc(l.name)}</div><div class="sub">${esc(l.size || '')} · ${money(l.unit)} c/u</div></div><div style="text-align:right"><div class="qty"><button data-a="add" data-k="${l.k}" data-id="${l.id}" data-d="-1" aria-label="Quitar uno">−</button><b>${l.qty}</b><button class="plus" data-a="add" data-k="${l.k}" data-id="${l.id}" data-d="1" aria-label="Agregar uno">+</button></div></div></div>`).join('');
  const ice = !S.iceNo && S.cart.length && !q.lines.some(l => l.id.startsWith('hielo') || l.id === 'tonica' || l.id === 'cola-2l' || l.id === 'sprite-2l') && !q.freeIce && q.lines.some(l => ['ron', 'whisky', 'vodka', 'tequila'].includes(l.cat));
  app.innerHTML = `${head('Tu pedido')}<div class="card">${lines}${q.freeIce ? '<div class="line"><div class="nm gold">🎁 Hielo gratis (VIP)</div><div class="price" style="font-size:20px">$0.00</div></div>' : ''}</div>
${ice ? `<div class="suggest">🧊 ¿Te falta el hielo?<span style="flex:1"></span><button data-a="addice">+ Hielo ${money(S.P['hielo-2'].unit)}</button></div>` : ''}
<div class="sect"><h3>Entrega</h3></div><div class="seg">
<button class="opt ${d.mode === 'gps' ? 'on' : ''}" data-a="del" data-v="gps"><span class="ic">📍</span><span>Mi ubicación actual<small>${d.mode === 'gps' ? (d.locating ? 'Buscando tu ubicación…' : d.zone ? 'Mueve el pin si hace falta' : 'Fuera de zona de entrega') : 'GPS + pin para confirmar'}</small></span></button>
${S.me && S.me.address && S.me.address.lat ? `<button class="opt ${d.mode === 'saved' ? 'on' : ''}" data-a="del" data-v="saved"><span class="ic">🏠</span><span>Mi dirección guardada<small>${esc(S.me.address.text)}</small></span></button>` : ''}
<button class="opt ${d.mode === 'pickup' ? 'on' : ''}" data-a="del" data-v="pickup"><span class="ic">🏪</span><span>Retiro en tienda<small>${esc(set.address)}</small></span></button></div>
${d.mode === 'gps' && !d.locating ? `<div id="map"></div><div class="chips" style="margin-bottom:6px"><span class="mut" style="width:100%;font-size:15px">O elige tu barrio:</span>${set.zones.map(zz => `<button class="chip ${d.zone === zz.id ? 'on' : ''}" style="min-height:56px" data-a="zone" data-v="${zz.id}">${esc(zz.name)}</button>`).join('')}</div>` : ''}
${d.mode && d.mode !== 'pickup' && d.zone ? `<p class="mut" style="margin:8px 0">Zona <b class="gold">${esc(z.name)}</b> · ${q.freeDelivery ? '<b class="gold">envío gratis</b>' : 'envío ' + money(z.fee)} · ~${z.eta} min</p>` : ''}
${d.mode && d.mode !== 'pickup' ? `<div class="chips" style="margin:8px 0"><span class="mut" style="width:100%;font-size:15px">Referencia (opcional):</span>${['Portón negro', 'Casa blanca', 'Edificio', 'Junto a la tienda', 'Llamar al llegar'].map(r => `<button class="chip ${d.ref === r ? 'on' : ''}" style="min-height:56px" data-a="ref" data-v="${r}">${r}</button>`).join('')}</div>` : ''}
<div class="sect"><h3>Pago</h3></div><div class="chips grid">${[['efectivo', '💵 Efectivo'], ['transferencia', '🏦 Transferencia'], ['payphone', '📲 Payphone']].filter(([k]) => set.payments[k]).map(([k, l]) => `<button class="chip ${S.pay === k ? 'on' : ''}" data-a="pay" data-v="${k}">${l}</button>`).join('')}</div>
${S.pay === 'efectivo' ? `<p class="mut" style="margin:12px 0 6px">¿Con cuánto pagas?</p><div class="chips grid">${cashOpts.map(v => `<button class="chip ${S.cash === v ? 'on' : ''}" data-a="cash" data-v="${v}">${money(v).replace('.00', '')}</button>`).join('')}<button class="chip ${S.cash === 'exact' ? 'on' : ''}" data-a="cash" data-v="exact">Exacto</button></div>` : ''}
<div class="sect"><h3>🎁 ¿Es un regalo?</h3><button class="chip ${S.gift.on ? 'on' : ''}" style="min-height:56px" data-a="gift">${S.gift.on ? 'Sí · +' + money(set.giftWrap) : 'No'}</button></div>
${S.gift.on ? `<div class="card"><p style="margin:0 0 8px" class="mut">Empaque de regalo incluido. Elige un mensaje para la tarjeta:</p><div class="chips">${set.giftMessages.map(m => `<button class="chip ${S.gift.msg === m ? 'on' : ''}" style="min-height:56px" data-a="giftmsg" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</div><div class="gap"></div><input class="field" id="giftCustom" placeholder="Mensaje propio (opcional)" value="${esc(S.gift.custom)}" maxlength="80"><div class="gap"></div><button class="opt ${S.gift.other ? 'on' : ''}" data-a="giftother"><span class="ic">🚚</span><span>Entregar a otra persona<small>Pon el pin en su dirección</small></span></button>${S.gift.other ? `<div class="gap"></div><input class="field" id="giftName" placeholder="Nombre de quien recibe" value="${esc(S.gift.name)}">` : ''}</div>` : ''}
${S.me ? `<p class="mut" style="margin:14px 0 0">Pedido a nombre de <b class="cream">${esc(S.me.name)}</b></p>` : `<div class="sect"><h3>Tus datos (solo esta vez)</h3></div><input class="field" id="fName" placeholder="Tu nombre" value="${esc(S.form.name)}" autocomplete="name"><div class="gap"></div><input class="field" id="fPhone" inputmode="tel" placeholder="Tu WhatsApp" value="${esc(S.form.phone)}" autocomplete="tel">`}
<div class="sect"><h3>Resumen</h3></div><div class="tot"><span>Productos</span><span>${money(q.subtotal)}</span></div>${q.discount > 0 ? `<div class="tot"><span class="gold">Ahorro</span><span class="gold">−${money(q.discount)}</span></div>` : ''}<div class="tot"><span>Envío</span><span>${d.mode === 'pickup' ? 'Retiro' : q.freeDelivery ? 'GRATIS' : d.zone ? money(q.fee) : '—'}</span></div>${S.gift.on ? `<div class="tot"><span>Empaque regalo</span><span>${money(set.giftWrap)}</span></div>` : ''}<div class="tot big"><span>Total</span><span class="price" id="tTotal">${money(total)}</span></div>
${!q.minOk ? `<p style="color:var(--bad);font-weight:700">Pedido mínimo ${money(q.minOrder)}</p>` : ''}
<p class="legal">Venta solo a mayores de 18 años. Se pedirá la cédula en la entrega.${hasCig ? '<br>Prohibida la venta a menores de 18 años.' : ''}</p>
<div class="slidewrap"><div class="slide ${canOrder() ? '' : 'sending'}" id="slide" tabindex="0" role="button" aria-label="Desliza para pedir"><div class="fill"></div><div class="lbl" id="slbl">${canOrder() ? 'DESLIZA PARA PEDIR' : 'COMPLETA LOS DATOS'}</div><div class="knob">→</div></div></div>${resp()}`;
  $('#cartbar').innerHTML = ''; initSlide(); if (d.mode === 'gps' && !d.locating) mountMap(); bindInputs();
}
function bindInputs() {
  const n = $('#fName'), p = $('#fPhone'), upd = () => { const ok = canOrder(), s = $('#slide'); if (s) { s.classList.toggle('sending', !ok); $('#slbl').textContent = ok ? 'DESLIZA PARA PEDIR' : 'COMPLETA LOS DATOS'; } };
  n && n.addEventListener('input', () => { S.form.name = n.value; upd(); }); p && p.addEventListener('input', () => { S.form.phone = p.value; upd(); });
  const c = $('#giftCustom'); c && c.addEventListener('input', () => S.gift.custom = c.value); const g = $('#giftName'); g && g.addEventListener('input', () => S.gift.name = g.value);
}
function mountMap() {
  const el = $('#map'); if (!el) return; const d = S.del; if (!window.L) { el.innerHTML = '<div class="center mut" style="padding:70px 10px">Mapa sin conexión · elige tu barrio abajo</div>'; return; }
  const map = L.map(el, { zoomControl: false, attributionControl: false }).setView([d.lat, d.lng], 15); L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  const m = L.marker([d.lat, d.lng], { draggable: true }).addTo(map); m.on('dragend', () => { const p = m.getLatLng(); S.del = { ...S.del, lat: +p.lat.toFixed(5), lng: +p.lng.toFixed(5), zone: nearestZone(p.lat, p.lng) }; S.del.text = 'Ubicación en mapa'; renderCheckout(); }); map.on('click', e => m.setLatLng(e.latlng) && m.fire('dragend'));
}
async function locate() {
  const st = S.set.store; S.del = { mode: 'gps', locating: true, ref: (S.del || {}).ref || '' }; await renderCheckout();
  const fin = (lat, lng, real) => { S.del = { mode: 'gps', lat, lng, zone: nearestZone(lat, lng), text: real ? 'Mi ubicación (GPS)' : 'Ubicación en mapa', ref: S.del.ref }; if (!real) toast('No pude ubicarte: mueve el pin a tu casa'); renderCheckout(); };
  if (!navigator.geolocation) return fin(st.lat, st.lng, false);
  navigator.geolocation.getCurrentPosition(p => fin(+p.coords.latitude.toFixed(5), +p.coords.longitude.toFixed(5), true), () => fin(st.lat, st.lng, false), { timeout: 6000, maximumAge: 60000 });
}

/* ---------- deslizar para pedir ---------- */
function initSlide() {
  const s = $('#slide'); if (!s) return; const k = s.querySelector('.knob'), f = s.querySelector('.fill'); let sx = 0, drag = false, max = 0;
  const set = x => { k.style.left = 6 + x + 'px'; f.style.width = x + 74 + 'px'; };
  const down = e => { if (s.classList.contains('sending')) { if (!canOrder()) toast('Completa entrega y datos para pedir'); return; } drag = true; sx = e.clientX; max = s.clientWidth - 80; s.classList.remove('go'); k.setPointerCapture && k.setPointerCapture(e.pointerId); };
  const move = e => { if (!drag) return; let dx = Math.max(0, e.clientX - sx); dx = dx > max * .6 ? max * .6 + (dx - max * .6) * .85 : dx * .95; set(Math.min(max, dx)); if (Math.min(max, dx) > 20 && !move.v) { move.v = 1; vib(8); } };
  const up = e => { if (!drag) return; drag = false; move.v = 0; const x = parseFloat(k.style.left || 6) - 6; if (x >= max * .88) { set(max); vib([20, 30, 20]); placeOrder(); } else { s.classList.add('go'); set(0); } };
  k.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  s.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && canOrder()) { set(s.clientWidth - 80); placeOrder(); } });
}
let placing = false;
async function placeOrder(force) {
  if (placing || !canOrder()) return; placing = true; const sl = $('#slide'); sl && sl.classList.add('sending');
  try {
    const st = await Data.openStatus(); if (!st.open && !ss.get('ds_skip')) { placing = false; return closedScreen(st); }
    if (S.me && !force) { const dup = await Data.findRecentDuplicate(S.me.id, S.cart); if (dup) { placing = false; const o = overlay(`<div class="center">${Mascot.don('hello', 100)}<h2>Ya pediste esto hace ${dup.minutes} min</h2><p class="mut">¿Quieres OTRA igual?</p><button class="btn big" data-a="dupyes">SÍ, OTRA IGUAL</button><div class="gap"></div><button class="btn sec big" data-a="dupno" data-id="${dup.order.id}">NO, VER MI PEDIDO</button></div>`, true, false); return; } }
    const d = S.del; let me = S.me; const addr = d.mode === 'pickup' ? { text: 'Retiro en tienda', zone: '' } : { text: d.text || 'Ubicación', lat: d.lat, lng: d.lng, ref: d.ref || '', zone: d.zone };
    me = await Data.upsertCustomer({ id: me && me.id, name: S.form.name.trim(), phone: S.form.phone.trim(), address: d.mode !== 'pickup' && (!me || !me.address || !me.address.lat || d.mode === 'gps') ? addr : undefined }); ls.set('ds_me', me.id); S.me = me;
    const msg = S.gift.on ? [S.gift.msg, S.gift.custom.trim()].filter(Boolean).join(' · ') : '';
    const online = navigator.onLine !== false;
    const o = await Data.createOrder({ customerId: me.id, lines: S.cart, pickup: d.mode === 'pickup', address: addr, payment: S.pay, cashWith: S.pay === 'efectivo' && S.cash !== 'exact' ? S.cash : null, gift: S.gift.on ? { on: true, msg, name: S.gift.other ? S.gift.name : '', toAddress: S.gift.other ? addr : null } : null, source: S.source, queued: !online });
    ls.set('ds_last_order', o.id); S.cart = []; ls.set('ds_cart', []); S.source = 'normal'; S.gift = { on: false, msg: '', name: '', other: false, custom: '' }; S.addingTo = null;
    confetti({ particleCount: 140, spread: 90, origin: { y: .7 } }); vib([30, 40, 30, 40, 60]);
    await refresh(); const link = await Data.waLink(o);
    if (S.set.autoWhatsApp && online) window.open(link, '_blank', 'noopener');
    placing = false; location.hash = '#/track/' + o.id + (o.payment === 'payphone' ? '?pp=1' : '');
  } catch (e) { console.error(e); placing = false; toast('No se pudo enviar. Intenta de nuevo'); sl && sl.classList.remove('sending'); }
}

/* ---------- seguimiento ---------- */
const STAGES = [['new', 'Recibido'], ['prep', 'Preparando'], ['way', 'En camino'], ['done', 'Entregado']];
async function track(id, q) {
  document.body.className = ''; const o = await Data.getOrder(id); if (!o) return (location.hash = '#/'); $('#cartbar').innerHTML = '';
  const idx = STAGES.findIndex(s => s[0] === o.status), cancel = o.status === 'cancel';
  const elapsed = Math.round((Date.now() - o.createdAt) / 6e4), left = Math.max(0, (o.eta || 30) - elapsed);
  const art = cancel ? Mascot.don('sad', 150) : o.status === 'way' ? Mascot.moto(240) : o.status === 'done' ? Mascot.don('party', 150) : Mascot.don('hello', 150);
  const msg = { new: ['¡Recibimos tu pedido!', 'Lo estamos revisando'], prep: ['Preparando tu pedido', 'Don está armando todo'], way: ['¡En camino!', 'Ya sale hacia tu puerta'], done: ['¡Entregado!', 'Celebra responsablemente 🍷'], cancel: ['Pedido cancelado', 'Escríbenos por WhatsApp para ayudarte'] }[o.status];
  const wa = await Data.waLink(o), me = S.me; const canReg = me && !me.member && me.id === o.customerId, mem = me && me.member;
  app.innerHTML = `<div style="padding-top:14px;display:flex;justify-content:space-between;align-items:center"><a href="#/" class="btn sec" style="width:auto;min-height:56px;font-size:17px">← Inicio</a><b class="gold">#${Data.pad(o.number)}</b></div>
${o.queued ? '<div class="offline" style="margin-top:12px">📶 Sin señal: tu pedido quedó guardado. Envíalo por WhatsApp apenas vuelva la conexión.</div>' : ''}
<div class="stage">${art}<h1>${msg[0]}</h1><p class="mut" style="margin:0">${msg[1]}</p>${!cancel && o.status !== 'done' ? `<div class="eta">${o.pickup ? 'Listo para retirar' : left > 0 ? '~' + left + ' min' : 'Ya casi llega'}</div>` : ''}</div>
${cancel ? '' : `<div class="steps">${STAGES.map((s, i) => `<div class="step ${i <= idx ? 'on' : ''}"><i></i>${s[1]}</div>`).join('')}</div>`}
${q && q.includes('pp=1') ? `<div class="card waq" style="margin-bottom:12px"><b>📲 Payphone (demo)</b><p style="margin:4px 0 0">Te enviamos el link de pago por WhatsApp. En la versión final aquí verás el estado del cobro.</p></div>` : ''}
<div class="card"><h3 style="margin-bottom:6px">Tu pedido</h3>${o.items.map(i => `<div class="tot"><span>${i.qty}× ${esc(i.name)}</span><span>${money(i.price * i.qty)}</span></div>`).join('')}<div class="tot"><span>Envío</span><span>${o.pickup ? 'Retiro' : o.fee ? money(o.fee) : 'Gratis'}</span></div>${o.gift ? `<div class="tot"><span>🎁 Regalo${o.giftMsg ? ': “' + esc(o.giftMsg) + '”' : ''}</span><span>${money(o.giftWrap || 0)}</span></div>` : ''}<div class="tot big"><span>Total · ${esc(o.payment)}</span><span class="price">${money(o.total)}</span></div></div>
<div class="gap"></div>${o.status === 'new' ? `<button class="btn sec" data-a="addmore" data-id="${o.id}">➕ Agregar algo más</button><div class="gap"></div>` : ''}
<a class="btn" style="background:#25D366;color:#06210f" href="${wa}" target="_blank" rel="noopener" data-a="wasent" data-id="${o.id}">💬 Enviar / ver por WhatsApp</a>
${o.status === 'done' ? `<div class="gap"></div><a class="btn" href="#/">Pedir otra vez</a>` : ''}
${canReg ? `<div class="card" style="margin-top:16px;border:1.5px solid var(--gold)"><h3>¿Quieres pedir en 2 toques la próxima vez?</h3><p class="mut" style="margin:6px 0 12px">Crea tu QR del Club Don Snack: pedido rápido, promos y beneficios.</p><button class="btn" data-a="regopen">Crear mi QR del Club</button></div>` : ''}${mem ? '<a class="btn ghost" style="margin-top:14px" href="#/club">Ver Mi Club</a>' : ''}
<div style="text-align:center;margin-top:22px"><button class="mut" style="font-size:15px;text-decoration:underline;min-height:48px" data-a="taxi">¿Necesitas volver a casa?</button></div>${resp()}`;
  if (o.status === 'done' && !track.done[o.id]) { track.done[o.id] = 1; confetti({ particleCount: 90, spread: 80, origin: { y: .5 } }); vib([40, 40, 40]); }
}
track.done = {};

/* ---------- Club ---------- */
async function clubPage() {
  document.body.className = 'skin-cava'; const me = S.me; $('#cartbar').innerHTML = '';
  if (!me || !me.member) { app.innerHTML = `${head('Club Don Snack')}<div class="center" style="padding:20px 0">${Mascot.don('hello', 130)}<h2 class="gold">Pide en 2 toques</h2><p class="mut">Socio: pedido rápido, promos exclusivas y acceso anticipado.</p>${me ? '<button class="btn big" data-a="regopen">Crear mi QR del Club</button>' : '<a class="btn big" href="#/">Haz tu primer pedido para unirte</a>'}</div>${benefits(null)}`; return; }
  const c = S.club, T = S.set.tiers;
  app.innerHTML = `${head('Mi Club')}<div class="card center"><span class="tier ${c.tier}">${Data.tierName(c.tier)}</span><h2 style="margin:10px 0 2px">${esc(me.name)}</h2><p class="mut" style="margin:0">Código ${me.code} · Este mes llevas ${money(c.spent)}</p>
${c.next ? `<div class="bar"><i style="width:${c.next.pct}%"></i></div><p style="margin:0;font-weight:800">Te faltan <span class="gold">${money(c.next.missing)}</span> este mes para ser ${Data.tierName(c.next.name)}</p>` : '<p class="gold" style="font-weight:800">¡Eres Leyenda! Nivel máximo 👑</p>'}</div>
<div class="sect"><h3>Tus beneficios activos</h3></div>${benefits(c.tier)}
<div class="sect"><h3>Tu QR</h3></div><div class="center"><div class="qrbox">${Club.qrSvg(Club.url(me.code), 200)}</div><p class="mut">Escanéalo y pide en 2 toques</p></div>
<a class="btn ghost" href="#/fans" style="margin-top:12px">⭐ Votar mi favorito del mes</a>${resp()}`;
}
function benefits(active) {
  const B = S.set.tierBenefits, order = ['socio', 'vip', 'leyenda'], ai = order.indexOf(active);
  return order.map((t, i) => `<div class="card" style="margin-bottom:10px;opacity:${active && i > ai ? .6 : 1}"><span class="tier ${t}">${Data.tierName(t)}${t === 'vip' ? ` · ≥ ${money(S.set.tiers.vip).replace('.00', '')}/mes` : t === 'leyenda' ? ` · ≥ ${money(S.set.tiers.leyenda).replace('.00', '')}/mes` : ''}</span><ul style="margin:8px 0 0;padding-left:20px">${B[t].map(b => `<li>${i <= ai || !active ? '✓ ' : '🔒 '}${esc(b)}</li>`).join('')}</ul></div>`).join('');
}
function regSheet() {
  overlay(`<h2>Club Don Snack</h2><p class="mut">Crea tu QR y pide en 2 toques la próxima vez.</p><label class="chk"><input type="checkbox" id="cData"><span>Acepto que Don Snack use mis datos (nombre, WhatsApp, dirección y pedidos) para el Club. <b>Obligatorio</b></span></label>
<label class="chk"><input type="checkbox" id="cPromo"><span>Quiero recibir promociones por WhatsApp (opcional)</span></label><p class="mut" style="margin:8px 0 4px;font-size:16px">Cumpleaños para tu regalo (opcional)</p><input type="date" class="field" id="cBirth"><div class="gap"></div><button class="btn big" data-a="regsubmit">Crear mi QR</button>`);
}
async function regSubmit() {
  if (!$('#cData').checked) return toast('Debes aceptar el uso de datos para unirte');
  const c = await Data.createMember(S.me.id, { consentData: true, consentPromo: $('#cPromo').checked, birthday: $('#cBirth').value }); await refresh(); closeOv(); confetti({ particleCount: 120, spread: 80 });
  const svg = Club.design(c, 'iman');
  overlay(`<div class="center"><h2>¡Ya eres Socio!</h2><p class="mut">Pega tu imán en la refri y pide en 2 toques.</p><div class="fridge"><div class="magnet">${svg}</div></div><div class="qrbox" style="padding:8px">${Club.qrSvg(Club.url(c.code), 120)}</div><p>Tu código: <b class="gold">${c.code}</b></p><button class="btn" data-a="clubgo">Ver Mi Club</button></div>`);
  if (location.hash.startsWith('#/track')) track(location.hash.split('/')[2].split('?')[0], '');
}
async function fans() {
  document.body.className = 'skin-cava'; $('#cartbar').innerHTML = ''; const v = await Data.getVotes(S.me && S.me.id), nom = [...new Map([...(await Data.getTopProducts(8)), ...S.prods.filter(p => p.pick)].map(p => [p.id, p])).values()].slice(0, 8), max = Math.max(1, ...v.rank.map(r => r.n));
  app.innerHTML = `${head('⭐ Fans fav.')}<p class="mut">Los miembros del Club votan su producto favorito del mes. ${v.total} votos hasta ahora.</p>${v.rank.slice(0, 5).map((r, i) => `<div class="fan"><span class="pos">${i + 1}</span><div><b>${esc(r.p.name)}</b><div class="bar" style="height:10px"><i style="width:${r.n / max * 100}%"></i></div></div><b class="gold">${r.n}</b></div>`).join('')}
${S.me && S.me.member ? `<div class="sect"><h3>Tu voto${v.mine ? ': ' + esc((S.P[v.mine] || {}).name || '') : ''}</h3></div>${nom.map(p => `<button class="opt ${v.mine === p.id ? 'on' : ''}" style="margin-bottom:8px" data-a="vote" data-id="${p.id}"><span>${esc(p.name)}<small>${esc(p.size)}</small></span></button>`).join('')}` : '<div class="card" style="margin-top:14px">Únete al Club para votar.</div>'}${resp()}`;
}
function taxiSheet() { overlay(`<h2>¿Necesitas volver a casa?</h2><p class="mut">Si tomaste, no manejes. Pide un taxi seguro:</p>${S.set.taxi.map(t => `<a class="btn sec" style="margin-bottom:10px" href="${Data.waTo(t.phone, 'Hola, necesito un taxi seguro para volver a casa.')}" target="_blank" rel="noopener">🚕 ${esc(t.name)}</a>`).join('')}<button class="btn ghost" data-a="closeov">Cerrar</button>`); }

/* ---------- acciones ---------- */
function loadLines(u, source) {
  const m = S.me, saved = m && m.address && m.address.lat;
  S.del = u.pickup ? { mode: 'pickup', ref: '' } : saved ? { mode: 'saved', lat: m.address.lat, lng: m.address.lng, zone: m.zone || nearestZone(m.address.lat, m.address.lng), text: m.address.text, ref: m.address.ref || '' } : { mode: null, ref: '' };
  S.pay = S.set.payments[u.payment] ? u.payment : 'efectivo'; S.cash = 'exact'; S.source = source; return setCart(u.lines.map(l => ({ ...l })), null).then(() => { location.hash = '#/checkout'; });
}
const A = {
  age(el) { ls.set('ds_age', { ok: el.dataset.v === '1', ts: Date.now() }); vib(15); render(); },
  skiphours() { ss.set('ds_skip', 1); render(); },
  add(el) { addLine(el.dataset.k, el.dataset.id, +el.dataset.d, el); if (el.closest('[data-adv]') && +el.dataset.d > 0) Data.trackEvent('advAdd'); },
  async undo(el) { const t = el.closest('.toast'); const prev = t._prev; t.remove(); clearTimeout(toastUndo.t); vib(10); await setCart(prev, null); },
  usual() { vib(15); loadLines(S.lists.usual, 'usual'); },
  ronda() { vib(15); loadLines(S.lists.ronda, 'ronda'); },
  repeat(el) { vib(15); loadLines(S.lists.recent[+el.dataset.i], 'usual'); },
  adv(el) { S.adv[el.dataset.k] = el.dataset.v; vib(10); cava().then(() => { syncQty(); rotateBanners(); window.scrollTo(0, 0); }); }, advreset() { S.adv = {}; cava().then(syncQty); },
  more(el) { S.more[el.dataset.id] = 1; category(el.dataset.id).then(syncQty); },
  filt(el) { (S.filt[S.route_id] = S.filt[S.route_id] || {})[el.dataset.f] = el.dataset.v; category(S.route_id).then(syncQty); },
  async calc() { const p = calcPlan(S.calc), prev = JSON.parse(JSON.stringify(S.cart)), cart = JSON.parse(JSON.stringify(S.cart)); p.L.forEach(l => { const x = cart.find(c => c.k === 'p' && c.id === l.id); if (x) x.qty = Math.min(20, x.qty + l.qty); else cart.push({ k: 'p', id: l.id, qty: l.qty }); }); S.source = 'normal'; vib(15); await setCart(cart, 'Agregaste lo de la fiesta', prev); },
  async addice() { await addLine('p', 'hielo-2', 1, null); }, 
  del(el) { const v = el.dataset.v; if (v === 'gps') return locate(); const m = S.me; S.del = v === 'saved' ? { mode: 'saved', lat: m.address.lat, lng: m.address.lng, zone: m.zone || nearestZone(m.address.lat, m.address.lng), text: m.address.text, ref: m.address.ref || '' } : { mode: 'pickup', ref: '' }; requote().then(renderCheckout); },
  zone(el) { const z = S.set.zones.find(x => x.id === el.dataset.v); S.del = { ...S.del, zone: z.id, lat: z.lat, lng: z.lng, text: 'Barrio ' + z.name }; renderCheckout(); },
  ref(el) { S.del.ref = S.del.ref === el.dataset.v ? '' : el.dataset.v; renderCheckout(); },
  pay(el) { S.pay = el.dataset.v; renderCheckout(); }, cash(el) { S.cash = el.dataset.v === 'exact' ? 'exact' : +el.dataset.v; renderCheckout(); },
  gift() { S.gift.on = !S.gift.on; renderCheckout(); }, giftmsg(el) { S.gift.msg = S.gift.msg === el.dataset.v ? '' : el.dataset.v; renderCheckout(); }, giftother() { S.gift.other = !S.gift.other; renderCheckout(); },
  dupyes() { closeOv(); placeOrder(true); }, dupno(el) { closeOv(); location.hash = '#/track/' + el.dataset.id; },
  regopen() { regSheet(); }, regsubmit() { regSubmit(); }, clubgo() { closeOv(); location.hash = '#/club'; },
  async vote(el) { vib(15); await Data.vote(S.me.id, el.dataset.id); toast('¡Voto guardado!'); fans(); },
  taxi() { taxiSheet(); }, closeov() { closeOv(); },
  async addmore(el) { S.addingTo = el.dataset.id; S.cart = []; await setCart([], null); location.hash = '#/previa'; },
  async wasent(el) { await Data.updateOrderStatus(el.dataset.id, (await Data.getOrder(el.dataset.id)).status, { queued: false }); },
  back(el, e) { if (history.length > 1) { e.preventDefault(); history.back(); } }
};
document.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (!el) return; const f = A[el.dataset.a]; if (f) f(el, e); });
document.addEventListener('input', e => { if (e.target.id === 'calcR') { S.calc = +e.target.value; const p = calcPlan(S.calc); $('#calcN').textContent = S.calc; $('#calcT').textContent = p.text; $('#calcP').textContent = money(p.total); } });

/* ---------- barra de carrito ---------- */
function renderCartbar() {
  const el = $('#cartbar'), r = S.route; const hide = !cartN() && !S.addingTo || ['checkout', 'track', 'club', 'fans', 'gate'].includes(r);
  if (hide) { el.innerHTML = ''; return; } const n = cartN(), sub = S.q ? S.q.lines.reduce((a, l) => a + l.total, 0) : 0;
  const ice = !S.iceNo && S.q && !S.q.lines.some(l => l.id.startsWith('hielo') || ['tonica', 'cola-2l', 'sprite-2l', 'ginger'].includes(l.id) || l.k === 'c') && S.q.lines.some(l => ['ron', 'whisky', 'vodka', 'tequila'].includes(l.cat)) && ['previa', 'cat', 'home'].includes(r);
  el.innerHTML = `<div>${ice ? `<div class="suggest">🧊 ¿Te falta el hielo?<span style="flex:1"></span><button data-a="addice">+ Hielo</button></div>` : ''}<button class="cartbtn" id="goCart"><span style="display:flex;align-items:center"><span class="n">${n}</span>${S.addingTo ? 'AGREGAR AL PEDIDO' : 'VER MI PEDIDO'}</span><span class="t">${money(sub)}</span></button></div>`;
  $('#goCart').onclick = async () => { vib(12); if (S.addingTo) { const o = await Data.addToOrder(S.addingTo, S.cart); const id = S.addingTo; S.addingTo = null; await setCart([], null); toast(o ? 'Agregado a tu pedido' : 'Tu pedido ya está en preparación'); location.hash = '#/track/' + id; } else location.hash = '#/checkout'; };
}

/* ---------- router ---------- */
async function render() {
  const h = location.hash.slice(1) || '/', [path, qs] = h.split('?'), p = path.split('/').filter(Boolean), r = p[0] || 'home'; S.route = r; S.route_id = p[1]; closeOv(); $('#layer .toast')?.remove();
  if (r === 'club' && p[1]) { const c = await Data.getCustomerByCode(p[1]); if (c) { ls.set('ds_me', c.id); ls.set('ds_age', ls.get('ds_age', null)); await refresh(); history.replaceState(null, '', '#/'); toast('Hola, ' + esc(c.name.split(' ')[0]) + ' 👋 ¡Te reconocimos!'); return render(); } toast('No encontramos ese código'); history.replaceState(null, '', '#/'); return render(); }
  const age = ls.get('ds_age', null); if (!age || Date.now() - age.ts > 864e5) { S.route = 'gate'; return ageGate(); } if (!age.ok) { S.route = 'gate'; return ageBlock(); }
  const st = await Data.openStatus(); S.status = st; if (!st.open && !ss.get('ds_skip')) { S.route = 'gate'; return closedScreen(st); }
  switch (r) {
    case 'home': await home(); break; case 'previa': await previa(); break; case 'cava': await cava(); break; case 'cat': await category(p[1]); break; case 'promo': await promo(p[1]); break;
    case 'checkout': await renderCheckout(); break; case 'track': await track(p[1], qs); break; case 'club': await clubPage(); break; case 'fans': await fans(); break; default: await home();
  }
  if (r !== 'checkout') { syncQty(); renderCartbar(); } if (r !== 'track') window.scrollTo(0, 0); if (r === 'home') rotateBanners(); document.title = 'Don Snack Ambato';
}
async function boot() {
  await Data.load(); await refresh(); if (!ss.get('ds_open')) { ss.set('ds_open', 1); Data.trackEvent('open'); }
  Data.onChange(async () => { const was = S.route; await refresh(); if (was === 'track') render(); else if (was === 'home' || was === 'previa' || was === 'cava') { /* catálogo/campañas pueden cambiar */ render(); } });
  addEventListener('hashchange', render); addEventListener('online', () => toast('📶 Volvió la señal')); addEventListener('offline', () => toast('Sin señal: tu pedido se guardará y lo envías luego'));
  setInterval(() => { if (S.route === 'track') render(); }, 30000); render();
}
boot.once = false;
const start = () => { if (typeof Data === 'undefined' || typeof Mascot === 'undefined' || typeof Club === 'undefined') return setTimeout(start, 30); boot(); }; start();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
})();
