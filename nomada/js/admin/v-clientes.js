// CRM: tabla con filtros, segmentos con acciones por WhatsApp y exportación CSV, ficha del cliente.
import * as DB from '../data.js';
import { h, $, toast, download, toCSV, fDate, fDateTime, money, phonePretty, waLink, phoneEC, norm, MESES, esc, debounce } from '../util.js';
import { icon } from '../icons.js';
import { nivelTag, cumpleTxt, fillTpl, ORIGENES, BEBIDAS } from './shared.js';

let C, el, all = [], segs = [], cfg, F, sort = { k: 'ultima', d: -1 }, shown = 60;

export async function render(el0, ctx, param) {
  C = ctx; el = el0;
  cfg = await DB.getConfig();
  if (param) return renderFicha(param);
  F = { q: '', nivel: '', ultima: '', gastoMin: '', freq: '', cumpleMes: false, bebida: '', origen: '', seg: '' };
  [all, segs] = await Promise.all([DB.getMembers(), DB.getSegments()]);
  shown = 60;
  draw();
}

// ---------------------------------------------------------------- lista
function filtered() {
  const segIds = F.seg ? new Set(segs.find(s => s.id === F.seg).miembros.map(m => m.id)) : null;
  const mes = new Date().getMonth() + 1, q = norm(F.q);
  let r = all.filter(m =>
    (!segIds || segIds.has(m.id)) &&
    (!q || norm(m.nombre).includes(q) || m.telefono.includes(q.replace(/\D/g, '') || '§') || m.id.toLowerCase().includes(q)) &&
    (!F.nivel || m.nivelId === F.nivel) &&
    (!F.bebida || m.bebida === F.bebida) && (!F.origen || m.origen === F.origen) &&
    (!F.gastoMin || m.gasto >= +F.gastoMin) &&
    (!F.cumpleMes || m.cumple.mes === mes) &&
    (!F.ultima || (F.ultima === '7' ? m.diasSin != null && m.diasSin <= 7 : F.ultima === '30' ? m.diasSin != null && m.diasSin <= 30 : F.ultima === '45' ? m.diasSin != null && m.diasSin > 45 : m.visitas === 0)) &&
    (!F.freq || (m.frecuencia != null && (F.freq === 'a' ? m.frecuencia <= 14 : F.freq === 'b' ? m.frecuencia > 14 && m.frecuencia <= 30 : m.frecuencia > 30))));
  const g = { nombre: m => m.nombre, visitas: m => m.visitas, gasto: m => m.gasto, ultima: m => m.ultima || '', frecuencia: m => m.frecuencia ?? 9999 };
  r.sort((a, b) => { const x = g[sort.k](a), y = g[sort.k](b); return (x > y ? 1 : x < y ? -1 : 0) * sort.d; });
  return r;
}

function draw() {
  el.innerHTML = '';
  const sel = (id, opts, val, cb) => h('select', { class: 'select', 'aria-label': id, onchange: e => cb(e.target.value) }, ...opts.map(([v, l]) => h('option', { value: v, ...(v === val ? { selected: true } : {}) }, l)));
  el.append(...[
    h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Clientes'), h('p', {}, `${all.length} miembros del pasaporte`))),
    h('div', { class: 'seg-cards' }, ...segs.map(s => h('button', { class: 'seg-card' + (F.seg === s.id ? ' on' : ''), onclick: () => { F.seg = F.seg === s.id ? '' : s.id; shown = 60; draw(); } }, h('b', {}, s.total), h('span', {}, s.label), h('small', {}, s.desc)))),
    F.seg ? segmentPanel(segs.find(s => s.id === F.seg)) : null,
    h('div', { class: 'toolbar' },
      h('input', { class: 'input grow', placeholder: 'Buscar nombre, teléfono o código', value: F.q, oninput: debounce(e => { F.q = e.target.value; shown = 60; drawTable(); }, 160), 'aria-label': 'Buscar' }),
      sel('Nivel', [['', 'Todos los niveles'], ...cfg.niveles.map(n => [n.id, n.nombre])], F.nivel, v => { F.nivel = v; drawTable(); }),
      sel('Última visita', [['', 'Cualquier última visita'], ['7', 'Últimos 7 días'], ['30', 'Últimos 30 días'], ['45', 'Más de 45 días'], ['n', 'Sin visitas']], F.ultima, v => { F.ultima = v; drawTable(); }),
      sel('Frecuencia', [['', 'Cualquier frecuencia'], ['a', 'Cada ≤ 14 días'], ['b', 'Cada 15–30 días'], ['c', 'Cada > 30 días']], F.freq, v => { F.freq = v; drawTable(); }),
      sel('Preferencia', [['', 'Toda preferencia'], ...Object.entries(BEBIDAS)], F.bebida, v => { F.bebida = v; drawTable(); }),
      sel('Origen', [['', 'Todo origen'], ...Object.entries(ORIGENES)], F.origen, v => { F.origen = v; drawTable(); }),
      h('input', { class: 'input', style: { maxWidth: '130px' }, inputmode: 'numeric', placeholder: 'Gasto ≥ $', value: F.gastoMin, oninput: debounce(e => { F.gastoMin = e.target.value; drawTable(); }, 200), 'aria-label': 'Gasto mínimo' }),
      h('label', { class: 'chip' + (F.cumpleMes ? ' on' : ''), style: { cursor: 'pointer' }, onclick: e => { F.cumpleMes = !F.cumpleMes; e.currentTarget.classList.toggle('on', F.cumpleMes); drawTable(); } }, icon('cake', 16), 'Cumple este mes')),
    h('div', { id: 'tbl' })].filter(Boolean));
  drawTable();
}

