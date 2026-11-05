import * as S from './state.js';
import { icon } from './icons.js';
import { $, esc, vibrate, tick, toast } from './ui.js';

const LEGAL = 'Venta exclusiva a mayores de 18 años. Se verificará la cédula en la entrega.';
let f, step, errs, root, done;

export function openCheckout() {
  const c = S.rd(S.K.cust, {});
  const cfg = S.store.cfg;
  f = { mode: c.mode || 'entrega', zone: c.zone || cfg.zones[0]?.id, address: c.address || '', geo: '', name: c.name || '', phone: c.phone || '', pay: c.pay || 'efectivo', cashWith: '' };
  step = 1; errs = {}; done = null;
  root = $('#checkout-root');
  root.innerHTML = `<div class="panel" role="dialog" aria-modal="true" aria-label="Tu pedido">
    <div class="p-head"><button class="x" type="button" id="p-back" aria-label="Volver"></button><h2 id="p-title"></h2><span class="st" id="p-step"></span></div>
    <div class="p-body" id="p-body"></div><div class="p-foot" id="p-foot"></div></div>`;
  const p = $('.panel', root);
  $('#p-body').addEventListener('click', onClick);
  $('#p-body').addEventListener('input', onInput);
  $('#p-back').onclick = back;
  paint();
  requestAnimationFrame(() => p.classList.add('open'));
}

function close() {
  const p = $('.panel', root); if (!p) return;
  p.classList.remove('open'); setTimeout(() => { root.innerHTML = ''; }, 190);
}
function back() { if (done) return close(); if (step === 2) { step = 1; paint(); } else close(); }

const fee = () => f.mode === 'entrega' ? (S.store.cfg.zones.find(z => z.id === f.zone)?.cost || 0) : 0;
const total = () => S.subtotal() + fee();

function linesHtml(lines, editable = true) {
  return lines.map(l => `<div class="line" data-id="${l.p.id}"><div class="nm">${esc(l.p.short)}<small>${esc(l.p.size)} · ${S.money(l.p.price)}</small></div>
    ${editable ? `<div class="step sm"><button type="button" data-act="sub" aria-label="Quitar uno de ${esc(l.p.short)}">${icon('minus', 18, 2.4)}</button><output>${l.q}</output><button type="button" data-act="add" aria-label="Agregar uno de ${esc(l.p.short)}">${icon('plus', 18, 2.4)}</button></div>` : `<span>×${l.q}</span>`}
    <div class="lp">${S.money(l.p.price * l.q)}</div></div>`).join('');
}
const totalsHtml = () => `<div class="card"><div class="tot"><span>Subtotal</span><span>${S.money(S.subtotal())}</span></div>
  <div class="tot"><span>${f.mode === 'entrega' ? 'Envío' : 'Retiro en local'}</span><span>${f.mode === 'entrega' ? S.money(fee()) : 'Gratis'}</span></div>
  <div class="tot big"><span>Total</span><span>${S.money(total())}</span></div></div>`;

