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
  /* comparador antes/después con deslizador, por vista (frente · lateral · espalda) */
  CS.comparador = async (el, cid, coach) => {
    el.innerHTML = '<p style="color:var(--mut)">Cargando fotos…</p>'; let L;
    try { L = await CS.Store.fotos.lista(cid, coach); } catch (e) { el.innerHTML = '<p class="bad">No se pudieron cargar las fotos.</p>'; return; }
    const fechas = [...new Set(L.map(x => x.f))].sort();
    if (fechas.length < 2) { el.innerHTML = `<p style="color:var(--mut)">${fechas.length ? 'Falta un segundo check-in para poder comparar.' : 'Aún no hay fotos de check-in.'}</p>`; return; }
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
