import * as S from './state.js';
import { icon } from './icons.js';
import { $, esc, vibrate, tick, toast, hideToast, soundOn, setSound } from './ui.js';
import { openCheckout } from './checkout.js';

const { store } = S;
const STRONG = new Set(['ron', 'whisky', 'vodka', 'tequila', 'aguardiente', 'gin']);
let sheetCat = null, longFired = false;

async function init() {
  const q = new URLSearchParams(location.search);
  if (q.has('reset')) {
    Object.values(S.K).forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    location.replace(location.pathname); return;
  }
  await S.load('');
  buildStatic();
  S.on(render);
  render();
  gate();
  setInterval(render, 30000);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}

function once(name) {
  const k = 'pz_ev_' + name;
  if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, '1'); S.track(name); }
}

// ---------- Age gate ----------
function gate() {
  once('visit');
  const a = S.ageState();
  if (a === true) { once('age_ok'); return; }
  const root = $('#age-root');
  const ask = () => {
    root.innerHTML = `<div class="age" role="dialog" aria-modal="true" aria-labelledby="ag-t"><div>
      <img src="icons/logo-160.png" alt="El Pretexto Liquor Store" width="132" height="132">
      <h1 id="ag-t">¿Eres mayor de 18 años?</h1>
      <p>Cualquiera es bueno… pero este pretexto es solo para adultos.</p>
      <div class="two"><button class="btn ghost" id="ag-no" type="button">No</button><button class="btn" id="ag-yes" type="button">Sí, soy mayor</button></div>
      <p class="tiny">Venta exclusiva a mayores de 18 años. Beber con moderación.</p></div></div>`;
    $('#ag-yes').onclick = () => { S.setAge(true); root.innerHTML = ''; once('age_ok'); vibrate(10); };
    $('#ag-no').onclick = () => { S.setAge(false); block(); };
    $('#ag-yes').focus();
  };
  const block = () => {
    root.innerHTML = `<div class="age" role="alertdialog" aria-modal="true"><div>
      <img src="icons/logo-160.png" alt="" width="96" height="96" style="filter:grayscale(1);opacity:.6">
      <h1>Lo sentimos</h1><p>Este sitio es solo para mayores de 18 años. Vuelve cuando cumplas la mayoría de edad.</p></div></div>`;
  };
  a === false ? block() : ask();
}

