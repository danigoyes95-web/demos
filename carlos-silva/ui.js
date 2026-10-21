/* Ficha de ejercicio con animación (compartida por panel y portal del cliente). */
(() => {
  const { esc } = CS; let stop = () => {};
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
  document.addEventListener('click', ev => { const b = ev.target.closest('[data-ej]'); if (b) CS.verEj(b.dataset.ej); });
})();
