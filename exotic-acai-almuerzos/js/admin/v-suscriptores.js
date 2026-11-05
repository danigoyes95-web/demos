/* Suscriptores · lista, filtros e historial por cliente */
(function () {
  'use strict';
  const { $, esc, fmt, icon } = EA, C = CFG, A = ADM;
  const F = { q: '', plan: '', publico: '', estado: '', zona: '' };

  A.views.suscriptores = (el, nivel) => {
    const edit = nivel === 'edit'; let max = 25;
    const sel = (id, ph, opts) => '<select class="inp" id="' + id + '" aria-label="' + ph + '"><option value="">' + ph + '</option>' + opts.map(([v, l]) => '<option value="' + v + '"' + (F[id.slice(1)] === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>';
    el.innerHTML = '<div class="pg-h"><div><h2 style="font-size:1.7rem">Suscriptores</h2><p id="cnt"></p></div>' + A.soloLectura(nivel) + '</div><div class="cd"><div class="fbar"><input class="inp" id="fq" type="search" placeholder="Buscar por nombre, teléfono o ID" value="' + esc(F.q) + '" aria-label="Buscar">' +
      sel('fplan', 'Todos los planes', Object.values(C.plans).map((p) => [p.id, p.nombre])) + sel('fpublico', 'Todos los públicos', Object.entries(A.PUB)) + sel('festado', 'Todos los estados', [['activo', 'Activo'], ['pausado', 'Pausado'], ['cancelado', 'Cancelado']]) + sel('fzona', 'Todas las zonas', C.zonas.map((z) => [z.id, z.nombre])) +
      '</div><div class="tw"><table class="tbl"><thead><tr><th>Suscriptor</th><th>Plan</th><th>Público</th><th>Estado</th><th>Zona</th><th>Renovación</th><th class="r">Mensual</th></tr></thead><tbody id="tb"></tbody></table></div><div id="mas" style="text-align:center;margin-top:12px"></div></div>';
    const lista = () => {
      const q = F.q.toLowerCase().trim();
      return EA.state.subs.filter((s) => (!q || (s.nombre + ' ' + s.tel + ' ' + s.id).toLowerCase().includes(q)) && (!F.plan || s.plan === F.plan) && (!F.publico || s.publico === F.publico) && (!F.estado || A.estado(s) === F.estado) && (!F.zona || s.zona === F.zona))
        .sort((a, b) => (A.estado(a) === 'cancelado') - (A.estado(b) === 'cancelado') || b.inicio.localeCompare(a.inicio));
    };
    const draw = () => {
      const L = lista(), cs = { activo: 0, pausado: 0, cancelado: 0 }; EA.state.subs.forEach((s) => cs[A.estado(s)]++);
      $('#cnt').textContent = cs.activo + ' activos · ' + cs.pausado + ' pausados · ' + cs.cancelado + ' cancelados · mostrando ' + Math.min(max, L.length) + ' de ' + L.length;
      $('#tb').innerHTML = L.slice(0, max).map((s) => { const e = A.estado(s); return '<tr class="click" data-id="' + s.id + '" tabindex="0"><td><b>' + esc(s.nombre) + '</b><br><small class="hint">' + s.id + (s.demo ? ' · creado en la demo' : '') + '</small></td><td>' + esc(C.plans[s.plan].nombre.replace('Plan ', '')) + '<br><small class="hint">' + C.frecuencias[s.frec].almuerzos + ' almuerzos</small></td><td>' + A.PUB[s.publico] + '</td><td><span class="st ' + e + '">' + A.cap(e) + '</span></td><td>' + esc(EA.zona(s.zona).nombre) + '</td><td>' + (e === 'cancelado' ? '—' : fmt.fechaCorta(EA.proximaRenovacion(s))) + '</td><td class="r">' + fmt.money(s.precio, 0) + '</td></tr>'; }).join('') || '<tr><td colspan="7" class="vacio">Nadie coincide con esos filtros.</td></tr>';
      $('#mas').innerHTML = L.length > max ? '<button class="btn btn-ghost btn-sm" id="vm">Ver más (' + (L.length - max) + ')</button>' : '';
    };
    el.oninput = (e) => { if (e.target.id === 'fq') { F.q = e.target.value; max = 25; draw(); } };
    el.onchange = (e) => { if (/^f(plan|publico|estado|zona)$/.test(e.target.id)) { F[e.target.id.slice(1)] = e.target.value; max = 25; draw(); } };
    el.onclick = (e) => { if (e.target.closest('#vm')) { max += 25; draw(); return; } const r = e.target.closest('[data-id]'); if (r) ficha(r.dataset.id, edit, draw); };
    el.onkeydown = (e) => { if (e.key === 'Enter') { const r = e.target.closest('[data-id]'); if (r) ficha(r.dataset.id, edit, draw); } };
    draw();
  };

  function ficha(id, edit, redraw) {
    const s = EA.state.subs.find((x) => x.id === id); if (!s) return; const e = A.estado(s);
    const ev = [{ f: s.inicio, t: 'Alta', d: (s.fuente ? 'Vino de ' + (A.FUENTE[s.fuente] || s.fuente) : '') + (s.campana ? ' · campaña ' + s.campana : ''), g: 1 }];
    EA.state.pagos.filter((p) => p.sub === id).forEach((p) => ev.push({ f: p.f, t: (p.nuevo ? 'Primer cobro' : 'Cobro mensual') + ' · ' + fmt.money(p.monto), d: 'Estado: ' + p.estado + (p.nota ? ' · ' + p.nota : ''), g: p.estado === 'cobrado' }));
    (s.pausas || []).forEach((p) => { ev.push({ f: p[0], t: 'Pausó su suscripción', d: p[1] ? 'Retomó el ' + fmt.fecha(p[1]) : 'Sigue en pausa' }); if (p[1]) ev.push({ f: p[1], t: 'Retomó su suscripción', d: '', g: 1 }); });
    if (s.fin) ev.push({ f: s.fin, t: 'Canceló su suscripción', d: '' });
    ev.sort((a, b) => b.f.localeCompare(a.f));
    const d = A.drawer('<h3 style="font-size:1.5rem">' + esc(s.nombre) + '</h3><p><span class="st ' + e + '">' + A.cap(e) + '</span> <span class="hint">' + s.id + '</span></p>' +
      '<dl class="dl"><dt>Plan</dt><dd>' + esc(C.plans[s.plan].nombre) + ' · ' + C.frecuencias[s.frec].almuerzos + ' almuerzos' + (s.porcion !== 'normal' ? ' · ' + s.porcion : '') + '</dd><dt>Público</dt><dd>' + A.PUB[s.publico] + '</dd><dt>Mensual</dt><dd>' + fmt.money(s.precio) + '</dd><dt>Teléfono</dt><dd>' + esc(s.tel) + '</dd><dt>Correo</dt><dd>' + esc(s.email) + '</dd><dt>Entrega</dt><dd>' + (s.zona === 'retiro' ? 'Retiro en local' : esc(s.direccion) + ' · ' + esc(EA.zona(s.zona).nombre)) + (s.ventana ? ' · ' + s.ventana : '') + '</dd><dt>Dieta</dt><dd>' + esc((s.restricciones || []).join(', ') || '—') + '</dd><dt>Alergias</dt><dd>' + esc((s.alergias || []).join(', ') || '—') + (s.notas ? '<br>' + esc(s.notas) : '') + '</dd><dt>Renueva</dt><dd>' + (e === 'cancelado' ? '—' : fmt.fecha(EA.proximaRenovacion(s))) + '</dd></dl>' +
      (edit && e !== 'cancelado' ? '<div class="btn-fila">' + (e === 'pausado' ? '<button class="mini" id="rs">' + icon('play') + ' Reanudar</button>' : '<button class="mini" id="ps">' + icon('pause') + ' Pausar</button>') + '<button class="mini pel" id="cn">Cancelar suscripción</button></div>' : '') +
      '<h3 style="font-size:1.1rem;margin-top:22px">Historial</h3><ul class="hist">' + ev.map((x) => '<li class="' + (x.g ? 'g' : '') + '"><b>' + esc(x.t) + '</b><small>' + fmt.fecha(x.f) + (x.d ? ' · ' + esc(x.d) : '') + '</small></li>').join('') + '</ul>');
    const q = (sel, fn) => { const b = d.el.querySelector(sel); if (b) b.onclick = fn; };
    q('#ps', () => { const p = (s.pausas || []).concat([[EA.hoy(), null]]); EA.patchSub(id, { pausas: p }); d.close(); EA.toast('Suscripción pausada'); redraw(); });
    q('#rs', () => { const p = (s.pausas || []).map((x) => (x[1] == null ? [x[0], EA.hoy()] : x)); EA.patchSub(id, { pausas: p }); d.close(); EA.toast('Suscripción reanudada'); redraw(); });
    q('#cn', () => A.confirmar('¿Cancelar la suscripción?', 'Se cancela a ' + esc(s.nombre) + ' desde hoy y no se le vuelve a cobrar.', 'Sí, cancelar', () => { EA.patchSub(id, { fin: EA.hoy() }); d.close(); EA.toast('Suscripción cancelada'); redraw(); }));
  }
})();
