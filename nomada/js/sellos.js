// Ilustraciones de línea (64×64) para sellos del pasaporte, cartas del juego y placeholders del menú.
// Estilo: línea fina, un solo color (currentColor). Sin fotos de stock.

const G = {
  // —— destinos del pasaporte ——
  volcan: '<path d="M5 53 L23 23 L29 29 L36 22 L59 53 Z"/><path d="M23 23 L36 22"/><path d="M30 29 L28 41 M34 28 L37 39"/><path d="M29 18 C24 14 33 10 28 5 M37 17 C32 13 41 9 37 4"/>',
  chimborazo: '<path d="M3 53 L27 14 L35 26 L42 18 L61 53 Z"/><path d="M27 14 L21 25 L26 23 L30 28 L34 23 L35 26"/><circle cx="51" cy="12" r="4"/><path d="M51 4v2M51 18v2M43 12h2M57 12h2"/>',
  condor: '<path d="M32 24 C25 14 13 12 3 19 C11 18 15 22 17 28 C21 24 26 24 28 29 L32 42 L36 29 C38 24 43 24 47 28 C49 22 53 18 61 19 C51 12 39 14 32 24 Z"/><path d="M32 24 C31 19 32 15 35 14 C35 17 34 20 32 24 Z"/><path d="M32 42 L29 52 M32 42 L35 52 M32 42 L32 54"/>',
  llama: '<path d="M18 55 V36 C18 31 22 29 27 29 H40 C44 29 46 31 46 36 V55 M25 55 V45 M39 55 V45 M18 36 C13 36 12 42 15 46"/><path d="M42 29 L45 18 C46 13 49 11 53 12 L58 15 C59 18 57 19 55 19 L52 19 L49 25 L46 29"/><path d="M49 12 L48 6 M54 12 L56 7"/><circle cx="52.5" cy="15" r=".9" fill="currentColor"/>',
  colibri: '<path d="M17 47 C24 39 33 35 41 27 C45 23 49 22 53 23 C52 29 47 33 41 36 C34 39 26 42 17 47 Z"/><path d="M53 23 L62 20"/><path d="M33 34 C27 25 30 15 42 10 C43 20 40 28 33 34 Z"/><path d="M17 47 L8 57 M17 47 L13 59 M17 47 L5 52"/><circle cx="47" cy="25.5" r=".9" fill="currentColor"/>',
  flor: '<g transform="translate(32 32)"><path d="M0 -4 C-7 -14 -5 -22 0 -26 C5 -22 7 -14 0 -4Z"/><path transform="rotate(60)" d="M0 -4 C-7 -14 -5 -22 0 -26 C5 -22 7 -14 0 -4Z"/><path transform="rotate(120)" d="M0 -4 C-7 -14 -5 -22 0 -26 C5 -22 7 -14 0 -4Z"/><path transform="rotate(180)" d="M0 -4 C-7 -14 -5 -22 0 -26 C5 -22 7 -14 0 -4Z"/><path transform="rotate(240)" d="M0 -4 C-7 -14 -5 -22 0 -26 C5 -22 7 -14 0 -4Z"/><path transform="rotate(300)" d="M0 -4 C-7 -14 -5 -22 0 -26 C5 -22 7 -14 0 -4Z"/><circle r="3.4"/></g>',
  brujula: '<circle cx="32" cy="32" r="23"/><circle cx="32" cy="32" r="19" stroke-dasharray="1 3"/><path d="M32 9 L36.5 27.5 L55 32 L36.5 36.5 L32 55 L27.5 36.5 L9 32 L27.5 27.5 Z"/><circle cx="32" cy="32" r="2"/>',
  // —— ingredientes y platos ——
  maiz: '<path d="M32 7 C45 15 47 40 32 55 C17 40 19 15 32 7 Z"/><path d="M23 22 H41 M21 30 H43 M22 38 H42 M26 46 H38 M32 10 V52"/><path d="M32 55 C21 51 13 41 11 30 M32 55 C43 51 51 41 53 30"/>',
  quinua: '<path d="M32 58 V22"/><circle cx="32" cy="11" r="2.2"/><circle cx="26" cy="17" r="2.2"/><circle cx="38" cy="17" r="2.2"/><circle cx="23" cy="25" r="2.2"/><circle cx="41" cy="25" r="2.2"/><circle cx="26" cy="33" r="2.2"/><circle cx="38" cy="33" r="2.2"/><path d="M32 48 C24 46 19 40 17 35 M32 42 C40 40 45 34 47 29"/>',
  cacao: '<path d="M32 6 C49 13 53 41 32 58 C11 41 15 13 32 6 Z"/><path d="M32 8 V56 M23 13 C18 28 21 44 29 54 M41 13 C46 28 43 44 35 54"/>',
  pez: '<path d="M6 32 C16 17 37 17 49 32 C37 47 16 47 6 32 Z"/><path d="M49 32 L59 22 L59 42 Z"/><circle cx="18" cy="29.5" r="1.6" fill="currentColor"/><path d="M28 21 C30 27 30 37 28 43 M35 22 C37 28 37 36 35 42"/>',
  coupe: '<path d="M12 15 H52 C52 30 41 37 32 37 C23 37 12 30 12 15 Z"/><path d="M32 37 V54 M21 54 H43"/><path d="M45 8 L37 21"/><circle cx="46" cy="8" r="2.5"/>',
  carne: '<path d="M9 35 C7 22 22 13 35 15 C49 13 59 24 55 37 C52 49 36 53 24 49 C14 47 10 41 9 35 Z"/><circle cx="26" cy="31" r="5.5"/><path d="M37 25 C44 27 46 33 43 40"/>',
  vino: '<path d="M20 8 H44 C47 26 40 37 32 37 C24 37 17 26 20 8 Z"/><path d="M19 20 H45 M32 37 V54 M22 55 H42"/>',
  gyoza: '<path d="M7 40 C7 25 23 16 32 16 C41 16 57 25 57 40 C57 44 53 46 49 46 H15 C11 46 7 44 7 40 Z"/><path d="M19 24 L22 38 M27 20 L28 38 M36 20 L36 38 M45 24 L42 38"/>',
  cerveza: '<path d="M15 20 H41 V53 H15 Z"/><path d="M41 26 H49 C54 26 54 43 49 43 H41"/><path d="M13 20 C11 11 22 8 26 13 C30 8 40 9 43 15 C45 19 43 20 43 20"/><path d="M22 30 V46 M28 30 V46 M34 30 V46" stroke-dasharray="1 4"/>',
  postre: '<path d="M10 38 H54 C54 49 44 55 32 55 C20 55 10 49 10 38 Z"/><path d="M16 38 C13 24 24 14 32 14 C40 14 51 24 48 38"/><circle cx="32" cy="9" r="3"/><path d="M27 24 L29 30 M35 22 L36 29"/>',
  ensalada: '<path d="M7 31 H57 C57 46 45 55 32 55 C19 55 7 46 7 31 Z"/><path d="M15 31 C12 20 21 13 27 21 M27 21 C29 10 41 10 41 21 M41 21 C47 14 54 21 49 31"/>',
  naranjilla: '<circle cx="32" cy="37" r="17"/><path d="M32 20 C32 12 38 7 45 9 C43 16 38 20 32 20 Z"/><path d="M32 20 V27 M26 36 V40 M38 33 V37 M32 43 V47" stroke-dasharray="1 3"/>',
  altocopa: '<path d="M19 12 H45 L42 56 H22 Z"/><rect x="25" y="22" width="10" height="10" rx="1.5"/><rect x="31" y="35" width="10" height="10" rx="1.5"/><path d="M39 3 L33 38"/><path d="M45 12 C50 12 53 9 53 5"/>',
  whisky: '<path d="M14 18 H50 L46 54 H18 Z"/><rect x="24" y="29" width="13" height="13" rx="1.5"/><path d="M16 29 H48"/>',
  coliflor: '<path d="M12 36 C8 29 12 21 20 21 C21 13 33 10 38 16 C46 13 54 20 50 28 C57 31 54 40 46 38 C40 44 24 44 18 38 C15 38 13 37 12 36 Z"/><path d="M18 40 C18 50 25 57 32 57 C39 57 46 50 46 40 M32 40 V57"/>'
};

