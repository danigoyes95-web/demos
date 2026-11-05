/* Flujo de suscripción · 5 pasos + bienvenida. Pago SIMULADO. */
(function () {
  'use strict';
  const { $, $$, esc, fmt, icon } = EA, C = CFG;
  const Q = new URLSearchParams(location.search);
  const KEY = 'ea_flujo_v1';
  const OBJ = [
    { id: 'oficina', t: 'Comer sano en la oficina', d: 'Sin pensar qué almorzar ni perder tiempo.', ic: 'briefcase', publico: 'oficina', plan: 'oficina', porcion: 'normal' },
    { id: 'musculo', t: 'Ganar músculo', d: 'Más proteína y calorías por plato.', ic: 'dumbbell', publico: 'gym', plan: 'fit', porcion: 'volumen' },
    { id: 'peso', t: 'Perder peso', d: 'Porciones medidas, proteína alta.', ic: 'target', publico: 'gym', plan: 'fit', porcion: 'definicion' },
    { id: 'especial', t: 'Dieta especial', d: 'Keto, vegano, sin gluten o bajo en azúcar.', ic: 'sprout', publico: 'especial', plan: 'especial', porcion: 'normal' }
  ];
  const PASOS = ['Objetivo', 'Restricciones', 'Plan', 'Entrega', 'Pago'];
  let ST = { paso: 1, objetivo: '', restricciones: [], alergias: [], otras: '', plan: '', frec: 20, porcion: 'normal', inicio: '', tipo: 'domicilio', zona: '', direccion: '', referencia: '', ventana: C.ventanas[1], nombre: '', tel: '', email: '', hecho: null };
  try { Object.assign(ST, JSON.parse(sessionStorage.getItem(KEY) || '{}')); } catch (e) {}
  if (!ST.inicio) ST.inicio = lunes(0);
  // llegada desde la landing con ?plan=&frec=&publico=
  if (Q.get('plan') && C.plans[Q.get('plan')] && !ST.objetivo) {
    ST.plan = Q.get('plan'); ST.frec = Q.get('frec') === '12' ? 12 : 20;
    const o = OBJ.find((x) => x.plan === ST.plan && x.publico === Q.get('publico')) || OBJ.find((x) => x.plan === ST.plan);
    if (o) { ST.objetivo = o.id; ST.porcion = o.porcion; }
  }
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} };

  function lunes(n) { let d = EA.addDias(EA.hoy(), 1); while (EA.dow(d) !== 1) d = EA.addDias(d, 1); return EA.addDias(d, 7 * n); }
  const fechaL = (iso) => { const d = EA.D(iso); return EA.DIAS[d.getDay()].toLowerCase() + ' ' + d.getDate() + ' de ' + ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][d.getMonth()]; };
  const obj = () => OBJ.find((o) => o.id === ST.objetivo);
  const planRec = () => (ST.restricciones.length ? 'especial' : obj() ? obj().plan : 'oficina');
  const extraZona = () => (ST.tipo === 'domicilio' && EA.zona(ST.zona) ? EA.zona(ST.zona).extra : 0);
  const precio = () => (ST.plan ? EA.precioSub(ST.plan, ST.frec) : 0);
  const total = () => precio() + extraZona();

  /* ───────── progreso y resumen ───────── */
  function renderProg() {
    const p = ST.hecho ? 6 : ST.paso;
    $('#prog').innerHTML = '<div class="barra" role="progressbar" aria-valuemin="1" aria-valuemax="5" aria-valuenow="' + Math.min(p, 5) + '">' + PASOS.map((n, i) => '<i class="' + (i + 1 < p ? 'ok' : i + 1 === p ? 'on' : '') + '"></i>').join('') + '</div><p class="prog-t">' + (ST.hecho ? '¡Listo!' : 'Paso ' + p + ' de 5 · <b>' + PASOS[p - 1] + '</b>') + '</p>';
  }
  function renderResumen() {
    const el = $('#resumen');
    if (ST.hecho || !ST.plan) { el.innerHTML = ST.hecho ? '' : '<h3>Tu suscripción</h3><p class="hint">Aquí verás tu plan y el precio mientras avanzas.</p>'; el.classList.toggle('vacio', !ST.plan); return; }
    const pl = C.plans[ST.plan], ex = extraZona();
    el.classList.remove('vacio');
    el.innerHTML = '<h3>Tu suscripción</h3><dl><div><dt>Plan</dt><dd>' + esc(pl.nombre) + '</dd></div><div><dt>Frecuencia</dt><dd>' + C.frecuencias[ST.frec].almuerzos + ' almuerzos · ' + C.frecuencias[ST.frec].dias + '</dd></div>' +
      (ST.plan === 'fit' ? '<div><dt>Porción</dt><dd>' + (ST.porcion === 'volumen' ? 'Volumen' : ST.porcion === 'definicion' ? 'Definición' : 'Normal') + '</dd></div>' : '') +
      (ST.restricciones.length ? '<div><dt>Dieta</dt><dd>' + esc(ST.restricciones.join(', ')) + '</dd></div>' : '') +
      (ex ? '<div><dt>Extra de zona</dt><dd>' + fmt.money(ex, 0) + '</dd></div>' : '') + '</dl>' +
      '<div class="tot"><span>Total al mes</span><b>' + fmt.money(total(), 2) + '</b></div><p class="hint">Equivale a ' + fmt.money(total() / C.frecuencias[ST.frec].almuerzos) + ' por almuerzo · IVA incluido</p>';
  }

  /* ───────── pasos ───────── */
  const V = {};
  V[1] = () => '<h1>¿Cuál es tu objetivo?</h1><p class="sub">Con esto te recomendamos el plan. Puedes cambiarlo en el paso 3.</p><div class="opts" role="radiogroup" aria-label="Objetivo">' +
    OBJ.map((o) => '<button type="button" class="opt' + (ST.objetivo === o.id ? ' on' : '') + '" role="radio" aria-checked="' + (ST.objetivo === o.id) + '" data-obj="' + o.id + '"><span class="oi">' + icon(o.ic) + '</span><span><b>' + o.t + '</b><small>' + o.d + '</small></span></button>').join('') + '</div>';
  V[2] = () => '<h1>¿Algo que no comas?</h1><p class="sub">Leo, nuestro nutricionista, revisa lo que registres aquí para armar tu menú.</p>' +
    '<h2>Tipo de dieta</h2><div class="chips" data-grp="restricciones">' + C.restricciones.map((r) => '<button type="button" class="chip" aria-pressed="' + ST.restricciones.includes(r) + '" data-v="' + esc(r) + '">' + esc(r) + '</button>').join('') + '</div>' +
    '<h2>Alergias</h2><div class="chips" data-grp="alergias">' + C.alergias.map((r) => '<button type="button" class="chip" aria-pressed="' + ST.alergias.includes(r) + '" data-v="' + esc(r) + '">' + esc(r) + '</button>').join('') + '</div>' +
    '<label class="f" style="margin-top:18px"><span>Otras alergias o alimentos que no comes (opcional)</span><textarea class="inp" id="otras" maxlength="240" placeholder="Ej.: no como cilantro">' + esc(ST.otras) + '</textarea></label>' +
    '<p class="aviso">' + icon('info') + '<span>Esto es una preferencia de menú, no una indicación médica. Si tienes una condición de salud, consúltalo con tu médico. Nuestra cocina maneja varios ingredientes y no podemos asegurar ausencia total de trazas.</span></p>';
  V[3] = () => {
    const rec = planRec(); if (!ST.plan) ST.plan = rec;
    const cards = Object.values(C.plans).map((p) => '<button type="button" class="plan-o' + (ST.plan === p.id ? ' on' : '') + '" role="radio" aria-checked="' + (ST.plan === p.id) + '" data-plan="' + p.id + '">' + (p.id === rec ? '<span class="rec">Recomendado para ti</span>' : '') +
      '<span class="pn"><b>' + esc(p.nombre) + '</b><small>' + esc(p.corto) + '</small></span><span class="pp"><b>' + fmt.money(EA.precioSub(p.id, ST.frec), 0) + '</b><small>' + fmt.money(EA.porDia(p.id, ST.frec)) + ' por almuerzo</small></span></button>').join('');
    const dias = Object.entries(C.frecuencias).map(([k, f]) => '<button type="button" class="chip' + (ST.frec == k ? ' on' : '') + '" aria-pressed="' + (ST.frec == k) + '" data-frec="' + k + '">' + f.label + ' · ' + f.almuerzos + ' almuerzos</button>').join('');
    const lun = [0, 1, 2].map((n) => lunes(n));
    return '<h1>Elige tu plan</h1><p class="sub">Precios con IVA incluido. Pagas una vez al mes.</p><div class="planes-o" role="radiogroup" aria-label="Plan">' + cards + '</div>' +
      '<h2>Frecuencia</h2><div class="chips">' + dias + '</div>' +
      (ST.plan === 'fit' ? '<h2>Porción</h2><div class="chips">' + ['normal', 'volumen', 'definicion'].map((p) => '<button type="button" class="chip' + (ST.porcion === p ? ' on' : '') + '" aria-pressed="' + (ST.porcion === p) + '" data-porcion="' + p + '">' + { normal: 'Normal', volumen: 'Volumen', definicion: 'Definición' }[p] + '</button>').join('') + '</div>' : '') +
      '<label class="f" style="margin-top:18px"><span>Primer almuerzo</span><select class="inp" id="inicio">' + lun.map((d) => '<option value="' + d + '"' + (ST.inicio === d ? ' selected' : '') + '>' + fechaL(d) + '</option>').join('') + '</select></label>';
  };
  V[4] = () => {
    const zs = C.zonas.filter((z) => !z.local);
    return '<h1>¿Dónde te lo llevamos?</h1><p class="sub">Entrega de lunes a viernes, excepto feriados.</p>' +
      '<div class="opts dos" role="radiogroup" aria-label="Tipo de entrega"><button type="button" class="opt' + (ST.tipo === 'domicilio' ? ' on' : '') + '" role="radio" aria-checked="' + (ST.tipo === 'domicilio') + '" data-tipo="domicilio"><span class="oi">' + icon('truck') + '</span><span><b>Entrega</b><small>En tu oficina o casa</small></span></button>' +
      '<button type="button" class="opt' + (ST.tipo === 'retiro' ? ' on' : '') + '" role="radio" aria-checked="' + (ST.tipo === 'retiro') + '" data-tipo="retiro"><span class="oi">' + icon('store') + '</span><span><b>Retiro en local</b><small>' + esc(C.negocio.direccion) + '</small></span></button></div>' +
      (ST.tipo === 'domicilio' ? '<div class="grid2"><label class="f"><span>Zona</span><select class="inp" id="zona"><option value="">Elige tu zona</option>' + zs.map((z) => '<option value="' + z.id + '"' + (ST.zona === z.id ? ' selected' : '') + '>' + z.nombre + (z.extra ? ' (+' + fmt.money(z.extra, 0) + '/mes)' : '') + '</option>').join('') + '</select><em class="err-msg" data-e="zona">Elige una zona</em></label>' +
        '<label class="f"><span>Dirección</span><input class="inp" id="direccion" value="' + esc(ST.direccion) + '" placeholder="Calle principal y secundaria" autocomplete="street-address"><em class="err-msg" data-e="direccion">Escribe tu dirección</em></label>' +
        '<label class="f full"><span>Referencia (opcional)</span><input class="inp" id="referencia" value="' + esc(ST.referencia) + '" placeholder="Edificio, piso, oficina"></label>' : '') +
      '<label class="f" style="margin-top:14px"><span>Horario preferido</span><select class="inp" id="ventana">' + C.ventanas.map((v) => '<option' + (ST.ventana === v ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></label>' +
      '<h2>Tus datos</h2><div class="grid2"><label class="f"><span>Nombre completo</span><input class="inp" id="nombre" value="' + esc(ST.nombre) + '" autocomplete="name"><em class="err-msg" data-e="nombre">Escribe tu nombre</em></label>' +
      '<label class="f"><span>WhatsApp</span><input class="inp" id="tel" value="' + esc(ST.tel) + '" inputmode="tel" placeholder="09XXXXXXXX" autocomplete="tel"><em class="err-msg" data-e="tel">Número de 10 dígitos que empiece con 09</em></label>' +
      '<label class="f full"><span>Correo</span><input class="inp" id="email" type="email" value="' + esc(ST.email) + '" autocomplete="email"><em class="err-msg" data-e="email">Escribe un correo válido</em></label></div>';
  };
  V[5] = () => {
    const pl = C.plans[ST.plan], t = total(), neto = EA.neto(t), z = EA.zona(ST.zona);
    return '<h1>Revisa y paga</h1><p class="sub">Confirma tu suscripción. Se renueva cada mes y puedes pausar o cancelar cuando quieras.</p>' +
      '<div class="rev"><div><span>Plan</span><b>' + esc(pl.nombre) + ' · ' + C.frecuencias[ST.frec].almuerzos + ' almuerzos</b></div>' +
      '<div><span>Primer almuerzo</span><b>' + fechaL(ST.inicio) + '</b></div>' +
      '<div><span>Entrega</span><b>' + (ST.tipo === 'retiro' ? 'Retiro en local' : esc(ST.direccion) + (z ? ' · ' + z.nombre : '')) + ' · ' + ST.ventana + '</b></div>' +
      '<div><span>Dieta y alergias</span><b>' + esc([].concat(ST.restricciones, ST.alergias.map((a) => 'sin ' + a)).join(', ') || 'Sin restricciones') + '</b></div></div>' +
      '<div class="desg"><div><span>Subtotal</span><b>' + fmt.money(neto) + '</b></div><div><span>IVA ' + Math.round(C.negocio.iva * 100) + '%</span><b>' + fmt.money(t - neto) + '</b></div><div class="t"><span>Total hoy</span><b>' + fmt.money(t) + '</b></div></div>' +
      '<div class="pago"><span class="demo-tag">DEMO · PAGO SIMULADO</span><h2>' + icon('card') + ' Pago con tarjeta</h2><p class="hint">Estos datos de prueba ya están llenos. No se envía ni se cobra nada.</p>' +
      '<div class="grid2"><label class="f full"><span>Número de tarjeta</span><input class="inp tnum" value="4242 4242 4242 4242" inputmode="numeric" aria-label="Número de tarjeta de prueba"></label><label class="f"><span>Vence</span><input class="inp" value="12/28"></label><label class="f"><span>CVC</span><input class="inp" value="123"></label></div></div>' +
      '<label class="chk"><input type="checkbox" id="acepto"><span>Entiendo que es una demostración y que no se realizará ningún cobro real.</span></label><em class="err-msg" data-e="acepto">Marca la casilla para continuar</em>';
  };

  /* ───────── bienvenida ───────── */
  function bienvenida() {
    const s = ST.hecho, dias = EA.rango(s.inicio, EA.addDias(s.inicio, 4));
    const filas = dias.map((d) => {
      const incl = s.frec === 20 || [1, 3, 5].includes(EA.dow(d)); const r = incl && EA.esLaborable(d) ? EA.platoPara(s, d) : null;
      return '<li class="' + (r ? '' : 'sin') + '"><span class="dd">' + EA.DIAS[EA.dow(d)].slice(0, 3) + '<small>' + EA.D(d).getDate() + '</small></span>' + (r ? '<span class="dn"><b>' + esc(r.plato.nombre) + '</b><small>' + r.plato.kcal + ' kcal · ' + r.plato.p + ' g proteína' + (r.ajuste ? ' · Leo ajustará según tu dieta' : '') + '</small></span>' : '<span class="dn"><small>' + (EA.esLaborable(d) ? 'No incluido en tu frecuencia' : 'Feriado, sin entrega') + '</small></span>') + '</li>';
    }).join('');
    $('#paso').innerHTML = '<div class="gracias"><span class="ok-ic">' + icon('check') + '</span><h1>¡Listo, ' + esc(s.nombre.split(' ')[0]) + '!</h1><p class="sub">Tu suscripción está activa. Tu primer almuerzo llega el <b>' + fechaL(s.inicio) + '</b>.</p><span class="demo-tag">DEMO · NO SE COBRÓ NADA</span></div>' +
      '<h2>Tu menú de la primera semana</h2><ul class="semana">' + filas + '</ul>' +
      '<div class="acts"><a class="btn btn-verde" target="_blank" rel="noopener" href="' + EA.wa('Hola Exotic Açaí, soy ' + s.nombre + '. Acabo de suscribirme (' + s.id + ').') + '">' + icon('chat') + ' Confirmar por WhatsApp</a><a class="btn btn-ghost" href="admin/">Ver mi alta en el panel interno</a><a class="btn btn-ghost" href="index.html">Volver al inicio</a><button class="btn btn-ghost" id="otra" type="button">Hacer otra suscripción de prueba</button></div>';
    $('#otra').addEventListener('click', () => { try { sessionStorage.removeItem(KEY); Object.keys(sessionStorage).filter((k) => k.indexOf('once_paso') > -1 || k.indexOf('once_inicio') > -1).forEach((k) => sessionStorage.removeItem(k)); } catch (e) {} location.href = 'suscribirse.html'; });
    $('#fnav').style.display = 'none'; $('#resumen').style.display = 'none'; renderProg(); scrollTo(0, 0);
  }

  /* ───────── navegación y validación ───────── */
  function validar(p) {
    const err = (k, bad) => { const e = $('[data-e="' + k + '"]'); if (e) e.classList.toggle('on', bad); const i = $('#' + k); if (i) i.classList.toggle('err', bad); return bad; };
    if (p === 1) { if (!ST.objetivo) { EA.toast('Elige un objetivo para continuar'); return false; } return true; }
    if (p === 3) return !!ST.plan;
    if (p === 4) {
      let bad = false;
      if (ST.tipo === 'domicilio') { bad = err('zona', !ST.zona) | bad; bad = err('direccion', ST.direccion.trim().length < 6) | bad; }
      bad = err('nombre', ST.nombre.trim().length < 3) | bad;
      bad = err('tel', !/^09\d{8}$/.test(ST.tel.replace(/[\s-]/g, ''))) | bad;
      bad = err('email', !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ST.email.trim())) | bad;
      if (bad) { const f = $('.err'); if (f) f.focus(); }
      return !bad;
    }
    if (p === 5) { const ok = $('#acepto').checked; $('[data-e="acepto"]').classList.toggle('on', !ok); return ok; }
    return true;
  }
  function leerCampos() {
    ['otras', 'direccion', 'referencia', 'nombre', 'tel', 'email', 'zona', 'ventana', 'inicio'].forEach((k) => { const el = $('#' + k); if (el) ST[k] = el.value; });
  }
  function render() {
    renderProg(); renderResumen();
    $('#paso').innerHTML = V[ST.paso]();
    $('#atras').style.visibility = ST.paso === 1 ? 'hidden' : 'visible';
    $('#sig').innerHTML = ST.paso === 5 ? 'Pagar ' + fmt.money(total()) + ' (simulado)' : 'Continuar';
    $('#sig').classList.toggle('btn-verde', ST.paso === 5); $('#sig').classList.toggle('btn-acai', ST.paso !== 5);
    $('#sig').classList.toggle('off', ST.paso === 1 && !ST.objetivo);
    save();
  }
  function ir(n) { leerCampos(); ST.paso = n; render(); scrollTo({ top: 0, behavior: 'smooth' }); }

  $('#paso').addEventListener('click', (e) => {
    const t = e.target;
    let b;
    if ((b = t.closest('[data-obj]'))) { ST.objetivo = b.dataset.obj; const o = obj(); ST.plan = o.plan; ST.porcion = o.porcion; leerCampos(); render(); }
    else if ((b = t.closest('.chips[data-grp] .chip'))) { const g = b.closest('[data-grp]').dataset.grp; leerCampos(); const a = ST[g], v = b.dataset.v; ST[g] = a.includes(v) ? a.filter((x) => x !== v) : a.concat(v); if (g === 'restricciones' && v === 'vegano' && ST[g].includes('vegano') && !ST[g].includes('vegetariano')) ST[g].push('vegetariano'); render(); }
    else if ((b = t.closest('[data-plan]'))) { leerCampos(); ST.plan = b.dataset.plan; if (ST.plan !== 'fit') ST.porcion = 'normal'; else if (ST.porcion === 'normal') ST.porcion = 'volumen'; render(); }
    else if ((b = t.closest('[data-frec]'))) { leerCampos(); ST.frec = +b.dataset.frec; render(); }
    else if ((b = t.closest('[data-porcion]'))) { leerCampos(); ST.porcion = b.dataset.porcion; render(); }
    else if ((b = t.closest('[data-tipo]'))) { leerCampos(); ST.tipo = b.dataset.tipo; render(); }
  });
  $('#paso').addEventListener('change', (e) => { if (e.target.id === 'zona' || e.target.id === 'inicio') { leerCampos(); renderResumen(); save(); } });
  $('#paso').addEventListener('input', () => { clearTimeout(EA._sv); EA._sv = setTimeout(() => { leerCampos(); save(); }, 250); });
  $('#atras').addEventListener('click', () => { if (ST.paso > 1) ir(ST.paso - 1); });
  $('#sig').addEventListener('click', () => {
    leerCampos();
    if (!validar(ST.paso)) return;
    if (ST.paso < 5) { EA.trackOnce('paso' + ST.paso, 'paso' + ST.paso); ir(ST.paso + 1); return; }
    const b = $('#sig'); b.classList.add('off'); b.innerHTML = '<span class="spin"></span> Procesando pago de prueba…';
    setTimeout(() => {
      EA.trackOnce('paso4', 'paso4'); // por si saltó validación previa
      const s = EA.crearSuscripcion({ nombre: ST.nombre.trim(), tel: ST.tel.replace(/[\s-]/g, ''), email: ST.email.trim(), plan: ST.plan, frec: ST.frec, porcion: ST.porcion, publico: obj() ? obj().publico : C.plans[ST.plan].publico, restricciones: ST.restricciones, alergias: ST.alergias, notas: ST.otras, zona: ST.tipo === 'retiro' ? 'retiro' : ST.zona, direccion: ST.tipo === 'retiro' ? '' : ST.direccion.trim() + (ST.referencia ? ' (' + ST.referencia.trim() + ')' : ''), ventana: ST.ventana, inicio: ST.inicio });
      EA.track('pago', { sub: s.id });
      ST.hecho = s; save(); bienvenida();
    }, 1300);
  });

  EA.trackOnce('inicio');
  if (ST.hecho) bienvenida(); else render();
})();
