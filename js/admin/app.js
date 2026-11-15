// Panel /admin — login simulado (Dueño / Mesero), navegación por hash y carga perezosa de vistas.
import * as DB from '../data.js';
import { h, $, toast, confirmModal, registerSW } from '../util.js';
import { icon } from '../icons.js';
import { wordmark, ensureDefs } from '../sellos.js';

const root = $('#root');
ensureDefs();
registerSW();

const NAV = [
  { id: 'resultados', label: 'Resultados', ico: 'chart', roles: ['dueno'] },
  { id: 'visita', label: 'Visitas', ico: 'stamp', roles: ['dueno', 'mesero'] },
  { id: 'clientes', label: 'Clientes', ico: 'users', roles: ['dueno'] },
  { id: 'menu', label: 'Menú', ico: 'menuBook', roles: ['dueno'] },
  { id: 'eventos', label: 'Eventos', ico: 'cal', roles: ['dueno'] },
  { id: 'pasaporte', label: 'Pasaporte', ico: 'gift', roles: ['dueno'] },
  { id: 'config', label: 'Ajustes', ico: 'gear', roles: ['dueno'] }
];
const VIEWS = {
  resultados: () => import('./v-resultados.js'), visita: () => import('./v-visita.js'), clientes: () => import('./v-clientes.js'),
  menu: () => import('./v-menu.js'), eventos: () => import('./v-eventos.js'), pasaporte: () => import('./v-pasaporte.js'), config: () => import('./v-config.js')
};

let session = DB.getSession();
let current = null;

export const ctx = {
  get session() { return session; },
  go: (path) => { location.hash = '#/' + path; },
  toast
};

function login() {
  let rol = 'mesero';
  root.innerHTML = '';
  const roleBtn = (id, name, sub, ico) => h('button', { class: 'role' + (id === rol ? ' on' : ''), type: 'button', 'data-r': id, onclick: e => { rol = id; $('.role.on')?.classList.remove('on'); e.currentTarget.classList.add('on'); $('#pin').focus(); } }, icon(ico, 28), h('b', {}, name), h('small', {}, sub));
  const form = h('form', { class: 'login-card', onsubmit: async e => {
    e.preventDefault();
    const s = await DB.login(rol, $('#pin').value.trim());
    if (!s) { $('#pin-err').textContent = 'PIN incorrecto.'; $('#pin').select(); return; }
    session = s; boot();
  } },
    h('div', { html: wordmark() }),
    h('div', { class: 'sub' }, 'Panel del restaurante'),
    h('div', { class: 'roles' }, roleBtn('mesero', 'Mesero', 'Registrar visitas y canjear', 'stamp'), roleBtn('dueno', 'Dueño', 'Todo el panel', 'chart')),
    h('div', { class: 'field', style: { width: '100%' } }, h('label', { for: 'pin' }, 'PIN'), h('input', { class: 'input pinpad', id: 'pin', inputmode: 'numeric', maxlength: 4, autocomplete: 'off', placeholder: '••••', autofocus: true })),
    h('div', { class: 'err', id: 'pin-err', role: 'alert' }),
    h('button', { class: 'btn primary lg block', type: 'submit' }, 'Entrar'),
    h('p', { class: 'demo-note' }, 'Modo demo · PIN Mesero 1234 · PIN Dueño 2468')
  );
  root.append(h('div', { class: 'login' }, form));
  $('#pin').focus();
}

function boot() {
  const items = NAV.filter(n => n.roles.includes(session.rol));
  const first = items[0].id;
  root.innerHTML = '';
  const navLink = n => h('a', { class: 'nav-i', href: '#/' + n.id, 'data-n': n.id }, icon(n.ico, 22), h('span', {}, n.label));
  const side = h('aside', { class: 'side' }, h('div', { html: wordmark() }), ...items.map(navLink), h('div', { class: 'spacer' }),
    h('span', { class: 'tag warn', style: { alignSelf: 'flex-start' } }, 'Modo demo'));
  const bottom = h('nav', { class: 'bottom', 'aria-label': 'Secciones' }, ...items.map(navLink));
  const top = h('header', { class: 'topbar' }, h('div', { html: wordmark() }),
    h('div', { class: 'who' }, h('span', { class: 'tag warn' }, 'Modo demo'), h('span', {}, session.nombre),
      session.rol === 'dueno' ? h('button', { class: 'btn sm ghost', onclick: resetDemo, title: 'Restaura los datos semilla' }, icon('refresh', 16), h('span', { class: 'lbl' }, 'Reiniciar demo')) : null,
      h('button', { class: 'btn sm', onclick: () => { DB.logout(); session = null; location.hash = ''; login(); } }, icon('logout', 16), h('span', { class: 'lbl' }, 'Salir'))));
  const view = h('main', { class: 'content', id: 'view' });
  root.append(h('div', { class: 'shell' }, side, h('div', {}, top, view), bottom));

  const route = async () => {
    const [id = first, ...rest] = location.hash.replace(/^#\/?/, '').split('/');
    const n = items.find(x => x.id === id);
    if (!n) { location.hash = '#/' + first; return; }
    document.querySelectorAll('.nav-i').forEach(a => a.classList.toggle('on', a.dataset.n === n.id));
    const v = $('#view'); v.innerHTML = '<p class="muted">Cargando…</p>';
    try {
      const mod = await VIEWS[n.id]();
      current?.destroy?.();
      v.innerHTML = '';
      current = mod;
      await mod.render(v, ctx, rest.join('/'));
      window.scrollTo({ top: 0 });
    } catch (e) { console.error(e); v.innerHTML = `<div class="card">No se pudo cargar esta sección: ${e.message}</div>`; }
  };
  window.onhashchange = route;
  route();
}

async function resetDemo() {
  if (!await confirmModal('Se borrarán los cambios de esta demo (clientes nuevos, visitas, menú, eventos) y volverán los datos de ejemplo. ¿Continuar?', { ok: 'Reiniciar demo', danger: true })) return;
  await DB.resetDemo();
  toast('Demo reiniciada');
  const s = session; session = null; DB.logout();
  const again = await DB.login(s.rol, s.rol === 'dueno' ? '2468' : '1234'); session = again;
  location.hash = ''; boot();
}

if (session) boot(); else login();
