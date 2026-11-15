// Menú y temporada: CRUD de platos/bebidas + QR de mesa descargable.
import * as DB from '../data.js';
import { h, $, toast, modal, confirmModal, money, fDate, toInputDate, fromInputDate, download, url, esc } from '../util.js';
import { icon, alergenoIcon, ALERGENOS } from '../icons.js';
import { glyph } from '../sellos.js';
import { qrSVG, qrPNG } from '../qr.js';
import { CATEGORIAS, ETIQUETAS } from './shared.js';

let el, menu, cat = 'todas';

export async function render(el0) {
  el = el0; menu = await DB.getMenu(); draw();
}

const thumb = d => h('div', { class: 'thumb' }, d.foto ? h('img', { src: d.foto.startsWith('data:') || d.foto.startsWith('http') ? d.foto : url(d.foto), alt: '', loading: 'lazy' }) : h('span', { html: glyph(d.glifo || 'brujula', { size: 28, stroke: 1.8 }) }));

function draw() {
  el.innerHTML = '';
  const mesaUrl = url('menu/?o=menu');
  const list = menu.filter(d => cat === 'todas' || d.categoria === cat || (cat === 'temporada' && DB.esTemporada(d)));
  el.append(
    h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Menú y temporada'), h('p', {}, `${menu.length} platos y bebidas · los cambios se ven al recargar la landing y /menu`)),
      h('button', { class: 'btn primary', onclick: () => edit(null) }, icon('plus', 18), 'Nuevo plato o bebida')),
    h('div', { class: 'grid', style: { gridTemplateColumns: 'minmax(0,1fr)' } },
      h('div', { class: 'card qr-card' }, h('h3', { style: { justifyContent: 'center' } }, 'QR de mesa'), h('div', { class: 'qrbox', html: qrSVG(mesaUrl, { dark: '#000', light: '#fff' }) }),
        h('p', { class: 'hint', style: { wordBreak: 'break-all' } }, mesaUrl),
        h('button', { class: 'btn', onclick: async () => download('qr-menu-nomada.png', await qrPNG(mesaUrl, { caption: 'Menú · Nómada' })) }, icon('download', 18), 'Descargar PNG para imprimir'))),
    h('div', { class: 'toolbar' }, h('div', { class: 'pill-row' }, ...[['todas', 'Todas'], ['temporada', 'Temporada'], ...CATEGORIAS].map(([id, l]) => h('button', { class: 'chip' + (cat === id ? ' on' : ''), onclick: () => { cat = id; draw(); } }, l)))),
    h('div', { class: 'card', style: { padding: '4px 14px' } }, h('div', { class: 'list' }, ...(list.length ? list.map(row) : [h('div', { class: 'empty-s' }, 'Sin elementos.')]))));
}

function row(d) {
  const temp = DB.esTemporada(d);
  return h('div', { class: 'li' }, thumb(d),
    h('div', { class: 'grow' }, h('b', {}, d.nombre), h('small', {}, `${CATEGORIAS.find(c => c[0] === d.categoria)?.[1]} · ${money(d.precio)}${d.precioBotella ? ' / botella ' + money(d.precioBotella) : ''}`),
      h('div', { class: 'pill-row', style: { marginTop: '4px' } }, temp ? h('span', { class: 'tag accent' }, 'Temporada hasta ' + fDate(d.temporadaHasta)) : null, d.etiquetas.filter(t => t !== 'temporada').slice(0, 3).map(t => h('span', { class: 'tag' }, ETIQUETAS.find(e => e[0] === t)?.[1] || t)))),
    h('label', { class: 'sw', title: 'Agotado hoy' }, h('span', { class: 'hint' }, 'Agotado'), h('input', { type: 'checkbox', checked: d.agotado, onchange: async e => { d.agotado = e.target.checked; await DB.saveDish(d); toast(d.agotado ? 'Marcado como agotado hoy' : 'Disponible de nuevo'); } })),
    h('button', { class: 'icon-btn', 'aria-label': 'Editar', onclick: () => edit(d) }, h('span', { html: icon('edit', 20) })),
    h('button', { class: 'icon-btn', 'aria-label': 'Eliminar', onclick: async () => { if (await confirmModal(`¿Eliminar “${d.nombre}”?`, { ok: 'Eliminar', danger: true })) { await DB.deleteDish(d.id); menu = await DB.getMenu(); draw(); toast('Eliminado'); } } }, h('span', { html: icon('trash', 20) })));
}

