// "Descargar mapa de hoy": pide al navegador los tiles de la zona; el service worker los guarda (CacheFirst).
const lon2x = (lon, z) => Math.floor((lon + 180) / 360 * 2 ** z);
const lat2y = (lat, z) => Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * 2 ** z);
export function tileList(points, zooms = [12, 13, 14, 15, 16], cap = 900) {
  const la = points.map(p => p.lat), lo = points.map(p => p.lng), pad = 0.006;
  const b = { n: Math.max(...la) + pad, s: Math.min(...la) - pad, e: Math.max(...lo) + pad, w: Math.min(...lo) - pad };
  let list = [];
  for (const z of zooms) { const x0 = lon2x(b.w, z), x1 = lon2x(b.e, z), y0 = lat2y(b.n, z), y1 = lat2y(b.s, z); const tmp = []; for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) tmp.push([z, x, y]); if (list.length + tmp.length > cap) break; list = list.concat(tmp); }
  return list;
}
export async function downloadTiles(points, onProgress) {
  const list = tileList(points); let done = 0, ok = 0;
  const sub = ['a', 'b', 'c'];
  const queue = [...list];
  const worker = async () => { while (queue.length) { const [z, x, y] = queue.pop(); try { const r = await fetch(`https://${sub[(x + y) % 3]}.tile.openstreetmap.org/${z}/${x}/${y}.png`, { mode: 'cors' }); if (r.ok) ok++; } catch { /* sin red */ } onProgress?.(++done, list.length); } };
  await Promise.all(Array.from({ length: 6 }, worker)); return { total: list.length, ok };
}
