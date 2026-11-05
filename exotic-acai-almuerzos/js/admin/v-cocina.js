/* Cocina (Nicolás) · porciones a preparar y entregas por horario/zona */
(function () {
  'use strict';
  const { $, $$, esc, fmt, icon } = EA, C = CFG, A = ADM;
  const nextLab = () => { let d = EA.addDias(EA.hoy(), 1); while (!EA.esLaborable(d)) d = EA.addDias(d, 1); return d; };
  const key = (s, d) => EA.state.entregas[d] && EA.state.entregas[d][s.id];

  A.views.cocina = (el, nivel) => {
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
  };
})();
