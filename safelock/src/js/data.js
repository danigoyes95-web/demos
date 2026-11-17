// ÚNICA capa de datos de Safelock. DEMO: todo en IndexedDB (Dexie).
// Para producción se reemplaza el cuerpo de estas funciones por llamadas al backend (ver docs/PLAN-PRODUCCION.md).
import Dexie from 'dexie';
import seed from '../data/seed.json';
import TIPOS_DEFAULT from '../data/order-types.json';
import { distM } from './geo.js';

export const db = new Dexie('safelock-demo');
db.version(1).stores({
  orders: 'id, fecha, asignadoA, estado, medidor, cuen, tipo, sync',
  operarios: 'id, codigo',
  photos: 'id',
  locations: 'medidor, cuen',
  positions: 'op',
  history: '++id, orderId',
  settings: 'key',
});

export const MOTIVOS_DEFAULT = [
  ['pago', 'Cliente pagó'], ['no_encontrado', 'Medidor no encontrado'], ['acceso', 'Acceso negado'],
  ['peligro', 'Perro / peligro'], ['direccion', 'Dirección errada'], ['ausente', 'Cliente ausente'], ['otro', 'Otro'],
];
export const CONFIG_DEFAULT = { respetarSecuencia: false, radioLlegada: 30, precisionMala: 50, precisionVerificada: 15, distanciaSospechosa: 100, inactividadMin: 45, empresa: 'Empresa Eléctrica [demo]' };

export const dayKey = (d = new Date()) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const atMin = (dia, min) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + dia); return d.getTime() + min * 60000; };

// ---------- Inicialización ----------
export async function resetDemo() {
  await Promise.all(db.tables.map(t => t.clear()));
  const hoy = dayKey();
  const now = Date.now();
  await db.operarios.bulkAdd(seed.operarios);
  await db.locations.bulkAdd(seed.locations);
  await db.positions.bulkAdd(seed.posiciones.map(p => ({ op: p.op, lat: p.lat, lng: p.lng, t: now - p.minAgo * 60000, acc: 8 })));
  const orders = [];
  for (const o of seed.ordenes) {
    const ord = {
      id: `O-${hoy}-${String(o.n).padStart(3, '0')}`, fecha: hoy, estado: 'pendiente', tipo: o.tipo, cuen: o.cuen, cuentaContrato: o.cuentaContrato,
      medidor: o.medidor, cliente: o.cliente, direccion: o.direccion, sector: o.sector, mru: o.mru, rural: o.rural, secuencia: o.secuencia,
      deuda: o.deuda, planillas: o.planillas, lecturaAnterior: o.lecturaAnterior, loc: o.loc, asignadoA: o.asignadoA,
      notaLlegada: o.notaLlegada || '', fotoLugar: o.fotoLugar ? 'seed:lugar' : null, sync: 'ok', cerrada: false, ejecucion: null, creada: now - 864e5 / 2,
    };
    if (o.hoy) {
      const { minAgo, x } = o.hoy;
      const ok = x !== 'pago';
      const base = o.loc.lat ?? seed.posiciones[0].lat; const baseLng = o.loc.lng ?? seed.posiciones[0].lng;
      ord.estado = ok ? 'hecha' : 'no_ejecutada';
      ord.ejecucion = {
        si: ok, motivo: ok ? null : 'pago', obs: ok ? '' : 'Cliente mostró comprobante.',
        campos: ok ? camposDemo(o.tipo, o.lecturaAnterior) : {},
        gps: { lat: x === 'far' ? base + 0.0022 : base + 0.00004, lng: baseLng, acc: 9 },
        fotos: x === 'sinfoto' ? [] : ['seed:1', 'seed:2'], hora: now - minAgo * 60000, durSeg: 48, operario: o.asignadoA,
      };
      ord.sync = minAgo > 100 ? 'ok' : 'pendiente';
      if (o.asignadoA === 'op1' && o.n === 3) ord.ejecucion.fotos = []; // foto faltante (alerta demo)
    }
    orders.push(ord);
  }
  // Historial de 14 días
  const cuenta = {}, total = {};
  seed.historial.forEach(h => { total[h.dia] = (total[h.dia] || 0) + 1; });
  seed.historial.forEach((h, i) => {
    cuenta[h.dia] = (cuenta[h.dia] || 0) + 1;
    const verif = cuenta[h.dia] <= Math.round(total[h.dia] * (0.30 + (h.dia + 14) * 0.035));
    const fecha = dayKey(new Date(atMin(h.dia, 0)));
    const hora = atMin(h.dia, h.min);
    orders.push({
      id: `H-${fecha}-${String(i).padStart(3, '0')}`, fecha, estado: h.ok ? 'hecha' : 'no_ejecutada', tipo: h.tipo, cuen: h.cuen, cuentaContrato: h.cuentaContrato,
      medidor: h.medidor, cliente: h.cliente, direccion: h.direccion, sector: h.sector, mru: h.mru, rural: h.rural, secuencia: 1, deuda: 0, planillas: 0,
      lecturaAnterior: h.lectura - 50, loc: { lat: h.lat, lng: h.lng, calidad: verif ? 'verificada' : 'aprox', precision: h.acc }, asignadoA: h.op, notaLlegada: '', fotoLugar: null,
      sync: 'ok', cerrada: true, creada: hora - 36e5,
      ejecucion: { si: h.ok, motivo: h.motivo, obs: '', campos: h.ok ? camposDemo(h.tipo, h.lectura, h.corte) : {}, gps: { lat: h.lat + 0.00003, lng: h.lng, acc: h.acc }, fotos: Array.from({ length: h.fotos }, (_, k) => 'seed:' + (k + 1)), hora, durSeg: h.dur * 60, operario: h.op },
    });
  });
  await db.orders.bulkAdd(orders);
  await db.history.bulkAdd(orders.filter(o => o.ejecucion).map(o => ({ orderId: o.id, quien: o.ejecucion.operario, que: o.ejecucion.si ? 'Orden ejecutada' : 'Orden no ejecutada', t: o.ejecucion.hora })));
  await db.settings.bulkPut([{ key: 'config', value: CONFIG_DEFAULT }, { key: 'tipos', value: TIPOS_DEFAULT }, { key: 'motivos', value: MOTIVOS_DEFAULT }, { key: 'seeded', value: 1 }]);
  localStorage.removeItem('sl_session');
}
function camposDemo(tipo, lect, corte = 'medidor') {
  const base = { lectura: String(lect), obs: '' };
  if (tipo === 'corte') return { ...base, tipoCorte: corte, sello1: 'S' + (100000 + Math.floor(Math.random() * 899999)), sello2: '' };
  if (tipo === 'reconexion') return { ...base, sello1: 'S' + (100000 + Math.floor(Math.random() * 899999)) };
  if (tipo === 'notificacion') return { entrega: 'puerta', recibe: '', obs: '' };
  if (tipo === 'retiro') return { ...base, estadoMedidor: 'bueno' };
  return { ...base, anomalia: 'ninguna' };
}
export async function ensureSeed() { if (!(await db.settings.get('seeded'))) await resetDemo(); }