const STAMPS = [
  { key: 'volcan', nombre: 'TUNGURAHUA', sub: 'EL VOLCÁN' },
  { key: 'condor', nombre: 'CÓNDOR', sub: 'CIELO ANDINO' },
  { key: 'maiz', nombre: 'MAÍZ', sub: 'TIERRA TIERNA' },
  { key: 'llama', nombre: 'ALTIPLANO', sub: 'LA LLAMA' },
  { key: 'colibri', nombre: 'COLIBRÍ', sub: 'EL NÉCTAR' },
  { key: 'quinua', nombre: 'QUINUA', sub: 'EL GRANO' },
  { key: 'chimborazo', nombre: 'CHIMBORAZO', sub: 'LA CUMBRE' },
  { key: 'cacao', nombre: 'CACAO', sub: 'RUTA DEL CACAO' },
  { key: 'flor', nombre: 'AMBATO', sub: 'FLORES Y FRUTAS' },
  { key: 'brujula', nombre: 'NÓMADA', sub: 'EL VIAJERO' }
];
export const STAMP_COUNT = STAMPS.length;
export const stampInfo = i => STAMPS[i % STAMPS.length];

export const glyph = (key, { size = 64, stroke = 1.6, cls = '' } = {}) =>
  `<svg class="glifo ${cls}" viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${G[key] || G.brujula}</svg>`;

