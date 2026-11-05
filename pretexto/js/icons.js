// Íconos de línea (SVG inline, sin emojis, sin logos de marcas).
const P = {
  cerveza: '<path d="M5 9h10v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M15 11h2.2a1.8 1.8 0 0 1 1.8 1.8v2.4a1.8 1.8 0 0 1-1.8 1.8H15"/><path d="M5.5 9c-.6-2 .6-3.6 2.4-3.6.8-1.6 3.2-1.6 4.1 0 1.8 0 3 1.6 2.5 3.6"/>',
  ron: '<path d="M10 2.5h4V6l1.6 2.6V19.5a2 2 0 0 1-2 2h-3.2a2 2 0 0 1-2-2V8.6L10 6z"/><path d="M8.4 13h7.2M8.4 17h7.2"/>',
  whisky: '<path d="M5 4h14l-1.4 15.5a1.5 1.5 0 0 1-1.5 1.5H7.9a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M5.8 11h12.4"/><rect x="9" y="13.2" width="3.2" height="3.2" rx=".6"/>',
  vodka: '<path d="M10.2 2.5h3.6v3l1.2 2.7V19.5a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V8.2l1.2-2.7z"/><circle cx="12" cy="14" r="2.1"/>',
  tequila: '<path d="M6.5 6h11l-1.3 14a1.2 1.2 0 0 1-1.2 1h-6a1.2 1.2 0 0 1-1.2-1z"/><path d="M7 11h10"/><path d="M16.5 3.5a3.5 3.5 0 0 1 3.5 3.5"/><path d="M16.5 3.5 20 7"/>',
  aguardiente: '<path d="M9.2 2.5h5.6v3.2H9.2z"/><path d="M8.2 5.7h7.6l2.2 4.8v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9z"/><path d="M6.2 13h11.6"/>',
  vino: '<path d="M7.8 2.8h8.4l.5 6.2a4.7 4.7 0 0 1-9.4 0z"/><path d="M12 13.7v7.3M8.6 21h6.8"/><path d="M7.5 7.5h9"/>',
  gin: '<path d="M3.8 4.2h16.4L12 13.2z"/><path d="M12 13.2V21M8 21h8"/><circle cx="16.8" cy="6.7" r="1.1"/>',
  espumante: '<path d="M9.2 21.5V12.8L10.6 9V3.2h2.8V9l1.4 3.8v8.7z"/><path d="M5.2 5.2l1.6 1.6M18.8 5.2l-1.6 1.6M3.8 10.2h2.2M18 10.2h2.2"/>',
  snacks: '<path d="M6.2 3h11.6l-.9 18H7.1z"/><path d="M6.6 7.6h10.8M7 16.2h10"/><circle cx="12" cy="12" r="1.6"/>',
  hielo: '<path d="M12 2.4l8 4.5v9.2l-8 4.5-8-4.5V6.9z"/><path d="M12 11.4v9.2M4 6.9l8 4.5 8-4.5"/>',
  combos: '<path d="M3.5 8.5h17v4h-17zM5 12.5h14V21H5z"/><path d="M12 8.5V21"/><path d="M12 8.5C9.4 8.5 8 7.4 8 6s1.6-2.4 4 2.5zM12 8.5c2.6 0 4-1.1 4-2.5s-1.6-2.4-4 2.5z"/>',
  back: '<path d="M21 5H9.5L3 12l6.5 7H21z"/><path d="M13 9.5l5 5M18 9.5l-5 5"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.4A7 7 0 0 1 19 9.6C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.6" r="2.4"/>',
  speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.6a7.6 7.6 0 0 1 0 10.8"/>',
  mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
  repeat: '<path d="M4 11V9a3 3 0 0 1 3-3h11l-3-3M20 13v2a3 3 0 0 1-3 3H6l3 3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chev: '<path d="M15 5l-7 7 7 7"/>', check: '<path d="M4.5 12.5l5 5 10-11"/>',
  bag: '<path d="M5 8h14l-1 12.5H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  scooter: '<circle cx="6" cy="17" r="2.6"/><circle cx="18" cy="17" r="2.6"/><path d="M8.6 17H14l2-8h-3M16 9h2.5M6 17l-1-5H3"/>',
  store: '<path d="M4 9.5l1.5-5h13L20 9.5M4 9.5v10h16v-10M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/>',
  wa: '<path d="M4 20l1.2-4.2A8 8 0 1 1 8.3 19z"/><path d="M9 8.8c.2 3 2.4 5.4 5.6 6.4l1.4-1.5-2.2-1.1-.9.7a4.6 4.6 0 0 1-2-2l.7-.9L10.5 8z"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 21h4"/>'
};
export const icon = (name, size = 24, sw = 1.8) =>
  `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
