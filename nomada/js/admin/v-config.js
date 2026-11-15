// Configuración general: contacto, horario, redes, textos de la landing y reinicio de la demo.
import * as DB from '../data.js';
import { h, $, toast, confirmModal } from '../util.js';
import { icon } from '../icons.js';

export async function render(el) {
  const c = await DB.getConfig(); const r = c.restaurante, t = c.textos;
  const f = (id, label, v, extra = {}, full = false) => h('div', { class: 'field' + (full ? ' full' : '') }, h('label', { for: id }, label), extra.area ? h('textarea', { class: 'textarea', id, rows: extra.rows || 3 }, v) : h('input', { class: 'input', id, value: v ?? '', ...extra }));
  el.innerHTML = '';
  el.append(h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Ajustes'), h('p', {}, 'Todo el contenido público se lee de aquí. Recarga la landing para ver los cambios.'))),
    h('div', { class: 'grid g2' },
      h('div', { class: 'card' }, h('h3', {}, 'Contacto y ubicación'), h('div', { class: 'form-grid' },
        f('r-wa', 'WhatsApp de reservas (con 593, solo dígitos)', r.whatsapp, { inputmode: 'numeric' }, true), f('r-dir', 'Dirección', r.direccion, {}, true), f('r-hor', 'Horario', r.horario, {}, true), f('r-ig', 'Instagram (usuario)', r.instagram), f('r-igu', 'URL de Instagram', r.instagramUrl), f('r-map', 'Enlace de Google Maps', r.mapsUrl, {}, true))),
      h('div', { class: 'card' }, h('h3', {}, 'Textos de la landing'), h('div', { class: 'form-grid' },
        h('div', { class: 'field full' }, h('label', { for: 't-fr' }, 'Frase de marca (hero)'), h('select', { class: 'select', id: 't-fr' }, ...t.fraseOpciones.map((x, i) => h('option', { value: i, ...(i === t.fraseIndex ? { selected: true } : {}) }, x)))),
        f('t-sub', 'Subtítulo del hero', t.heroSub, { area: true, rows: 2 }, true), f('t-f1', 'Filosofía · párrafo 1', t.filosofia[0], { area: true }, true), f('t-f2', 'Filosofía · párrafo 2', t.filosofia[1], { area: true }, true), f('t-pp', 'Texto del Pasaporte', t.pasaporteTexto, { area: true, rows: 2 }, true), f('t-rs', 'Texto de reservas', t.reservasTexto, {}, true)))),
    h('div', { class: 'row between wrap gap' },
      h('div', { class: 'card', style: { flex: 1, minWidth: '260px' } }, h('h3', {}, 'Demo'), h('p', { class: 'muted', style: { marginBottom: '12px' } }, 'Restaura los datos de ejemplo (180 miembros, menú, eventos). Borra lo que hayas registrado en este navegador.'), h('button', { class: 'btn danger', onclick: reset }, icon('refresh', 18), 'Reiniciar demo')),
      h('button', { class: 'btn primary lg', onclick: save }, icon('check', 20), 'Guardar ajustes')));

  async function save() {
    const g = id => $('#' + id).value.trim();
    const wa = g('r-wa').replace(/\D/g, '');
    if (wa.length < 10) return toast('Revisa el número de WhatsApp');
    await DB.saveConfig({ restaurante: { whatsapp: wa, direccion: g('r-dir'), horario: g('r-hor'), instagram: g('r-ig'), instagramUrl: g('r-igu'), mapsUrl: g('r-map') },
      textos: { fraseIndex: +g('t-fr'), heroSub: g('t-sub'), filosofia: [g('t-f1'), g('t-f2')], pasaporteTexto: g('t-pp'), reservasTexto: g('t-rs') } });
    toast('Ajustes guardados');
  }
  async function reset() {
    if (!await confirmModal('Se restauran los datos de ejemplo y se borra lo registrado en este navegador. ¿Continuar?', { ok: 'Reiniciar demo', danger: true })) return;
    await DB.resetDemo(); toast('Demo reiniciada'); location.reload();
  }
}
