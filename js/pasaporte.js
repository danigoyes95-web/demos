// Pasaporte Nómada: registro, tarjeta, sellos animados, premios y simulación de sello del mesero (demo).
import * as DB from './data.js';
import { h, $, toast, modal, fDate, fDateTime, fTime, MESES, phonePretty, phoneValid, firstName, registerSW, prefersReduced, url } from './util.js';
import { icon } from './icons.js';
import { ensureDefs, stampSVG, stampGhostSVG, wordmark, glyph } from './sellos.js';
import { qrSVG } from './qr.js';

const app = $('#app');
const mount = (...n) => app.append(...n.filter(Boolean));
$('#ico-back').innerHTML = icon('arrowL', 22);
$('#brand').innerHTML = wordmark();
ensureDefs();
registerSW();

const params = new URLSearchParams(location.search);
if (params.get('o')) sessionStorage.setItem('nomada.origen', params.get('o'));
const origen = () => sessionStorage.getItem('nomada.origen') || 'landing';

let config, menu, current = null, tab = 'disp';
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });

const seenKey = id => 'nomada.vistos.' + id;
const getSeen = id => +(localStorage.getItem(seenKey(id)) ?? -1);
const setSeen = (id, n) => localStorage.setItem(seenKey(id), n);

async function init() {
  [config, menu] = await Promise.all([DB.getConfig(), DB.getMenu()]);
  current = await DB.getCurrentMember();
  if (current) await renderCard(current); else renderRegister();
}

// ============================================================================
//  REGISTRO
// ============================================================================
function renderRegister() {
  const dev = DB.device.get();
  const premioPend = dev.ganado && !dev.reclamado ? dev.premio : null;
  const jg = config.juego;
  const foods = menu.filter(d => ['entradas', 'fuertes', 'postres'].includes(d.categoria));
  const dias = Array.from({ length: 31 }, (_, i) => i + 1);
  const alerg = ['Gluten', 'Lácteos', 'Mariscos', 'Frutos secos', 'Huevo'];
  const bebs = [['cerveza', 'Cerveza'], ['coctel', 'Cóctel'], ['vino', 'Vino'], ['sinalcohol', 'Sin alcohol']];

  app.innerHTML = '';
  mount(
    h('div', { class: 'pp-cover', html: `<div class="cover-in">${glyph('brujula', { size: 88, stroke: 1, cls: 'mark' })}${wordmark()}<div class="cover-rule"></div><div class="cover-title">Pasaporte</div><p class="cover-sub">Cada visita, un destino.</p></div>` }),
    premioPend ? h('div', { class: 'pp-game-banner', html: `${icon('gift', 28)}<div><strong>Tu premio te espera</strong><span>${premioPend === 'sello' ? jg.textoSello : jg.textoBebida}. Se activa al crear tu pasaporte.</span></div>` }) : null,
    h('form', { class: 'pp-form', id: 'reg', novalidate: true, onsubmit: onRegister, html: `
      <div><h2>Abre tu pasaporte</h2></div>
      <p class="lead">Un solo paso. Gratis. Cada vez que nos visites, sellamos tu pasaporte y sumas hacia premios reales.</p>
      <div class="field"><label for="f-nombre">Nombre y apellido</label><input class="input" id="f-nombre" name="nombre" autocomplete="name" placeholder="Ej. Camila Villacís" required></div>
      <div class="field"><label for="f-tel">WhatsApp</label><input class="input" id="f-tel" name="tel" type="tel" inputmode="tel" autocomplete="tel" placeholder="09XX XXX XXXX" required><span class="hint">Lo usamos para identificarte en la mesa. Nada de spam.</span></div>
      <div class="field"><label>Cumpleaños (día y mes)</label><div class="row2">
        <select class="select" name="dia" aria-label="Día" required><option value="">Día</option>${dias.map(d => `<option>${d}</option>`).join('')}</select>
        <select class="select" name="mes" aria-label="Mes" required><option value="">Mes</option>${MESES.map((m, i) => `<option value="${i + 1}">${m[0].toUpperCase() + m.slice(1)}</option>`).join('')}</select></div>
        <span class="hint">Es para regalarte algo en tu semana. No pedimos el año.</span></div>
      <div class="opt"><div class="opt-t">Tus gustos · opcional</div>
        <div class="field"><label>¿Qué eliges primero?</label><div class="chips radio-chips">${bebs.map(([v, l]) => `<label><input type="radio" name="bebida" value="${v}"><span class="chip">${l}</span></label>`).join('')}</div></div>
        <div class="field"><label for="f-fav">Plato favorito de la carta</label><select class="select" id="f-fav" name="fav"><option value="">Aún no lo sé</option>${foods.map(f => `<option value="${f.id}">${f.nombre}</option>`).join('')}</select></div>
        <div class="field"><label>Alergias o restricciones</label><div class="chips radio-chips">${alerg.map(a => `<label><input type="checkbox" name="alergia" value="${a.toLowerCase()}"><span class="chip">${a}</span></label>`).join('')}</div></div>
      </div>
      ${premioPend === 'bebida' ? `<div class="opt"><div class="opt-t">Tu bebida de bienvenida</div><div class="chips radio-chips"><label><input type="radio" name="tipoBebida" value="bebida" checked><span class="chip">Con alcohol</span></label><label><input type="radio" name="tipoBebida" value="bebida0"><span class="chip">Sin alcohol</span></label></div><p class="pp-alc">La opción con alcohol es solo para mayores de 18 años.</p></div>` : ''}
      <div class="stack">
        <label class="check"><input type="checkbox" name="datos" required><span>Acepto el tratamiento de mis datos personales para gestionar mi Pasaporte Nómada. <em class="muted">(obligatorio)</em></span></label>
        <label class="check"><input type="checkbox" name="news"><span>Quiero recibir novedades, eventos y preventas por WhatsApp. <em class="muted">(opcional)</em></span></label>
      </div>
      <div class="err" id="reg-err" role="alert"></div>
      <button class="btn primary lg block" type="submit">Abrir mi pasaporte ${icon('arrow', 20)}</button>
      <p class="hint" style="text-align:center">Demo: tus datos se guardan solo en este dispositivo.</p>` })
  );
  DB.trackEvent('passport_view');
}

