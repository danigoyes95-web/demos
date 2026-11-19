/* Mascota "Don" (corcho con sombrero y bigote) + amigo limón + placeholders de producto. SVG simple y animable. */
const Mascot = (() => {
  const cork = '#D9A860', dark = '#2b1b10';
  function don(mood = 'hello', size = 160) {
    const sleep = mood === 'sleep', sad = mood === 'sad', party = mood === 'party';
    const eyes = sleep ? `<path d="M72 100q8 7 16 0M112 100q8 7 16 0" stroke="${dark}" stroke-width="4" fill="none" stroke-linecap="round"/>`
      : `<circle cx="80" cy="100" r="10" fill="#fff"/><circle cx="120" cy="100" r="10" fill="#fff"/><circle cx="${sad ? 80 : 82}" cy="${sad ? 104 : 101}" r="5" fill="${dark}"/><circle cx="${sad ? 120 : 122}" cy="${sad ? 104 : 101}" r="5" fill="${dark}"/>${sad ? '<path d="M68 88l22 6M132 88l-22 6" stroke="' + dark + '" stroke-width="4" stroke-linecap="round"/><path d="M84 114q-3 12 0 16" stroke="#29C4F0" stroke-width="4" fill="none" stroke-linecap="round"/>' : ''}`;
    const mouth = sad ? `<path d="M88 150q12-10 24 0" stroke="${dark}" stroke-width="4" fill="none" stroke-linecap="round"/>` : party ? `<path d="M88 144q12 18 24 0z" fill="${dark}"/><path d="M95 150q5 5 10 0" fill="#FF3E8A"/>` : `<path d="M88 146q12 10 24 0" stroke="${dark}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    const armL = party ? 'M62 128L34 92' : mood === 'hello' ? 'M62 128L34 150' : 'M62 128L38 156';
    const armR = party ? 'M138 128L166 92' : mood === 'hello' ? 'M138 128L168 96' : 'M138 128L162 156';
    return `<svg class="mascot m-${mood}" viewBox="0 0 200 215" width="${size}" height="${size * 1.075}" role="img" aria-label="Don, la mascota">
<g class="m-body"><ellipse cx="100" cy="206" rx="40" ry="6" fill="#000" opacity=".25"/>
<rect x="76" y="176" width="16" height="26" rx="6" fill="#3a2a1c"/><rect x="108" y="176" width="16" height="26" rx="6" fill="#3a2a1c"/>
<path d="${armL}" stroke="${cork}" stroke-width="12" stroke-linecap="round" fill="none"/>
<path class="${mood === 'hello' ? 'm-wave' : ''}" d="${armR}" stroke="${cork}" stroke-width="12" stroke-linecap="round" fill="none"/>
<rect x="56" y="60" width="88" height="124" rx="30" fill="${cork}"/>
<g fill="#b98a44" opacity=".55"><circle cx="72" cy="80" r="2.5"/><circle cx="128" cy="86" r="3"/><circle cx="68" cy="160" r="3"/><circle cx="130" cy="166" r="2.5"/><circle cx="98" cy="172" r="2"/><circle cx="120" cy="70" r="2"/></g>
<path d="M56 100q0-40 44-40" stroke="#fff" stroke-opacity=".18" stroke-width="6" fill="none" stroke-linecap="round"/>
${eyes}
<path d="M66 128q16-16 34 0q18-16 34 0q-10 18-34 8q-24 10-34-8z" fill="${dark}"/>${mouth}
<g class="m-hat" style="transform-box:fill-box;transform-origin:50% 100%${sleep ? ';transform:rotate(-10deg) translateY(4px)' : ''}"><ellipse cx="100" cy="62" rx="66" ry="12" fill="#3a2a1c"/><path d="M68 62q0-38 32-38t32 38z" fill="#4a3524"/><rect x="68" y="50" width="64" height="9" fill="#B8894A"/></g>
${sleep ? '<g class="m-z" fill="#D2A464" font-family="Georgia,serif" font-weight="700"><text x="146" y="48" font-size="22">Z</text><text x="162" y="30" font-size="16">z</text></g>' : ''}
${party ? '<g class="m-conf"><circle cx="30" cy="40" r="4" fill="#FFE14D"/><circle cx="170" cy="46" r="4" fill="#FF3E8A"/><rect x="20" y="70" width="8" height="4" fill="#29C4F0"/><rect x="176" y="80" width="8" height="4" fill="#FFE14D"/><circle cx="46" cy="14" r="3" fill="#FF3E8A"/></g>' : ''}
</g></svg>`;
  }
  function moto(size = 220) {
    return `<svg class="mascot m-moto" viewBox="0 0 260 190" width="${size}" height="${size * .73}" role="img" aria-label="Don en moto">
<g class="m-speed" stroke="#D2A464" stroke-width="4" stroke-linecap="round" opacity=".7"><path d="M6 100h34M0 120h40M10 140h30"/></g>
<g class="m-bounce"><g transform="translate(70 -28) scale(.78)">${don('hello', 200).replace(/<svg[^>]*>|<\/svg>/g, '').replace('m-wave', '')}</g>
<path d="M70 150h110l22-30h18" stroke="#FF3E8A" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="92" y="134" width="70" height="16" rx="8" fill="#1E1C1A" stroke="#D2A464" stroke-width="3"/>
<g class="m-wheel" style="transform-origin:52px 160px"><circle cx="52" cy="160" r="22" fill="#121110" stroke="#D2A464" stroke-width="5"/><path d="M52 142v36M34 160h36" stroke="#D2A464" stroke-width="3"/></g>
<g class="m-wheel" style="transform-origin:206px 160px"><circle cx="206" cy="160" r="22" fill="#121110" stroke="#D2A464" stroke-width="5"/><path d="M206 142v36M188 160h36" stroke="#D2A464" stroke-width="3"/></g>
<rect x="46" y="112" width="42" height="34" rx="6" fill="#FFE14D" stroke="#121110" stroke-width="3"/><text x="67" y="135" text-anchor="middle" font-size="13" font-weight="800" fill="#121110" font-family="Arial">DON</text></g></svg>`;
  }
  function lime(size = 90) {
    return `<svg viewBox="0 0 120 130" width="${size}" height="${size * 1.08}" aria-hidden="true"><ellipse cx="60" cy="68" rx="40" ry="48" fill="#8BD450"/><ellipse cx="60" cy="68" rx="30" ry="38" fill="#A9E86B"/><path d="M26 36q34-30 68 0l-6 10H32z" fill="#E6342A"/><rect x="26" y="44" width="68" height="7" rx="3" fill="#B01F18"/><rect x="38" y="68" width="18" height="12" rx="4" fill="#121110"/><rect x="64" y="68" width="18" height="12" rx="4" fill="#121110"/><path d="M36 74h46" stroke="#121110" stroke-width="3"/><path d="M48 96q12 10 24 0" stroke="#121110" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;
  }
  function logo(h = 54) {
    return `<div class="logo" style="--h:${h}px"><span class="logo-don">Don</span><span class="logo-snack">Snack</span><small>WINE, BEER &amp; SPIRITS</small></div>`;
  }
  /* ---- placeholders de producto ---- */
  const SHAPES = {
    bottle: c => `<path d="M82 20h36v34q0 10 8 24v108q0 8-8 8H82q-8 0-8-8V78q8-14 8-24z" fill="${c}"/><rect x="82" y="10" width="36" height="14" rx="3" fill="#121110"/><rect x="76" y="110" width="48" height="52" rx="4" fill="#F4EEE4" opacity=".92"/>`,
    wine: c => `<path d="M90 10h20v52q16 20 16 44v90q0 8-8 8H82q-8 0-8-8v-90q0-24 16-44z" fill="${c}"/><rect x="88" y="6" width="24" height="18" rx="3" fill="#B8894A"/><rect x="78" y="120" width="44" height="56" rx="3" fill="#F4EEE4" opacity=".92"/>`,
    can: c => `<rect x="62" y="26" width="76" height="160" rx="12" fill="${c}"/><rect x="62" y="26" width="76" height="14" rx="6" fill="#d9d9d9"/><rect x="62" y="172" width="76" height="14" rx="6" fill="#bdbdbd"/><rect x="70" y="80" width="60" height="62" rx="6" fill="#F4EEE4" opacity=".92"/>`,
    six: c => `<rect x="36" y="70" width="128" height="104" rx="10" fill="${c}"/>${[0, 1, 2].map(i => `<rect x="${44 + i * 40}" y="40" width="28" height="42" rx="5" fill="#d8b04a"/>`).join('')}<rect x="46" y="110" width="108" height="40" rx="5" fill="#F4EEE4" opacity=".92"/>`,
    bag: c => `<path d="M48 36h104l8 150H40z" fill="${c}"/><path d="M48 36h104" stroke="#fff" stroke-opacity=".5" stroke-width="6" stroke-dasharray="6 4"/><ellipse cx="100" cy="112" rx="34" ry="26" fill="#F4EEE4" opacity=".92"/>`,
    ice: c => `<path d="M44 50h112l6 136H38z" fill="${c}" opacity=".9"/><path d="M60 100l22-14 22 14-22 14zM100 130l24-16 20 20-24 16z" fill="#fff" opacity=".8"/>`,
    cup: c => `<path d="M56 50h88l-12 136H68z" fill="${c}" opacity=".95"/><rect x="50" y="42" width="100" height="12" rx="6" fill="#fff"/><rect x="104" y="6" width="10" height="44" rx="4" fill="#FF3E8A" transform="rotate(12 104 6)"/>`,
    glass: c => `<path d="M60 40h80q0 70-40 82-40-12-40-82z" fill="${c}" opacity=".85"/><rect x="96" y="122" width="8" height="48" fill="${c}"/><rect x="70" y="170" width="60" height="8" rx="4" fill="${c}"/>`,
    thermo: c => `<rect x="58" y="30" width="84" height="156" rx="16" fill="${c}"/><rect x="66" y="14" width="68" height="22" rx="8" fill="#121110"/><rect x="70" y="86" width="60" height="54" rx="5" fill="#F4EEE4" opacity=".92"/>`
  };
  const catShape = { cerveza: 'six', latas: 'can', ron: 'bottle', whisky: 'bottle', vodka: 'bottle', tequila: 'bottle', granizados: 'cup', snacks: 'bag', hielo: 'ice', desechables: 'cup', calientes: 'thermo', vinos: 'wine', espumantes: 'wine', cremas: 'bottle', premium: 'bottle', 'cerveza-premium': 'can', detalles: 'glass' };
  const POP = [['#FFE14D', '#FF3E8A'], ['#FF3E8A', '#FFE14D'], ['#29C4F0', '#FFE14D']];
  const cache = {};
  function ph(p) {
    if (cache[p.id]) return cache[p.id];
    const cava = p.door === 'cava', i = [...p.cat].reduce((a, c) => a + c.charCodeAt(0), 0) % 3;
    const bg = cava ? ['#2a1519', '#121110'] : POP[i].concat(), liquid = cava ? (p.type === 'blanco' || p.cat === 'espumantes' ? '#C9B26A' : p.cat === 'vinos' ? '#6E1E2B' : '#B8894A') : ['#121110', '#6b3a12', '#2a6fdb', '#1f7a3a', '#7a1f2a'][[...p.id].reduce((a, c) => a + c.charCodeAt(0), 0) % 5];
    const shape = (SHAPES[catShape[p.cat]] || SHAPES.bottle)(liquid);
    const words = p.name.split(' ').slice(0, 3).join(' ');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/>${cava ? '<circle cx="100" cy="100" r="86" fill="none" stroke="#B8894A" stroke-opacity=".35" stroke-width="2"/>' : '<circle cx="168" cy="30" r="40" fill="#fff" opacity=".18"/>'}<g transform="translate(0 -2)">${shape}</g><text x="100" y="${catShape[p.cat] === 'wine' || catShape[p.cat] === 'bottle' ? 150 : 138}" text-anchor="middle" font-family="Arial Black,Arial" font-size="${words.length > 14 ? 9 : 11}" font-weight="900" fill="#121110">${words.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></svg>`;
    return cache[p.id] = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
  const imgTag = (p, cls = '') => p.cat === 'cigarrillos' ? '' : `<img class="${cls}" loading="lazy" alt="${p.name.replace(/"/g, '')}" src="${p.img ? Data.BASE + p.img : ph(p)}" ${p.img ? `onerror="this.onerror=null;this.src='${ph(p).replace(/'/g, '%27')}'"` : ''}>`;
  return { don, moto, lime, logo, ph, imgTag };
})();
