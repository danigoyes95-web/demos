// Pasaporte y juego: niveles, premios, cumpleaños, PIN y configuración del minijuego.
import * as DB from '../data.js';
import { h, $, toast } from '../util.js';
import { icon } from '../icons.js';

export async function render(el) {
  const c = await DB.getConfig();
  const inp = (id, v, ph = '', extra = {}) => h('input', { class: 'input', id, value: v ?? '', placeholder: ph, ...extra });
  const sw = (id, on, label) => h('label', { class: 'sw' }, h('input', { type: 'checkbox', id, checked: on }), label);

  const niveles = c.niveles.map((n, i) => h('div', { class: 'form-grid' }, h('div', { class: 'field' }, h('label', {}, `Nivel ${i + 1}`), inp('n-n' + i, n.nombre)), h('div', { class: 'field' }, h('label', {}, 'Desde (sellos)'), inp('n-m' + i, n.min, '', { inputmode: 'numeric', ...(i === 0 ? { readonly: true } : {}) }))));
  const premios = c.premios.map((p, i) => h('div', { class: 'form-grid', style: { paddingBottom: '12px', borderBottom: '1px solid var(--line)' } },
    h('div', { class: 'field' }, h('label', {}, 'Sellos para ganarlo'), inp('p-s' + i, p.sellos, '', { inputmode: 'numeric' })),
    h('div', { class: 'field' }, h('label', {}, 'Premio'), inp('p-n' + i, p.nombre)),
    h('div', { class: 'field full' }, h('label', {}, 'Descripción'), inp('p-d' + i, p.desc)),
    h('div', { class: 'field' }, h('label', {}, 'Alternativa sin alcohol (si aplica)'), inp('p-a' + i, p.alt || ''))));

  el.innerHTML = '';
  el.append(h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Pasaporte y juego'), h('p', {}, 'Valores provisionales: confírmalos con el dueño.'))),
    h('div', { class: 'grid g2' },
      h('div', { class: 'stack' },
        h('div', { class: 'card stack' }, h('h3', {}, 'Niveles'), ...niveles),
        h('div', { class: 'card stack' }, h('h3', {}, 'Beneficio de cumpleaños'), sw('c-on', c.cumple.activo, 'Activo (válido ±3 días de su cumpleaños)'), h('div', { class: 'field' }, h('label', {}, 'Nombre'), inp('c-n', c.cumple.nombre)), h('div', { class: 'field' }, h('label', {}, 'Descripción'), inp('c-d', c.cumple.desc))),
        h('div', { class: 'card stack' }, h('h3', {}, 'PIN de acceso'), h('div', { class: 'form-grid' }, h('div', { class: 'field' }, h('label', {}, 'PIN Mesero / sello demo'), inp('pin-m', c.pin.mesero, '', { maxlength: 4, inputmode: 'numeric' })), h('div', { class: 'field' }, h('label', {}, 'PIN Dueño'), inp('pin-d', c.pin.dueno, '', { maxlength: 4, inputmode: 'numeric' }))))),
      h('div', { class: 'stack' },
        h('div', { class: 'card stack' }, h('h3', {}, 'Premios por sellos'), ...premios),
        h('div', { class: 'card stack' }, h('h3', {}, 'Minijuego “Maridaje Nómada”'), sw('j-on', c.juego.activo, 'Mostrar el juego en la landing'), sw('j-rk', c.juego.ranking, 'Mostrar ranking semanal'),
          h('div', { class: 'field' }, h('label', {}, 'Premio al ganar'), h('select', { class: 'select', id: 'j-p' }, h('option', { value: 'sello', ...(c.juego.premio === 'sello' ? { selected: true } : {}) }, 'Primer sello de regalo'), h('option', { value: 'bebida', ...(c.juego.premio === 'bebida' ? { selected: true } : {}) }, 'Bebida de bienvenida (+18, con alternativa sin alcohol)'))),
          h('div', { class: 'field' }, h('label', {}, 'Texto del premio (sello)'), inp('j-ts', c.juego.textoSello)), h('div', { class: 'field' }, h('label', {}, 'Texto del premio (bebida)'), inp('j-tb', c.juego.textoBebida)),
          h('div', { class: 'field' }, h('label', {}, 'Introducción'), inp('j-i', c.juego.intro)), h('div', { class: 'field' }, h('label', {}, 'Duración (segundos)'), inp('j-s', c.juego.segundos, '', { inputmode: 'numeric' }))))),
    h('div', { class: 'row end' }, h('button', { class: 'btn primary lg', onclick: save }, icon('check', 20), 'Guardar cambios')));

  async function save() {
    const g = id => $('#' + id).value.trim();
    const niv = c.niveles.map((n, i) => ({ ...n, nombre: g('n-n' + i), min: i === 0 ? 0 : Math.max(1, parseInt(g('n-m' + i), 10) || n.min) }));
    const pr = c.premios.map((p, i) => ({ ...p, sellos: Math.max(1, parseInt(g('p-s' + i), 10) || p.sellos), nombre: g('p-n' + i), desc: g('p-d' + i), alt: g('p-a' + i) || undefined }));
    const pm = g('pin-m'), pd = g('pin-d');
    if (!/^\d{4}$/.test(pm) || !/^\d{4}$/.test(pd)) return toast('Los PIN deben tener 4 dígitos');
    await DB.saveConfig({ niveles: niv, premios: pr, cumple: { activo: $('#c-on').checked, nombre: g('c-n'), desc: g('c-d') }, pin: { mesero: pm, dueno: pd },
      juego: { activo: $('#j-on').checked, ranking: $('#j-rk').checked, premio: $('#j-p').value, textoSello: g('j-ts'), textoBebida: g('j-tb'), intro: g('j-i'), segundos: Math.min(180, Math.max(20, parseInt(g('j-s'), 10) || 60)) } });
    toast('Guardado. Los sellos nuevos usan estos valores.');
  }
}
