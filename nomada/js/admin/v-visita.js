// Registrar visita (pantalla principal del mesero) + canjear premio.
import * as DB from '../data.js';
import { h, $, toast, modal, fDate, fDateTime, money, phonePretty, MESES, esc, phoneValid, prefersReduced } from '../util.js';
import { icon } from '../icons.js';
import { stampSVG } from '../sellos.js';
import { nivelTag, cumpleTxt, openScanner, parseCode, BEBIDAS } from './shared.js';

let C, sel = null, tab = 'visita';

export async function render(el, ctx) {
  C = ctx; sel = null; tab = 'visita';
  el.append(h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Visitas'), h('p', {}, 'Escanea el QR del pasaporte o busca al cliente.')),
    h('div', { class: 'tabs' }, h('button', { class: 'on', id: 't-v', onclick: () => setTab('visita') }, 'Registrar visita'), h('button', { id: 't-c', onclick: () => setTab('canje') }, 'Canjear premio'))),
    h('div', { id: 'panel' }));
  setTab('visita');
}

function setTab(t) { tab = t; $('#t-v').classList.toggle('on', t === 'visita'); $('#t-c').classList.toggle('on', t === 'canje'); t === 'visita' ? renderVisita() : renderCanje(); }

// ---------------------------------------------------------------- registrar
function renderVisita() {
  const p = $('#panel'); p.innerHTML = '';
  const q = h('input', { class: 'input', id: 'q', placeholder: 'Teléfono, nombre o código', autocomplete: 'off', inputmode: 'search', autofocus: true });
  const res = h('div', { class: 'res', id: 'res' });
  const doSearch = async () => {
    const r = await DB.findMember(q.value);
    res.innerHTML = '';
    if (!q.value.trim()) return;
    if (!r.length) res.append(h('div', { class: 'empty-s' }, 'Sin resultados. ', h('button', { class: 'link', style: { color: 'var(--accent-2)', textDecoration: 'underline' }, onclick: newClient }, 'Crear cliente nuevo')));
    r.forEach(m => res.append(h('button', { class: sel === m.id ? 'on' : '', onclick: () => choose(m.id) },
      h('div', { class: 'grow', style: { flex: 1 } }, h('b', {}, m.nombre), h('small', { style: { display: 'block', color: 'var(--stone-2)' } }, `${phonePretty(m.telefono)} · ${m.id}`)), nivelTag(m), h('span', { class: 'muted' }, `${m.visitas} vis.`))));
  };
  q.addEventListener('input', debounced(doSearch));
  q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } });
  p.append(h('div', { class: 'visit-grid' },
    h('div', { class: 'card' }, h('div', { class: 'search-row' }, q, h('button', { class: 'btn', onclick: () => openScanner(code => { q.value = parseCode(code); doSearch().then(async () => { const r = await DB.findMember(q.value); if (r.length === 1) choose(r[0].id); else if (!r.length) toast('Código no encontrado'); }); }), 'aria-label': 'Escanear QR' }, icon('camera', 22), h('span', { class: 'sr' }, 'Escanear'))),
      h('div', { class: 'row gap', style: { marginTop: '10px' } }, h('button', { class: 'btn sm', onclick: newClient }, icon('plus', 16), 'Cliente nuevo')), res),
    h('div', { id: 'ficha-box' }, h('div', { class: 'empty-s' }, 'Aquí verás la ficha del cliente.'))));
}

const debounced = (fn, ms = 180) => { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; };

