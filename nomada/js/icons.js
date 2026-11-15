// Íconos de interfaz (24×24, trazo) y alérgenos.
const P = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>',
  wa: '<path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 19L4 20z"/><path d="M9 8.5c.3 3.2 3.1 5.8 6.3 6.2l1.2-1.4-2.2-1.2-1 .8c-1-.4-1.9-1.300-2.300-2.300l.8-1-1.2-2.200L9 8.500z"/>',
  pin: '<path d="M12 21s6.500-5.800 6.500-11A6.500 6.500 0 0 0 5.500 10C5.500 15.200 12 21 12 21z"/><circle cx="12" cy="10" r="2.300"/>',
  clock: '<circle cx="12" cy="12" r="8.500"/><path d="M12 7.500V12l3 2"/>',
  qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h3v3M20 14v.01M14 20h3M20 17v3"/>',
  camera: '<path d="M4 8h3l1.500-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.500"/>',
  user: '<circle cx="12" cy="8.500" r="3.500"/><path d="M5 20c.8-3.800 3.700-5.500 7-5.500s6.200 1.700 7 5.500"/>',
  users: '<circle cx="9" cy="9" r="3"/><path d="M3 19c.6-3.200 3-4.800 6-4.800s5.400 1.600 6 4.800"/><path d="M16 6.200a3 3 0 0 1 0 5.600M18 14.500c1.800.6 2.700 2 3 4.500"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="1.500"/><path d="M3 9h18v3H3zM12 9v11M12 9c-2-4-6-3.500-5-1.500S12 9 12 9zM12 9c2-4 6-3.500 5-1.500S12 9 12 9z"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12.500 16V8M17 16v-6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  cal: '<rect x="4" y="5.500" width="16" height="14.500" rx="2"/><path d="M4 10h16M8.500 3.500v4M15.500 3.500v4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.500M12 18.500V21M3 12h2.500M18.500 12H21M5.600 5.600l1.800 1.800M16.600 16.600l1.800 1.800M5.600 18.400l1.800-1.800M16.600 7.400l1.800-1.800"/>',
  logout: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  trash: '<path d="M5 7h14M10 7V4.500h4V7M7 7l1 13h8l1-13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
  alert: '<path d="M12 4l9 16H3L12 4z"/><path d="M12 10v4.500M12 17.200v.01"/>',
  cake: '<path d="M4 20h16v-6H4zM6 14v-3h12v3M12 11V7"/><path d="M12 4c1 1.200 1 2 0 3-1-1-1-1.800 0-3z"/>',
  star: '<path d="M12 4l2.400 5 5.600.7-4.100 3.800 1.100 5.500L12 16.300 7 19l1.100-5.500L4 9.700 9.600 9z"/>',
  stamp: '<path d="M9 14V9a3 3 0 1 1 6 0v5"/><path d="M6 14h12v3H6zM5 20h14"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
  ig: '<rect x="4" y="4" width="16" height="16" rx="4.500"/><circle cx="12" cy="12" r="3.700"/><path d="M16.800 7.200v.01"/>',
  home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6v.01M4 12v.01M4 18v.01"/>',
  scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16"/>',
  filter: '<path d="M4 6h16l-6 7v5l-4 2v-7z"/>',
  tag: '<path d="M4 4h8l8 8-8 8-8-8z"/><circle cx="8.500" cy="8.500" r="1.200"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1.500a3 3 0 0 0 3 3M16 6h4v1.500a3 3 0 0 1-3 3M12 13v4M8.500 20h7M10 17h4"/>',
  send: '<path d="M4 12L20 4l-4 16-4-6.500z"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.500-3.500M4 4v4h4M4 13a8 8 0 0 0 14.500 3.500M20 20v-4h-4"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4M6 12v8h12v-8"/>',
  eye: '<path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z"/><circle cx="12" cy="12" r="2.800"/>',
  heart: '<path d="M12 20s-7.500-4.500-7.500-10A4.200 4.200 0 0 1 12 7.500 4.200 4.200 0 0 1 19.500 10c0 5.500-7.500 10-7.500 10z"/>',
  menuBook: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11"/>',
  wine: '<path d="M8 4h8c.5 5-1 8-4 8S7.500 9 8 4zM12 12v8M8.500 20h7"/>'
};
export const icon = (k, size = 20, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k] || ''}</svg>`;

// Alérgenos (24×24)
export const ALERGENOS = {
  gluten: { n: 'Gluten', p: '<path d="M12 21V8M12 8c-2.500-1-3-3-3-4.500 2 .2 3 1.500 3 4.500zM12 8c2.500-1 3-3 3-4.500-2 .2-3 1.500-3 4.500zM12 13c-2.500-1-3.500-3-3.500-4.500 2.200.3 3.500 1.800 3.500 4.500zM12 13c2.500-1 3.500-3 3.500-4.500-2.200.3-3.500 1.800-3.500 4.500zM12 18c-2.500-1-3.500-3-3.500-4.500 2.200.3 3.500 1.800 3.500 4.500zM12 18c2.500-1 3.500-3 3.500-4.500-2.200.3-3.500 1.800-3.500 4.500z"/>' },
  lacteos: { n: 'Lácteos', p: '<path d="M12 3.500s6 6.500 6 10.500a6 6 0 0 1-12 0c0-4 6-10.500 6-10.500z"/>' },
  huevo: { n: 'Huevo', p: '<path d="M12 3.500c3.500 0 6 6 6 10a6 6 0 0 1-12 0c0-4 2.500-10 6-10z"/><path d="M9 14.500a3 3 0 0 0 2.500 2.500"/>' },
  pescado: { n: 'Pescado', p: '<path d="M3 12c3-4.500 9-5.500 13 0-4 5.500-10 4.500-13 0zM16 12l5-3.500v7z"/><circle cx="7.500" cy="11" r=".6" fill="currentColor"/>' },
  mariscos: { n: 'Mariscos', p: '<path d="M4 17c0-6 4-11 9-11 3 0 6 2 7 5M4 17c3 2 7 2 10 0 3-1.500 6-1 6-6M8 11l1 4M12 9.500l.5 4.500"/>' },
  frutosSecos: { n: 'Frutos secos', p: '<path d="M12 4c4 0 7 4 7 8.500S15.500 20 12 20s-7-3-7-7.500S8 4 12 4zM12 4v16M8.500 8c1 1.500 1 6 0 8M15.500 8c-1 1.500-1 6 0 8"/>' },
  soya: { n: 'Soya', p: '<path d="M7 7c3-3 8 0 10 4s0 8-4 7-9-4-6-11zM10 12c1-.5 2 0 3 1"/>' },
  sulfitos: { n: 'Sulfitos', p: '<circle cx="9" cy="14" r="2.800"/><circle cx="15" cy="14" r="2.800"/><circle cx="12" cy="9.500" r="2.800"/><path d="M12 6.700V3.500l2.500 1"/>' }
};
export const alergenoIcon = (k, size = 18) => ALERGENOS[k] ? `<svg class="ico alg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-label="${ALERGENOS[k].n}">${ALERGENOS[k].p}<title>${ALERGENOS[k].n}</title></svg>` : '';