// ---------- Sesión simulada ----------
export async function login(usuario, pin) {
  const u = (usuario || '').trim().toLowerCase();
  const all = await db.operarios.toArray();
  const op = all.find(o => (o.codigo.toLowerCase() === u || o.nombre.toLowerCase() === u || o.id === u) && o.pin === String(pin));
  if (!op) return null;
  localStorage.setItem('sl_session', op.id); return op;
}
export const logout = () => localStorage.removeItem('sl_session');
export async function currentUser() { const id = localStorage.getItem('sl_session'); return id ? (await db.operarios.get(id)) || null : null; }
export const getOperarios = () => db.operarios.toArray();
export async function saveOperario(o) { await db.operarios.put(o); }
export const deleteOperario = id => db.operarios.delete(id);

// ---------- Configuración ----------
export async function getConfig() { return { ...CONFIG_DEFAULT, ...((await db.settings.get('config'))?.value || {}) }; }
export const saveConfig = v => db.settings.put({ key: 'config', value: v });
export async function getTipos() { return (await db.settings.get('tipos'))?.value || TIPOS_DEFAULT; }
export const saveTipos = v => db.settings.put({ key: 'tipos', value: v });
export async function getMotivos() { return (await db.settings.get('motivos'))?.value || MOTIVOS_DEFAULT; }
export const saveMotivos = v => db.settings.put({ key: 'motivos', value: v });

// ---------- Órdenes ----------
export const getOrder = id => db.orders.get(id);
export async function listOrders(f = {}) {
  let rows = await db.orders.toArray();
  if (f.fecha) rows = rows.filter(o => o.fecha === f.fecha);
  if (f.desde) rows = rows.filter(o => o.fecha >= f.desde);
  if (f.hasta) rows = rows.filter(o => o.fecha <= f.hasta);
  if (f.operario) rows = rows.filter(o => o.asignadoA === f.operario);
  if (f.tipo) rows = rows.filter(o => o.tipo === f.tipo);
  if (f.estado) rows = rows.filter(o => o.estado === f.estado);
  if (f.sector) rows = rows.filter(o => o.sector === f.sector);
  return rows;
}
export const listToday = (op) => listOrders({ fecha: dayKey(), operario: op });
async function logHist(orderId, quien, que) { await db.history.add({ orderId, quien, que, t: Date.now() }); }
export const getHistory = id => db.history.where('orderId').equals(id).sortBy('t');
export async function patchOrder(id, patch, quien, que) {
  await db.orders.update(id, patch); if (que) await logHist(id, quien, que); return db.orders.get(id);
}