function paint() {
  const cfg = S.store.cfg;
  $('#p-title').textContent = done ? 'Listo' : step === 1 ? 'Tu pedido' : 'Pago';
  $('#p-step').textContent = done ? '' : `${step}/2`;
  $('#p-back').innerHTML = icon(done ? 'close' : 'chev', 24);
  const body = $('#p-body'), foot = $('#p-foot');
  if (done) return paintDone(body, foot);

  if (step === 1) {
    const all = S.lines(), main = all.filter(l => !l.p.addon), add = all.filter(l => l.p.addon);
    if (!main.length && !add.length) { close(); return; }
    const cig = S.store.prods.filter(p => p.addon && !S.isOut(p));
    body.innerHTML = `
      <div class="card"><h3>Resumen</h3>${linesHtml(main)}${add.length ? linesHtml(add) : ''}</div>
      <div class="seg" role="group" aria-label="Entrega o retiro">
        <button type="button" data-mode="entrega" aria-pressed="${f.mode === 'entrega'}">${icon('scooter', 24)}<span>Entrega<small>~${cfg.etaMin} min</small></span></button>
        <button type="button" data-mode="retiro" aria-pressed="${f.mode === 'retiro'}">${icon('store', 24)}<span>Retiro<small>~${cfg.pickupMin || 15} min</small></span></button>
      </div>
      ${f.mode === 'entrega' ? `<div class="card" style="display:flex;flex-direction:column;gap:10px">
        <label class="f">Sector<select class="in" name="zone">${cfg.zones.map(z => `<option value="${z.id}"${z.id === f.zone ? ' selected' : ''}>${esc(z.name)} · ${S.money(z.cost)}</option>`).join('')}</select></label>
        <label class="f">Dirección o referencia<input class="in${errs.address ? ' bad' : ''}" name="address" autocomplete="street-address" placeholder="Calle principal, número, referencia" value="${esc(f.address)}"></label>
        <button type="button" class="loc${f.geo ? ' ok' : ''}" data-act="geo">${icon(f.geo ? 'check' : 'pin', 20)}${f.geo ? 'Ubicación lista' : 'Usar mi ubicación'}</button></div>` : `<div class="legal" style="background:var(--surface);border-color:var(--line);color:var(--tx2)">Retira en El Pretexto, Ambato (dirección de ejemplo). Te avisamos por WhatsApp cuando esté listo.</div>`}
      <div class="card row2">
        <label class="f">Nombre<input class="in${errs.name ? ' bad' : ''}" name="name" autocomplete="name" placeholder="Tu nombre" value="${esc(f.name)}"></label>
        <label class="f">Teléfono<input class="in${errs.phone ? ' bad' : ''}" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="09XXXXXXXX" value="${esc(f.phone)}"></label>
      </div>
      ${cfg.venderCigarrillos && cig.length ? `<details class="card cig"${add.length ? ' open' : ''}><summary>¿Agregar cigarrillos?</summary>
        ${cig.map(p => `<div class="line" data-id="${p.id}"><div class="nm">${esc(p.name)}<small>${esc(p.size)} · ${S.money(p.price)}</small></div><div class="step sm"><button type="button" data-act="sub" aria-label="Quitar ${esc(p.name)}">${icon('minus', 18, 2.4)}</button><output>${S.qty(p.id)}</output><button type="button" data-act="add" aria-label="Agregar ${esc(p.name)}">${icon('plus', 18, 2.4)}</button></div></div>`).join('')}
        <p class="note">Prohibida la venta a menores de 18 años. Solo como agregado a un pedido.</p></details>` : ''}
      ${totalsHtml()}
      <div class="legal">${LEGAL}</div>`;
    foot.innerHTML = `<p class="err" id="err" role="alert">${errs.msg ? esc(errs.msg) : ''}</p><button class="btn" id="go" type="button">Continuar · ${S.money(total())}</button>`;
    $('#go').onclick = next;
  } else {
    const opt = (id, t, s) => `<button type="button" class="pay" role="radio" aria-checked="${f.pay === id}" data-pay="${id}"><i></i><span><b>${t}</b><small>${s}</small></span></button>`;
    body.innerHTML = `<div class="card"><h3>Cómo pagas</h3><div style="display:flex;flex-direction:column;gap:8px" role="radiogroup" aria-label="Método de pago">
      ${opt('efectivo', 'Efectivo contra entrega', 'Paga al recibir tu pedido')}
      ${opt('transferencia', 'Transferencia', 'Te enviamos los datos por WhatsApp')}
      ${opt('link', 'Link de pago', 'Pago con tarjeta desde un enlace')}</div>
      ${f.pay === 'efectivo' ? `<label class="f" style="margin-top:10px">¿Con cuánto pagas? (opcional)<input class="in" name="cashWith" inputmode="decimal" placeholder="Ej. 20" value="${esc(f.cashWith)}"></label>` : ''}
      ${f.pay === 'transferencia' ? `<p class="note"><b>${esc(cfg.bank.banco)}</b> · ${esc(cfg.bank.tipo)} ${esc(cfg.bank.numero)}<br>${esc(cfg.bank.titular)} (datos de ejemplo). Envía el comprobante por WhatsApp.</p>` : ''}
      ${f.pay === 'link' ? `<p class="note">Te enviamos el link de pago por WhatsApp al confirmar. (Demostración, sin cobro real.)</p>` : ''}</div>
      <div class="card"><h3>Tu pedido</h3>${linesHtml(S.lines(), false)}</div>
      ${totalsHtml()}
      <div class="card"><div class="tot" style="color:var(--tx)"><span>${f.mode === 'entrega' ? 'Entrega' : 'Retiro'}</span><span style="text-align:right">${f.mode === 'entrega' ? esc(S.store.cfg.zones.find(z => z.id === f.zone)?.name || '') : 'En local'}</span></div><div class="tot"><span>${esc(f.name)}</span><span>${esc(f.phone)}</span></div></div>
      <div class="legal">${LEGAL}</div>`;
    foot.innerHTML = `<p class="err" id="err" role="alert"></p><button class="btn" id="go" type="button">Enviar pedido · ${S.money(total())}</button>`;
    $('#go').onclick = send;
  }
}

function onInput(e) {
  const n = e.target.name; if (!n) return;
  if (n === 'zone') { f.zone = e.target.value; refreshTotals(); return; }
  f[n] = e.target.value; e.target.classList.remove('bad');
}
function refreshTotals() { const y = $('#p-body').scrollTop; paint(); $('#p-body').scrollTop = y; }

