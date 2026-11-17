// Parser de órdenes de la empresa eléctrica (PDF / CSV / Excel). Aislado a propósito:
// si el formato real cambia, SOLO se ajusta este archivo (ALIASES, detección de columnas, validate()).
// FORMATOS: (1) Excel/CSV exportado de SAP de la empresa (37 columnas: Orden, Clase de orden DC01/RC01, Cuenta contrato, Distrito, Calle, Unidad de Lectura…) y (2) PDF en tabla (formato supuesto).
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
export const ALIASES = {
  cuen: ['cuen'], cuentaContrato: ['cuenta contrato', 'cuenta', 'cta contrato', 'contrato'], medidor: ['medidor', 'nro medidor', 'numero medidor', 'n medidor', 'no medidor'],
  cliente: ['cliente', 'nombre', 'nombre cliente'], direccion: ['direccion', 'dir', 'calle'], sector: ['sector', 'sector ruta', 'ruta', 'distrito'], mru: ['mru'], unidadLectura: ['unidad de lectura'],
  rural: ['rural', 'ruralidad', 'zona', 'rur', 'descripcion emplazam'], secuencia: ['sec', 'secuencia', 'seq'], deuda: ['deuda', 'valor', 'valor adeudado', 'adeudado', 'saldo'],
  planillas: ['planillas', 'plan', 'n planillas', 'num planillas'], tipo: ['tipo', 'tipo orden', 'tipo de orden', 'clase de orden', 'desc act pm'], numeroOrden: ['orden', 'numero de orden', 'nro orden'],
  tarifa: ['descripcion tarifa v', 'tarifa'], instalacion: ['instalacion'], ubicTecnica: ['ubicac tecnica', 'ubicacion tecnica'], statusSistema: ['status sistema'], fechaEntrada: ['fecha entrada'], lat: ['lat', 'latitud'], lng: ['lng', 'lon', 'long', 'longitud'],
};
const FIELD_OF = {}; for (const [k, v] of Object.entries(ALIASES)) v.forEach(a => FIELD_OF[a] = k);
const fieldOf = h => FIELD_OF[norm(h)];

function tipoOf(s) { const t = norm(s); if (t === 'dc01') return 'corte'; if (t === 'rc01') return 'reconexion'; return t.includes('corte') ? 'corte' : t.includes('reconex') ? 'reconexion' : t.includes('notif') ? 'notificacion' : t.includes('retiro') ? 'retiro' : t.includes('revis') ? 'revision' : null; }
const num = s => { const v = parseFloat(String(s ?? '').replace(/\$/g, '').replace(',', '.')); return Number.isFinite(v) ? v : null; };

