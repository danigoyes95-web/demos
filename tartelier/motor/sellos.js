/* Ruta de sellos · pasarela de sellos coleccionables (complemento de la landing, sin base de datos).
   Lee SELLOS (landing.sellos de cliente.json) y pinta, dentro de #ruta, una fila de sellos que se desliza con el dedo (scroll-snap), la ficha del sello
   que queda al centro y el pasaporte (cuántos lleva el cliente). Los sellos se guardan solo en el navegador (localStorage, con try/catch).
   NO otorga premios ni saldo: es un recuerdo de marca. Lo que sí otorga valor (puntos, canjes) es el módulo de fidelización con QR, validado en SQL. */
(function () {
  const S = window.SELLOS, raiz = document.getElementById('ruta');
  if (!S || !raiz || !S.items || !S.items.length) return;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pend = s => esc(s).replace(/\[(?:CONFIRMAR|MARCADOR)[^\]]*\]/g, m => `<span class="pend">${m}</span>`);   // el dato por confirmar se ve marcado en la demo
  const clave = 'sellos_' + ((window.DEMO && DEMO.claveDemo) || 'demo');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let guardados = {};
  try { guardados = JSON.parse(localStorage.getItem(clave) || '{}') || {}; } catch (e) { guardados = {}; }
  const guardar = () => { try { localStorage.setItem(clave, JSON.stringify(guardados)); } catch (e) { /* sin almacenamiento: queda solo en esta visita */ } };
  const fecha = ms => new Date(ms).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
  const total = S.items.length;
  let activo = 0;

  /* El sello es un dibujo SVG: aro punteado, texto en arco (marca arriba, lugar abajo) y la foto del sabor al centro. */
  function sello(it, i) {
    const a = 'sa' + i, b = 'sb' + i, c = 'sc' + i;
    const marca = esc((S.marca || 'Tartelier') + ' · ' + (it.tipo || '')).toUpperCase();
    return `<svg class="sello-svg" viewBox="0 0 200 200" role="img" aria-hidden="true">
      <defs><path id="${a}" d="M 28,100 A 72,72 0 0 1 172,100"/><path id="${b}" d="M 19,100 A 81,81 0 0 0 181,100"/><clipPath id="${c}"><circle cx="100" cy="100" r="58"/></clipPath></defs>
      <circle class="s-fondo" cx="100" cy="100" r="98"/><circle class="s-puntos" cx="100" cy="100" r="96"/><circle class="s-aro" cx="100" cy="100" r="89"/><circle class="s-aro fino" cx="100" cy="100" r="64"/>
      <text class="s-txt" font-size="12.5"><textPath href="#${a}" startOffset="50%" text-anchor="middle">${marca}</textPath></text>
      <text class="s-txt lugar" font-size="15"><textPath href="#${b}" startOffset="50%" text-anchor="middle">${esc(it.corto || it.lugar).toUpperCase()}</textPath></text>
      <text class="s-est" x="13" y="105" font-size="13" text-anchor="middle">✦</text><text class="s-est" x="187" y="105" font-size="13" text-anchor="middle">✦</text>
      <image href="${esc(it.foto.src)}" x="42" y="42" width="116" height="116" preserveAspectRatio="xMidYMid slice" clip-path="url(#${c})"/>
    </svg>`;
  }

  raiz.innerHTML = `
    <div class="ruta-marco">
      <button type="button" class="ruta-flecha ant" aria-label="Sello anterior">‹</button>
      <div class="ruta-pista" tabindex="-1"><div class="ruta-fila" role="list">
        ${S.items.map((it, i) => `<div class="ruta-item" role="listitem"><button type="button" class="ruta-sello" data-i="${i}" style="--giro:${[-5, 4, -3, 6, -6, 3][i % 6]}deg">
          <span class="sello-caja">${sello(it, i)}<span class="sello-fecha" aria-hidden="true"></span></span>
          <span class="ruta-nombre">${esc(it.lugar)}</span></button></div>`).join('')}
      </div></div>
      <button type="button" class="ruta-flecha sig" aria-label="Sello siguiente">›</button>
    </div>
    <div class="wrap ruta-bajo">
      <article class="ruta-ficha" aria-live="polite"></article>
      <aside class="pasaporte" aria-label="${esc(S.pasaporte.titulo)}">
        <h3>${esc(S.pasaporte.titulo)}</h3>
        <p class="pas-cuenta"></p>
        <ul class="pas-puntos" aria-hidden="true">${S.items.map((it, i) => `<li data-i="${i}"></li>`).join('')}</ul>
        <div class="pas-completo" hidden><p>${esc(S.pasaporte.completo)}</p><a class="btn" target="_blank" rel="noopener" data-wa-fin>${esc(S.pasaporte.cta_completo)}</a></div>
      </aside>
    </div>`;

  const pista = raiz.querySelector('.ruta-pista'), botones = [...raiz.querySelectorAll('.ruta-sello')], ficha = raiz.querySelector('.ruta-ficha');
  const wa = t => `https://wa.me/${String((window.DEMO && DEMO.waCliente) || '').replace(/\D/g, '')}?text=${encodeURIComponent(t)}`;

  function pintarFicha() {
    const it = S.items[activo], ok = !!guardados[it.id];
    const mapa = it.mapa ? `<a class="btn btn-linea" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(it.mapa)}">${esc(S.cta_mapa)}</a>` : '';
    ficha.innerHTML = `
      <p class="ficha-etiqueta"><span>${esc(it.tipo)}</span>${it.ejemplo ? `<span class="ficha-ej">${esc(S.ejemplo || 'Ejemplo')}</span>` : ''}</p>
      <h3>${esc(it.lugar)}</h3>
      <p class="ficha-sabor"><b>${esc(S.rotulo_sabor)}</b> ${esc(it.sabor)}</p>
      <p>${pend(it.texto)}</p>
      <p class="ficha-cuando">${pend(it.cuando)}</p>
      <div class="acciones">
        <button type="button" class="btn ficha-sellar" aria-pressed="${ok}">${esc(ok ? S.cta_sellado : S.cta_sellar)}</button>
        ${mapa}<a class="btn btn-linea" target="_blank" rel="noopener" href="${wa(S.wa_pregunta.replace('{lugar}', it.lugar))}">${esc(S.cta_wa)}</a>
      </div>`;
    ficha.querySelector('.ficha-sellar').addEventListener('click', () => alternar(activo));
  }

  function pintarPasaporte() {
    const n = S.items.filter(it => guardados[it.id]).length;
    raiz.querySelector('.pas-cuenta').innerHTML = `<b>${n}</b> ${esc(S.pasaporte.de)} ${total} ${esc(S.pasaporte.contador)}`;
    raiz.querySelectorAll('.pas-puntos li').forEach((li, i) => li.classList.toggle('lleno', !!guardados[S.items[i].id]));
    const fin = raiz.querySelector('.pas-completo'); fin.hidden = n < total;
    fin.querySelector('[data-wa-fin]').href = wa(S.pasaporte.wa_completo);
  }

  function pintarSellos(recien) {
    botones.forEach((b, i) => {
      const it = S.items[i], ok = !!guardados[it.id];
      b.classList.toggle('sellado', ok); b.classList.toggle('activo', i === activo);
      b.setAttribute('aria-label', `${it.lugar}: ${it.sabor}. ${ok ? 'Sellado' : 'Sin sellar'}`);
      b.setAttribute('aria-current', i === activo ? 'true' : 'false');
      b.querySelector('.sello-fecha').textContent = ok ? fecha(guardados[it.id]) : '';
      if (recien === i) { b.classList.remove('recien'); void b.offsetWidth; b.classList.add('recien'); }
    });
  }

  function alternar(i) {
    const id = S.items[i].id;
    if (guardados[id]) delete guardados[id]; else guardados[id] = Date.now();
    guardar(); pintarSellos(guardados[id] ? i : -1); pintarFicha(); pintarPasaporte();
  }

  function ir(i, suave) {
    i = Math.max(0, Math.min(total - 1, i));
    const b = botones[i], dx = b.getBoundingClientRect().left + b.offsetWidth / 2 - (pista.getBoundingClientRect().left + pista.clientWidth / 2);
    pista.scrollBy({ left: dx, behavior: suave && !reducido ? 'smooth' : 'auto' });
    elegir(i);
  }
  function elegir(i) { if (i === activo) return; activo = i; pintarSellos(-1); pintarFicha(); }

  /* Al deslizar, el sello más cercano al centro pasa a ser el activo (se agranda; los demás se alejan, como en una pasarela). */
  let tic = 0;
  pista.addEventListener('scroll', () => {
    cancelAnimationFrame(tic);
    tic = requestAnimationFrame(() => {
      const centro = pista.getBoundingClientRect().left + pista.clientWidth / 2;
      let mejor = 0, dist = 1e9;
      botones.forEach((b, i) => { const d = Math.abs(b.getBoundingClientRect().left + b.offsetWidth / 2 - centro); if (d < dist) { dist = d; mejor = i; } });
      elegir(mejor);
    });
  }, { passive: true });
  botones.forEach((b, i) => b.addEventListener('click', () => (i === activo ? (guardados[S.items[i].id] || alternar(i)) : ir(i, true))));
  raiz.querySelector('.ant').addEventListener('click', () => ir(activo - 1, true));
  raiz.querySelector('.sig').addEventListener('click', () => ir(activo + 1, true));
  raiz.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { ir(activo + 1, true); e.preventDefault(); } else if (e.key === 'ArrowLeft') { ir(activo - 1, true); e.preventDefault(); }
  });

  pintarSellos(-1); pintarFicha(); pintarPasaporte();
  requestAnimationFrame(() => ir(0, false));
})();
