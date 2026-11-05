/* Landing · render dinámico desde config/plans.js y el menú del store (editable desde /admin › Menús) */
(function () {
  'use strict';
  const { $, $$, esc, fmt, icon } = EA, C = CFG;
  const Q = new URLSearchParams(location.search);
  const S = { publico: 'oficina', frec: 20, dia: 1, tag: '' };
  try { S.publico = sessionStorage.getItem('ea_pub') || S.publico; } catch (e) {}
  if (C.publicos[Q.get('publico')]) S.publico = Q.get('publico');
  const w = EA.dow(EA.hoy()); S.dia = w >= 1 && w <= 5 ? w : 1;
  const GO = '<svg class="ic go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
  const PUB_ICON = { oficina: 'briefcase', gym: 'dumbbell', especial: 'sprout' };
  const SLOT = { oficina: 0, fit: 1, especial: 2 };
  const utm = () => { const p = new URLSearchParams(); ['utm_source', 'utm_campaign', 'utm_medium'].forEach((k) => Q.get(k) && p.set(k, Q.get(k))); return p; };

  /* ── tracking ── */
  EA.trackOnce('visita');
  document.addEventListener('click', (e) => {
    const wa = e.target.closest('a[href*="wa.me"]'); if (wa) EA.track('wa_click');
    const cta = e.target.closest('[data-cta]'); if (cta) EA.track('cta_' + cta.dataset.cta);
  });

  /* ── hero ── */
  function heroPlato() {
    const pub = C.publicos[S.publico], pl = C.plans[pub.plan];
    const ids = EA.state.semana[String(S.dia)] || []; const p = EA.plato(ids[SLOT[pub.plan]]) || EA.plato(ids[0]);
    if (!p) return;
    $('#h-img').src = p.foto; $('#h-p').textContent = p.p + ' g'; $('#h-k').textContent = p.kcal; $('#h-nombre').textContent = p.nombre;
    $('#h-plato').classList.remove('swap'); void $('#h-plato').offsetWidth; $('#h-plato').classList.add('swap');
  }
  function renderHero() {
    const pub = C.publicos[S.publico], pl = C.plans[pub.plan];
    $('#h-titulo').textContent = pub.h1; $('#h-sub').textContent = pub.sub;
    $('#selector').innerHTML = Object.values(C.publicos).map((p) => '<button class="chip" aria-pressed="' + (p.id === S.publico) + '" data-pub="' + p.id + '">' + icon(PUB_ICON[p.id]) + p.label + '</button>').join('');
    $('#h-ancla').innerHTML = esc(pl.nombre) + ' · desde <b>' + fmt.money(pl.precio20, 0) + '/mes</b> · equivale a <b>' + fmt.money(EA.porDia(pl.id, 20)) + ' por almuerzo</b>';
    $('#h-puntos').innerHTML = pub.puntos.map((t) => '<li>' + icon('check') + esc(t) + '</li>').join('');
    heroPlato();
  }
  $('#selector').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pub]'); if (!b) return;
    S.publico = b.dataset.pub; try { sessionStorage.setItem('ea_pub', S.publico); } catch (er) {}
    EA.track('selector_' + S.publico);
    renderHero(); renderPlanes(); renderTabla();
  });

  /* ── menú ── */
  function renderMenu() {
    const dias = [['1', 'Lun'], ['2', 'Mar'], ['3', 'Mié'], ['4', 'Jue'], ['5', 'Vie']];
    $('#dias').innerHTML = dias.map(([n, l]) => '<button role="tab" class="dia" aria-selected="' + (+n === S.dia) + '" data-dia="' + n + '"><span>' + l + '</span>' + (+n === S.dia && S.dia === w ? '<i>hoy</i>' : '') + '</button>').join('');
    const usadas = Array.from(new Set(EA.state.platos.flatMap((p) => p.tags)));
    $('#filtros').innerHTML = '<button class="chip" aria-pressed="' + !S.tag + '" data-tag="">Todos</button>' + C.etiquetas.filter((t) => usadas.includes(t)).map((t) => '<button class="chip" aria-pressed="' + (S.tag === t) + '" data-tag="' + esc(t) + '">' + esc(t) + '</button>').join('');
    const planDe = ['Plan Oficina', 'Plan Fit / Gym', 'Plan Especial'];
    const ids = EA.state.semana[String(S.dia)] || [];
    const lista = ids.map(EA.plato).filter(Boolean);
    $('#platos').innerHTML = lista.map((p) => {
      const dim = S.tag && !p.tags.includes(S.tag);
      const tot = p.p + p.c + p.g || 1;
      return '<article class="plato-card' + (dim ? ' dim' : '') + '"><div class="pc-img"><img src="' + esc(p.foto) + '" alt="' + esc(p.nombre) + ' (foto referencial)" loading="lazy" width="320" height="260"><span class="pc-plan">' + planDe[p.slot] + '</span></div>' +
        '<div class="pc-body"><h3>' + esc(p.nombre) + '</h3><p>' + esc(p.desc) + '</p><div class="tags">' + p.tags.map((t) => '<span class="tag' + (t === 'alto en proteína' ? '' : t === 'balanceado' ? ' c' : ' p') + '">' + esc(t) + '</span>').join('') + '</div>' +
        '<div class="macros"><div class="kc"><b>' + p.kcal + '</b><span>kcal</span></div>' +
        '<div class="mc"><div><b>' + p.p + ' g</b><span>Proteína</span></div><div><b>' + p.c + ' g</b><span>Carbos</span></div><div><b>' + p.g + ' g</b><span>Grasa</span></div></div>' +
        '<div class="barra" aria-hidden="true"><i style="width:' + (p.p / tot * 100) + '%"></i><i style="width:' + (p.c / tot * 100) + '%"></i><i style="width:' + (p.g / tot * 100) + '%"></i></div></div></div></article>';
    }).join('');
  }
  $('#dias').addEventListener('click', (e) => { const b = e.target.closest('[data-dia]'); if (!b) return; S.dia = +b.dataset.dia; renderMenu(); heroPlato(); });
  $('#filtros').addEventListener('click', (e) => { const b = e.target.closest('[data-tag]'); if (!b) return; S.tag = b.dataset.tag; renderMenu(); });

  /* ── planes ── */
  function planHref(id) { const p = utm(); p.set('plan', id); p.set('frec', S.frec); p.set('publico', S.publico); return 'suscribirse.html?' + p.toString(); }
  function renderPlanes() {
    const rec = C.publicos[S.publico].plan;
    $$('.frec .chip').forEach((b) => { const on = +b.dataset.frec === S.frec; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    $('#planes-grid').innerHTML = Object.values(C.plans).map((p) => {
      const precio = EA.precioSub(p.id, S.frec), dia = EA.porDia(p.id, S.frec), esRec = p.id === rec;
      return '<article class="plan' + (esRec ? ' rec' : '') + '">' + (esRec ? '<span class="rib">Recomendado para ' + esc(C.publicos[S.publico].label.toLowerCase()) + '</span>' : '') +
        '<h3>' + esc(p.nombre) + '</h3><p class="corto">' + esc(p.corto) + '</p>' +
        '<div class="precio"><b>' + fmt.money(precio, 0) + '</b><span>/mes</span></div>' +
        '<p class="dia">Equivale a <b>' + fmt.money(dia) + '</b> por almuerzo · ' + C.frecuencias[S.frec].almuerzos + ' almuerzos</p>' +
        '<p class="desc">' + esc(p.descripcion) + '</p>' +
        '<ul>' + p.incluye.map((i) => '<li>' + icon('check') + esc(i) + '</li>').join('') + '</ul>' +
        '<a class="btn ' + (esRec ? 'btn-verde' : 'btn-claro') + '" href="' + planHref(p.id) + '" data-cta="plan_' + p.id + '">Empezar con este plan ' + GO + '</a></article>';
    }).join('');
  }
  $('.frec').addEventListener('click', (e) => { const b = e.target.closest('[data-frec]'); if (!b) return; S.frec = +b.dataset.frec; renderPlanes(); renderTabla(); });
  function renderTabla() {
    const P = Object.values(C.plans), f = S.frec;
    const filas = [
      ['Almuerzos al mes', () => C.frecuencias[f].almuerzos],
      ['Precio al mes (IVA incl.)', (p) => '<b>' + fmt.money(EA.precioSub(p.id, f), 0) + '</b>'],
      ['Por almuerzo', (p) => fmt.money(EA.porDia(p.id, f))],
      ['Proteína por plato', (p) => ({ oficina: '33–38 g', fit: '46–52 g', especial: '22–36 g' }[p.id])],
      ['Macros y kcal visibles', () => '✓'],
      ['Porción volumen o definición', (p) => (p.id === 'fit' ? '✓' : '—')],
      ['Keto, vegano, sin gluten, bajo en azúcar', (p) => (p.id === 'especial' ? '✓' : '—')],
      ['Menús diseñados por Leo, nutricionista', (p) => (p.id === 'especial' ? '✓ personalizado' : '✓')],
      ['Pausa y cancelación', () => '✓']
    ];
    $('#tabla').innerHTML = '<table class="cmp"><thead><tr><th></th>' + P.map((p) => '<th' + (p.id === C.publicos[S.publico].plan ? ' class="rec"' : '') + '>' + esc(p.nombre) + '</th>').join('') + '</tr></thead><tbody>' +
      filas.map(([t, fn]) => '<tr><th scope="row">' + t + '</th>' + P.map((p) => '<td' + (p.id === C.publicos[S.publico].plan ? ' class="rec"' : '') + '>' + fn(p) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
  }

  /* ── equipo ── */
  const BIO = { daniel: 'Mantiene la plataforma de suscripciones funcionando.', nicolas: 'Dueño de Exotic Açaí. Cocina cada plato y responde por cada entrega.', leo: 'Diseña los menús y calcula los macros de cada plato.', cris: 'Muestra en redes lo que cocinamos cada semana.', salo: 'Cuida que el precio fijo sea sostenible.' };
  const orden = ['nicolas', 'leo', 'cris', 'salo', 'daniel'];
  function renderEquipo() {
    $('#equipo-grid').innerHTML = orden.map((id) => C.equipo.find((u) => u.id === id)).map((u) => '<article class="miembro"><span class="av" aria-hidden="true" data-foto="equipo-' + u.id + '.jpg">' + esc(u.iniciales) + '</span><h3>' + esc(u.corto || u.nombre) + '</h3><p class="cargo">' + esc(u.cargo) + '</p><p>' + BIO[u.id] + '</p></article>').join('');
  }

  /* ── zonas ── */
  function renderZonas() {
    $('#zonas-list').innerHTML = C.zonas.filter((z) => !z.local).map((z) => '<li><span>' + icon('pin') + esc(z.nombre) + '</span><b>' + (z.extra ? '+' + fmt.money(z.extra, 0) + '/mes' : 'Incluido') + '</b></li>').join('');
    $('#ventanas').innerHTML = C.ventanas.map((v) => '<li>' + icon('clock') + v + '</li>').join('');
    $('#ic-store').innerHTML = icon('store');
    $('#retiro-dir').textContent = C.negocio.direccion + ' · ' + C.negocio.horarioLocal;
    $('#wa-zona').href = EA.wa('Hola, quiero saber si entregan en mi zona (almuerzos Exotic Açaí).');
  }

  /* ── faq ── */
  function lunesProximo() { let d = EA.addDias(EA.hoy(), 1); while (EA.dow(d) !== 1) d = EA.addDias(d, 1); return d; }
  function renderFaq() {
    const lun = EA.D(lunesProximo()); const lunTxt = EA.DIAS[1].toLowerCase() + ' ' + lun.getDate() + ' de ' + ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][lun.getMonth()];
    const F = [
      ['¿Puedo pausar mi suscripción?', 'Sí. Avísanos por WhatsApp con 24 horas de anticipación y pausamos los días que no estarás. El ajuste se aplica en tu siguiente cobro.'],
      ['¿Puedo cancelar cuando quiera?', 'Sí. No hay permanencia mínima. Cancelas antes de tu fecha de renovación y no se te vuelve a cobrar.'],
      ['¿Puedo cambiar los platos?', 'Cada día recibes el plato de tu plan. Si hay algo que no comes, escríbenos con anticipación y Leo propone un reemplazo con macros parecidos.'],
      ['¿Qué pasa si tengo alergias?', 'Las registras en el paso 2 al suscribirte. Leo revisa tu menú y Nicolás las tiene presentes al cocinar. Nuestra cocina maneja varios ingredientes, así que no podemos asegurar ausencia total de trazas.'],
      ['¿Cuándo empiezo?', 'Si te suscribes ahora, tu primer almuerzo llega el ' + lunTxt + '. Antes de empezar recibes tu menú de la primera semana.'],
      ['¿Cómo y cuándo pago?', 'Pagas una vez al mes, con tarjeta o transferencia. En esta demo el pago es simulado y no se cobra nada.'],
      ['¿Entregan en feriados?', 'No. Los feriados no hay entrega y te avisamos antes por WhatsApp.']
    ];
    $('#faq-list').innerHTML = F.map(([q, a], i) => '<details' + (i === 0 ? ' open' : '') + '><summary>' + q + icon('down') + '</summary><p>' + a + '</p></details>').join('');
    $('#final-s').textContent = 'Elige tu plan hoy y tu primer almuerzo llega el ' + lunTxt + '.';
  }

  /* ── enlaces de contacto ── */
  function contactos() {
    $('#wa-flot').href = EA.wa('Hola Exotic Açaí, quiero información de la suscripción de almuerzos.');
    $('#pie-wa').href = EA.wa('Hola Exotic Açaí'); $('#pie-ig').href = C.negocio.instagram; $('#pie-dir').textContent = C.negocio.direccion + ', ' + C.negocio.ciudad;
  }

  /* ── barra fija móvil y reveal ── */
  const hero = $('#inicio');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => $('#sticky').classList.toggle('on', !en.isIntersecting && scrollY > 200), { threshold: 0 }).observe(hero);
    const fin = $('#final'), pl = $('#planes');
    new IntersectionObserver((es) => { const vis = es.some((x) => x.isIntersecting); $('#sticky').classList.toggle('hide', vis); }, { threshold: .25 }).observe(fin);
    const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: .08 });
    $$('.sec-head, .pasos li, .plan, .miembro, .zonas li, .faq details, .horarios').forEach((el) => { el.classList.add('rv'); io.observe(el); });
  }

  renderHero(); renderMenu(); renderPlanes(); renderTabla(); renderEquipo(); renderZonas(); renderFaq(); contactos();
})();
