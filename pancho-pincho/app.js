/* Datos, pedidos y utilidades compartidas por vitrina, recepción y dueño. MODO DEMO: localStorage del navegador.
   Los tres paneles comparten la misma "base": un pedido hecho en la vitrina aparece al instante en recepción y en el dueño. */
(function () {
  const L = window.LOCAL, KEY = 'pancho_demo_v1';
  let mem = null;
  const money = n => '$' + (+n).toFixed(2);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  const hhmm = t => new Date(t).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function seed() {
    const r = rng(11), now = Date.now();
    const menu = L.menu.map(m => Object.assign({ activo: true, agotado: false }, m));
    const nombres = ['María', 'José', 'Andrea', 'Luis', 'Camila', 'Diego', 'Paola', 'Kevin', 'Daniela', 'Marco', 'Sofía', 'Carlos', 'Estefanía', 'Mateo', 'Valeria', 'Jhon'];
    const peso = { p1: 5, p2: 4, p3: 3, a1: 3, a2: 3, a3: 2, c1: 3, c2: 1, b1: 3, b2: 1 };
    const bag = []; Object.keys(peso).forEach(k => { for (let i = 0; i < peso[k]; i++) bag.push(k); });
    const pagos = ['efectivo', 'efectivo', 'transferencia', 'tarjeta'], origenes = ['mostrador', 'mostrador', 'web', 'whatsapp'];
    const raw = [];
    for (let d = 6; d >= 0; d--) {
      const count = d === 0 ? 13 : 16 + Math.floor(r() * 14);
      for (let i = 0; i < count; i++) {
        let t;
        if (d === 0) t = i < 3 ? now - [2, 6, 11][i] * 60000 : now - (14 + Math.floor(r() * 270)) * 60000;
        else { const day = new Date(now - d * 864e5); day.setHours(18, 0, 0, 0); t = day.getTime() + Math.floor(r() * 270) * 60000; }
        const k = 1 + Math.floor(r() * 3), items = {};
        for (let j = 0; j < k; j++) { const id = bag[Math.floor(r() * bag.length)]; items[id] = (items[id] || 0) + 1 + (r() < .3 ? 1 : 0); }
        raw.push({ t, items, d });
      }
    }
    raw.sort((a, b) => a.t - b.t);
    const orders = raw.map((o, i) => {
      const its = Object.keys(o.items).map(id => { const m = menu.find(x => x.id === id); return { id, nombre: m.nombre, precio: m.precio, qty: o.items[id] }; });
      const sub = its.reduce((s, x) => s + x.precio * x.qty, 0), origen = origenes[Math.floor(r() * origenes.length)];
      const age = (now - o.t) / 60000;
      let estado = 'entregado';
      if (o.d === 0) estado = age < 8 ? 'nuevo' : age < 16 ? 'parrilla' : age < 24 ? 'listo' : 'entregado';
      else if (r() < .03) estado = 'cancelado';
      const desc = origen === 'web' ? +(sub * .1).toFixed(2) : 0;
      return { id: 'o' + (i + 1), n: i + 1, t: o.t, items: its, sub, desc, total: +(sub - desc).toFixed(2), pago: pagos[Math.floor(r() * pagos.length)],
        estado, origen, cliente: nombres[Math.floor(r() * nombres.length)], tipo: r() < .55 ? 'Comer aquí' : 'Para llevar', pagado: estado === 'entregado', nota: '' };
    });
    return { menu, orders, seq: orders.length, settings: { abierto: true, promo: { activo: true, pct: 10, texto: 'Descuento por pedir online' }, horario: L.horario } };
  }

  function persist(s) { mem = s; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function load() {
    try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.orders) return (mem = v); } catch (e) {}
    return mem || (persist(seed()), mem);
  }
  const subs = [];
  addEventListener('storage', e => { if (e.key === KEY) subs.forEach(f => f(load(), true)); });

  window.PP = {
    L, money, esc, sameDay, hhmm,
    get: load,
    update(fn) { const s = load(); fn(s); persist(s); subs.forEach(f => f(s, false)); return s; },
    on(f) { subs.push(f); },
    reset() { persist(seed()); subs.forEach(f => f(mem, false)); },
    createOrder(o) {
      let out;
      PP.update(s => {
        const items = o.items.map(i => { const m = s.menu.find(x => x.id === i.id); return { id: m.id, nombre: m.nombre, precio: m.precio, qty: i.qty }; });
        const sub = items.reduce((a, x) => a + x.precio * x.qty, 0);
        const p = s.settings.promo, desc = o.origen === 'web' && p.activo ? +(sub * p.pct / 100).toFixed(2) : 0;
        s.seq += 1;
        out = { id: 'o' + s.seq, n: s.seq, t: Date.now(), items, sub, desc, total: +(sub - desc).toFixed(2), pago: o.pago || 'efectivo', estado: 'nuevo',
          origen: o.origen, cliente: o.cliente || 'Cliente', tipo: o.tipo || 'Para llevar', pagado: false, nota: o.nota || '' };
        s.orders.push(out);
      });
      return out;
    },
    // Ícono de marca (corona + P) usado en las tres vistas
    logo(size) {
      return '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="#0b5d8a" stroke="#1c1a17" stroke-width="4"/>' +
        '<path d="M30 28l7 8 6-12 7 12 7-12 6 12 7-8-3 14H33z" fill="#ffd21f" stroke="#1c1a17" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<text x="50" y="82" text-anchor="middle" font-family="Bowlby One,Impact,sans-serif" font-size="46" fill="#ffd21f" stroke="#1c1a17" stroke-width="2.5" paint-order="stroke">P</text></svg>';
    },
    star(n, inner) { const pts = []; for (let i = 0; i < n * 2; i++) { const a = Math.PI * i / n - Math.PI / 2, rr = i % 2 ? inner : 50; pts.push((50 + rr * Math.cos(a)).toFixed(1) + '% ' + (50 + rr * Math.sin(a)).toFixed(1) + '%'); } return 'polygon(' + pts.join(',') + ')'; },
    toast(msg) { let t = document.getElementById('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); } t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2400); },
    beep() { try { const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'square'; o.frequency.value = 880; g.gain.value = .06; o.start(); setTimeout(() => { o.frequency.value = 1175; }, 120); setTimeout(() => { o.stop(); c.close(); }, 260); } catch (e) {} },
    tabs(active) {
      const el = document.getElementById('demo-tabs'); if (!el) return;
      el.innerHTML = [['index.html', 'Vitrina'], ['recepcion.html', 'Recepción'], ['dueno.html', 'Dueño']].map(x => '<a href="' + x[0] + '"' + (x[1] === active ? ' class="on"' : '') + '>' + x[1] + '</a>').join('');
    }
  };
  document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('[data-logo]').forEach(e => { e.innerHTML = PP.logo(+e.dataset.logo); }));
})();
