/* FitZone Training · service worker: app instalable, funciona con mala señal y recibe notificaciones push. */
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
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { cuerpo: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'FitZone Training', { body: d.cuerpo || '', icon: 'assets/icons/icon-192.png', badge: 'assets/icons/badge-96.png', tag: d.tag || 'fz', data: { url: d.url || './' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close(); const dest = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => { for (const w of ws) { if (w.url.split('#')[0] === dest.split('#')[0] && 'focus' in w) return w.focus(); } return self.clients.openWindow(dest); }));
});
