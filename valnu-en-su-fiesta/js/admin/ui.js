/* Piezas de interfaz compartidas por las vistas del panel. */
import { esc, $, $$, toast } from '../util.js';
import { resetDemo } from '../data.js';

export const STATUS = {
  new: { n: 'Nueva', c: '#9B7BD6' }, quoted: { n: 'Cotizada', c: '#D9961A' }, deposit: { n: 'Anticipo pagado', c: '#2A9488' },
  done: { n: 'Realizada', c: '#6B7A99' }, lost: { n: 'Perdida', c: '#C23A4B' },
};
export const STATUS_ORDER = ['new', 'quoted', 'deposit', 'done', 'lost'];
export const LOST_REASONS = ['Precio', 'Eligió otra empresa', 'Cambió la fecha', 'Fecha ocupada', 'No respondió', 'Otro'];
export const badge = (s) => `<span class="badge" style="--bc:${STATUS[s].c}">${STATUS[s].n}</span>`;
export const amountOf = (q) => q.finalTotal ?? Math.round((q.rangeMin + q.rangeMax) / 2);

export function openModal(html, { wide = false, onClose } = {}) {
  const el = document.createElement('div'); el.className = 'amodal';
  el.innerHTML = `<div class="asheet ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><button class="ax" aria-label="Cerrar">×</button>${html}</div>`;
  document.body.append(el); document.body.classList.add('noscroll');
  let closed = false;
  const close = () => { if (closed) return; closed = true; el.remove(); if (!$('.amodal')) document.body.classList.remove('noscroll'); onClose?.(); };
  el.addEventListener('mousedown', (e) => { if (e.target === el) close(); });
  el.querySelector('.ax').onclick = close;
  return { el, close, $: (s) => el.querySelector(s), $$: (s) => [...el.querySelectorAll(s)] };
}
export function confirmBox(msg, ok = 'Confirmar', danger = false) {
  return new Promise((res) => {
    let answered = false;
    const m = openModal(`<p style="font-size:1.05rem;margin:6px 28px 18px 0">${msg}</p><div class="row end"><button class="btn ghost" data-n>Cancelar</button><button class="btn ${danger ? 'danger' : 'primary'}" data-y>${ok}</button></div>`, { onClose: () => { if (!answered) res(false); } });
    m.$('[data-n]').onclick = () => m.close();
    m.$('[data-y]').onclick = () => { answered = true; res(true); m.close(); };
  });
}
/** Enlaza inputs [data-path="a.b.0.c"] con un objeto; escribe valores en vivo. */
export function bind(root, obj, onChange) {
  const set = (path, v) => { const k = path.split('.'); let o = obj; for (let i = 0; i < k.length - 1; i++) o = o[k[i]]; o[k.at(-1)] = v; };
  const get = (path) => path.split('.').reduce((o, k) => o?.[k], obj);
  $$('[data-path]', root).forEach((i) => {
    const p = i.dataset.path, v = get(p);
    if (i.type === 'checkbox') i.checked = !!v;
    else if (i.dataset.lines) i.value = (v || []).join('\n');
    else if (i.dataset.csv) i.value = (v || []).join(', ');
    else i.value = v ?? '';
    const h = () => {
      let val = i.type === 'checkbox' ? i.checked : i.type === 'number' || i.type === 'range' ? (i.value === '' ? 0 : Number(i.value)) : i.value;
      if (i.dataset.lines) val = i.value.split('\n').map((x) => x.trim()).filter(Boolean);
      if (i.dataset.csv) val = i.value.split(',').map((x) => x.trim()).filter(Boolean);
      set(p, val); onChange?.(p, val);
    };
    i.addEventListener('input', h); i.addEventListener('change', h);
  });
}
export const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const asrc = (p) => (!p ? '' : /^(data:|https?:|\/)/.test(p) ? p : '../' + p);
export const thumb = (src, emoji = '🖼️') => (src ? `<span class="th" style="background-image:url('${esc(asrc(src))}')"></span>` : `<span class="th ph">${emoji}</span>`);
export const dl = (rows) => `<dl class="dl">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v ?? '—'}</dd></div>`).join('')}</dl>`;
export const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };

export async function doReset() {
  if (!(await confirmBox('Esto borra todos los cambios y deja el demo como al inicio (datos semilla). ¿Reiniciar?', 'Reiniciar demo', true))) return;
  await resetDemo(); toast('Demo reiniciado ✔'); setTimeout(() => { location.hash = '#/inicio'; location.reload(); }, 500);
}
