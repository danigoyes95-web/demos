/* gym-ui.js · ayudas de pantalla compartidas por las páginas del gimnasio: textos seguros, fechas en hora de Guayaquil, avisos, QR y cuenta regresiva.
   Todo texto que llega de la base pasa por esc() antes de ir a innerHTML. */
(() => {
  const TZ = 'America/Guayaquil';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hora = t => new Date(t).toLocaleTimeString('es-EC', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
  const dia = t => new Date(t).toLocaleDateString('en-CA', { timeZone: TZ });
  const hoy = () => dia(Date.now());
  const sumaDias = (d, n) => dia(new Date(d + 'T12:00:00-05:00').getTime() + n * 864e5);
  const dowCorto = d => new Date(d + 'T12:00:00-05:00').toLocaleDateString('es-EC', { timeZone: TZ, weekday: 'short' }).replace('.', '');
  const diaNum = d => d.slice(8);
  const dowN = d => { const x = new Date(d + 'T12:00:00-05:00').getUTCDay(); return x === 0 ? 7 : x; };
  const lunes = d => sumaDias(d, 1 - dowN(d));
  const diaLargo = t => { const s = new Date(t).toLocaleDateString('es-EC', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'short' }); return s.charAt(0).toUpperCase() + s.slice(1); };
  const fechaLarga = d => new Date(d + 'T12:00:00-05:00').toLocaleDateString('es-EC', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });
  const cuando = t => { const s = new Date(t), h = (Date.now() - s) / 36e5; if (h < 1) return 'Hace ' + Math.max(1, Math.round(h * 60)) + ' min'; if (dia(t) === hoy()) return 'Hoy ' + hora(t); if (dia(t) === sumaDias(hoy(), -1)) return 'Ayer ' + hora(t);
    return s.toLocaleDateString('es-EC', { timeZone: TZ, day: 'numeric', month: 'short' }); };
  const primer = n => String(n || '').split(' ')[0];
  const plata = n => '$' + Number(n).toFixed(2).replace(/\.00$/, '');
  const tel = t => { const d = String(t || '').replace(/\D/g, ''); return /^593\d{9}$/.test(d) ? '0' + d.slice(3, 5) + ' ' + d.slice(5, 8) + ' ' + d.slice(8) : t; };
  const iniciales = n => String(n || '').split(' ').slice(0, 2).map(x => x[0]).join('').toUpperCase();

  function aviso(msg, tipo) {
    let c = document.getElementById('gym-avisos'); if (!c) { c = document.createElement('div'); c.id = 'gym-avisos'; c.setAttribute('role', 'status'); c.setAttribute('aria-live', 'polite'); document.body.append(c); }
    const a = document.createElement('div'); a.className = 'gym-aviso ' + (tipo || ''); a.textContent = msg; c.append(a);
    setTimeout(() => { a.classList.add('sale'); setTimeout(() => a.remove(), 300); }, tipo === 'err' ? 5200 : 3200);
  }
  /* Ejecuta una acción de la base con el botón bloqueado y el error a la vista. */
  async function accion(boton, fn, ok) {
    if (boton) { boton.disabled = true; boton.dataset.t = boton.textContent; }
    try { const r = await fn(); if (ok) aviso(typeof ok === 'function' ? ok(r) : ok, 'ok'); return r; }
    catch (e) { aviso(e.message || 'No se pudo completar la acción.', 'err'); return undefined; }
    finally { if (boton && boton.isConnected) boton.disabled = false; }
  }

  /* QR: usa qrcode-generator si cargó (CDN permitido); si no, un dibujo de respaldo que no escanea. */
  function qr(texto, px = 200) {
    try { if (window.qrcode) { const q = window.qrcode(0, 'M'); q.addData(texto); q.make(); return `<img class="gym-qr" alt="Código QR de tu tarjeta" width="${px}" height="${px}" src="${q.createDataURL(6, 2)}">`; } } catch (e) {}
    let c = ''; const n = 21; let s = 1; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { s = (s * 48271 + y * 7 + x) % 2147483647; const esq = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13); if (esq ? (x % 6 === 0 || y % 6 === 0 || x % 6 === 6 || (x % 14 > 1 && x % 14 < 5 && y % 14 > 1 && y % 14 < 5)) : s % 3 === 0) c += `<rect x="${x}" y="${y}" width="1" height="1"/>`; }
    return `<svg class="gym-qr" role="img" aria-label="Código QR de tu tarjeta (dibujo de respaldo)" width="${px}" height="${px}" viewBox="0 0 ${n} ${n}" fill="currentColor">${c}</svg>`;
  }
  const estrella = '<svg class="g-st" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.4 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9z"/></svg>';
  const wa = (texto, evento) => { window.GYM && GYM.evento('click_whatsapp', { origen: evento || 'gimnasio' }); return GYM.wa(texto); };
  /* Imagen que puede venir de una ruta de Storage (se firma al pintar): <img data-foto="ruta" data-tipo="progreso"> */
  function pintarFotos(raiz) { (raiz || document).querySelectorAll('img[data-foto]').forEach(async im => { const p = im.dataset.foto; delete im.dataset.foto; try { im.src = await GYM.urlFoto(p, im.dataset.tipo); } catch (e) { im.alt = 'Foto no disponible'; } }); }
  const img = (path, tipo, alt) => `<img data-foto="${esc(path)}" data-tipo="${tipo || ''}" alt="${esc(alt || '')}" loading="lazy">`;

  /* Tarjeta de una clase (landing y tarjeta de la socia). ctx = { pro, sede(id) → nombre, wa(c) → enlace, mostrarDia } */
  function claseHTML(c, ctx) {
    const mi = ctx.pro && c.mi_reserva, pasada = new Date(c.inicio) < Date.now(), llena = c.ocupados >= c.cupos, libres = c.cupos - c.ocupados, casi = !llena && libres <= 3;
    const cupos = ctx.pro ? `<div class="g-cupos ${llena ? 'llena' : casi ? 'casi' : ''}"><div class="fx-barra"><i style="--w:${Math.min(1, c.ocupados / c.cupos).toFixed(2)}"></i></div><span>${llena ? 'Llena' + (c.en_espera ? ` · ${c.en_espera} en espera` : '') : libres === 1 ? 'Queda 1 cupo' : `Quedan ${libres} cupos`}</span></div>` : '';
    let acc;
    if (pasada) acc = '<span class="g-chip suave">Ya empezó</span>';
    else if (!ctx.pro) acc = `<a class="g-btn peq" href="${esc(ctx.wa(c))}" target="_blank" rel="noopener">Reservar por WhatsApp</a>`;
    else if (mi && mi.estado === 'espera') acc = `<span class="g-chip aviso">En lista de espera</span><button class="g-btn peq sec" data-cancelar="${mi.id}" data-clase="${c.id}" type="button">Salir de la lista</button>`;
    else if (mi) acc = `<span class="g-chip ok">Reservada ✓</span><button class="g-btn peq sec" data-cancelar="${mi.id}" data-clase="${c.id}" type="button">Cancelar</button>`;
    else acc = `<button class="g-btn peq" data-reservar="${c.id}" type="button">${llena ? 'Entrar a la lista de espera' : 'Reservar'}</button>`;
    return `<article class="g-clase${mi ? ' mia' : ''}${pasada ? ' pasada' : ''}"><div class="g-hora">${hora(c.inicio)}<small>${ctx.mostrarDia ? esc(diaCorto(c.inicio)) : c.duracion_min + ' min'}</small></div>
      <div><h4>${esc(c.tipo_nombre)}</h4><p>${esc(c.coach || '')} · ${esc(ctx.sede(c.sede_id))}</p>${cupos}</div><div class="acc">${acc}</div></article>`;
  }
  const diaCorto = t => { const s = new Date(t).toLocaleDateString('es-EC', { timeZone: TZ, weekday: 'short', day: 'numeric' }).replace('.', ''); return s.charAt(0).toUpperCase() + s.slice(1); };

  window.GU = { lunes, dowN, claseHTML, diaCorto, esc, hora, dia, hoy, sumaDias, dowCorto, diaNum, diaLargo, fechaLarga, cuando, primer, plata, tel, iniciales, aviso, accion, qr, estrella, wa, pintarFotos, img, TZ };
})();
