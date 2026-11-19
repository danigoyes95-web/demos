/* Service worker: caché del catálogo y la app para funcionar con señal mala o sin internet. */
const V = 'donsnack-v2', SHELL = ['./', 'index.html', 'admin/', 'admin/index.html', 'css/app.css', 'css/admin.css', 'js/data.js', 'js/mock.js', 'js/mascot.js', 'js/club.js', 'js/app.js', 'js/admin.js', 'data/seed.json', 'manifest.json', 'assets/icon.svg', 'assets/icon-192.png', 'vendor/qrcode.js', 'vendor/confetti.js', 'vendor/chart.umd.js', 'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url);
  if (u.hostname.includes('tile.openstreetmap.org')) return; // mapas: red directa
  e.respondWith(caches.open(V).then(async c => { const hit = await c.match(r, { ignoreSearch: false });
    const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net; }));
});
