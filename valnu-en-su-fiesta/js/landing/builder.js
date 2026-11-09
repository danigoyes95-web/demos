/* ARMA TU FIESTA — armador visual. Toda la información viene de data.js. */
import { getAvailability, createQuote, trackEvent, quoteCode, isoDay } from '../data.js';
import { Scene, sceneSVG, normColors } from '../scene.js';
import { $, $$, esc, money, COLORS, estimate, rangeText, waLink, quoteMessage, fmtDate, toast, pop, setSound, isSoundOn, confettiBurst, reducedMotion } from '../util.js';

const LEVELS = [
  { name: 'Salón vacío', msg: 'Tu salón está vacío… ¡elige algo!' },
  { name: 'Básica', msg: 'Buen comienzo. ¡Sigue sumando!' },
  { name: 'Bonita', msg: '¡Eso es una fiesta!' },
  { name: 'Inolvidable', msg: '¡Esto va a quedar espectacular!' },
  { name: 'Épica', msg: '¡Épica! Todos hablarán de esta fiesta 🎉' },
];
const levelOf = (n) => (n === 0 ? 0 : n <= 2 ? 1 : n <= 4 ? 2 : n <= 6 ? 3 : 4);
const EMOJI = { globos: '🎈', backdrop: '🖼️', mesa: '🍬', torta: '🎂', bocaditos: '🥟', carritos: '🛒', alquileres: '🏕️', recuerdos: '🎁', regalos: '🌹', extras: '✨' };