async function onRegister(e) {
  e.preventDefault();
  const f = e.target, fd = new FormData(f), err = $('#reg-err');
  const nombre = (fd.get('nombre') || '').trim(), tel = fd.get('tel') || '';
  const fail = m => { err.textContent = m; err.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
  if (nombre.length < 3 || !nombre.includes(' ') && nombre.length < 4) return fail('Escribe tu nombre y apellido.');
  if (!phoneValid(tel)) return fail('Escribe un WhatsApp válido de Ecuador (09XX XXX XXXX).');
  if (!fd.get('dia') || !fd.get('mes')) return fail('Elige el día y el mes de tu cumpleaños.');
  if (!fd.get('datos')) return fail('Para crear tu pasaporte necesitamos que aceptes el tratamiento de datos.');
  const dev = DB.device.get();
  const juego = dev.ganado && !dev.reclamado ? (dev.premio === 'sello' ? 'sello' : (fd.get('tipoBebida') || 'bebida')) : null;
  const res = await DB.registerMember({
    nombre, telefono: tel, cumple: { dia: fd.get('dia'), mes: fd.get('mes') }, bebida: fd.get('bebida') || null,
    fav: fd.get('fav') || null, alergias: fd.getAll('alergia'), consent: { datos: true, novedades: !!fd.get('news') }
  }, { origen: juego ? 'juego' : origen(), juego });
  if (res.error === 'telefono-existente') { DB.setCurrentMember(res.member.id); toast(`Ya tenías pasaporte, ${firstName(res.member.nombre)}. Te lo mostramos.`); current = res.member; return renderCard(current); }
  if (res.error) return fail('Revisa tus datos e inténtalo de nuevo.');
  DB.setCurrentMember(res.member.id);
  if (juego) { DB.device.set({ reclamado: true, memberId: res.member.id }); }
  setSeen(res.member.id, 0);
  current = res.member;
  const ov = h('div', { class: 'pp-open', html: wordmark() }); document.body.append(ov); setTimeout(() => ov.remove(), 1600);
  window.scrollTo({ top: 0 });
  await renderCard(current, { primera: true, premioJuego: res.premioJuego });
}

// ============================================================================
//  TARJETA
// ============================================================================
async function renderCard(m, { primera = false, premioJuego = null } = {}) {
  config = await DB.getConfig();
  const lv = config.niveles;
  const vis = [...m.historial].reverse();          // ascendente
  const nSellos = m.sellos;
  const slots = Math.max(10, Math.ceil(nSellos / 5) * 5);
  const seen = getSeen(m.id);
  const hitos = new Map(config.premios.map(p => [p.sellos, p]));
  const nuevos = seen >= 0 && nSellos > seen ? nSellos - seen : (primera ? nSellos : 0);
  const sig = m.siguiente;
  const pct = sig ? Math.min(100, Math.round(nSellos / sig.premio.sellos * 100)) : 100;

  let st = '';
  for (let i = 0; i < slots; i++) {
    const got = i < nSellos;
    const hit = hitos.get(i + 1);
    const badge = hit ? `<span class="badge" title="${hit.nombre}">${icon('gift', 12)}</span>` : '';
    const anim = got && i >= nSellos - nuevos;
    st += `<div class="slot ${got ? 'got' : 'ghost'} ${anim ? 'stamping' : ''}" style="--d:${(i - (nSellos - nuevos)) * 380}ms">${got ? stampSVG(i, { date: vis[i]?.ts }) : stampGhostSVG(i)}${badge}</div>`;
  }
  const bday = m.diasCumple <= 6;
  const disp = m.premios.filter(r => r.estado === 'disponible'), usados = m.premios.filter(r => r.estado === 'canjeado');
  const cumple = `${m.cumple.dia} de ${MESES[m.cumple.mes - 1]}`;

  app.innerHTML = '';
  mount(
    h('section', { class: 'pp-id', html: `
      <div class="id-top">${wordmark()}<span class="id-doc">Pasaporte</span></div>
      <div><div class="id-name">${esc(m.nombre)}</div>
        <div class="id-meta"><span>Nº <b>${m.id.slice(4)}</b></span><span>Desde <b>${fDate(m.alta, { year: true })}</b></span><span>Cumple <b>${cumple}</b></span></div>
        <div class="lvl">${icon('star', 16)} ${m.nivelNombre}</div></div>
      <button class="qr" id="qr" aria-label="Ampliar mi código QR">${qrSVG('NOMADA:' + m.id)}<small>Muéstralo al mesero</small></button>` }),
    bday ? h('div', { class: 'pp-bday', html: `${icon('cake', 22)}<span>${m.diasCumple === 0 ? '¡Hoy es tu cumpleaños!' : `Tu cumpleaños es en ${m.diasCumple} día${m.diasCumple === 1 ? '' : 's'}.`} En tu semana te espera un detalle de la casa.</span>` }) : null,
    h('section', { class: 'pp-page', id: 'page' },
      h('div', { class: 'pp-page-head', html: `<h2>Mis destinos</h2><span class="count">${nSellos}<small style="font-size:.6em;opacity:.7"> ${nSellos === 1 ? 'sello' : 'sellos'}</small></span>` }),
      h('div', { class: 'stamps', id: 'stamps', html: st }),
      h('div', { class: 'progress', html: `<div class="bar"><i id="bar" style="width:0"></i></div><p>${sig ? `Te ${sig.faltan === 1 ? 'falta 1 escala' : `faltan ${sig.faltan} escalas`} para: <em>${sig.premio.nombre}</em>` : `Ruta completa. Eres <em>${m.nivelNombre}</em>: la mesa ya te conoce.`}</p>` }),
      h('div', { class: 'lv-row', html: lv.map(l => `<div class="lv ${l.id === m.nivelId ? 'on' : ''}">${l.nombre}<small>${l.min === 0 ? 'desde 1ª visita' : l.min + '+ visitas'}</small></div>`).join('') })
    ),
    h('section', { class: 'pp-sec' },
      h('h3', {}, 'Mis premios', h('div', { class: 'seg', role: 'tablist' },
        h('button', { class: tab === 'disp' ? 'on' : '', onclick: () => { tab = 'disp'; renderCard(m); } }, `Disponibles (${disp.length})`),
        h('button', { class: tab === 'usados' ? 'on' : '', onclick: () => { tab = 'usados'; renderCard(m); } }, `Canjeados (${usados.length})`))),
      ...(tab === 'disp' ? (disp.length ? disp.map(rewardCard) : [h('div', { class: 'empty', html: sig ? `Aún no tienes premios disponibles.<br>Con ${sig.premio.sellos} sellos desbloqueas <b>${sig.premio.nombre}</b>.` : 'Sin premios por ahora.' })])
        : (usados.length ? usados.map(rewardCard) : [h('div', { class: 'empty' }, 'Todavía no has canjeado premios.')]))
    ),
    h('section', { class: 'pp-sec' }, h('h3', {}, 'Historial de visitas'),
      m.historial.length ? h('div', { class: 'visits', html: m.historial.map((v, i) => { const n = m.historial.length - i; return `<div class="visit"><div class="n">${n}</div><div class="d">${v.regalo ? 'Sello de regalo · Maridaje Nómada' : v.eventId ? 'Evento Nómada' : 'Visita a Nómada'}<small>${fDateTime(v.ts)}${v.personas ? ` · ${v.personas} ${v.personas === 1 ? 'persona' : 'personas'}` : ''}</small></div><div class="a">${v.regalo ? 'Regalo' : '$' + Math.round(v.monto)}</div></div>`; }).join('') }) : h('div', { class: 'empty' }, 'Tu primera escala te espera. Pide al mesero que selle tu visita.')),
    h('section', { class: 'pp-demo' },
      h('span', { class: 'tag warn' }, 'Modo demo'),
      h('button', { class: 'btn primary block', id: 'sim' }, `${icon('stamp', 20)} Simular sello del mesero (demo)`),
      h('p', {}, 'En el local, el mesero escanea tu QR y registra la visita. Aquí lo simulamos con el PIN de personal (demo: 1234).'),
      h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn sm', id: 'install' }, `${icon('phone', 16)} Agregar a pantalla de inicio`),
        h('a', { class: 'btn sm', href: url('admin/') }, 'Ver como panel'))),
    h('div', { class: 'pp-foot' }, h('div', {}, 'El pasaporte es personal. Solo nuestro equipo puede sellarlo.'), h('button', { class: 'link', id: 'out' }, 'Salir de este pasaporte'))
  );

  $('#qr').onclick = () => modal(h('div', { class: 'qr-big', html: `<div class="qrbox">${qrSVG('NOMADA:' + m.id)}</div><div><b>${esc(m.nombre)}</b><br><span class="muted">Nº ${m.id.slice(4)} · ${m.nivelNombre}</span></div><p class="hint">Muéstrale este código al mesero para sellar tu visita.</p>` }), { title: 'Mi código' });
  $('#sim').onclick = () => simModal(m);
  $('#install').onclick = install;
  $('#out').onclick = () => { DB.setCurrentMember(null); current = null; renderRegister(); window.scrollTo({ top: 0 }); };
  requestAnimationFrame(() => setTimeout(() => { const b = $('#bar'); if (b) b.style.width = pct + '%'; }, 150));

  setSeen(m.id, nSellos);
  if (nuevos > 0) stampFx(nuevos);
  if (primera && premioJuego) setTimeout(() => unlockModal({ nombre: premioJuego.nombre, desc: premioJuego.tipo === 'sello' ? 'Tu primer sello ya está en el pasaporte.' : 'Preséntala en tu primera visita.' }, 'Premio del juego'), 1900);
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function rewardCard(r) {
  const used = r.estado === 'canjeado';
  return h('div', { class: 'reward' + (used ? ' used' : ''), html: `<h4>${esc(r.nombre)}</h4><p>${esc(r.desc || '')}</p>${r.alcohol && r.alt ? `<p class="pp-alc">Solo mayores de 18. Alternativa sin alcohol: ${esc(r.alt)}.</p>` : ''}
    ${used ? `<div class="code">${r.codigo}<small>Canjeado ${fDate(r.canjeadoTs)}</small></div>` : `<div class="code">${r.codigo}<small>Muéstralo al mesero</small></div>`}` });
}

// ---------- efectos de sellado ----------
function stampFx(n) {
  if (prefersReduced()) return;
  $('#page').scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => { $('#page').classList.add('shake'); navigator.vibrate?.([30, 50, 30]); }, 150);
  setTimeout(() => $('#page')?.classList.remove('shake'), 1400 + n * 380);
}

