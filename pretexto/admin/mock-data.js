// Datos mock realistas de 90 días (semilla fija → siempre iguales). Picos de jueves a sábado por la noche.
const DAY = 864e5;
function rng(seed) { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// pesos por hora 11..26 (24..26 = madrugada del día siguiente)
const H_WEEK = [1, 2, 2, 2, 2, 3, 4, 6, 8, 9, 9, 7, 4, 2, 1, .5];
const H_PEAK = [1, 2, 2, 2, 3, 4, 5, 7, 10, 13, 15, 14, 12, 9, 6, 3];
const DAY_BASE = [24, 14, 15, 19, 31, 46, 52]; // dom..sáb
const CAT_W = { cerveza: 30, aguardiente: 12, ron: 11, whisky: 9, vodka: 5, tequila: 5, vino: 6, gin: 3, espumante: 3, hielo: 6, snacks: 6, combos: 10 };
const STRONG = ['ron', 'whisky', 'vodka', 'tequila', 'aguardiente', 'gin'];

const pickW = (rnd, w) => { const t = w.reduce((a, b) => a + b, 0); let r = rnd() * t; for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; } return w.length - 1; };

export function buildMock(prods, nowMs = Date.now()) {
  const rnd = rng(20241105), out = [];
  const by = {}; prods.filter(p => !p.addon).forEach(p => (by[p.cat] ||= []).push(p));
  const cats = Object.keys(CAT_W).filter(c => by[c]), cw = cats.map(c => CAT_W[c]);
  const pickProd = c => { const l = by[c]; return l[pickW(rnd, l.map(p => p.best ? 3 : 1))]; };
  const d0 = new Date(nowMs); d0.setHours(0, 0, 0, 0);
  for (let off = 89; off >= 0; off--) {
    const day0 = d0.getTime() - off * DAY, dow = new Date(day0 + 12 * 36e5).getDay();
    const n = Math.round(DAY_BASE[dow] * (.85 + .3 * (90 - off) / 90) * (.85 + rnd() * .3));
    const hw = [4, 5, 6].includes(dow) ? H_PEAK : H_WEEK;
    for (let i = 0; i < n; i++) {
      const ts = day0 + (11 + pickW(rnd, hw) + rnd()) * 36e5;
      if (ts > nowMs) continue;
      const items = [], seen = new Set(); let ups = 0, strong = false;
      const lines = 1 + (rnd() < .45) + (rnd() < .2) + (rnd() < .08);
      for (let k = 0; k < lines; k++) {
        const c = cats[pickW(rnd, cw)], p = pickProd(c); if (seen.has(p.id)) continue; seen.add(p.id);
        if (STRONG.includes(c)) strong = true;
        const q = c === 'cerveza' ? 1 + Math.floor(rnd() * 6) : 1 + (rnd() < .25);
        items.push({ id: p.id, cat: c, qty: q, price: p.price });
      }
      const hasMix = items.some(x => x.cat === 'hielo' || x.cat === 'combos');
      if (strong && !hasMix) { ups = 1; const kit = prods.find(p => p.id === 'kit-hielo-cola'); if (kit && rnd() < .31) { ups = 2; items.push({ id: kit.id, cat: 'hielo', qty: 1, price: kit.price }); } }
      const mode = rnd() < .7 ? 'entrega' : 'retiro', fee = mode === 'entrega' ? 1 + Math.floor(rnd() * 5) * .5 : 0;
      const sub = items.reduce((s, x) => s + x.price * x.qty, 0);
      out.push({ ts, items, total: +(sub + fee).toFixed(2), cust: Math.floor(Math.pow(rnd(), 1.8) * 750), mode, combo: items.some(x => x.cat === 'combos'), ups });
    }
  }
  return out.sort((a, b) => a.ts - b.ts);
}

export function fromReal(o) {
  return { ts: o.ts, items: o.items.map(i => ({ id: i.id, cat: i.cat || 'otros', qty: i.qty, price: i.price })), total: o.total, cust: 'r' + (o.phone || o.id), mode: o.mode, combo: !!o.hasCombo, ups: o.upsell ? 2 : 0, real: true };
}

const NAMES = ['Carlos M.', 'Andrea P.', 'Luis T.', 'María F.', 'Jorge V.', 'Paola R.', 'Diego S.', 'Camila O.', 'Esteban L.', 'Valeria N.'];
const STREETS = ['Av. Cevallos y Mera', 'Bolívar y Quito', 'Av. Los Atis', 'Juan Benigno Vela', 'Av. Víctor Hugo', 'Calle Sucre y Lalama', 'Av. Indoamérica'];
export function randomOrder(S, id) {
  const cfg = S.store.cfg, pr = S.store.prods.filter(p => !p.addon && !S.isOut(p));
  const n = 1 + Math.floor(Math.random() * 3), items = [];
  for (let i = 0; i < n; i++) { const p = pr[Math.floor(Math.random() * pr.length)]; if (!items.find(x => x.id === p.id)) items.push({ id: p.id, name: p.short, size: p.size, qty: 1 + Math.floor(Math.random() * 2), price: p.price, cat: p.cat }); }
  const z = cfg.zones[Math.floor(Math.random() * cfg.zones.length)], mode = Math.random() < .75 ? 'entrega' : 'retiro';
  const sub = items.reduce((s, x) => s + x.price * x.qty, 0), fee = mode === 'entrega' ? z.cost : 0;
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  return { id, ts: Date.now(), status: 'nuevo', src: 'mock', items, subtotal: sub, fee, total: sub + fee, mode, zone: mode === 'entrega' ? z.name : '', address: mode === 'entrega' ? STREETS[Math.floor(Math.random() * STREETS.length)] + ' #' + (10 + Math.floor(Math.random() * 90)) : '', geo: '', name, phone: '09' + String(80000000 + Math.floor(Math.random() * 19999999)), pay: ['efectivo', 'transferencia', 'link'][Math.floor(Math.random() * 3)], cashWith: 0, hasCombo: items.some(x => x.cat === 'combos'), hasCig: false, upsell: false };
}