function drawTable() {
  const r = filtered(), box = $('#tbl'); box.innerHTML = '';
  const th = (k, label, cls = '') => h('th', { class: 'sort ' + cls, onclick: () => { sort = { k, d: sort.k === k ? -sort.d : -1 }; drawTable(); } }, label + (sort.k === k ? (sort.d > 0 ? ' ↑' : ' ↓') : ''));
  const rows = r.slice(0, shown).map(m => h('tr', { class: 'click', onclick: () => C.go('clientes/' + m.id) },
    h('td', {}, h('div', { class: 'name-cell' }, h('b', {}, m.nombre), h('small', {}, phonePretty(m.telefono)))),
    h('td', {}, nivelTag(m)), h('td', { class: 'num' }, m.visitas), h('td', { class: 'num' }, money(Math.round(m.gasto))),
    h('td', {}, m.ultima ? `${fDate(m.ultima)} · ${m.diasSin} d` : '—'), h('td', { class: 'num' }, m.frecuencia != null ? Math.round(m.frecuencia) + ' d' : '—'),
    h('td', {}, cumpleTxt(m)), h('td', {}, ORIGENES[m.origen] || m.origen)));
  box.append(h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('thead', {}, h('tr', {}, th('nombre', 'Cliente'), h('th', {}, 'Nivel'), th('visitas', 'Visitas', 'num'), th('gasto', 'Gasto', 'num'), th('ultima', 'Última visita'), th('frecuencia', 'Frecuencia', 'num'), h('th', {}, 'Cumple'), h('th', {}, 'Origen'))),
    h('tbody', {}, ...(rows.length ? rows : [h('tr', {}, h('td', { colspan: 8 }, h('div', { class: 'empty-s' }, 'Sin clientes con esos filtros.')))])))),
    h('div', { class: 'row between', style: { marginTop: '10px' } }, h('span', { class: 'muted' }, `${Math.min(shown, r.length)} de ${r.length}`), r.length > shown ? h('button', { class: 'btn sm', onclick: () => { shown += 60; drawTable(); } }, 'Ver más') : null));
}

