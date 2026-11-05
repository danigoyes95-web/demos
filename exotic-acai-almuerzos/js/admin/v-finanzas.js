/* Finanzas (Salo) · resumen, ingresos, gastos, rentabilidad, flujo y proyección, equilibrio, exportación */
(function () {
  'use strict';
  const { $, $$, esc, fmt, icon } = EA, C = CFG, A = ADM, M = fmt.money;
  const sum = (arr, f) => arr.reduce((n, x) => n + f(x), 0);
  const CAT = () => EA.state.categorias, catN = (id) => (CAT().find((c) => c.id === id) || { nombre: id }).nombre, catT = (id) => (CAT().find((c) => c.id === id) || {}).tipo;

  function meses() {
    const hoy = EA.hoy(), d = EA.D(hoy), out = [];
    for (let i = 5; i >= 0; i--) { const f = new Date(d.getFullYear(), d.getMonth() - i, 1, 12), ult = new Date(d.getFullYear(), d.getMonth() - i + 1, 0, 12); const a = EA.iso(f); let b = EA.iso(ult); const parcial = b > hoy; if (parcial) b = hoy; out.push({ k: a.slice(0, 7), a, b, parcial, label: fmt.mesLargo(a) }); }
    return out;
  }
  function stats(m) {
    const pg = EA.state.pagos.filter((p) => p.estado === 'cobrado' && p.f >= m.a && p.f <= m.b), gs = EA.state.gastos.filter((g) => g.f >= m.a && g.f <= m.b);
    const neto = sum(pg, (p) => p.neto), cost = sum(gs, (g) => g.monto), porCat = {}; gs.forEach((g) => (porCat[g.cat] = (porCat[g.cat] || 0) + g.monto));
    return { pg, gs, bruto: sum(pg, (p) => p.monto), iva: sum(pg, (p) => p.iva), neto, cost, util: neto - cost, margen: neto ? (neto - cost) / neto * 100 : 0, porCat, fijo: sum(gs.filter((g) => catT(g.cat) === 'fijo'), (g) => g.monto), variable: sum(gs.filter((g) => catT(g.cat) === 'variable'), (g) => g.monto) };
  }

  A.views.finanzas = (el, nivel) => {
    const edit = nivel === 'edit', MS = meses(); let tab = 'resumen', mk = MS[MS.length - 1].k, filtroCat = '', proj = { modo: 'actual', churn: null };
    const mes = () => MS.find((m) => m.k === mk);
    const TABS = [['resumen', 'Resumen'], ['ingresos', 'Ingresos'], ['gastos', 'Gastos'], ['rentab', 'Rentabilidad'], ['flujo', 'Flujo y proyección'], ['equilibrio', 'Equilibrio'], ['exportar', 'Exportar'], ['sri', 'Facturación SRI']];
    const draw = () => {
      A.destroyCharts();
      el.innerHTML = '<div class="pg-h"><div><h2 style="font-size:1.7rem">Finanzas</h2><p>Precios con IVA ' + Math.round(C.negocio.iva * 100) + '% incluido · cifras de ejemplo</p></div>' + A.soloLectura(nivel) + '</div>' + A.tabsUI(TABS, tab) +
        (['resumen', 'ingresos', 'gastos'].includes(tab) ? '<div class="per"><label class="sr" for="fm">Mes</label><select class="inp" id="fm" style="max-width:240px">' + MS.slice().reverse().map((m) => '<option value="' + m.k + '"' + (m.k === mk ? ' selected' : '') + '>' + ADM.cap(m.label) + (m.parcial ? ' (en curso)' : '') + '</option>').join('') + '</select></div>' : '') + '<div id="tc" style="display:grid;gap:18px"></div>';
      V[tab]($('#tc'));
    };
    el.onclick = (e) => {
      const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; draw(); return; }
      const c = e.target.closest('[data-cat]'); if (c) { filtroCat = c.dataset.cat; draw(); return; }
      const g = e.target.closest('[data-g]'); if (g && edit) { gastoForm(g.dataset.g === 'new' ? null : EA.state.gastos.find((x) => x.id === g.dataset.g), draw, mes()); return; }
      const d = e.target.closest('[data-gd]'); if (d && edit) { A.confirmar('¿Eliminar este gasto?', 'No se puede deshacer.', 'Eliminar', () => { EA.borrarGasto(d.dataset.gd); EA.toast('Gasto eliminado'); draw(); }); return; }
      const p = e.target.closest('[data-pg]'); if (p && edit) { const [id, acc] = p.dataset.pg.split(':'); if (acc === 'cobrar') { EA.patchPago(id, { estado: 'cobrado', nota: 'Cobrado manualmente' }); EA.toast('Marcado como cobrado'); } else { EA.patchPago(id, { estado: 'pendiente', nota: 'Reintento enviado' }); EA.toast('Reintento enviado (simulado)'); } draw(); return; }
      const ex = e.target.closest('[data-ex]'); if (ex) exportar(ex.dataset.ex);
      const pj = e.target.closest('[data-pj]'); if (pj) { proj.modo = pj.dataset.pj; draw(); }
    };
    el.onchange = (e) => { if (e.target.id === 'fm') { mk = e.target.value; draw(); } if (e.target.id === 'pjc') { proj.churn = parseFloat(e.target.value.replace(',', '.')); draw(); } };

    const V = {};
    /* ───── Resumen del mes ───── */
    V.resumen = (h) => {
      const m = mes(), s = stats(m), i = MS.findIndex((x) => x.k === mk), prev = i > 0 && !m.parcial ? stats(MS[i - 1]) : null, dl = (c, p, inv) => (prev ? A.delta(c, p, inv) : '<span class="kd neu">' + (m.parcial ? 'mes en curso' : 'sin mes previo') + '</span>');
      h.innerHTML = '<div class="kpis">' + A.kpi('Ingresos brutos', M(s.bruto, 0), dl(s.bruto, prev && prev.bruto), 'cobrado con IVA') + A.kpi('IVA', M(s.iva, 0), dl(s.iva, prev && prev.iva), 'por declarar') + A.kpi('Ingresos netos', M(s.neto, 0), dl(s.neto, prev && prev.neto)) + A.kpi('Costos y gastos', M(s.cost, 0), dl(s.cost, prev && prev.cost, true)) +
        A.kpi('Utilidad', M(s.util, 0), dl(s.util, prev && prev.util), s.util < 0 ? 'pérdida del periodo' : '') + A.kpi('Margen', fmt.pct(s.margen), dl(s.margen, prev && prev.margen)) + '</div>' +
        (m.parcial ? '<div class="alerta"><div>' + icon('info') + '</div><div><b>Mes en curso</b><span>Solo hay cobros hasta el ' + fmt.fecha(m.b) + ' (cada suscriptor paga en su fecha de renovación). Compara con meses completos.</span></div></div>' : '') +
        '<div class="grid g2"><div class="cd"><div class="cd-h"><div><h3>Costos y gastos por categoría</h3></div></div>' + A.cv('f-cat') + '</div><div class="cd"><div class="cd-h"><div><h3>Detalle</h3></div></div><div class="tw"><table class="tbl" style="min-width:340px"><thead><tr><th>Categoría</th><th>Tipo</th><th class="r">Monto</th><th class="r">%</th></tr></thead><tbody>' + CAT().map((c) => '<tr><td>' + esc(c.nombre) + '</td><td><span class="tag ' + (c.tipo === 'fijo' ? 'p' : '') + '">' + c.tipo + '</span></td><td class="r">' + M(s.porCat[c.id] || 0, 0) + '</td><td class="r">' + fmt.pct(s.cost ? (s.porCat[c.id] || 0) / s.cost * 100 : 0, 0) + '</td></tr>').join('') + '</tbody><tfoot><tr><td colspan="2">Total</td><td class="r">' + M(s.cost, 0) + '</td><td class="r">100%</td></tr></tfoot></table></div></div></div>';
      A.chart('f-cat', { type: 'doughnut', data: { labels: CAT().map((c) => c.nombre), datasets: [{ data: CAT().map((c) => Math.round(s.porCat[c.id] || 0)), backgroundColor: [A.COL.ac, A.COL.ho, A.COL.ac3, A.COL.ho2, A.COL.ac6, A.COL.ac2, A.COL.ac9], borderWidth: 2, borderColor: '#fff' }] }, options: { cutout: '58%' } });
    };

    /* ───── Ingresos ───── */
    V.ingresos = (h) => {
      const m = mes(), s = stats(m), porPlan = Object.values(C.plans).map((p) => { const x = s.pg.filter((q) => q.plan === p.id); return { p, n: x.length, b: sum(x, (q) => q.monto), i: sum(x, (q) => q.iva), nt: sum(x, (q) => q.neto) }; });
      const pend = EA.state.pagos.filter((p) => p.estado === 'fallido' || p.estado === 'pendiente').sort((a, b) => b.f.localeCompare(a.f)), nm = (id) => { const x = EA.state.subs.find((q) => q.id === id); return x ? x.nombre : id; };
      h.innerHTML = '<div class="cd"><div class="cd-h"><div><h3>Cobros por día</h3><p>' + ADM.cap(m.label) + ' · con IVA</p></div></div>' + A.cv('f-dia') + '</div>' +
        '<div class="grid g2"><div class="cd"><div class="cd-h"><div><h3>Cobros por plan</h3></div></div><div class="tw"><table class="tbl" style="min-width:380px"><thead><tr><th>Plan</th><th class="r">Cobros</th><th class="r">Bruto</th><th class="r">IVA</th><th class="r">Neto</th></tr></thead><tbody>' + porPlan.map((x) => '<tr><td>' + esc(x.p.nombre) + '</td><td class="r">' + x.n + '</td><td class="r">' + M(x.b, 0) + '</td><td class="r">' + M(x.i, 0) + '</td><td class="r">' + M(x.nt, 0) + '</td></tr>').join('') + '</tbody><tfoot><tr><td>Total</td><td class="r">' + s.pg.length + '</td><td class="r">' + M(s.bruto, 0) + '</td><td class="r">' + M(s.iva, 0) + '</td><td class="r">' + M(s.neto, 0) + '</td></tr></tfoot></table></div></div>' +
        '<div class="cd"><div class="cd-h"><div><h3>Pendientes y fallidos</h3><p>' + pend.length + ' por resolver · ' + M(sum(pend, (p) => p.monto), 0) + '</p></div></div>' + (pend.length ? '<div class="tw"><table class="tbl" style="min-width:380px"><thead><tr><th>Suscriptor</th><th>Fecha</th><th class="r">Monto</th><th>Estado</th><th></th></tr></thead><tbody>' + pend.map((p) => '<tr><td>' + esc(nm(p.sub)) + '</td><td>' + fmt.fechaCorta(p.f) + '</td><td class="r">' + M(p.monto, 0) + '</td><td><span class="st ' + p.estado + '">' + A.cap(p.estado) + '</span></td><td class="r">' + (edit ? (p.estado === 'fallido' ? '<button class="mini" data-pg="' + p.id + ':reintentar">Reintentar</button> ' : '') + '<button class="mini ok" data-pg="' + p.id + ':cobrar">Cobrado</button>' : '') + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="vacio">No hay cobros pendientes ni fallidos.</p>') + '</div></div>';
      const dias = EA.rango(m.a, m.b);
      A.chart('f-dia', { type: 'bar', data: { labels: dias.map((d) => EA.D(d).getDate()), datasets: [{ label: 'Cobrado (US$)', data: dias.map((d) => Math.round(sum(s.pg.filter((p) => p.f === d), (p) => p.monto))), backgroundColor: A.COL.ac, borderRadius: 4 }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false }, title: { display: true, text: 'Día del mes' } } } } });
    };

    /* ───── Gastos ───── */
    V.gastos = (h) => {
      const m = mes(), s = stats(m), L = s.gs.filter((g) => !filtroCat || g.cat === filtroCat).sort((a, b) => b.f.localeCompare(a.f));
      h.innerHTML = '<div class="cd"><div class="cd-h"><div><h3>Costos y gastos de ' + m.label + '</h3><p>' + L.length + ' registros · ' + M(sum(L, (g) => g.monto)) + '</p></div>' + (edit ? '<button class="btn btn-acai btn-sm" data-g="new">' + icon('plus') + ' Agregar gasto</button>' : '') + '</div>' +
        '<div class="chips" style="margin-bottom:12px"><button class="chip" aria-pressed="' + !filtroCat + '" data-cat="">Todas</button>' + CAT().map((c) => '<button class="chip" aria-pressed="' + (filtroCat === c.id) + '" data-cat="' + c.id + '">' + esc(c.nombre) + '</button>').join('') + '</div>' +
        '<div class="tw"><table class="tbl"><thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Proveedor</th><th class="r">Monto</th><th></th></tr></thead><tbody>' + (L.map((g) => '<tr><td>' + fmt.fechaCorta(g.f) + '</td><td>' + esc(catN(g.cat)) + '</td><td>' + esc(g.desc) + '</td><td>' + esc(g.prov || '—') + '</td><td class="r">' + M(g.monto) + '</td><td class="r">' + (edit ? '<button class="mini" data-g="' + g.id + '" aria-label="Editar">' + icon('edit') + '</button> <button class="mini pel" data-gd="' + g.id + '" aria-label="Eliminar">' + icon('trash') + '</button>' : '') + '</td></tr>').join('') || '<tr><td colspan="6" class="vacio">Sin gastos en esta categoría.</td></tr>') + '</tbody></table></div></div>';
    };

    /* ───── Rentabilidad por plan ───── */
    V.rentab = (h) => {
      const hoy = EA.hoy(), act = EA.state.subs.filter((s) => EA.vigente(s, hoy)); let rows = [];
      Object.values(C.plans).forEach((p) => [20, 12].forEach((f) => { const n = C.frecuencias[f].almuerzos, pv = p['precio' + f], net = EA.neto(pv), cm = p.costo * n, mu = net / n - p.costo, subs = act.filter((s) => s.plan === p.id && s.frec === f).length; rows.push({ p, f, n, pv, net, cm, mu, mp: net ? (net - cm) / net * 100 : 0, subs, tot: (net - cm) * subs }); }));
      const tot = sum(rows, (r) => r.tot);
      h.innerHTML = '<div class="cd"><div class="cd-h"><div><h3>Precio vs costo por almuerzo</h3><p>Costo = ingredientes + empaque (editable en config/plans.js). Delivery y gastos fijos se ven en Equilibrio.</p></div></div><div class="tw"><table class="tbl" style="min-width:820px"><thead><tr><th>Plan</th><th class="r">Almuerzos</th><th class="r">Precio (IVA incl.)</th><th class="r">Precio neto</th><th class="r">Costo/almuerzo</th><th class="r">Margen unit.</th><th class="r">Margen %</th><th class="r">Suscriptores</th><th class="r">Margen total/mes</th></tr></thead><tbody>' +
        rows.map((r) => '<tr><td><b>' + esc(r.p.nombre) + '</b><br><small class="hint">' + C.frecuencias[r.f].label + '</small></td><td class="r">' + r.n + '</td><td class="r">' + M(r.pv, 0) + '</td><td class="r">' + M(r.net) + '</td><td class="r">' + M(r.p.costo) + '</td><td class="r"><b>' + M(r.mu) + '</b></td><td class="r">' + fmt.pct(r.mp, 0) + '</td><td class="r">' + r.subs + '</td><td class="r"><b>' + M(r.tot, 0) + '</b></td></tr>').join('') + '</tbody><tfoot><tr><td colspan="7">Margen bruto mensual con los suscriptores actuales</td><td class="r">' + act.length + '</td><td class="r">' + M(tot, 0) + '</td></tr></tfoot></table></div></div>';
    };

    /* ───── Flujo de caja y proyección ───── */
    function params() {
      const comp = MS.filter((m) => !m.parcial), base = comp[comp.length - 1], bs = stats(base), n0 = EA.snapshot(EA.addDias(base.a, -1)).n, n1 = EA.snapshot(base.b).n, avg = (n0 + n1) / 2 || 1;
      const ch = comp.slice(-3).map((m) => { const ini = EA.snapshot(EA.addDias(m.a, -1)).n || 1; return EA.state.subs.filter((s) => s.fin && s.fin >= m.a && s.fin <= m.b).length / ini; }), churnH = ch.reduce((a, b) => a + b, 0) / ch.length * 100;
      const altas = comp.slice(-3).map((m) => EA.state.subs.filter((s) => s.inicio >= m.a && s.inicio <= m.b).length), altasH = altas.reduce((a, b) => a + b, 0) / altas.length;
      const sn = EA.snapshot(EA.hoy());
      return { base, fijo: bs.fijo, varSub: bs.variable / avg, arpu: sn.n ? sn.mrr / sn.n : 0, n0: sn.n, churnH, altasH };
    }
    V.flujo = (h) => {
      const P = params(), churn = proj.churn != null && !isNaN(proj.churn) ? proj.churn : P.churnH, altas = proj.modo === 'ritmo' ? P.altasH : 0, rows = [];
      let n = P.n0; const hoyM = EA.addMeses(EA.hoy().slice(0, 7) + '-01', 0);
      for (let i = 1; i <= 3; i++) { n = n * (1 - churn / 100) + altas; const ing = n * P.arpu, cs = P.fijo + P.varSub * n; rows.push({ lbl: fmt.mesLargo(EA.addMeses(hoyM, i)), n, ing, cs, ut: ing - cs }); }
      h.innerHTML = '<div class="cd"><div class="cd-h"><div><h3>Flujo de caja mensual</h3><p>Entradas netas (sin IVA) vs salidas · el mes en curso es parcial</p></div></div>' + A.cv('f-fl', 'alto') + '</div>' +
        '<div class="cd"><div class="cd-h"><div><h3>Proyección a 3 meses</h3><p>Parte de ' + P.n0 + ' suscriptores activos hoy. Costos fijos de ' + P.base.label + ' (' + M(P.fijo, 0) + ') y costo variable de ' + M(P.varSub, 0) + ' por suscriptor.</p></div></div>' +
        '<div class="fgrid c2" style="align-items:end"><div class="chips"><button class="chip" data-pj="actual" aria-pressed="' + (proj.modo === 'actual') + '">Solo suscriptores actuales</button><button class="chip" data-pj="ritmo" aria-pressed="' + (proj.modo === 'ritmo') + '">Con ' + fmt.num(P.altasH, 0) + ' altas/mes (ritmo reciente)</button></div><label class="f"><span>Churn mensual (%) · reciente ' + fmt.num(P.churnH, 1) + '</span><input class="inp" id="pjc" inputmode="decimal" value="' + fmt.num(churn, 1) + '"></label></div>' +
        A.cv('f-pr') + '<div class="tw" style="margin-top:12px"><table class="tbl" style="min-width:420px"><thead><tr><th>Mes</th><th class="r">Suscriptores</th><th class="r">Entradas netas</th><th class="r">Salidas</th><th class="r">Utilidad</th></tr></thead><tbody>' + rows.map((r) => '<tr><td>' + ADM.cap(r.lbl) + '</td><td class="r">' + fmt.num(r.n, 0) + '</td><td class="r">' + M(r.ing, 0) + '</td><td class="r">' + M(r.cs, 0) + '</td><td class="r"><b>' + M(r.ut, 0) + '</b></td></tr>').join('') + '</tbody></table></div><p class="hint" style="margin-top:10px">Es una estimación: supone el mismo ingreso medio por suscriptor y la misma estructura de costos del último mes completo.</p></div>';
      const st = MS.map((m) => stats(m));
      A.chart('f-fl', { data: { labels: MS.map((m) => fmt.mes(m.a).split(' ')[0] + (m.parcial ? '*' : '')), datasets: [{ type: 'bar', label: 'Entradas netas', data: st.map((x) => Math.round(x.neto)), backgroundColor: A.COL.ac, borderRadius: 6, order: 2 }, { type: 'bar', label: 'Salidas', data: st.map((x) => Math.round(x.cost)), backgroundColor: A.COL.ho, borderRadius: 6, order: 2 }, { type: 'line', order: 1, label: 'Saldo', data: st.map((x) => Math.round(x.util)), borderColor: A.COL.ac9, backgroundColor: A.COL.ac9, borderWidth: 3, tension: .3, pointRadius: 4 }] }, options: { interaction: { mode: 'index', intersect: false }, scales: { y: { grid: { color: A.COL.ln } }, x: { grid: { display: false } } } } });
      A.chart('f-pr', { data: { labels: rows.map((r) => ADM.cap(r.lbl)), datasets: [{ type: 'bar', label: 'Entradas', data: rows.map((r) => Math.round(r.ing)), backgroundColor: A.COL.ac, borderRadius: 6, order: 2 }, { type: 'bar', label: 'Salidas', data: rows.map((r) => Math.round(r.cs)), backgroundColor: A.COL.ho, borderRadius: 6, order: 2 }, { type: 'line', order: 1, label: 'Utilidad', data: rows.map((r) => Math.round(r.ut)), borderColor: A.COL.ac9, backgroundColor: A.COL.ac9, borderWidth: 3, pointRadius: 4 }] }, options: { scales: { x: { grid: { display: false } } } } });
    };

    /* ───── Punto de equilibrio ───── */
    V.equilibrio = (h) => {
      const P = params(), contrib = P.arpu - P.varSub, be = contrib > 0 ? Math.ceil(P.fijo / contrib) : null, pct = be ? Math.min(100, P.n0 / be * 100) : 0;
      h.innerHTML = '<div class="grid g2"><div class="cd"><div class="cd-h"><div><h3>Punto de equilibrio</h3><p>Suscriptores necesarios para cubrir los costos fijos</p></div></div>' + (be ? '<div class="big">' + be + ' suscriptores</div><p class="hint" style="margin:6px 0 14px">Hoy tienes <b>' + P.n0 + '</b> activos: ' + (P.n0 >= be ? 'superas el equilibrio por <b>' + (P.n0 - be) + '</b>.' : 'te faltan <b>' + (be - P.n0) + '</b>.') + '</p><div class="prog-b" style="height:16px"><i style="width:' + pct + '%"></i></div><p class="hint">' + fmt.pct(pct, 0) + ' del camino al equilibrio</p>' : '<p class="vacio">El costo variable supera al ingreso por suscriptor. Revisa precios o costos.</p>') + '</div>' +
        '<div class="cd"><div class="cd-h"><div><h3>Cómo se calcula</h3><p>Con datos de ' + P.base.label + '</p></div></div><dl class="dl" style="grid-template-columns:1fr auto"><dt>Costos fijos del mes</dt><dd>' + M(P.fijo, 0) + '</dd><dt>Ingreso neto por suscriptor</dt><dd>' + M(P.arpu) + '</dd><dt>Costo variable por suscriptor</dt><dd>' + M(P.varSub) + '</dd><dt>Contribución por suscriptor</dt><dd>' + M(contrib) + '</dd><dt>Fijos ÷ contribución</dt><dd>' + (be || '—') + '</dd></dl><p class="hint">Fijos: sueldos, marketing, arriendo y servicios. Variables: ingredientes, empaques y delivery.</p></div></div>';
    };

    /* ───── Exportar ───── */
    const ds = () => { const a = $('#xa') ? $('#xa').value : mes().a, b = $('#xb') ? $('#xb').value : mes().b; return { a, b }; };
    V.exportar = (h) => {
      const m = mes();
      h.innerHTML = '<div class="cd"><div class="cd-h"><div><h3>Exportar para contabilidad</h3><p>Elige el periodo y descarga en CSV o Excel.</p></div></div><div class="fgrid c2" style="max-width:520px"><label class="f"><span>Desde</span><input class="inp" type="date" id="xa" value="' + m.a + '"></label><label class="f"><span>Hasta</span><input class="inp" type="date" id="xb" value="' + m.b + '"></label></div><div class="grid g3" style="margin-top:18px">' +
        [['ingresos', 'Ingresos', 'Cobros con IVA, neto y estado', 'receipt'], ['gastos', 'Gastos', 'Costos por categoría y proveedor', 'coins'], ['subs', 'Suscriptores', 'Plan, estado, zona y fechas', 'users']].map(([k, t, d, ic]) => '<div class="cd" style="background:var(--acai-50)"><h3>' + icon(ic) + ' ' + t + '</h3><p class="hint" style="margin:4px 0 12px">' + d + '</p><div class="btn-fila"><button class="mini" data-ex="' + k + ':csv">' + icon('download') + ' CSV</button><button class="mini" data-ex="' + k + ':xls">' + icon('download') + ' Excel</button></div></div>').join('') + '</div></div>';
    };
    function exportar(w) {
      const [k, fm] = w.split(':'), { a, b } = ds(), nm = (id) => (EA.state.subs.find((q) => q.id === id) || {}).nombre || '';
      const T = {
        ingresos: { cols: [{ t: 'ID', v: (p) => p.id }, { t: 'Fecha', v: (p) => p.f }, { t: 'Suscriptor', v: (p) => p.sub }, { t: 'Nombre', v: (p) => nm(p.sub) }, { t: 'Plan', v: (p) => C.plans[p.plan].nombre }, { t: 'Almuerzos', v: (p) => C.frecuencias[p.frec].almuerzos }, { t: 'Neto', v: (p) => p.neto }, { t: 'IVA', v: (p) => p.iva }, { t: 'Total', v: (p) => p.monto }, { t: 'Estado', v: (p) => p.estado }, { t: 'Método', v: (p) => p.metodo }], rows: EA.state.pagos.filter((p) => p.f >= a && p.f <= b) },
        gastos: { cols: [{ t: 'ID', v: (g) => g.id }, { t: 'Fecha', v: (g) => g.f }, { t: 'Categoría', v: (g) => catN(g.cat) }, { t: 'Tipo', v: (g) => catT(g.cat) }, { t: 'Descripción', v: (g) => g.desc }, { t: 'Proveedor', v: (g) => g.prov }, { t: 'Monto', v: (g) => g.monto }], rows: EA.state.gastos.filter((g) => g.f >= a && g.f <= b) },
        subs: { cols: [{ t: 'ID', v: (s) => s.id }, { t: 'Nombre', v: (s) => s.nombre }, { t: 'Teléfono', v: (s) => s.tel }, { t: 'Correo', v: (s) => s.email }, { t: 'Plan', v: (s) => C.plans[s.plan].nombre }, { t: 'Almuerzos', v: (s) => C.frecuencias[s.frec].almuerzos }, { t: 'Público', v: (s) => A.PUB[s.publico] }, { t: 'Estado', v: (s) => A.estado(s) }, { t: 'Zona', v: (s) => EA.zona(s.zona).nombre }, { t: 'Inicio', v: (s) => s.inicio }, { t: 'Fin', v: (s) => s.fin || '' }, { t: 'Mensual', v: (s) => s.precio }, { t: 'Fuente', v: (s) => s.fuente }, { t: 'Campaña', v: (s) => s.campana }], rows: EA.state.subs.filter((s) => s.inicio <= b && (!s.fin || s.fin >= a)) }
      }[k];
      const fn = 'exotic-acai-' + k + '-' + a + '_' + b;
      if (fm === 'csv') EA.download(fn + '.csv', EA.csv(T.cols, T.rows)); else EA.download(fn + '.xls', EA.xls(k, T.cols, T.rows), 'application/vnd.ms-excel');
      EA.toast(T.rows.length + ' filas exportadas');
    }

    /* ───── SRI ───── */
    V.sri = (h) => { h.innerHTML = '<div class="soon"><span class="av">' + icon('receipt') + '</span><h3>Facturación electrónica SRI</h3><span class="demo-tag">PRÓXIMAMENTE</span><p class="hint" style="max-width:46ch">No está incluida en esta demo. En la versión final se conectará para emitir la factura de cada cobro mensual automáticamente.</p></div>'; };

    draw();
  };

  function gastoForm(g, redraw, m) {
    const n = g || { f: m.b, cat: 'ingredientes', desc: '', prov: '', monto: '' };
    const mo = EA.modal({ title: g ? 'Editar gasto' : 'Agregar gasto', body: '<form id="gf" class="fgrid"><div class="fgrid c2"><label class="f"><span>Fecha</span><input class="inp" type="date" name="f" required value="' + n.f + '" max="' + EA.hoy() + '"></label><label class="f"><span>Categoría</span><select class="inp" name="cat">' + EA.state.categorias.map((c) => '<option value="' + c.id + '"' + (c.id === n.cat ? ' selected' : '') + '>' + esc(c.nombre) + '</option>').join('') + '</select></label></div><label class="f"><span>Descripción</span><input class="inp" name="desc" required value="' + esc(n.desc) + '" placeholder="Ej.: Compra de pollo y verduras"></label><div class="fgrid c2"><label class="f"><span>Proveedor (opcional)</span><input class="inp" name="prov" value="' + esc(n.prov) + '"></label><label class="f"><span>Monto (US$)</span><input class="inp" name="monto" type="number" step="0.01" min="0.01" required value="' + n.monto + '"></label></div><div class="btn-fila" style="justify-content:flex-end"><button type="button" class="btn btn-ghost btn-sm" data-close>Cancelar</button><button class="btn btn-acai btn-sm">Guardar</button></div></form>' });
    mo.el.querySelector('#gf').onsubmit = (e) => { e.preventDefault(); const f = e.target; EA.guardarGasto({ id: n.id, f: f.f.value, cat: f.cat.value, desc: f.desc.value.trim(), prov: f.prov.value.trim(), monto: +(+f.monto.value).toFixed(2) }); mo.close(); EA.toast('Gasto guardado'); redraw(); };
  }
})();
