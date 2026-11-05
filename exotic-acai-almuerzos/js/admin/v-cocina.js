/* Cocina (Nicolás) · porciones a preparar y entregas por horario/zona */
(function () {
  'use strict';
  const { $, $$, esc, fmt, icon } = EA, C = CFG, A = ADM;
  const nextLab = () => { let d = EA.addDias(EA.hoy(), 1); while (!EA.esLaborable(d)) d = EA.addDias(d, 1); return d; };
  const key = (s, d) => EA.state.entregas[d] && EA.state.entregas[d][s.id];

  function vistaDia(el, nivel) {
    const hoy = EA.hoy(), man = nextLab(); let fecha = hoy;
    // demo: la primera ventana de hoy ya salió
    if (!EA.L.get('entr_seed', false)) { EA.state.subs.filter((s) => EA.recibe(s, hoy) && s.zona !== 'retiro' && s.ventana === C.ventanas[0]).forEach((s) => EA.marcarEntrega(hoy, s.id, true)); EA.L.set('entr_seed', true); }
    const edit = nivel === 'edit';
    const draw = () => {
      const subs = EA.state.subs.filter((s) => EA.recibe(s, fecha));
      const filas = subs.map((s) => ({ s, r: EA.platoPara(s, fecha) }));
      const dom = subs.filter((s) => s.zona !== 'retiro').length, ret = subs.length - dom;
      const hechas = subs.filter((s) => key(s, fecha)).length;
      const conRestr = subs.filter((s) => (s.restricciones || []).length || (s.alergias || []).length).length;
      /* agrupar por plato y plan; las restricciones se cuentan dentro de cada fila */
      const g = {};
      filas.forEach(({ s, r }) => { if (!r) return; const k = r.plato.id + '|' + s.plan; const o = (g[k] = g[k] || { p: r.plato, plan: s.plan, n: 0, rs: {}, por: {}, aj: 0 }); o.n++; if (r.ajuste) o.aj++; [].concat(s.restricciones || [], (s.alergias || []).map((a) => 'sin ' + a)).forEach((x) => (o.rs[x] = (o.rs[x] || 0) + 1)); if (s.plan === 'fit') o.por[s.porcion] = (o.por[s.porcion] || 0) + 1; });
      const grupos = Object.values(g).sort((a, b) => a.p.id.localeCompare(b.p.id) || b.n - a.n);
      /* alergias */
      const alg = {}; subs.forEach((s) => (s.alergias || []).forEach((a) => (alg[a] = alg[a] || []).push(s.nombre.split(' ')[0])));
      el.innerHTML = '<div class="pg-h"><div><h2 style="font-size:1.7rem">Cocina</h2><p>' + EA.DIAS[EA.dow(fecha)] + ' ' + fmt.fecha(fecha) + '</p></div>' + A.soloLectura(nivel) + '</div>' +
        '<div class="tabs" role="tablist"><button class="tab" role="tab" aria-selected="' + (fecha === hoy) + '" data-f="' + hoy + '">Hoy · ' + EA.entregasDia(hoy) + '</button><button class="tab" role="tab" aria-selected="' + (fecha === man) + '" data-f="' + man + '">Mañana (' + EA.DIAS[EA.dow(man)].toLowerCase() + ') · ' + EA.entregasDia(man) + '</button></div>' +
        '<div class="kpis">' + A.kpi('Porciones a preparar', fmt.num(subs.length)) + A.kpi('Entregas a domicilio', fmt.num(dom)) + A.kpi('Retiro en local', fmt.num(ret)) + A.kpi('Con dieta o alergia', fmt.num(conRestr)) + (fecha === hoy ? A.kpi('Entregadas', hechas + ' / ' + subs.length, '<div class="prog-b"><i style="width:' + (subs.length ? hechas / subs.length * 100 : 0) + '%"></i></div>') : '') + '</div>' +
        (Object.keys(alg).length ? '<div class="cd"><div class="cd-h"><div><h3>' + icon('alert') + ' Alergias a cuidar</h3><p>Revisa estas porciones antes de emplatar.</p></div></div><div class="alertas">' + Object.keys(alg).map((a) => '<div class="alerta">' + icon('alert') + '<div><b>Sin ' + esc(a) + ' · ' + alg[a].length + ' porción' + (alg[a].length > 1 ? 'es' : '') + '</b><span>' + esc(alg[a].join(', ')) + '</span></div></div>').join('') + '</div></div>' : '') +
        '<div class="cd"><div class="cd-h"><div><h3>Qué preparar</h3><p>Por plato, plan y restricción</p></div></div><div class="tw"><table class="tbl"><thead><tr><th>Plato</th><th>Plan</th><th>Restricción</th><th class="r">Porciones</th></tr></thead><tbody>' +
        grupos.map((x) => '<tr><td><b>' + esc(x.p.nombre) + '</b></td><td>' + esc(C.plans[x.plan].nombre.replace('Plan ', '')) + (Object.keys(x.por).length ? '<br><small class="hint">' + Object.entries(x.por).map(([k, v]) => k + ' ×' + v).join(' · ') + '</small>' : '') + '</td><td>' + (Object.keys(x.rs).length ? Object.entries(x.rs).map(([k, v]) => '<span class="alg">' + esc(k) + ' ×' + v + '</span>').join('') : '<span class="hint">—</span>') + (x.aj ? ' <span class="tag c">' + x.aj + ' por ajustar con Leo</span>' : '') + '</td><td class="r"><b>' + x.n + '</b></td></tr>').join('') +
        '</tbody><tfoot><tr><td colspan="3">Total</td><td class="r">' + subs.length + '</td></tr></tfoot></table></div></div>' +
        '<div class="cd"><div class="cd-h"><div><h3>Entregas por horario y zona</h3><p>' + (fecha === hoy ? (edit ? 'Marca cada una cuando salga.' : 'Solo lectura.') : 'Vista previa de mañana.') + '</p></div></div><div id="ents"></div></div>';
      const ents = [];
      C.ventanas.forEach((v) => {
        const lst = subs.filter((s) => s.zona !== 'retiro' && s.ventana === v); if (!lst.length) return;
        const porZona = {}; lst.forEach((s) => (porZona[s.zona] = porZona[s.zona] || []).push(s));
        ents.push('<div class="ven"><h4>' + icon('clock') + v + ' · ' + lst.length + ' entregas</h4>' + C.zonas.filter((z) => porZona[z.id]).map((z) => '<p class="hint" style="margin:10px 0 0;font-weight:700">' + esc(z.nombre) + '</p>' + porZona[z.id].map((s) => fila(s)).join('')).join('') + '</div>');
      });
      const rl = subs.filter((s) => s.zona === 'retiro'); if (rl.length) ents.push('<div class="ven"><h4>' + icon('store') + 'Retiro en local · ' + rl.length + '</h4>' + rl.map((s) => fila(s)).join('') + '</div>');
      $('#ents').innerHTML = ents.join('') || '<p class="vacio">Sin entregas.</p>';
      function fila(s) {
        const r = EA.platoPara(s, fecha), done = !!key(s, fecha);
        return '<div class="ent' + (done ? ' hecho' : '') + '"><div><b>' + esc(s.nombre) + '</b><small>' + (s.zona === 'retiro' ? 'Retira en local' : esc(s.direccion)) + '</small><small>' + (r ? esc(r.plato.nombre) : '') + ' · ' + esc(C.plans[s.plan].nombre.replace('Plan ', '')) + (s.porcion !== 'normal' ? ' · ' + s.porcion : '') + '</small>' +
          '<small>' + (s.alergias || []).map((a) => '<span class="alg">sin ' + esc(a) + '</span>').join('') + (s.restricciones || []).map((a) => '<span class="tag p">' + esc(a) + '</span> ').join('') + '</small></div>' +
          (fecha === hoy ? (done ? '<button class="mini ok" ' + (edit ? 'data-e="' + s.id + '"' : 'disabled') + '>' + icon('check') + ' Entregado</button>' : '<button class="mini" ' + (edit ? 'data-e="' + s.id + '"' : 'disabled') + '>Marcar entregado</button>') : '') + '</div>';
      }
    };
    draw();
    el.onclick = (e) => {
      const t = e.target.closest('[data-f]'); if (t) { fecha = t.dataset.f; draw(); return; }
      const b = e.target.closest('[data-e]'); if (b && edit) { EA.marcarEntrega(fecha, b.dataset.e, !key({ id: b.dataset.e }, fecha)); draw(); }
    };
  }

  /* ───── Mermas ───── */
  const MOTIVOS = ['vencimiento', 'sobrante de producción', 'error de preparación', 'devolución de cliente', 'daño en transporte'];
  const UNID = { ingrediente: 'kg', plato: 'porción', empaque: 'u' };
  function vistaMermas(el, nivel) {
    const edit = nivel === 'edit', hoy = EA.hoy(), a = EA.addDias(hoy, -29), ant = [EA.addDias(hoy, -59), EA.addDias(hoy, -30)];
    const L = EA.mermasRango(a, hoy), costo = L.reduce((n, m) => n + m.costo, 0), prev = EA.mermasRango(ant[0], ant[1]).reduce((n, m) => n + m.costo, 0);
    const ing = EA.state.gastos.filter((g) => g.cat === 'ingredientes' && g.f >= a && g.f <= hoy).reduce((n, g) => n + g.monto, 0);
    const porMot = {}, porItem = {}; L.forEach((m) => { porMot[m.motivo] = (porMot[m.motivo] || 0) + m.costo; const o = (porItem[m.item] = porItem[m.item] || { c: 0, n: 0, u: m.unidad, q: 0 }); o.c += m.costo; o.n++; o.q += m.cant; });
    const top = Object.entries(porItem).sort((x, y) => y[1].c - x[1].c);
    el.innerHTML = '<div class="kpis">' + A.kpi('Mermas · 30 días', fmt.money(costo, 0), A.delta(costo, prev, true), 'vs 30 días previos') + A.kpi('% de lo comprado', fmt.pct(ing ? costo / ing * 100 : 0), '', 'sobre compras de ingredientes') + A.kpi('Registros', fmt.num(L.length)) + A.kpi('Mayor motivo', top.length ? esc(Object.entries(porMot).sort((x, y) => y[1] - x[1])[0][0]) : '—') + '</div>' +
      (top.length ? '<div class="alerta">' + icon('info') + '<div><b>Lo que más se pierde: ' + esc(top[0][0]) + '</b><span>' + top[0][1].n + ' registros por ' + fmt.money(top[0][1].c, 0) + ' en 30 días. Ajusta la compra o la porción de ese producto.</span></div></div>' : '') +
      '<div class="grid g2"><div class="cd"><div class="cd-h"><div><h3>Por motivo</h3><p>Costo estimado, últimos 30 días</p></div></div>' + A.cv('c-mot') + '</div><div class="cd"><div class="cd-h"><div><h3>Por semana</h3><p>Últimas 8 semanas</p></div></div>' + A.cv('c-sem') + '</div></div>' +
      '<div class="cd"><div class="cd-h"><div><h3>Registro de mermas</h3><p>Lo más reciente primero</p></div>' + (edit ? '<button class="btn btn-acai btn-sm" id="nm">' + icon('plus') + ' Registrar merma</button>' : '') + '</div><div class="tw"><table class="tbl"><thead><tr><th>Fecha</th><th>Producto</th><th class="r">Cantidad</th><th>Motivo</th><th class="r">Costo</th><th></th></tr></thead><tbody>' +
      (EA.state.mermas.slice().sort((x, y) => y.f.localeCompare(x.f)).slice(0, 40).map((m) => '<tr><td>' + fmt.fechaCorta(m.f) + '</td><td><b>' + esc(m.item) + '</b><br><small class="hint">' + esc(m.tipo) + (m.nota ? ' · ' + esc(m.nota) : '') + '</small></td><td class="r">' + fmt.num(m.cant, m.unidad === 'kg' ? 1 : 0) + ' ' + esc(m.unidad) + '</td><td>' + esc(m.motivo) + '</td><td class="r">' + fmt.money(m.costo) + '</td><td class="r">' + (edit ? '<button class="mini pel" data-md="' + m.id + '" aria-label="Eliminar">' + icon('trash') + '</button>' : '') + '</td></tr>').join('') || '<tr><td colspan="6" class="vacio">Sin mermas registradas.</td></tr>') + '</tbody></table></div></div>';
    A.chart('c-mot', { type: 'doughnut', data: { labels: MOTIVOS, datasets: [{ data: MOTIVOS.map((k) => Math.round(porMot[k] || 0)), backgroundColor: [A.COL.ac, A.COL.ho, A.COL.ac3, A.COL.ho2, A.COL.ac2], borderWidth: 2, borderColor: '#fff' }] }, options: { cutout: '58%' } });
    const lun = EA.addDias(hoy, -((EA.dow(hoy) + 6) % 7)), sem = [];
    for (let i = 7; i >= 0; i--) { const x = EA.addDias(lun, -7 * i); sem.push([fmt.fechaCorta(x), EA.mermasRango(x, EA.addDias(x, 6)).reduce((n, m) => n + m.costo, 0)]); }
    A.chart('c-sem', { type: 'bar', data: { labels: sem.map((x) => x[0]), datasets: [{ label: 'Mermas (US$)', data: sem.map((x) => Math.round(x[1])), backgroundColor: A.COL.ac, borderRadius: 6 }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } } });
    el.onclick = (e) => {
      const d = e.target.closest('[data-md]'); if (d && edit) { EA.borrarMerma(d.dataset.md); EA.toast('Merma eliminada'); vistaMermas(el, nivel); return; }
      if (!e.target.closest('#nm') || !edit) return;
      const mo = EA.modal({ title: 'Registrar merma', body: '<form id="mf" class="fgrid"><div class="fgrid c2"><label class="f"><span>Fecha</span><input class="inp" type="date" name="f" required value="' + hoy + '" max="' + hoy + '"></label><label class="f"><span>Tipo</span><select class="inp" name="tipo"><option value="ingrediente">Ingrediente</option><option value="plato">Plato preparado</option><option value="empaque">Empaque</option></select></label></div>' +
        '<label class="f"><span>Producto</span><input class="inp" name="item" required placeholder="Ej.: Aguacate, Pollo, Bowl vegano"></label><div class="fgrid c2"><label class="f"><span>Cantidad</span><input class="inp" name="cant" type="number" step="0.1" min="0.1" required></label><label class="f"><span>Unidad</span><select class="inp" name="unidad"><option>kg</option><option>porción</option><option>u</option></select></label></div>' +
        '<div class="fgrid c2"><label class="f"><span>Motivo</span><select class="inp" name="motivo">' + MOTIVOS.map((x) => '<option>' + x + '</option>').join('') + '</select></label><label class="f"><span>Costo estimado (US$)</span><input class="inp" name="costo" type="number" step="0.01" min="0.01" required></label></div><label class="f"><span>Nota (opcional)</span><input class="inp" name="nota"></label>' +
        '<div class="btn-fila" style="justify-content:flex-end"><button type="button" class="btn btn-ghost btn-sm" data-close>Cancelar</button><button class="btn btn-acai btn-sm">Guardar</button></div></form>' });
      const f = mo.el.querySelector('#mf'); f.tipo.onchange = () => { f.unidad.value = UNID[f.tipo.value]; };
      f.onsubmit = (ev) => { ev.preventDefault(); EA.guardarMerma({ f: f.f.value, tipo: f.tipo.value, item: f.item.value.trim(), cant: +f.cant.value, unidad: f.unidad.value, motivo: f.motivo.value, costo: +(+f.costo.value).toFixed(2), nota: f.nota.value.trim() }); mo.close(); EA.toast('Merma registrada'); vistaMermas(el, nivel); };
    };
  }

  /* ───── Lo que más piden: platos para empujar ───── */
  function vistaTop(el) {
    const hoy = EA.hoy(), a = EA.addDias(hoy, -27), cnt = {}, porPlan = {};
    EA.rango(a, hoy).forEach((d) => { if (!EA.esLaborable(d)) return; EA.state.subs.forEach((s) => { if (!EA.recibe(s, d)) return; const r = EA.platoPara(s, d); if (!r) return; cnt[r.plato.id] = (cnt[r.plato.id] || 0) + 1; (porPlan[r.plato.id] = porPlan[r.plato.id] || {})[s.plan] = 1; }); });
    const mer = {}; EA.mermasRango(a, hoy).filter((m) => m.tipo === 'plato').forEach((m) => { mer[m.item] = (mer[m.item] || 0) + m.cant; });
    const P = EA.state.platos.map((p) => ({ p, n: cnt[p.id] || 0 })), tot = P.reduce((n, x) => n + x.n, 0) || 1;
    const maxN = Math.max.apply(null, P.map((x) => x.n)) || 1;
    P.forEach((x) => { x.score = (x.p.votos ? x.p.rating / 5 : 0.5) * 0.6 + (x.n / maxN) * 0.4; });
    const orden = P.slice().sort((x, y) => y.score - x.score), mejores = orden.filter((x) => x.p.votos >= 10).slice(0, 3), revisar = orden.filter((x) => x.p.votos >= 10 && x.p.rating < 4).slice(-3).reverse();
    const card = (x, i) => '<div class="alerta a-ok">' + icon('star') + '<div><b>' + (i + 1) + '. ' + esc(x.p.nombre) + '</b><span>' + x.p.rating.toFixed(1) + ' ★ con ' + x.p.votos + ' votos · ' + x.n + ' porciones en 4 semanas · ' + x.p.p + ' g de proteína</span></div></div>';
    el.innerHTML = '<div class="cd"><div class="cd-h"><div><h3>Para ofrecer más</h3><p>Mezcla valoración de clientes (60 %) y pedidos de las últimas 4 semanas (40 %).</p></div></div><div class="alertas">' + (mejores.map(card).join('') || '<p class="vacio">Aún no hay votos suficientes.</p>') + '</div></div>' +
      (revisar.length ? '<div class="cd"><div class="cd-h"><div><h3>Para revisar con Leo</h3><p>Valoración bajo 4,0.</p></div></div><div class="alertas">' + revisar.map((x) => '<div class="alerta">' + icon('alert') + '<div><b>' + esc(x.p.nombre) + '</b><span>' + x.p.rating.toFixed(1) + ' ★ con ' + x.p.votos + ' votos' + ((x.p.comentarios || []).length ? ' · “' + esc(x.p.comentarios[0]) + '”' : '') + '</span></div></div>').join('') + '</div></div>' : '') +
      '<div class="cd"><div class="cd-h"><div><h3>Ranking de platos</h3><p>Últimas 4 semanas</p></div></div><div class="tw"><table class="tbl"><thead><tr><th>Plato</th><th>Valoración</th><th class="r">Porciones</th><th class="r">% del total</th><th class="r">Proteína</th></tr></thead><tbody>' +
      P.slice().sort((x, y) => y.n - x.n).map((x) => '<tr><td><b>' + esc(x.p.nombre) + '</b></td><td>' + (x.p.votos ? A.estrellas(x.p.rating) : '<span class="hint">Sin votos</span>') + '</td><td class="r"><b>' + x.n + '</b></td><td class="r">' + fmt.pct(x.n / tot * 100, 0) + '</td><td class="r">' + x.p.p + ' g</td></tr>').join('') + '</tbody></table></div></div>';
  }

  A.views.cocina = (el, nivel) => {
    let tab = 'dia';
    el.innerHTML = A.tabsUI([['dia', 'Hoy y mañana'], ['mermas', 'Mermas'], ['top', 'Lo que más piden']], tab) + '<div id="cc" style="display:grid;gap:18px;margin-top:18px"></div>';
    const draw = () => { A.destroyCharts(); $$('.tab', el).forEach((t) => t.setAttribute('aria-selected', t.dataset.tab === tab)); const h = $('#cc'); h.onclick = null; ({ dia: vistaDia, mermas: vistaMermas, top: vistaTop })[tab](h, nivel); };
    el.querySelector('.tabs').onclick = (e) => { const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; draw(); } };
    draw();
  };
})();