function segmentPanel(s) {
  const tpl = cfg.plantillas[s.plantilla] || '';
  const ta = h('textarea', { class: 'textarea', id: 'tpl', rows: 3 }, tpl); ta.value = tpl;
  const list = h('div', { class: 'list send-list' });
  const fill = () => {
    list.innerHTML = '';
    s.miembros.slice(0, 40).forEach(m => {
      const ok = m.consent.novedades;
      list.append(h('div', { class: 'li' }, h('div', { class: 'grow' }, h('b', {}, m.nombre), h('small', {}, `${phonePretty(m.telefono)} · ${m.nivelNombre}${s.id === 'cumple' ? ' · en ' + m.diasCumple + ' d' : m.diasSin != null ? ' · ' + m.diasSin + ' d sin venir' : ''}`)),
        ok ? h('a', { class: 'btn sm primary', target: '_blank', rel: 'noopener', onclick: e => { e.currentTarget.href = waLink(phoneEC(m.telefono), fillTpl(ta.value, m)); } }, icon('wa', 16), 'Enviar')
          : h('span', { class: 'tag' }, 'Sin consentimiento')));
    });
    if (s.miembros.length > 40) list.append(h('div', { class: 'hint', style: { paddingTop: '10px' } }, `Mostrando 40 de ${s.miembros.length}. Exporta el CSV para el resto.`));
    if (!s.miembros.length) list.append(h('div', { class: 'empty-s' }, 'Nadie en este segmento por ahora.'));
  };
  fill();
  return h('div', { class: 'card msg-box' },
    h('h3', {}, `Acciones · ${s.label}`, h('span', { class: 'tag ok' }, `${s.conConsentimiento} de ${s.total} aceptan novedades`)),
    h('div', { class: 'field' }, h('label', { for: 'tpl' }, 'Mensaje (usa [nombre])'), ta),
    h('div', { class: 'row gap wrap' },
      h('button', { class: 'btn sm', onclick: async () => { await DB.saveConfig({ plantillas: { [s.plantilla]: ta.value } }); cfg = await DB.getConfig(); toast('Plantilla guardada'); } }, 'Guardar plantilla'),
      h('button', { class: 'btn sm', onclick: async () => { const rows = await DB.exportSegmentCSV(s.id); download(`nomada-${s.id}-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows), 'text/csv;charset=utf-8'); } }, icon('download', 16), 'Exportar CSV')),
    h('p', { class: 'hint' }, 'Los mensajes se envían uno por uno desde WhatsApp y solo a quienes aceptaron recibir novedades.'), list);
}

// ---------------------------------------------------------------- ficha
async function renderFicha(id) {
  const [m, menu] = await Promise.all([DB.getMember(id), DB.getMenu()]);
  segs = await DB.getSegments();
  el.innerHTML = '';
  if (!m) { el.append(h('div', { class: 'card' }, 'No se encontró el cliente.')); return; }
  const fav = menu.find(x => x.id === m.fav);
  const dato = (k, v) => h('div', { class: 'fact' }, h('small', {}, k), h('b', { style: { fontWeight: 500, fontSize: '15px' } }, v || '—'));
  const tagsBox = h('div', { class: 'pill-row' });
  const drawTags = () => { tagsBox.innerHTML = ''; (m.tags || []).forEach(t => tagsBox.append(h('span', { class: 'tag accent' }, t, h('button', { 'aria-label': 'Quitar', style: { marginLeft: '4px' }, onclick: async () => { m.tags = m.tags.filter(x => x !== t); await DB.updateMember(id, { tags: m.tags }); drawTags(); } }, '×')))); };
  drawTags();
  const notaIn = h('input', { class: 'input', placeholder: 'Ej. prefiere mesa junto a la ventana', id: 'nota' });
  const notas = h('div', { class: 'list' });
  const drawNotas = () => { notas.innerHTML = ''; (m.notas || []).forEach(n => notas.append(h('div', { class: 'li' }, h('div', { class: 'grow' }, n.txt, h('small', {}, `${n.by} · ${fDate(n.ts)}`))))); if (!(m.notas || []).length) notas.append(h('div', { class: 'hint' }, 'Sin notas todavía.')); };
  drawNotas();

  el.append(
    h('a', { class: 'back', href: '#/clientes' }, icon('arrowL', 16), 'Clientes'),
    h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, m.nombre), h('div', { class: 'pill-row', style: { marginTop: '8px' } }, nivelTag(m), h('span', { class: 'tag' }, m.id), ...segTags(m))),
      h('a', { class: 'btn primary', target: '_blank', rel: 'noopener', href: waLink(phoneEC(m.telefono)) }, icon('wa', 18), 'WhatsApp')),
    h('div', { class: 'kpis', style: { gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' } },
      kpi('Visitas', m.visitas), kpi('Sellos', m.sellos), kpi('Gasto total', money(Math.round(m.gasto))), kpi('Ticket promedio', money(Math.round(m.ticket))), kpi('Frecuencia', m.frecuencia != null ? Math.round(m.frecuencia) + ' d' : '—'), kpi('Última visita', m.ultima ? `hace ${m.diasSin} d` : '—')),
    h('div', { class: 'grid g2' },
      h('div', { class: 'card' }, h('h3', {}, 'Datos'), h('div', { class: 'facts' },
        dato('WhatsApp', phonePretty(m.telefono)), dato('Cumpleaños', cumpleTxt(m)), dato('Bebida', BEBIDAS[m.bebida]), dato('Plato favorito', fav?.nombre), dato('Alergias', m.alergias?.join(', ') || 'Ninguna'),
        dato('Origen', ORIGENES[m.origen]), dato('Miembro desde', fDate(m.alta, { year: true })), dato('Acepta datos', m.consent.datos ? 'Sí' : 'No'), dato('Acepta novedades', m.consent.novedades ? 'Sí' : 'No'))),
      h('div', { class: 'card stack' }, h('h3', {}, 'Notas y etiquetas'), tagsBox,
        h('div', { class: 'row gap' }, h('input', { class: 'input', id: 'tag', placeholder: 'Nueva etiqueta', style: { minHeight: '42px' } }), h('button', { class: 'btn sm', onclick: async () => { const v = $('#tag').value.trim(); if (!v) return; m.tags = [...new Set([...(m.tags || []), v])]; await DB.updateMember(id, { tags: m.tags }); $('#tag').value = ''; drawTags(); } }, 'Añadir')),
        notas, h('div', { class: 'row gap' }, notaIn, h('button', { class: 'btn sm primary', onclick: async () => { const v = notaIn.value.trim(); if (!v) return; await DB.addNote(id, v, C.session.nombre); m.notas = [{ ts: new Date().toISOString(), by: C.session.nombre, txt: v }, ...(m.notas || [])]; notaIn.value = ''; drawNotas(); } }, 'Guardar')))),
    h('div', { class: 'grid g2' },
      h('div', { class: 'card' }, h('h3', {}, 'Historial de visitas'), m.historial.length ? h('div', { class: 'tbl-wrap', style: { border: 0 } }, h('table', { class: 'tbl', style: { minWidth: 0 } }, h('thead', {}, h('tr', {}, h('th', {}, 'Fecha'), h('th', { class: 'num' }, 'Monto'), h('th', { class: 'num' }, 'Pers.'), h('th', {}, 'Registró'))),
        h('tbody', {}, ...m.historial.map(v => h('tr', {}, h('td', {}, fDateTime(v.ts), v.eventId ? h('span', { class: 'tag', style: { marginLeft: '6px' } }, 'Evento') : v.regalo ? h('span', { class: 'tag accent', style: { marginLeft: '6px' } }, 'Regalo') : null), h('td', { class: 'num' }, v.regalo ? '—' : money(Math.round(v.monto))), h('td', { class: 'num' }, v.personas || '—'), h('td', {}, v.by)))))) : h('div', { class: 'empty-s' }, 'Sin visitas.')),
      h('div', { class: 'stack' },
        h('div', { class: 'card' }, h('h3', {}, 'Premios'), m.premios.length ? h('div', { class: 'list' }, ...m.premios.map(r => h('div', { class: 'li' }, h('div', { class: 'grow' }, h('b', {}, r.nombre), h('small', {}, r.estado === 'canjeado' ? `Canjeado ${fDate(r.canjeadoTs)} · ${r.canjeadoPor}` : `Disponible · código ${r.codigo}`)), h('span', { class: 'tag ' + (r.estado === 'canjeado' ? '' : 'ok') }, r.estado === 'canjeado' ? 'Canjeado' : 'Disponible')))) : h('div', { class: 'empty-s' }, 'Aún sin premios.')),
        h('div', { class: 'card' }, h('h3', {}, 'Eventos'), m.eventos.length ? h('div', { class: 'list' }, ...m.eventos.map(e => h('div', { class: 'li' }, h('div', { class: 'grow' }, h('b', {}, e.titulo), h('small', {}, fDate(e.fecha, { year: true }))), h('span', { class: 'tag ' + (e.asistio ? 'ok' : '') }, e.asistio ? 'Asistió' : 'Reservó')))) : h('div', { class: 'empty-s' }, 'Sin eventos.')))));
}
const kpi = (k, v) => h('div', { class: 'kpi' }, h('span', { class: 'k' }, k), h('span', { class: 'v' }, String(v)));
function segTags(m) { const o = []; segs.forEach(s => { if (s.miembros.some(x => x.id === m.id)) o.push(h('span', { class: 'tag warn' }, s.label)); }); return o; }
