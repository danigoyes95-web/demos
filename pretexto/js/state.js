// Estado compartido (app cliente + panel). Fase 1: JSON + localStorage.
// Más adelante: reemplazar load()/save*() por una API real.
export const K = {
  cfg: 'pz_config', prods: 'pz_products', cart: 'pz_cart', orders: 'pz_orders', events: 'pz_events',
  cust: 'pz_customer', age: 'pz_age', last: 'pz_last', seq: 'pz_seq', snd: 'pz_snd', seeded: 'pz_seeded'
};
export const rd = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
export const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* modo privado */ } };
export const money = n => '$' + (Math.round(n * 100) / 100).toFixed(2);

export const store = { cfg: null, cats: [], prods: [], cart: { items: {}, log: [] } };
const subs = new Set();
export const on = fn => { subs.add(fn); return () => subs.delete(fn); };
const emit = () => subs.forEach(f => f());

let bc = null;
try { bc = new BroadcastChannel('pz'); } catch { /* sin soporte */ }
export const onBroadcast = fn => { if (bc) bc.onmessage = e => fn(e.data); addEventListener('storage', e => { if (e.key === K.orders) fn({ type: 'orders' }); }); };

export async function load(base = '') {
  const [c, p] = await Promise.all([fetch(base + 'data/config.json').then(r => r.json()), fetch(base + 'data/products.json').then(r => r.json())]);
  store.cfg = rd(K.cfg, null) || c;
  store.cats = p.categories;
  store.prods = rd(K.prods, null) || p.products;
  store.defaults = { cfg: c, prods: p.products };
  const cart = rd(K.cart, null);
  if (cart && cart.items) store.cart = cart;
  sanitizeCart();
  return store;
}
export const saveCfg = () => { wr(K.cfg, store.cfg); emit(); };
export const saveProds = () => { wr(K.prods, store.prods); emit(); };
export const isOut = p => !!p.soldOut || (p.stock != null && p.stock <= 0);
export const prod = id => store.prods.find(p => p.id === id);
export const cat = id => store.cats.find(c => c.id === id);

// ---------- Carrito ----------
function sanitizeCart() {
  const it = store.cart.items;
  for (const id of Object.keys(it)) {
    const p = prod(id);
    if (!p || isOut(p) || (p.addon && !store.cfg.venderCigarrillos) || it[id] <= 0) delete it[id];
  }
  store.cart.log = store.cart.log.filter(id => it[id]);
}
const persist = () => { wr(K.cart, store.cart); emit(); };
export function add(id, n = 1) {
  const p = prod(id); if (!p || isOut(p)) return 0;
  const it = store.cart.items;
  const q = Math.max(0, (it[id] || 0) + n);
  if (q === 0) { delete it[id]; const i = store.cart.log.lastIndexOf(id); if (i >= 0) store.cart.log.splice(i, 1); }
  else { it[id] = q; if (n > 0) store.cart.log.push(id); else { const i = store.cart.log.lastIndexOf(id); if (i >= 0) store.cart.log.splice(i, 1); } }
  persist(); return q;
}
export function undoLast() {
  const id = store.cart.log[store.cart.log.length - 1];
  if (!id) return null;
  add(id, -1); return id;
}
export function clearCart() { store.cart = { items: {}, log: [] }; persist(); }
export function setCart(items) { store.cart = { items: { ...items }, log: Object.entries(items).flatMap(([id, q]) => Array(q).fill(id)) }; sanitizeCart(); persist(); }
export const qty = id => store.cart.items[id] || 0;
export const lines = () => Object.entries(store.cart.items).map(([id, q]) => ({ p: prod(id), q })).filter(l => l.p);
export const subtotal = () => lines().reduce((s, l) => s + l.p.price * l.q, 0);
export const count = () => lines().reduce((s, l) => s + l.q, 0);
export const catQty = cid => lines().filter(l => l.p.cat === cid).reduce((s, l) => s + l.q, 0);
export const nonAddonCount = () => lines().filter(l => !l.p.addon).reduce((s, l) => s + l.q, 0);
export const catProducts = cid => store.prods.filter(p => p.cat === cid && !p.upsellHidden);
export const catAvailable = cid => catProducts(cid).some(p => !isOut(p));
export const bestOf = cid => { const l = catProducts(cid).filter(p => !isOut(p)); return l.find(p => p.best) || l[0]; };
// El 12º círculo es siempre "Snacks": los cigarrillos nunca se destacan en la grilla (solo agregado en checkout).
export const gridCats = () => store.cats;

