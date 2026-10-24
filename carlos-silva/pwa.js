/* App instalable + notificaciones: registro del service worker, guía de instalación y suscripción a avisos push. */
(() => {
  const C = window.COACH || {}, APP = C.app || 'FitZone Training';
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const soportaPush = () => 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  let evt = null, rol = 'cliente';
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); evt = e; refrescar(); });
  addEventListener('appinstalled', () => { evt = null; refrescar(); });
  const reg = ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) ? navigator.serviceWorker.register('sw.js').catch(() => null) : Promise.resolve(null);
  const b64 = s => { const p = '='.repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, c => c.charCodeAt(0)); };
  const perm = () => 'Notification' in window ? Notification.permission : 'unsupported';
  /* guarda la suscripción en la base (solo con sesión iniciada); sin clave VAPID solo hay avisos locales */
  async function sync() {
    try { const S = window.CS && CS.Store; if (!S || !S.remoto || !C.vapidPublic || !soportaPush() || perm() !== 'granted' || !S.api.hayCuenta()) return false;
      const r = await reg; if (!r) return false; let sub = await r.pushManager.getSubscription();
      if (!sub) sub = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(C.vapidPublic) });
      const j = sub.toJSON(); await S.api.rpc('guardar_push', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth }); return true; } catch (e) { return false; } }
  async function activarNotif() { try { if (!soportaPush()) return perm(); const p = await Notification.requestPermission(); if (p === 'granted') await sync(); return p; } catch (e) { return perm(); } }
  async function instalar() { if (!evt) return false; evt.prompt(); const r = await evt.userChoice.catch(() => ({})); evt = null; return r.outcome === 'accepted'; }
  const falta = () => !standalone() || (soportaPush() && perm() === 'default');
  function pasoInstalar() {
    if (standalone()) return `<p class="ok">✓ App instalada</p>`;
    if (evt) return `<p><button class="btn" data-pwa-i>📲 Instalar ahora</button></p>`;
    if (ios) return `<ol><li>En <b>Safari</b>, toca el botón <b>Compartir</b> (el cuadrado con la flecha ⬆).</li><li>Elige <b>Añadir a pantalla de inicio</b>.</li><li>Abre la app desde el nuevo ícono del tiburón.</li></ol><p class="hint">Solo funciona desde Safari, no desde otros navegadores.</p>`;
    return `<ol><li>Abre el menú del navegador (<b>⋮</b>).</li><li>Toca <b>Instalar app</b> o <b>Añadir a pantalla de inicio</b>.</li></ol>`;
  }
  function pasoNotif() {
    if (!soportaPush()) return ios && !standalone() ? `<p class="hint">En iPhone, primero instala la app (paso 1) y ábrela desde su ícono; después podrás activar los avisos aquí.</p>` : `<p class="hint">Este navegador no permite notificaciones.</p>`;
    const p = perm(); if (p === 'granted') return `<p class="ok">✓ Notificaciones activadas</p>`;
    if (p === 'denied') return `<p class="hint">Las notificaciones están bloqueadas. Actívalas en los ajustes del navegador: Permisos del sitio → Notificaciones.</p>`;
    return `<p><button class="btn" data-pwa-n>🔔 Activar notificaciones</button></p>`;
  }
  const quePasa = r => r === 'coach' ? 'Recibirás avisos de mensualidades por vencer y del check-in de tus clientes.' : 'Te avisaremos cuando se acabe tu mensualidad y el viernes en la noche para tu check-in del sábado.';
  function mostrar(r) {
    rol = r || rol; let d = document.getElementById('dPwa');
    if (!d) { d = document.createElement('dialog'); d.id = 'dPwa'; d.setAttribute('aria-labelledby', 'dPwaT'); d.style.cssText = 'width:min(440px,94vw);padding:0'; document.body.appendChild(d);
      d.addEventListener('click', async e => { if (e.target.closest('[data-pwa-i]')) { await instalar(); refrescar(); } else if (e.target.closest('[data-pwa-n]')) { await activarNotif(); refrescar(); } else if (e.target.closest('[data-pwa-x]')) { set('fz_pwa_later', String(Date.now())); d.close(); } else if (e.target.closest('[data-pwa-ok]')) d.close(); }); }
    d.innerHTML = `<div style="padding:20px"><div style="display:flex;gap:14px;align-items:center;margin-bottom:10px"><img src="assets/icons/icon-192.png" width="64" height="64" alt="" style="border-radius:16px"><div><h2 id="dPwaT" style="font-size:19px;font-family:Orbitron,sans-serif">${APP}</h2><small style="color:var(--mut)">${rol === 'coach' ? 'Panel del coach' : 'Tu rutina, tu plan y tu progreso'}</small></div></div>
      <p style="color:var(--mut);font-size:14px;margin-bottom:6px">Ten la app en tu celular, como cualquier otra, y no te pierdas ningún aviso.</p>
      <h3 style="font-size:15px;margin:14px 0 4px">1 · Instala la app</h3>${pasoInstalar()}
      <h3 style="font-size:15px;margin:14px 0 4px">2 · Activa las notificaciones</h3><p class="hint" style="margin-bottom:6px">${quePasa(rol)}</p>${pasoNotif()}
      <p style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">${falta() ? '<button class="btn sec sm" data-pwa-x>Más tarde</button>' : ''}<button class="btn sm" data-pwa-ok>Listo</button></p></div>`;
    if (!d.open) d.showModal();
  }
  function refrescar() { const d = document.getElementById('dPwa'); if (d && d.open) mostrar(rol); document.querySelectorAll('[data-pwa-estado]').forEach(e => e.hidden = !falta()); }
  /* se muestra solo cuando falta algo y no lo pospusieron en las últimas 24 h */
  function auto(r) { rol = r; refrescar(); const t = +get('fz_pwa_later') || 0; if (falta() && Date.now() - t > 864e5) setTimeout(() => { if (!document.querySelector('dialog[open]')) mostrar(r); }, 900); }
  window.PWA = { mostrar, auto, sync, falta, standalone, activarNotif, instalar, soportaPush, perm, banner: () => falta() ? `<div class="av" role="status"><span>📲 Instala la app y activa los avisos</span><button class="btn sm" data-pwa>Ver cómo</button></div>` : '' };
  document.addEventListener('click', e => { if (e.target.closest('[data-pwa]')) mostrar(rol); });
})();
