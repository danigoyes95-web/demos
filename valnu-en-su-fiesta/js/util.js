/* Utilidades compartidas por la landing y el panel (sin acceso a almacenamiento). */

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = (n) => '$' + (Math.round(n * 100) / 100).toLocaleString('es-EC', { minimumFractionDigits: Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2, maximumFractionDigits: 2 });
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/* Paleta de colores disponibles para el armador */
export const COLORS = [
  { n: 'Rosado', h: '#F06FA6' }, { n: 'Fucsia', h: '#C2467A' }, { n: 'Turquesa', h: '#7FD1C7' }, { n: 'Menta', h: '#B7E6D9' },
  { n: 'Lila', h: '#B59BE0' }, { n: 'Azul', h: '#2E5BFF' }, { n: 'Celeste', h: '#9ED8F0' }, { n: 'Amarillo', h: '#F4C95D' },
  { n: 'Naranja', h: '#F28C28' }, { n: 'Rojo', h: '#C2123C' }, { n: 'Verde limón', h: '#A6D930' }, { n: 'Negro', h: '#2B2B3A' },
  { n: 'Plateado', h: '#C0C4CC' }, { n: 'Dorado', h: '#E2B94B' }, { n: 'Blanco', h: '#FFFFFF' }, { n: 'Azul marino', h: '#1F3A93' },
];
export const colorName = (h) => COLORS.find((c) => c.n && c.h.toLowerCase() === String(h).toLowerCase())?.n || h;

/* Fechas */
export const fmtDate = (iso, opts = { weekday: 'long', day: 'numeric', month: 'long' }) => (iso ? new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('es-EC', opts) : '—');
export const fmtShort = (iso) => fmtDate(iso, { day: 'numeric', month: 'short' });
export const fmtDateTime = (iso) => new Date(iso).toLocaleString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const timeAgo = (iso) => { const m = Math.round((Date.now() - new Date(iso)) / 60000); if (m < 60) return `hace ${m} min`; if (m < 1440) return `hace ${Math.round(m / 60)} h`; return `hace ${Math.round(m / 1440)} d`; };

/* WhatsApp */
export const waNumber = (n) => { n = String(n || '').replace(/\D/g, ''); if (n.startsWith('0')) n = '593' + n.slice(1); return n; };
export const waLink = (number, text) => `https://wa.me/${waNumber(number)}?text=${encodeURIComponent(text)}`;

/* Estimación de precio (rango, nunca cerrado) */
export function estimate(selected, { guests = 20, place = 'ambato' } = {}, settings = {}) {
  const lines = selected.map((it) => {
    const qty = it.unitGuests ? Math.max(1, Math.ceil(guests / it.unitGuests)) : 1;
    return { itemId: it.id, name: it.name, qty, pmin: it.pmin, pmax: it.pmax, scene: it.scene };
  });
  let min = lines.reduce((s, l) => s + l.pmin * l.qty, 0), max = lines.reduce((s, l) => s + l.pmax * l.qty, 0);
  let travel = null;
  if (place === 'otra' && lines.length) { travel = { min: settings.coverage?.otherFeeMin ?? 10, max: settings.coverage?.otherFeeMax ?? 35 }; min += travel.min; max += travel.max; }
  return { lines, min: Math.round(min), max: Math.round(max), travel };
}
export const rangeText = (min, max) => (!max ? 'A cotizar' : min === max ? `${money(min)}` : `desde ${money(min)} – ${money(max)}`);

/* Mensaje de cotización para WhatsApp (lo comparte la landing y el panel) */
export function quoteMessage(q, code, occasionName) {
  const place = q.place === 'ambato' ? 'Ambato' : q.place === 'retiro' ? 'Retiro en local' : `Otra ciudad${q.city ? ' (' + q.city + ')' : ''}`;
  const lines = q.items.map((l) => `• ${l.name}${l.qty > 1 ? ' x' + l.qty : ''}`).join('\n');
  return [
    `🎈 COTIZACIÓN VALNU #${code}`,
    `Ocasión: ${occasionName || q.occasion}`,
    `Fecha: ${q.eventDate ? fmtDate(q.eventDate) : 'Por definir'}`,
    `Invitados: ${q.guests || 'Por definir'}`,
    `Lugar: ${place}`,
    `Colores: ${(q.colors || []).map(colorName).join(', ') || 'Sorpréndanme'}`,
    `Elementos:\n${lines || '• (por definir)'}`,
    q.honoree ? `Nombre en backdrop: ${q.honoree}` : null,
    q.reference ? `Referencia: ${q.reference.caption || q.reference.photo}` : null,
    `Rango estimado: ${rangeText(q.rangeMin, q.rangeMax)}`,
  ].filter(Boolean).join('\n');
}

/* Comprime una imagen a ≤ maxKB (JPEG) para guardarla en localStorage */
export async function compressImage(file, maxKB = 300) {
  const url = URL.createObjectURL(file);
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  let scale = Math.min(1, 1280 / Math.max(img.width, img.height)), q = 0.86, out = '';
  const c = document.createElement('canvas'), ctx = c.getContext('2d');
  for (let i = 0; i < 12; i++) {
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
    out = c.toDataURL('image/jpeg', q);
    if (out.length * 0.75 <= maxKB * 1024) break;
    q > 0.5 ? (q -= 0.12) : (scale *= 0.8);
  }
  URL.revokeObjectURL(url);
  return { dataUrl: out, kb: Math.round(out.length * 0.75 / 1024) };
}

/* Toast */
export function toast(msg, type = 'ok') {
  let box = $('#toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.append(box); }
  const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg; box.append(t);
  setTimeout(() => t.classList.add('out'), 3200); setTimeout(() => t.remove(), 3600);
}

/* Sonido "pop" sintetizado (Web Audio): sin archivos. Silenciado por defecto. */
let actx = null, soundOn = false;
export const isSoundOn = () => soundOn;
export const setSound = (v) => { soundOn = v; };
export function pop(freq = 520) {
  if (!soundOn) return;
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
    o.type = 'sine'; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.35, t + 0.09);
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.13);
  } catch {}
}

/* Confeti (canvas-confetti vendorizado en js/vendor) */
export function confettiBurst(x = 0.5, y = 0.5, count = 40, colors) {
  if (reducedMotion() || !window.confetti) return;
  window.confetti({ particleCount: count, spread: 70, startVelocity: 28, origin: { x, y }, colors, scalar: 0.9, ticks: 90, disableForReducedMotion: true });
}
