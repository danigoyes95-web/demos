// Eventos: crear/editar, cupos, preventa para miembros y lista de asistentes (suma sello al marcar).
import * as DB from '../data.js';
import { h, $, toast, modal, confirmModal, money, fDate, fDateLong, fTime, phonePretty, url, debounce } from '../util.js';
import { icon } from '../icons.js';

let el, C, events;
const toLocal = iso => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const imgSrc = s => !s ? '' : (s.startsWith('data:') || s.startsWith('http') ? s : url(s));

export async function render(el0, ctx) { el = el0; C = ctx; events = await DB.getEvents(); draw(); }

function draw() {
  el.innerHTML = '';
  const up = events.filter(e => !e.pasado), past = events.filter(e => e.pasado).reverse();
  el.append(h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Eventos'), h('p', {}, 'Cupos limitados, preventa para miembros y asistencia.')), h('button', { class: 'btn primary', onclick: () => edit(null) }, icon('plus', 18), 'Nuevo evento')),
    h('h2', {}, 'Próximos'), h('div', { class: 'grid g2' }, ...(up.length ? up.map(card) : [h('div', { class: 'empty-s' }, 'No hay eventos próximos.')])),
    h('h2', {}, 'Pasados'), h('div', { class: 'grid g2' }, ...past.map(card)));
}

function card(e) {
  const pct = Math.round(e.reservados / e.cupos * 100);
  return h('div', { class: 'card event-card' },
    h('div', { class: 'row gap' }, e.img ? h('img', { class: 'thumb', src: imgSrc(e.img), alt: '', style: { width: '72px', height: '72px' } }) : null,
      h('div', { class: 'grow', style: { flex: 1 } }, h('h3', { style: { fontSize: '22px' } }, e.titulo), h('div', { class: 'meta' }, `${fDateLong(e.fecha)} · ${fTime(e.fecha)} · ${e.colab}`))),
    h('div', { class: 'pill-row' }, h('span', { class: 'tag' }, money(e.precio)), e.preventa && !e.pasado ? h('span', { class: 'tag accent' }, 'Preventa miembros hasta ' + fDate(e.preventaHasta)) : null, e.pasado ? h('span', { class: 'tag' }, `Asistieron ${e.asistieron}`) : null),
    h('div', {}, h('div', { class: 'row between' }, h('span', { class: 'muted' }, `${e.reservados} de ${e.cupos} cupos`), h('b', {}, e.restantes ? `${e.restantes} libres` : 'Agotado')), h('div', { class: 'bars', style: { marginTop: '6px' } }, h('div', { class: 'b', style: { height: '8px', borderRadius: '99px', background: 'var(--bg-4)', overflow: 'hidden' } }, h('i', { style: { display: 'block', height: '100%', width: pct + '%', background: 'var(--accent)' } })))),
    h('div', { class: 'row gap wrap' }, h('button', { class: 'btn sm primary', onclick: () => attendees(e.id) }, icon('users', 16), 'Asistentes'), h('button', { class: 'btn sm', onclick: () => edit(e) }, icon('edit', 16), 'Editar'),
      h('button', { class: 'btn sm ghost', onclick: async () => { if (await confirmModal(`¿Eliminar “${e.titulo}”?`, { ok: 'Eliminar', danger: true })) { await DB.deleteEvent(e.id); events = await DB.getEvents(); draw(); } } }, icon('trash', 16))));
}

