/* LANDING — todo el contenido viene de /js/data.js. Nada de texto de negocio queda escrito aquí. */
import { getContent, getSettings, getItems, getCategories, getOccasions, getSuggestions, createQuote, trackEvent, isoDay } from '../data.js';
import { $, $$, esc, money, waLink, quoteMessage, toast, fmtShort, rangeText } from '../util.js';
import { initHero } from './hero.js';
import { createBuilder } from './builder.js';

const WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
const EMOJI = { globos: '🎈', backdrop: '🖼️', mesa: '🍬', torta: '🎂', bocaditos: '🥟', carritos: '🛒', alquileres: '🏕️', recuerdos: '🎁', regalos: '🌹', extras: '✨' };
const bg = (src) => (src ? `style="background-image:url('${esc(src)}')"` : '');

async function boot() {
  const [content, settings, items, categories, occasions, suggestions] = await Promise.all([getContent(), getSettings(), getItems(), getCategories(), getOccasions(), getSuggestions()]);
  const S = content.sections, today = isoDay();
  const wa = (text) => waLink(settings.whatsapp, text);
  const season = content.season, seasonOn = S.season && season.active && season.start <= today && today <= season.end;
  const occName = (id) => occasions.find((o) => o.id === id)?.name || id;

  const app = $('#app');
  const nav = [S.builder && ['#armador', 'Arma tu fiesta'], S.gallery && ['#galeria', 'Fiestas reales'], S.gifts && ['#regalos', 'Regalos'], seasonOn && ['#temporada', 'Temporada'], S.location && ['#contacto', 'Contacto']].filter(Boolean);

  const heroHTML = S.hero ? `<section class="hero" id="inicio"><canvas id="heroCanvas" aria-hidden="true"></canvas>
    <div class="wrap"><span class="eyebrow">${esc(content.hero.eyebrow)}</span>
    <h1>${esc(content.hero.title).replace(/(sin mil vueltas|en un solo lugar)/i, '<em>$1</em>')}</h1>
    <p class="lead">${esc(content.hero.subtitle)}</p>
    <div class="cta-row"><a class="btn btn-primary" href="#armador">${esc(content.hero.cta1)} →</a><a class="btn btn-ghost" target="_blank" rel="noopener" href="${wa('Hola Valnu 👋 Quiero información para mi fiesta.')}">${esc(content.hero.cta2)}</a></div>
    <div class="proof"><span>📍 <b>${esc(settings.coverage.localCity)}</b></span><span>📸 <b>@${esc(settings.instagram)}</b></span><span>+22.000 publicaciones</span></div></div>
    <div class="hint">${esc(content.hero.hint || '')}</div></section>` : '';

  const linesHTML = S.lines ? `<section id="lineas"><div class="wrap"><div class="sec-head reveal"><span class="eyebrow">Todo en un solo lugar</span><h2>Todo lo que puede tener <span class="hl">tu fiesta</span></h2><p class="lead">No pierdas tiempo buscando proveedor por proveedor. Toca una línea y mira qué más puedes sumar.</p></div>
    <div class="lines">${content.lines.map((l, i) => `<article class="line reveal" data-line="${i}"><button class="line-btn" aria-expanded="false"><span class="line-ico">${String(i + 1).padStart(2, '0')}</span><span><h3>${esc(l.title)}</h3><small>${esc(l.tagline)}</small></span><span class="line-chev">+</span></button>
      <div class="line-body"><div><div class="line-in"><div class="line-photos">${l.photos.length ? l.photos.map((p) => `<img loading="lazy" src="${esc(p)}" alt="${esc(l.title)}">`).join('') : `<div class="ph"><span><b>${l.emoji}</b>Fotos próximamente</span></div>`}</div>
      <div><ul>${l.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul><button class="btn btn-primary btn-sm" data-go="${l.cat}">${l.cat === 'season' ? 'Ver la temporada' : 'Armar mi fiesta con esto'} →</button></div></div></div></div></article>`).join('')}</div></div></section>` : '';

  const galleryItems = content.gallery.filter((g) => g.visible !== false);
  const usedOcc = [...new Set(galleryItems.map((g) => g.occasion))];
  const galleryHTML = S.gallery ? `<section id="galeria"><div class="wrap"><div class="sec-head reveal"><span class="eyebrow">Fiestas reales</span><h2>Así quedaron <span class="hl">nuestras fiestas</span></h2><p class="lead">Fotos reales de trabajos de Valnu. ¿Te gustó alguna? Pídela igual o parecida.</p></div>
    <div class="chips" id="galChips"><button aria-pressed="true" data-f="">Todas</button>${usedOcc.map((o) => `<button aria-pressed="false" data-f="${o}">${esc(occName(o))}</button>`).join('')}</div><div class="gal" id="gal"></div></div></section>` : '';

  const gifts = items.filter((i) => i.gift && i.active);
  const giftsHTML = S.gifts ? `<section id="regalos" style="background:linear-gradient(180deg,transparent,var(--pink-l) 20%,var(--pink-l) 80%,transparent)"><div class="wrap"><div class="sec-head reveal"><span class="eyebrow">Regalos y sorpresas</span><h2>${esc(content.giftsIntro.title)}</h2><p class="lead">${esc(content.giftsIntro.subtitle)}</p></div>
    <div class="gifts">${gifts.map((g) => `<article class="gift reveal"><div class="gi" ${bg(g.photo)}>${g.photo ? '' : EMOJI[g.cat] || '🎁'}</div><div class="b"><b>${esc(g.name)}</b><small>${esc(g.desc || '')}</small><span class="pr">desde ${money(g.pmin)}</span><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" data-track="gift" href="${wa(`Hola Valnu 👋 Quiero pedir: ${g.name} (desde ${money(g.pmin)}). ¿Me ayudan con los detalles?`)}">Pedir por WhatsApp</a></div></article>`).join('')}</div></div></section>` : '';

  const seasonHTML = seasonOn ? `<section id="temporada"><div class="wrap"><div class="season reveal"><span class="eyebrow">Temporada</span><h2>${esc(season.title)}</h2><p class="lead">${esc(season.subtitle)}</p><p class="until">Disponible hasta el ${fmtShort(season.end)}</p>
    <div class="sprods">${season.products.map((p) => `<div class="sprod"><div class="si" ${bg(p.photo)}>${p.photo ? '' : '🎃'}</div><div class="sb"><b>${esc(p.name)}</b><span class="pr">${money(p.price)}</span></div></div>`).join('')}</div>
    <a class="btn" target="_blank" rel="noopener" href="${wa('Hola Valnu 👋 Quiero pedir artículos de temporada: ')}">${esc(season.cta)}</a></div></div></section>` : '';

  const howHTML = S.how ? `<section id="como"><div class="wrap"><div class="sec-head reveal"><span class="eyebrow">Cómo funciona</span><h2>Simple, <span class="hl">de punta a punta</span></h2></div><div class="how">${content.how.map((h) => `<div class="step reveal"><div class="n">${h.n}</div><h3>${esc(h.title)}</h3><p>${esc(h.text)}</p></div>`).join('')}</div></div></section>` : '';

  const testHTML = S.testimonials ? `<section id="opiniones"><div class="wrap"><div class="sec-head reveal"><span class="eyebrow">Lo que dicen</span><h2>Clientes <span class="hl">felices</span></h2></div><div class="tests">${content.testimonials.map((t) => `<div class="test reveal">${t.demo ? '<span class="tag">Ejemplo · reemplazar</span>' : ''}<q>${esc(t.text)}</q><div class="who"><i></i><span><b>${esc(t.name)}</b><br><small style="color:var(--ink-2)">${esc(t.occasion)}</small></span></div></div>`).join('')}</div></div></section>` : '';

  const locHTML = S.location ? `<section id="contacto"><div class="wrap"><div class="sec-head reveal"><span class="eyebrow">Ubicación</span><h2>${esc(content.location.title)}</h2><p class="lead">${esc(content.location.subtitle)}</p></div>
    <div class="loc reveal"><div class="loc-info"><h3 style="margin-top:0">📍 Dirección</h3><p>${esc(settings.address)}</p><h3>🕒 Horario</h3><ul>${settings.hours.map((h) => `<li>${esc(h)}</li>`).join('')}</ul><h3>🚚 Cobertura</h3><p>${esc(settings.coverage.localCity)} y alrededores: ${settings.coverage.otherCities.map(esc).join(', ')}.</p>
    <div class="row"><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${wa('Hola Valnu 👋')}">WhatsApp ${esc(settings.whatsappDisplay)}</a><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://www.instagram.com/${esc(settings.instagram)}/">Instagram @${esc(settings.instagram)}</a></div></div>
    <div class="map"><iframe loading="lazy" title="Mapa de ${esc(settings.coverage.localCity)}" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${encodeURIComponent(content.location.mapQuery)}&output=embed"></iframe></div></div>
    <div class="final reveal" style="margin-top:40px"><h2 style="margin-top:0">${esc(content.finalCta.title)}</h2><p class="lead" style="margin-inline:auto">${esc(content.finalCta.text)}</p><div class="cta-row"><a class="btn btn-primary" href="#armador">${esc(content.finalCta.cta)} →</a></div></div></div></section>` : '';

  app.innerHTML = `<header class="hdr"><div class="wrap"><a class="brand" href="#inicio"><img src="assets/img/logo.jpg" alt="Logo Valnu"><span>${esc(settings.businessName)}</span></a>
    <nav class="nav" aria-label="Principal">${nav.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}</nav>${S.builder ? '<a class="btn btn-primary btn-sm" href="#armador">Arma tu fiesta</a>' : ''}</div></header>
    <main>${heroHTML}${linesHTML}${S.builder ? '<section class="builder" id="armador"></section>' : ''}${galleryHTML}${giftsHTML}${seasonHTML}${howHTML}${testHTML}${locHTML}</main>
    <footer><div class="wrap">© ${new Date().getFullYear()} ${esc(settings.businessName)} · ${esc(settings.coverage.localCity)}, Ecuador · <a href="https://www.instagram.com/${esc(settings.instagram)}/" target="_blank" rel="noopener">@${esc(settings.instagram)}</a></div></footer>
    <a class="wa-fab" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp" href="${wa('Hola Valnu 👋 Quiero información para mi fiesta.')}">${WA_SVG}</a>
    <div class="modal" id="modal" role="dialog" aria-modal="true" aria-label="Cotizar"><div class="sheet" id="sheet"></div></div>`;

  /* hero */
  if (S.hero) initHero($('#heroCanvas'), ['#F06FA6', '#7FD1C7', '#B59BE0', '#F4C95D', '#FFB3CF', '#9ED8F0', '#C2467A']);

  /* armador */
  let builder = null;
  if (S.builder) builder = createBuilder($('#armador'), { items, categories, occasions, suggestions, settings });

  /* mosaico de líneas */
  $$('.line').forEach((el) => el.querySelector('.line-btn').addEventListener('click', () => {
    const open = !el.classList.contains('open');
    $$('.line.open').forEach((x) => { x.classList.remove('open'); x.querySelector('.line-btn').setAttribute('aria-expanded', 'false'); });
    if (open) { el.classList.add('open'); el.querySelector('.line-btn').setAttribute('aria-expanded', 'true'); }
  }));
  $$('[data-go]').forEach((b) => b.addEventListener('click', () => {
    const cat = b.dataset.go;
    if (cat === 'season') return $('#temporada') ? $('#temporada').scrollIntoView({ behavior: 'smooth' }) : builder?.preselect();
    builder?.preselect(cat);
  }));

  /* galería */
  const gal = $('#gal');
  function drawGallery(f = '') {
    if (!gal) return;
    gal.innerHTML = galleryItems.map((g, i) => ({ g, i })).filter(({ g }) => !f || g.occasion === f).map(({ g, i }) =>
      `<figure class="shot" style="--i:${i % 8}"><img loading="lazy" src="${esc(g.photo)}" alt="${esc(g.caption)}"><figcaption>${esc(g.caption)}<button class="btn btn-sm" data-want="${i}">Quiero algo así</button></figcaption></figure>`).join('');
  }
  drawGallery();
  $('#galChips')?.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; $$('#galChips button').forEach((x) => x.setAttribute('aria-pressed', x === b)); drawGallery(b.dataset.f); });

  /* modal "Quiero algo así" */
  const modal = $('#modal'), sheet = $('#sheet');
  const close = () => modal.classList.remove('open');
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.x')) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  gal?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-want]'); if (!b) return;
    const g = galleryItems[+b.dataset.want];
    sheet.innerHTML = `<button class="x" aria-label="Cerrar">×</button><h3>Quiero algo así</h3>
      <div class="ref"><img src="${esc(g.photo)}" alt=""><div><b>${esc(g.caption)}</b><br><small style="color:var(--ink-2)">${esc(occName(g.occasion))}</small></div></div>
      <div class="form-grid"><label class="field">Tu nombre<input id="wName" autocomplete="name"></label><label class="field">WhatsApp<input id="wWa" inputmode="tel" autocomplete="tel" placeholder="09XXXXXXXX"></label><label class="field full">Fecha del evento (opcional)<input type="date" id="wDate" min="${today}"></label></div>
      <div class="r-actions" style="margin-top:14px"><button class="btn btn-wa" id="wSendWa">Cotizar por WhatsApp</button><button class="btn btn-primary" id="wSendCall">Enviar y que me llamen</button><button class="btn btn-ghost" id="wBuild">Mejor lo armo yo →</button></div>`;
    modal.classList.add('open');
    const send = async (via) => {
      const contact = { name: $('#wName').value.trim() || 'Cliente (por WhatsApp)', whatsapp: $('#wWa').value.trim() };
      if (via === 'call' && contact.whatsapp.replace(/\D/g, '').length < 9) return toast('Escribe un WhatsApp válido', 'warn');
      const q = await createQuote({ contact, occasion: g.occasion, eventDate: $('#wDate').value, guests: 0, place: 'ambato', items: [], rangeMin: 0, rangeMax: 0, source: 'galeria', via, reference: { photo: g.photo, caption: g.caption } });
      if (via === 'wa') { const link = wa(quoteMessage(q, q.code, occName(g.occasion))); { const w = open(link, '_blank'); if (w) w.opener = null; else location.href = link; } }
      sheet.innerHTML = `<button class="x" aria-label="Cerrar">×</button><div class="done"><div class="big">🎉</div><b>¡Listo! Cotización #${q.code}</b><p>${via === 'call' ? 'Te escribiremos por WhatsApp muy pronto.' : 'Se abrió WhatsApp con tu pedido.'}</p></div>`;
    };
    $('#wSendWa').onclick = () => send('wa'); $('#wSendCall').onclick = () => send('call');
    $('#wBuild').onclick = () => { close(); builder?.preselect(); };
  });

  /* titulares: entrada por palabra con blur (sin desplazamiento) */
  const split = (root) => { let i = 0; const walk = (n) => [...n.childNodes].forEach((c) => {
    if (c.nodeType === 3) { const f = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach((t) => { if (!t) return; if (/^\s+$/.test(t)) f.append(' '); else { const w = document.createElement('span'); w.className = 'w'; w.style.setProperty('--i', i++); w.textContent = t; f.append(w); } }); c.replaceWith(f); }
    else if (c.nodeType === 1) walk(c); }); walk(root); };
  const h1 = $('.hero h1'); if (h1) { split(h1); requestAnimationFrame(() => $('.hero').classList.add('go')); }
  $$('.sec-head h2').forEach(split);
  $$('.reveal').forEach((el) => { const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal')); el.style.setProperty('--i', Math.min(sibs.indexOf(el), 8)); });

  /* revelar al hacer scroll */
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));

  trackEvent('visit');
}
boot().catch((e) => { console.error(e); $('#app').innerHTML = '<div class="loading" style="text-align:center;padding:24px">No pudimos cargar la página. Ábrela desde un servidor estático (ver README).</div>'; });
