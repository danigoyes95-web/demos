// Menú digital: pestañas por categoría, etiquetas, alérgenos, maridajes y estado "Agotado hoy".
import * as DB from './data.js';
import { h, $, url, money, fDate, registerSW } from './util.js';
import { icon, alergenoIcon, ALERGENOS } from './icons.js';
import { wordmark } from './sellos.js';

registerSW();
if (new URLSearchParams(location.search).get('o')) sessionStorage.setItem('nomada.origen', new URLSearchParams(location.search).get('o'));
$('#m-brand').innerHTML = wordmark(); $('#m-back').innerHTML = icon('arrowL', 22);

const TABS = [['temporada', 'Temporada'], ['entradas', 'Entradas'], ['fuertes', 'Fuertes'], ['postres', 'Postres'], ['cocteleria', 'Coctelería'], ['cervezas', 'Cervezas'], ['vinos', 'Vinos'], ['sinalcohol', 'Sin alcohol']];
const ETQ = { temporada: 'De temporada', chef: 'Recomendado del chef', recomendado: 'Recomendado', picante: 'Picante', vegetariano: 'Vegetariano', singluten: 'Sin gluten' };
const FILTROS = [['vegetariano', 'Vegetariano'], ['singluten', 'Sin gluten'], ['picante', 'Picante'], ['chef', 'Del chef']];
const src = p => !p ? '' : (p.startsWith('data:') || p.startsWith('http') ? p : url(p));

let menu = [], cfg, tab = (location.hash.slice(1) || 'temporada'), filtro = null;
if (!TABS.some(t => t[0] === tab)) tab = 'temporada';

async function init() {
  [cfg, menu] = await Promise.all([DB.getConfig(), DB.getMenu()]);
  $('#m-res').href = `https://wa.me/${cfg.restaurante.whatsapp}?text=${encodeURIComponent('Hola Nómada, quiero reservar una mesa.')}`;
  $('#m-banner').append(h('a', { class: 'm-pp', href: url('pasaporte/?o=menu') }, h('span', { html: icon('stamp', 24) }), h('span', {}, h('b', {}, '¿Tienes tu Pasaporte Nómada?'), ' Pide al mesero que selle tu visita.'), h('em', {}, 'Mi pasaporte →')));
  $('#m-legend').append(...Object.entries(ALERGENOS).map(([k, a]) => h('span', { html: alergenoIcon(k, 16) + a.n })), h('div', { class: 'm-note' }, 'Si tienes alguna alergia o restricción, avísale a tu mesero. Precios en USD. Menú de demostración: precios y platos provisionales.'));
  drawTabs(); draw();
  DB.trackEvent('menu_view');
}

function drawTabs() {
  const t = $('#m-tabs'); t.innerHTML = '';
  TABS.forEach(([id, l]) => t.append(h('button', { class: 'm-tab' + (id === tab ? ' on' : ''), role: 'tab', 'aria-selected': id === tab, onclick: () => go(id) }, l)));
  t.querySelector('.on')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
}
function go(id, hl) { tab = id; filtro = null; history.replaceState(null, '', '#' + id); drawTabs(); draw(hl); if (!hl) window.scrollTo({ top: 0, behavior: 'smooth' }); }

function draw(hl) {
  const f = $('#m-filters'); f.innerHTML = '';
  FILTROS.forEach(([k, l]) => f.append(h('button', { class: 'chip' + (filtro === k ? ' on' : ''), onclick: () => { filtro = filtro === k ? null : k; draw(); } }, l)));
  let items = menu.filter(d => tab === 'temporada' ? DB.esTemporada(d) : d.categoria === tab);
  if (filtro) items = items.filter(d => d.etiquetas.includes(filtro));
  const box = $('#m-list'); box.innerHTML = '';
  if (tab === 'temporada') box.append(h('p', { class: 'm-sec-lead' }, 'Mientras dure el ingrediente. Cuando se acaba, se acaba.'));
  if (!items.length) box.append(h('div', { class: 'm-empty' }, 'No hay platos con ese filtro en esta sección.'));
  items.forEach(d => box.append(dish(d)));
  if (hl) { const el = document.getElementById('d-' + hl); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('hl'); setTimeout(() => el.classList.remove('hl'), 2400); } }
}

function dish(d) {
  const pares = d.maridajes.map(id => menu.find(x => x.id === id)).filter(Boolean);
  const esFood = ['entradas', 'fuertes', 'postres'].includes(d.categoria);
  const precio = d.categoria === 'vinos' ? h('div', { class: 'm-price' }, money(d.precio), h('small', {}, `copa · botella ${money(d.precioBotella)}`)) : h('div', { class: 'm-price' }, money(d.precio));
  return h('article', { class: 'm-dish' + (d.foto ? ' has-img' : '') + (d.agotado ? ' out' : ''), id: 'd-' + d.id },
    h('div', {}, h('div', { class: 'm-head' }, h('h3', { class: 'm-name' }, d.nombre), precio),
      h('p', { class: 'm-desc' }, d.descripcion),
      h('div', { class: 'm-tags' }, ...d.etiquetas.map(t => h('span', { class: 'tag' + (t === 'temporada' ? ' accent' : t === 'chef' ? ' accent' : '') }, t === 'temporada' && d.temporadaHasta ? 'Temporada · hasta ' + fDate(d.temporadaHasta) : ETQ[t] || t)),
        d.alergenos.length ? h('span', { class: 'm-alg', html: d.alergenos.map(a => alergenoIcon(a, 18)).join('') }) : null),
      pares.length ? h('div', { class: 'm-pair' }, h('b', {}, 'Marida con'), ...pares.slice(0, 3).map(p => h('button', { onclick: () => go(DB.esTemporada(p) && tab === 'temporada' ? 'temporada' : p.categoria, p.id) }, p.nombre))) : null),
    d.foto ? h('div', { class: 'img' }, h('img', { src: src(d.foto), alt: d.nombre, loading: 'lazy' })) : null,
    d.agotado ? h('span', { class: 'm-out' }, 'Agotado hoy') : null);
}

init();
