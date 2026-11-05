/* Admin · shell, login simulado, enrutador por hash y utilidades compartidas */
(function () {
  'use strict';
  const { $, $$, esc, fmt, icon } = EA, C = CFG;
  const ADM = (window.ADM = { views: {} });
  const BASE = window.EA_BASE || '';
  ADM.img = (p) => (/^(data:|https?:)/.test(p) ? p : BASE + p);
  ADM.COL = { ac: '#483469', ac6: '#5C4785', ac3: '#A596C6', ac2: '#CFC4E0', ac9: '#2B1F42', ho: '#82AB5F', ho2: '#477129', ho9: '#1E3D1D', cr: '#E5D9E3', tx: '#5B5070', ln: '#E3DAE6' };
  ADM.PUB = { oficina: 'Oficina', gym: 'Gym', especial: 'Especial' };
  ADM.FUENTE = { instagram: 'Instagram', whatsapp: 'WhatsApp', directo: 'Directo', referidos: 'Referidos' };
  ADM.estado = (s) => (s.fin && s.fin <= EA.hoy() ? 'cancelado' : EA.enPausa(s, EA.hoy()) ? 'pausado' : 'activo');
  ADM.cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  /* ── gráficos ── */
  const reg = {};
  ADM.chart = (id, cfg) => {
    const cv = document.getElementById(id); if (!cv) return null; if (reg[id]) reg[id].destroy();
    const D = Chart.defaults; D.font.family = '"Plus Jakarta Sans", system-ui, sans-serif'; D.font.size = 12; D.color = ADM.COL.tx; D.borderColor = ADM.COL.ln;
    cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false, animation: { duration: 500 }, plugins: {} }, cfg.options || {});
    cfg.options.plugins = Object.assign({ legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, padding: 14 } } }, cfg.options.plugins);
    return (reg[id] = new Chart(cv, cfg));
  };
  ADM.destroyCharts = () => { Object.keys(reg).forEach((k) => { reg[k].destroy(); delete reg[k]; }); };
  ADM.cv = (id, cls) => '<div class="cv ' + (cls || '') + '"><canvas id="' + id + '" role="img" aria-label="Gráfico"></canvas></div>';

  /* ── periodo compartido ── */
  ADM.per = (() => { try { return JSON.parse(sessionStorage.getItem('ea_per') || 'null'); } catch (e) { return null; } })() || { tipo: 'mes', a: '', b: '' };
  ADM.periodo = () => EA.periodo(ADM.per.tipo, ADM.per);
  ADM.periodoUI = (host, onChange) => {
    const T = [['hoy', 'Hoy'], ['semana', 'Semana'], ['mes', 'Mes'], ['mes_ant', 'Mes anterior'], ['custom', 'Personalizado']];
    const p = ADM.periodo();
    host.innerHTML = '<div class="per" role="group" aria-label="Periodo">' + T.map(([k, l]) => '<button class="chip" type="button" aria-pressed="' + (ADM.per.tipo === k) + '" data-p="' + k + '">' + l + '</button>').join('') +
      (ADM.per.tipo === 'custom' ? '<input type="date" id="pa" value="' + p.a + '" max="' + EA.hoy() + '" aria-label="Desde"><input type="date" id="pb" value="' + p.b + '" max="' + EA.hoy() + '" aria-label="Hasta">' : '') +
      '</div><p class="per-r">' + fmt.fecha(p.a) + (p.a !== p.b ? ' – ' + fmt.fecha(p.b) : '') + ' · comparado con ' + fmt.fecha(p.pa) + (p.pa !== p.pb ? ' – ' + fmt.fecha(p.pb) : '') + '</p>';
    const save = () => { try { sessionStorage.setItem('ea_per', JSON.stringify(ADM.per)); } catch (e) {} };
    host.onclick = (e) => { const b = e.target.closest('[data-p]'); if (!b) return; ADM.per.tipo = b.dataset.p; if (b.dataset.p === 'custom' && !ADM.per.a) { const pp = EA.periodo('mes'); ADM.per.a = pp.a; ADM.per.b = pp.b; } save(); onChange(); };
    host.onchange = (e) => { if (e.target.id === 'pa') ADM.per.a = e.target.value; if (e.target.id === 'pb') ADM.per.b = e.target.value; if (e.target.id === 'pa' || e.target.id === 'pb') { save(); onChange(); } };
  };

  /* ── piezas de UI ── */
  ADM.estrellas = (r) => '<span class="estr" aria-label="' + r.toFixed(1) + ' de 5">' + '★'.repeat(Math.round(r)) + '<i>' + '★'.repeat(5 - Math.round(r)) + '</i></span> <b>' + r.toFixed(1) + '</b>';
  ADM.delta = (cur, prev, inv) => {
    const d = EA.delta(cur, prev);
    if (d == null || !isFinite(d)) return '<span class="kd neu">— sin base</span>';
    if (Math.abs(d) < 0.05) return '<span class="kd neu">= 0,0%</span>';
    const up = d > 0, good = inv ? !up : up;
    return '<span class="kd ' + (good ? 'good' : 'bad') + '">' + (up ? '▲' : '▼') + ' ' + fmt.num(Math.abs(d), 1) + '%</span>';
  };
  ADM.kpi = (label, val, deltaHtml, nota) => '<div class="kpi"><span class="kl">' + label + '</span><b class="kv">' + val + '</b>' + (deltaHtml || '') + (nota ? '<small>' + nota + '</small>' : '') + '</div>';
  ADM.soloLectura = (nivel) => (nivel === 'view' ? '<span class="ro">' + icon('eye') + ' Solo lectura</span>' : nivel === 'resumen' ? '<span class="ro resumen">Resumen de tu área</span>' : '');
  ADM.confirmar = (titulo, texto, ok, cb) => {
    const m = EA.modal({ title: titulo, body: '<p>' + texto + '</p><div class="btn-fila" style="margin-top:18px;justify-content:flex-end"><button class="btn btn-ghost btn-sm" data-close>Cancelar</button><button class="btn btn-acai btn-sm" id="okc">' + ok + '</button></div>', noFocus: true });
    m.el.querySelector('#okc').onclick = () => { m.close(); cb(); };
  };
  ADM.drawer = (html) => {
    const w = document.createElement('div'); w.className = 'dr-wrap';
    w.innerHTML = '<aside class="dr" role="dialog" aria-modal="true"><div style="display:flex;justify-content:flex-end"><button class="icon-btn" data-close aria-label="Cerrar">' + icon('x') + '</button></div>' + html + '</aside>';
    const close = () => { w.remove(); document.body.classList.remove('lock'); };
    w.addEventListener('click', (e) => { if (e.target === w || e.target.closest('[data-close]')) close(); });
    document.body.appendChild(w); document.body.classList.add('lock'); return { el: w, close };
  };
  ADM.tabsUI = (tabs, actual) => '<div class="tabs" role="tablist">' + tabs.map(([k, l]) => '<button class="tab" role="tab" aria-selected="' + (k === actual) + '" data-tab="' + k + '">' + l + '</button>').join('') + '</div>';

  /* ── login simulado ── */
  function login() {
    $('#root').innerHTML = '<div class="login"><i class="hojas" aria-hidden="true"></i><div class="login-box"><a class="marca" href="../index.html"><img src="' + BASE + 'assets/img/logo.webp" width="44" height="44" alt=""><span>Exotic Açaí<small>Panel interno</small></span></a>' +
      '<h1>¿Quién entra?</h1><div class="modo">' + icon('info') + '<span><b>Modo demo.</b> Elige un usuario para ver qué sección y qué permisos tiene cada rol. No hay contraseñas.</span></div>' +
      '<div class="users">' + C.equipo.map((u) => '<button class="user" data-u="' + u.id + '"><span class="av">' + esc(u.iniciales) + '</span><span><b>' + esc(u.corto || u.nombre) + '</b><small>' + esc(u.cargo) + '</small></span><span class="rol ' + u.rol + '">' + C.roles[u.rol] + '</span></button>').join('') + '</div></div></div>';
    $('.users').onclick = (e) => { const b = e.target.closest('[data-u]'); if (!b) return; EA.login(b.dataset.u); location.hash = '#/resultados'; shell(); };
  }

  /* ── shell + ruteo ── */
  function secciones() { return C.secciones.filter((s) => EA.nivel(s.id)); }
  function shell() {
    const u = EA.usuario(); if (!u) return login();
    const nv = { edit: '', view: 'Lectura', resumen: 'Resumen' };
    $('#root').innerHTML = '<div class="shell"><aside class="sb" id="sb" aria-label="Menú"><a class="marca" href="../index.html"><img src="' + BASE + 'assets/img/logo.webp" width="44" height="44" alt=""><span>Exotic Açaí<small>Panel interno</small></span></a>' +
      '<nav class="nav" id="nav">' + secciones().map((s) => '<a href="#/' + s.id + '" data-s="' + s.id + '">' + icon(s.icon) + '<span>' + s.nombre + '</span>' + (nv[EA.nivel(s.id)] ? '<i class="nv">' + nv[EA.nivel(s.id)] + '</i>' : '') + '</a>').join('') + '</nav>' +
      '<div class="sb-foot"><a href="../index.html" style="color:inherit">← Ver landing</a><br><a href="../suscribirse.html" style="color:inherit">← Ver flujo de suscripción</a></div></aside><div class="sb-scrim" id="scrim"></div>' +
      '<div class="main"><div class="demo-strip"><b>MODO DEMO</b> · roles simulados · datos de ejemplo guardados en este navegador</div><header class="tb"><div class="tb-in"><button class="icon-btn burger" id="burger" aria-label="Abrir menú">' + icon('menu') + '</button><h1 id="ttl"></h1>' +
      '<div class="me"><span class="av">' + esc(u.iniciales) + '</span><span><b>' + esc(u.corto || u.nombre) + '</b><small>' + C.roles[u.rol] + '</small></span></div><button class="icon-btn" id="salir" aria-label="Cambiar de usuario" title="Cambiar de usuario">' + icon('logout') + '</button></div></header><main class="content" id="vista"></main></div></div>';
    const sb = $('#sb');
    $('#burger').onclick = () => sb.classList.add('open'); $('#scrim').onclick = () => sb.classList.remove('open');
    $('#nav').onclick = () => sb.classList.remove('open');
    $('#salir').onclick = () => { EA.logout(); ADM.destroyCharts(); location.hash = ''; login(); };
    route();
  }
  function route() {
    const u = EA.usuario(); if (!u || !$('#vista')) return;
    let id = (location.hash.replace('#/', '') || 'resultados').split('?')[0];
    const permitidas = secciones().map((s) => s.id);
    const sec = C.secciones.find((s) => s.id === id);
    ADM.destroyCharts();
    $$('#nav a').forEach((a) => a.classList.toggle('on', a.dataset.s === id));
    if (!sec || !permitidas.includes(id)) {
      $('#ttl').textContent = 'Sin acceso';
      $('#vista').innerHTML = '<div class="cd vacio"><span class="av" style="margin:0 auto 12px">' + icon('lock') + '</span><h3>Esta sección no está habilitada para el rol ' + C.roles[u.rol] + '.</h3><p style="margin:8px 0 16px">Pídele a un Admin que te dé acceso en Equipo y permisos.</p><a class="btn btn-acai btn-sm" href="#/resultados">Ir al Panel de Resultados</a></div>';
      return;
    }
    $('#ttl').textContent = sec.nombre; document.title = sec.nombre + ' · Exotic Açaí';
    const el = $('#vista'); el.innerHTML = ''; scrollTo(0, 0);
    ADM.views[id](el, EA.nivel(id));
  }
  ADM.refresh = route;
  ADM.start = () => { window.addEventListener('hashchange', route); shell(); };
})();
