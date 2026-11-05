import { K, rd, wr } from './state.js';
import { icon } from './icons.js';

export const $ = (s, r = document) => r.querySelector(s);
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const vibrate = p => { try { navigator.vibrate && navigator.vibrate(p); } catch { /* sin soporte */ } };

// Sonido de tecla: opcional, silenciado por defecto.
let ctx = null;
export const soundOn = () => rd(K.snd, false);
export const setSound = v => wr(K.snd, v);
export function tick(freq = 920, ms = 28) {
  if (!soundOn()) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq; g.gain.value = .05;
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + ms / 1000);
  } catch { /* sin audio */ }
}

let tt;
export function toast(msg, o = {}) {
  const el = $('#toast');
  el.innerHTML = `<div><span>${msg}</span>${o.label ? `<button type="button" class="act">${esc(o.label)}</button>` : ''}<button type="button" class="q" aria-label="Cerrar">${icon('close', 18)}</button></div>`;
  const hide = () => el.classList.remove('show');
  el.querySelector('.q').onclick = hide;
  const a = el.querySelector('.act');
  if (a) a.onclick = () => { hide(); o.onAction && o.onAction(); };
  el.classList.add('show');
  clearTimeout(tt); tt = setTimeout(hide, o.ms || 2200);
}

export const hideToast = () => { const el = $('#toast'); if (el) el.classList.remove('show'); };
