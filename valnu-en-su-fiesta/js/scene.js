/* ============================================================
   scene.js — Escena ilustrada (SVG) del armador.
   Se usa en la landing (animada, incremental) y en el panel / captura
   (estática). Todo con transform + opacity para ir a 60 fps en móvil.
   ============================================================ */

export const hex = (h) => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map((x) => x + x).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
export const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
export const lum = (h) => { const [r, g, b] = hex(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
export const normColors = (c = []) => {
  c = c.filter(Boolean).slice(0, 3);
  if (!c.length) c = ['#F06FA6'];
  if (c.length === 1) c = [c[0], mix(c[0], '#ffffff', 0.55), '#ffffff'];
  if (c.length === 2) c = [c[0], c[1], mix(c[0], '#ffffff', 0.6)];
  return c;
};

function theme(s) {
  const c = normColors(s.colors), mood = s.mood || 'pastel';
  const accent = c.find((x) => lum(x) < 0.88) || c[0];
  const wall = mood === 'noche' ? mix(accent, '#1b1530', 0.8) : mood === 'claro' ? '#f9f3ea' : mix(accent, '#ffffff', 0.87);
  const floor = mood === 'noche' ? mix(accent, '#100b20', 0.75) : mood === 'claro' ? '#e6d8c5' : mix(accent, '#efe4d2', 0.82);
  const dark = mood === 'noche';
  return { c, wall, floor, floor2: mix(floor, dark ? '#ffffff' : '#000000', dark ? 0.06 : 0.06), onc1: lum(c[0]) > 0.62 ? '#3a2342' : '#ffffff', ink: dark ? '#ffffff' : '#3a2342', dark };
}
const vars = (t) => `--c1:${t.c[0]};--c2:${t.c[1]};--c3:${t.c[2]};--wall:${t.wall};--floor:${t.floor};--floor2:${t.floor2};--onc1:${t.onc1};--ink:${t.ink}`;

/* ---------------- piezas ---------------- */
const K = ['c1', 'c2', 'cw', 'c3'];
const bal = (x, y, r, k, d = 0, kind = 'pop') => (x = +x, y = +y, r = +r,
  `<g class="bl ${kind}" style="--d:${d}ms"><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${(r * 1.14).toFixed(1)}" class="${k} ol"/><ellipse cx="${(x - r * 0.35).toFixed(1)}" cy="${(y - r * 0.42).toFixed(1)}" rx="${(r * 0.2).toFixed(1)}" ry="${(r * 0.32).toFixed(1)}" fill="#fff" opacity=".45"/><path d="M${x - 2} ${(y + r * 1.14).toFixed(1)}l2 3.4 2-3.4z" class="${k}"/></g>`);
const digits = (s) => (String(s.honoree || '').match(/\d{1,3}/) || [s.occasionId === 'adulto' ? '30' : '5'])[0];
const nameFont = (t) => Math.max(13, Math.min(28, 28 - Math.max(0, t.length - 7) * 1.5));

const L = {
  tent: { z: 4, enter: 'drop', draw: () => {
    let sw = ''; for (let i = 0; i < 10; i++) sw += `<path d="M${i * 40} 26 q20 18 40 0 v-26 h-40z" fill="#fff" opacity="${i % 2 ? 0.96 : 0.82}" class="ol"/>`;
    return `<rect x="0" y="0" width="400" height="28" fill="#fff" opacity=".95"/>${sw}<rect x="6" y="0" width="5" height="210" fill="#e9e4ee"/><rect x="389" y="0" width="5" height="210" fill="#e9e4ee"/>`; } },
  arch: { z: 10, enter: 'none', draw: () => {
    let o = ''; const n = 30;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI * (i / n), x = 200 - 152 * Math.cos(a), y = 218 - 176 * Math.sin(a), r = 10.5 + 2.6 * Math.sin(i * 1.7);
      o += bal(x.toFixed(1), y.toFixed(1), r.toFixed(1), K[(i * 7 + (i >> 2)) % 4], i * 55);
      if (i % 3 === 1) o += bal((x + (i < 15 ? 7 : -7)).toFixed(1), (y - 8).toFixed(1), 6.5, K[(i + 1) % 4], i * 55 + 30);
    } return o; } },
  columns: { z: 12, enter: 'none', draw: () => {
    let o = '';
    [52, 348].forEach((x, s) => {
      for (let i = 0; i < 7; i++) o += bal(x + (i % 2 ? 6 : -6), 214 - i * 17, 12, K[(i + s) % 4], i * 90 + s * 60);
      o += `<g class="bl pop" style="--d:${7 * 90 + s * 60}ms"><ellipse cx="${x}" cy="76" rx="19" ry="21" fill="#fff" fill-opacity=".35" stroke="rgba(0,0,0,.18)" stroke-width=".8"/><circle cx="${x - 6}" cy="72" r="2.2" class="c1"/><circle cx="${x + 5}" cy="80" r="2.2" class="c3"/><circle cx="${x + 2}" cy="68" r="1.8" class="c2"/><circle cx="${x - 3}" cy="84" r="1.8" class="c2"/></g>`;
    });
    return o; } },
  helium: { z: 70, enter: 'none', draw: () => {
    const pts = [[34, 52, 13], [78, 30, 12], [150, 24, 13], [212, 18, 12], [270, 30, 13], [330, 24, 12], [368, 58, 13], [112, 62, 11], [300, 66, 11]];
    return pts.map(([x, y, r], i) => `<path d="M${x} ${y + r * 1.2} q${i % 2 ? 6 : -6} 70 ${(i % 3) * 4 - 4} ${130 - y}" fill="none" stroke="rgba(0,0,0,.22)" stroke-width=".8" class="sw" style="--d:${i * 110}ms"/>` + bal(x, y, r, K[i % 4], i * 110, 'rise')).join(''); } },
  backdrop: { z: 20, enter: 'zoom', draw: (x) => {
    const n = x.honoree || 'Tu nombre';
    return `<rect x="120" y="50" width="160" height="152" rx="12" class="c1 ol" filter="url(#sh)"/><rect x="128" y="58" width="144" height="136" rx="8" fill="none" stroke="var(--onc1)" stroke-opacity=".35" stroke-dasharray="3 4"/>
    <text x="200" y="${n.length > 12 ? 112 : 118}" text-anchor="middle" class="hn" font-size="${nameFont(n)}" fill="var(--onc1)">${esc(n)}</text>
    <text x="200" y="146" text-anchor="middle" font-size="9" letter-spacing="2" fill="var(--onc1)" opacity=".75">¡FELIZ FIESTA!</text>` +
    bal(124, 190, 14, 'c2', 0, 'pop') + bal(140, 198, 10, 'cw', 60, 'pop') + bal(116, 172, 9, 'c3', 100, 'pop') + bal(276, 64, 14, 'c3', 40, 'pop') + bal(262, 54, 10, 'c2', 90, 'pop') + bal(284, 82, 9, 'cw', 130, 'pop'); } },
  neon: { z: 46, enter: 'glow', draw: (x) => `<text x="314" y="58" text-anchor="middle" transform="rotate(8 314 58)" class="hn neon" font-size="19" fill="#fff" stroke="var(--c1)" stroke-width="1.2">${esc((x.honoree || 'Fiesta').slice(0, 10))}</text>` },
  pinata: { z: 48, enter: 'drop', draw: () => {
    let f = ''; for (let i = 0; i < 12; i++) f += `<path d="M${68 + i * 4.6} 52 l-1 11" stroke="${i % 2 ? 'var(--c2)' : 'var(--c3)'}" stroke-width="2.2" stroke-linecap="round"/>`;
    return `<g class="swing"><path d="M82 0 V28" stroke="#8a7a6a" stroke-width="1.2"/><path d="M82 28 l9 12 14 -2 -6 13 8 11 -14 0 -7 12 -7 -12 -14 0 8 -11 -6 -13 14 2z" class="c1 ol"/>${f}<circle cx="82" cy="46" r="3.5" fill="#fff" opacity=".6"/></g>`; } },
  number: { z: 36, enter: 'zoom', draw: (x) => `<text x="312" y="196" text-anchor="middle" font-size="${digits(x).length > 1 ? 104 : 124}" font-weight="700" class="nm c3 ol" stroke-width="2" font-family="Fredoka,ui-rounded,'Arial Rounded MT Bold',sans-serif">${digits(x)}</text><text x="309" y="192" text-anchor="middle" font-size="${digits(x).length > 1 ? 104 : 124}" font-weight="700" class="nm" fill="#fff" opacity=".28" font-family="Fredoka,ui-rounded,'Arial Rounded MT Bold',sans-serif">${digits(x)}</text>` },
  table: { z: 30, enter: 'zoom', draw: () => `<ellipse cx="200" cy="247" rx="78" ry="6" fill="#000" opacity=".12"/><path d="M132 197 h136 l-4 50 q-8 -7 -16 0 t-16 0 t-16 0 t-16 0 t-16 0 t-16 0 t-16 0 t-16 0 z" class="c2 ol"/><rect x="128" y="186" width="144" height="12" rx="4" class="cw ol"/>` },
  sweets: { z: 32, enter: 'zoom', draw: () => {
    const jar = (x, k) => `<rect x="${x}" y="158" width="15" height="28" rx="4" fill="#fff" fill-opacity=".6" stroke="rgba(0,0,0,.2)"/><circle cx="${x + 4}" cy="176" r="3" class="${k[0]}"/><circle cx="${x + 10}" cy="178" r="3" class="${k[1]}"/><circle cx="${x + 7}" cy="170" r="3" class="${k[2]}"/><circle cx="${x + 5}" cy="163" r="2.6" class="${k[1]}"/><rect x="${x - 1}" y="155" width="17" height="4" rx="2" class="c3"/>`;
    return jar(138, ['c1', 'c3', 'c2']) + jar(156, ['c3', 'c1', 'cw']); } },
  cupcakes: { z: 33, enter: 'zoom', draw: () => [[176, 'c1'], [190, 'c3']].map(([x, k], i) => `<path d="M${x - 6} 186 l2 -12 h8 l2 12z" class="cw ol"/><circle cx="${x}" cy="172" r="7" class="${k} ol"/><circle cx="${x}" cy="165" r="4.5" class="${k}"/><circle cx="${x}" cy="160" r="2" class="c2"/>`).join('') },
  cake: { z: 34, enter: 'drop', draw: (x) => { const o = x.keys.has('cake2') ? 38 : 0; return `<g transform="translate(${o} 0)"><rect x="180" y="164" width="44" height="22" rx="3" class="c1 ol"/><rect x="188" y="147" width="28" height="18" rx="3" class="c3 ol"/><path d="M180 168 q4 8 8 0 t8 0 t8 0 t8 0 t8 0 t4 0" fill="#fff" opacity=".85"/><rect x="201" y="136" width="2" height="12" fill="#8a7a6a"/><path d="M202 128 q3 5 0 8 q-3 -3 0 -8z" fill="#ffb02e"/><circle cx="196" cy="150" r="2" class="c2"/><circle cx="208" cy="150" r="2" class="c2"/></g>`; } },
  cake2: { z: 35, enter: 'drop', draw: () => `<rect x="172" y="170" width="60" height="16" rx="3" class="c1 ol"/><rect x="180" y="153" width="44" height="17" rx="3" class="c3 ol"/><rect x="189" y="138" width="26" height="15" rx="3" class="c2 ol"/><path d="M172 174 q5 8 10 0 t10 0 t10 0 t10 0 t10 0 t10 0" fill="#fff" opacity=".85"/><path d="M180 157 q5 7 9 0 t9 0 t9 0 t9 0" fill="#fff" opacity=".85"/><circle cx="202" cy="131" r="4" fill="#ffd45e"/><path d="M202 124 l1.6 4 4 .3 -3 2.6 1 4 -3.6-2.2 -3.6 2.2 1-4 -3-2.6 4-.3z" fill="#ffd45e"/>` },
  snacks: { z: 33, enter: 'zoom', draw: () => `<ellipse cx="246" cy="185" rx="22" ry="5" class="cw ol"/>` + [[236, 'c3'], [244, 'c2'], [252, 'c1'], [240, 'c1'], [249, 'c3']].map(([x, k], i) => `<ellipse cx="${x}" cy="${i > 2 ? 177 : 181}" rx="5.5" ry="4" class="${k} ol"/>`).join('') },
  cart: { z: 50, enter: 'roll', draw: () => {
    let st = ''; for (let i = 0; i < 7; i++) st += `<path d="M${16 + i * 12} 188 h12 l-2 16 h-8z" class="${i % 2 ? 'cw' : 'c1'} ol"/>`;
    const wheel = (x) => `<g class="wh"><circle cx="${x}" cy="260" r="12" fill="#fff" stroke="#3a2342" stroke-width="2.4"/><path d="M${x - 12} 260h24M${x} 248v24M${x - 8.5} 251.5l17 17M${x + 8.5} 251.5l-17 17" stroke="#3a2342" stroke-width="1"/></g>`;
    return `<ellipse cx="56" cy="274" rx="46" ry="5" fill="#000" opacity=".13"/><circle cx="56" cy="170" r="15" class="c2 ol"/><circle cx="48" cy="164" r="9" class="c1" opacity=".7"/><rect x="26" y="186" width="2.5" height="62" fill="#b8aebf"/><rect x="84" y="186" width="2.5" height="62" fill="#b8aebf"/>${st}<path d="M12 190 q44 -26 88 0" fill="none"/><rect x="22" y="212" width="68" height="38" rx="5" class="cw ol"/><rect x="30" y="219" width="22" height="14" rx="2" class="c3" opacity=".8"/><circle cx="72" cy="228" r="5" class="c1"/>${wheel(36)}${wheel(78)}`; } },
  tables: { z: 38, enter: 'zoom', draw: () => `<ellipse cx="354" cy="262" rx="32" ry="5" fill="#000" opacity=".12"/><rect x="351" y="242" width="6" height="20" fill="#6b5b7a"/><ellipse cx="354" cy="240" rx="32" ry="9" class="c2 ol"/><path d="M322 240 q4 22 32 24 q28 -2 32 -24" class="c2 ol" opacity=".92"/><ellipse cx="354" cy="238" rx="12" ry="3.5" class="cw"/><rect x="314" y="236" width="9" height="24" rx="3" fill="#fff" stroke="rgba(0,0,0,.2)"/><rect x="385" y="236" width="9" height="24" rx="3" fill="#fff" stroke="rgba(0,0,0,.2)"/>` },
  cylinders: { z: 37, enter: 'zoom', draw: () => `<ellipse cx="290" cy="252" rx="26" ry="4" fill="#000" opacity=".12"/>` + [[276, 20, 34, 'cw'], [291, 20, 46, 'c1'], [304, 17, 28, 'c3']].map(([x, w, h, k]) => `<rect x="${x - w / 2}" y="${250 - h}" width="${w}" height="${h}" rx="3" class="${k} ol"/><ellipse cx="${x}" cy="${250 - h}" rx="${w / 2}" ry="3" fill="#fff" opacity=".5"/>`).join('') },
  favors: { z: 60, enter: 'zoom', draw: () => [[164, 'c1'], [186, 'c3'], [208, 'c2'], [230, 'c1']].map(([x, k], i) => `<rect x="${x}" y="${272 - (i % 2) * 3}" width="17" height="17" rx="3" class="${k} ol"/><path d="M${x + 8.5} ${272 - (i % 2) * 3}v17M${x} ${280}h17" stroke="#fff" stroke-width="1.6" opacity=".8"/><path d="M${x + 8.5} ${272 - (i % 2) * 3} l-4 -4 M${x + 8.5} ${272 - (i % 2) * 3} l4 -4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`).join('') },
  bouquet: { z: 62, enter: 'zoom', draw: () => {
    let r = ''; [[0, 0], [-13, 6], [13, 6], [-6, -11], [8, -10], [0, 12], [-17, -3], [18, -2]].forEach(([dx, dy], i) => { r += `<circle cx="${126 + dx}" cy="${240 + dy}" r="9" fill="${i % 3 ? '#E84A7A' : '#F2799F'}" stroke="rgba(0,0,0,.18)" stroke-width=".7"/><path d="M${126 + dx - 4} ${240 + dy}q4 -5 8 0" fill="none" stroke="rgba(255,255,255,.7)"/>`; });
    return `<path d="M104 244 l22 44 l22 -44z" class="c2 ol"/><path d="M110 250 l16 34 l16 -34z" class="cw" opacity=".55"/>${r}<path d="M126 275 l-10 12 M126 275 l10 12" stroke="var(--c1)" stroke-width="3" stroke-linecap="round"/><ellipse cx="126" cy="274" rx="6" ry="3" class="c1"/>`; } },
  padrinoBox: { z: 64, enter: 'zoom', draw: () => `<rect x="262" y="266" width="64" height="24" rx="3" fill="#fff" stroke="rgba(0,0,0,.22)"/><path d="M262 266 l8 -22 h52 l4 22z" fill="#fffaf0" stroke="rgba(0,0,0,.22)"/><text x="294" y="256" text-anchor="middle" font-size="7.5" fill="#B8893A" font-weight="600">¿Aceptas ser mi</text><text x="294" y="264" text-anchor="middle" font-size="7.5" fill="#B8893A" font-weight="600">padrino?</text><rect x="272" y="274" width="14" height="13" rx="2" fill="#fff" stroke="rgba(0,0,0,.2)"/><rect x="292" y="273" width="22" height="14" rx="2" fill="#7a3b1d"/><path d="M292 280h22" stroke="#e8c26a"/>` },
  confetti: { z: 90, enter: 'none', draw: () => {
    let o = ''; for (let i = 0; i < 34; i++) { const x = (i * 97) % 400, d = (i * 173) % 3000, k = K[i % 4]; o += `<rect class="cf ${k}" x="${x}" y="-8" width="5" height="9" rx="1" style="--d:${d}ms;--dx:${(i % 5) * 6 - 12}px"/>`; } return o; } },
};
const IMPLICIT_TABLE = ['sweets', 'cake', 'cake2', 'cupcakes', 'snacks'];

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function activeKeys(state) {
  const set = new Set((state.items || []).map((i) => i.scene).filter((k) => L[k]));
  if (IMPLICIT_TABLE.some((k) => set.has(k))) set.add('table');
  return set;
}

const STYLE = `
.c1{fill:var(--c1)}.c2{fill:var(--c2)}.c3{fill:var(--c3)}.cw{fill:#fff}.ol{stroke:rgba(0,0,0,.14);stroke-width:.7}
text{font-family:Fredoka,ui-rounded,'Arial Rounded MT Bold','Segoe UI',sans-serif;font-weight:600}
.neon{paint-order:stroke;filter:drop-shadow(0 0 3px var(--c1)) drop-shadow(0 0 7px var(--c1))}
.bl,.L,.wh,.swing,.cf{transform-box:fill-box;transform-origin:center}
.anim .pop{animation:pop .55s cubic-bezier(.34,1.26,.64,1) both;animation-delay:var(--d)}
.anim .rise{animation:rise 1.3s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--d)}
.anim .sw{animation:fadein .6s both;animation-delay:var(--d)}
.anim .e-zoom{animation:zoom .65s cubic-bezier(.34,1.2,.64,1) both}
.anim .e-drop{animation:drop .95s cubic-bezier(.3,.2,.4,1) both}
.anim .e-roll{animation:roll 1.25s cubic-bezier(.16,1,.3,1) both}
.anim .e-roll .wh{animation:spin 1.25s cubic-bezier(.16,1,.3,1) both}
.anim .e-glow{animation:glow .9s ease-out both}
.anim .leaving{animation:leave .18s cubic-bezier(.55,.06,.68,.19) both}
.anim .L-helium .bl{animation:rise 1.4s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--d)}
.anim .cf{animation:fall 3.4s linear infinite;animation-delay:var(--d);opacity:.9}
@keyframes pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes rise{from{transform:translateY(170px) scale(.6);opacity:0}30%{opacity:1}to{transform:translateY(0) scale(1)}}
@keyframes zoom{from{transform:scale(.4) translateY(14px);opacity:0}to{transform:none;opacity:1}}
@keyframes drop{0%{transform:translateY(-190px);opacity:0}12%{opacity:1}58%{transform:translateY(0)}74%{transform:translateY(-7px)}88%{transform:translateY(0)}94%{transform:translateY(-2px)}100%{transform:translateY(0)}}
@keyframes roll{from{transform:translateX(-260px);filter:blur(5px)}35%{filter:blur(3px)}to{transform:none;filter:blur(0)}}
@keyframes spin{from{transform:rotate(-540deg)}to{transform:none}}
@keyframes glow{0%{opacity:0}30%{opacity:1}45%{opacity:.3}60%{opacity:1}75%{opacity:.5}100%{opacity:1}}
@keyframes leave{to{transform:scale(.7);opacity:0}}
@keyframes fadein{from{opacity:0}to{opacity:1}}
@keyframes fall{from{transform:translateY(0) rotate(0)}to{transform:translateY(330px) translateX(var(--dx)) rotate(540deg)}}
@media (prefers-reduced-motion:reduce){.anim *{animation:none!important}}`;

const FRAME = (t) => `<defs><filter id="sh" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity=".18"/></filter></defs>
<rect width="400" height="300" fill="var(--wall)"/>
<rect x="150" y="40" width="100" height="100" rx="6" fill="${t.dark ? '#2a2f5a' : '#cfe9f5'}"/><path d="M200 40v100M150 90h100" stroke="${t.dark ? '#4a4f86' : '#fff'}" stroke-width="4"/><rect x="150" y="40" width="100" height="100" rx="6" fill="none" stroke="${t.dark ? '#4a4f86' : '#fff'}" stroke-width="5"/>
${t.dark ? '<circle cx="225" cy="62" r="7" fill="#fff6c9"/>' : '<circle cx="170" cy="62" r="9" fill="#fff6c9"/>'}
<path d="M0 0h26l-6 205H0z" class="c3" opacity=".5"/><path d="M400 0h-26l6 205h20z" class="c3" opacity=".5"/>
<rect y="203" width="400" height="97" fill="var(--floor)"/><rect y="200" width="400" height="5" fill="var(--floor2)"/>
<path d="M0 232h400M0 262h400" stroke="var(--floor2)" stroke-width="1.2"/><path d="M60 205l-30 95M150 205l-50 95M250 205l50 95M340 205l60 95" stroke="var(--floor2)" stroke-width="1" opacity=".7"/>`;

const group = (key, state, anim = '') => `<g class="L L-${key} ${anim}" data-key="${key}" data-z="${L[key].z}">${L[key].draw({ ...state, keys: state._keys, occasionId: state.occasionId })}</g>`;
const prep = (state) => ({ ...state, _keys: activeKeys(state) });

/** SVG estático completo (captura para la cotización / panel). */
export function sceneSVG(state, { className = '' } = {}) {
  const s = prep(state), t = theme(s);
  const body = [...s._keys].sort((a, b) => L[a].z - L[b].z).map((k) => group(k, s)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" class="scene ${className}" style="${vars(t)}" role="img" aria-label="Tu fiesta armada"><style>${STYLE}</style>${FRAME(t)}${body}</svg>`;
}
export const sceneDataURL = (state) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sceneSVG(state));

/** Escena animada con actualización incremental. */
export class Scene {
  constructor(host, { reduced = false } = {}) {
    this.host = host; this.keys = new Map(); this.reduced = reduced;
    const t = theme({ colors: [], mood: 'pastel' });
    host.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" class="scene anim" style="${vars(t)}" role="img" aria-label="Escena de tu fiesta"><style>${STYLE}</style><g id="frame">${FRAME(t)}</g><g id="layers"></g></svg>`;
    this.svg = host.querySelector('svg'); this.layers = host.querySelector('#layers'); this.frame = host.querySelector('#frame');
    this.mood = null; this.sig = '';
  }
  update(state) {
    const s = prep(state), t = theme(s);
    this.svg.setAttribute('style', vars(t));
    if (this.mood !== t.dark) { this.mood = t.dark; this.frame.innerHTML = FRAME(t); }
    const want = s._keys;
    for (const [k, el] of this.keys) if (!want.has(k)) {
      el.classList.add('leaving'); this.keys.delete(k);
      setTimeout(() => el.remove(), this.reduced ? 0 : 320);
    }
    for (const k of want) {
      const sig = k === 'backdrop' || k === 'neon' ? s.honoree || '' : k === 'number' ? digits(s) : k === 'cake' ? String(s._keys.has('cake2')) : '';
      const cur = this.keys.get(k);
      if (!cur) {
        const tpl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        tpl.innerHTML = group(k, s, `e-${L[k].enter}`);
        const el = tpl.firstElementChild; el.dataset.sig = sig;
        const next = [...this.layers.children].find((c) => !c.classList.contains('leaving') && +c.dataset.z > L[k].z);
        this.layers.insertBefore(el, next || null);
        this.keys.set(k, el);
      } else if (cur.dataset.sig !== sig) {          // texto o variante cambió: redibuja sin animar
        const tpl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        tpl.innerHTML = group(k, s, '');
        cur.innerHTML = tpl.firstElementChild.innerHTML; cur.dataset.sig = sig;
        cur.querySelectorAll('.bl').forEach((b) => (b.style.animation = 'none'));
      }
    }
  }
  /** instantánea estática para guardar con la cotización */
  snapshot(state) { return sceneDataURL(state); }
}