async function choose(id) {
  sel = id;
  $('#res')?.querySelectorAll('button').forEach(b => b.classList.remove('on'));
  await drawFicha();
  $('#ficha-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function drawFicha() {
  const m = await DB.getMember(sel);
  const box = $('#ficha-box'); box.innerHTML = '';
  if (!m) return;
  const disp = m.premios.filter(r => r.estado === 'disponible');
  const dueno = C.session.rol === 'dueno';
  const ultima = m.ultima ? `hace ${m.diasSin} d` : 'Primera vez';
  const card = h('div', { class: 'card ficha' },
    h('div', {}, h('div', { class: 'nm' }, m.nombre), h('div', { class: 'pill-row', style: { marginTop: '8px' } }, nivelTag(m), h('span', { class: 'tag' }, `${m.id}`), m.siguiente ? h('span', { class: 'tag' }, `Faltan ${m.siguiente.faltan} → ${m.siguiente.premio.nombre}`) : h('span', { class: 'tag ok' }, 'Ruta completa'))),
    m.alergias?.length ? h('div', { class: 'alert-box red' }, icon('alert', 22), h('div', {}, h('b', {}, 'Alergias: '), m.alergias.join(', '), h('div', { class: 'hint', style: { color: 'inherit', opacity: .8 } }, 'Avisar a cocina.'))) : null,
    m.diasCumple <= 6 ? h('div', { class: 'alert-box gold' }, icon('cake', 22), h('div', {}, m.diasCumple === 0 ? 'Hoy es su cumpleaños.' : `Cumple en ${m.diasCumple} día${m.diasCumple === 1 ? '' : 's'} (${cumpleTxt(m)}).`)) : null,
    h('div', { class: 'facts' },
      fact('Visitas', m.visitas), fact('Sellos', m.sellos), fact('Última visita', ultima), fact('Prefiere', BEBIDAS[m.bebida] || '—'),
      dueno ? fact('Gasto total', money(Math.round(m.gasto))) : null, fact('Cumpleaños', cumpleTxt(m))),
    disp.length ? h('div', { class: 'stack' }, h('b', { style: { fontSize: '13px', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent-2)' } }, 'Premios disponibles'),
      ...disp.map(r => h('div', { class: 'mini-rw' }, h('div', {}, h('b', {}, r.nombre), h('small', {}, `Código ${r.codigo}${r.alcohol ? ' · +18 (alternativa: ' + (r.alt || 'sin alcohol') + ')' : ''}`)), h('button', { class: 'btn sm primary', onclick: () => canjear(r.codigo) }, 'Canjear')))) : null,
    m.notas?.length ? h('div', { class: 'hint' }, icon('edit', 14), ' ', m.notas[0].txt) : null,
    h('hr', { style: { border: 0, borderTop: '1px solid var(--line)', width: '100%' } }),
    h('form', { class: 'stack', id: 'sellar', onsubmit: e => { e.preventDefault(); sellar(m); } },
      h('div', { class: 'amount-row' },
        h('div', { class: 'field' }, h('label', { for: 'monto' }, 'Monto consumido ($)'), h('input', { class: 'input', id: 'monto', inputmode: 'decimal', placeholder: '0.00', autocomplete: 'off', required: true })),
        h('div', { class: 'field' }, h('label', { for: 'pers' }, 'Personas'), h('input', { class: 'input', id: 'pers', inputmode: 'numeric', value: '2', autocomplete: 'off' }))),
      h('div', { class: 'quick' }, ...[20, 30, 40, 60, 80].map(v => h('button', { type: 'button', class: 'chip', onclick: () => { $('#monto').value = v; } }, '$' + v))),
      h('button', { class: 'btn primary lg block', type: 'submit' }, icon('stamp', 22), 'Sellar visita')));
  box.append(card);
}
const fact = (k, v) => h('div', { class: 'fact' }, h('small', {}, k), h('b', {}, String(v)));

async function sellar(m) {
  const monto = parseFloat(String($('#monto').value).replace(',', '.'));
  if (!(monto >= 0) || isNaN(monto)) { toast('Ingresa el monto consumido'); return; }
  const r = await DB.addVisit(m.id, { monto, personas: $('#pers').value, by: C.session.nombre });
  if (r.error) return toast('No se pudo registrar');
  const nSello = r.member.sellos;
  const body = h('div', { class: 'sealed' },
    h('div', { class: 'stamp-wrap', html: stampSVG(nSello - 1, { date: new Date() }) }),
    h('h3', {}, `Sello Nº ${nSello} registrado`),
    h('p', {}, `${m.nombre} · ${money(monto)} · ${r.visit.personas} ${r.visit.personas == 1 ? 'persona' : 'personas'}`),
    r.subioNivel ? h('div', { class: 'tag accent' }, `Sube a ${r.subioNivel.a}`) : null,
    ...r.nuevosPremios.map(p => h('div', { class: 'alert-box gold', style: { textAlign: 'left', width: '100%' } }, icon('gift', 22), h('div', {}, h('b', {}, 'Premio desbloqueado'), h('div', {}, p.nombre)))),
    h('button', { class: 'btn primary block', onclick: () => mm.close() }, 'Listo'));
  const mm = modal(body, { dismissible: true, onClose: () => { sel = m.id; drawFicha(); } });
  if (!prefersReduced()) { navigator.vibrate?.([30, 40, 30]); if (r.nuevosPremios.length) window.confetti?.({ particleCount: 80, spread: 70, origin: { y: .7 }, colors: ['#e2a862', '#c8873e', '#ece6db'], scalar: .9, zIndex: 200 }); }
}

function newClient() {
  const dias = Array.from({ length: 31 }, (_, i) => i + 1);
  const f = h('form', { class: 'stack', novalidate: true, html: `
    <div class="field"><label>Nombre y apellido</label><input class="input" name="nombre" autofocus></div>
    <div class="field"><label>WhatsApp</label><input class="input" name="tel" inputmode="tel" placeholder="09XX XXX XXXX"></div>
    <div class="row gap"><select class="select" name="dia"><option value="">Día</option>${dias.map(d => `<option>${d}</option>`).join('')}</select><select class="select" name="mes"><option value="">Mes</option>${MESES.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></div>
    <label class="check"><input type="checkbox" name="datos"><span>El cliente acepta el tratamiento de sus datos (obligatorio)</span></label>
    <label class="check"><input type="checkbox" name="news"><span>Acepta recibir novedades por WhatsApp</span></label>
    <div class="err" id="nc-err"></div><button class="btn primary block" type="submit">Crear pasaporte</button>` });
  const mm = modal(f, { title: 'Cliente nuevo' });
  f.onsubmit = async e => {
    e.preventDefault(); const fd = new FormData(f);
    if (!fd.get('nombre')?.trim() || !phoneValid(fd.get('tel')) || !fd.get('dia') || !fd.get('mes') || !fd.get('datos')) { $('#nc-err').textContent = 'Completa nombre, WhatsApp válido, cumpleaños y consentimiento de datos.'; return; }
    const r = await DB.registerMember({ nombre: fd.get('nombre'), telefono: fd.get('tel'), cumple: { dia: fd.get('dia'), mes: fd.get('mes') }, consent: { datos: true, novedades: !!fd.get('news') } }, { origen: 'mesero' });
    mm.close();
    if (r.error === 'telefono-existente') { toast('Ese teléfono ya tiene pasaporte'); return choose(r.member.id); }
    toast('Pasaporte creado'); choose(r.member.id);
  };
}

// ---------------------------------------------------------------- canjear
function renderCanje() {
  const p = $('#panel'); p.innerHTML = '';
  const out = h('div', { id: 'canje-out' });
  const inp = h('input', { class: 'input', id: 'code', placeholder: 'Código del premio (NOM-XXXX)', autocomplete: 'off', autocapitalize: 'characters', style: { textTransform: 'uppercase', letterSpacing: '.2em', fontSize: '20px' }, autofocus: true });
  const go = async () => {
    const code = inp.value.trim().toUpperCase(); out.innerHTML = ''; if (!code) return;
    const all = await DB.getRewards();
    const r = all.find(x => x.codigo === code);
    if (!r) { out.append(h('div', { class: 'alert-box red' }, icon('alert', 20), 'No existe ese código.')); return; }
    const m = await DB.getMember(r.memberId);
    out.append(h('div', { class: 'card stack' }, h('h3', {}, r.nombre), h('p', { class: 'muted' }, r.desc),
      h('div', {}, h('b', {}, m.nombre), h('span', { class: 'muted' }, ` · ${m.id} · ${m.nivelNombre}`)),
      r.alcohol ? h('div', { class: 'hint' }, 'Contiene alcohol: solo mayores de 18. Alternativa: ' + (r.alt || 'sin alcohol')) : null,
      r.estado === 'canjeado' ? h('div', { class: 'alert-box red' }, icon('alert', 20), `Ya canjeado el ${fDateTime(r.canjeadoTs)} por ${r.canjeadoPor}.`)
        : h('button', { class: 'btn primary lg block', onclick: () => canjear(r.codigo, true) }, icon('check', 20), 'Canjear premio')));
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  p.append(h('div', { class: 'card stack', style: { maxWidth: '640px' } }, h('div', { class: 'field' }, h('label', { for: 'code' }, 'Código de premio'), inp),
    h('div', { class: 'row gap' }, h('button', { class: 'btn primary', onclick: go }, 'Buscar'), h('button', { class: 'btn', onclick: () => openScanner(async c => { const m = await DB.findMember(parseCode(c)); if (m[0]) { setTab('visita'); choose(m[0].id); } }) }, icon('camera', 18), 'Escanear cliente'))), out);
}

async function canjear(code, fromTab) {
  const r = await DB.redeemReward(code, C.session.nombre);
  if (r.error) return toast(r.error === 'ya-canjeado' ? 'Ese premio ya fue canjeado' : 'Código no encontrado');
  toast(`Canjeado: ${r.reward.nombre} · ${r.member.nombre}`);
  if (fromTab) { $('#code').value = ''; $('#canje-out').innerHTML = ''; } else drawFicha();
}