/** Defs globales (filtro de tinta) — insertar una vez por documento. */
export function ensureDefs() {
  if (document.getElementById('nm-defs')) return;
  const d = document.createElement('div');
  d.id = 'nm-defs'; d.setAttribute('aria-hidden', 'true'); d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML = `<svg width="0" height="0"><defs>
    <filter id="nm-ink" x="-6%" y="-6%" width="112%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 1.5" result="m"/>
      <feComposite in="SourceGraphic" in2="m" operator="in" result="e"/>
      <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="1" seed="2" result="w"/>
      <feDisplacementMap in="e" in2="w" scale="1.6"/>
    </filter>
    <filter id="nm-emboss" x="-5%" y="-5%" width="110%" height="110%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="0.6" result="b"/>
      <feSpecularLighting in="b" surfaceScale="2" specularConstant="0.7" specularExponent="18" lighting-color="#e9d9bd" result="s"><feDistantLight azimuth="235" elevation="48"/></feSpecularLighting>
      <feComposite in="s" in2="SourceAlpha" operator="in" result="sp"/>
      <feComposite in="SourceGraphic" in2="sp" operator="arithmetic" k1="0" k2="1" k3="0.55" k4="0"/>
    </filter></defs></svg>`;
  document.body.prepend(d);
}

/** Sello obtenido. date: Date|ISO|null. */
export function stampSVG(i, { date = null, num = i + 1 } = {}) {
  const s = stampInfo(i);
  const rot = ((i * 37) % 17) - 8;
  const dt = date ? new Date(date) : null;
  const MES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const dtxt = dt ? `${dt.getDate()} ${MES[dt.getMonth()]} ${dt.getFullYear()}` : '';
  const id = 's' + Math.random().toString(36).slice(2, 7);
  return `<svg class="stamp-svg" viewBox="0 0 100 100" style="--rot:${rot}deg" role="img" aria-label="Sello ${num}: ${s.nombre}">
    <defs><path id="${id}t" d="M 11.5,50 A 38.5,38.5 0 0,1 88.5,50"/><path id="${id}b" d="M 6,50 A 44,44 0 0,0 94,50"/></defs>
    <g class="stamp-ink" filter="url(#nm-ink)" fill="none" stroke="currentColor">
      <circle cx="50" cy="50" r="47" stroke-width="2.2"/>
      <circle cx="50" cy="50" r="35.5" stroke-width="1"/>
      <text font-family="var(--f-display)" font-weight="700" font-size="8.2" letter-spacing="1.6" fill="currentColor" stroke="none" text-anchor="middle"><textPath href="#${id}t" startOffset="50%">${s.nombre}</textPath></text>
      <text font-family="var(--f-display)" font-weight="600" font-size="6.2" letter-spacing="1.8" fill="currentColor" stroke="none" text-anchor="middle"><textPath href="#${id}b" startOffset="50%">${s.sub} · Nº ${String(num).padStart(2, '0')}</textPath></text>
      <g transform="translate(50 47) scale(.5) translate(-32 -32)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${G[s.key]}</g>
      <text x="50" y="75.5" font-family="var(--f-display)" font-weight="700" font-size="5.6" letter-spacing="1.2" fill="currentColor" stroke="none" text-anchor="middle">${dtxt}</text>
    </g></svg>`;
}

/** Casilla pendiente (solo contorno). */
export function stampGhostSVG(i, { num = i + 1 } = {}) {
  const s = stampInfo(i);
  return `<svg class="stamp-svg ghost" viewBox="0 0 100 100" aria-label="Sello pendiente ${num}">
    <g fill="none" stroke="currentColor"><circle cx="50" cy="50" r="46" stroke-width="1.2" stroke-dasharray="2 3.2"/>
    <g transform="translate(50 50) scale(.46) translate(-32 -32)" stroke-width="2" opacity=".55" stroke-linecap="round" stroke-linejoin="round">${G[s.key]}</g>
    <text x="50" y="86" font-family="var(--f-display)" font-weight="700" font-size="9" letter-spacing="1" fill="currentColor" stroke="none" text-anchor="middle" opacity=".7">${String(num).padStart(2, '0')}</text></g></svg>`;
}

/** Marca "N" de los íconos pequeños del logo (cuatro mini-glifos sobre el wordmark). */
export const logoGlyphs = () => ['volcan', 'altocopa', 'maiz', 'brujula'].map(k => glyph(k, { size: 14, stroke: 3 })).join('');

/** Wordmark HTML: EXPERIENCIA / NØMADA con mini-íconos. */
export function wordmark(cls = '') {
  return `<div class="wordmark ${cls}" role="img" aria-label="Experiencia Nómada"><span class="wm-icons">${logoGlyphs()}</span><span class="wm-top">EXPERIENCIA</span><span class="wm-main">N<span class="wm-o">Ø</span>MADA</span></div>`;
}
