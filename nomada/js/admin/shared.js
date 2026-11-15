// Piezas compartidas del panel: escáner de QR, etiquetas, plantilla de mensaje.
import { h, $, modal, toast, MESES, esc, phonePretty } from '../util.js';
import { icon } from '../icons.js';

export const ORIGENES = { juego: 'Minijuego', menu: 'Menú QR', landing: 'Landing', mesero: 'Mesero' };
export const BEBIDAS = { cerveza: 'Cerveza', coctel: 'Cóctel', vino: 'Vino', sinalcohol: 'Sin alcohol' };
export const CATEGORIAS = [['entradas', 'Entradas'], ['fuertes', 'Fuertes'], ['postres', 'Postres'], ['cocteleria', 'Coctelería'], ['cervezas', 'Cervezas'], ['vinos', 'Vinos'], ['sinalcohol', 'Sin alcohol']];
export const ETIQUETAS = [['temporada', 'De temporada'], ['chef', 'Recomendado del chef'], ['recomendado', 'Recomendado'], ['picante', 'Picante'], ['vegetariano', 'Vegetariano'], ['singluten', 'Sin gluten']];

export const nivelTag = m => h('span', { class: 'tag accent' }, m.nivelNombre);
export const cumpleTxt = m => `${m.cumple.dia} ${MESES[m.cumple.mes - 1]}`;
export const fillTpl = (tpl, m) => tpl.replace(/\[nombre\]/gi, String(m.nombre).split(' ')[0]);

/** Abre la cámara y decodifica QR con jsQR (local). cb(texto) al detectar. */
export async function openScanner(cb) {
  const video = h('video', { playsinline: true, muted: true, autoplay: true });
  const box = h('div', { class: 'stack' }, h('div', { class: 'scan-view' }, video, h('div', { class: 'frame' })),
    h('p', { class: 'hint', id: 'scan-msg' }, 'Apunta al QR del pasaporte del cliente.'),
    h('div', { class: 'field' }, h('label', {}, 'O escribe el código'), h('input', { class: 'input', id: 'scan-manual', placeholder: 'NOM-0001' })),
    h('button', { class: 'btn block', onclick: () => { const v = $('#scan-manual').value.trim(); if (v) { stop(); m.close(); cb(v); } } }, 'Usar código'));
  let stream, raf, stopped = false;
  const stop = () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()); };
  const m = modal(box, { title: 'Escanear QR', onClose: stop });
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream; await video.play();
    const cv = document.createElement('canvas'), g = cv.getContext('2d', { willReadFrequently: true });
    let n = 0;
    const tick = () => {
      if (stopped) return;
      if (video.readyState >= 2 && (n++ % 3 === 0)) {
        cv.width = video.videoWidth; cv.height = video.videoHeight; g.drawImage(video, 0, 0);
        const img = g.getImageData(0, 0, cv.width, cv.height);
        const r = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (r?.data) { stop(); m.close(); cb(r.data); return; }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
  } catch {
    $('#scan-msg').textContent = 'No se pudo abrir la cámara (permiso o dispositivo). Usa la búsqueda o escribe el código.';
    $('.scan-view').style.display = 'none';
  }
}

export const parseCode = txt => String(txt).replace(/^NOMADA:/i, '').trim();
