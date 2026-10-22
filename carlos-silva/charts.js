/* Gráficos SVG de marca (sin librerías): anillo, donut, tendencia, barras, barras horizontales, contador animado. */
(() => {
  let uid = 0; const RM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CH = {
    /* anillo de progreso 0-100 con brillo */
    anillo(pct, o = {}) { const s = o.size || 132, w = o.w || 12, r = (s - w) / 2, L = 2 * Math.PI * r, p = Math.max(0, Math.min(100, pct || 0)), id = 'g' + (++uid), c = o.color || '#19e3ee';
      return `<svg viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" role="img" aria-label="${esc(o.aria || (Math.round(p) + '%'))}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${o.color2 || '#3ddc97'}"/></linearGradient><filter id="${id}f" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter></defs>
        <circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="#ffffff12" stroke-width="${w}"/>
        <circle class="arc" cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}" opacity=".55" filter="url(#${id}f)" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - p / 100)}" transform="rotate(-90 ${s / 2} ${s / 2})" style="--L:${L}"/>
        <circle class="arc" cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - p / 100)}" transform="rotate(-90 ${s / 2} ${s / 2})" style="--L:${L}"/>
        <text x="50%" y="${o.sub ? '48%' : '52%'}" text-anchor="middle" dominant-baseline="middle" fill="#eaf6f8" font-family="Orbitron,Outfit,sans-serif" font-weight="900" font-size="${s * 0.24}">${esc(o.centro ?? Math.round(p) + '%')}</text>${o.sub ? `<text x="50%" y="66%" text-anchor="middle" fill="#8fb0b8" font-size="${s * 0.095}">${esc(o.sub)}</text>` : ''}</svg>`; },
    /* donut con leyenda opcional */
    donut(seg, o = {}) { const s = o.size || 140, w = o.w || 20, r = (s - w) / 2, L = 2 * Math.PI * r, tot = seg.reduce((a, x) => a + x.v, 0) || 1; let acc = 0;
      const arcs = seg.map(x => { const len = x.v / tot * L, g = Math.min(3, len * .15), a = `<circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="${x.color}" stroke-width="${w}" stroke-dasharray="${Math.max(0, len - g)} ${L}" stroke-dashoffset="${-acc}" transform="rotate(-90 ${s / 2} ${s / 2})"/>`; acc += len; return a; }).join('');
      return `<svg viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" role="img" aria-label="${esc(o.aria || '')}"><circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="#ffffff10" stroke-width="${w}"/><g class="dn">${arcs}</g>
        ${o.centro != null ? `<text x="50%" y="${o.sub ? '47%' : '52%'}" text-anchor="middle" dominant-baseline="middle" fill="#eaf6f8" font-family="Orbitron,Outfit,sans-serif" font-weight="900" font-size="${s * 0.21}">${esc(o.centro)}</text>` : ''}${o.sub ? `<text x="50%" y="64%" text-anchor="middle" fill="#8fb0b8" font-size="${s * 0.09}">${esc(o.sub)}</text>` : ''}</svg>`; },
    /* línea de tendencia con área */
    spark(vals, o = {}) { const w = o.w || 120, h = o.h || 36, c = o.color || '#19e3ee', id = 'g' + (++uid), v = vals.filter(x => x != null && !isNaN(x));
      if (v.length < 2) return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="#ffffff22" stroke-dasharray="3 4"/></svg>`;
      const mn = Math.min(...v), mx = Math.max(...v), P = 4, pt = v.map((x, i) => [P + (w - 2 * P) * i / (v.length - 1), h - P - (h - 2 * P) * ((x - mn) / ((mx - mn) || 1))]), d = pt.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' '), l = pt.at(-1);
      return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".4"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${l[0]} ${h} L${pt[0][0]} ${h}Z" fill="url(#${id})"/><path class="ln" d="${d}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/><circle cx="${l[0]}" cy="${l[1]}" r="3.6" fill="${c}"/><circle cx="${l[0]}" cy="${l[1]}" r="7" fill="${c}" opacity=".25"/></svg>`; },
    /* barras verticales */
    barras(vals, o = {}) { const w = o.w || 320, h = o.h || 120, n = vals.length, gap = 6, bw = (w - gap * (n - 1)) / n, mx = o.max || Math.max(...vals, 1), c = o.color || '#19e3ee', lab = o.labels || [];
      return `<svg viewBox="0 0 ${w} ${h + (lab.length ? 18 : 0)}" width="100%" role="img" aria-label="${esc(o.aria || '')}" preserveAspectRatio="xMidYMid meet">${vals.map((v, i) => { const bh = Math.max(v ? 4 : 2, (h - 6) * v / mx), x = i * (bw + gap), hi = o.hoy === i;
        return `<rect class="cbar" x="${x}" y="${h - bh}" width="${bw}" height="${bh}" rx="${Math.min(6, bw / 2)}" fill="${v ? (hi ? '#3ddc97' : c) : '#ffffff14'}" ${v ? `style="filter:drop-shadow(0 0 6px ${hi ? '#3ddc97' : c}88);animation-delay:${i * 40}ms"` : ''}><title>${esc((lab[i] || '') + ': ' + v)}</title></rect>${lab[i] ? `<text x="${x + bw / 2}" y="${h + 14}" text-anchor="middle" fill="${hi ? '#eaf6f8' : '#8fb0b8'}" font-size="10">${esc(lab[i])}</text>` : ''}`; }).join('')}</svg>`; },
    /* barras horizontales (ranking) en HTML */
    hbar(items) { return items.map((x, i) => `<div class="hb"><div class="hb-t"><span>${x.pre || ''}${esc(x.label)}</span><b>${esc(x.txt ?? Math.round(x.v) + '%')}</b></div><div class="hb-b"><i style="--w:${Math.max(2, Math.min(100, x.v))}%;background:${x.color || 'linear-gradient(90deg,#0aa9b8,#19e3ee)'};animation-delay:${i * 80}ms"></i></div></div>`).join(''); },
    /* cuenta animada de [data-count] */
    contar(root) { (root || document).querySelectorAll('[data-count]').forEach(e => { const to = parseFloat(e.dataset.count), dec = +(e.dataset.dec || 0), suf = e.dataset.suf || '';
      const pre = e.dataset.pre || '', set = v => e.textContent = pre + (dec ? v.toFixed(dec).replace('.', ',') : Math.round(v)) + suf; if (RM() || isNaN(to)) { set(to); return; }
      const t0 = performance.now(), D = 900; const f = t => { const k = Math.min(1, (t - t0) / D), ease = 1 - Math.pow(1 - k, 3); set(to * ease); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }); }
  };
  window.CH = CH;
})();
