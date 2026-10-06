/* gym-personal.js · panel del personal del gimnasio: check-in con QR, estrellas, clases del día con lista de asistentes, fichas, rutinas, retos y resumen.
   Roles: admin (todo) · recepcion (alta, estrellas, plan y vencimiento) · coach (asistencia, perfil, notas, rutinas, fotos de progreso).
   Todo lo que da valor (estrellas, anulaciones, retos) lo valida el servidor; aquí solo se muestran los botones que el rol puede usar.
   El personal identifica a la socia con 'ref' (lo que muestra su QR) o su código: nunca con el token de sesión de ella. */
(() => {
  const { esc, hora, dia, hoy, sumaDias, diaLargo, fechaLarga, cuando, primer, plata, tel, aviso, accion, estrella, iniciales } = GU;
  const D = window.DEMO, X = window.GYMDATA, P = X.personal, $ = s => document.querySelector(s);
  const E = { yo: null, tab: 'hoy', cat: null, ref: null, f: null, sub: 'asistencia', previo: null, hoyClases: null, diaSel: hoy(), q: '', filtro: 'todas', socias: null, plantillas: null, pend: null, resumen: null, tabAntes: 'hoy', scan: null };
  const ROLES = { admin: 'Administración', recepcion: 'Recepción', coach: 'Coach' };
  const rolCA = () => ['coach', 'admin'].includes(E.yo.rol), rolRA = () => ['recepcion', 'admin'].includes(E.yo.rol);
  const sedeN = id => (E.cat.sedes.find(s => s.id === id) || {}).nombre || '';
  const tipoN = c => (E.cat.tipos.find(t => t.clave === c) || {}).nombre || c;
  const waSocia = (t, txt) => `https://wa.me/${String(t || '').replace(/\D/g, '')}?text=${encodeURIComponent(txt)}`;
  const dd = f => Math.round((new Date(f + 'T12:00:00-05:00') - new Date(hoy() + 'T12:00:00-05:00')) / 864e5);
  const venceChip = f => { if (!f) return ''; const n = dd(f); return n < 0 ? '<span class="g-chip err">Vencido</span>' : n <= 7 ? `<span class="g-chip aviso">Vence en ${n} ${n === 1 ? 'día' : 'días'}</span>` : `<span class="g-chip suave">Vence ${esc(fechaLarga(f))}</span>`; };
  const rpc = (f, a) => GYM.rpc(f, a);

  /* ------------------------------------------------------------ plan (solo demo) y acceso */
  function barraPlan() {
    const pro = GYM.plan() !== 'esencial';
    document.querySelectorAll('.g-plan .sw button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.plan === (pro ? 'pro' : 'esencial'))));
    $('#plan-nota').textContent = pro ? X.textos.plan_pro : X.textos.plan_esencial;
    return pro;
  }
  document.querySelectorAll('.g-plan .sw button').forEach(b => b.onclick = () => { GYM.plan(b.dataset.plan); iniciar(); });
  $('#ver-pro').onclick = () => { GYM.plan('pro'); iniciar(); };

  function pintarEntrada() {
    const demo = GYM.modo === 'demo';
    $('#entrada-cont').innerHTML = demo ? `<div class="g-card"><h3>${esc(P.entrar_titulo)}</h3><p style="margin-bottom:14px">${esc(P.entrar_demo)}</p><div class="g-roles">
        ${[['admin', 'Ana · administración', 'Todo: configuración, equipo, anular sin límite, resumen del negocio.'], ['recepcion', 'Rosa · recepción', 'Da de alta socias, suma estrellas, edita plan y vencimiento. No ve fotos ni notas.'], ['coach', 'Caro · coach', 'Marca asistencia, perfil, notas, rutinas y fotos de progreso.']]
          .map(([r, t, d]) => `<button type="button" data-r="${r}"><b>${t}</b>${d}</button>`).join('')}</div></div>`
      : `<form class="g-card" id="f-staff"><h3>${esc(P.entrar_titulo)}</h3><label class="g-campo">Correo<input id="s-mail" type="email" autocomplete="username" required></label><label class="g-campo">Clave<input id="s-pass" type="password" autocomplete="current-password" required></label><p class="g-err" id="s-err" role="alert"></p><button class="g-btn" type="submit" style="width:100%">Entrar</button></form>`;
    $('#entrada-cont').querySelectorAll('[data-r]').forEach(b => b.onclick = async () => { await accion(null, () => GYM.staff.entrar(b.dataset.r)); iniciar(); });
    const f = $('#f-staff'); if (f) f.onsubmit = async ev => { ev.preventDefault(); const r = await accion(ev.submitter, () => GYM.staff.entrar($('#s-mail').value, $('#s-pass').value).catch(e => { $('#s-err').textContent = e.message; throw e; })); if (r) iniciar(); };
  }
  $('#b-salir').onclick = () => { GYM.staff.salir(); E.yo = null; iniciar(); };

  /* ------------------------------------------------------------ estructura de la app por rol */
  const TABS = { hoy: 'Hoy', clases: 'Clases', socias: 'Socias', rutinas: 'Rutinas', retos: 'Retos', resumen: 'Resumen' };
  const tabsDe = r => r === 'coach' ? ['hoy', 'clases', 'socias', 'rutinas', 'retos'] : r === 'recepcion' ? ['hoy', 'clases', 'socias', 'retos', 'resumen'] : ['hoy', 'clases', 'socias', 'rutinas', 'retos', 'resumen'];
  function pintarTabs() {
    const hp = E.pend ? E.pend.length : 0;
    $('#tabs').innerHTML = tabsDe(E.yo.rol).map(k => `<button type="button" role="tab" data-t="${k}" aria-selected="${k === E.tab || (E.tab === 'ficha' && k === E.tabAntes)}">${TABS[k]}${k === 'retos' && hp ? `<span class="g-punto">${hp}</span>` : ''}</button>`).join('');
    $('#tabs').querySelectorAll('button').forEach(b => b.onclick = () => ir(b.dataset.t));
    $('#yo-chip').innerHTML = `${esc(E.yo.nombre)} <span class="g-chip lima">${ROLES[E.yo.rol]}</span>`;
  }
  async function ir(t) {
    if (t !== 'ficha') E.tabAntes = t;
    E.tab = t; E.ref = t === 'ficha' ? E.ref : null;
    document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== t; });
    pintarTabs();
    const f = { hoy: pintarHoy, clases: pintarClases, socias: pintarSocias, rutinas: pintarRutinas, retos: pintarRetos, resumen: pintarResumen, ficha: pintarFicha }[t];
    try { await f(); } catch (e) { aviso(e.message, 'err'); }
    window.scrollTo(0, 0);
  }
  async function refrescarPend() { try { E.pend = await rpc('retos_pendientes'); } catch (e) { E.pend = []; } }

  /* ------------------------------------------------------------ HOY */
  async function pintarHoy() {
    const [h, rs] = await Promise.all([rpc('hoy'), rolRA() ? rpc('resumen') : null]); await refrescarPend(); pintarTabs();
    $('#p-hoy').innerHTML = `
      <div class="g-kpis"><div class="g-kpi"><small>Asistencias hoy</small><b class="fx-contador" data-contador="${h.asistencias}">${h.asistencias}</b></div>
        <div class="g-kpi"><small>Estrellas dadas hoy</small><b class="fx-contador" data-contador="${h.estrellas}">${h.estrellas}</b></div>
        <div class="g-kpi ${E.pend.length ? 'alerta' : ''}"><small>Retos por revisar</small><b>${E.pend.length}</b></div>
        ${rs ? `<div class="g-kpi ${rs.vencen_7d ? 'alerta' : ''}"><small>Planes que vencen (7 días)</small><b>${rs.vencen_7d}</b></div>` : ''}</div>
      <div class="g-card" style="margin-top:22px"><h3>Buscar socia o escanear su QR</h3>
        <form class="g-chat-form" id="f-buscar"><input id="q-b" placeholder="Nombre, celular o código" aria-label="Buscar socia" autocomplete="off"><button class="g-btn" type="submit">Buscar</button></form>
        <button class="g-btn sec" id="b-scan" type="button" style="margin-top:10px;width:100%">Escanear QR</button><div id="res-b" style="margin-top:10px"></div></div>
      <div class="g-card"><h3>Movimientos de hoy</h3>${h.lista.length ? h.lista.map(m => `<div class="g-fila g-mov${m.anulado ? ' anulado' : ''}"><div><b>${esc(m.socia)}</b><small>${esc(m.titulo)}${m.monto ? ' · ' + plata(m.monto) : ''} · ${esc(hora(m.creado))}${m.staff ? ' · ' + esc(m.staff) : ''}</small></div><span class="g-mov-est${m.estrellas < 0 ? ' neg' : ''}">${m.estrellas > 0 ? '+' : ''}${m.estrellas} ${estrella}</span></div>`).join('') : '<div class="g-vacio">Aún no hay movimientos hoy.</div>'}</div>`;
    if (window.fxVigilar) window.fxVigilar($('#p-hoy'));
    $('#f-buscar').onsubmit = ev => { ev.preventDefault(); buscar($('#q-b').value); };
    $('#b-scan').onclick = escanear;
  }
  async function buscar(q) {
    if (String(q).trim().length < 2) return;
    const r = await rpc('buscar', { p_q: q }).catch(e => { aviso(e.message, 'err'); return []; });
    $('#res-b').innerHTML = r.length ? r.map(s => `<div class="g-fila"><div><b>${esc(s.nombre)}</b><small>${esc(tel(s.telefono))} · ${esc(s.codigo)}</small></div><button class="g-btn peq" data-ref="${esc(s.ref)}" type="button">${s.estrellas} ${estrella} · Abrir</button></div>`).join('') : '<div class="g-vacio">No encontramos a nadie con eso.</div>';
    $('#res-b').querySelectorAll('[data-ref]').forEach(b => b.onclick = () => abrirFicha(b.dataset.ref));
  }

  /* ------------------------------------------------------------ escaneo de QR */
  const dlg = $('#dlg');
  function cerrarDlg() { detenerScan(); if (dlg.open) dlg.close(); }
  async function escanear() {
    const demo = GYM.modo === 'demo', lista = demo ? await rpc('socias_lista') : [];
    dlg.innerHTML = `<form method="dialog" id="f-scan"><h2>Escanear QR</h2><div id="lector" style="width:100%;min-height:60px;margin-bottom:12px"></div><p class="g-err" id="scan-err" role="alert"></p>
      <label class="g-campo">O escribe el código de la socia<input id="scan-cod" autocomplete="off" placeholder="Código de tu tarjeta"></label>
      ${demo ? `<p style="font-weight:700;margin-bottom:6px">Demo: elige a quién "escaneas"</p><div style="max-height:34vh;overflow:auto;border:2px solid var(--fx-deep);border-radius:6px;padding:0 10px;background:#fff">${lista.slice(0, 20).map(s => `<div class="g-fila"><span>${esc(s.nombre)}</span><button type="button" class="g-btn peq" data-ref="${esc(s.ref)}">Escanear</button></div>`).join('')}</div>` : ''}
      <div class="g-dlg-acc"><button type="button" class="g-btn sec" id="scan-x">Cerrar</button><button class="g-btn" type="submit">Abrir</button></div></form>`;
    dlg.showModal();
    $('#scan-x').onclick = cerrarDlg; dlg.onclose = detenerScan;
    $('#f-scan').onsubmit = ev => { ev.preventDefault(); const v = $('#scan-cod').value.trim(); if (v) { cerrarDlg(); abrirFicha(v); } };
    dlg.querySelectorAll('[data-ref]').forEach(b => b.onclick = () => { cerrarDlg(); abrirFicha(b.dataset.ref); });
    if (window.Html5Qrcode) {
      try { E.scan = new Html5Qrcode('lector'); await E.scan.start({ facingMode: 'environment' }, { fps: 10, qrbox: 220 }, txt => { cerrarDlg(); abrirFicha(txt); }, () => {}); }
      catch (e) { $('#scan-err').textContent = 'No pudimos usar la cámara. Escribe el código o elige una socia.'; E.scan = null; }
    } else $('#lector').remove();
  }
  async function detenerScan() { if (E.scan) { try { await E.scan.stop(); } catch (e) {} E.scan = null; } }

  /* ------------------------------------------------------------ FICHA de la socia */
  async function abrirFicha(ref) {
    try {
      E.ref = ref; E.sub = 'asistencia'; await cargarFicha(ref); E.ref = E.f.ref; await ir('ficha');
    } catch (e) { aviso(e.message, 'err'); E.ref = null; }
  }
  async function cargarFicha(ref) {
    const [f, prog, core, ck] = await Promise.all([rpc('ficha', { p_ref: ref }), rpc('progreso', { p_ref: ref }), rpc('mycore', { p_ref: ref }), rpc('checkin_previo', { p_ref: ref })]);
    E.f = f; E.prog = prog; E.core = core; E.previo = ck; E.hoyClases = await rpc('clases_dia', {});
    E.rut = rolCA() ? await rpc('rutinas_socia', { p_ref: f.ref }) : [];
    if (rolCA() && !E.plantillas) E.plantillas = await rpc('plantillas');
  }
  async function recargarFicha() { await cargarFicha(E.ref); pintarFicha(); }
  function pintarFicha() {
    const f = E.f, n = f.nivel, sig = n.siguiente, w = sig ? Math.min(1, (f.estrellas - n.actual.desde) / (sig.desde - n.actual.desde)) : 1;
    const subs = [['asistencia', 'Asistencia'], ['perfil', 'Perfil'], ...(rolRA() ? [['plan', 'Plan']] : []), ...(rolCA() ? [['rutina', 'Rutina'], ['fotos', 'Fotos']] : [])];
    $('#p-ficha').innerHTML = `
      <button class="g-enlace" id="b-volver" type="button" style="margin-bottom:8px">← Volver</button>
      <div class="g-card oscura"><div class="g-nivel-cab"><div><div class="g-nivel-nombre" style="font-size:2.2rem">${esc(f.nombre)}</div><small style="font:600 .95rem var(--fx-font-txt)">${esc(f.codigo)}${f.telefono ? ' · ' + esc(tel(f.telefono)) : ''}</small></div>
        <div class="g-estrellas">${f.estrellas}<small>${estrella}</small></div></div>
        <div class="fx-barra" style="color:var(--fx-bg);margin-top:12px"><i style="--w:${w.toFixed(3)}"></i></div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;align-items:center"><span class="g-chip lima">${esc(n.actual.nombre)}</span>${f.plan ? `<span class="g-chip suave">${esc(f.plan)}</span>` : '<span class="g-chip suave">Sin plan</span>'}${venceChip(f.plan_vence)}
          ${f.clases_restantes !== null ? `<span class="g-chip suave">${f.clases_restantes} clases</span>` : ''}${E.prog.lesiones ? '<span class="g-chip err">⚠ Lesión</span>' : ''}</div>
        ${E.prog.lesiones ? `<p style="margin-top:10px;font-weight:700">⚠ ${esc(E.prog.lesiones)}</p>` : ''}
        <p style="margin-top:8px;font-size:.95rem">${sig ? `Le faltan ${sig.desde - f.estrellas} ${estrella} para ${esc(sig.nombre)}.` : 'Nivel más alto.'}</p></div>
      <div class="g-pestanas" style="position:static;margin-top:16px;border-radius:6px" id="subs" role="tablist">${subs.map(([k, t]) => `<button type="button" role="tab" data-s="${k}" aria-selected="${k === E.sub}">${t}</button>`).join('')}</div>
      <div id="sub-cont" style="margin-top:16px"></div>`;
    $('#b-volver').onclick = () => ir(E.tabAntes);
    $('#subs').querySelectorAll('button').forEach(b => b.onclick = () => { E.sub = b.dataset.s; pintarFicha(); });
    ({ asistencia: subAsistencia, perfil: subPerfil, plan: subPlan, rutina: subRutina, fotos: subFotos }[E.sub])();
  }

  /* ---- Asistencia: check-in, sumar estrellas, historial ---- */
  function subAsistencia() {
    const f = E.f, ck = E.previo, hoyCl = (E.hoyClases || []).filter(c => !(ck.actual || []).some(a => a.id === c.id));
    const marcar = (c, txt, extra) => `<button class="g-btn" data-marcar="${c.id}" type="button" style="width:100%;margin-top:8px"${extra || ''}>${txt}</button>`;
    let check;
    if (ck.ya_marco) check = '<span class="g-chip ok">Ya marcó asistencia hoy ✓</span>';
    else {
      check = ck.mia ? `<p style="margin-bottom:6px">Tiene reserva: <b>${esc(tipoN(ck.mia.tipo))} · ${esc(hora(ck.mia.inicio))} · ${esc(sedeN(ck.mia.sede_id))}</b></p>${marcar(ck.mia, `Marcar asistencia · ${esc(hora(ck.mia.inicio))}`)}` : '';
      const otros = (ck.actual || []).filter(a => !ck.mia || a.id !== ck.mia.id);
      check += otros.map(c => marcar(c, `${ck.mia ? 'Marcar igual' : 'Marcar'} · ${esc(hora(c.inicio))} ${esc(tipoN(c.tipo))} ${esc(sedeN(c.sede_id))} (${c.ocupados}/${c.cupos})`, c.ocupados >= c.cupos && !(ck.mia && ck.mia.id === c.id) ? ' disabled' : '')).join('');
      if (!ck.mia && !otros.length) check += `<p style="margin-bottom:6px">No hay una clase en curso. Elige la clase de hoy:</p>${hoyCl.length ? hoyCl.map(c => marcar(c, `${esc(hora(c.inicio))} · ${esc(c.tipo_nombre)} · ${esc(sedeN(c.sede_id))} (${c.ocupados}/${c.cupos})`, c.ocupados >= c.cupos ? ' disabled' : '')).join('') : '<div class="g-vacio">Hoy no hay clases.</div>'}`;
      if ((ck.otras || []).length) check += `<p style="margin-top:10px;font-size:.95rem">Hoy también tiene: ${ck.otras.map(o => `${esc(hora(o.inicio))} ${esc(sedeN(o.sede_id))}${o.estado === 'espera' ? ' (en espera)' : ''}`).join(' y ')}.</p>`;
    }
    const acts = f.actividades.filter(a => a.clave !== 'clase' && a.roles.includes(E.yo.rol));
    $('#sub-cont').innerHTML = `
      <div id="nivel-up"></div>
      <div class="g-card"><h3>Marcar asistencia</h3>${check}</div>
      ${acts.length ? `<div class="g-card"><h3>Sumar estrellas</h3><div style="display:grid;gap:10px">${acts.map(a => a.por_monto ? `<form class="g-chat-form" data-monto="${a.clave}"><input type="number" min="1" step="0.01" inputmode="decimal" placeholder="Monto de la compra $" aria-label="Monto de la compra" required><button class="g-btn" type="submit">${esc(a.nombre)} · +${a.estrellas} ${estrella} c/${plata(a.por_monto)}</button></form>`
        : `<button class="g-btn sec" type="button" data-sumar="${a.clave}" style="justify-content:space-between;width:100%"><span>${esc(a.nombre)}</span><span>+${a.estrellas} ${estrella}</span></button>`).join('')}</div></div>` : ''}
      <div class="g-card"><h3>Historial</h3>${f.movimientos.length ? f.movimientos.map(m => `<div class="g-fila g-mov${m.anulado ? ' anulado' : ''}"><div><b>${esc(m.titulo)}${m.monto ? ' · ' + plata(m.monto) : ''}</b><small>${esc(cuando(m.creado))}${m.staff ? ' · ' + esc(m.staff) : ''}${m.anulado ? ' · anulado' : ''}</small></div>
        <div class="der"><span class="g-mov-est${m.estrellas < 0 ? ' neg' : ''}">${m.estrellas > 0 ? '+' : ''}${m.estrellas} ${estrella}</span>${!m.anulado && m.actividad !== 'anulacion' && (E.yo.rol === 'admin' || m.propio_reciente) ? `<br><button class="g-enlace" data-anular="${m.id}" type="button">Anular</button>` : ''}</div></div>`).join('') : '<div class="g-vacio">Aún no tiene estrellas.</div>'}</div>`;
    $('#sub-cont').querySelectorAll('[data-marcar]').forEach(b => b.onclick = () => dar(b, () => rpc('marcar_clase', { p_ref: E.f.ref, p_clase: +b.dataset.marcar })));
    $('#sub-cont').querySelectorAll('[data-sumar]').forEach(b => b.onclick = () => dar(b, () => rpc('sumar', { p_ref: E.f.ref, p_actividad: b.dataset.sumar })));
    $('#sub-cont').querySelectorAll('[data-monto]').forEach(fm => fm.onsubmit = ev => { ev.preventDefault(); dar(fm.querySelector('button'), () => rpc('sumar', { p_ref: E.f.ref, p_actividad: fm.dataset.monto, p_monto: +fm.querySelector('input').value })); });
    $('#sub-cont').querySelectorAll('[data-anular]').forEach(b => b.onclick = async () => { if (!confirm('¿Anular este movimiento? Quedará registrado y se descontarán sus estrellas.')) return;
      const r = await accion(b, () => rpc('anular', { p_mov: +b.dataset.anular }), 'Anulado.'); if (r) await recargarFicha(); });
  }
  async function dar(boton, fn) {
    const r = await accion(boton, fn); if (!r) return;
    const nv = r.ficha.nivel.actual.nombre, subio = r.nivel_antes !== nv, f = r.ficha;
    aviso(`+${r.sumadas} ★ · total ${f.estrellas}`, 'ok');
    await recargarFicha();
    if (subio) $('#nivel-up').innerHTML = `<div class="g-card oscura" style="margin-bottom:18px"><h3 style="color:var(--fx-accent)">¡Subió a ${esc(nv)}!</h3><p>${esc(f.nivel.actual.beneficios)}</p>
      <a class="g-btn" style="margin-top:10px" target="_blank" rel="noopener" href="${esc(waSocia(f.telefono, `¡${primer(f.nombre)}, subiste a nivel ${nv} en ${D.corto}! 💪\n${f.nivel.actual.beneficios}`))}">Avisarle por WhatsApp</a></div>`;
  }

  /* ---- Perfil: objetivos, lesiones, racha, meses, notas ---- */
  function subPerfil() {
    const p = E.prog, max = Math.max(1, ...p.meses.map(m => m.n)), edit = rolCA();
    $('#sub-cont').innerHTML = `
      <div class="g-kpis"><div class="g-kpi"><small>Racha semanal</small><b>${p.racha}</b></div><div class="g-kpi"><small>Retos aprobados</small><b>${p.retos}</b></div><div class="g-kpi"><small>Última clase</small><b style="font-size:1.4rem">${p.ultima ? esc(cuando(p.ultima)) : '—'}</b></div></div>
      <div class="g-card" style="margin-top:18px"><h3>Clases por mes</h3>${p.meses.map(m => `<div class="g-fila" style="padding:6px 0;border:0"><span style="min-width:64px;font-weight:700">${esc(m.mes)}</span><div class="fx-barra sobre-claro" style="flex:1;color:var(--fx-ink)"><i style="--w:${(m.n / max).toFixed(2)}"></i></div><b>${m.n}</b></div>`).join('')}
        ${p.tipos ? `<h4>Tipos de clase</h4><div style="display:flex;flex-wrap:wrap;gap:8px">${Object.entries(p.tipos).map(([k, v]) => `<span class="g-chip suave">${esc(tipoN(k))} · ${v}</span>`).join('')}</div>` : ''}</div>
      <div class="g-card"><h3>Objetivo y lesiones</h3>${edit ? `<form id="f-perfil"><label class="g-campo">Objetivo<input id="p-obj" maxlength="200" value="${esc(p.objetivo || '')}"></label><label class="g-campo">Patologías, lesiones o restricciones<textarea id="p-les" maxlength="500">${esc(p.lesiones || '')}</textarea></label><button class="g-btn" type="submit">Guardar</button></form>`
        : `<p><b>Objetivo:</b> ${esc(p.objetivo || 'Sin definir')}</p><p><b>Lesiones:</b> ${esc(p.lesiones || 'Ninguna')}</p>`}</div>
      ${p.ve_notas ? `<div class="g-card"><h3>Notas del equipo</h3><form class="g-chat-form" id="f-nota"><input id="n-t" maxlength="1000" placeholder="Escribe una nota (solo la ve el equipo técnico)" required><button class="g-btn" type="submit">Guardar</button></form>
        ${p.notas.length ? p.notas.map(n => `<div class="g-fila"><div><b style="font-size:1rem;text-transform:none;font-family:var(--fx-font-txt);font-weight:600">${esc(n.texto)}</b><small>${esc(n.autor || 'Sistema')} · ${esc(cuando(n.creado))}</small></div>${n.autor === null ? '' : (n.mia || E.yo.rol === 'admin') ? `<button class="g-enlace" data-bn="${n.id}" type="button">Borrar</button>` : ''}</div>`).join('') : '<div class="g-vacio">Sin notas.</div>'}</div>` : '<div class="g-card"><div class="g-vacio">Las notas y fotos son del equipo técnico (coach y administración).</div></div>'}`;
    const fp = $('#f-perfil'); if (fp) fp.onsubmit = async ev => { ev.preventDefault(); const r = await accion(ev.submitter, () => rpc('perfil', { p_ref: E.f.ref, p_objetivo: $('#p-obj').value, p_lesiones: $('#p-les').value }), 'Guardado.'); if (r) await recargarFicha(); };
    const fn = $('#f-nota'); if (fn) fn.onsubmit = async ev => { ev.preventDefault(); const r = await accion(ev.submitter, () => rpc('nota', { p_ref: E.f.ref, p_texto: $('#n-t').value }), 'Nota guardada.'); if (r) await recargarFicha(); };
    $('#sub-cont').querySelectorAll('[data-bn]').forEach(b => b.onclick = async () => { if (!confirm('¿Borrar esta nota?')) return; const r = await accion(b, () => rpc('borrar_nota', { p_id: +b.dataset.bn })); if (r) await recargarFicha(); });
  }

  /* ---- Plan: plan, vencimiento, clases, sede, horario (recepción y admin) ---- */
  function subPlan() {
    const c = E.core;
    $('#sub-cont').innerHTML = `<div class="g-card"><h3>Plan y datos</h3><form id="f-plan">
      <label class="g-campo">Plan<select id="m-plan"><option value="">Sin plan</option>${E.cat.planes.map(p => `<option value="${p.id}" ${p.id === c.plan_id ? 'selected' : ''}>${esc(p.nombre)} · ${esc(p.descripcion || '')}</option>`).join('')}</select></label>
      <label class="g-campo">Vence<input type="date" id="m-vence" value="${esc(c.plan_vence || '')}"></label>
      <label class="g-campo">Clases restantes<input type="number" min="0" max="1000" id="m-cl" value="${c.clases_restantes ?? ''}" placeholder="Vacío = ilimitadas"><small>Si lo dejas vacío y el plan tiene tope, se repone con las clases del plan.</small></label>
      <label class="g-campo">Sede habitual<select id="m-sede"><option value="">Sin definir</option>${E.cat.sedes.map(s => `<option value="${s.id}" ${s.id === c.sede_id ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select></label>
      <label class="g-campo">Horario fijo<input id="m-hor" maxlength="120" value="${esc(c.horario_fijo || '')}" placeholder="Ej.: Lun-Mié-Vie 18:00"></label>
      <label class="g-campo">Nacimiento<input type="date" id="m-nac" value="${esc(c.nacimiento || '')}"></label>
      <button class="g-btn" type="submit">Guardar</button></form></div>`;
    $('#f-plan').onsubmit = async ev => { ev.preventDefault();
      const r = await accion(ev.submitter, () => rpc('mycore_guardar', { p_ref: E.f.ref, p_nacimiento: $('#m-nac').value || null, p_sede: +$('#m-sede').value || null, p_plan: +$('#m-plan').value || null, p_vence: $('#m-vence').value || null, p_horario: $('#m-hor').value, p_clases: $('#m-cl').value === '' ? null : +$('#m-cl').value }), 'Guardado.');
      if (r) await recargarFicha(); };
  }

  /* ---- Rutina semanal con la socia ---- */
  function subRutina() {
    const lun = GU.lunes(hoy()), act = E.rut.find(r => r.semana === lun);
    const bl = r => r.bloques.map(b => `<div class="g-bloque"><b>${esc(b.nombre)}</b>${esc(b.texto)}</div>`).join('');
    $('#sub-cont').innerHTML = `
      ${act ? `<div class="g-card"><div class="g-fila" style="border:0;padding-top:0"><div><b style="font-size:1.4rem">${esc(act.titulo)}</b><small>Semana del ${esc(fechaLarga(act.semana))}</small></div><span class="g-chip ${act.estado === 'cumplida' ? 'ok' : 'lima'}">${act.estado === 'cumplida' ? 'Cumplida' : 'Asignada'}</span></div>${bl(act)}
        ${act.estado === 'asignada' ? `<button class="g-btn" id="b-cumplida" type="button" style="margin-top:12px">Confirmar como cumplida (+2 ${estrella})</button>` : ''}
        <h4>Conversación</h4><div class="g-chat">${act.mensajes.length ? act.mensajes.map(m => `<div class="g-burbuja${m.autor === 'coach' ? ' yo' : ''}">${esc(m.texto)}<small>${esc(m.nombre || '')} · ${esc(cuando(m.creado))}</small></div>`).join('') : '<div class="g-vacio">Sin mensajes.</div>'}</div>
        <form class="g-chat-form" id="f-resp"><input id="r-t" maxlength="1000" placeholder="Responder a la socia" required><button class="g-btn" type="submit">Enviar</button></form></div>` : '<div class="g-card"><div class="g-vacio">No tiene rutina esta semana.</div></div>'}
      <div class="g-card"><h3>Asignar una rutina</h3><form id="f-asig"><label class="g-campo">Plantilla<select id="a-pl">${(E.plantillas || []).map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select></label>
        <label class="g-campo">Semana<select id="a-sem"><option value="${lun}">Esta semana</option><option value="${sumaDias(lun, 7)}">Próxima semana</option></select></label>
        <label class="g-campo">Nota para ella (opcional)<input id="a-nota" maxlength="500" placeholder="Ej.: Haz A y B dos veces en la semana"></label><button class="g-btn" type="submit">Asignar</button></form></div>`;
    const bc = $('#b-cumplida'); if (bc) bc.onclick = async () => { const r = await accion(bc, () => rpc('rutina_confirmar', { p_rutina: act.id }), '+2 ★ por la rutina cumplida.'); if (r) await recargarFicha(); };
    const fr = $('#f-resp'); if (fr) fr.onsubmit = async ev => { ev.preventDefault(); const r = await accion(ev.submitter, () => rpc('rutina_responder', { p_rutina: act.id, p_texto: $('#r-t').value })); if (r) await recargarFicha(); };
    $('#f-asig').onsubmit = async ev => { ev.preventDefault(); const pl = E.plantillas.find(p => p.id === +$('#a-pl').value); if (!pl) return aviso('Crea una plantilla primero.', 'err');
      const r = await accion(ev.submitter, () => rpc('rutina_asignar', { p_ref: E.f.ref, p_semana: $('#a-sem').value, p_plantilla: pl.id, p_titulo: pl.nombre, p_bloques: pl.bloques, p_nota: $('#a-nota').value }), 'Rutina asignada.'); if (r) await recargarFicha(); };
  }

  /* ---- Fotos de progreso (coach y admin) ---- */
  function subFotos() {
    const c = E.core;
    $('#sub-cont').innerHTML = `<div class="g-card"><h3>Fotos de progreso</h3><p style="margin-bottom:12px">Privadas: solo las ven la socia y el equipo técnico.</p>
      <div class="g-fotos">${c.fotos.map(f => `<figure class="g-foto">${GU.img(f.path, 'progreso', 'Foto de progreso')}<figcaption>${esc(cuando(f.creado))}${f.nota ? ' · ' + esc(f.nota) : ''}</figcaption><button type="button" data-bf="${f.id}" aria-label="Borrar foto">×</button></figure>`).join('')}</div>
      ${c.fotos.length ? '' : '<div class="g-vacio">Sin fotos todavía.</div>'}<label class="g-btn" style="margin-top:12px">Subir foto<input type="file" id="f-up" accept="image/jpeg,image/png,image/webp" class="g-solo-lector"></label></div>`;
    GU.pintarFotos($('#sub-cont'));
    $('#f-up').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      const r = await accion(null, async () => rpc('foto_progreso', { p_ref: E.f.ref, p_path: await GYM.subirFoto(f, 'progreso', E.core.carpeta_archivos), p_nota: null }), 'Foto guardada.'); if (r) await recargarFicha(); };
    $('#sub-cont').querySelectorAll('[data-bf]').forEach(b => b.onclick = async () => { if (!confirm('¿Borrar esta foto?')) return; const r = await accion(b, () => rpc('foto_progreso_borrar', { p_id: +b.dataset.bf }), 'Foto borrada.'); if (r) await recargarFicha(); });
  }

  /* ------------------------------------------------------------ CLASES del día */
  async function pintarClases() {
    const cl = await rpc('clases_dia', { p_dia: E.diaSel }), dias = Array.from({ length: 8 }, (_, i) => sumaDias(hoy(), i - 1));
    $('#p-clases').innerHTML = `<div class="g-dias" id="c-dias">${dias.map(d => `<button type="button" data-d="${d}" aria-pressed="${d === E.diaSel}"><small>${d === hoy() ? 'Hoy' : GU.dowCorto(d)}</small><b>${GU.diaNum(d)}</b></button>`).join('')}</div>
      <div id="c-lista">${cl.length ? cl.map(c => `<div class="g-card"><div class="g-fila" style="border:0;padding-top:0"><div><b style="font-size:1.5rem">${esc(hora(c.inicio))} · ${esc(c.tipo_nombre)}</b><small>${esc(c.coach || '')} · ${esc(sedeN(c.sede_id))}</small></div>
          <div class="der"><b style="font:900 1.6rem var(--fx-font-disp)">${c.ocupados}/${c.cupos}</b>${E.yo.rol === 'admin' ? `<br><button class="g-enlace" data-cc="${c.id}" type="button">Cancelar clase</button>` : ''}</div></div>
        <div class="fx-barra sobre-claro" style="color:var(--fx-ink);margin-bottom:6px"><i style="--w:${Math.min(1, c.ocupados / c.cupos).toFixed(2)}"></i></div>
        ${c.alumnas.length ? c.alumnas.map(a => `<div class="g-fila" style="padding:8px 0"><button class="g-enlace" data-ref="${esc(a.ref)}" type="button" style="text-align:left;text-decoration:none;font-weight:700">${esc(a.nombre)}${a.lesiones ? ' <span class="g-chip err">⚠ ' + esc(a.lesiones) + '</span>' : ''}</button>
          <span class="g-chip ${a.estado === 'asistio' ? 'ok' : a.estado === 'espera' ? 'aviso' : a.estado === 'falta' ? 'err' : 'suave'}">${{ asistio: 'Asistió', espera: 'En espera', falta: 'Faltó', confirmada: 'Reservada' }[a.estado]}</span></div>`).join('') : '<div class="g-vacio">Nadie ha reservado todavía.</div>'}</div>`).join('') : '<div class="g-vacio">No hay clases ese día.</div>'}</div>`;
    $('#c-dias').querySelectorAll('button').forEach(b => b.onclick = () => { E.diaSel = b.dataset.d; pintarClases(); });
    $('#c-lista').querySelectorAll('[data-ref]').forEach(b => b.onclick = () => abrirFicha(b.dataset.ref));
    $('#c-lista').querySelectorAll('[data-cc]').forEach(b => b.onclick = async () => { if (!confirm('¿Cancelar esta clase? Se devuelve la clase a cada socia reservada.')) return; const r = await accion(b, () => rpc('clase_cancelar', { p_clase: +b.dataset.cc }), 'Clase cancelada.'); if (r !== undefined) pintarClases(); });
    if (window.fxVigilar) window.fxVigilar($('#p-clases'));
  }

  /* ------------------------------------------------------------ SOCIAS */
  const FILTROS = [['todas', 'Todas'], ['vencen', 'Por vencer'], ['vencidas', 'Vencidas'], ['ausentes', 'Sin venir 14+ días'], ['lesion', 'Con lesión']];
  async function pintarSocias() {
    E.socias = E.socias || await rpc('socias_lista');
    $('#p-socias').innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:12px"><input id="s-q" class="g-campo" style="margin:0;flex:1;min-width:200px;min-height:48px;padding:0 12px;border:2px solid var(--fx-deep);border-radius:6px;font:400 1.05rem var(--fx-font-txt)" placeholder="Buscar por nombre o código" value="${esc(E.q)}" aria-label="Buscar socias">
      ${E.yo.rol !== 'coach' ? '<button class="g-btn" id="b-nueva" type="button">Nueva socia</button>' : ''}</div>
      <div class="g-sedes" id="s-filt">${FILTROS.map(([k, t]) => `<button type="button" data-k="${k}" aria-pressed="${k === E.filtro}">${t}</button>`).join('')}</div><div id="s-lista"></div>`;
    $('#s-q').oninput = e => { E.q = e.target.value; lista(); };
    $('#s-filt').querySelectorAll('button').forEach(b => b.onclick = () => { E.filtro = b.dataset.k; pintarSocias(); });
    const nb = $('#b-nueva'); if (nb) nb.onclick = nueva;
    lista();
    function lista() {
      const q = E.q.trim().toLowerCase(), t = Date.now();
      const l = E.socias.filter(s => (!q || s.nombre.toLowerCase().includes(q) || s.codigo.toLowerCase().includes(q)) && ({ todas: () => true, vencen: () => s.plan_vence && dd(s.plan_vence) >= 0 && dd(s.plan_vence) <= 7, vencidas: () => s.plan_vence && dd(s.plan_vence) < 0,
        ausentes: () => !s.ultima || (t - new Date(s.ultima)) > 14 * 864e5, lesion: () => s.lesion }[E.filtro])());
      $('#s-lista').innerHTML = l.length ? `<div class="g-card" style="padding:6px 16px">${l.map(s => `<div class="g-fila"><button class="g-enlace" data-ref="${esc(s.ref)}" type="button" style="text-align:left;text-decoration:none"><b style="font:800 1.15rem var(--fx-font-disp);text-transform:uppercase">${esc(s.nombre)}</b>
        <small style="display:block;font-weight:400">${esc(s.plan || 'Sin plan')} · ${esc(s.nivel)} · ${s.estrellas} ★ · ${s.clases_mes} clases este mes${s.ultima ? ' · última ' + esc(cuando(s.ultima)) : ' · aún no viene'}</small></button>
        <div class="der">${s.lesion ? '<span class="g-chip err">⚠</span> ' : ''}${s.plan_vence ? venceChip(s.plan_vence) : ''}</div></div>`).join('')}</div>` : '<div class="g-vacio">Nadie coincide con ese filtro.</div>';
      $('#s-lista').querySelectorAll('[data-ref]').forEach(b => b.onclick = () => abrirFicha(b.dataset.ref));
    }
  }
  function nueva() {
    dlg.innerHTML = `<form id="f-nueva" method="dialog"><h2>Nueva socia</h2><label class="g-campo">Nombre y apellido<input id="n-nom" autocomplete="off" required></label><label class="g-campo">WhatsApp<input id="n-tel" inputmode="tel" placeholder="09XXXXXXXX" required></label>
      <label class="g-campo">Plan<select id="n-plan"><option value="">Sin plan aún</option>${E.cat.planes.map(p => `<option value="${p.id}">${esc(p.nombre)} · ${esc(p.descripcion || '')}</option>`).join('')}</select></label>
      <p class="g-err" id="n-err" role="alert"></p><div class="g-dlg-acc"><button type="button" class="g-btn sec" id="n-x">Cancelar</button><button class="g-btn" type="submit">Crear tarjeta</button></div></form>`;
    dlg.showModal(); $('#n-x').onclick = () => dlg.close();
    $('#f-nueva').onsubmit = async ev => { ev.preventDefault();
      const r = await accion(ev.submitter, () => rpc('registrar', { p_nombre: $('#n-nom').value, p_telefono: $('#n-tel').value, p_plan: +$('#n-plan').value || null }).catch(e => { $('#n-err').textContent = e.message; throw e; }));
      if (!r) return; E.socias = null; const f = r.ficha, url = new URL('tarjeta.html', location.href).href;
      dlg.innerHTML = `<h2>${r.existente ? 'Ya estaba registrada' : '¡Tarjeta creada!'}</h2><p><b>${esc(f.nombre)}</b> · código</p><p class="g-codigo" style="margin:6px 0 12px">${esc(f.codigo)}</p>
        <p style="margin-bottom:12px">Envíale su tarjeta por WhatsApp: con su código y los últimos 4 dígitos de su celular entra a ver sus estrellas y reservar.</p>
        <div class="g-dlg-acc"><button class="g-btn sec" id="n-ok" type="button">Cerrar</button><a class="g-btn" target="_blank" rel="noopener" href="${esc(waSocia(f.telefono, `Hola ${primer(f.nombre)}, ¡bienvenida a ${D.corto}! 💪 Esta es tu tarjeta de estrellas.\nTu código: ${f.codigo}\nEntra aquí con tu código y los últimos 4 dígitos de tu WhatsApp: ${url}`))}">Enviar por WhatsApp</a></div>`;
      $('#n-ok').onclick = () => { dlg.close(); abrirFicha(f.ref); }; };
  }

  /* ------------------------------------------------------------ RUTINAS: plantillas y asignación a varias */
  async function pintarRutinas() {
    E.plantillas = await rpc('plantillas'); E.socias = E.socias || await rpc('socias_lista');
    const lun = GU.lunes(hoy());
    $('#p-rutinas').innerHTML = `<p style="margin-bottom:14px">${esc(P.rutinas_txt)}</p>
      <div class="g-card"><div class="g-fila" style="border:0;padding-top:0"><h3 style="margin:0">Plantillas</h3><button class="g-btn peq" id="b-npl" type="button">Nueva plantilla</button></div>
        ${E.plantillas.length ? E.plantillas.map(p => `<div class="g-fila"><div><b>${esc(p.nombre)}</b><small>${esc(p.descripcion || '')}${p.descripcion ? ' · ' : ''}${esc(p.bloques.map(b => b.nombre).join(' · '))}</small></div><div class="der"><button class="g-btn peq sec" data-ed="${p.id}" type="button">Editar</button></div></div>`).join('') : '<div class="g-vacio">Aún no hay plantillas. Crea la primera.</div>'}</div>
      <div class="g-card"><h3>Asignar a varias socias</h3><form id="f-varias"><label class="g-campo">Plantilla<select id="v-pl">${E.plantillas.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select></label>
        <label class="g-campo">Semana<select id="v-sem"><option value="${lun}">Esta semana</option><option value="${sumaDias(lun, 7)}">Próxima semana</option></select></label>
        <p style="font-weight:700;margin-bottom:6px">Socias</p><div style="max-height:260px;overflow:auto;border:2px solid var(--fx-deep);border-radius:6px;padding:4px 12px;background:#fff;margin-bottom:12px">${E.socias.map(s => `<label class="g-fila" style="cursor:pointer"><span>${esc(s.nombre)}<small>${s.rutina ? 'Ya tiene esta semana: ' + (s.rutina === 'cumplida' ? 'cumplida' : 'asignada') : 'Sin rutina esta semana'}</small></span><input type="checkbox" value="${esc(s.ref)}" style="width:26px;height:26px"></label>`).join('')}</div>
        <button class="g-btn" type="submit">Asignar</button></form></div>`;
    $('#b-npl').onclick = () => editarPlantilla(null);
    $('#p-rutinas').querySelectorAll('[data-ed]').forEach(b => b.onclick = () => editarPlantilla(E.plantillas.find(p => p.id === +b.dataset.ed)));
    $('#f-varias').onsubmit = async ev => { ev.preventDefault(); const refs = [...$('#f-varias').querySelectorAll('input[type=checkbox]:checked')].map(i => i.value);
      if (!refs.length) return aviso('Marca al menos una socia.', 'err');
      const r = await accion(ev.submitter, () => rpc('rutina_asignar_varias', { p_plantilla: +$('#v-pl').value, p_refs: refs, p_semana: $('#v-sem').value }), n => `Rutina asignada a ${n} ${n === 1 ? 'socia' : 'socias'}.`);
      if (r !== undefined) { E.socias = null; pintarRutinas(); } };
  }
  function editarPlantilla(p) {
    const bl = (p ? p.bloques : [{ nombre: 'Rutina A', texto: '' }]).map(b => ({ ...b }));
    const pintar = () => {
      dlg.innerHTML = `<form id="f-pl" method="dialog"><h2>${p ? 'Editar' : 'Nueva'} plantilla</h2><label class="g-campo">Nombre<input id="pl-n" maxlength="80" value="${esc(p ? p.nombre : '')}" required></label><label class="g-campo">Descripción<input id="pl-d" maxlength="300" value="${esc(p ? p.descripcion || '' : '')}"></label>
        ${bl.map((b, i) => `<div class="g-bloque" style="margin-top:8px"><label class="g-campo" style="margin-bottom:8px">Bloque ${i + 1}<input data-bn="${i}" value="${esc(b.nombre)}" maxlength="60"></label><label class="g-campo" style="margin:0">Ejercicios<textarea data-bt="${i}" maxlength="500">${esc(b.texto)}</textarea></label>${bl.length > 1 ? `<button class="g-enlace" data-bq="${i}" type="button">Quitar bloque</button>` : ''}</div>`).join('')}
        <button class="g-btn sec peq" id="pl-add" type="button" style="margin-top:10px">+ Agregar bloque</button><p class="g-err" id="pl-err" role="alert"></p>
        <div class="g-dlg-acc">${p ? '<button type="button" class="g-btn rojo peq" id="pl-del">Eliminar</button>' : ''}<button type="button" class="g-btn sec" id="pl-x">Cancelar</button><button class="g-btn" type="submit">Guardar</button></div></form>`;
      const sinc = () => { dlg.querySelectorAll('[data-bn]').forEach(i => bl[+i.dataset.bn].nombre = i.value); dlg.querySelectorAll('[data-bt]').forEach(i => bl[+i.dataset.bt].texto = i.value); };
      $('#pl-add').onclick = () => { sinc(); bl.push({ nombre: 'Rutina ' + String.fromCharCode(65 + bl.length), texto: '' }); pintar(); };
      dlg.querySelectorAll('[data-bq]').forEach(b => b.onclick = () => { sinc(); bl.splice(+b.dataset.bq, 1); pintar(); });
      $('#pl-x').onclick = () => dlg.close();
      const del = $('#pl-del'); if (del) del.onclick = async () => { if (!confirm('¿Eliminar esta plantilla? Las rutinas ya asignadas no cambian.')) return; const r = await accion(del, () => rpc('plantilla_borrar', { p_id: p.id }), 'Plantilla eliminada.'); if (r) { dlg.close(); pintarRutinas(); } };
      $('#f-pl').onsubmit = async ev => { ev.preventDefault(); sinc();
        const r = await accion(ev.submitter, () => rpc('plantilla_guardar', { p_id: p ? p.id : null, p_nombre: $('#pl-n').value, p_descripcion: $('#pl-d').value, p_bloques: bl.filter(b => b.nombre.trim() || b.texto.trim()) }).catch(e => { $('#pl-err').textContent = e.message; throw e; }), 'Plantilla guardada.');
        if (r) { dlg.close(); pintarRutinas(); } };
    };
    pintar(); dlg.showModal();
  }

  /* ------------------------------------------------------------ RETOS: el personal aprueba antes de dar estrellas */
  async function pintarRetos() {
    await refrescarPend(); pintarTabs();
    $('#p-retos').innerHTML = `<p style="margin-bottom:14px">${esc(P.retos_txt)}</p>${E.pend.length ? E.pend.map(e => `<div class="g-card"><div class="g-fila" style="border:0;padding-top:0"><div><b>${esc(e.socia)}</b><small>${esc(e.reto || 'Reto')} · ${esc(cuando(e.creado))}</small></div></div>
      <div class="g-fotos" style="grid-template-columns:minmax(0,260px)"><figure class="g-foto">${GU.img(e.path, 'reto', 'Foto del reto de ' + e.socia)}</figure></div>
      <div style="display:grid;gap:8px;margin-top:12px"><button class="g-btn" data-ap="${e.id}" data-pub="1" type="button">Aprobar y publicar en la galería</button><button class="g-btn sec" data-ap="${e.id}" data-pub="0" type="button">Aprobar sin publicar</button><button class="g-btn rojo" data-rech="${e.id}" type="button">Rechazar</button></div></div>`).join('') : '<div class="g-card"><div class="g-vacio">No hay fotos por revisar. ¡Todo al día!</div></div>'}`;
    GU.pintarFotos($('#p-retos'));
    $('#p-retos').querySelectorAll('[data-ap]').forEach(b => b.onclick = async () => { const r = await accion(b, () => rpc('reto_revisar', { p_envio: +b.dataset.ap, p_aprobar: true, p_publico: b.dataset.pub === '1' }), 'Aprobada: la socia suma sus estrellas.'); if (r) { E.socias = null; pintarRetos(); } });
    $('#p-retos').querySelectorAll('[data-rech]').forEach(b => b.onclick = async () => { const r = await accion(b, () => rpc('reto_revisar', { p_envio: +b.dataset.rech, p_aprobar: false, p_publico: false }), 'Rechazada. No suma estrellas.'); if (r) pintarRetos(); });
  }

  /* ------------------------------------------------------------ RESUMEN del negocio */
  async function pintarResumen() {
    const [r, cfg] = await Promise.all([rpc('resumen'), E.yo.rol === 'admin' ? rpc('config_admin') : null]);
    const k = (t, v, alerta, suf) => `<div class="g-kpi${alerta ? ' alerta' : ''}"><small>${t}</small><b class="fx-contador" data-contador="${v ?? 0}">${v ?? '—'}</b>${suf || ''}</div>`;
    $('#p-resumen').innerHTML = `<div class="g-kpis">${k('Socias', r.socias)}${k('Nuevas este mes', r.nuevas_mes)}${k('Activas este mes', r.activas_mes)}${k('Asistencias del mes', r.asistencias_mes)}${k('Ocupación (7 días) %', r.ocupacion_7d)}${k('Estrellas del mes', r.estrellas_mes)}${k('Planes que vencen (7 días)', r.vencen_7d, r.vencen_7d > 0)}${k('Planes vencidos', r.vencidas, r.vencidas > 0)}</div>
      <p style="margin-top:14px;font-size:.95rem">${esc(P.resumen_txt)}</p>
      ${cfg ? `<div class="g-card" style="margin-top:18px"><h3>Equipo</h3>${cfg.equipo.map(u => `<div class="g-fila"><div><b>${esc(u.nombre)}</b><small>${esc(u.email || '')}</small></div><span class="g-chip lima">${esc(ROLES[u.rol])}</span></div>`).join('')}
        <p style="margin-top:10px;font-size:.95rem">Reservas hasta ${cfg.config.reserva_dias} días antes · cancelación con ${cfg.config.cancelar_horas} h de aviso · máximo ${cfg.config.max_reservas_activas} reservas activas por socia.</p></div>` : ''}`;
    if (window.fxVigilar) window.fxVigilar($('#p-resumen'));
  }

  /* ------------------------------------------------------------ arranque */
  async function iniciar() {
    document.querySelectorAll('[data-wa]').forEach(a => { a.href = GU.wa(a.dataset.wa, 'flotante'); a.target = '_blank'; a.rel = 'noopener'; });
    const pro = barraPlan();
    $('#sin-pro').classList.toggle('g-oculto', pro);
    if (!pro) { $('#entrada').classList.add('g-oculto'); $('#app').classList.add('g-oculto'); $('#b-salir').classList.add('g-oculto'); return; }
    E.yo = await GYM.staff.sesion().catch(() => null);
    $('#entrada').classList.toggle('g-oculto', !!E.yo); $('#app').classList.toggle('g-oculto', !E.yo); $('#b-salir').classList.toggle('g-oculto', !E.yo);
    if (!E.yo) { pintarEntrada(); return; }
    E.cat = await rpc('catalogo'); E.socias = null; E.plantillas = null; E.tab = 'hoy';
    await ir('hoy');
  }
  iniciar();
})();
