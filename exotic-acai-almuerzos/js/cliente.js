/* Mi menú · cuenta del cliente: menú semanal personalizado, pausar, cambiar plato, valorar y cancelar.
   DEMO: se entra con el número de WhatsApp. En la versión real llegaría un enlace personal por WhatsApp (sin contraseña). */
(function () {
  'use strict';
  const { $, $$, esc, fmt, icon } = EA, C = CFG;
  const Q = new URLSearchParams(location.search);
  let semana = 0; // 0 = esta semana · 1 = próxima
  const FRASE = (iso) => { const d = EA.D(iso); return EA.DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][d.getMonth()]; };
  const lunesDe = (iso) => EA.addDias(iso, -((EA.dow(iso) + 6) % 7));
  const cliente = () => EA.state.subs.find((s) => s.id === EA.L.get('cliente', null));
  if (Q.get('id') && EA.state.subs.some((s) => s.id === Q.get('id'))) EA.L.set('cliente', Q.get('id'));

  /* ───────── entrada ───────── */
  function entrada() {
    $('#salir').hidden = true;
    const act = EA.state.subs.filter((s) => EA.vigente(s, EA.hoy()));
    const ej = [act.find((s) => s.plan === 'oficina' && !s.restricciones.length), act.find((s) => s.plan === 'fit'), act.find((s) => s.plan === 'especial' && s.restricciones.length)].filter(Boolean);
    const ult = EA.state.subs.filter((s) => s.demo).slice(-1)[0]; if (ult) ej.unshift(ult);
    $('#app').innerHTML = '<section class="cd"><h1>Tu menú de la semana</h1><p class="sub" style="margin:8px 0 18px">Ingresa el WhatsApp con el que te suscribiste para ver tus almuerzos, pausar o cambiar un plato.</p>' +
      '<form id="lf" class="fgrid"><label class="f"><span>Tu WhatsApp</span><input class="inp" id="tel" inputmode="tel" placeholder="09XXXXXXXX" autocomplete="tel"></label><em class="err-msg" id="te">No encontramos ese número. Revisa que sea el mismo de tu suscripción.</em><button class="btn btn-acai" type="submit">Ver mi menú</button></form>' +
      '<p class="nota" style="margin-top:14px">En la versión real no necesitas escribir nada: te llega un enlace personal por WhatsApp.</p></section>' +
      '<section class="cd"><h2>Para probar la demo</h2><p class="sub">Elige un cliente de ejemplo:</p><div class="dem">' + ej.map((s) => '<button type="button" data-id="' + s.id + '"><b>' + esc(s.nombre) + (s.demo ? ' · creado por ti' : '') + '</b><small>' + esc(C.plans[s.plan].nombre) + ' · ' + C.frecuencias[s.frec].almuerzos + ' almuerzos' + (s.restricciones.length ? ' · ' + esc(s.restricciones.join(', ')) : '') + '</small></button>').join('') + '</div></section>';
    $('#lf').onsubmit = (e) => { e.preventDefault(); const t = $('#tel').value.replace(/[\s-]/g, ''); const s = EA.state.subs.find((x) => x.tel === t); $('#te').classList.toggle('on', !s); if (s) { EA.L.set('cliente', s.id); vista(); } };
    $('.dem').onclick = (e) => { const b = e.target.closest('[data-id]'); if (b) { EA.L.set('cliente', b.dataset.id); vista(); } };
  }

  /* ───────── estado de cada día ───────── */
  function diaInfo(s, d) {
    const hoy = EA.hoy();
    if (d < s.inicio) return { t: 'off', e: 'Aún no empieza', n: 'Tu primer almuerzo es el ' + FRASE(s.inicio).toLowerCase() + '.' };
    if (s.fin && d >= s.fin) return { t: 'off', e: 'Cancelada', n: 'Tu suscripción ya no está activa.' };
    if (!EA.esLaborable(d)) return { t: 'off', e: 'Sin entrega', n: EA.dow(d) > 0 && EA.dow(d) < 6 ? 'Feriado: no hay entrega.' : '' };
    if (EA.enPausa(s, d)) return { t: 'off', e: 'En pausa', n: 'No te llega almuerzo este día.' };
    if (s.frec === 12 && ![1, 3, 5].includes(EA.dow(d))) return { t: 'off', e: 'No incluido', n: 'Tu plan es de 3 días a la semana (lun, mié y vie).' };
    const r = EA.platoPara(s, d); if (!r) return { t: 'off', e: 'Sin menú', n: '' };
    return { t: d < hoy ? 'ok' : d === hoy ? 'hoy' : 'prog', e: d < hoy ? 'Entregado' : d === hoy ? 'Hoy' : 'Programado', r };
  }

  /* ───────── vista principal ───────── */
  function vista() {
    const s = cliente(); if (!s) return entrada();
    $('#salir').hidden = false;
    const hoy = EA.hoy(), e = ADM_estado(s), lun = EA.addDias(lunesDe(hoy), 7 * semana), dias = [0, 1, 2, 3, 4].map((i) => EA.addDias(lun, i));
    const infos = dias.map((d) => diaInfo(s, d)), con = infos.filter((x) => x.r), kcal = con.reduce((n, x) => n + x.r.plato.kcal, 0), prot = con.reduce((n, x) => n + x.r.plato.p, 0);
    const ren = e === 'cancelado' ? null : EA.proximaRenovacion(s);
    const pagos = EA.state.pagos.filter((p) => p.sub === s.id).sort((a, b) => b.f.localeCompare(a.f)).slice(0, 4);
    const extra = (EA.zona(s.zona) || {}).extra || 0;
    $('#app').innerHTML =
      '<section class="resumen"><div><span class="pill' + (e === 'activo' ? '' : ' p') + '">' + e + '</span></div><h1>Hola, ' + esc(s.nombre.split(' ')[0]) + '</h1>' +
      '<div class="meta"><div><span>Plan</span><b>' + esc(C.plans[s.plan].nombre) + '</b></div><div><span>Almuerzos</span><b>' + C.frecuencias[s.frec].almuerzos + ' al mes' + (s.porcion !== 'normal' ? ' · ' + s.porcion : '') + '</b></div><div><span>' + (s.zona === 'retiro' ? 'Retiro' : 'Entrega') + '</span><b>' + (s.zona === 'retiro' ? 'En el local' : esc(EA.zona(s.zona).nombre) + ' · ' + esc(s.ventana)) + '</b></div><div><span>Próximo cobro</span><b>' + (ren ? fmt.fechaCorta(ren) + ' · ' + fmt.money(s.precio + extra) : '—') + '</b></div></div>' +
      (e !== 'cancelado' ? '<div class="acc">' + (e === 'pausado' ? '<button class="btn btn-verde" id="rs">Reanudar mis almuerzos</button>' : '<button class="btn btn-claro" id="ps">Pausar días</button>') + '<button class="btn btn-borde" id="cn">Cancelar suscripción</button><a class="btn btn-borde" target="_blank" rel="noopener" href="' + EA.wa('Hola Exotic Açaí, soy ' + s.nombre + ' (' + s.id + ').') + '">Escribir por WhatsApp</a></div>' : '<p>Tu suscripción está cancelada. <a href="suscribirse.html" style="color:var(--hoja-claro);font-weight:700">Vuelve a suscribirte</a></p>') + '</section>' +
      '<section class="cd"><div class="tabs" role="tablist"><button class="tab" role="tab" data-w="0" aria-selected="' + (semana === 0) + '">Esta semana</button><button class="tab" role="tab" data-w="1" aria-selected="' + (semana === 1) + '">Próxima semana</button></div>' +
      (con.length ? '<div class="tot" style="margin-top:14px"><div><b>' + con.length + '</b><span>almuerzos</span></div><div><b>' + fmt.num(kcal / con.length) + '</b><span>kcal por día</span></div><div><b>' + fmt.num(prot / con.length) + ' g</b><span>proteína por día</span></div></div>' : '') + '</section>' +
      '<section class="dias" id="dias">' + dias.map((d, i) => tarjeta(s, d, infos[i], hoy)).join('') + '</section>' +
      '<section class="cd"><h2>Mis cobros</h2><ul class="pagos">' + (pagos.map((p) => '<li><span>' + fmt.fecha(p.f) + '</span><span><b>' + fmt.money(p.monto) + '</b> <span class="st ' + p.estado + '">' + p.estado + '</span></span></li>').join('') || '<li>Sin cobros todavía.</li>') + '</ul><p class="nota" style="margin-top:10px">Facturación electrónica: próximamente.</p></section>';
    cablear(s);
  }
  const ADM_estado = (s) => (s.fin && s.fin <= EA.hoy() ? 'cancelado' : EA.enPausa(s, EA.hoy()) ? 'pausado' : 'activo');

  function tarjeta(s, d, i, hoy) {
    const cab = '<div class="dh"><b>' + EA.DIAS[EA.dow(d)] + '<small>' + FRASE(d).replace(EA.DIAS[EA.dow(d)] + ' ', '') + '</small></b><span class="est ' + i.t + '">' + i.e + '</span></div>';
    if (!i.r) return '<article class="dia off">' + cab + (i.n ? '<p class="nota" style="padding:0 16px 14px">' + esc(i.n) + '</p>' : '') + '</article>';
    const p = i.r.plato, voto = EA.state.votos[s.id + '|' + d];
    const horario = s.zona === 'retiro' ? 'Retiras en el local' : 'Llega entre ' + esc(s.ventana);
    return '<article class="dia con' + (i.t === 'hoy' ? ' hoy' : '') + '">' + cab + '<div class="dimg"><img src="' + esc(p.foto) + '" alt="' + esc(p.nombre) + ' (foto referencial)" loading="lazy"></div><div class="dc"><h3>' + esc(p.nombre) + '</h3><p>' + esc(p.desc) + '</p>' +
      '<div class="tags">' + p.tags.map((t) => '<span class="tag' + (t === 'alto en proteína' ? ' v' : '') + '">' + esc(t) + '</span>').join('') + (i.r.cambiado ? '<span class="tag v">cambiado por ti</span>' : '') + (i.r.ajuste ? '<span class="tag">Leo ajustará a tu dieta</span>' : '') + '</div>' +
      '<div class="mac"><div><b>' + p.kcal + '</b><span>kcal</span></div><div><b>' + p.p + ' g</b><span>Proteína</span></div><div><b>' + p.c + ' g</b><span>Carbos</span></div><div><b>' + p.g + ' g</b><span>Grasa</span></div></div>' +
      '<div class="dacc">' + (i.t === 'ok' ? (voto ? '<span class="nota">Tu valoración: ' + '★'.repeat(voto) + ' · gracias</span>' : '<span class="nota">¿Qué tal estuvo?</span><span class="estr" role="group" aria-label="Valorar">' + [1, 2, 3, 4, 5].map((n) => '<button type="button" data-v="' + d + ':' + p.id + ':' + n + '" aria-label="' + n + ' estrellas">★</button>').join('') + '</span>') : '<span class="nota">' + icon('clock') + ' ' + horario + '</span>' + (i.t === 'prog' && d > hoy ? '<button class="mini" type="button" data-c="' + d + '" style="margin-left:auto">Cambiar plato</button>' : '')) + '</div></div></article>';
  }

  /* ───────── acciones ───────── */
  function cablear(s) {
    $$('[data-w]').forEach((b) => (b.onclick = () => { semana = +b.dataset.w; vista(); }));
    const q = (id, fn) => { const b = $(id); if (b) b.onclick = fn; };
    q('#ps', () => pausar(s)); q('#rs', () => { const m = EA.addDias(EA.hoy(), 1); EA.patchSub(s.id, { pausas: (s.pausas || []).map((x) => (x[1] == null ? [x[0], m] : x)) }); EA.toast('Retomas desde mañana'); vista(); });
    q('#cn', () => { const m = EA.modal({ title: '¿Cancelar tu suscripción?', body: '<p>Dejarás de recibir almuerzos y no se te vuelve a cobrar. Puedes volver a suscribirte cuando quieras.</p><div class="btn-fila"><button class="btn btn-ghost btn-sm" data-close>Mejor no</button><button class="btn btn-acai btn-sm" id="ok">Sí, cancelar</button></div>', noFocus: true }); m.el.querySelector('#ok').onclick = () => { EA.patchSub(s.id, { fin: EA.hoy() }); m.close(); EA.toast('Suscripción cancelada'); vista(); }; });
    $('#dias').onclick = (e) => {
      const v = e.target.closest('[data-v]'); if (v) { const [d, pid, n] = v.dataset.v.split(':'); valorar(s, d, pid, +n); return; }
      const c = e.target.closest('[data-c]'); if (c) cambiar(s, c.dataset.c);
    };
  }
  function valorar(s, d, pid, n) {
    const m = EA.modal({ title: '¿Qué tal estuvo?', body: '<p style="font-size:1.6rem;color:var(--hoja)">' + '★'.repeat(n) + '<span style="color:var(--acai-200)">' + '★'.repeat(5 - n) + '</span></p><label class="f" style="margin-top:10px"><span>Cuéntanos más (opcional)</span><textarea class="inp" id="cm" maxlength="160" placeholder="Ej.: me quedé con hambre / muy rico"></textarea></label><div class="btn-fila"><button class="btn btn-ghost btn-sm" data-close>Cancelar</button><button class="btn btn-acai btn-sm" id="ok">Enviar</button></div>', noFocus: true });
    m.el.querySelector('#ok').onclick = () => { EA.valorarPlato(s.id, d, pid, n, m.el.querySelector('#cm').value.trim()); m.close(); EA.toast('¡Gracias! Leo ve tu opinión'); vista(); };
  }
  function cambiar(s, d) {
    const actual = EA.platoPara(s, d).plato, opts = (EA.state.semana[String(EA.dow(d))] || []).map(EA.plato).filter((p) => p && p.id !== actual.id && (s.restricciones || []).every((r) => p.tags.includes(r)));
    const original = EA.state.cambios[s.id] && EA.state.cambios[s.id][d];
    const m = EA.modal({ title: 'Cambiar el plato del ' + FRASE(d).toLowerCase(), body: opts.length ? '<p class="sub">Elige otro plato del día. Respetamos tu dieta.</p><div class="opts" style="margin-top:12px">' + opts.map((p, i) => '<label class="opt"><input type="radio" name="pl" value="' + p.id + '"' + (i === 0 ? ' checked' : '') + '><span><b>' + esc(p.nombre) + '</b><small>' + p.kcal + ' kcal · ' + p.p + ' g proteína</small></span></label>').join('') + '</div><div class="btn-fila">' + (original ? '<button class="btn btn-ghost btn-sm" id="rv">Volver al original</button>' : '') + '<button class="btn btn-ghost btn-sm" data-close>Cancelar</button><button class="btn btn-acai btn-sm" id="ok">Confirmar cambio</button></div>' : '<p>Ese día no hay otro plato que respete tu dieta. Escríbenos y Leo te propone uno.</p><div class="btn-fila"><a class="btn btn-verde btn-sm" target="_blank" rel="noopener" href="' + EA.wa('Hola, quiero cambiar mi plato del ' + FRASE(d) + ' (' + s.id + ').') + '">Escribir por WhatsApp</a></div>', noFocus: true });
    const ok = m.el.querySelector('#ok'), rv = m.el.querySelector('#rv');
    if (ok) ok.onclick = () => { EA.cambiarPlato(s.id, d, m.el.querySelector('input[name=pl]:checked').value); m.close(); EA.toast('Cambio guardado'); vista(); };
    if (rv) rv.onclick = () => { EA.cambiarPlato(s.id, d, null); m.close(); vista(); };
  }
  function pausar(s) {
    const man = EA.addDias(EA.hoy(), 1);
    const m = EA.modal({ title: 'Pausar mis almuerzos', body: '<p class="sub">Avísanos con al menos 24 horas. No se entregan almuerzos en esos días.</p><div class="fgrid c2" style="margin-top:12px"><label class="f"><span>Pausar desde</span><input class="inp" type="date" id="pa" min="' + man + '" value="' + man + '"></label><label class="f"><span>Retomo el</span><input class="inp" type="date" id="pb" min="' + EA.addDias(man, 1) + '" value="' + EA.addDias(man, 7) + '"></label></div><em class="err-msg" id="pe">La fecha de regreso debe ser posterior al inicio de la pausa.</em><div class="btn-fila"><button class="btn btn-ghost btn-sm" data-close>Cancelar</button><button class="btn btn-acai btn-sm" id="ok">Confirmar pausa</button></div>', noFocus: true });
    m.el.querySelector('#ok').onclick = () => { const a = m.el.querySelector('#pa').value, b = m.el.querySelector('#pb').value; if (!a || !b || b <= a || a < man) { m.el.querySelector('#pe').classList.add('on'); return; } EA.patchSub(s.id, { pausas: (s.pausas || []).concat([[a, b]]) }); m.close(); EA.toast('Pausa registrada'); vista(); };
  }

  $('#salir').onclick = () => { EA.L.del('cliente'); history.replaceState(null, '', 'mi-menu.html'); entrada(); };
  vista();
})();
