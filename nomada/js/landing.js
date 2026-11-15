// Landing: lee todo de data.js (config, menú, eventos) y compone las secciones.
import * as DB from './data.js';
import { h, $, $$, url, waLink, fDate, fDateLong, fTime, money, firstName, registerSW, prefersReduced, rafThrottle, MESES_C } from './util.js';
import { icon } from './icons.js';
import { wordmark, ensureDefs, stampSVG, stampGhostSVG, glyph } from './sellos.js';
import { mountGame } from './juego.js';

registerSW(); ensureDefs();
const src = p => !p ? '' : (p.startsWith('data:') || p.startsWith('http') ? p : url(p));

async function init() {
  const [cfg, menu, events, me] = await Promise.all([DB.getConfig(), DB.getMenu(), DB.getEvents(), DB.getCurrentMember()]);
  const r = cfg.restaurante, t = cfg.textos;
  const wa = txt => waLink(r.whatsapp, txt);
  if (!sessionStorage.getItem('nomada.landing')) { sessionStorage.setItem('nomada.landing', '1'); DB.trackEvent('landing_view'); }

  // marca, hero y datos básicos
  $('#nav-brand').innerHTML = wordmark(); $('#hero-mark').innerHTML = wordmark(); $('#foot-mark').innerHTML = wordmark();
  $('#hero-frase').textContent = t.fraseOpciones[t.fraseIndex] || t.fraseOpciones[0];
  $('#hero-sub').textContent = t.heroSub; $('#hero-hor').textContent = r.horario + ' · Ambato';
  $('#nav-reservar').href = wa('Hola Nómada, quiero reservar una mesa.');
  $('#fab').href = wa('Hola Nómada, quiero reservar una mesa.'); $('#fab').innerHTML = icon('wa', 22) + 'Reservar';
  if (me) $('#cta-pp').textContent = 'Ver mi pasaporte';
  $('#cta-pp').href = url('pasaporte/?o=landing');

  // ----- temporada
  const temp = menu.filter(d => DB.esTemporada(d)).sort((a, b) => (b.foto ? 1 : 0) - (a.foto ? 1 : 0) || a.orden - b.orden);
  const car = $('#car');
  temp.forEach((d, i) => car.append(h('article', { class: 'dish rv', style: { '--d': i * 80 + 'ms' } },
    h('div', { class: 'dish-img' }, d.foto ? h('img', { src: src(d.foto), alt: d.nombre, loading: 'lazy' }) : h('div', { style: { height: '100%', display: 'grid', placeItems: 'center', color: 'var(--accent)' } }, h('span', { html: glyph(d.glifo || 'brujula', { size: 96, stroke: 1 }) })), d.temporadaHasta ? h('span', { class: 'dish-until' }, 'Disponible hasta ' + fDate(d.temporadaHasta)) : null),
    h('div', { class: 'dish-body' }, h('h3', {}, d.nombre), h('p', {}, d.descripcion), h('div', { class: 'dish-ing' }, ...d.ingredientes.slice(0, 4).map(x => h('span', {}, x))), h('div', { class: 'dish-price' }, d.agotado ? 'Agotado hoy' : money(d.precio))))));
  if (!temp.length) car.append(h('p', { class: 'lead', style: { padding: '0 var(--gutter)' } }, 'Pronto, nuevos platos de temporada.'));
  $('#car-prev').innerHTML = icon('arrowL', 22); $('#car-next').innerHTML = icon('arrow', 22);
  const step = () => (car.querySelector('.dish')?.offsetWidth || 380) + 18;
  $('#car-prev').onclick = () => car.scrollBy({ left: -step(), behavior: 'smooth' }); $('#car-next').onclick = () => car.scrollBy({ left: step(), behavior: 'smooth' });

  // ----- eventos
  const grid = $('#ev-grid'); const up = events.filter(e => !e.pasado);
  up.forEach((e, i) => {
    const d = new Date(e.fecha), pct = Math.round(e.restantes / e.cupos * 100);
    const pre = e.preventa && e.preventaHasta && new Date(e.preventaHasta) > new Date();
    const msg = `Hola Nómada, quiero reservar cupo para "${e.titulo}" (${fDateLong(e.fecha)}).${me ? ` Soy miembro del Pasaporte Nº ${me.id.slice(4)} (${me.nombre}).` : ''} Somos __ personas.`;
    grid.append(h('article', { class: 'ev rv', style: { '--d': i * 100 + 'ms' } },
      h('div', { class: 'ev-img' }, h('img', { src: src(e.img), alt: '', loading: 'lazy' }), h('div', { class: 'ev-date' }, h('b', {}, d.getDate()), h('span', {}, MESES_C[d.getMonth()]))),
      h('div', { class: 'ev-body' }, h('h3', {}, e.titulo), h('div', { class: 'ev-colab' }, `${fDateLong(e.fecha)} · ${fTime(e.fecha)} · ${e.colab}`), h('p', {}, e.desc),
        pre ? (me ? h('div', { class: 'ev-pre' }, `Preventa para miembros · hasta el ${fDate(e.preventaHasta)}`) : h('div', { class: 'ev-pre lock' }, `Los miembros del Pasaporte tienen preventa hasta el ${fDate(e.preventaHasta)}.`)) : null,
        h('div', {}, h('div', { class: 'ev-bar', title: 'Cupos restantes' }, h('i', { 'data-w': pct + '%' }))),
        h('div', { class: 'ev-foot' }, h('div', {}, h('div', { class: 'ev-price' }, money(e.precio) + ' ', h('small', { style: { fontSize: '13px', color: 'var(--stone-2)', fontFamily: 'var(--f-ui)' } }, 'por persona')), h('div', { class: 'ev-cupos' }, e.restantes ? h('span', {}, h('b', {}, e.restantes), ` de ${e.cupos} cupos disponibles`) : 'Cupos agotados')),
          e.restantes ? h('a', { class: 'btn primary', href: wa(msg), target: '_blank', rel: 'noopener' }, 'Reservar cupo') : h('span', { class: 'tag' }, 'Lista de espera')))));
  });
  if (!up.length) grid.append(h('p', { class: 'lead' }, 'Estamos preparando los próximos eventos. Síguenos en Instagram.'));

  // ----- pasaporte
  $('#pp-txt').textContent = t.pasaporteTexto;
  const hitos = new Map(cfg.premios.map(p => [p.sellos, p]));
  const hoy = new Date(); const fechas = [30, 21, 12, 5].map(n => new Date(hoy - n * 864e5));
  $('#pp-visual').innerHTML = `<div class="pp-book"><div class="bh"><b>Mis destinos</b><span>Nº 0042 · Explorador</span></div><div class="stamps">${Array.from({ length: 10 }, (_, i) => `<div class="slot ${i < 4 ? 'got pop' : 'ghost'}" style="--d:${i * 320}ms">${i < 4 ? stampSVG(i, { date: fechas[i] }) : stampGhostSVG(i)}${hitos.get(i + 1) ? `<span class="gift">${icon('gift', 11)}</span>` : ''}</div>`).join('')}</div>
    <div class="prog"><div class="bar"><i style="width:80%"></i></div>Te falta 1 escala para: <em>${cfg.premios[1].nombre}</em></div></div>`;
  $('#pp-steps').innerHTML = cfg.premios.map(p => `<li><span class="n">${p.sellos}</span><div><b>${p.nombre}</b><span>${p.sellos} sellos · ${p.desc}</span></div></li>`).join('') +
    (cfg.cumple.activo ? `<li><span class="n">${icon('cake', 28)}</span><div><b>${cfg.cumple.nombre}</b><span>${cfg.cumple.desc}</span></div></li>` : '');

  // ----- equipo
  $('#filo').innerHTML = t.filosofia.map(p => `<p>${p}</p>`).join('');
  const team = [['equipo/chef-retrato.jpg', 'El chef', 'Nombre por confirmar'], ['equipo/chef-emplatando.jpg', 'En la línea', 'Emplatado a mano'], ['equipo/sommelier.jpg', 'Sala y bodega', 'Vinos y maridajes']];
  $('#team-photos').append(...team.map(([f, a, b], i) => h('figure', { class: 'tp rv', style: { '--d': i * 120 + 'ms' } }, h('img', { src: url('assets/fotos/' + f), alt: a, loading: 'lazy' }), h('figcaption', {}, a, h('small', {}, b)))));

  // ----- ubicación
  $('#loc-txt').textContent = t.reservasTexto;
  $('#loc-list').innerHTML = [['clock', r.horario], ['pin', r.direccion], ['ig', r.instagram]].map(([i, x]) => `<li>${icon(i, 20)}<span>${x}</span></li>`).join('');
  $('#loc-wa').href = wa('Hola Nómada, quiero reservar una mesa para __ personas el __ a las __.'); $('#loc-ig').href = r.instagramUrl; $('#loc-ig').innerHTML = icon('ig', 18) + ' ' + r.instagram;
  $('#map-card').href = r.mapsUrl; $('#map-pin').innerHTML = icon('pin', 42); $('#map-addr').textContent = r.direccion;

  // ----- minijuego
  await mountGame($('#juego'));

  setupMotion();
}

function setupMotion() {
  const nav = $('#nav'), hero = $('#hero'), light = $('#hero-light');
  const reduce = prefersReduced();
  const onScroll = rafThrottle(() => {
    nav.classList.toggle('solid', scrollY > 40);
    const max = hero.offsetHeight - innerHeight; const p = reduce ? 1 : Math.min(1, Math.max(0, scrollY / (max * 0.8)));
    hero.style.setProperty('--p', p.toFixed(3));
  });
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (!reduce && matchMedia('(hover:hover)').matches) addEventListener('pointermove', e => { if (scrollY > innerHeight) return; light.style.setProperty('--lx', (e.clientX / innerWidth * 100) + '%'); light.style.setProperty('--ly', (e.clientY / innerHeight * 100) + '%'); }, { passive: true });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); e.target.querySelectorAll('.ev-bar i').forEach(i => i.style.width = i.dataset.w); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach(el => io.observe(el));
}

init();
