// QR local (librería qrcode-generator en js/vendor, sin red).
export function qrMatrix(text, level = 'M') {
  const qr = window.qrcode(0, level); qr.addData(text); qr.make(); return qr;
}
export function qrSVG(text, { dark = '#0b0a09', light = '#ece6db' } = {}) {
  const qr = qrMatrix(text);
  return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true })
    .replace('fill="white"', `fill="${light}"`).replace('fill="black"', `fill="${dark}"`);
}
/** PNG descargable (Blob) con margen y texto opcional debajo. */
export function qrPNG(text, { size = 1024, caption = '', dark = '#0b0a09', light = '#ffffff' } = {}) {
  const qr = qrMatrix(text, 'Q'); const n = qr.getModuleCount();
  const pad = Math.round(size * 0.08), capH = caption ? Math.round(size * 0.11) : 0;
  const cell = Math.floor((size - pad * 2) / n), q = cell * n;
  const c = document.createElement('canvas'); c.width = q + pad * 2; c.height = q + pad * 2 + capH;
  const g = c.getContext('2d'); g.fillStyle = light; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = dark;
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) g.fillRect(pad + k * cell, pad + r * cell, cell, cell);
  if (caption) { g.font = `700 ${Math.round(capH * 0.42)}px "Big Shoulders Display", Impact, sans-serif`; g.textAlign = 'center'; g.fillText(caption.toUpperCase(), c.width / 2, c.height - capH * 0.32); }
  return new Promise(res => c.toBlob(res, 'image/png'));
}