// Guarda la ejecución (siempre local e inmediata). Aprende la ubicación real del medidor.
export async function saveExecution(id, ej, quien) {
  const o = await db.orders.get(id); if (!o) throw new Error('Orden no existe');
  if (o.cerrada) throw new Error('La jornada ya fue cerrada por el supervisor');
  const editing = !!o.ejecucion;
  const cfg = await getConfig();
  const distPunto = ej.gps && o.loc && Number.isFinite(o.loc.lat) ? Math.round(distM(ej.gps, o.loc)) : (o.ejecucion?.distPunto ?? null);
  const upd = { estado: ej.si ? 'hecha' : 'no_ejecutada', ejecucion: { ...ej, hora: Date.now(), operario: quien, distPunto }, sync: 'pendiente' };
  if (ej.si && ej.gps && ej.gps.acc <= cfg.precisionVerificada) {
    const loc = { lat: +ej.gps.lat.toFixed(6), lng: +ej.gps.lng.toFixed(6), calidad: 'verificada', precision: Math.round(ej.gps.acc) };
    upd.loc = loc;
    await db.locations.put({ medidor: o.medidor, cuen: o.cuen, lat: loc.lat, lng: loc.lng, precision: loc.precision, nota: ej.campos?.notaProximo || o.notaLlegada || '', fotoLugar: true });
    for (const p of await db.orders.where('medidor').equals(o.medidor).filter(x => x.estado === 'pendiente').toArray()) await db.orders.update(p.id, { loc });
  }
  if (ej.campos?.notaProximo) { upd.notaLlegada = ej.campos.notaProximo; await db.locations.update(o.medidor, { nota: ej.campos.notaProximo }); }
  await db.orders.update(id, upd);
  await logHist(id, quien, editing ? 'Registro corregido' : ej.si ? 'Orden ejecutada' : `No ejecutada (${ej.motivo})`);
  return db.orders.get(id);
}
export async function setLocation(id, lat, lng, quien) {
  const o = await db.orders.get(id);
  const loc = { lat: +lat.toFixed(6), lng: +lng.toFixed(6), calidad: 'verificada', precision: 5 };
  await db.locations.put({ medidor: o.medidor, cuen: o.cuen, lat: loc.lat, lng: loc.lng, precision: 5, nota: o.notaLlegada || '' });
  await db.orders.update(id, { loc }); await logHist(id, quien, 'Ubicación corregida manualmente');
}
export async function setNota(id, nota) { const o = await db.orders.get(id); await db.orders.update(id, { notaLlegada: nota }); await db.locations.update(o.medidor, { nota }); }
export const lookupLocation = async (medidor, cuen) => (await db.locations.get(medidor)) || (await db.locations.where('cuen').equals(String(cuen)).first()) || null;

export async function assignOrders(ids, opId, quien = 'sup1') {
  await db.orders.where('id').anyOf(ids).modify({ asignadoA: opId });
  for (const id of ids) await logHist(id, quien, `Asignada a ${opId || 'nadie'}`);
}
export async function closeDay(fecha = dayKey(), quien = 'sup1') {
  const rows = await db.orders.where('fecha').equals(fecha).toArray();
  for (const o of rows) { await db.orders.update(o.id, { cerrada: true }); }
  await logHist('dia-' + fecha, quien, 'Jornada cerrada');
  return rows.length;
}
export async function importOrders(rows, fecha = dayKey(), quien = 'sup1') {
  const existing = await db.orders.where('fecha').equals(fecha).count();
  const out = [];
  let n = existing;
  for (const r of rows) {
    n++;
    const known = await lookupLocation(r.medidor, r.cuen);
    const hasC = Number.isFinite(r.lat) && Number.isFinite(r.lng);
    const loc = known ? { lat: known.lat, lng: known.lng, calidad: 'verificada', precision: known.precision } : hasC ? { lat: r.lat, lng: r.lng, calidad: 'aprox', precision: null } : { lat: null, lng: null, calidad: 'ninguna', precision: null };
    out.push({
      id: `O-${fecha}-${String(n).padStart(3, '0')}`, fecha, estado: 'pendiente', tipo: r.tipo, cuen: r.cuen, cuentaContrato: r.cuentaContrato || '', medidor: r.medidor, cliente: r.cliente,
      direccion: r.direccion, sector: r.sector, mru: r.mru || '', rural: !!r.rural, secuencia: r.secuencia || 0, deuda: r.deuda || 0, planillas: r.planillas || 0, lecturaAnterior: r.lecturaAnterior ?? null,
      loc, asignadoA: null, notaLlegada: known?.nota || '', fotoLugar: known?.fotoLugar ? 'seed:lugar' : null, sync: 'ok', cerrada: false, ejecucion: null, creada: Date.now(),
    });
  }
  await db.orders.bulkAdd(out);
  for (const o of out) await logHist(o.id, quien, 'Importada desde archivo');
  return out.length;
}
export const findDuplicates = async (cuens, fecha = dayKey()) => new Set((await db.orders.where('fecha').equals(fecha).toArray()).map(o => o.cuen).filter(c => cuens.includes(c)));

