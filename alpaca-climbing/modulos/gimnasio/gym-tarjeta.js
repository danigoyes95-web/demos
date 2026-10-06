/* gym-tarjeta.js · la tarjeta de la socia: estrellas y nivel con QR, clases y reservas, rutina con la coach, progreso y fotos, beneficios y merch, retos.
   Entra con código + 4 dígitos (acceder) y trabaja con su token de sesión. El QR lleva otro token (qr_token) que solo sirve al personal. */
(() => {
  const { esc, hora, dia, hoy, sumaDias, diaLargo, fechaLarga, cuando, primer, plata, aviso, accion, estrella, iniciales } = GU;
  const D = window.DEMO, X = window.GYMDATA, T = X.tarjeta, $ = s => document.querySelector(s);
  const E = { me: null, core: null, cat: null, clases: [], rutinas: [], sede: null, dia: hoy(), tab: 'tarjeta', objetivos: [] };
  const tk = () => GYM.socia.token();
  const sedeNombre = id => (E.cat.sedes.find(s => s.id === id) || {}).nombre || '';
  const OBJ = T.objetivos;
  const dd = f => Math.round((new Date(f + 'T12:00:00-05:00') - new Date(hoy() + 'T12:00:00-05:00')) / 864e5);

  /* ------------------------------------------------------------ puertas: plan Esencial y acceso */
  function puerta() {
    const pro = GYM.plan() !== 'esencial';
    $('#sin-pro').classList.toggle('g-oculto', pro);
    $('#entrada').classList.toggle('g-oculto', !pro || !!tk());
    $('#app').classList.toggle('g-oculto', !pro || !tk());
    $('#b-salir').classList.toggle('g-oculto', !pro || !tk());
    return pro;
  }
  $('#ver-pro').onclick = () => { GYM.plan('pro'); iniciar(); };

  function entrada() {
    const ej = GYM.ejemplo();
    $('#acc-ej').innerHTML = ej ? `Para probar: código <b>${esc(ej.codigo)}</b> y últimos 4 dígitos <b>${esc(ej.ultimos4)}</b>. <button type="button" class="g-enlace" id="acc-fill">Usar estos datos</button>` : 'Pídele tu código a recepción en tu próxima clase.';
    if (ej) $('#acc-fill').onclick = () => { $('#acc-cod').value = ej.codigo; $('#acc-4').value = ej.ultimos4; };
  }
  $('#acc-form').onsubmit = async ev => {
    ev.preventDefault();
    const r = await accion($('#acc-ok'), () => GYM.socia.entrar($('#acc-cod').value, $('#acc-4').value).catch(e => { $('#acc-err').textContent = e.message; throw e; }));
    if (r !== undefined) { $('#acc-err').textContent = ''; await abrir(); }
  };
  $('#b-salir').onclick = () => { GYM.socia.salir(); E.me = null; puerta(); entrada(); };

  /* ------------------------------------------------------------ carga */
  async function abrir() {
    puerta();
    try {
      [E.me, E.cat, E.core] = await Promise.all([GYM.rpc('tarjeta', { p_token: tk() }), GYM.rpc('catalogo'), GYM.rpc('mi_core', { p_token: tk() })]);
    } catch (e) { GYM.socia.salir(); aviso('Ese enlace ya no es válido. Entra con tu código.', 'err'); puerta(); entrada(); return; }
    E.sede = E.sede || (E.core && E.core.sede_id) || E.cat.sedes[0].id;
    await Promise.all([cargarClases(), cargarRutinas()]);
    E.dia = [...new Set(E.clases.filter(c => c.sede_id === E.sede && new Date(c.inicio) > Date.now()).map(c => dia(c.inicio)))].sort()[0] || hoy();   // abre en el primer día con clases por venir
    pintarTodo();
  }
  const cargarClases = async () => { E.clases = (await GYM.rpc('agenda', { p_token: tk() })).clases; };
  const cargarRutinas = async () => { E.rutinas = await GYM.rpc('mis_rutinas', { p_token: tk() }); };
  async function refrescarMe() { [E.me, E.core] = await Promise.all([GYM.rpc('tarjeta', { p_token: tk() }), GYM.rpc('mi_core', { p_token: tk() })]); }

  const PANELES = { tarjeta: pintarTarjeta, clases: pintarClases, rutina: pintarRutina, progreso: pintarProgreso, beneficios: pintarBeneficios, retos: pintarRetos };
  function pintarTodo() {
    $('#nombre-s').textContent = E.me.nombre;
    const hayRut = E.rutinas.some(r => r.semana === GU.lunes(hoy()) && r.estado === 'asignada');
    $('#tabs').innerHTML = [['tarjeta', 'Tarjeta'], ['clases', 'Clases'], ['rutina', 'Rutina'], ['progreso', 'Progreso'], ['beneficios', 'Beneficios'], ['retos', 'Retos']]
      .map(([k, t]) => `<button type="button" role="tab" data-t="${k}" aria-selected="${k === E.tab}">${t}${k === 'rutina' && hayRut ? '<span class="g-punto" aria-label="tienes una rutina por hacer">1</span>' : ''}</button>`).join('');
    $('#tabs').querySelectorAll('button').forEach(b => b.onclick = () => { E.tab = b.dataset.t; history.replaceState(null, '', '#' + E.tab); pintarTodo(); window.scrollTo(0, 0); });
    document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== E.tab; });
    PANELES[E.tab]();
  }

  /* ------------------------------------------------------------ pestaña Tarjeta */
  function pintarTarjeta() {
    const m = E.me, n = m.nivel, sig = n.siguiente, act = n.actual;
    const w = sig ? Math.min(1, (m.estrellas - act.desde) / (sig.desde - act.desde)) : 1;
    const vence = m.plan_vence ? dd(m.plan_vence) : null;
    const aviso_v = vence === null ? '' : vence < 0 ? `<span class="g-chip err">Plan vencido</span>` : vence <= 7 ? `<span class="g-chip aviso">Vence en ${vence} ${vence === 1 ? 'día' : 'días'}</span>` : '';
    const renovar = vence !== null && vence <= 7 ? `<div class="g-card" style="border-color:var(--fx-deep)"><div class="g-fila"><div><b>${vence < 0 ? 'Renueva tu plan' : 'Renueva a tiempo y suma +3 ★'}</b><small>${esc(T.renovar_txt)}</small></div>
      <a class="g-btn peq" target="_blank" rel="noopener" href="${esc(GU.wa(`Hola ${D.corto}, quiero renovar mi plan ${m.plan || ''}. Mi código es ${m.codigo}.`, 'renovar'))}">Renovar</a></div></div>` : '';
    $('#p-tarjeta').innerHTML = `
      <div class="g-card oscura g-nivel"><div class="g-nivel-cab"><div><small style="color:var(--fx-soft-2);font:700 .9rem var(--fx-font-txt);text-transform:uppercase;letter-spacing:.08em">Tu nivel</small><div class="g-nivel-nombre">${esc(act.nombre)}</div></div>
        <div class="g-estrellas">${m.estrellas}<small>${estrella} estrellas</small></div></div>
        <div class="fx-barra" style="color:var(--fx-bg)"><i style="--w:${w.toFixed(3)}"></i></div>
        <p>${sig ? `Te faltan <b>${sig.desde - m.estrellas}</b> ${estrella} para <b>${esc(sig.nombre)}</b>.` : 'Llegaste al nivel más alto. Gracias por tu constancia.'}</p></div>
      <div class="g-card"><div class="g-fila"><div><b>${esc(m.plan || 'Sin plan')}</b><small>${m.plan_vence ? 'Vence el ' + esc(fechaLarga(m.plan_vence)) : 'Sin fecha de vencimiento'} · ${m.clases_restantes !== null ? `te quedan ${m.clases_restantes} clases` : 'clases ilimitadas'}</small></div><div class="der">${aviso_v}</div></div></div>
      ${renovar}
      <div class="g-card g-qr-caja"><h3 style="margin:0">Muestra este QR en recepción</h3>${GU.qr(m.qr, 190)}<div class="g-codigo">${esc(m.codigo)}</div><small>${esc(T.qr_txt)}</small></div>
      <div class="g-card"><h3>Cómo ganar estrellas</h3>${m.actividades.map(a => `<div class="g-fila"><span>${esc(a.nombre)}</span><b class="g-mov-est" style="color:var(--fx-ink)">+${a.estrellas} ${estrella}${a.por_monto ? ` c/${plata(a.por_monto)}` : ''}</b></div>`).join('')}</div>
      <div class="g-card"><h3>Historial</h3>${m.movimientos.length ? m.movimientos.map(x => `<div class="g-fila g-mov${x.anulado ? ' anulado' : ''}"><div><b>${esc(x.titulo)}${x.monto ? ' · ' + plata(x.monto) : ''}</b><small>${esc(cuando(x.creado))}${x.anulado ? ' · anulado' : ''}</small></div><span class="g-mov-est${x.estrellas < 0 ? ' neg' : ''}">${x.estrellas > 0 ? '+' : ''}${x.estrellas} ${estrella}</span></div>`).join('') : `<div class="g-vacio">Tu primera estrella llega con tu próxima clase.</div>`}</div>`;
  }

  /* ------------------------------------------------------------ pestaña Clases */
  function pintarClases() {
    const mias = E.clases.filter(c => c.mi_reserva && new Date(c.inicio) > Date.now());
    const lista = E.clases.filter(c => c.sede_id === E.sede && dia(c.inicio) === E.dia);
    const dias = Array.from({ length: 7 }, (_, i) => sumaDias(hoy(), i));
    $('#p-clases').innerHTML = `
      <div class="g-card"><h3>Tus próximas clases</h3>${mias.length ? mias.map(c => `<div class="g-fila"><div><b>${esc(diaLargo(c.inicio))} · ${hora(c.inicio)}</b><small>${esc(c.tipo_nombre)} · ${esc(sedeNombre(c.sede_id))}</small></div>
        <div class="der">${c.mi_reserva.estado === 'espera' ? '<span class="g-chip aviso">En espera</span>' : '<span class="g-chip ok">Confirmada</span>'}</div></div>`).join('') : '<div class="g-vacio">Aún no tienes reservas. Elige una clase abajo.</div>'}
        <p style="margin-top:10px;font-size:.95rem">${esc(T.reglas_clases)}</p></div>
      <div style="margin-top:20px"><div class="g-sedes" id="t-sedes">${E.cat.sedes.map(s => `<button type="button" data-id="${s.id}" aria-pressed="${s.id === E.sede}">${esc(s.nombre)}</button>`).join('')}</div>
        <div class="g-dias" id="t-dias">${dias.map(d => `<button type="button" data-d="${d}" aria-pressed="${d === E.dia}"><small>${d === hoy() ? 'Hoy' : GU.dowCorto(d)}</small><b>${GU.diaNum(d)}</b></button>`).join('')}</div></div>
      <div class="g-clases" id="t-lista">${lista.length ? lista.map(c => GU.claseHTML(c, { pro: true, sede: sedeNombre })).join('') : '<div class="g-vacio">No hay clases ese día en esta sede.</div>'}</div>`;
    $('#t-sedes').querySelectorAll('button').forEach(b => b.onclick = () => { E.sede = +b.dataset.id; pintarClases(); });
    $('#t-dias').querySelectorAll('button').forEach(b => b.onclick = () => { E.dia = b.dataset.d; pintarClases(); });
    $('#p-clases').querySelectorAll('[data-reservar]').forEach(b => b.onclick = () => reservar(+b.dataset.reservar, b));
    $('#p-clases').querySelectorAll('[data-cancelar]').forEach(b => b.onclick = () => cancelar(+b.dataset.cancelar, +b.dataset.clase, b));
  }
  async function reservar(id, b) {
    await accion(b, async () => { const est = await GYM.rpc('reservar', { p_token: tk(), p_clase: id }); await Promise.all([cargarClases(), refrescarMe()]); pintarClases(); return est; },
      est => est === 'espera' ? 'Estás en la lista de espera. Si se libera un cupo, subes sola.' : 'Reserva confirmada. ¡Nos vemos!');
  }
  async function cancelar(rid, cid, b) {
    const c = E.clases.find(x => x.id === cid);
    await accion(b, async () => { await GYM.rpc('cancelar', { p_token: tk(), p_reserva: rid }); await Promise.all([cargarClases(), refrescarMe()]); pintarClases(); return c; },
      c => (c && new Date(c.inicio) - Date.now() < 6 * 36e5) ? 'Cancelada. Faltaban menos de 6 horas: la clase se descuenta de tu plan.' : 'Cancelada. Te devolvimos la clase.');
  }

  /* ------------------------------------------------------------ pestaña Rutina (con la coach) */
  function pintarRutina() {
    const lun = GU.lunes(hoy());
    const act = E.rutinas.find(r => r.semana === lun), otras = E.rutinas.filter(r => r !== act);
    const bloque = r => r.bloques.map(b => `<div class="g-bloque"><b>${esc(b.nombre)}</b>${esc(b.texto)}</div>`).join('');
    $('#p-rutina').innerHTML = act ? `
      <div class="g-card"><div class="g-fila" style="border:0;padding-top:0"><div><b style="font-size:1.6rem">${esc(act.titulo)}</b><small>Semana del ${esc(fechaLarga(act.semana))} · de ${esc(act.coach || 'tu coach')}</small></div>
        <div class="der">${act.estado === 'cumplida' ? `<span class="g-chip ok">Cumplida · +2 ${estrella}</span>` : '<span class="g-chip lima">Por hacer</span>'}</div></div>
        ${act.nota ? `<p style="margin:6px 0 4px">${esc(act.nota)}</p>` : ''}${bloque(act)}
        <p style="margin-top:12px;font-size:.95rem">${esc(T.rutina_txt)}</p>
        <h4>Conversación con tu coach</h4><div class="g-chat">${act.mensajes.length ? act.mensajes.map(m => `<div class="g-burbuja${m.autor === 'socia' ? ' yo' : ''}">${esc(m.texto)}<small>${esc(m.nombre || '')} · ${esc(cuando(m.creado))}</small></div>`).join('') : '<div class="g-vacio">Escríbele a tu coach si tienes dudas.</div>'}</div>
        <form class="g-chat-form" id="f-chat"><input id="chat-t" maxlength="1000" placeholder="Escribe tu mensaje" aria-label="Mensaje para tu coach" required><button class="g-btn" type="submit">Enviar</button></form></div>`
      : `<div class="g-card"><div class="g-vacio">${esc(T.sin_rutina)}</div></div>`;
    if (otras.length) $('#p-rutina').innerHTML += `<div class="g-card"><h3>Otras semanas</h3>${otras.map(r => `<div class="g-fila"><div><b>${esc(r.titulo)}</b><small>Semana del ${esc(fechaLarga(r.semana))}</small></div><span class="g-chip ${r.estado === 'cumplida' ? 'ok' : 'suave'}">${r.estado === 'cumplida' ? 'Cumplida' : 'Asignada'}</span></div>`).join('')}</div>`;
    const f = $('#f-chat'); if (f) f.onsubmit = async ev => { ev.preventDefault(); const t = $('#chat-t').value.trim(); if (!t) return;
      const r = await accion(f.querySelector('button'), () => GYM.rpc('rutina_comentar', { p_token: tk(), p_rutina: act.id, p_texto: t })); if (r) { E.rutinas = r; pintarRutina(); } };
  }

  /* ------------------------------------------------------------ pestaña Progreso (My Core) */
  function pintarProgreso() {
    const c = E.core, pct = c.pct_asistencia, sel = new Set(E.objetivos.length ? E.objetivos : String(c.objetivo || '').split(',').map(s => s.trim()).filter(Boolean));
    E.objetivos = [...sel];
    $('#p-progreso').innerHTML = `
      <div class="g-card"><div class="g-fila" style="border:0;padding-top:0;justify-content:flex-start;gap:16px"><div class="g-avatar">${c.foto_perfil ? GU.img(c.foto_perfil, 'perfil', '') : esc(iniciales(c.nombre))}</div>
        <div style="flex:1"><b style="font-size:1.5rem">${esc(c.nombre)}</b><small>${esc(c.plan || 'Sin plan')} · ${esc(c.sede || 'Sin sede habitual')}</small></div></div>
        <label class="g-btn peq sec" style="margin-top:6px">Cambiar mi foto<input type="file" accept="image/jpeg,image/png,image/webp" id="f-perfil" class="g-solo-lector"></label></div>
      <div class="g-card"><h3>Mi asistencia · 90 días</h3>${pct === null ? '<div class="g-vacio">Aún no hay clases para medir.</div>' : `<div class="g-nivel-cab"><div class="g-nivel-nombre fx-contador" data-contador="${pct}">${pct}%</div><div><b>${c.asistidas_90}</b> clases asistidas · <b>${c.faltas_90}</b> faltas</div></div><div class="fx-barra sobre-claro" style="margin-top:8px;color:var(--fx-ink)"><i style="--w:${(pct / 100).toFixed(2)}"></i></div>`}</div>
      <div class="g-card"><h3>Mis objetivos y cuidados</h3>
        <p style="margin-bottom:8px;font-weight:700">¿Qué quieres lograr?</p><div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px" id="obj">${OBJ.map(o => `<button type="button" class="g-chip ${sel.has(o) ? 'lima' : 'suave'}" style="min-height:44px;font-size:.9rem;cursor:pointer" aria-pressed="${sel.has(o)}" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>
        <form id="f-core"><label class="g-campo">Fecha de nacimiento<input type="date" id="c-nac" value="${esc(c.nacimiento || '')}" max="${hoy()}"></label>
          <label class="g-campo">Sede habitual<select id="c-sede"><option value="">Sin definir</option>${E.cat.sedes.map(s => `<option value="${s.id}" ${s.id === c.sede_id ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select></label>
          <label class="g-campo">Patologías, lesiones o restricciones<textarea id="c-les" maxlength="500">${esc(c.lesiones || '')}</textarea><small>Si cambias esto, tu coach recibe un aviso para cuidarte en clase.</small></label>
          <button class="g-btn" type="submit">Guardar</button></form></div>
      <div class="g-card"><h3>Mi progreso</h3><p style="margin-bottom:12px">Tus fotos solo las ves tú y tus coaches. No se publican en ningún lado.</p>
        <div class="g-fotos" id="fotos">${c.fotos.map(f => `<figure class="g-foto">${GU.img(f.path, 'progreso', 'Foto de progreso')}<figcaption>${esc(cuando(f.creado))}${f.nota ? ' · ' + esc(f.nota) : ''}</figcaption><button type="button" data-borrar="${f.id}" aria-label="Borrar esta foto">×</button></figure>`).join('')}</div>
        ${c.fotos.length ? '' : '<div class="g-vacio">Sube una foto hoy y compárala en unas semanas.</div>'}
        <label class="g-btn" style="margin-top:12px">Subir foto de progreso<input type="file" accept="image/jpeg,image/png,image/webp" id="f-prog" class="g-solo-lector"></label></div>`;
    GU.pintarFotos($('#p-progreso')); if (window.fxVigilar) window.fxVigilar($('#p-progreso'));
    $('#obj').querySelectorAll('button').forEach(b => b.onclick = () => { const o = b.dataset.o; sel.has(o) ? sel.delete(o) : sel.add(o); E.objetivos = [...sel]; b.setAttribute('aria-pressed', sel.has(o)); b.className = 'g-chip ' + (sel.has(o) ? 'lima' : 'suave'); });
    $('#f-core').onsubmit = async ev => { ev.preventDefault();
      const r = await accion(ev.submitter, () => GYM.rpc('mi_core_guardar', { p_token: tk(), p_nacimiento: $('#c-nac').value || null, p_sede: +$('#c-sede').value || null, p_objetivo: [...sel].join(', '), p_lesiones: $('#c-les').value }), 'Guardado. Tu coach ya lo ve.');
      if (r) { E.core = r; E.objetivos = []; pintarProgreso(); } };
    $('#f-perfil').onchange = e => subir(e.target, 'perfil');
    $('#f-prog').onchange = e => subir(e.target, 'progreso');
    $('#fotos').querySelectorAll('[data-borrar]').forEach(b => b.onclick = async () => { if (!confirm('¿Borrar esta foto?')) return;
      const r = await accion(b, () => GYM.rpc('mi_foto_borrar', { p_token: tk(), p_id: +b.dataset.borrar }), 'Foto borrada.'); if (r) { E.core = r; pintarProgreso(); } });
  }
  async function subir(input, tipo) {
    const f = input.files[0]; input.value = ''; if (!f) return;
    const r = await accion(null, async () => { const path = await GYM.subirFoto(f, tipo, E.core.carpeta); return GYM.rpc('mi_foto', { p_token: tk(), p_tipo: tipo, p_path: path }); }, tipo === 'perfil' ? 'Foto actualizada.' : 'Foto guardada.');
    if (r) { E.core = r; pintarProgreso(); }
  }

  /* ------------------------------------------------------------ pestaña Beneficios y merch */
  function pintarBeneficios() {
    const m = E.me, act = m.nivel.actual, ord = E.cat.niveles.map(n => n.nombre);
    const merch = E.cat.merch.map(p => {
      const bloq = p.solo_nivel && ord.indexOf(act.nombre) < ord.indexOf(p.solo_nivel), final = +(p.precio * (1 - act.desc_merch / 100)).toFixed(2);
      return `<article class="g-card" style="padding:14px"><h3 style="font-size:1.3rem;margin-bottom:4px">${esc(p.nombre)}</h3><p style="font-size:.95rem">${esc(p.descripcion || '')}${p.tallas ? ' · ' + esc(p.tallas) : ''}</p>
        ${p.solo_nivel ? `<span class="g-chip lima" style="margin-top:6px">Preventa ${esc(p.solo_nivel)}</span>` : ''}
        <div style="display:flex;align-items:baseline;gap:8px;margin:10px 0"><b style="font:900 2rem/1 var(--fx-font-disp)">${plata(final)}</b>${act.desc_merch ? `<s style="opacity:.6">${plata(p.precio)}</s><span class="g-chip ok">−${act.desc_merch}%</span>` : ''}</div>
        ${bloq ? `<button class="g-btn peq sec" disabled type="button">Desde ${esc(p.solo_nivel)}</button>` : `<a class="g-btn peq" target="_blank" rel="noopener" href="${esc(GU.wa(`Hola ${D.corto}, soy ${m.nombre} (código ${m.codigo}, nivel ${act.nombre}). Quiero pedir: ${p.nombre} a ${plata(final)}.`, 'merch'))}">Pedir por WhatsApp</a>`}</article>`; }).join('');
    $('#p-beneficios').innerHTML = `
      <div class="g-card oscura"><h3>Tus beneficios · ${esc(act.nombre)}</h3><p>${esc(act.beneficios)}</p><p style="margin-top:8px;font-size:.95rem;opacity:.85">Muestra tu tarjeta al pagar un evento o merch para aplicar tu descuento.</p></div>
      <div class="g-card"><h3>Niveles</h3>${E.cat.niveles.map(n => `<div class="g-fila"><div><b>${esc(n.nombre)}${n.nombre === act.nombre ? ' · tú' : ''}</b><small>${esc(n.beneficios)}</small></div><span class="g-chip suave">${n.desde ? 'Desde ' + n.desde + ' ★' : 'Inicio'}</span></div>`).join('')}</div>
      <h3 style="font:900 1.8rem/1 var(--fx-font-disp);text-transform:uppercase;margin:26px 0 12px">Merch con tu precio</h3>
      <div class="g-rejilla">${merch}</div><p style="margin-top:14px;font-size:.95rem">${esc(T.merch_txt)}</p>`;
  }

  /* ------------------------------------------------------------ pestaña Retos */
  async function pintarRetos() {
    const ret = E.cat.retos[0], g = await GYM.rpc('galeria').catch(() => []);
    $('#p-retos').innerHTML = `
      <div class="g-card oscura"><h3>${ret ? esc(ret.titulo) : 'Retos'}</h3><p>${ret ? esc(ret.descripcion || '') + ` Vale +${ret.estrellas} ${estrella} cuando el equipo aprueba tu foto.` : 'Pronto habrá un nuevo reto.'}</p>
        ${ret ? `<form id="f-reto" style="margin-top:14px"><label class="g-btn">Subir la foto de hoy<input type="file" accept="image/jpeg,image/png,image/webp" id="f-reto-f" class="g-solo-lector"></label></form>
        <p style="margin-top:10px;font-size:.95rem;opacity:.9">${esc(T.reto_txt)}</p>` : ''}</div>
      <div class="g-card"><h3>Galería de la comunidad</h3><div class="g-fotos" id="gal">${g.length ? g.map(f => `<figure class="g-foto">${GU.img(f.path, 'reto', 'Foto de ' + f.autor)}<figcaption>${esc(f.autor)}${f.reto ? ' · ' + esc(f.reto) : ''}</figcaption></figure>`).join('') : '<div class="g-vacio">Aún no hay fotos aprobadas.</div>'}</div></div>`;
    GU.pintarFotos($('#gal'));
    const inp = $('#f-reto-f'); if (inp) inp.onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      await accion(null, async () => { const path = await GYM.subirFoto(f, 'reto', E.core.carpeta); return GYM.rpc('subir_reto', { p_token: tk(), p_path: path, p_reto: ret.id }); }, 'Foto enviada. El equipo la revisa y, si la aprueba, suma tus estrellas.'); };
  }

  /* ------------------------------------------------------------ plan que se muestra en la demo */
  function barraPlan() {
    const pro = GYM.plan() !== 'esencial';
    document.querySelectorAll('.g-plan .sw button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.plan === (pro ? 'pro' : 'esencial'))));
    $('#plan-nota').textContent = pro ? X.textos.plan_pro : X.textos.plan_esencial;
  }
  document.querySelectorAll('.g-plan .sw button').forEach(b => b.onclick = () => { GYM.plan(b.dataset.plan); iniciar(); });

  /* ------------------------------------------------------------ arranque */
  async function iniciar() {
    barraPlan();
    document.querySelectorAll('[data-wa]').forEach(a => { a.href = GU.wa(a.dataset.wa, 'flotante'); a.target = '_blank'; a.rel = 'noopener'; });
    const h = location.hash.slice(1); if (PANELES[h]) E.tab = h;
    entrada();
    if (puerta() && tk()) await abrir();
  }
  iniciar();
})();