export function createBuilder(root, { items, categories, occasions, suggestions, settings }) {
  const st = {
    occ: null, sel: new Map(), colors: ['#F06FA6', '#7FD1C7', '#B59BE0'], surprise: false, honoree: '', guests: 30, date: '', place: 'ambato', city: '',
    cat: 'globos', avail: {}, opened: false, three: false, level: 0, fromSugg: new Set(), done: null,
  };
  const reducedM = reducedMotion();

  root.innerHTML = `
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Arma tu fiesta</span>
      <h2>Mira tu fiesta armarse <span class="hl">mientras eliges</span></h2>
      <p class="lead">Elige la ocasión, suma lo que quieras y mira cómo queda. Al final recibes un rango de precio y cotizas por WhatsApp.</p>
    </div>
    <div class="b-step"><i>1</i> ¿Qué celebras?</div>
    <div class="occ" id="occ" role="group" aria-label="Ocasión">${occasions.map((o) => `
      <button class="occ-card" data-occ="${o.id}" aria-pressed="false"><span class="e">${o.icon}</span><b>${esc(o.name)}</b><span class="pal">${o.palette.map((c) => `<i style="background:${c}"></i>`).join('')}</span></button>`).join('')}
    </div>
    <p class="occ-copy" id="occCopy">Toca una ocasión para empezar.</p>
    <div class="b-main" id="bmain">
      <div class="stage">
        <div class="scene-wrap" id="sceneHost"><div id="sceneInner" style="position:absolute;inset:0"></div><button class="snd" id="snd" aria-label="Activar sonido pop" aria-pressed="false">🔇</button><div class="scene-empty" id="sceneEmpty">Tu salón está vacío…<br>¡elige algo de los estantes!</div></div>
        <div class="meter lvl-0" id="meter" aria-live="polite">
          <div class="meter-top"><span style="text-align:left"><small>Nivel de fiesta 🎉</small><br><b id="lvlName">Salón vacío</b></span><span id="lvlMsg">Tu salón está vacío… ¡elige algo!</span></div>
          <div class="meter-bar"><i></i><i></i><i></i><i></i></div>
        </div>
      </div>
      <div class="controls">
        <div class="b-step"><i>2</i> Elige lo que quieras sumar <small>toca para agregar o quitar</small></div>
        <div class="cats" id="cats" role="group" aria-label="Categorías"></div>
        <div class="shelf" id="shelf" aria-label="Estante de elementos"></div>
        <div class="sugg" id="sugg"></div>
        <div class="b-step"><i>3</i> Colores de tu fiesta <small>elige 2 o 3</small></div>
        <div class="colors" id="colors"></div>
        <div class="b-step"><i>4</i> Datos del evento <small>opcional, pero ayuda</small></div>
        <div class="form-grid">
          <label class="field full">Nombre del festejado <small style="font-weight:400">(aparece en el backdrop)</small><input id="honoree" maxlength="24" placeholder="Ej: Valentina" autocomplete="off"></label>
          <label class="field">Fecha del evento<input type="date" id="date" min="${isoDay()}"></label>
          <label class="field">Invitados: <span class="rangeval" id="guestsVal">30</span><input type="range" id="guests" min="5" max="300" step="5" value="30"></label>
          <div class="field full">Lugar<div class="seg" id="place"><button data-p="ambato" aria-pressed="true">Ambato</button><button data-p="otra" aria-pressed="false">Otra ciudad</button><button data-p="retiro" aria-pressed="false">Retiro en local</button></div></div>
          <label class="field full" id="cityWrap" hidden>Ciudad<select id="city">${settings.coverage.otherCities.map((c) => `<option>${esc(c)}</option>`).join('')}<option>Otra</option></select></label>
          <p class="hintline full" id="availNote" style="grid-column:1/-1;margin:0" hidden></p>
        </div>
      </div>
    </div>
    <div class="result" id="result"></div>
  </div>
  <div class="floatbar" id="floatbar"><span><b id="fbCount">0 elementos</b><span id="fbPrice"></span></span><button class="btn btn-primary" id="fbGo">Ver mi fiesta →</button></div>`;

  const scene = new Scene($('#sceneInner', root), { reduced: reducedM });
  const catsPresent = () => categories.filter((c) => items.some((i) => i.cat === c.id && i.active && (!st.occ || i.occasions.includes(st.occ.id))));
  const sceneState = () => ({ colors: st.surprise ? st.colors : st.colors, honoree: st.honoree, mood: st.occ?.scene || 'pastel', occasionId: st.occ?.id, items: [...st.sel.values()] });
  const syncScene = () => { scene.update(sceneState()); $('#sceneEmpty', root).classList.toggle('hide', st.sel.size > 0); };
  const isAvail = (it) => !it.rental || !st.avail[it.id] || st.avail[it.id].available;

  /* ---------- estante ---------- */
  function renderCats() {
    const cs = catsPresent();
    if (!cs.find((c) => c.id === st.cat)) st.cat = cs[0]?.id;
    $('#cats', root).innerHTML = cs.map((c) => {
      const n = [...st.sel.values()].filter((i) => i.cat === c.id).length;
      return `<button class="cat" data-cat="${c.id}" aria-pressed="${c.id === st.cat}">${c.icon} ${esc(c.name)}${n ? `<em>${n}</em>` : ''}</button>`;
    }).join('');
  }
  function renderShelf() {
    const list = items.filter((i) => i.active && i.cat === st.cat && (!st.occ || i.occasions.includes(st.occ.id)));
    $('#shelf', root).innerHTML = list.map((it) => {
      const on = st.sel.has(it.id), ok = isAvail(it);
      return `<button class="card" data-item="${it.id}" aria-pressed="${on}" ${ok || on ? '' : 'disabled'}>
        <div class="card-img" style="${it.photo ? `background-image:url('${esc(it.photo)}')` : `background:linear-gradient(135deg,var(--pink-l),var(--lilac-l))`}">${it.photo ? '' : EMOJI[it.cat] || '🎉'}<span class="tick">✓</span></div>
        <div class="card-body"><b>${esc(it.name)}</b><span class="pr">desde <strong>${money(it.pmin)}</strong>${it.unitGuests ? ` · por ${it.unitGuests} inv.` : ''}</span>
        <span class="add">${ok ? (on ? '✓ Agregado' : '+ Agregar') : 'No disponible ese día'}</span></div></button>`;
    }).join('') || '<p class="empty-note">Aún no hay elementos en esta categoría para tu ocasión.</p>';
  }

  /* ---------- sugerencias "también llevaron" ---------- */
  function renderSugg() {
    const box = $('#sugg', root);
    if (!st.occ) { box.innerHTML = `<h4>Las fiestas como la tuya también llevaron…</h4><p class="sugg-empty">Elige tu ocasión y te mostramos lo que otras fiestas parecidas sumaron.</p>`; return; }
    const ids = (suggestions[st.occ.id] || []);
    const list = ids.map((id) => items.find((i) => i.id === id)).filter((i) => i && i.active && !st.sel.has(i.id) && isAvail(i)).slice(0, 4);
    box.innerHTML = `<h4>Las fiestas como la tuya también llevaron…</h4>` + (list.length
      ? `<div class="sugg-list">${list.map((i) => `<button class="chip" data-sugg="${i.id}"><i>+</i><span>${esc(i.name)}<br><small>desde ${money(i.pmin)}</small></span></button>`).join('')}</div>`
      : `<p class="sugg-empty">¡Ya llevas todo lo que suelen pedir en una fiesta como la tuya! 🎉</p>`);
  }

  /* ---------- colores ---------- */
  function renderColors() {
    const norm = normColors(st.colors).slice(0, 3);
    const pal = st.occ?.palette;
    $('#colors', root).innerHTML =
      (pal ? `<button class="pal-btn" data-pal="1" title="Paleta sugerida">${pal.map((c) => `<i style="background:${c}"></i>`).join('')}<span>Sugerida</span></button>` : '') +
      COLORS.map((c) => `<button class="sw ${c.h === '#FFFFFF' || c.h === '#B7E6D9' ? 'light' : ''}" data-color="${c.h}" aria-label="${c.n}" title="${c.n}" aria-pressed="${st.colors.some((x) => x.toLowerCase() === c.h.toLowerCase())}" style="background:${c.h}"></button>`).join('') +
      `<button class="surprise" data-surprise="1">🎲 Sorpréndeme</button>`;
  }

  /* ---------- medidor ---------- */
  function renderMeter() {
    const n = st.sel.size, lv = levelOf(n);
    const m = $('#meter', root); m.className = 'meter lvl-' + lv;
    $$('.meter-bar i', m).forEach((b, i) => b.classList.toggle('on', i < lv));
    $('#lvlName', m).textContent = LEVELS[lv].name;
    const cats = new Set([...st.sel.values()].map((i) => i.cat));
    let msg = LEVELS[lv].msg;
    if (lv >= 1 && lv <= 2) { if (!cats.has('globos') && !cats.has('backdrop')) msg = '¿Y los globos? Sin globos no hay fiesta 🎈'; else if (!cats.has('mesa') && !cats.has('torta') && !cats.has('bocaditos')) msg = lv === 2 ? '¡Eso es una fiesta! Le falta algo dulce…' : 'Le falta algo dulce…'; }
    $('#lvlMsg', m).textContent = msg;
    if (lv > st.level && lv >= 2 && !reducedM) { const r = $('#sceneHost', root).getBoundingClientRect(); confettiBurst((r.left + r.width / 2) / innerWidth, (r.top + r.height / 2) / innerHeight, lv * 22, st.colors); }
    st.level = lv;
  }

  /* ---------- resultado ---------- */
  const currentEstimate = () => estimate([...st.sel.values()], { guests: st.guests, place: st.place }, settings);
  function renderResult() {
    const box = $('#result', root), n = st.sel.size;
    const est = currentEstimate();
    $('#fbCount', root).textContent = `${n} elemento${n === 1 ? '' : 's'}`;
    $('#fbPrice', root).textContent = n ? rangeText(est.min, est.max) : '';
    document.body.classList.toggle('has-floatbar', n > 0 && floatVisible);
    $('#floatbar', root).classList.toggle('show', n > 0 && floatVisible);
    if (st.done) { box.innerHTML = doneHTML(); return; }
    if (!n) { box.innerHTML = `<h3>5 · Tu fiesta</h3><p class="empty-note">Aquí verás tu fiesta armada, el rango de precio y el botón para cotizar. Empieza agregando algo de los estantes 👆</p>`; return; }
    box.innerHTML = `<h3>🎉 Tu fiesta${st.occ ? ' · ' + esc(st.occ.name) : ''}</h3>
      <div class="result-scene">${sceneSVG(sceneState())}</div>
      <ul class="r-list">${est.lines.map((l) => `<li><button data-rm="${l.itemId}" aria-label="Quitar ${esc(l.name)}">×</button><span>${esc(l.name)}${l.qty > 1 ? ` <small>x${l.qty}</small>` : ''}</span><span class="p">${money(l.pmin * l.qty)} – ${money(l.pmax * l.qty)}</span></li>`).join('')}
      ${est.travel ? `<li><span>🚚 Traslado (por confirmar)</span><span class="p">${money(est.travel.min)} – ${money(est.travel.max)}</span></li>` : ''}</ul>
      <div class="r-total"><small>Rango estimado</small><b>${rangeText(est.min, est.max)}</b><small>El precio final lo confirmamos contigo</small></div>
      <div class="r-actions"><button class="btn btn-wa" id="goWa">Cotizar por WhatsApp</button><button class="btn btn-ghost" id="goCall">Enviar y que me llamen</button></div>
      <div class="callme" id="callme"><div class="form-grid"><label class="field">Tu nombre<input id="cName" autocomplete="name" placeholder="Nombre"></label><label class="field">WhatsApp<input id="cWa" inputmode="tel" autocomplete="tel" placeholder="09XXXXXXXX"></label></div><button class="btn btn-primary" id="sendCall" style="width:100%;margin-top:12px">Enviar y que me llamen</button></div>
      <p class="r-note">Es un rango estimado, no un precio cerrado. Sin compromiso.</p>`;
  }
  const doneHTML = () => `<div class="done"><div class="big">🎉</div><b>¡Listo! Tu cotización #${st.done.code}</b>
    <p>${st.done.via === 'call' ? 'Te escribiremos por WhatsApp muy pronto.' : 'Se abrió WhatsApp con tu cotización. Si no se abrió, toca el botón.'}</p>
    <p style="margin:0 0 12px"><b style="font-size:1.1rem">${rangeText(st.done.q.rangeMin, st.done.q.rangeMax)}</b></p>
    ${st.done.via === 'wa' ? `<a class="btn btn-wa" target="_blank" rel="noopener" href="${st.done.link}">Abrir WhatsApp</a>` : ''}
    <p style="margin-top:12px"><button class="btn btn-ghost btn-sm" id="again">Armar otra fiesta</button></p></div>`;

  /* ---------- acciones ---------- */
  async function refreshAvail() {
    st.avail = st.date ? await getAvailability(st.date) : {};
    const note = $('#availNote', root);
    const blocked = items.filter((i) => i.rental && st.avail[i.id] && !st.avail[i.id].available);
    const removed = [];
    blocked.forEach((i) => { if (st.sel.has(i.id)) { st.sel.delete(i.id); removed.push(i.name); } });
    if (removed.length) toast(`Quitamos ${removed.join(', ')}: ya está ocupado ese día`, 'warn');
    note.hidden = !blocked.length;
    note.innerHTML = blocked.length ? `⚠️ Ese día ya no tenemos: <b>${blocked.map((i) => esc(i.name)).join(', ')}</b>. Prueba otra fecha o escríbenos.` : '';
    refreshAll();
  }
  function refreshAll() { renderCats(); renderShelf(); renderSugg(); renderMeter(); renderResult(); syncScene(); }

  function toggleItem(id, fromSugg = false) {
    const it = items.find((i) => i.id === id); if (!it) return;
    if (st.sel.has(id)) st.sel.delete(id);
    else {
      if (!isAvail(it)) return;
      st.sel.set(id, it); pop(500 + st.sel.size * 40);
      if (!st.opened) { st.opened = true; trackEvent('builder_open'); }
      if (fromSugg) { trackEvent('sugg_accepted', { item: id }); st.fromSugg.add(id); }
      if (st.sel.size >= 3 && !st.three) { st.three = true; trackEvent('items3'); }
    }
    st.done = null; refreshAll();
  }
  function pickOccasion(id) {
    const o = occasions.find((x) => x.id === id); st.occ = o; st.colors = [...o.palette]; st.surprise = false;
    $$('.occ-card', root).forEach((b) => b.setAttribute('aria-pressed', b.dataset.occ === id));
    $('#occCopy', root).textContent = `${o.blurb}. ¡Vamos a armarla!`;
    if (!st.opened) { st.opened = true; trackEvent('builder_open'); }
    // al cambiar de ocasión se quitan los elementos que ya no aplican
    for (const [k, v] of [...st.sel]) if (!v.occasions.includes(id)) st.sel.delete(k);
    renderColors(); refreshAll(); trackEvent('occasion', { occasion: id });
    if ((suggestions[id] || []).length) trackEvent('sugg_shown', { occasion: id });
    const r = $('#bmain', root).getBoundingClientRect();
    if (r.top > innerHeight * 0.55) scrollTo({ top: scrollY + r.top - 66, behavior: reducedM ? 'auto' : 'smooth' });
  }
  function quotePayload(contact, via) {
    const est = currentEstimate();
    return {
      contact, occasion: st.occ?.id || 'otra', eventDate: st.date, guests: st.guests, place: st.place, city: st.place === 'otra' ? st.city || $('#city', root).value : '',
      colors: st.surprise ? [] : st.colors, honoree: st.honoree, items: est.lines.map(({ scene, ...l }) => l), rangeMin: est.min, rangeMax: est.max,
      source: 'armador', via, snapshot: sceneSVG(sceneState()),
    };
  }
  async function submit(via) {
    const contact = via === 'call' ? { name: $('#cName', root).value.trim(), whatsapp: $('#cWa', root).value.trim() } : { name: 'Cliente (por WhatsApp)', whatsapp: '' };
    if (via === 'call' && (!contact.name || contact.whatsapp.replace(/\D/g, '').length < 9)) { toast('Escribe tu nombre y un WhatsApp válido', 'warn'); return; }
    const q = await createQuote(quotePayload(contact, via));
    const link = waLink(settings.whatsapp, quoteMessage(q, q.code, st.occ?.name));
    st.done = { code: q.code, via, q, link };
    if (via === 'wa') { const w = open(link, '_blank'); if (w) w.opener = null; else location.href = link; }
    confettiBurst(0.5, 0.6, 90, st.colors); renderResult();
    $('#result', root).scrollIntoView({ behavior: reducedM ? 'auto' : 'smooth', block: 'center' });
  }

  /* ---------- eventos ---------- */
  root.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.occ) return pickOccasion(t.dataset.occ);
    if (t.dataset.cat) { st.cat = t.dataset.cat; renderCats(); renderShelf(); return; }
    if (t.dataset.item) return toggleItem(t.dataset.item);
    if (t.dataset.sugg) return toggleItem(t.dataset.sugg, true);
    if (t.dataset.rm) return toggleItem(t.dataset.rm);
    if (t.dataset.pal) { st.colors = [...st.occ.palette]; st.surprise = false; renderColors(); syncScene(); return renderResult(); }
    if (t.dataset.color) {
      const h = t.dataset.color, i = st.colors.findIndex((x) => x.toLowerCase() === h.toLowerCase());
      if (i >= 0) { if (st.colors.length > 1) st.colors.splice(i, 1); } else { st.colors.push(h); if (st.colors.length > 3) st.colors.shift(); }
      st.surprise = false; renderColors(); syncScene(); return renderResult();
    }
    if (t.dataset.surprise) {
      const pool = COLORS.filter((c) => !['#FFFFFF', '#2B2B3A'].includes(c.h)); const pick = [];
      while (pick.length < 3) { const c = pool[Math.floor(Math.random() * pool.length)].h; if (!pick.includes(c)) pick.push(c); }
      st.colors = pick; st.surprise = true; pop(700); renderColors(); syncScene(); return renderResult();
    }
    if (t.dataset.p) {
      st.place = t.dataset.p; $$('#place button', root).forEach((b) => b.setAttribute('aria-pressed', b.dataset.p === st.place));
      $('#cityWrap', root).hidden = st.place !== 'otra'; return renderResult();
    }
    if (t.id === 'snd') { setSound(!isSoundOn()); t.textContent = isSoundOn() ? '🔊' : '🔇'; t.setAttribute('aria-pressed', isSoundOn()); pop(600); return; }
    if (t.id === 'goWa') return submit('wa');
    if (t.id === 'goCall') { $('#callme', root).classList.toggle('open'); return; }
    if (t.id === 'sendCall') return submit('call');
    if (t.id === 'again') { st.sel.clear(); st.done = null; st.three = false; refreshAll(); return; }
    if (t.id === 'fbGo') { $('#result', root).scrollIntoView({ behavior: reducedM ? 'auto' : 'smooth', block: 'start' }); }
  });
  $('#honoree', root).addEventListener('input', (e) => { st.honoree = e.target.value; syncScene(); });
  $('#guests', root).addEventListener('input', (e) => { st.guests = +e.target.value; $('#guestsVal', root).textContent = st.guests; renderResult(); });
  $('#date', root).addEventListener('change', (e) => { st.date = e.target.value; refreshAvail(); });
  $('#city', root).addEventListener('change', (e) => { st.city = e.target.value; });

  let floatVisible = true;
  new IntersectionObserver(([en]) => { floatVisible = !en.isIntersecting; renderResult(); }, { threshold: 0.2 }).observe($('#result', root));

  renderCats(); renderShelf(); renderSugg(); renderColors(); renderMeter(); renderResult(); syncScene();

  return {
    /** Preselecciona una categoría (desde el mosaico de líneas) y lleva al armador. */
    preselect(cat) {
      if (cat && categories.some((c) => c.id === cat)) { st.cat = cat; renderCats(); renderShelf(); }
      root.scrollIntoView({ behavior: reducedM ? 'auto' : 'smooth', block: 'start' });
    },
    addItem(id) { if (!st.sel.has(id)) toggleItem(id); },
  };
}