// ---------- Fotos ----------
export async function savePhoto(blob, meta = {}) { const id = 'p_' + uid(); await db.photos.put({ id, blob, meta, t: Date.now() }); return id; }
const urlCache = new Map();
export async function photoURL(id) {
  if (!id) return null;
  if (urlCache.has(id)) return urlCache.get(id);
  let url;
  if (id.startsWith('seed:')) url = 'data:image/svg+xml;utf8,' + encodeURIComponent(seedSvg(id));
  else { const p = await db.photos.get(id); if (!p) return null; url = URL.createObjectURL(p.blob); }
  urlCache.set(id, url); return url;
}
export async function getPhotoRecord(id) { return db.photos.get(id); }
function seedSvg(id) {
  const lugar = id === 'seed:lugar';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><rect width="640" height="480" fill="${lugar ? '#cfd8c4' : '#2b3a4d'}"/>${lugar
    ? '<rect x="60" y="210" width="260" height="190" fill="#e8dcc0"/><polygon points="40,210 190,120 340,210" fill="#9a4b3a"/><rect x="430" y="90" width="22" height="310" fill="#6b4f35"/><rect x="408" y="150" width="66" height="70" rx="6" fill="#8a949e"/><circle cx="441" cy="185" r="16" fill="#e6eef5"/>'
    : '<rect x="190" y="90" width="260" height="300" rx="16" fill="#cfd6dd"/><rect x="225" y="130" width="190" height="70" rx="6" fill="#14212e"/><text x="320" y="182" font-family="monospace" font-size="44" fill="#7CFF9E" text-anchor="middle">0' + (1000 + id.length * 37) + '</text><circle cx="320" cy="290" r="40" fill="#9aa6b2"/>'
  }<text x="320" y="456" font-family="sans-serif" font-size="22" fill="#fff" text-anchor="middle" opacity=".8">${lugar ? 'Foto del lugar (demo)' : 'Evidencia de ejemplo (demo)'}</text></svg>`;
}

// ---------- Posiciones y sincronización ----------
export const savePosition = (op, p) => db.positions.put({ op, lat: p.lat, lng: p.lng, acc: p.acc, t: Date.now() });
export const getPositions = () => db.positions.toArray();
export const countPending = async (op) => (await db.orders.where('sync').equals('pendiente').toArray()).filter(o => !op || o.ejecucion?.operario === op).length;
// DEMO: simula el envío a la empresa eléctrica. En producción: POST a la API y marcar 'ok' al confirmar.
export async function syncAll(op) {
  const rows = (await db.orders.where('sync').equals('pendiente').toArray()).filter(o => !op || o.ejecucion?.operario === op);
  await new Promise(r => setTimeout(r, 900));
  for (const o of rows) await db.orders.update(o.id, { sync: 'ok', enviada: Date.now() });
  return rows.length;
}
export async function distanceDone(op, fecha = dayKey()) {
  const rows = (await db.orders.where('fecha').equals(fecha).toArray()).filter(o => o.ejecucion?.operario === op && o.ejecucion.gps).sort((a, b) => a.ejecucion.hora - b.ejecucion.hora);
  let d = 0; for (let i = 1; i < rows.length; i++) d += distM(rows[i - 1].ejecucion.gps, rows[i].ejecucion.gps);
  return d * 1.3; // factor de ruta sobre línea recta
}

// ---------- Ruta del día (plan fijo por operario) ----------
export async function getRoutePlan(op) { const r = await db.settings.get(`ruta:${op}:${dayKey()}`); return r?.value || null; }
export const saveRoutePlan = (op, plan) => db.settings.put({ key: `ruta:${op}:${dayKey()}`, value: plan });
