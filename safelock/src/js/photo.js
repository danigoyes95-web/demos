import { savePhoto } from './data.js';
// Toma de evidencia: reduce a ~1280 px, estampa marca de agua (fecha, hora, GPS, precisión, CUEN, operario) y comprime a ~300 KB.
const loadImg = file => new Promise((res, rej) => { const u = URL.createObjectURL(file), i = new Image(); i.onload = () => { URL.revokeObjectURL(u); res(i); }; i.onerror = rej; i.src = u; });
export async function stampPhoto(file, info) {
  const img = await loadImg(file);
  const max = 1280, k = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * k), h = Math.round(img.height * k);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
  const d = new Date(info.t || Date.now());
  const lines = [
    `${d.toLocaleDateString('es-EC')} ${d.toLocaleTimeString('es-EC')}  ·  CUEN ${info.cuen}  ·  ${info.operario}`,
    info.pos ? `GPS ${info.pos.lat.toFixed(6)}, ${info.pos.lng.toFixed(6)}  ·  precisión ±${Math.round(info.pos.acc)} m` : 'GPS no disponible',
  ];
  const fs = Math.max(14, Math.round(w / 46)), pad = Math.round(fs * .5), bh = lines.length * (fs + 4) + pad * 2;
  g.fillStyle = 'rgba(0,0,0,.62)'; g.fillRect(0, h - bh, w, bh);
  g.fillStyle = '#fff'; g.font = `600 ${fs}px Inter, Arial, sans-serif`; g.textBaseline = 'top';
  lines.forEach((l, i) => g.fillText(l, pad, h - bh + pad + i * (fs + 4)));
  let q = 0.82, blob;
  for (let i = 0; i < 4; i++) { blob = await new Promise(r => c.toBlob(r, 'image/jpeg', q)); if (blob.size <= 320 * 1024) break; q -= .14; }
  return savePhoto(blob, { cuen: info.cuen, gps: info.pos || null, t: d.getTime(), tipo: 'image' });
}
export async function saveVideo(file, info) { return savePhoto(file, { cuen: info.cuen, gps: info.pos || null, t: Date.now(), tipo: 'video' }); }