function unlockModal(r, titulo = '¡Premio desbloqueado!') {
  if (!prefersReduced()) window.confetti?.({ particleCount: 90, spread: 70, origin: { y: .65 }, colors: ['#e2a862', '#c8873e', '#ece6db', '#ffffff'], scalar: .9, ticks: 160, disableForReducedMotion: true });
  modal(h('div', { class: 'unlock', html: `${icon('gift', 44)}<h4>${esc(r.nombre)}</h4><p class="muted">${esc(r.desc || '')}</p><button class="btn primary" data-x>Ver mis premios</button>` }), { title: titulo });
  document.querySelector('[data-x]')?.addEventListener('click', () => { document.querySelector('.modal-back .icon-btn')?.click(); });
}

// ---------- simulación del mesero ----------
function simModal(m) {
  const body = h('form', { class: 'stack', novalidate: true, html: `
    <p class="muted">En el local esto lo hace el mesero desde el panel. Para la demo, ingresa el PIN de personal.</p>
    <div class="field"><label for="s-pin">PIN de personal</label><input class="input pinpad" id="s-pin" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="••••" autofocus><span class="hint">Demo: 1234</span></div>
    <div class="row2"><div class="field"><label for="s-monto">Monto consumido ($)</label><input class="input" id="s-monto" inputmode="decimal" value="38"></div>
      <div class="field"><label for="s-pers">Personas</label><input class="input" id="s-pers" inputmode="numeric" value="2"></div></div>
    <div class="err" id="s-err" role="alert"></div>
    <button class="btn primary block" type="submit">${icon('stamp', 20)} Sellar mi visita</button>` });
  const mod = modal(body, { title: 'Sello del mesero' });
  body.onsubmit = async e => {
    e.preventDefault();
    if (!(await DB.verifyStaffPin($('#s-pin').value.trim()))) { $('#s-err').textContent = 'PIN incorrecto.'; return; }
    const res = await DB.addVisit(m.id, { monto: $('#s-monto').value.replace(',', '.'), personas: $('#s-pers').value, by: 'Mesero (demo)' });
    mod.close();
    current = await DB.getMember(m.id);
    await renderCard(current);
    if (res.nuevosPremios?.length) setTimeout(() => unlockModal(res.nuevosPremios[0]), 2000);
    else if (res.subioNivel) setTimeout(() => toast(`Subiste a ${res.subioNivel.a}`), 1800);
  };
}

async function install() {
  if (deferredInstall) { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; return; }
  modal(h('div', { class: 'stack', html: `<p><b>iPhone (Safari):</b> toca <b>Compartir</b> y luego <b>“Agregar a inicio”</b>.</p><p><b>Android (Chrome):</b> menú ⋮ → <b>“Instalar app”</b> o <b>“Agregar a pantalla de inicio”</b>.</p><p class="hint">Así tu pasaporte queda siempre a mano, como una tarjeta. (Apple/Google Wallet queda para la versión final).</p>` }), { title: 'Agregar a inicio' });
}

// ---------- sincronización con otra pestaña (mismo dispositivo) ----------
DB.onChange(async d => {
  if (!d.remote || !current) return;
  const m = await DB.getMember(current.id);
  if (!m) { DB.setCurrentMember(null); current = null; return renderRegister(); }
  if (m.sellos !== current.sellos || m.premios.length !== current.premios.length) { const prev = current; current = m; await renderCard(m); const nuevoPremio = m.premios.find(r => !prev.premios.some(p => p.id === r.id)); if (nuevoPremio) setTimeout(() => unlockModal(nuevoPremio), 1800); }
  else current = m;
});

init();