function edit(e0) {
  const e = e0 || { titulo: '', colab: '', desc: '', precio: '', cupos: 20, fecha: new Date(Date.now() + 14 * 864e5).toISOString(), img: '', preventa: false, preventaHasta: null };
  let imgData = null;
  const f = h('form', { class: 'stack', novalidate: true },
    h('div', { class: 'form-grid' },
      h('div', { class: 'field full' }, h('label', {}, 'Título'), h('input', { class: 'input', id: 'e-t', value: e.titulo, autofocus: true })),
      h('div', { class: 'field' }, h('label', {}, 'Colaborador'), h('input', { class: 'input', id: 'e-c', value: e.colab })),
      h('div', { class: 'field' }, h('label', {}, 'Fecha y hora'), h('input', { type: 'datetime-local', class: 'input', id: 'e-f', value: toLocal(e.fecha) })),
      h('div', { class: 'field' }, h('label', {}, 'Precio por persona ($)'), h('input', { class: 'input', id: 'e-p', inputmode: 'decimal', value: e.precio })),
      h('div', { class: 'field' }, h('label', {}, 'Cupos'), h('input', { class: 'input', id: 'e-k', inputmode: 'numeric', value: e.cupos })),
      h('div', { class: 'field full' }, h('label', {}, 'Descripción'), h('textarea', { class: 'textarea', id: 'e-d' }, e.desc)),
      h('div', { class: 'field full' }, h('label', {}, 'Imagen'), h('div', { class: 'row gap' }, h('input', { class: 'input', id: 'e-i', placeholder: 'assets/fotos/eventos/mi-evento.jpg', value: e.img && !e.img.startsWith('data:') ? e.img : '' }), h('label', { class: 'btn sm' }, 'Subir', h('input', { type: 'file', accept: 'image/*', style: { display: 'none' }, onchange: ev => { const file = ev.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => { const s = Math.min(1, 1000 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); imgData = c.toDataURL('image/jpeg', .78); $('#e-i').value = ''; toast('Imagen cargada'); }; img.src = r.result; }; r.readAsDataURL(file); } })))),
      h('label', { class: 'sw' }, h('input', { type: 'checkbox', id: 'e-pv', checked: e.preventa, onchange: ev => { $('#pv-row').style.display = ev.target.checked ? '' : 'none'; } }), 'Preventa para miembros'),
      h('div', { class: 'field', id: 'pv-row', style: { display: e.preventa ? '' : 'none' } }, h('label', {}, 'Preventa hasta'), h('input', { type: 'date', class: 'input', id: 'e-ph', value: e.preventaHasta ? toLocal(e.preventaHasta).slice(0, 10) : '' }))),
    h('div', { class: 'err', id: 'e-err' }), h('button', { class: 'btn primary block', type: 'submit' }, 'Guardar evento'));
  const mm = modal(f, { title: e0 ? 'Editar evento' : 'Nuevo evento' }); mm.el.style.width = 'min(680px,100%)';
  f.onsubmit = async ev => {
    ev.preventDefault();
    const titulo = $('#e-t').value.trim(), precio = parseFloat($('#e-p').value.replace(',', '.')), cupos = parseInt($('#e-k').value, 10);
    if (!titulo || isNaN(precio) || !(cupos > 0) || !$('#e-f').value) { $('#e-err').textContent = 'Completa título, fecha, precio y cupos.'; return; }
    const pv = $('#e-pv').checked;
    await DB.saveEvent({ ...(e0 ? { id: e0.id } : {}), titulo, colab: $('#e-c').value.trim(), desc: $('#e-d').value.trim(), precio, cupos, fecha: new Date($('#e-f').value).toISOString(),
      img: imgData || $('#e-i').value.trim() || e.img, preventa: pv, preventaHasta: pv && $('#e-ph').value ? new Date($('#e-ph').value + 'T23:59:59').toISOString() : null });
    mm.close(); events = await DB.getEvents(); draw(); toast('Evento guardado');
  };
}

async function attendees(id) {
  const body = h('div', { class: 'stack' });
  const mm = modal(body, { title: 'Asistentes' }); mm.el.style.width = 'min(640px,100%)';
  const members = new Map((await DB.getMembers()).map(m => [m.id, m]));
  const paint = async () => {
    events = await DB.getEvents(); const ev = events.find(x => x.id === id);
    const raw = (await DB.getEvents()).find(x => x.id === id);
    body.innerHTML = '';
    const q = h('input', { class: 'input', placeholder: 'Agregar reserva: busca por nombre o teléfono', style: { minHeight: '46px' } });
    const res = h('div', { class: 'res' });
    q.oninput = debounce(async () => { res.innerHTML = ''; if (!q.value.trim()) return; (await DB.findMember(q.value)).slice(0, 5).forEach(m => res.append(h('button', { type: 'button', onclick: async () => { const r = await DB.addReservation(id, m.id); toast(r.error === 'sin-cupos' ? 'No quedan cupos' : r.error ? 'Ya está en la lista' : 'Reserva agregada'); paint(); } }, h('span', { style: { flex: 1 } }, m.nombre), h('span', { class: 'muted' }, phonePretty(m.telefono)), icon('plus', 16)))); }, 160);
    body.append(h('div', {}, h('b', {}, ev.titulo), h('div', { class: 'muted' }, `${ev.reservados}/${ev.cupos} reservas · ${ev.asistieron} asistieron · marcar “Asistió” suma visita y sello`)), q, res);
    const full = await detail(id);
    body.append(h('div', { class: 'list' }, ...(full.length ? full.map(r => { const m = members.get(r.memberId); return h('div', { class: 'li' }, h('div', { class: 'grow' }, h('b', {}, m?.nombre || r.memberId), h('small', {}, m ? `${phonePretty(m.telefono)} · ${m.nivelNombre}` : '')),
      h('label', { class: 'sw' }, h('span', { class: 'hint' }, 'Asistió'), h('input', { type: 'checkbox', checked: r.asistio, onchange: async e => { const x = await DB.markAttendance(id, r.memberId, e.target.checked, C.session.nombre); if (x.nuevosPremios?.length) toast('Premio desbloqueado para ' + m.nombre); paint(); } })),
      h('button', { class: 'icon-btn', 'aria-label': 'Quitar', onclick: async () => { await DB.removeReservation(id, r.memberId); paint(); } }, h('span', { html: icon('close', 18) }))); }) : [h('div', { class: 'empty-s' }, 'Aún no hay reservas.')])));
  };
  paint();
}
// Lista de reservas del evento (getEvents ya trae `reservas`)
async function detail(id) { return (await DB.getEvents()).find(e => e.id === id).reservas; }
