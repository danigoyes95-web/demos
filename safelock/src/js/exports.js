// Exportaciones. ESTRUCTURA SUPUESTA (a confirmar con la empresa eléctrica): una fila por orden con los campos del PDF + el resultado.
import { photoURL } from './data.js';
export const COLS = ['Fecha', 'Hora', 'CUEN', 'Cuenta contrato', 'Medidor', 'Cliente', 'Sector', 'Tipo de orden', 'Estado', 'Motivo no ejecución', 'Lectura', 'Tipo de corte', 'Sello 1', 'Sello 2', 'Observaciones', 'Latitud', 'Longitud', 'Precisión GPS (m)', 'Operario', 'N° fotos'];
export function rowOf(o, tipos, motivos, ops) {
  const e = o.ejecucion, c = e?.campos || {};
  return [o.fecha, e ? new Date(e.hora).toLocaleTimeString('es-EC') : '', o.cuen, o.cuentaContrato, o.medidor, o.cliente, o.sector, tipos[o.tipo]?.label, o.estado === 'hecha' ? 'EJECUTADA' : o.estado === 'no_ejecutada' ? 'NO EJECUTADA' : 'PENDIENTE',
    e && !e.si ? (motivos.find(m => m[0] === e.motivo)?.[1] || e.motivo) : '', c.lectura ?? '', c.tipoCorte ?? '', c.sello1 ?? '', c.sello2 ?? '', e?.obs ?? '', e?.gps?.lat?.toFixed(6) ?? '', e?.gps?.lng?.toFixed(6) ?? '', e?.gps ? Math.round(e.gps.acc) : '', ops.find(x => x.id === (e?.operario || o.asignadoA))?.nombre ?? '', e?.fotos?.length ?? 0];
}
const save = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
export function exportCSV(orders, tipos, motivos, ops, name) {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const txt = [COLS, ...orders.map(o => rowOf(o, tipos, motivos, ops))].map(r => r.map(q).join(',')).join('\r\n');
  save(new Blob(['﻿' + txt], { type: 'text/csv;charset=utf-8' }), name + '.csv');
}
export async function exportXLSX(orders, tipos, motivos, ops, name) {
  const { default: write } = await import('write-excel-file/browser');
  const data = [COLS.map(v => ({ value: v, fontWeight: 'bold' })), ...orders.map(o => rowOf(o, tipos, motivos, ops).map(v => ({ value: typeof v === 'number' ? v : String(v ?? '') })))];
  save(await write(data).toBlob(), name + '.xlsx');
}
async function toJpeg(id) {
  const url = await photoURL(id); if (!url) return null;
  return new Promise(res => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); const k = Math.min(1, 640 / i.width); c.width = (i.width || 640) * k; c.height = (i.height || 480) * k; c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); res({ d: c.toDataURL('image/jpeg', .7), w: c.width, h: c.height }); }; i.onerror = () => res(null); i.src = url; });
}
// Reporte PDF diario con evidencias (respaldo ante reclamos)
export async function exportPDF(orders, fecha, tipos, motivos, ops, empresa) {
  const { jsPDF } = await import('jspdf'); const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const rows = orders.filter(o => o.ejecucion).sort((a, b) => a.ejecucion.hora - b.ejecucion.hora);
  doc.setFontSize(18); doc.text('Safelock — Reporte diario de ejecución', 14, 18); doc.setFontSize(10);
  doc.text(`${empresa} · Fecha: ${fecha} · Órdenes registradas: ${rows.length} (${rows.filter(o => o.estado === 'hecha').length} ejecutadas, ${rows.filter(o => o.estado === 'no_ejecutada').length} no ejecutadas)`, 14, 25);
  let y = 34; const H = 62;
  for (const o of rows) {
    if (y + H > 285) { doc.addPage(); y = 16; }
    const e = o.ejecucion, c = e.campos || {};
    doc.setDrawColor(180); doc.rect(12, y, 186, H - 4);
    doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.text(`${tipos[o.tipo].label.toUpperCase()} · ${o.estado === 'hecha' ? 'EJECUTADA' : 'NO EJECUTADA'} · ${new Date(e.hora).toLocaleString('es-EC')}`, 15, y + 6);
    doc.setFont(undefined, 'normal'); doc.setFontSize(9);
    const L = [`CUEN ${o.cuen} · Medidor ${o.medidor}`, o.cliente, `${o.direccion} · ${o.sector}`, e.si ? `Lectura: ${c.lectura ?? '—'}  Sellos: ${[c.sello1, c.sello2].filter(Boolean).join(' / ') || '—'}  ${c.tipoCorte ? 'Corte en ' + c.tipoCorte : ''}` : `Motivo: ${motivos.find(m => m[0] === e.motivo)?.[1] || e.motivo}`, `GPS: ${e.gps ? `${e.gps.lat.toFixed(6)}, ${e.gps.lng.toFixed(6)} (±${Math.round(e.gps.acc)} m)` : 'no disponible'}`, `Operario: ${ops.find(x => x.id === e.operario)?.nombre || e.operario}`, e.obs ? `Obs: ${e.obs}` : ''].filter(Boolean);
    L.forEach((t, i) => doc.text(doc.splitTextToSize(t, 86)[0], 15, y + 13 + i * 5.2));
    let x = 104; for (const pid of e.fotos.slice(0, 2)) { const im = await toJpeg(pid); if (im) { const w = 46, h = Math.min(44, w * im.h / im.w); doc.addImage(im.d, 'JPEG', x, y + 4, w, h); x += w + 3; } }
    y += H;
  }
  if (!rows.length) doc.text('Sin registros para esta fecha.', 14, 40);
  doc.save(`reporte-${fecha}.pdf`);
}
