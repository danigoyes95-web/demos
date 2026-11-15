// Minijuego "Maridaje Nómada": memoria de parejas plato ↔ maridaje (≤ 60 s). Alimenta el registro del Pasaporte.
import * as DB from './data.js';
import { h, $, modal, toast, url, firstName, prefersReduced } from './util.js';
import { icon } from './icons.js';
import { glyph } from './sellos.js';

const PAIRS = [
  [['pez', 'Tiradito de corvina'], ['coupe', 'Sour de maracuyá']],
  [['carne', 'Lomo fino'], ['vino', 'Malbec']],
  [['gyoza', 'Gyozas de cerdo'], ['cerveza', 'Lager helada']],
  [['cacao', 'Cacao nacional'], ['postre', 'Esfera de chocolate']],
  [['quinua', 'Quinua andina'], ['ensalada', 'Ensalada tibia']],
  [['naranjilla', 'Naranjilla'], ['altocopa', 'Spritz de naranjilla']]
];

export async function mountGame(root) {
  const cfg = (await DB.getConfig()).juego;
  if (!cfg.activo) { root.style.display = 'none'; return; }
  const SECS = cfg.segundos || 60;
  let timer = null, t0 = 0, first = null, lock = false, matched = 0, playing = false;

  root.innerHTML = `<div class="wrap game">
    <div class="game-main">
      <div class="game-head rv"><span class="eyebrow">Minijuego</span><h2 class="display" id="h-game">${cfg.titulo.split(' ').join('<br>')}</h2><p class="lead">${cfg.intro}</p></div>
      <div class="game-bar rv"><div class="game-time" id="g-time">${SECS}<small>s</small></div><div class="game-pairs" id="g-pairs">0 / ${PAIRS.length} parejas</div></div>
      <div class="board-wrap rv"><div class="board" id="board" aria-label="Tablero de cartas"></div>
        <div class="board-cover" id="cover"><h3>¿Listo?</h3><p>Voltea las cartas y une cada plato con su pareja ideal. Tienes ${SECS} segundos.</p><button class="btn primary lg" id="g-start">Empezar</button><p class="alc" style="font-family:var(--f-ui);font-size:12px;color:var(--stone-2)">${cfg.premio === 'bebida' ? 'Premio con alcohol: solo para mayores de 18 años (hay alternativa sin alcohol).' : 'Premio: ' + cfg.textoSello.toLowerCase() + '.'}</p></div></div>
    </div>
    ${cfg.ranking ? `<aside class="rank rv"><h3>Ranking de la semana</h3><span class="hint">Mejores tiempos · solo nombre de pila</span><ol id="rank"></ol></aside>` : ''}
  </div>`;
  const board = $('#board', root), cover = $('#cover', root), timeEl = $('#g-time', root), pairsEl = $('#g-pairs', root);

  async function drawRank(meName) {
    if (!cfg.ranking) return;
    const rows = await DB.getGameScores(6);
    $('#rank', root).innerHTML = rows.map((r, i) => `<li class="${meName && r.nombre === meName ? 'me' : ''}"><span class="p">${i + 1}</span><span>${r.nombre}</span><span class="t">${r.seg.toFixed(1)} s</span></li>`).join('') || '<li><span></span><span class="hint">Sé el primero de la semana.</span><span></span></li>';
  }

  function deal() {
    const cards = PAIRS.flatMap((p, i) => [{ k: i, g: p[0][0], l: p[0][1] }, { k: i, g: p[1][0], l: p[1][1] }]);
    for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    board.innerHTML = '';
    cards.forEach(c => {
      const el = h('button', { class: 'gcard', type: 'button', 'aria-label': 'Carta', 'data-k': c.k }, h('div', { class: 'in' },
        h('div', { class: 'face back', html: glyph('brujula', { size: 48, stroke: 1.2 }) }),
        h('div', { class: 'face front', html: `${glyph(c.g, { size: 64, stroke: 1.5 })}<span>${c.l}</span>` })));
      el.addEventListener('click', () => flip(el));
      board.append(el);
    });
    matched = 0; first = null; lock = false;
    pairsEl.textContent = `0 / ${PAIRS.length} parejas`;
  }

  function flip(el) {
    if (!playing || lock || el.classList.contains('flip') || el.classList.contains('ok')) return;
    el.classList.add('flip');
    if (!first) { first = el; return; }
    const a = first, b = el; first = null; lock = true;
    if (a.dataset.k === b.dataset.k) {
      setTimeout(() => { [a, b].forEach(x => { x.classList.remove('flip'); x.classList.add('ok'); }); matched++; pairsEl.textContent = `${matched} / ${PAIRS.length} parejas`; lock = false; if (matched === PAIRS.length) win(); }, 380);
    } else {
      setTimeout(() => { [a, b].forEach(x => x.classList.add('miss')); }, 420);
      setTimeout(() => { [a, b].forEach(x => x.classList.remove('flip', 'miss')); lock = false; }, 950);
    }
  }

  function start() {
    deal(); cover.classList.add('off'); playing = true; t0 = performance.now();
    DB.trackEvent('game_play');
    clearInterval(timer);
    timer = setInterval(() => {
      const left = SECS - (performance.now() - t0) / 1000;
      timeEl.innerHTML = `${Math.max(0, Math.ceil(left))}<small>s</small>`; timeEl.classList.toggle('low', left <= 10);
      if (left <= 0) lose();
    }, 100);
  }
  const stop = () => { playing = false; clearInterval(timer); timeEl.classList.remove('low'); };

  function again(m) { m?.close(); timeEl.innerHTML = `${SECS}<small>s</small>`; start(); }

  function lose() {
    stop();
    const body = h('div', { class: 'result' }, h('div', { class: 'big' }, 'Se acabó el tiempo'), h('p', { class: 'muted' }, `Uniste ${matched} de ${PAIRS.length} parejas. Un maridaje se aprende probando.`),
      h('button', { class: 'btn primary lg block', onclick: () => again(m) }, 'Intentar de nuevo'));
    const m = modal(body, { onClose: reset });
  }
  function reset() { stop(); deal(); timeEl.innerHTML = `${SECS}<small>s</small>`; cover.classList.remove('off'); $('#g-start', root).textContent = 'Jugar de nuevo'; }

  async function win() {
    const secs = Math.round((performance.now() - t0) / 100) / 10;
    stop(); DB.trackEvent('game_win');
    const dev = DB.device.get(), meId = DB.getCurrentMemberId();
    const premioNuevo = !dev.ganado && !meId;
    if (premioNuevo) DB.device.set({ ganado: true, premio: cfg.premio, reclamado: false, mejor: secs });
    const pendiente = DB.device.get(); const tienePremio = pendiente.ganado && !pendiente.reclamado && !meId;
    if (!prefersReduced()) {
      const colors = ['#e2a862', '#c8873e', '#ece6db', '#ffffff'];
      window.confetti?.({ particleCount: 110, spread: 75, origin: { y: .6 }, colors, scalar: .9, ticks: 200 });
      setTimeout(() => window.confetti?.({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: .7 }, colors, scalar: .8 }), 250);
      setTimeout(() => window.confetti?.({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: .7 }, colors, scalar: .8 }), 250);
    }
    const me = meId ? await DB.getMember(meId) : null;
    const nameIn = h('input', { class: 'input', placeholder: 'Tu nombre de pila (opcional)', value: me ? firstName(me.nombre) : '', maxlength: 14, style: { minHeight: '44px' } });
    const saved = h('button', { class: 'btn sm', onclick: async e => { await DB.saveGameScore(nameIn.value || 'Viajero', secs); await drawRank(firstName(nameIn.value)); e.target.disabled = true; e.target.textContent = 'Guardado'; } }, 'Guardar en el ranking');
    const prize = tienePremio
      ? h('div', { class: 'prize' }, h('b', {}, cfg.premio === 'sello' ? cfg.textoSello : cfg.textoBebida), h('span', {}, premioNuevo ? 'Es tuyo: se activa al crear tu Pasaporte Nómada.' : 'Tu premio sigue esperándote. Se activa al crear tu pasaporte.'), cfg.premio === 'bebida' ? h('span', { class: 'alc' }, 'Solo para mayores de 18 años. Puedes elegir la versión sin alcohol al crear tu pasaporte.') : null)
      : h('div', { class: 'prize', style: { borderStyle: 'solid', borderColor: 'var(--line-2)', background: 'none' } }, h('span', {}, me ? 'Ya eres viajero: tu pasaporte está activo. El premio del juego es para nuevos pasaportes.' : 'Esta partida es solo por diversión: el premio se entrega una vez por dispositivo.'));
    const body = h('div', { class: 'result' }, h('div', { class: 'big' }, '¡Maridaje perfecto!'), h('p', { class: 'muted' }, `Completaste las ${PAIRS.length} parejas en `, h('b', { style: { color: 'var(--bone)' } }, `${secs.toFixed(1)} s`)),
      prize,
      cfg.ranking ? h('div', { class: 'row gap wrap', style: { width: '100%' } }, h('div', { style: { flex: '1 1 160px' } }, nameIn), saved) : null,
      tienePremio ? h('a', { class: 'btn primary lg block', href: url('pasaporte/?o=juego') }, 'Activar mi premio ', h('span', { html: icon('arrow', 20) })) : null,
      h('button', { class: 'btn block', onclick: () => { m.close(); } }, 'Jugar otra vez'));
    const m = modal(body, { onClose: reset });
    drawRank();
  }

  $('#g-start', root).addEventListener('click', start);
  deal(); drawRank();
}