function edit(d0) {
  const d = d0 ? JSON.parse(JSON.stringify(d0)) : { nombre: '', categoria: cat !== 'todas' && cat !== 'temporada' ? cat : 'entradas', precio: '', precioBotella: null, descripcion: '', ingredientes: [], foto: null, etiquetas: [], alergenos: [], maridajes: [], agotado: false, temporadaHasta: null, glifo: 'brujula' };
  const chipSet = (arr, items, label) => h('div', { class: 'chips' }, ...items.map(([k, l]) => { const c = h('button', { type: 'button', class: 'chip' + (arr.includes(k) ? ' on' : ''), onclick: () => { const i = arr.indexOf(k); i >= 0 ? arr.splice(i, 1) : arr.push(k); c.classList.toggle('on'); if (label === 'et') $('#tmp-row').style.display = d.etiquetas.includes('temporada') ? '' : 'none'; } }, l); return c; }));
  const f = h('form', { class: 'stack', onsubmit: save, novalidate: true },
    h('div', { class: 'form-grid' },
      h('div', { class: 'field full' }, h('label', {}, 'Nombre'), h('input', { class: 'input', id: 'd-n', value: d.nombre, autofocus: true })),
      h('div', { class: 'field' }, h('label', {}, 'Categoría'), h('select', { class: 'select', id: 'd-c', onchange: e => { d.categoria = e.target.value; $('#bot').style.display = d.categoria === 'vinos' ? '' : 'none'; } }, ...CATEGORIAS.map(([k, l]) => h('option', { value: k, ...(k === d.categoria ? { selected: true } : {}) }, l)))),
      h('div', { class: 'field' }, h('label', {}, 'Precio ($)'), h('input', { class: 'input', id: 'd-p', inputmode: 'decimal', value: d.precio })),
      h('div', { class: 'field', id: 'bot', style: { display: d.categoria === 'vinos' ? '' : 'none' } }, h('label', {}, 'Precio botella ($)'), h('input', { class: 'input', id: 'd-b', inputmode: 'decimal', value: d.precioBotella ?? '' })),
      h('div', { class: 'field full' }, h('label', {}, 'Descripción'), h('textarea', { class: 'textarea', id: 'd-d' }, d.descripcion)),
      h('div', { class: 'field full' }, h('label', {}, 'Ingredientes protagonistas (separados por coma)'), h('input', { class: 'input', id: 'd-i', value: d.ingredientes.join(', ') })),
      h('div', { class: 'field full' }, h('label', {}, 'Foto'), h('div', { class: 'row gap' }, h('div', { class: 'thumb', id: 'd-prev' }, d.foto ? h('img', { src: d.foto.startsWith('data:') ? d.foto : url(d.foto) }) : null), h('input', { class: 'input', id: 'd-f', placeholder: 'assets/fotos/platos/mi-plato.jpg', value: d.foto && !d.foto.startsWith('data:') ? d.foto : '' }), h('label', { class: 'btn sm' }, 'Subir', h('input', { type: 'file', accept: 'image/*', style: { display: 'none' }, onchange: onFile })))),
      h('div', { class: 'field full' }, h('label', {}, 'Etiquetas'), chipSet(d.etiquetas, ETIQUETAS, 'et')),
      h('div', { class: 'field', id: 'tmp-row', style: { display: d.etiquetas.includes('temporada') ? '' : 'none' } }, h('label', {}, 'Disponible hasta'), h('input', { type: 'date', class: 'input', id: 'd-t', value: d.temporadaHasta ? toInputDate(d.temporadaHasta) : '' })),
      h('div', { class: 'field full' }, h('label', {}, 'Alérgenos'), h('div', { class: 'chips' }, ...Object.entries(ALERGENOS).map(([k, a]) => { const c = h('button', { type: 'button', class: 'chip' + (d.alergenos.includes(k) ? ' on' : ''), onclick: () => { const i = d.alergenos.indexOf(k); i >= 0 ? d.alergenos.splice(i, 1) : d.alergenos.push(k); c.classList.toggle('on'); } }, h('span', { html: alergenoIcon(k, 16) }), a.n); return c; }))),
      h('div', { class: 'field full' }, h('label', {}, 'Marida con…'), h('div', { class: 'chips', style: { maxHeight: '150px', overflow: 'auto' } }, ...menu.filter(x => x.id !== d.id && (['entradas', 'fuertes', 'postres'].includes(d.categoria) ? !['entradas', 'fuertes', 'postres'].includes(x.categoria) : ['entradas', 'fuertes', 'postres'].includes(x.categoria))).map(x => { const c = h('button', { type: 'button', class: 'chip' + (d.maridajes.includes(x.id) ? ' on' : ''), onclick: () => { const i = d.maridajes.indexOf(x.id); i >= 0 ? d.maridajes.splice(i, 1) : d.maridajes.push(x.id); c.classList.toggle('on'); } }, x.nombre); return c; }))),
      h('label', { class: 'sw' }, h('input', { type: 'checkbox', id: 'd-a', checked: d.agotado }), 'Agotado hoy')),
    h('div', { class: 'err', id: 'd-err' }), h('button', { class: 'btn primary block', type: 'submit' }, 'Guardar'));
  const mm = modal(f, { title: d0 ? 'Editar' : 'Nuevo plato o bebida', cls: 'wide' });
  mm.el.style.width = 'min(720px,100%)';

  function onFile(e) {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => { const s = Math.min(1, 900 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); d.foto = c.toDataURL('image/jpeg', .78); $('#d-f').value = ''; $('#d-prev').innerHTML = `<img src="${d.foto}">`; }; img.src = r.result; };
    r.readAsDataURL(file);
  }
  async function save(e) {
    e.preventDefault();
    const nombre = $('#d-n').value.trim(), precio = parseFloat($('#d-p').value.replace(',', '.'));
    if (!nombre || isNaN(precio)) { $('#d-err').textContent = 'Nombre y precio son obligatorios.'; return; }
    d.nombre = nombre; d.precio = precio; d.categoria = $('#d-c').value; d.descripcion = $('#d-d').value.trim();
    d.ingredientes = $('#d-i').value.split(',').map(s => s.trim()).filter(Boolean);
    const pb = parseFloat($('#d-b').value.replace(',', '.')); d.precioBotella = d.categoria === 'vinos' && !isNaN(pb) ? pb : null;
    const path = $('#d-f').value.trim(); if (path) d.foto = path; else if (!d.foto?.startsWith('data:')) d.foto = null;
    d.agotado = $('#d-a').checked;
    d.temporadaHasta = d.etiquetas.includes('temporada') && $('#d-t').value ? new Date(fromInputDate($('#d-t').value).setHours(23, 59, 59)).toISOString() : (d.etiquetas.includes('temporada') ? d.temporadaHasta : null);
    await DB.saveDish(d); mm.close(); menu = await DB.getMenu(); draw(); toast('Guardado');
  }
}