function buildOrder(rec) {
  const rural = norm(rec.rural);
  let mru = String(rec.mru ?? '').trim(), secuencia = parseInt(rec.secuencia) || 0;
  if (rec.unidadLectura) { const [m, q] = String(rec.unidadLectura).trim().split('-'); mru = m; secuencia = parseInt(q) || 0; } // "0118M636-000122" = ruta de lectura + orden dentro de la ruta
  const cc = String(rec.cuentaContrato ?? '').trim();
  const fe = rec.fechaEntrada instanceof Date ? rec.fechaEntrada.toISOString().slice(0, 10) : String(rec.fechaEntrada ?? '');
  return {
    tipo: tipoOf(rec.tipo) || tipoOf(rec.claseOrden), claseOrden: String(rec.claseOrden ?? ''), cuentaContrato: cc,
    cuen: String(rec.cuen ?? '').trim() || cc, // el archivo SAP no trae CUEN aparte: se usa la cuenta contrato (a confirmar)
    medidor: String(rec.medidor ?? '').trim(),
    cliente: String(rec.cliente ?? '').trim(), direccion: String(rec.direccion ?? '').trim(), sector: String(rec.sector ?? '').trim(), mru,
    rural: /^(r|rural|si|s|1)$/.test(rural) || rural.includes('rural'), secuencia, deuda: num(rec.deuda) ?? 0, planillas: parseInt(rec.planillas) || 0,
    lat: rec.lat === '' || rec.lat == null ? NaN : num(rec.lat), lng: rec.lng === '' || rec.lng == null ? NaN : num(rec.lng), _rawTipo: rec.tipo,
    numeroOrden: String(rec.numeroOrden ?? '').trim(), tarifa: String(rec.tarifa ?? '').trim(), instalacion: String(rec.instalacion ?? '').trim(), ubicTecnica: String(rec.ubicTecnica ?? '').trim(),
    statusSistema: String(rec.statusSistema ?? '').trim(), fechaEntrada: fe,
  };
}
// Reglas de validación (editar aquí)
export function validate(orders, opts = {}) {
  const seen = new Map(); const keys = o => [o.cuen && `${o.tipo}|n|${o.cuen}`, o.cuentaContrato && `${o.tipo}|c|${o.cuentaContrato}`].filter(Boolean);
  orders.forEach((o, i) => keys(o).forEach(k => seen.set(k, [...(seen.get(k) || []), i])));
  const sap = orders.some(o => o.numeroOrden); // formato SAP: sin medidor ni cliente ni coordenadas
  orders.forEach((o, i) => {
    o._errors = {};
    if (!o.medidor && !sap) o._errors.medidor = 'Medidor faltante';
    if (!o.cuen) o._errors.cuen = 'Cuenta faltante';
    else if (keys(o).some(k => seen.get(k)[0] !== i)) o._errors.cuen = 'Cuenta duplicada en el archivo';
    if (!o.cliente && !sap) o._errors.cliente = 'Cliente faltante';
    if (!o.tipo) o._errors.tipo = `Tipo de orden no reconocido ("${o._rawTipo ?? o.claseOrden ?? ''}")`;
    if (sap && o.statusSistema && !/^LIB\./i.test(o.statusSistema)) o._errors.statusSistema = `Orden no liberada (${o.statusSistema})`;
    if (sap && !o.direccion) o._errors.direccion = 'Sin dirección';
    const hasLat = Number.isFinite(o.lat), hasLng = Number.isFinite(o.lng);
    if (hasLat !== hasLng || (hasLat && (o.lat < -5.5 || o.lat > 2 || o.lng < -92 || o.lng > -74.5))) o._errors.lat = 'Coordenadas inválidas';
  });
  return orders;
}
// ---- Cuadrícula (CSV/Excel/PDF ya agrupado) → órdenes
export function gridToOrders(grid) {
  let h = -1;
  for (let i = 0; i < Math.min(grid.length, 15); i++) if (grid[i].filter(c => fieldOf(c)).length >= 3) { h = i; break; }
  if (h < 0) return [];
  const cols = grid[h].map(fieldOf);
  const out = [];
  for (const row of grid.slice(h + 1)) {
    if (row.every(c => !String(c ?? '').trim())) continue;
    const rec = {}; row.forEach((c, i) => { if (cols[i] && rec[cols[i]] === undefined) rec[cols[i]] = c; });
    if (!rec.cuen && !rec.cuentaContrato && !rec.medidor && !rec.cliente) continue; // línea de pie de página, etc.
    const o = buildOrder({ ...rec, claseOrden: rec.tipo });
    if (rec.numeroOrden !== undefined) o.raw = Object.fromEntries(grid[h].map((hd, i) => [hd, row[i] instanceof Date ? row[i].toISOString() : row[i] ?? '']));
    out.push(o);
  }
  return out;
}
export function parseCSV(text) {
  const delim = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === delim) { row.push(cur); cur = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
// ---- Modo "bloques" (una orden = varias líneas "ETIQUETA: valor") para PDFs que no son tabla
export function blocksToOrders(lines) {
  const out = []; let cur = null;
  for (const l of lines) {
    const m = l.match(/^\s*([A-Za-zÁÉÍÓÚáéíóúñÑ.\- ]{2,30}?)\s*[:：]\s*(.*)$/); if (!m) continue;
    const f = fieldOf(m[1]); if (!f) continue;
    if (f === 'cuen' && cur) { out.push(buildOrder(cur)); cur = null; }
    (cur ||= {})[f] = m[2];
  }
  if (cur) out.push(buildOrder(cur)); return out;
}
// ---- PDF
async function pdfRows(file) {
  const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
  const worker = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const tc = await (await pdf.getPage(p)).getTextContent();
    const items = tc.items.filter(i => i.str.trim()).map(i => ({ s: i.str.trim(), x: i.transform[4], y: i.transform[5], w: i.width }));
    const rows = [];
    for (const it of items.sort((a, b) => b.y - a.y || a.x - b.x)) { const r = rows.find(r => Math.abs(r.y - it.y) < 3); r ? r.items.push(it) : rows.push({ y: it.y, items: [it] }); }
    rows.forEach(r => r.items.sort((a, b) => a.x - b.x));
    pages.push(rows);
  }
  return { pages, numPages: pdf.numPages };
}
const cellsOf = (items, gap = 4) => { const cells = []; for (const it of items) { const l = cells[cells.length - 1]; if (l && it.x - l.x1 <= gap) { l.s += ' ' + it.s; l.x1 = it.x + it.w; } else cells.push({ s: it.s, x0: it.x, x1: it.x + it.w }); } return cells; };
export async function parsePdf(file) {
  const { pages, numPages } = await pdfRows(file);
  let header = null; const grid = [];
  for (const rows of pages) for (const r of rows) {
    const cells = cellsOf(r.items);
    if (!header && cells.filter(c => fieldOf(c.s)).length >= 3) { header = cells; grid.push(cells.map(c => c.s)); continue; }
    if (!header) continue;
    if (cells.filter(c => fieldOf(c.s)).length >= 3) continue; // encabezado repetido en otra página
    const row = header.map(() => '');
    for (const it of r.items) { let ci = 0; header.forEach((h, k) => { if (it.x >= h.x0 - 4) ci = k; }); row[ci] = (row[ci] ? row[ci] + ' ' : '') + it.s; }
    if (row.filter(c => c).length < 4) continue; // títulos / pies de página
    grid.push(row);
  }
  let orders = header ? gridToOrders(grid) : [];
  let modo = 'tabla';
  if (!orders.length) { orders = blocksToOrders(pages.flat().map(r => r.items.map(i => i.s).join(' '))); modo = 'bloques'; }
  return { orders: validate(orders), meta: { formato: 'PDF', paginas: numPages, modo } };
}
export async function parseFile(file) {
  const n = file.name.toLowerCase();
  if (n.endsWith('.pdf')) return parsePdf(file);
  if (n.endsWith('.csv') || n.endsWith('.txt')) return { orders: validate(gridToOrders(parseCSV(await file.text()))), meta: { formato: 'CSV' } };
  if (n.endsWith('.xlsx')) { const { default: readXlsx } = await import('read-excel-file/browser'); const res = await readXlsx(file); const grid = Array.isArray(res) && res[0]?.data ? res[0].data : res; /* v9: [{sheet, data}] */ return { orders: validate(gridToOrders(grid)), meta: { formato: 'Excel' } }; }
  throw new Error('Formato no soportado. Usa PDF, CSV o Excel (.xlsx).');
}
