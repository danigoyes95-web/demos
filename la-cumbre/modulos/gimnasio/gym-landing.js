/* gym-landing.js · lógica de la landing del gimnasio: clases con reserva, planes, estrellas y niveles, retos y diagnóstico.
   Esencial: la clase se reserva por WhatsApp (sin base de datos). Pro: cupos en vivo, lista de espera y reserva guardada en la base.
   Los datos del cliente (planes, textos) llegan en window.GYMDATA desde cliente.json; las clases y los niveles salen de la base (GYM.rpc). */
(() => {
  const { esc, hora, dia, hoy, sumaDias, dowCorto, diaNum, diaLargo, aviso, accion, plata, primer, estrella } = GU;
  const D = window.DEMO, X = window.GYMDATA, $ = s => document.querySelector(s);
  const E = { cat: null, clases: [], me: null, sede: null, dia: hoy(), filtro: null, dur: (X.planes.duracion_inicial || '3'), plan: GYM.plan() };
  const tipoNombre = c => (E.cat.tipos.find(t => t.clave === c) || {}).nombre || c;
  const sedeNombre = id => (E.cat.sedes.find(s => s.id === id) || {}).nombre || '';
  const nombreWa = () => ($('#nombre-wa') && $('#nombre-wa').value.trim()) || '';
  const link = (t, o) => GU.wa(t, o);

  /* ---------------------------------------------------------------- plan que se muestra (solo en la demo) */
  function pintarPlan() {
    const pro = E.plan !== 'esencial';
    document.querySelectorAll('.g-plan .sw button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.plan === (pro ? 'pro' : 'esencial'))));
    $('#plan-nota').textContent = pro ? X.textos.plan_pro : X.textos.plan_esencial;
    document.querySelectorAll('[data-solo-pro]').forEach(el => el.classList.toggle('g-oculto', !pro));
    document.querySelectorAll('[data-solo-esencial]').forEach(el => el.classList.toggle('g-oculto', pro));
    document.querySelectorAll('.nav-tarjeta').forEach(a => { a.dataset.bloq = pro ? '' : '1'; });
    pintarClases(); pintarUsuario();
  }
  document.querySelectorAll('.g-plan .sw button').forEach(b => b.onclick = () => { E.plan = GYM.plan(b.dataset.plan); pintarPlan(); });

  /* ---------------------------------------------------------------- usuario (socia con sesión) */
  async function cargarMe() {
    E.me = null; if (!GYM.socia.token()) return;
    try { E.me = await GYM.rpc('tarjeta', { p_token: GYM.socia.token() }); } catch (e) { GYM.socia.salir(); }
  }
  function pintarUsuario() {
    const c = $('#usuario'); if (!c) return;
    const pro = E.plan !== 'esencial';
    if (!pro) { c.innerHTML = ''; return; }
    if (!E.me) { c.innerHTML = `<div class="g-card"><div class="g-fila"><div><b>${esc(X.textos.entrar_titulo)}</b><small>${esc(X.textos.entrar_txt)}</small></div><button class="g-btn peq" id="b-entrar" type="button">Entrar</button></div></div>`; $('#b-entrar').onclick = () => pedirAcceso(); return; }
    const n = E.me.nivel;
    c.innerHTML = `<div class="g-card oscura"><div class="g-fila"><div><b>Hola, ${esc(primer(E.me.nombre))}</b><small>${esc(n.actual.nombre)} · ${E.me.estrellas} ★${E.me.clases_restantes !== null ? ' · te quedan ' + E.me.clases_restantes + ' clases' : ' · clases ilimitadas'}</small></div>
      <div class="der"><a class="g-btn peq" href="tarjeta.html">Mi tarjeta</a> <button class="g-enlace" id="b-salir" type="button">Salir</button></div></div></div>`;
    $('#b-salir').onclick = async () => { GYM.socia.salir(); E.me = null; await cargarClases(); pintarUsuario(); pintarClases(); };
  }

  /* ---------------------------------------------------------------- acceso con código + 4 dígitos */
  const dlg = $('#dlg-acc');
  function pedirAcceso() {
    return new Promise(ok => {
      const ej = GYM.ejemplo();
      $('#acc-ej').innerHTML = ej ? `Para probar: código <b>${esc(ej.codigo)}</b> y últimos 4 dígitos <b>${esc(ej.ultimos4)}</b>. <button type="button" class="g-enlace" id="acc-fill">Usar estos datos</button>` : '';
      if (ej) $('#acc-fill').onclick = () => { $('#acc-cod').value = ej.codigo; $('#acc-4').value = ej.ultimos4; };
      $('#acc-err').textContent = ''; E.esperaAcceso = ok; dlg.showModal();
    });
  }
  $('#acc-form').onsubmit = async ev => {
    ev.preventDefault(); const b = $('#acc-ok');
    const r = await accion(b, () => GYM.socia.entrar($('#acc-cod').value, $('#acc-4').value).catch(e => { $('#acc-err').textContent = e.message; throw e; }));
    if (r === undefined) return;
    dlg.close(); await cargarMe(); await cargarClases(); pintarUsuario(); pintarClases(); aviso('Listo, ya entraste.', 'ok');
    if (E.esperaAcceso) { E.esperaAcceso(true); E.esperaAcceso = null; }
  };
  $('#acc-cancel').onclick = () => { dlg.close(); if (E.esperaAcceso) { E.esperaAcceso(false); E.esperaAcceso = null; } };

  /* ---------------------------------------------------------------- clases */
  async function cargarClases() { const r = await GYM.rpc('agenda', { p_token: GYM.socia.token() }); E.clases = r.clases; }
  function pintarFiltros() {
    $('#sedes').innerHTML = E.cat.sedes.map(s => `<button type="button" data-id="${s.id}" aria-pressed="${s.id === E.sede}">${esc(s.nombre)}</button>`).join('');
    $('#sedes').querySelectorAll('button').forEach(b => b.onclick = () => { E.sede = +b.dataset.id; pintarFiltros(); pintarClases(); });
    const dias = Array.from({ length: 7 }, (_, i) => sumaDias(hoy(), i));
    $('#dias').innerHTML = dias.map(d => `<button type="button" data-d="${d}" aria-pressed="${d === E.dia}"><small>${i18nDia(d)}</small><b>${diaNum(d)}</b></button>`).join('');
    $('#dias').querySelectorAll('button').forEach(b => b.onclick = () => { E.dia = b.dataset.d; pintarFiltros(); pintarClases(); });
    $('#filtro').innerHTML = E.filtro ? `<button class="g-chip lima" id="b-filtro" type="button">Solo ${esc(tipoNombre(E.filtro))} ✕</button>` : '';
    if (E.filtro) $('#b-filtro').onclick = () => { E.filtro = null; pintarFiltros(); pintarClases(); };
  }
  const i18nDia = d => d === hoy() ? 'Hoy' : dowCorto(d);
  function pintarClases() {
    const cont = $('#clases'); if (!cont || !E.cat) return;
    const pro = E.plan !== 'esencial';
    const lista = E.clases.filter(c => c.sede_id === E.sede && dia(c.inicio) === E.dia && (!E.filtro || c.tipo === E.filtro));
    if (!lista.length) { cont.innerHTML = `<div class="g-vacio">${esc(X.textos.sin_clases)}</div>`; return; }
    cont.innerHTML = lista.map(c => GU.claseHTML(c, { pro, sede: sedeNombre, wa: c => link(`Hola ${D.corto}, quiero reservar la clase de ${c.tipo_nombre} el ${diaLargo(c.inicio)} a las ${hora(c.inicio)} en ${sedeNombre(c.sede_id)}.${nombreWa() ? '\nMi nombre: ' + nombreWa() : ''}`, 'clase') })).join('');
    cont.querySelectorAll('[data-reservar]').forEach(b => b.onclick = () => reservar(+b.dataset.reservar, b));
    cont.querySelectorAll('[data-cancelar]').forEach(b => b.onclick = () => cancelar(+b.dataset.cancelar, +b.dataset.clase, b));
  }
  async function reservar(id, boton) {
    if (!GYM.socia.token()) { const ok = await pedirAcceso(); if (!ok) return; }
    await accion(boton, async () => {
      const est = await GYM.rpc('reservar', { p_token: GYM.socia.token(), p_clase: id });
      await cargarClases(); await cargarMe(); pintarUsuario(); pintarClases(); return est;
    }, est => est === 'espera' ? 'Estás en la lista de espera. Si se libera un cupo, subes sola.' : 'Reserva confirmada. ¡Nos vemos!');
  }
  async function cancelar(rid, cid, boton) {
    const c = E.clases.find(x => x.id === cid);
    await accion(boton, async () => {
      await GYM.rpc('cancelar', { p_token: GYM.socia.token(), p_reserva: rid });
      await cargarClases(); await cargarMe(); pintarUsuario(); pintarClases(); return c;
    }, c => (c && new Date(c.inicio) - Date.now() < 6 * 36e5) ? 'Cancelada. Faltaban menos de 6 horas: la clase se descuenta de tu plan.' : 'Cancelada. Te devolvimos la clase.');
  }

  /* ---------------------------------------------------------------- planes y membresías (precios del cliente, cierran en WhatsApp) */
  function pintarPlanes() {
    const P = X.planes;
    $('#durs').innerHTML = P.duraciones.map(d => `<button type="button" data-d="${d.id}" aria-pressed="${d.id === E.dur}">${esc(d.label)}</button>`).join('');
    $('#durs').querySelectorAll('button').forEach(b => b.onclick = () => { E.dur = b.dataset.d; pintarPlanes(); });
    const durLabel = (P.duraciones.find(d => d.id === E.dur) || {}).label;
    $('#planes-lista').innerHTML = P.lista.map(p => {
      const v = p.precios[E.dur], n = p.precios[P.base || '1'], ahorro = n && v < n ? Math.round((1 - v / n) * 100) : 0;
      return `<article class="plan-card${p.destacado ? ' dest' : ''}"><span class="g-chip lima" style="align-self:flex-start${p.destacado ? '' : ';visibility:hidden'}">${esc(P.etiqueta_destacado || 'Más completo')}</span><h3>${esc(p.nombre)}</h3><p>${esc(p.desc)}</p>
        <div class="plan-precio"><b>${v ? plata(v) : 'A consultar'}</b>${v ? '<span>/mes</span>' : ''}</div>${ahorro ? `<small class="plan-ahorro">Ahorras ${ahorro}% frente al mensual (${plata(n)})</small>` : '<small class="plan-ahorro">&nbsp;</small>'}
        <ul>${p.incluye.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
        <a class="btn" target="_blank" rel="noopener" href="${esc(link(`Hola ${D.corto}, quiero el plan ${p.nombre} (${durLabel})${v ? ' a ' + plata(v) + ' al mes' : ''}.${nombreWa() ? '\nMi nombre: ' + nombreWa() : ''}`, 'plan'))}">Quiero este plan</a></article>`;
    }).join('');
  }

  /* ---------------------------------------------------------------- estrellas, niveles, retos */
  function pintarEstrellas() {
    $('#como-suma').innerHTML = E.cat.actividades.filter(a => !['reto', 'rutina'].includes(a.clave)).map(a => `<li><span>${esc(a.nombre)}</span><b>+${a.estrellas} ${estrella}${a.por_monto ? ` c/${plata(a.por_monto)}` : ''}</b></li>`).join('')
      + E.cat.actividades.filter(a => ['reto', 'rutina'].includes(a.clave)).map(a => `<li><span>${esc(a.nombre)}</span><b>+${a.estrellas} ${estrella}</b></li>`).join('');
    const max = E.cat.niveles[E.cat.niveles.length - 1].desde;
    $('#niveles').innerHTML = E.cat.niveles.map(n => `<article class="nivel-card"><small>${n.desde ? 'Desde ' + n.desde + ' ★' : 'Desde tu 1.ª clase'}</small><h3>${esc(n.nombre)}</h3><div class="fx-barra sobre-claro"><i style="--w:${Math.max(.08, n.desde / max).toFixed(2)}"></i></div><p>${esc(n.beneficios)}</p></article>`).join('');
  }
  async function pintarRetos() {
    const ret = E.cat.retos[0];
    $('#reto-activo').innerHTML = ret ? `<div class="g-pista"><b>${esc(ret.titulo)}</b> · ${esc(ret.descripcion || '')} Vale +${ret.estrellas} ${estrella} cuando el equipo aprueba tu foto.</div>` : '';
    const g = await GYM.rpc('galeria').catch(() => []);
    $('#galeria-g').innerHTML = g.length ? g.map(f => `<figure class="g-foto">${GU.img(f.path, 'reto', 'Foto de ' + f.autor)}<figcaption>${esc(f.autor)}${f.reto ? ' · ' + esc(f.reto) : ''}</figcaption></figure>`).join('') : `<div class="g-vacio">${esc(X.textos.sin_retos)}</div>`;
    GU.pintarFotos($('#galeria-g'));
  }

  /* ---------------------------------------------------------------- diagnóstico: "¿qué clase va contigo?" (reglas de cliente.json → diag) */
  function diagnostico() {
    const DG = window.DIAG, caja = $('#caja-diag'), N = DG.preguntas.length, s = { paso: 0, r: {} };
    const recomendar = r => { for (const g of DG.reglas) if (Object.entries(g.si).every(([k, v]) => r[k] === v)) return g.id; return DG.defecto; };
    const cab = `<div class="caja-cab"><div><b>${esc(DG.titulo)}</b><small>${esc(DG.sub)}</small></div></div>`;
    const pintar = () => {
      if (s.paso < N) {
        const q = DG.preguntas[s.paso];
        caja.innerHTML = `${cab}<div class="prog"><span>Paso ${s.paso + 1} de ${N}</span><div class="fx-barra sobre-claro"><i style="--w:${((s.paso + 1) / N).toFixed(2)}"></i></div></div><div class="fx-paso" style="display:grid;gap:14px"><h3>${esc(q.texto)}</h3>
          <div class="ops">${q.opciones.map(o => `<button type="button" class="op" data-v="${esc(o.valor)}"><span>${esc(o.texto)}${o.detalle ? `<small>${esc(o.detalle)}</small>` : ''}</span></button>`).join('')}</div>${s.paso ? '<button type="button" class="g-enlace" id="volver">Volver</button>' : ''}</div>`;
        caja.querySelectorAll('.op').forEach(b => b.onclick = () => { s.r[q.clave] = b.dataset.v; s.paso++; pintar(); });
        const v = $('#volver'); if (v) v.onclick = () => { s.paso--; pintar(); };
      } else {
        const id = recomendar(s.r), t = E.cat.tipos.find(x => x.clave === id) || E.cat.tipos[0];
        caja.innerHTML = `${cab}<div class="fx-paso" style="display:grid;gap:14px"><div class="reco"><small>${esc(DG.hoy)}</small><b>${esc(t.nombre)}</b><p>${esc(t.descripcion || '')}</p></div>
          <button type="button" class="btn" id="ver-clases">Ver horarios de ${esc(t.nombre)}</button><button type="button" class="g-enlace" id="otra">Probar otra vez</button></div>`;
        $('#ver-clases').onclick = () => { E.filtro = t.clave; pintarFiltros(); pintarClases(); document.getElementById('clases-sec').scrollIntoView({ behavior: 'smooth' }); };
        $('#otra').onclick = () => { s.paso = 0; s.r = {}; pintar(); };
      }
    };
    pintar();
  }

  /* ---------------------------------------------------------------- arranque */
  async function iniciar() {
    document.querySelectorAll('[data-wa]').forEach(a => { a.href = link(a.dataset.wa, 'flotante'); a.target = '_blank'; a.rel = 'noopener'; });
    ['ig', 'ig2', 'ig3'].forEach(i => { const a = document.getElementById(i); if (a) a.href = D.instagram; });
    try {
      [E.cat] = await Promise.all([GYM.rpc('catalogo'), cargarMe()]);
      await cargarClases();
    } catch (e) { $('#clases').innerHTML = `<div class="g-vacio">No pudimos cargar los horarios. ${esc(e.message)}</div>`; return; }
    E.sede = E.cat.sedes[0].id;
    E.dia = [...new Set(E.clases.filter(c => c.sede_id === E.sede && new Date(c.inicio) > Date.now()).map(c => dia(c.inicio)))].sort()[0] || hoy();   // abre en el primer día con clases por venir
    // cifras reales de lo que ofrece el gimnasio (se cuentan hasta el número al hacer scroll)
    const sem = E.clases.filter(c => dia(c.inicio) <= sumaDias(hoy(), 6)).length;
    [['#c-tipos', E.cat.tipos.length], ['#c-sedes', E.cat.sedes.length], ['#c-sem', sem]].forEach(([s, n]) => { const el = $(s); el.textContent = n; el.dataset.contador = n; });
    if (window.fxVigilar) window.fxVigilar(document);
    pintarFiltros(); pintarPlanes(); pintarEstrellas(); diagnostico(); pintarPlan();
    pintarRetos();
    if ($('#nombre-wa')) $('#nombre-wa').addEventListener('input', () => { pintarClases(); pintarPlanes(); });
    if (location.hash === '#entrar' && E.plan !== 'esencial' && !E.me) pedirAcceso();
  }
  iniciar();
})();
