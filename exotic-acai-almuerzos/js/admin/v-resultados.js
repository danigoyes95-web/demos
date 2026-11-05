/* Panel de Resultados · versión completa (Admin, Finanzas) y resumida 🔸 (Cocina, Menús, Contenido) */
(function () {
  'use strict';
  const { $, esc, fmt, icon } = EA, C = CFG, A = ADM;

  const KPIS = {
    activos:     { t: 'Suscriptores activos', v: (k) => fmt.num(k.activos), d: (c, p) => A.delta(c.activos, p.activos) },
    nuevos:      { t: 'Nuevos', v: (k) => fmt.num(k.nuevos), d: (c, p) => A.delta(c.nuevos, p.nuevos) },
    cancelados:  { t: 'Cancelados', v: (k) => fmt.num(k.cancelados), d: (c, p) => A.delta(c.cancelados, p.cancelados, true) },
    churn:       { t: 'Churn', v: (k) => fmt.pct(k.churn), d: (c, p) => A.delta(c.churn, p.churn, true), n: 'sobre activos al inicio' },
    mrr:         { t: 'MRR (sin IVA)', v: (k) => fmt.money(k.mrr, 0), d: (c, p) => A.delta(c.mrr, p.mrr) },
    cobrado:     { t: 'Ingresos cobrados', v: (k) => fmt.money(k.cobrado, 0), d: (c, p) => A.delta(c.cobrado, p.cobrado), n: 'con IVA' },
    margen:      { t: 'Margen bruto', v: (k) => fmt.pct(k.margen), d: (c, p) => A.delta(c.margen, p.margen), n: 'estimado con costos del config' },
    entregados:  { t: 'Almuerzos entregados', v: (k) => fmt.num(k.entregados), d: (c, p) => A.delta(c.entregados, p.entregados) },
    ticket:      { t: 'Ticket promedio', v: (k) => fmt.money(k.ticket), d: (c, p) => A.delta(c.ticket, p.ticket), n: 'por cobro' },
    visitas:     { t: 'Visitas', v: (k) => fmt.num(k.visitas), d: (c, p) => A.delta(c.visitas, p.visitas) },
    inicios:     { t: 'Inicios del flujo', v: (k) => fmt.num(k.inicios), d: (c, p) => A.delta(c.inicios, p.inicios) },
    conversion:  { t: 'Conversión visita→pago', v: (k) => fmt.pct(k.conversion, 2), d: (c, p) => A.delta(c.conversion, p.conversion) },
    porciones:   { t: 'Porciones a preparar hoy', v: () => fmt.num(EA.entregasDia(EA.hoy())), d: () => '<span class="kd neu">mañana ' + fmt.num(EA.entregasDia(nextLab())) + '</span>' },
    valoracion:  { t: 'Valoración de platos', v: () => EA.valoracionMedia().toFixed(1) + ' / 5', d: () => '<span class="kd neu">' + EA.state.platos.reduce((n, p) => n + p.votos, 0) + ' votos</span>' }
  };
  const ALL_KPIS = ['activos', 'nuevos', 'cancelados', 'churn', 'mrr', 'cobrado', 'margen', 'entregados', 'ticket'];
  function nextLab() { let d = EA.addDias(EA.hoy(), 1); while (!EA.esLaborable(d)) d = EA.addDias(d, 1); return d; }

  A.views.resultados = (el, nivel) => {
    const rol = EA.usuario().rol, res = nivel === 'resumen' ? C.resumen[rol] : null;
    const kset = res ? res.kpis : ALL_KPIS, chset = res ? res.charts : ['evolucion', 'planes', 'embudo', 'fuentes', 'dias'], alset = res ? res.alertas : null;
    el.innerHTML = '<div class="pg-h"><div><h2 style="font-size:1.7rem">' + (res ? 'Tu resumen' : 'Resultados del negocio') + '</h2><p>' + (res ? 'Indicadores de tu área.' : 'Cómo va la suscripción de almuerzos.') + '</p></div>' + A.soloLectura(nivel) + '</div>' +
      '<div id="per"></div><div id="kp" class="kpis"></div><div id="al" class="cd"></div><div id="ch" class="grid g2"></div>';
    const draw = () => {
      A.periodoUI($('#per'), draw);
      const p = A.periodo(), cur = EA.kpisRango(p.a, p.b), prev = EA.kpisRango(p.pa, p.pb);
      $('#kp').innerHTML = kset.map((k) => { const d = KPIS[k]; return A.kpi(d.t, d.v(cur), d.d(cur, prev), d.n); }).join('');
      /* alertas */
      let al = EA.alertas(); if (alset) al = al.filter((a) => alset.includes(a.id));
      $('#al').innerHTML = '<div class="cd-h"><div><h3>Alertas</h3><p>Se calculan solas con los datos de hoy.</p></div></div><div class="alertas">' + (al.length ? al.map((a) => {
        const ok = EA.nivel(a.ir); const tag = ok ? 'a href="#/' + a.ir + '"' : 'div';
        return '<' + tag + ' class="alerta">' + icon(a.icon) + '<div><b>' + esc(a.titulo) + '</b><span>' + esc(a.detalle) + '</span></div></' + (ok ? 'a' : 'div') + '>';
      }).join('') : '<div class="alerta a-ok">' + icon('check') + '<div><b>Todo en orden</b><span>No hay alertas para tu área.</span></div></div>') + '</div>';
      /* gráficos */
      const box = { evolucion: ['Suscriptores activos y MRR', 'Últimos 6 meses', 'g-ev', 'alto'], planes: ['Distribución por plan y público', 'Suscriptores activos al cierre del periodo', 'g-pl'], embudo: ['Embudo de conversión', 'Visitas → inicio del flujo → pago', null], fuentes: ['Fuentes de tráfico', 'Visitas en el periodo', 'g-fu'], dias: ['Almuerzos por día de la semana', 'Promedio diario', 'g-di'] };
      $('#ch').innerHTML = chset.map((k) => { const [t, s, id, cl] = box[k]; return '<div class="cd' + (k === 'evolucion' ? ' span2' : '') + '" style="' + (k === 'evolucion' ? 'grid-column:1/-1' : '') + '"><div class="cd-h"><div><h3>' + t + '</h3><p>' + s + '</p></div></div>' + (id ? A.cv(id, cl) : '<div class="emb" id="emb"></div>') + '</div>'; }).join('');
      if (chset.includes('evolucion')) evol();
      if (chset.includes('planes')) planes(p);
      if (chset.includes('embudo')) embudo(p);
      if (chset.includes('fuentes')) fuentes(p);
      if (chset.includes('dias')) dias(p);
    };
    draw();
  };

  function evol() {
    const hoy = EA.hoy(), d0 = EA.D(hoy), L = [], N = [], M = [];
    for (let i = 5; i >= 0; i--) {
      const f = new Date(d0.getFullYear(), d0.getMonth() - i + 1, 0, 12); let iso = EA.iso(f); if (iso > hoy) iso = hoy;
      const s = EA.snapshot(iso); L.push(fmt.mes(iso).split(' ')[0] + (i === 0 ? ' (hoy)' : '')); N.push(s.n); M.push(Math.round(s.mrr));
    }
    A.chart('g-ev', { data: { labels: L, datasets: [
      { type: 'bar', label: 'MRR sin IVA (US$)', data: M, backgroundColor: 'rgba(130,171,95,.55)', borderRadius: 8, yAxisID: 'y1', order: 2 },
      { type: 'line', label: 'Suscriptores activos', data: N, borderColor: A.COL.ac, backgroundColor: A.COL.ac, tension: .35, borderWidth: 3, pointRadius: 5, yAxisID: 'y', order: 1 }] },
      options: { interaction: { mode: 'index', intersect: false }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Suscriptores' }, grid: { color: A.COL.ln } }, y1: { beginAtZero: true, position: 'right', grid: { display: false }, title: { display: true, text: 'MRR (US$)' } }, x: { grid: { display: false } } } } });
  }
  function planes(p) {
    const v = EA.state.subs.filter((s) => EA.vigente(s, p.b)); const pubs = ['oficina', 'gym', 'especial'], col = [A.COL.ac, A.COL.ho, A.COL.ac3];
    A.chart('g-pl', { type: 'bar', data: { labels: Object.values(C.plans).map((x) => x.nombre), datasets: pubs.map((u, i) => ({ label: 'Público ' + A.PUB[u].toLowerCase(), data: Object.keys(C.plans).map((pl) => v.filter((s) => s.plan === pl && s.publico === u).length), backgroundColor: col[i], borderRadius: 6 })) },
      options: { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } } } });
  }
  function embudo(p) {
    const f = EA.funnelRows().filter((r) => r.f >= p.a && r.f <= p.b), s = (k) => f.reduce((n, r) => n + r[k], 0);
    const pasos = [['Visitas', s('visitas')], ['Inicio del flujo', s('inicio')], ['Pago completado', s('pago')]], max = pasos[0][1] || 1;
    $('#emb').innerHTML = pasos.map(([t, n], i) => '<div class="emb-r"><span>' + t + '</span><div class="bar"><i style="width:' + Math.max(2, n / max * 100) + '%"></i></div><b>' + fmt.num(n) + '<em>' + (i === 0 ? '100%' : fmt.pct(pasos[i - 1][1] ? n / pasos[i - 1][1] * 100 : 0) + ' del paso anterior') + '</em></b></div>').join('') +
      '<p class="hint" style="margin-top:6px">Conversión total: <b>' + fmt.pct(max ? pasos[2][1] / max * 100 : 0, 2) + '</b></p>';
  }
  function fuentes(p) {
    const f = EA.funnelRows().filter((r) => r.f >= p.a && r.f <= p.b), ks = Object.keys(A.FUENTE);
    const v = ks.map((k) => f.filter((r) => r.fuente === k).reduce((n, r) => n + r.visitas, 0)), tot = v.reduce((a, b) => a + b, 0) || 1;
    A.chart('g-fu', { type: 'bar', data: { labels: ks.map((k, i) => A.FUENTE[k] + ' · ' + fmt.pct(v[i] / tot * 100, 0)), datasets: [{ label: 'Visitas', data: v, backgroundColor: [A.COL.ac, A.COL.ho, A.COL.ac3, A.COL.ho2], borderRadius: 6 }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } }, y: { grid: { display: false } } } } });
  }
  function dias(p) {
    let a = p.a, b = p.b; if (EA.rango(a, b).length < 7) { a = EA.addDias(EA.hoy(), -27); b = EA.hoy(); }
    const sum = [0, 0, 0, 0, 0, 0], cnt = [0, 0, 0, 0, 0, 0];
    EA.rango(a, b).forEach((d) => { const w = EA.dow(d); if (EA.esLaborable(d)) { sum[w] += EA.entregasDia(d); cnt[w]++; } });
    A.chart('g-di', { type: 'bar', data: { labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], datasets: [{ label: 'Almuerzos por día', data: [1, 2, 3, 4, 5].map((w) => (cnt[w] ? Math.round(sum[w] / cnt[w]) : 0)), backgroundColor: A.COL.ac, borderRadius: 8 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } } });
  }
})();