function onClick(e) {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.mode) { f.mode = b.dataset.mode; refreshTotals(); return; }
  if (b.dataset.pay) { f.pay = b.dataset.pay; refreshTotals(); return; }
  if (b.dataset.act === 'geo') return geo(b);
  const row = b.closest('.line');
  if (row && b.dataset.act) { S.add(row.dataset.id, b.dataset.act === 'add' ? 1 : -1); vibrate(8); tick(b.dataset.act === 'add' ? 880 : 520); errs = {}; refreshTotals(); }
}

function geo(btn) {
  if (!navigator.geolocation) { toast('Tu navegador no permite ubicación; escribe la dirección'); return; }
  btn.textContent = 'Buscando ubicación…';
  navigator.geolocation.getCurrentPosition(p => {
    f.geo = `${p.coords.latitude.toFixed(5)},${p.coords.longitude.toFixed(5)}`;
    if (!f.address) f.address = 'Ubicación GPS compartida';
    refreshTotals();
  }, () => { toast('No pudimos ubicarte. Escribe tu dirección.'); refreshTotals(); }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
}

function validate() {
  errs = {};
  const cfg = S.store.cfg;
  const st = S.status();
  if (!st.open) errs.msg = st.msg;
  else if (!S.nonAddonCount()) errs.msg = 'Los cigarrillos solo se venden junto con otro producto.';
  else if (S.lines().filter(l => !l.p.addon).reduce((s, l) => s + l.p.price * l.q, 0) < cfg.minOrder) errs.msg = `Pedido mínimo ${S.money(cfg.minOrder)}.`;
  if (f.name.trim().length < 2) { errs.name = 1; errs.msg = errs.msg || 'Escribe tu nombre.'; }
  if (f.phone.replace(/\D/g, '').length < 9) { errs.phone = 1; errs.msg = errs.msg || 'Escribe un teléfono válido.'; }
  if (f.mode === 'entrega' && !f.address.trim() && !f.geo) { errs.address = 1; errs.msg = errs.msg || 'Escribe tu dirección o usa tu ubicación.'; }
  return !Object.keys(errs).length;
}

function next() {
  if (!validate()) { paint(); vibrate([30, 40, 30]); const bad = $('.in.bad'); if (bad) bad.focus(); return; }
  vibrate(10); step = 2; paint(); $('#p-body').scrollTop = 0;
}

function send() {
  if (!validate()) { step = 1; paint(); return; }
  const cfg = S.store.cfg, zone = cfg.zones.find(z => z.id === f.zone);
  const all = S.lines();
  const order = {
    id: S.nextId(), ts: Date.now(), status: 'nuevo', src: 'web',
    items: all.map(l => ({ id: l.p.id, name: l.p.short, size: l.p.size, qty: l.q, price: l.p.price, cat: l.p.cat })),
    subtotal: S.subtotal(), fee: fee(), total: total(), mode: f.mode,
    zone: f.mode === 'entrega' ? zone?.name : '', address: f.mode === 'entrega' ? f.address.trim() : '', geo: f.geo,
    name: f.name.trim(), phone: f.phone.trim(), pay: f.pay, cashWith: parseFloat(String(f.cashWith).replace(',', '.')) || 0,
    hasCombo: all.some(l => l.p.cat === 'combos'), hasCig: all.some(l => l.p.addon), upsell: all.some(l => l.p.id === 'kit-hielo-cola')
  };
  S.pushOrder(order);
  S.track('order_sent');
  S.wr(S.K.cust, { name: order.name, phone: order.phone, address: f.address.trim(), zone: f.zone, mode: f.mode, pay: f.pay });
  const keep = {}; all.filter(l => !l.p.addon).forEach(l => keep[l.p.id] = l.q);
  S.wr(S.K.last, { items: keep, total: order.subtotal - all.filter(l => l.p.addon).reduce((s, l) => s + l.p.price * l.q, 0), ts: order.ts });
  S.clearCart();
  const url = S.waLink(order);
  try { window.open(url, '_blank', 'noopener'); } catch { /* el botón final lo permite */ }
  vibrate([20, 40, 20]);
  done = { order, url };
  paint();
}

function paintDone(body, foot) {
  const { order, url } = done, cfg = S.store.cfg;
  body.innerHTML = `<div class="done" style="display:flex;flex-direction:column"><div class="ok">${icon('check', 44, 3)}</div>
    <h2>Pedido recibido</h2><p class="big">#${order.id} · ${S.money(order.total)}</p>
    <p>${order.mode === 'entrega' ? `Llega en ~${cfg.etaMin} min` : `Listo para retirar en ~${cfg.pickupMin || 15} min`}</p>
    <p style="font-size:14px">Se abrió WhatsApp con tu pedido. Si no se envió, toca el botón de abajo y envíalo.</p></div>`;
  foot.innerHTML = `<a class="btn wa" href="${url}" target="_blank" rel="noopener" style="text-decoration:none">${icon('wa', 22)}Seguir por WhatsApp</a><button class="btn ghost" type="button" id="again">Hacer otro pedido</button>`;
  $('#again').onclick = close;
}
