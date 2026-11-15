// Utilidades compartidas (DOM, fechas, formato, WhatsApp, toasts, modales). Sin dependencias.

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) {
    if (k == null || k === false) continue;
    if (k.nodeType) e.append(k);
    else if (typeof k === 'string' && k.includes('<svg')) e.insertAdjacentHTML('beforeend', k);   // íconos inline
    else e.append(document.createTextNode(k));
  }
  return e;
}

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Formato ----------
export const money = n => '$' + (Number.isInteger(+n) ? (+n) : (+n).toFixed(2));
export const money0 = n => '$' + Math.round(+n).toLocaleString('es-EC');
export const pad = (n, l = 2) => String(n).padStart(l, '0');
export const firstName = n => String(n || '').trim().split(/\s+/)[0] || '';
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const MESES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const DIAS_C = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
export const fDate = (iso, o = {}) => { const d = new Date(iso); return `${d.getDate()} ${MESES_C[d.getMonth()]}${o.year ? ' ' + d.getFullYear() : ''}`; };
export const fDateLong = iso => { const d = new Date(iso); return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`; };
export const fTime = iso => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
export const fDateTime = iso => `${fDate(iso)} · ${fTime(iso)}`;
export const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------- Fechas ----------
export const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const endOfDay = d => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 864e5);
export const mondayOf = d => { const x = startOfDay(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
export const toInputDate = d => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
export const fromInputDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

// ---------- Teléfono / WhatsApp ----------
export const digits = s => String(s || '').replace(/\D/g, '');
export function phoneEC(s) {            // 0991234567 → 593991234567
  let d = digits(s);
  if (d.startsWith('593')) return d;
  if (d.startsWith('0')) d = d.slice(1);
  return '593' + d;
}
export const phoneValid = s => /^0?9\d{8}$/.test(digits(s).replace(/^593/, '0'));
export const phonePretty = s => { const d = digits(s).replace(/^593/, '0'); return d.length === 10 ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : s; };
export const waLink = (numero, texto) => `https://wa.me/${digits(numero)}${texto ? '?text=' + encodeURIComponent(texto) : ''}`;

// ---------- Descargas ----------
export function download(name, content, type = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
export const csvCell = v => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
export const toCSV = (rows) => '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\n');

// ---------- UI: toast y modal ----------
let toastEl;
export function toast(msg, ms = 2600) {
  if (!toastEl) { toastEl = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.append(toastEl); }
  toastEl.textContent = msg; toastEl.classList.add('on');
  clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('on'), ms);
}

/** Modal genérico. content: Node. Devuelve {close, el}. */
export function modal(content, { title, cls = '', onClose, dismissible = true } = {}) {
  const prev = document.activeElement;
  const back = h('div', { class: 'modal-back' });
  const box = h('div', { class: 'modal ' + cls, role: 'dialog', 'aria-modal': 'true' });
  const close = () => { back.classList.remove('on'); setTimeout(() => back.remove(), 250); document.removeEventListener('keydown', key); prev?.focus?.(); onClose?.(); };
  const key = e => { if (e.key === 'Escape' && dismissible) close(); };
  if (title) box.append(h('div', { class: 'modal-head' }, h('h3', {}, title), dismissible ? h('button', { class: 'icon-btn', 'aria-label': 'Cerrar', onclick: close }, '✕') : null));
  box.append(content);
  back.append(box);
  if (dismissible) back.addEventListener('pointerdown', e => { if (e.target === back) close(); });
  document.body.append(back);
  document.addEventListener('keydown', key);
  requestAnimationFrame(() => back.classList.add('on'));
  setTimeout(() => (box.querySelector('[autofocus]') || box.querySelector('input,select,textarea,button'))?.focus?.({ preventScroll: true }), 120);
  return { close, el: box };
}

export function confirmModal(msg, { ok = 'Confirmar', cancel = 'Cancelar', danger = false } = {}) {
  return new Promise(res => {
    let m; const done = v => { m.close(); res(v); };
    const body = h('div', { class: 'stack' }, h('p', {}, msg),
      h('div', { class: 'row end gap' }, h('button', { class: 'btn ghost', onclick: () => done(false) }, cancel), h('button', { class: 'btn ' + (danger ? 'danger' : 'primary'), onclick: () => done(true) }, ok)));
    m = modal(body, { onClose: () => res(false) });
  });
}

export const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
export const rafThrottle = fn => { let q = false; return (...a) => { if (q) return; q = true; requestAnimationFrame(() => { q = false; fn(...a); }); }; };

/** Ruta base de la demo (carpeta nomada/) calculada desde este módulo. */
export const BASE = new URL('../', import.meta.url).href;
export const url = p => new URL(p, BASE).href;

/** Registra el service worker (solo http/https). */
export function registerSW() {
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register(url('sw.js')).catch(() => { });
}