// ---------- Horario y bloqueos ----------
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export function status(now = new Date()) {
  const cfg = store.cfg;
  const f = new URLSearchParams(location.search).get('forzar');
  if (f === 'abierto') return { open: true, until: '—' };
  if (cfg.leySeca && cfg.leySeca.on) return { open: false, type: 'ley', msg: cfg.leySeca.msg };
  if (f === 'cerrado') return { open: false, type: 'horario', msg: `Abrimos a las ${cfg.hours[now.getDay()]?.open || '10:00'}` };
  const d = now.getDay(), m = now.getHours() * 60 + now.getMinutes();
  const t = cfg.hours[d], y = cfg.hours[(d + 6) % 7];
  if (y && !y.closed) { const o = toMin(y.open), c = toMin(y.close); if (c <= o && m < c) return { open: true, until: y.close }; }
  if (t && !t.closed) {
    const o = toMin(t.open), c = toMin(t.close);
    if (c <= o) { if (m >= o) return { open: true, until: t.close }; return { open: false, type: 'horario', next: t.open, msg: `Abrimos a las ${t.open}` }; }
    if (m >= o && m < c) return { open: true, until: t.close };
    if (m < o) return { open: false, type: 'horario', next: t.open, msg: `Abrimos a las ${t.open}` };
  }
  for (let i = 1; i <= 7; i++) {
    const dd = (d + i) % 7, h = cfg.hours[dd];
    if (h && !h.closed) return { open: false, type: 'horario', next: h.open, msg: `Abrimos ${i === 1 ? 'mañana' : 'el ' + DIAS[dd]} a las ${h.open}` };
  }
  return { open: false, type: 'horario', msg: 'Cerrado temporalmente' };
}

// ---------- Edad (24 h) ----------
export const ageState = () => { const a = rd(K.age, null); if (!a || Date.now() - a.ts > 864e5) return null; return a.ok; };
export const setAge = ok => wr(K.age, { ok, ts: Date.now() });

// ---------- Eventos (embudo) y pedidos ----------
export function track(name, extra) {
  const ev = rd(K.events, []); ev.push({ n: name, t: Date.now(), ...extra });
  wr(K.events, ev.slice(-500));
}
export const orders = () => rd(K.orders, []);
export function saveOrders(list) { wr(K.orders, list); if (bc) bc.postMessage({ type: 'orders' }); }
export function nextId() { const n = rd(K.seq, 122) + 1; wr(K.seq, n); return String(n).padStart(4, '0'); }
export function pushOrder(o) { const l = orders(); l.unshift(o); saveOrders(l); if (bc) bc.postMessage({ type: 'new', id: o.id }); return o; }

export function waLink(order) {
  const cfg = store.cfg;
  const L = [`🍾 PEDIDO PRETEXTO #${order.id}`, ''];
  order.items.forEach(i => L.push(`${i.qty} × ${i.name}${i.size ? ' ' + i.size : ''} — ${money(i.price * i.qty)}`));
  L.push('', `Subtotal: ${money(order.subtotal)}`);
  if (order.mode === 'entrega') L.push(`Envío (${order.zone}): ${money(order.fee)}`);
  L.push(`*TOTAL: ${money(order.total)}*`, '');
  if (order.mode === 'entrega') { L.push(`🛵 Entrega a domicilio — ${order.zone}`, `📍 ${order.address}${order.geo ? '\nhttps://maps.google.com/?q=' + order.geo : ''}`); }
  else L.push('🏪 Retiro en local');
  L.push(`👤 ${order.name} · ${order.phone}`, `💳 Pago: ${{ efectivo: 'Efectivo contra entrega', transferencia: 'Transferencia', link: 'Link de pago' }[order.pay]}${order.cashWith ? ' (paga con ' + money(order.cashWith) + ')' : ''}`, '🔞 Mayor de 18 años · cédula en la entrega');
  return `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(L.join('\n'))}`;
}
export function followLink(order) {
  return `https://wa.me/${store.cfg.whatsapp}?text=${encodeURIComponent(`Hola, quiero el seguimiento de mi pedido #${order.id} 🍾`)}`;
}
