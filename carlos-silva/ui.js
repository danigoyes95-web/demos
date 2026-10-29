/* Ficha de ejercicio con animación (compartida por panel y portal del cliente). */
(() => {
  const { esc } = CS; CS.fecha = CS.fecha || (d => d); let stop = () => {};
  CS.verEj = id => { const e = EJ.get(id); if (!e) return;
    let dg = document.getElementById('dEj'); if (!dg) { dg = document.createElement('dialog'); dg.id = 'dEj'; dg.setAttribute('aria-labelledby', 'dEjT'); document.body.appendChild(dg); dg.addEventListener('close', () => stop()); }
    dg.innerHTML = `<button class="btn sec sm x" aria-label="Cerrar">✕</button><h3 id="dEjT">${esc(e.n)}</h3><span class="chip">${esc(e.gr)}</span> <span class="chip">${esc(e.niv)}</span> <span class="chip">${esc(e.mus)}</span>
      <div class="vis" style="margin:12px 0"></div>${EJ.frames(e)}
      ${e.pasos.length ? `<h4>Cómo hacerlo</h4><ol>${e.pasos.map(p => `<li>${esc(p)}</li>`).join('')}</ol>` : ''}
      ${e.err.length ? `<h4>Errores comunes</h4><ul>${e.err.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
      ${e.resp ? `<h4>Respiración</h4><p>${esc(e.resp)}</p>` : ''}
      ${e.video ? `<p style="margin-top:10px"><a class="btn sm" href="${esc(/^https?:\/\//.test(e.video) ? e.video : '#')}" target="_blank" rel="noopener">▶ Ver video del coach</a></p>` : ''}
      <p style="font-size:12px;color:var(--mut);margin-top:10px">Figura esquemática de referencia. Ante dudas, pide a Carlos que revise tu técnica por WhatsApp.</p>`;
    dg.querySelector('.x').onclick = () => dg.close(); dg.showModal(); stop(); stop = EJ.animar(dg.querySelector('.vis'), e); };
  /* galería de todos los check-ins (para que el coach vea cada foto apenas se sube, sin esperar a tener 2 fechas) */
  CS.galeria = async (el, cid, coach) => {
    el.innerHTML = '<p style="color:var(--mut)">Cargando fotos…</p>'; let L;
    try { L = await CS.Store.fotos.lista(cid, coach); } catch (e) { el.innerHTML = '<p class="bad">No se pudieron cargar las fotos.</p>'; return; }
    const fechas = [...new Set(L.map(x => x.f))].sort().reverse(), VN = { frente: 'Frente', lateral: 'Lateral', espalda: 'Espalda' };
    if (!fechas.length) { el.innerHTML = '<p style="color:var(--mut)">Aún no hay fotos de check-in.</p>'; return; }
    el.innerHTML = fechas.map(f => `<div class="gal-f"><b>${esc(CS.fecha(f))}</b> <small style="color:var(--mut)">${L.filter(x => x.f === f).length}/3 fotos</small><div class="gal">${Object.keys(VN).map(v => { const t = L.find(x => x.f === f && x.v === v); return t ? `<button class="gal-i" data-gf="${f}" data-gv="${v}"${t.demo !== undefined ? ` data-gd="${t.demo}"` : ''} aria-label="Ver foto ${VN[v]} ${esc(CS.fecha(f))}"><img alt="${VN[v]}"><span>${VN[v]}</span></button>` : `<div class="gal-i vacio"><span>${VN[v]}<br>sin foto</span></div>`; }).join('')}</div></div>`).join('');
    const U = b => CS.Store.fotos.url(cid, b.dataset.gf, b.dataset.gv, b.dataset.gd === undefined ? undefined : +b.dataset.gd);
    el.querySelectorAll('.gal-i[data-gf]').forEach(async b => { b.querySelector('img').src = await U(b); });
    el.onclick = async ev => { const b = ev.target.closest('.gal-i[data-gf]'); if (!b) return; const o = document.createElement('div'); o.className = 'gal-o'; o.innerHTML = `<button aria-label="Cerrar">✕</button><img alt="Foto ${VN[b.dataset.gv]}"><p>${VN[b.dataset.gv]} · ${esc(CS.fecha(b.dataset.gf))}</p>`; o.onclick = () => o.remove(); document.body.appendChild(o); o.querySelector('img').src = await U(b); };
  };
  /* comparador antes/después con deslizador, por vista (frente · lateral · espalda) */
  CS.comparador = async (el, cid, coach) => {
    el.innerHTML = '<p style="color:var(--mut)">Cargando fotos…</p>'; let L;
    try { L = await CS.Store.fotos.lista(cid, coach); } catch (e) { el.innerHTML = '<p class="bad">No se pudieron cargar las fotos.</p>'; return; }
    const fechas = [...new Set(L.map(x => x.f))].sort();
    if (fechas.length < 2) {
      const vacio = coach ? 'Cuando el cliente suba sus fotos del check-in aparecerán aquí. Con 2 check-ins (dos fechas) podrás deslizar para ver el antes y el después.' : 'Sube tus 3 fotos arriba (frente, lateral y espalda). Con 2 check-ins podrás deslizar y ver tu antes y después.';
      if (!fechas.length) { el.innerHTML = `<div class="cmp-vacio"><svg viewBox="0 0 120 150" width="64" aria-hidden="true"><circle cx="60" cy="34" r="20" fill="#19e3ee33"/><path d="M20 140c0-34 18-58 40-58s40 24 40 58z" fill="#19e3ee22"/></svg><p>${esc(vacio)}</p></div>`; return; }
      el.innerHTML = `<p style="color:var(--mut);margin:0 0 8px">Primer check-in: <b style="color:var(--ink)">${esc(CS.fecha(fechas[0]))}</b>. Falta un segundo check-in para poder comparar.</p><div class="gal" id="cmp1"></div>`;
      const g = el.querySelector('#cmp1'); ['frente', 'lateral', 'espalda'].forEach(async v => { const t = L.find(x => x.f === fechas[0] && x.v === v); const f = document.createElement('div'); f.className = 'gal-i' + (t ? '' : ' vacio'); if (t) { const im = document.createElement('img'); im.alt = v; f.appendChild(im); g.appendChild(f); im.src = await CS.Store.fotos.url(cid, fechas[0], v, t.demo); } else { f.innerHTML = '<span>' + v + '<br>sin foto</span>'; g.appendChild(f); } }); return; }
    const st = { a: fechas[0], b: fechas.at(-1), v: 'frente' }, VN = { frente: 'Frente', lateral: 'Lateral', espalda: 'Espalda' };
    const tiene = (f, v) => L.find(x => x.f === f && x.v === v), demo = (f, v) => (tiene(f, v) || {}).demo;
    const opt = s => fechas.map(f => `<option value="${f}" ${f === s ? 'selected' : ''}>${esc(CS.fecha ? CS.fecha(f) : f)}</option>`).join('');
    const draw = async () => {
      el.innerHTML = `<div class="cmp-t"><label>Antes<select data-ca>${opt(st.a)}</select></label><label>Después<select data-cb>${opt(st.b)}</select></label></div>
        <div class="seg" style="margin:10px 0">${Object.keys(VN).map(v => `<button data-cv="${v}" aria-selected="${v === st.v}" style="flex-direction:row;min-height:38px;font-size:13px">${VN[v]}</button>`).join('')}</div>
        <div class="cmp"><img data-ib alt="Foto después" draggable="false"><img data-ia alt="Foto antes" draggable="false" style="clip-path:inset(0 50% 0 0)"><i class="cmp-h" style="left:50%"></i><span class="cmp-l l">ANTES</span><span class="cmp-l r">DESPUÉS</span>
        <input type="range" min="0" max="100" value="50" aria-label="Deslizar para comparar antes y después"></div><p class="cmp-f"><span>${esc(CS.fecha(st.a))}</span><span>${esc(CS.fecha(st.b))}</span></p>`;
      const ia = el.querySelector('[data-ia]'), ib = el.querySelector('[data-ib]'), h = el.querySelector('.cmp-h'), r = el.querySelector('input[type=range]');
      const put = async (img, f) => { img.src = tiene(f, st.v) ? await CS.Store.fotos.url(cid, f, st.v, demo(f, st.v)) : 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320"><rect width="240" height="320" fill="#0b1a22"/><text x="120" y="160" fill="#8fb0b8" font-size="13" text-anchor="middle" font-family="sans-serif">Sin foto de ' + st.v + '</text></svg>'); };
      put(ia, st.a); put(ib, st.b);
      r.oninput = () => { ia.style.clipPath = `inset(0 ${100 - r.value}% 0 0)`; h.style.left = r.value + '%'; };
      el.querySelector('[data-ca]').onchange = e => { st.a = e.target.value; draw(); }; el.querySelector('[data-cb]').onchange = e => { st.b = e.target.value; draw(); };
      el.querySelectorAll('[data-cv]').forEach(b => b.onclick = () => { st.v = b.dataset.cv; draw(); });
    };
    draw();
  };
  document.addEventListener('click', ev => { const b = ev.target.closest('[data-ej]'); if (b) CS.verEj(b.dataset.ej); });
})();
