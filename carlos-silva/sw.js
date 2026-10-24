/* FitZone Training · service worker: app instalable y funciona con mala señal. */
const V = 'fz-v1', SHELL = ['./', 'index.html', 'cliente.html', 'panel.html', 'manual.html', 'app.js', 'ui.js', 'charts.js', 'ejercicios.js', 'ficha.js', 'estilos.css', 'config.js',
  'assets/icons/icon-192.png', 'assets/icons/badge-96.png', 'manifest-cliente.webmanifest', 'manifest-panel.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.allSettled(SHELL.map(u => c.add(new Request(u, { cache: 'reload' }))))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
/* Solo se guarda lo del propio sitio. Nunca se tocan las peticiones a la base de datos (otro dominio). Red primero: siempre la versión más nueva; sin señal, la última guardada. */
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url); if (u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })
    .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