// ---------- Estructura fija ----------
function buildStatic() {
  $('#back').innerHTML = icon('back', 24);
  $('#back').onclick = () => { if (S.undoLast()) { vibrate(8); tick(520); } };
  const snd = $('#snd');
  const paintSnd = () => { snd.innerHTML = icon(soundOn() ? 'speaker' : 'mute', 18); snd.setAttribute('aria-pressed', soundOn()); snd.title = soundOn() ? 'Sonido activado' : 'Sonido silenciado'; };
  paintSnd();
  snd.onclick = () => { setSound(!soundOn()); paintSnd(); tick(); };
  $('#cta').onclick = () => { if (!$('#cta').disabled) startCheckout(); };

  const g = $('#grid');
  g.innerHTML = S.gridCats().map(c => `<button class="key" type="button" data-cat="${c.id}" style="--ac:${c.accent}" aria-label="${esc(c.name)}">${icon(c.id, 34)}<span class="n">${esc(c.name)}</span></button>`).join('');
  g.querySelectorAll('.key').forEach(k => {
    let timer;
    const cid = k.dataset.cat;
    k.addEventListener('contextmenu', e => e.preventDefault());
    k.addEventListener('pointerdown', () => {
      longFired = false;
      timer = setTimeout(() => {
        const p = S.bestOf(cid);
        if (!p || !S.status().open) return;
        longFired = true; S.add(p.id, 1); vibrate([18, 30, 18]); tick(1100, 40); S.track('cart_add'); once('cart');
        toast(`+1 ${esc(p.short)} · el más pedido`, { ms: 1400 });
      }, 480);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => k.addEventListener(ev, () => clearTimeout(timer)));
    k.addEventListener('click', () => {
      if (longFired) { longFired = false; return; }
      if (!S.status().open) return;
      if (!S.catAvailable(cid)) { toast(`${esc(S.cat(cid).name)}: por ahora agotado`); return; }
      vibrate(12); tick();
      openSheet(cid);
    });
  });
}

// ---------- Render reactivo ----------
function render() {
  const st = S.status();
  $('#app').classList.toggle('closed', !st.open);
  const hp = $('#hours');
  hp.className = 'pill' + (st.open ? '' : ' off');
  hp.textContent = st.open ? (st.until && st.until !== '—' ? `Abierto hasta ${st.until}` : 'Abierto') : (st.type === 'ley' ? 'Cerrado' : 'Cerrado ahora');

  const d = $('#dialed'), ls = S.lines();
  if (!st.open) { d.className = 'dialed closed'; d.textContent = st.msg; }
  else if (!ls.length) { d.className = 'dialed hint'; d.textContent = '¿Cuál es tu pretexto hoy?'; }
  else { d.className = 'dialed'; d.textContent = ls.map(l => `${l.q} ${l.p.short}`).join(' · '); }
  $('#back').disabled = !S.store.cart.log.length;

  const cta = $('#cta'), n = S.count(), sub = S.subtotal();
  cta.innerHTML = `<small>Pedir</small><b>${S.money(sub)}</b>`;
  cta.setAttribute('aria-label', `Pedir, total ${S.money(sub)}`);
  cta.disabled = !st.open || n === 0;
  cta.classList.toggle('has', st.open && n > 0);

  document.querySelectorAll('.key').forEach(k => {
    const cid = k.dataset.cat, q = S.catQty(cid);
    let b = k.querySelector('.badge');
    if (q) {
      if (!b) { b = document.createElement('i'); b.className = 'badge'; k.appendChild(b); }
      if (b.textContent !== String(q)) { b.textContent = q; b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    } else if (b) b.remove();
    k.classList.toggle('off', !S.catAvailable(cid));
  });
  renderQuick();
  if (sheetCat) updateSheet();
}

function renderQuick() {
  const q = $('#quick');
  const last = S.rd(S.K.last, null);
  const combos = store.prods.filter(p => p.quick && !S.isOut(p));
  const html = [];
  if (last && last.items && Object.keys(last.items).length) html.push(`<button class="chip repeat" type="button" data-repeat="1">${icon('repeat', 18)}Repetir último <small>${S.money(last.total)}</small></button>`);
  combos.forEach(p => html.push(`<button class="chip" type="button" data-combo="${p.id}">${icon('plus', 16, 2.4)}${esc(p.short)} <small>${S.money(p.price)}</small></button>`));
  const sig = html.join('');
  if (q.dataset.sig === sig) return;
  q.dataset.sig = sig; q.innerHTML = sig;
  q.querySelectorAll('[data-combo]').forEach(b => b.onclick = () => {
    const p = S.prod(b.dataset.combo); S.add(p.id, 1); vibrate(12); tick(); S.track('cart_add'); once('cart');
    toast(`Agregado: ${esc(p.short)}`, { ms: 1400 });
  });
  const r = q.querySelector('[data-repeat]');
  if (r) r.onclick = () => {
    S.setCart(last.items); vibrate(12); S.track('cart_add'); once('cart');
    if (S.count()) startCheckout(); else toast('Esos productos ya no están disponibles');
  };
}

function startCheckout() {
  if (!S.status().open) return;
  closeSheet(true); hideToast();
  openCheckout();
}

// ---------- Bottom sheet ----------
function openSheet(cid) {
  sheetCat = cid;
  const c = S.cat(cid), root = $('#sheet-root');
  root.innerHTML = `<div class="ov"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(c.name)}" style="--ac:${c.accent}">
    <div class="grab"><i></i><div class="sh-head"><span class="ci">${icon(cid, 22)}</span><h2>${esc(c.name)}</h2><button class="x" type="button" aria-label="Cerrar">${icon('close', 22)}</button></div></div>
    <p class="sh-hint">Toca + para agregar. Desliza hacia abajo para cerrar.</p>
    <div class="sh-list"></div>
    <div class="sh-foot"><button class="btn" type="button" id="sh-order"></button></div>
  </div>`;
  const ov = $('.ov', root), sh = $('.sheet', root);
  const list = $('.sh-list', root);
  list.innerHTML = S.catProducts(cid).map(p => rowHtml(p)).join('');
  list.addEventListener('click', e => {
    const b = e.target.closest('button[data-act]'); if (!b) return;
    const id = b.closest('.row').dataset.id, p = S.prod(id);
    const d = b.dataset.act === 'add' ? 1 : -1;
    if (d > 0 && S.isOut(p)) return;
    S.add(id, d); vibrate(10); tick(d > 0 ? 880 : 520);
    if (d > 0) { once('cart'); S.track('cart_add'); maybeUpsell(p); }
  });
  $('.x', root).onclick = () => closeSheet();
  ov.onclick = () => closeSheet();
  $('#sh-order').onclick = () => { if (!$('#sh-order').disabled) startCheckout(); };
  bindDrag(sh, $('.grab', root));
  requestAnimationFrame(() => { ov.classList.add('open'); sh.classList.add('open'); });
  updateSheet();
  document.addEventListener('keydown', escKey);
}
const escKey = e => { if (e.key === 'Escape') closeSheet(); };
function rowHtml(p) {
  const out = S.isOut(p), realImg = store.cfg.realImages && p.img;
  return `<div class="row${out ? ' out' : ''}" data-id="${p.id}"><div class="ph">${icon(p.cat, 28)}${realImg ? `<img src="${esc(p.img)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div>
    <div class="info"><b>${esc(p.name)}</b><small>${esc(p.size)}</small>${out ? '<span class="tag">Agotado</span>' : `<span class="pr">${S.money(p.price)}</span>`}</div>
    <div class="step"></div></div>`;
}
function updateSheet() {
  const root = $('#sheet-root');
  root.querySelectorAll('.row').forEach(r => {
    const p = S.prod(r.dataset.id), q = S.qty(p.id), st = r.querySelector('.step');
    const html = S.isOut(p) ? '' : (q ? `<button type="button" data-act="sub" aria-label="Quitar uno de ${esc(p.short)}">${icon('minus', 20, 2.4)}</button><output>${q}</output><button type="button" data-act="add" aria-label="Agregar uno de ${esc(p.short)}">${icon('plus', 20, 2.4)}</button>`
      : `<button type="button" class="add" data-act="add" aria-label="Agregar ${esc(p.short)}">${icon('plus', 22, 2.4)}</button>`);
    if (st.dataset.h !== html) { st.dataset.h = html; st.innerHTML = html; }
  });
  const b = $('#sh-order'), n = S.count();
  if (b) { b.disabled = !n; const mn = store.cfg.minOrder, sub = S.subtotal();
    b.innerHTML = !n ? 'Elige un producto' : sub < mn ? `Pedir · ${S.money(sub)} <small style="font-weight:600;opacity:.85">(mín. ${S.money(mn)})</small>` : `Pedir · ${S.money(sub)}`; }
}
function closeSheet(instant) {
  const root = $('#sheet-root'), sh = $('.sheet', root);
  document.removeEventListener('keydown', escKey);
  sheetCat = null;
  if (!sh) return;
  if (instant) { root.innerHTML = ''; return; }
  sh.style.transform = ''; sh.classList.remove('open', 'drag'); $('.ov', root).classList.remove('open');
  setTimeout(() => { if (!sheetCat) root.innerHTML = ''; }, 190);
}
function bindDrag(sh, handle) {
  let y0 = null, dy = 0, t0 = 0;
  handle.addEventListener('pointerdown', e => { if (e.target.closest('.x')) return; y0 = e.clientY; dy = 0; t0 = e.timeStamp; sh.classList.add('drag'); handle.setPointerCapture(e.pointerId); });
  handle.addEventListener('pointermove', e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); sh.style.transform = `translate(-50%,${dy}px)`; });
  const end = e => {
    if (y0 == null) return;
    const v = dy / Math.max(1, e.timeStamp - t0);
    y0 = null; sh.classList.remove('drag');
    if (dy > 90 || v > .6) closeSheet(); else sh.style.transform = '';
  };
  handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
  // También cierra arrastrando desde la lista cuando está arriba del todo
  const list = $('.sh-list', sh.parentElement); let ly = null, ldy = 0;
  list.addEventListener('touchstart', e => { ly = list.scrollTop <= 0 ? e.touches[0].clientY : null; ldy = 0; }, { passive: true });
  list.addEventListener('touchmove', e => { if (ly == null) return; ldy = e.touches[0].clientY - ly; if (ldy > 0) { sh.classList.add('drag'); sh.style.transform = `translate(-50%,${ldy}px)`; } }, { passive: true });
  list.addEventListener('touchend', () => { if (ly == null) return; sh.classList.remove('drag'); if (ldy > 110) closeSheet(); else sh.style.transform = ''; ly = null; });
}

// ---------- Sugerencia única: hielo y cola ----------
function maybeUpsell(p) {
  if (sessionStorage.getItem('pz_ups') || !STRONG.has(p.cat)) return;
  if (S.lines().some(l => l.p.cat === 'hielo' || l.p.cat === 'combos')) return;
  const kit = S.prod('kit-hielo-cola'); if (!kit || S.isOut(kit)) return;
  sessionStorage.setItem('pz_ups', '1'); S.track('upsell_shown');
  toast('¿Le sumas hielo y cola? +' + S.money(kit.price), { label: 'Agregar', ms: 7000, onAction: () => { S.add(kit.id, 1); S.track('upsell_accepted'); vibrate(10); } });
}

init();
