/* PANEL INTERNO — router por hash, login simulado y layout. Datos: solo vía ../data.js */
import { login, logout, isLoggedIn } from '../data.js';
import { $, $$ } from '../util.js';
import * as dashboard from './dashboard.js';
import * as quotes from './quotes.js';
import * as calendar from './calendar.js';
import * as catalog from './catalog.js';
import * as content from './content.js';
import * as settings from './settings.js';

const IC = {
  inicio: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  cotizaciones: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  catalogo: '<circle cx="12" cy="9" r="6"/><path d="M12 15v2.5M10.5 20.5c.9-1.4 2.1-1.4 3 0"/>',
  contenido: '<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/>',
  ajustes: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
};
const ico = (id) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${IC[id]}</svg>`;
const ROUTES = [
  { id: 'inicio', t: 'Resultados', short: 'Inicio', ico: '📊', view: dashboard },
  { id: 'cotizaciones', t: 'Cotizaciones', short: 'Cotiz.', ico: '💬', view: quotes },
  { id: 'calendario', t: 'Calendario', short: 'Agenda', ico: '📅', view: calendar },
  { id: 'catalogo', t: 'Catálogo y armador', short: 'Catálogo', ico: '🎈', view: catalog },
  { id: 'contenido', t: 'Contenido de la landing', short: 'Landing', ico: '✏️', view: content },
  { id: 'ajustes', t: 'Configuración', short: 'Ajustes', ico: '⚙️', view: settings },
];
const root = $('#root');
let cleanup = null;

function renderLogin() {
  root.innerHTML = `<div class="login"><form class="login-card" id="lf"><img src="../assets/img/logo.jpg" alt="Valnu"><h1>Panel de Valnu</h1><p>Aquí controlas tu negocio y tu landing.</p>
    <label class="f">Clave<input type="password" id="pw" placeholder="Escribe lo que quieras" autocomplete="off" autofocus></label>
    <button class="btn primary block" type="submit">Entrar</button><p class="hint-demo">🎈 <b>Modo demo:</b> cualquier clave entra. En la versión final habrá inicio de sesión real.</p></form></div>`;
  $('#lf').addEventListener('submit', async (e) => { e.preventDefault(); await login(); start(); });
}

function layout() {
  root.innerHTML = `<div class="app">
    <aside class="side"><div class="side-brand"><img src="../assets/img/logo.jpg" alt=""><div><b>Valnu</b><small>Panel interno</small></div></div>
      <nav class="side-nav">${ROUTES.map((r) => `<a href="#/${r.id}" data-r="${r.id}">${ico(r.id)}${r.t}</a>`).join('')}</nav>
      <div class="side-foot"><span class="demo-tag">● Modo demo</span><a href="../" target="_blank" rel="noopener" class="lnk">Ver la landing ↗</a><button class="lnk" id="logout">Salir</button></div></aside>
    <div class="main"><header class="top"><h1 id="title"></h1><span class="demo-tag only-m">● Modo demo</span><a class="btn ghost sm hide-m" href="../" target="_blank" rel="noopener">Ver landing ↗</a><button class="btn ghost sm only-m" id="logout2">Salir</button></header>
      <main id="view" tabindex="-1"></main></div>
    <nav class="bottom">${ROUTES.map((r) => `<a href="#/${r.id}" data-r="${r.id}">${ico(r.id)}<em>${r.short}</em></a>`).join('')}</nav></div>`;
  const out = async () => { await logout(); renderLogin(); };
  $('#logout').onclick = out; $('#logout2').onclick = out;
}

async function route() {
  const [, id = 'inicio', arg] = location.hash.split('/');
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  if (id === 'cotizacion') { document.body.classList.add('printing'); return quotes.renderPrint(root, arg); }
  document.body.classList.remove('printing');
  if (!$('.app')) layout();
  const r = ROUTES.find((x) => x.id === id) || ROUTES[0];
  $$('[data-r]').forEach((a) => a.classList.toggle('on', a.dataset.r === r.id));
  $('#title').textContent = r.t;
  const view = $('#view'); view.innerHTML = '<div class="loading-a">Cargando…</div>';
  try { cleanup = (await r.view.render(view, { arg, go: (h) => (location.hash = h) })) || null; } catch (e) { console.error(e); view.innerHTML = `<div class="card pad">Ocurrió un error: ${e.message}</div>`; }
  if (id !== 'cotizaciones' || !arg) scrollTo(0, 0);
}

let listening = false;
function start() {
  if (!isLoggedIn()) return renderLogin();
  if (!listening) { addEventListener('hashchange', route); listening = true; }
  if (!location.hash) location.hash = '#/inicio';
  route();
}
start();
