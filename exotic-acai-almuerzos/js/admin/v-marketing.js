/* Marketing / Embudo (Cris) · embudo detallado, fuentes, campañas UTM, nuevos por semana, plan por fuente */
(function () {
  'use strict';
  const { $, esc, fmt, icon } = EA, C = CFG, A = ADM;

  A.views.marketing = (el, nivel) => {
    const edit = nivel === 'edit';
    el.innerHTML = '<div class="pg-h"><div><h2 style="font-size:1.7rem">Marketing y embudo</h2><p>De dónde llegan y dónde se caen.</p></div>' + A.soloLectura(nivel) + '</div><div id="per"></div><div id="kp" class="kpis"></div>' +
      '<div class="grid g2"><div class="cd"><div class="cd-h"><div><h3>Embudo detallado</h3><p>Cada paso del flujo de suscripción</p></div></div><div class="emb" id="emb"></div></div>' +
      '<div class="cd"><div class="cd-h"><div><h3>Fuentes de tráfico</h3><p>Visitas y pagos por fuente</p></div></div>' + A.cv('m-fu') + '</div></div>' +
      '<div class="cd"><div class="cd-h"><div><h3>Conversión por campaña (UTM)</h3><p>Ordenado por pagos</p></div></div><div class="tw"><table class="tbl"><thead><tr><th>Campaña</th><th>Fuente</th><th class="r">Visitas</th><th class="r">Inicios</th><th class="r">Pagos</th><th class="r">Visita→pago</th><th class="r">Inicio→pago</th></tr></thead><tbody id="camp"></tbody></table></div></div>' +
      '<div class="grid g2"><div class="cd"><div class="cd-h"><div><h3>Nuevos suscriptores por semana</h3><p>Últimas 12 semanas</p></div></div>' + A.cv('m-sem') + '</div><div class="cd"><div class="cd-h"><div><h3>Planes más elegidos según la fuente</h3><p>Altas del periodo</p></div></div>' + A.cv('m-plf') + '</div></div>' +
      (edit ? '<div class="cd"><div class="cd-h"><div><h3>' + icon('copy') + ' Generador de enlaces con UTM</h3><p>Usa un enlace distinto por publicación para saber cuál vende.</p></div></div><div class="fgrid c2"><label class="f"><span>Fuente</span><select class="inp" id="u-s"><option>instagram</option><option>whatsapp</option><option>referidos</option><option>directo</option></select></label><label class="f"><span>Campaña</span><input class="inp" id="u-c" placeholder="reel-almuerzo-oficina"></label><label class="f"><span>Medio (opcional)</span><input class="inp" id="u-m" placeholder="reel, historia, bio"></label></div><div class="inp tnum" id="u-o" style="margin-top:12px;word-break:break-all;background:var(--acai-50);min-height:48px"></div><div class="btn-fila" style="margin-top:10px"><button class="btn btn-acai btn-sm" id="u-cp">' + icon('copy') + ' Copiar enlace</button></div></div>' : '');

    const draw = () => {
      A.periodoUI($('#per'), draw);
      const p = A.periodo(), f = EA.funnelRows().filter((r) => r.f >= p.a && r.f <= p.b), s = (rows, k) => rows.reduce((n, r) => n + r[k], 0);
      const cur = EA.kpisRango(p.a, p.b), prev = EA.kpisRango(p.pa, p.pb);
      $('#kp').innerHTML = A.kpi('Visitas', fmt.num(cur.visitas), A.delta(cur.visitas, prev.visitas)) + A.kpi('Inicios del flujo', fmt.num(cur.inicios), A.delta(cur.inicios, prev.inicios)) + A.kpi('Pagos', fmt.num(cur.pagos), A.delta(cur.pagos, prev.pagos)) + A.kpi('Conversión visita→pago', fmt.pct(cur.conversion, 2), A.delta(cur.conversion, prev.conversion)) + A.kpi('Nuevos suscriptores', fmt.num(cur.nuevos), A.delta(cur.nuevos, prev.nuevos));
      /* embudo detallado */
      const pasos = [['Visitas', s(f, 'visitas')], ['Inició el flujo', s(f, 'inicio')], ['1 · Objetivo', s(f, 'p1')], ['2 · Restricciones', s(f, 'p2')], ['3 · Plan', s(f, 'p3')], ['4 · Entrega', s(f, 'p4')], ['5 · Pago', s(f, 'pago')]], mx = pasos[0][1] || 1;
      $('#emb').innerHTML = pasos.map(([t, n], i) => '<div class="emb-r"><span>' + t + '</span><div class="bar"><i style="width:' + Math.max(1.5, n / mx * 100) + '%"></i></div><b>' + fmt.num(n) + '<em>' + (i ? fmt.pct(pasos[i - 1][1] ? n / pasos[i - 1][1] * 100 : 0) + ' del anterior · ' : '') + fmt.pct(n / mx * 100, 1) + ' del total</em></b></div>').join('');
      /* fuentes */
      const ks = Object.keys(A.FUENTE);
      A.chart('m-fu', { type: 'bar', data: { labels: ks.map((k) => A.FUENTE[k]), datasets: [{ label: 'Visitas', data: ks.map((k) => s(f.filter((r) => r.fuente === k), 'visitas')), backgroundColor: A.COL.ac, borderRadius: 6, yAxisID: 'y' }, { label: 'Pagos', data: ks.map((k) => s(f.filter((r) => r.fuente === k), 'pago')), backgroundColor: A.COL.ho, borderRadius: 6, yAxisID: 'y1' }] }, options: { scales: { y: { beginAtZero: true, title: { display: true, text: 'Visitas' } }, y1: { beginAtZero: true, position: 'right', grid: { display: false }, ticks: { precision: 0 }, title: { display: true, text: 'Pagos' } }, x: { grid: { display: false } } } } });
      /* campañas */
      const cm = {}; f.forEach((r) => { const k = (r.campana || '(sin campaña)') + '|' + r.fuente; const o = cm[k] || (cm[k] = { c: r.campana || '(sin campaña)', f: r.fuente, v: 0, i: 0, p: 0 }); o.v += r.visitas; o.i += r.inicio; o.p += r.pago; });
      $('#camp').innerHTML = Object.values(cm).sort((a, b) => b.p - a.p || b.v - a.v).map((o) => '<tr><td><b>' + esc(o.c) + '</b></td><td>' + (A.FUENTE[o.f] || esc(o.f)) + '</td><td class="r">' + fmt.num(o.v) + '</td><td class="r">' + fmt.num(o.i) + '</td><td class="r"><b>' + fmt.num(o.p) + '</b></td><td class="r">' + fmt.pct(o.v ? o.p / o.v * 100 : 0, 2) + '</td><td class="r">' + fmt.pct(o.i ? o.p / o.i * 100 : 0) + '</td></tr>').join('') || '<tr><td colspan="7" class="vacio">Sin datos en el periodo.</td></tr>';
      /* nuevos por semana */
      const hoy = EA.hoy(), lun = EA.addDias(hoy, -((EA.dow(hoy) + 6) % 7)), sem = [];
      for (let i = 11; i >= 0; i--) { const a = EA.addDias(lun, -7 * i), b = EA.addDias(a, 6); sem.push([fmt.fechaCorta(a), EA.state.subs.filter((x) => x.inicio >= a && x.inicio <= b).length]); }
      A.chart('m-sem', { type: 'bar', data: { labels: sem.map((x) => x[0]), datasets: [{ label: 'Nuevos suscriptores', data: sem.map((x) => x[1]), backgroundColor: A.COL.ac, borderRadius: 6 }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } } } } });
      /* planes por fuente */
      const nuevos = EA.state.subs.filter((x) => x.inicio >= p.a && x.inicio <= p.b), pc = [A.COL.ac, A.COL.ho, A.COL.ac3];
      A.chart('m-plf', { type: 'bar', data: { labels: ks.map((k) => A.FUENTE[k]), datasets: Object.values(C.plans).map((pl, i) => ({ label: pl.nombre, data: ks.map((k) => nuevos.filter((x) => x.fuente === k && x.plan === pl.id).length), backgroundColor: pc[i], borderRadius: 4 })) }, options: { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } } } });
    };
    draw();

    if (edit) {
      const out = () => {
        const q = new URLSearchParams({ utm_source: $('#u-s').value }); if ($('#u-c').value.trim()) q.set('utm_campaign', EA.slug($('#u-c').value)); if ($('#u-m').value.trim()) q.set('utm_medium', EA.slug($('#u-m').value));
        const base = location.href.split('admin/')[0] + 'index.html'; $('#u-o').textContent = base + '?' + q.toString();
      };
      el.addEventListener('input', (e) => { if (/^u-/.test(e.target.id)) out(); });
      el.addEventListener('click', (e) => { if (e.target.closest('#u-cp')) { const t = $('#u-o').textContent; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => EA.toast('Enlace copiado'), () => EA.toast('Selecciona y copia el enlace')); } });
      out();
    }
  };
})();
