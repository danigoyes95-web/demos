// Service worker mínimo: abre el pasaporte aunque no haya señal (stale-while-revalidate, solo mismo origen).
const V = 'nomada-v1';
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(['./', 'pasaporte/', 'menu/', 'css/tokens.css', 'css/base.css', 'css/pasaporte.css', 'js/data.js', 'js/util.js', 'js/pasaporte.js', 'js/sellos.js', 'js/icons.js', 'js/qr.js', 'js/vendor/qrcode.js', 'data/seed.json', 'icons/icon-192.png']).catch(() => { })).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(e.request);
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
