/* ============================================================
   DATA.JS — ÚNICA capa de datos. Todo es async para poder
   cambiar a Supabase reemplazando SOLO este archivo (ver docs/PLAN-CONEXION.md).
   DEMO: JSON semilla (data/seed.json) + localStorage. Sin servicios externos.
   ============================================================ */
const Data = (() => {
  const K = 'ds_db_v1', BASE = new URL('../', document.currentScript.src).href, DAY = 864e5;
  const bc = ('BroadcastChannel' in self) ? new BroadcastChannel('ds_sync') : null;
  let db = null; const listeners = new Set();
  const dkey = d => { d = new Date(d); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const clone = o => JSON.parse(JSON.stringify(o));
  const invalidate = () => { db = null; listeners.forEach(f => { try { f(); } catch (e) {} }); };
  addEventListener('storage', e => { if (e.key === K) invalidate(); });
  if (bc) bc.onmessage = invalidate;
  const persist = () => { try { localStorage.setItem(K, JSON.stringify(db)); } catch (e) { console.warn('storage lleno', e); } bc && bc.postMessage(1); };
  async function load() {
    if (db) return db;
    let raw = null; try { raw = localStorage.getItem(K); } catch (e) {}
    if (raw) { db = JSON.parse(raw); return db; }
    return resetDemo(true);
  }
  // tx: relee el estado más reciente, muta y guarda (evita pisar cambios de la otra pantalla)
  async function tx(fn) { db = null; await load(); const r = fn(db); persist(); return r; }
  async function resetDemo(silent) {
    const seed = await (await fetch(BASE + 'data/seed.json')).json(), now = Date.now();
    const T0 = new Date(now); T0.setHours(0, 0, 0, 0);
    const m = Mock.build(seed, now);
    seed.campaigns.forEach(c => { c.start = dkey(T0.getTime() + c.startOff * DAY); c.end = dkey(T0.getTime() + c.endOff * DAY); delete c.startOff; delete c.endOff; });
    m.customers.forEach(c => { c.memberSince = c.member ? now - c.createdAgo * DAY : null; c.createdAt = now - c.createdAgo * DAY; c.tierOverride = ''; delete c.createdAgo; });
    db = { categories: seed.categories, products: seed.products, combos: seed.combos, campaigns: seed.campaigns, settings: seed.settings,
      customers: m.customers, orders: m.orders, events: m.events, votes: m.votes, seq: m.seq, resetAt: now };
    persist(); try { localStorage.removeItem('ds_me'); localStorage.removeItem('ds_cart'); sessionStorage.clear(); } catch (e) {}
    if (!silent) listeners.forEach(f => f());
    return db;
  }

  /* ---------- horario ---------- */
  const atTime = (d, hhmm) => { const [h, m] = hhmm.split(':').map(Number); const x = new Date(d); x.setHours(h, m, 0, 0); return x.getTime(); };
  function interval(S, date) {
    const k = dkey(date), sp = (S.specialHours || []).find(x => x.date === k);
    const h = sp ? (sp.closed ? null : [sp.open, sp.close]) : S.hours[date.getDay()]; if (!h) return null;
    const s = atTime(date, h[0]); let e = atTime(date, h[1]); if (e <= s) e += DAY; return [s, e, h];
  }
  async function openStatus(now = Date.now()) {
    const { settings: S } = await load();
    if (S.closed) return { open: false, reason: 'seca', text: 'Hoy no atendemos. ¡Nos vemos pronto!' };
    if (S.demoSkipHours) return { open: true };
    for (const off of [-1, 0]) { const d = new Date(now + off * DAY), iv = interval(S, d); if (iv && now >= iv[0] && now < iv[1]) return { open: true, closesAt: iv[1] }; }
    for (let off = 0; off < 8; off++) { const d = new Date(now + off * DAY), iv = interval(S, d); if (iv && iv[0] > now) {
      const when = off === 0 ? 'hoy' : off === 1 ? 'mañana' : d.toLocaleDateString('es-EC', { weekday: 'long' });
      return { open: false, reason: 'horario', text: `Abrimos ${when} a las ${iv[2][0]}` }; } }
    return { open: false, reason: 'horario', text: 'Volvemos pronto' };
  }

  /* ---------- catálogo ---------- */
  const todayK = () => dkey(Date.now());
  const campActive = c => c.enabled && c.start <= todayK() && todayK() <= c.end;
  const isCig = p => p.cat === 'cigarrillos';
  function visible(d, p) { return !(isCig(p) && !d.settings.flags.venderCigarrillos); }
  function campDiscount(d, p) { if (isCig(p)) return null; let best = null; for (const c of d.campaigns) if (campActive(c) && c.discount && (c.productIds.includes(p.id) || c.cats.includes(p.cat))) if (!best || c.discount > best.discount) best = c; return best; }
  const decorate = (d, p) => { const c = campDiscount(d, p); return { ...p, camp: c ? c.id : null, campTitle: c ? c.title : '', unit: c ? +(p.price * (1 - c.discount / 100)).toFixed(2) : p.price }; };
  async function getCategories(door) { const d = await load(); return d.categories.filter(c => (!door || c.door === door) && (!c.flag || d.settings.flags[c.flag])); }
  async function getProducts(o = {}) {
    const d = await load();
    return d.products.filter(p => visible(d, p) && (o.all || p.active) && (!o.cat || p.cat === o.cat) && (!o.door || p.door === o.door || p.door === 'ambas')).map(p => decorate(d, p));
  }
  async function getProduct(id) { const d = await load(); const p = d.products.find(x => x.id === id); return p ? decorate(d, p) : null; }
  async function getCombos(door) { const d = await load(); return d.combos.filter(c => c.active && (!door || c.door === door) && c.items.every(i => { const p = d.products.find(x => x.id === i.id); return p && !isCig(p); })).map(c => ({ ...c, old: +c.items.reduce((a, i) => a + d.products.find(p => p.id === i.id).price * i.qty, 0).toFixed(2) })); }
  async function getTopProducts(n = 6) {
    const d = await load(), since = Date.now() - 7 * DAY, cnt = {};
    d.orders.filter(o => o.createdAt > since && o.status !== 'cancel').forEach(o => o.items.forEach(i => { (i.inc || [{ id: i.id, qty: i.qty }]).forEach(x => cnt[x.id] = (cnt[x.id] || 0) + x.qty); }));
    return d.products.filter(p => p.active && visible(d, p) && !isCig(p) && !p.ice && !p.mixer && p.cat !== 'desechables' && p.cat !== 'detalles').sort((a, b) => (cnt[b.id] || 0) - (cnt[a.id] || 0)).slice(0, n).map(p => decorate(d, p));
  }
  async function getCampaigns(o = {}) { const d = await load(); let l = d.campaigns; if (o.activeOnly) l = l.filter(campActive); return l.map(c => ({ ...c, active: campActive(c) })).sort((a, b) => b.start.localeCompare(a.start)); }

  /* ---------- Asesor de la Cava ---------- */
  const BUDGET = { 15: [0, 15], 30: [15, 30], 60: [30, 60], 99: [60, 9999] };
  const kindOf = p => p.cat === 'vinos' ? (p.type === 'tinto' ? 'tinto' : 'blanco') : p.cat === 'espumantes' ? 'espumante' : (p.cat === 'premium' || p.cat === 'cremas') ? 'premium' : null;
  async function recommendWine({ occasion = 'yo', kind = 'nose', budget = 30 }) {
    const d = await load(); const [lo, hi] = BUDGET[budget] || [0, 9999];
    const kinds = kind === 'nose' ? (d.settings.advisor[occasion] || ['tinto']) : [kind];
    const pool = d.products.filter(p => p.active && p.stock > 0 && (p.door === 'cava') && kindOf(p) && kinds.includes(kindOf(p))).map(p => decorate(d, p));
    const score = (p, strict) => (p.unit >= lo && p.unit <= hi ? 5 : strict ? -99 : -Math.min(Math.abs(p.unit - (lo + Math.min(hi, lo + 30)) / 2) / 5, 4)) + (p.pick ? 3 : 0) + (p.occ.includes(occasion) ? 2 : 0) + (p.camp ? 1 : 0) + (p.best ? 1 : 0) + (kinds[0] === kindOf(p) ? 1 : 0);
    let res = pool.map(p => [p, score(p, true)]).filter(x => x[1] > -50).sort((a, b) => b[1] - a[1]).map(x => x[0]);
    if (res.length < 3) { const more = pool.filter(p => !res.includes(p)).map(p => [p, score(p, false)]).sort((a, b) => b[1] - a[1]).map(x => x[0]); res = res.concat(more); }
    if (res.length < 3) { const more = d.products.filter(p => p.active && p.stock > 0 && p.door === 'cava' && kindOf(p) && !res.find(r => r.id === p.id)).map(p => decorate(d, p)).sort((a, b) => Math.abs(a.unit - (lo + hi) / 2) - Math.abs(b.unit - (lo + hi) / 2)); res = res.concat(more); }
    return res.slice(0, 3).map(p => ({ ...p, why: p.note || 'Una gran elección' }));
  }

  /* ---------- clientes / Club ---------- */
  async function getCustomer(id) { const d = await load(); return clone(d.customers.find(c => c.id === id) || null); }
  async function getCustomerByCode(code) { const d = await load(); code = (code || '').toUpperCase(); return clone(d.customers.find(c => c.member && c.code === code) || null); }
  async function listCustomers() { const d = await load(); return clone(d.customers); }
  const spend30 = (d, id, now = Date.now()) => d.orders.filter(o => o.customerId === id && o.status !== 'cancel' && o.createdAt > now - 30 * DAY).reduce((a, o) => a + o.total, 0);
  function tierOf(d, c, now) { if (!c || !c.member) return null; if (c.tierOverride) return c.tierOverride; const s = spend30(d, c.id, now), T = d.settings.tiers; return s >= T.leyenda ? 'leyenda' : s >= T.vip ? 'vip' : 'socio'; }
  async function getClub(id) {
    const d = await load(), c = d.customers.find(x => x.id === id); if (!c) return null; const T = d.settings.tiers, spent = spend30(d, id), tier = tierOf(d, c);
    const next = tier === 'socio' ? { name: 'vip', need: T.vip } : tier === 'vip' ? { name: 'leyenda', need: T.leyenda } : null;
    return { tier, spent: +spent.toFixed(2), next: next && { ...next, missing: +Math.max(0, next.need - spent).toFixed(2), pct: Math.min(100, Math.round(spent / next.need * 100)) }, benefits: d.settings.tierBenefits };
  }
  async function saveCustomer(c) { return tx(d => { const i = d.customers.findIndex(x => x.id === c.id); if (i < 0) d.customers.push(c); else d.customers[i] = { ...d.customers[i], ...c }; return c; }); }
  async function upsertCustomer({ id, name, phone, address }) {
    return tx(d => { let c = id && d.customers.find(x => x.id === id);
      if (!c) { c = { id: 'u' + String(d.customers.length + 1 + Math.floor(Math.random() * 1e3)).padStart(4, '0'), name, phone, zone: '', address: address || {}, type: 'ambos', member: false, code: '', consentData: false, consentPromo: false, birthday: '', notes: '', createdAt: Date.now(), memberSince: null, tierOverride: '' }; d.customers.push(c); }
      if (name) c.name = name; if (phone) c.phone = phone; if (address) { c.address = { ...c.address, ...address }; c.zone = address.zone || c.zone; } return clone(c); });
  }
  const genCode = d => { const ch = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let c; do { c = 'DS-' + Array.from({ length: 4 }, () => ch[Math.floor(Math.random() * ch.length)]).join(''); } while (d.customers.some(x => x.code === c)); return c; };
  async function createMember(id, { consentData, consentPromo, birthday }) {
    if (!consentData) throw new Error('Se requiere aceptar el uso de datos');
    return tx(d => { const c = d.customers.find(x => x.id === id); if (!c.member) { c.member = true; c.code = genCode(d); c.memberSince = Date.now(); } c.consentData = true; c.consentPromo = !!consentPromo; if (birthday) c.birthday = birthday; return clone(c); });
  }
  async function reissueCode(id) { return tx(d => { const c = d.customers.find(x => x.id === id); c.member = true; c.code = c.code || genCode(d); c.memberSince = c.memberSince || Date.now(); return clone(c); }); }

  /* ---------- precios y carrito ---------- */
  // líneas de carrito: {k:'p'|'c', id, qty}
  async function quote(lines, { customerId, pickup, zoneId } = {}) {
    const d = await load(), c = customerId ? d.customers.find(x => x.id === customerId) : null, tier = tierOf(d, c), S = d.settings; const out = []; let sub = 0, disc = 0;
    for (const l of lines) {
      if (l.k === 'c') { const cb = d.combos.find(x => x.id === l.id); if (!cb) continue; const old = cb.items.reduce((a, i) => a + d.products.find(p => p.id === i.id).price * i.qty, 0);
        out.push({ ...l, name: cb.name, size: cb.desc, unit: cb.price, old, total: +(cb.price * l.qty).toFixed(2), inc: cb.items }); sub += cb.price * l.qty; disc += (old - cb.price) * l.qty; continue; }
      const p0 = d.products.find(x => x.id === l.id); if (!p0 || !p0.active || !visible(d, p0)) continue; const p = decorate(d, p0); let unit = p.unit;
      if (tier === 'leyenda' && p0.cat === 'premium' && !p.camp) unit = +(p0.price * .95).toFixed(2);
      out.push({ ...l, name: p.name, size: p.size, unit, old: unit < p.price ? p.price : null, total: +(unit * l.qty).toFixed(2), camp: p.camp, stock: p.stock, cat: p.cat }); sub += p0.price * l.qty; disc += (p0.price - unit) * l.qty;
    }
    const z = S.zones.find(x => x.id === zoneId); const hasLiquor = out.some(l => l.cat && !['hielo', 'snacks', 'desechables', 'detalles', 'calientes'].includes(l.cat) || l.k === 'c');
    const freeDel = tier === 'vip' || tier === 'leyenda'; const fee = pickup ? 0 : freeDel ? 0 : (z ? z.fee : 0);
    const freeIce = (tier === 'vip' || tier === 'leyenda') && hasLiquor && out.length > 0;
    const total = +(sub - disc + fee).toFixed(2);
    return { lines: out, subtotal: +sub.toFixed(2), discount: +disc.toFixed(2), fee, feeBase: z ? z.fee : 0, freeDelivery: freeDel && !pickup, freeIce, total, tier, minOk: (sub - disc) >= S.minOrder, minOrder: S.minOrder, eta: z ? z.eta : 25, zone: z || null };
  }
  const sig = items => items.filter(i => !i.free).map(i => i.id + ':' + i.qty).sort().join('|');

  /* ---------- pedidos ---------- */
  const pad = n => String(n).padStart(4, '0');
  async function createOrder(p) {
    // p: {customerId, lines, pickup, address:{text,lat,lng,ref,zone}, payment, cashWith, gift:{on,msg,name,toAddress}, source, queued}
    const d0 = await load(); const q = await quote(p.lines, { customerId: p.customerId, pickup: p.pickup, zoneId: p.address && p.address.zone });
    if (!q.lines.length) throw new Error('Carrito vacío');
    const items = q.lines.map(l => ({ id: l.k === 'c' ? 'combo:' + l.id : l.id, name: l.name, size: l.size, qty: l.qty, price: l.unit, ...(l.inc ? { inc: l.inc } : {}) }));
    if (q.freeIce) items.push({ id: 'hielo-2', name: 'Hielo (cortesía VIP)', size: 'bolsa 2 kg', qty: 1, price: 0, free: true });
    const gw = p.gift && p.gift.on ? d0.settings.giftWrap : 0; const total = +(q.total + gw).toFixed(2);
    const door = p.lines.some(l => { const pr = d0.products.find(x => x.id === l.id); return l.k === 'p' && pr && pr.door === 'cava'; }) ? 'cava' : (p.lines.some(l => l.k === 'c' && d0.combos.find(x => x.id === l.id)?.door === 'cava') ? 'cava' : 'previa');
    const camp = (q.lines.find(l => l.camp) || {}).camp || null;
    return tx(d => { const c = d.customers.find(x => x.id === p.customerId); const n = ++d.seq;
      const o = { id: 'o' + n, number: n, customerId: c.id, customerName: p.gift && p.gift.name ? c.name : c.name, phone: c.phone, items, subtotal: q.subtotal, discount: q.discount, fee: q.fee, giftWrap: gw, total,
        payment: p.payment, cashWith: p.cashWith || null, gift: !!(p.gift && p.gift.on), giftMsg: p.gift && p.gift.msg || '', giftName: p.gift && p.gift.name || '', giftTo: p.gift && p.gift.toAddress || null,
        address: p.address || {}, pickup: !!p.pickup, status: 'new', createdAt: Date.now(), acceptedAt: null, deliveredAt: null, door, source: p.source || 'normal', camp, driver: '', tier: q.tier, queued: !!p.queued, eta: q.eta };
      d.orders.push(o); const k = dkey(o.createdAt); (d.events[k] = d.events[k] || { open: 0, add: 0, adv: 0, advAdd: 0 }); if (!c.type) c.type = door;
      return clone(o); });
  }
  async function updateOrderStatus(id, status, extra = {}) {
    return tx(d => { const o = d.orders.find(x => x.id === id); if (!o) return null; o.status = status; if (status === 'prep' && !o.acceptedAt) o.acceptedAt = Date.now(); if (status === 'done') o.deliveredAt = Date.now(); Object.assign(o, extra); return clone(o); });
  }
  async function addToOrder(id, lines) { // "agregar algo más" mientras está Recibido
    const d0 = await load(); const o0 = d0.orders.find(x => x.id === id); if (!o0 || o0.status !== 'new') return null;
    const q = await quote(lines, { customerId: o0.customerId, pickup: o0.pickup, zoneId: o0.address.zone });
    return tx(d => { const o = d.orders.find(x => x.id === id); q.lines.forEach(l => { const iid = l.k === 'c' ? 'combo:' + l.id : l.id; const ex = o.items.find(i => i.id === iid && !i.free); if (ex) ex.qty += l.qty; else o.items.push({ id: iid, name: l.name, size: l.size, qty: l.qty, price: l.unit, ...(l.inc ? { inc: l.inc } : {}) }); o.subtotal = +(o.subtotal + l.unit * l.qty).toFixed(2); o.total = +(o.total + l.unit * l.qty).toFixed(2); }); o.added = true; return clone(o); });
  }
  async function getOrders(o = {}) { const d = await load(); let l = d.orders; if (o.customerId) l = l.filter(x => x.customerId === o.customerId); if (o.since) l = l.filter(x => x.createdAt >= o.since); if (o.status) l = l.filter(x => o.status.includes(x.status)); return clone(l.sort((a, b) => b.createdAt - a.createdAt)); }
  async function getOrder(id) { const d = await load(); return clone(d.orders.find(o => o.id === id) || null); }
  async function getUsual(customerId) {
    const d = await load(); const os = d.orders.filter(o => o.customerId === customerId && o.status !== 'cancel'); if (!os.length) return null;
    const g = {}; os.forEach(o => { const s = sig(o.items); (g[s] = g[s] || { n: 0, last: 0, o }); g[s].n++; if (o.createdAt > g[s].last) { g[s].last = o.createdAt; g[s].o = o; } });
    const best = Object.values(g).sort((a, b) => b.n - a.n || b.last - a.last)[0];
    return { ...await orderToLines(best.o), count: best.n, lastAt: best.last };
  }
  async function orderToLines(o) {
    const lines = o.items.filter(i => !i.free).map(i => i.id.startsWith('combo:') ? { k: 'c', id: i.id.slice(6), qty: i.qty } : { k: 'p', id: i.id, qty: i.qty });
    const q = await quote(lines, { customerId: o.customerId, pickup: o.pickup, zoneId: o.address.zone });
    return { lines: q.lines.map(l => ({ k: l.k, id: l.id, qty: l.qty })), text: q.lines.map(l => `${l.qty} ${l.name}${l.k === 'p' ? ' ' + l.size : ''}`).join(' · '), total: q.total, pickup: o.pickup, address: o.address, payment: o.payment, orderId: o.id };
  }
  async function getRecent(customerId, n = 3) { const os = (await getOrders({ customerId })).filter(o => o.status !== 'cancel'); const seen = new Set(), out = []; for (const o of os) { const s = sig(o.items); if (seen.has(s)) continue; seen.add(s); out.push(o); if (out.length >= n) break; } return Promise.all(out.map(async o => ({ ...await orderToLines(o), at: o.createdAt }))); }
  async function getRonda(customerId) { const t0 = new Date(); t0.setHours(0, 0, 0, 0); const o = (await getOrders({ customerId, since: t0.getTime() })).filter(x => x.status !== 'cancel')[0]; return o ? { ...await orderToLines(o), at: o.createdAt } : null; }
  async function findRecentDuplicate(customerId, lines) { // anti-duplicado 15 min
    const s = sig(lines.map(l => ({ id: l.k === 'c' ? 'combo:' + l.id : l.id, qty: l.qty }))); const os = await getOrders({ customerId, since: Date.now() - 15 * 6e4 });
    const o = os.find(x => x.status !== 'cancel' && sig(x.items) === s); return o ? { order: o, minutes: Math.max(1, Math.round((Date.now() - o.createdAt) / 6e4)) } : null;
  }

  /* ---------- WhatsApp ---------- */
  function mapsLink(a) { return a && a.lat ? `https://www.google.com/maps?q=${a.lat},${a.lng}` : ''; }
  function waMessage(o) {
    const L = ['🍾 PEDIDO DON SNACK #' + pad(o.number)]; o.items.forEach(i => L.push(`• ${i.qty}× ${i.name}${i.size && !i.id.startsWith('combo:') ? ' ' + i.size : ''}`));
    L.push('Total $' + o.total.toFixed(2)); L.push('Pago: ' + o.payment + (o.payment === 'efectivo' && o.cashWith ? ', paga con $' + o.cashWith : ''));
    L.push(o.pickup ? 'Retiro en tienda' : 'Ubicación: ' + (mapsLink(o.address) || o.address.text)); if (o.address.ref) L.push('Ref: ' + o.address.ref);
    L.push('Regalo: ' + (o.gift ? 'sí, mensaje: ' + (o.giftMsg || '(sin mensaje)') : 'no')); return L.join('\n');
  }
  async function waLink(o) { const d = await load(); return `https://wa.me/${d.settings.whatsapp}?text=${encodeURIComponent(waMessage(o))}`; }
  const waTo = (phone, text) => { phone = String(phone || '').replace(/\D/g, ''); if (phone.startsWith('0')) phone = '593' + phone.slice(1); return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`; };

  /* ---------- ajustes, productos, campañas ---------- */
  async function getSettings() { return clone((await load()).settings); }
  async function saveSettings(patch) { return tx(d => { d.settings = { ...d.settings, ...patch }; return clone(d.settings); }); }
  async function saveProduct(p) { return tx(d => { const i = d.products.findIndex(x => x.id === p.id); if (i < 0) d.products.push({ stock: 0, active: true, best: false, pick: false, occ: [], note: '', sales: 0, ...p }); else d.products[i] = { ...d.products[i], ...p }; return p; }); }
  async function deleteProduct(id) { return tx(d => { d.products = d.products.filter(p => p.id !== id); }); }
  async function saveCombo(c) { return tx(d => { const i = d.combos.findIndex(x => x.id === c.id); if (i < 0) d.combos.push(c); else d.combos[i] = c; }); }
  async function deleteCombo(id) { return tx(d => { d.combos = d.combos.filter(x => x.id !== id); }); }
  async function saveCampaign(c) { return tx(d => { const i = d.campaigns.findIndex(x => x.id === c.id); if (i < 0) d.campaigns.push(c); else d.campaigns[i] = c; return c; }); }
  async function deleteCampaign(id) { return tx(d => { d.campaigns = d.campaigns.filter(x => x.id !== id); }); }
  async function getAll() { return clone(await load()); }

  /* ---------- eventos, votos ---------- */
  async function trackEvent(name, n = 1) { return tx(d => { const k = todayK(); const e = d.events[k] = d.events[k] || { open: 0, add: 0, adv: 0, advAdd: 0 }; e[name] = (e[name] || 0) + n; }); }
  async function vote(customerId, productId) { return tx(d => { d.votes[customerId] = productId; }); }
  async function getVotes(customerId) { const d = await load(), cnt = {}; Object.values(d.votes).forEach(p => cnt[p] = (cnt[p] || 0) + 1);
    const rank = Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ n, p: d.products.find(p => p.id === id) })).filter(x => x.p); return { rank, mine: d.votes[customerId] || null, total: Object.keys(d.votes).length }; }

  /* ---------- resultados ---------- */
  async function getStats(range = 'week') {
    const d = await load(), now = Date.now(), T0 = new Date(now); T0.setHours(0, 0, 0, 0);
    const len = range === 'day' ? 1 : range === 'week' ? 7 : 30, start = T0.getTime() - (len - 1) * DAY, pStart = start - len * DAY;
    const cur = d.orders.filter(o => o.createdAt >= start), prev = d.orders.filter(o => o.createdAt >= pStart && o.createdAt < start);
    const agg = os => { const ok = os.filter(o => o.status !== 'cancel'), sales = ok.reduce((a, o) => a + o.total, 0), avg = (f) => { const l = ok.filter(f); return l.length ? l.reduce((a, o) => a + o.total, 0) / l.length : 0; };
      const rep = ok.filter(o => o.source === 'usual' || o.source === 'ronda').length, mem = ok.filter(o => { const c = d.customers.find(x => x.id === o.customerId); return c && c.member; });
      const dl = ok.filter(o => o.deliveredAt && !o.pickup).map(o => (o.deliveredAt - o.createdAt) / 6e4);
      return { sales, orders: ok.length, avg: ok.length ? sales / ok.length : 0, avgPrevia: avg(o => o.door === 'previa'), avgCava: avg(o => o.door === 'cava'), repeatPct: ok.length ? rep / ok.length * 100 : 0,
        memberPct: sales ? mem.reduce((a, o) => a + o.total, 0) / sales * 100 : 0, avgDelivery: dl.length ? dl.reduce((a, b) => a + b, 0) / dl.length : 0, cancels: os.length - ok.length, gifts: ok.filter(o => o.gift).length }; };
    const A = agg(cur), B = agg(prev), ok = cur.filter(o => o.status !== 'cancel');
    const heat = Array.from({ length: 7 }, () => Array(24).fill(0)); d.orders.filter(o => o.createdAt >= T0.getTime() - 29 * DAY && o.status !== 'cancel').forEach(o => { const t = new Date(o.createdAt); heat[t.getDay()][t.getHours()] += o.total; });
    const days = []; for (let i = 0; i < Math.max(len, 7); i++) { const s = T0.getTime() - (Math.max(len, 7) - 1 - i) * DAY; days.push({ label: new Date(s).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric' }), v: d.orders.filter(o => o.createdAt >= s && o.createdAt < s + DAY && o.status !== 'cancel').reduce((a, o) => a + o.total, 0) }); }
    const prodCnt = {}, comboCnt = {}; ok.forEach(o => o.items.forEach(i => { if (i.id.startsWith('combo:')) comboCnt[i.name] = (comboCnt[i.name] || 0) + i.qty; (i.inc || [{ id: i.id, qty: i.qty }]).forEach(x => { if (i.free) return; prodCnt[x.id] = (prodCnt[x.id] || 0) + x.qty * (i.inc ? i.qty : 1); }); }));
    const top = Object.entries(prodCnt).map(([id, n]) => ({ n, p: d.products.find(p => p.id === id) })).filter(x => x.p && x.p.cat !== 'cigarrillos').sort((a, b) => b.n - a.n).slice(0, 8).map(x => ({ name: x.p.name + ' ' + x.p.size, n: x.n }));
    const topCombos = Object.entries(comboCnt).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, n]) => ({ name, n }));
    const doors = { previa: ok.filter(o => o.door === 'previa').reduce((a, o) => a + o.total, 0), cava: ok.filter(o => o.door === 'cava').reduce((a, o) => a + o.total, 0) };
    const zones = d.settings.zones.map(z => ({ name: z.name, v: ok.filter(o => o.address && o.address.zone === z.id).reduce((a, o) => a + o.total, 0) })).sort((a, b) => b.v - a.v);
    const evs = Object.entries(d.events).filter(([k]) => k >= dkey(start)).reduce((a, [, e]) => { a.open += e.open; a.add += e.add; a.adv += e.adv || 0; a.advAdd += e.advAdd || 0; return a; }, { open: 0, add: 0, adv: 0, advAdd: 0 });
    const funnel = { open: evs.open, add: Math.max(evs.add, cur.length), order: cur.length };
    const camps = d.campaigns.map(c => { const os = ok.filter(o => o.camp === c.id); return { title: c.title, orders: os.length, sales: os.reduce((a, o) => a + o.total, 0), discount: os.reduce((a, o) => a + (o.discount || 0), 0) }; }).filter(c => c.orders);
    const tiers = { socio: 0, vip: 0, leyenda: 0 }; d.customers.filter(c => c.member).forEach(c => tiers[tierOf(d, c)]++);
    const growth = Array.from({ length: 12 }, (_, i) => { const e = now - (11 - i) * 7 * DAY; return { label: new Date(e).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' }), v: d.customers.filter(c => c.member && c.memberSince <= e).length }; });
    return { A, B, heat, days, top, topCombos, doors, zones, funnel, camps, tiers, growth, advisor: { uses: evs.adv, adds: evs.advAdd }, members: d.customers.filter(c => c.member).length, customers: d.customers.length, len };
  }
  const tierName = t => ({ socio: 'Socio', vip: 'VIP', leyenda: 'Leyenda' }[t] || '');
  return { load, resetDemo, onChange: f => { listeners.add(f); return () => listeners.delete(f); }, openStatus, getCategories, getProducts, getProduct, getCombos, getTopProducts, getCampaigns, recommendWine,
    getCustomer, getCustomerByCode, listCustomers, saveCustomer, upsertCustomer, createMember, reissueCode, getClub, tierOf: async c => tierOf(await load(), c), spend30: async id => spend30(await load(), id), tierName,
    quote, createOrder, updateOrderStatus, addToOrder, getOrders, getOrder, getUsual, getRecent, getRonda, findRecentDuplicate, waMessage, waLink, waTo, mapsLink,
    getSettings, saveSettings, saveProduct, deleteProduct, saveCombo, deleteCombo, saveCampaign, deleteCampaign, getAll, trackEvent, vote, getVotes, getStats, dkey, pad, BASE };
})();
