/* Módulo de restaurante · backend de DEMOSTRACIÓN. Imita las funciones SQL (mismos nombres, parámetros p_*, respuestas y mensajes de error)
   con datos de ejemplo guardados en localStorage. No valida nada de verdad: la validación real vive en supabase/migrations.
   Lo propio del cliente llega en window.RESTDATA: { productos, sectores, demo: { equipo, stock } }. Ninguna cifra de aquí es real. */
(() => {
  const D = window.DEMO || {}, R = window.RESTDATA, TZ = 'America/Guayaquil';
  const KEY = (D.claveDemo || 'demo') + '_rest_v1';
  const P = new Map(R.productos.map(p => [p.clave, p]));
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const ec = d => { const o = Object.fromEntries(fmt.formatToParts(d).map(x => [x.type, x.value])); return { dia: `${o.year}-${o.month}-${o.day}`, h: +o.hour, m: +o.minute }; };
  const hoy = () => ec(new Date()).dia;
  const menos = (dia, n) => { const d = new Date(dia + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
  const dow = dia => (new Date(dia + 'T12:00:00Z').getUTCDay() + 6) % 7;        // 0 = lunes
  const iso = (dia, h, m) => new Date(`${dia}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-05:00`).toISOString();
  const err = m => { throw new Error(m); };

  /* ---------- datos de ejemplo (siembra determinista: cada día sale igual para el mismo calendario) ---------- */
  const prng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const elegir = (rnd, pares) => { const tot = pares.reduce((s, x) => s + x[1], 0); let r = rnd() * tot; for (const [v, w] of pares) { if ((r -= w) < 0) return v; } return pares[0][0]; };
  const HORAS = [[12, 6], [13, 12], [14, 10], [15, 4], [16, 3], [17, 5], [18, 10], [19, 14], [20, 12], [21, 7]];
  const BASE_DIA = [26, 28, 32, 36, 52, 62, 40];                                 // lunes … domingo, hamburguesas de ejemplo
  const ids = tipo => R.productos.filter(p => p.cuenta_burger === tipo);

  function lineasDe(rnd) {
    const burgers = R.demo.pesos.map(([c, w]) => [c, w]), ls = {};
    const n = elegir(rnd, [[1, 5], [2, 4], [3, 1]]);
    for (let i = 0; i < n; i++) { const c = elegir(rnd, burgers); ls[c] = (ls[c] || 0) + 1; }
    if (rnd() < 0.45) ls[R.demo.acompanante] = 1;
    if (rnd() < 0.5) ls[R.demo.bebida] = 1;
    return Object.entries(ls).map(([producto, cantidad]) => ({ producto, cantidad }));
  }
  function armar(st, dia, canal, origen, estado, staff, cliente, sector, lineas, creado) {
    const ls = lineas.map(l => { const p = P.get(l.producto); return { producto: p.clave, nombre: p.nombre, cantidad: l.cantidad, precio_cent: p.precio_cent, cuenta_burger: p.cuenta_burger }; });
    const sec = (R.sectores.find(s => s.nombre === sector) || {}).costo_cent || 0, envio = canal === 'domicilio' ? sec : 0;
    const sub = ls.reduce((s, l) => s + l.cantidad * l.precio_cent, 0);
    const num = st.ventas.filter(v => v.dia === dia).reduce((m, v) => Math.max(m, v.numero), 0) + 1;
    const v = { id: ++st.seq, dia, numero: num, canal, origen, estado, staff, cliente: cliente || null, telefono: null, sector: sector || null, direccion: null, maps_url: null, nota: null,
      programado: null, envio_cent: envio, total_cent: sub + envio, unidades: ls.reduce((s, l) => s + l.cantidad, 0), hamburguesas: ls.filter(l => l.cuenta_burger).reduce((s, l) => s + l.cantidad, 0),
      creado, resuelto_en: estado === 'confirmada' ? creado : null, anulado_motivo: null, lineas: ls };
    st.ventas.push(v); return v;
  }
  function sembrar() {
    const st = { v: 1, seq: 0, ventas: [], stock: {} }, ahora = ec(new Date());
    for (let k = 14; k >= 0; k--) {
      const dia = menos(ahora.dia, k), rnd = prng(+dia.replace(/-/g, '') % 99991), meta = Math.round(BASE_DIA[dow(dia)] * (0.85 + rnd() * 0.3));
      let burgers = 0;
      const pedidos = [];
      while (burgers < meta) {
        const h = elegir(rnd, HORAS), m = Math.floor(rnd() * 60), canal = elegir(rnd, [['local', 62], ['llevar', 18], ['domicilio', 20]]), ls = lineasDe(rnd);
        burgers += ls.filter(l => P.get(l.producto).cuenta_burger).reduce((s, l) => s + l.cantidad, 0);
        pedidos.push({ h, m, canal, ls, sector: canal === 'domicilio' ? R.sectores[Math.floor(rnd() * R.sectores.length)].nombre : null, quien: R.demo.equipo[Math.floor(rnd() * R.demo.equipo.length)] });
      }
      pedidos.sort((a, b) => a.h - b.h || a.m - b.m).forEach(p => {
        if (dia === ahora.dia && (p.h > ahora.h || (p.h === ahora.h && p.m > ahora.m))) return;       // hoy solo lo que ya pasó
        armar(st, dia, p.canal, p.canal === 'local' ? 'staff' : 'web', 'confirmada', p.canal === 'local' ? p.quien : 'Caja', p.canal === 'local' ? null : 'Cliente de ejemplo', p.sector, p.ls, iso(dia, p.h, p.m));
      });
    }
    const hoyV = st.ventas.filter(v => v.dia === ahora.dia && v.estado === 'confirmada');
    st.stock[ahora.dia] = {};
    R.productos.filter(p => p.controla_stock).forEach(p => {
      const vend = hoyV.reduce((s, v) => s + v.lineas.filter(l => l.producto === p.clave).reduce((t, l) => t + l.cantidad, 0), 0);
      const ini = R.demo.stock[p.clave]; if (ini != null) st.stock[ahora.dia][p.clave] = { inicial: Math.max(ini, vend) };
    });
    return st;
  }
  let st;
  function cargar() {
    try { st = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { st = null; }
    if (!st || st.v !== 1) st = sembrar();
    if (!st.stock[hoy()]) st.stock[hoy()] = {};      // día nuevo: el dueño vuelve a cargar su stock
    return st;
  }
  function guardar() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* sin almacenamiento: la demo sigue en memoria */ } }

  /* ---------- reglas (espejo del SQL) ---------- */
  const conf = v => v.estado === 'confirmada';
  const vendidas = (cl, dia) => st.ventas.filter(v => v.dia === dia && conf(v)).reduce((s, v) => s + v.lineas.filter(l => l.producto === cl).reduce((t, l) => t + l.cantidad, 0), 0);
  const quedan = (cl, dia) => { const s = st.stock[dia] && st.stock[dia][cl]; return s ? s.inicial - vendidas(cl, dia) : null; };
  const hayStock = (cl, cant, dia) => { const p = P.get(cl), q = quedan(cl, dia); if (p.controla_stock && q != null && q < cant) err(`No alcanza el stock de ${p.nombre}: quedan ${Math.max(q, 0)}.`); };
  const me = () => { const u = window.REST && window.REST.usuarioDemo(); return u || err('Esta cuenta no tiene acceso al local.'); };
  const soloAdmin = (m) => { const u = me(); if (u.rol !== 'admin') err(m || 'Solo el dueño.'); return u; };
  function unir(lineas) {
    if (!Array.isArray(lineas) || lineas.length < 1 || lineas.length > 20) err('El pedido no es válido.');
    const m = {}; lineas.forEach(l => { if (!l || typeof l.producto !== 'string' || !Number.isInteger(l.cantidad)) err('El pedido no es válido.'); m[l.producto] = (m[l.producto] || 0) + l.cantidad; });
    return Object.entries(m).map(([producto, cantidad]) => ({ producto, cantidad }));
  }
  function vender(canal, origen, estado, staff, extra, lineas) {
    const dia = hoy(), ls = unir(lineas);
    ls.forEach(l => { if (l.cantidad < 1 || l.cantidad > 20) err('Cada producto lleva entre 1 y 20 unidades.'); if (!P.has(l.producto)) err('Uno de los productos ya no está disponible.'); hayStock(l.producto, l.cantidad, dia); });
    const v = armar(st, dia, canal, origen, estado, staff, extra.cliente, extra.sector, ls, new Date().toISOString());
    Object.assign(v, { telefono: extra.telefono || null, direccion: extra.direccion || null, maps_url: extra.maps_url || null, nota: extra.nota || null, programado: extra.programado || null });
    return v;
  }
  const lin = v => v.lineas.map(l => ({ nombre: l.nombre, cantidad: l.cantidad }));

  /* ---------- funciones (mismo nombre y parámetros que el SQL) ---------- */
  const F = {
    ping: () => ({ ok: true, hora: new Date().toISOString(), dia: hoy() }),
    carta() {
      const dia = hoy();
      return { hoy: dia, sectores: R.sectores.map(s => ({ nombre: s.nombre, costo_cent: s.costo_cent })),
        productos: R.productos.map(p => { const q = p.controla_stock ? quedan(p.clave, dia) : null;
          return { clave: p.clave, nombre: p.nombre, categoria: p.categoria, precio_cent: p.precio_cent, lema: p.lema, ingredientes: p.ingredientes, foto: p.foto, cuenta_burger: p.cuenta_burger, quedan: q, agotado: !!p.controla_stock && (q == null ? false : q <= 0) }; }) };
    },
    pedido_crear(a) {
      const t = String(a.p_telefono || '').replace(/\D/g, ''), tel = /^09\d{8}$/.test(t) ? '593' + t.slice(1) : /^593\d{9}$/.test(t) ? t : '';
      if (String(a.p_nombre || '').trim().length < 2) err('Escribe tu nombre.');
      if (!tel) err('Escribe un celular válido (09XXXXXXXX).');
      if (!['llevar', 'domicilio'].includes(a.p_canal)) err('Elige para llevar o a domicilio.');
      let sector = null, dir = null, maps = String(a.p_maps || '').trim() || null;
      if (a.p_canal === 'domicilio') {
        sector = (R.sectores.find(s => s.nombre === a.p_sector) || {}).nombre || err('Elige un sector de entrega.');
        dir = String(a.p_direccion || '').trim(); if (dir.length < 5) err('Escribe tu dirección.');
        if (maps && !/^https:\/\/(www\.google\.com\/maps|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl\/maps)([/?#].*)?$/.test(maps)) err('La ubicación debe ser un enlace de Google Maps.');
      } else maps = null;
      const hace1h = Date.now() - 3600e3;
      if (st.ventas.filter(v => v.origen === 'web' && v.telefono === tel && new Date(v.creado) > hace1h).length >= 3) err('Ya enviaste varios pedidos. Espera un momento o escríbenos por WhatsApp.');
      const v = vender(a.p_canal, 'web', 'pendiente', null, { cliente: String(a.p_nombre).trim(), telefono: tel, sector, direccion: dir, maps_url: maps, nota: a.p_nota, programado: a.p_programado }, a.p_lineas);
      guardar(); return { numero: v.numero, dia: v.dia, total_cent: v.total_cent, envio_cent: v.envio_cent };
    },
    contador() { const ahora = hoy(), anio = ahora.slice(0, 4), ya = st.ventas.filter(v => conf(v) && v.dia >= anio + '-01-01').reduce((t, v) => t + v.hamburguesas, 0); return { visible: true, anio: +anio, hamburguesas: (R.demo.contador_base || 0) + ya, ejemplo: true }; },
    yo() { const u = me(); return { nombre: u.nombre, rol: u.rol, dia: hoy() }; },
    stock_hoy() {
      me(); const dia = hoy();
      return R.productos.map(p => { const q = p.controla_stock ? quedan(p.clave, dia) : null, vd = vendidas(p.clave, dia);
        return { clave: p.clave, nombre: p.nombre, categoria: p.categoria, precio_cent: p.precio_cent, cuenta_burger: p.cuenta_burger, controla_stock: p.controla_stock, vendidas: vd, quedan: q, inicial: q == null ? null : q + vd }; });
    },
    venta_registrar(a) {
      const u = me(), k = String(a.p_clave || '').trim() || null;
      const rep = k && st.ventas.find(v => v.staff === u.nombre && v.clave === k);
      if (rep) return { id: rep.id, numero: rep.numero, total_cent: rep.total_cent, unidades: rep.unidades, repetida: true };
      const v = vender('local', 'staff', 'confirmada', u.nombre, { nota: a.p_nota }, a.p_lineas); v.clave = k; guardar();
      return { id: v.id, numero: v.numero, total_cent: v.total_cent, unidades: v.unidades, repetida: false };
    },
    venta_anular(a) {
      const u = me(), v = st.ventas.find(x => x.id === a.p_id) || err('No existe esa venta.');
      if (String(a.p_motivo || '').trim().length < 3) err('Escribe el motivo de la anulación.');
      if (!conf(v)) err('Esa venta ya no se puede anular.');
      if (u.rol !== 'admin' && (v.staff !== u.nombre || Date.now() - new Date(v.resuelto_en || v.creado) > 10 * 60e3)) err('Solo el dueño puede anular esta venta (el plazo del empleado es de 10 minutos y solo para sus ventas).');
      v.estado = 'anulada'; v.anulado_motivo = String(a.p_motivo).trim(); guardar(); return null;
    },
    ventas_hoy() {
      const u = me(), dia = hoy();
      return st.ventas.filter(v => v.dia === dia && ['confirmada', 'anulada'].includes(v.estado) && (u.rol === 'admin' || v.staff === u.nombre)).sort((a, b) => b.id - a.id).slice(0, 100)
        .map(v => ({ id: v.id, numero: v.numero, canal: v.canal, estado: v.estado, total_cent: v.total_cent, unidades: v.unidades, creado: v.creado, quien: v.staff,
          puede_anular: conf(v) && (u.rol === 'admin' || (v.staff === u.nombre && Date.now() - new Date(v.resuelto_en || v.creado) <= 10 * 60e3)), lineas: lin(v) }));
    },
    pedidos_pendientes() {
      me(); const dia = hoy();
      return st.ventas.filter(v => v.estado === 'pendiente').sort((a, b) => a.id - b.id).slice(0, 60).map(v => ({ id: v.id, numero: v.numero, canal: v.canal, cliente: v.cliente, telefono: v.telefono,
        sector: v.sector, direccion: v.direccion, maps_url: v.maps_url, nota: v.nota, programado: v.programado, envio_cent: v.envio_cent, total_cent: v.total_cent, unidades: v.unidades, creado: v.creado, vencido: v.dia !== dia, lineas: lin(v) }));
    },
    pedido_resolver(a) {
      const u = me(), v = st.ventas.find(x => x.id === a.p_id && x.origen === 'web') || err('No existe ese pedido.');
      if (!['confirmar', 'rechazar'].includes(a.p_accion)) err('Acción no válida.');
      if (v.estado !== 'pendiente') err('Ese pedido ya fue resuelto.');
      if (a.p_accion === 'rechazar') { v.estado = 'rechazada'; v.staff = u.nombre; guardar(); return null; }
      if (v.dia !== hoy()) err('Este pedido es de otro día: solo se puede rechazar.');
      v.lineas.forEach(l => hayStock(l.producto, l.cantidad, v.dia));
      v.estado = 'confirmada'; v.staff = u.nombre; v.resuelto_en = new Date().toISOString(); guardar(); return null;
    },
    stock_fijar_varios(a) {
      soloAdmin('Solo el dueño fija el stock.'); const dia = hoy(), antes = JSON.stringify(st.stock[dia] || {});
      try {
        (a.p_items || []).forEach(it => {
          const p = P.get(it.producto) || err('No existe ese producto.');
          if (!p.controla_stock) err(`${p.nombre} no lleva control de stock.`);
          if (!Number.isInteger(it.cantidad) || it.cantidad < 0 || it.cantidad > 9999) err('La cantidad debe estar entre 0 y 9999.');
          const vd = vendidas(it.producto, dia); if (it.cantidad < vd) err(`Ya se vendieron ${vd} de ${p.nombre} hoy: el stock del día no puede ser menor.`);
          (st.stock[dia] = st.stock[dia] || {})[it.producto] = { inicial: it.cantidad };
        });
      } catch (e) { st.stock[dia] = JSON.parse(antes); throw e; }
      guardar(); return (a.p_items || []).map(it => ({ producto: it.producto, inicial: it.cantidad, quedan: it.cantidad - vendidas(it.producto, dia) }));
    },
    dashboard() {
      soloAdmin('Solo el dueño ve el dashboard.');
      const dia = hoy(), ahora = ec(new Date()), cf = st.ventas.filter(conf), hoyV = cf.filter(v => v.dia === dia), pasada = cf.filter(v => v.dia === menos(dia, 7));
      const suma = (arr, f) => arr.reduce((s, v) => s + f(v), 0), ing = v => v.total_cent - v.envio_cent;
      const enHora = (v, h) => ec(new Date(v.creado)).h === h;
      const hastaAhora = v => { const t = ec(new Date(v.creado)); return t.h < ahora.h || (t.h === ahora.h && t.m <= ahora.m); };
      const productos = R.productos.map(p => { const vd = vendidas(p.clave, dia), q = p.controla_stock ? quedan(p.clave, dia) : null;
        const ingr = hoyV.reduce((s, v) => s + v.lineas.filter(l => l.producto === p.clave).reduce((t, l) => t + l.cantidad * l.precio_cent, 0), 0);
        return { clave: p.clave, nombre: p.nombre, categoria: p.categoria, cuenta_burger: p.cuenta_burger, precio_cent: p.precio_cent, vendidas: vd, ingresos_cent: ingr, quedan: q, inicial: q == null ? null : q + vd,
          estado: !p.controla_stock ? 'libre' : q == null ? 'sin_definir' : q <= 0 ? 'agotado' : q <= R.stock_bajo ? 'bajo' : 'ok', orden: p.orden }; })
        .sort((a, b) => b.vendidas - a.vendidas || a.orden - b.orden).map(({ orden, ...x }) => x);
      const equipo = {}; hoyV.filter(v => v.origen === 'staff').forEach(v => { const e = equipo[v.staff] = equipo[v.staff] || { nombre: v.staff, ventas: 0, hamburguesas: 0, ingresos_cent: 0 }; e.ventas++; e.hamburguesas += v.hamburguesas; e.ingresos_cent += v.total_cent; });
      const porDia = {}; cf.forEach(v => { if (v.dia < dia) { porDia[v.dia] = (porDia[v.dia] || 0) + v.hamburguesas; } });
      const rec = Object.entries(porDia).sort((a, b) => b[1] - a[1])[0];
      return { generado: new Date().toISOString(), dia, hora: ahora.h, stock_bajo: R.stock_bajo,
        resumen: { ventas: hoyV.length, unidades: suma(hoyV, v => v.unidades), hamburguesas: suma(hoyV, v => v.hamburguesas), ingresos_cent: suma(hoyV, ing), envios_cent: suma(hoyV, v => v.envio_cent),
          ticket_cent: hoyV.length ? Math.round(suma(hoyV, ing) / hoyV.length) : 0,
          local: suma(hoyV.filter(v => v.canal === 'local'), v => v.hamburguesas), llevar: suma(hoyV.filter(v => v.canal === 'llevar'), v => v.hamburguesas), domicilio: suma(hoyV.filter(v => v.canal === 'domicilio'), v => v.hamburguesas),
          ingresos_local_cent: suma(hoyV.filter(v => v.canal === 'local'), ing), ingresos_web_cent: suma(hoyV.filter(v => v.canal !== 'local'), ing) },
        anuladas: (a => ({ n: a.length, total_cent: suma(a, v => v.total_cent) }))(st.ventas.filter(v => v.dia === dia && v.estado === 'anulada')),
        pendientes: st.ventas.filter(v => v.estado === 'pendiente' && v.dia === dia).length,
        semana_pasada: { hamburguesas_ahora: suma(pasada.filter(hastaAhora), v => v.hamburguesas), hamburguesas_dia: suma(pasada, v => v.hamburguesas), ingresos_dia_cent: suma(pasada, ing) },
        por_hora: Array.from({ length: 24 }, (_, h) => ({ h, hamburguesas: suma(hoyV.filter(v => enHora(v, h)), v => v.hamburguesas), anterior: suma(pasada.filter(v => enHora(v, h)), v => v.hamburguesas) })),
        productos, equipo: Object.values(equipo).sort((a, b) => b.hamburguesas - a.hamburguesas),
        ultimas: st.ventas.filter(v => v.dia === dia && ['confirmada', 'anulada'].includes(v.estado)).sort((a, b) => b.id - a.id).slice(0, 15)
          .map(v => ({ id: v.id, numero: v.numero, canal: v.canal, estado: v.estado, total_cent: v.total_cent, unidades: v.unidades, creado: v.creado, quien: v.staff, cliente: v.cliente, sector: v.sector, lineas: lin(v) })),
        semana: Array.from({ length: 7 }, (_, i) => { const d = menos(dia, 6 - i), vs = cf.filter(v => v.dia === d); return { dia: d, hamburguesas: suma(vs, v => v.hamburguesas), ingresos_cent: suma(vs, ing), ventas: vs.length }; }),
        record: rec ? { dia: rec[0], hamburguesas: rec[1] } : null };
    }
  };

  /* Solo demo: simula ventas del local con la hora actual, para ver el dashboard moverse sin tener otro celular. */
  F.demo_simular = () => {
    const rnd = Math.random, u = { nombre: R.demo.equipo[Math.floor(rnd() * R.demo.equipo.length)] };
    const ls = lineasDe(rnd).filter(l => { const q = quedan(l.producto, hoy()); return q == null || q >= l.cantidad; });
    if (!ls.length) return { n: 0 };
    const v = vender('local', 'staff', 'confirmada', u.nombre, {}, ls); guardar(); return { n: v.hamburguesas };
  };
  F.demo_reiniciar = () => { try { localStorage.removeItem(KEY); } catch (e) { /* nada */ } cargar(); guardar(); return null; };

  window.RESTMOCK = { llamar: (fn, args) => new Promise((res, rej) => { try { cargar(); if (!F[fn]) err('Función no disponible en la demo.'); const r = F[fn](args || {}); setTimeout(() => res(JSON.parse(JSON.stringify(r == null ? null : r))), 120); } catch (e) { setTimeout(() => rej(e), 120); } }) };
})();
