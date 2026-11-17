const P = {
  cut: 'M13 2 4 14h7l-1 8 9-12h-7z', plug: 'M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0zM12 17v5', doc: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h7M9 17h7',
  out: 'M4 14v6h16v-6M12 3v12M7 8l5-5 5 5', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  check: 'M4 12l5 5L20 6', x: 'M5 5l14 14M19 5 5 19', nav: 'M3 11l18-8-8 18-2-8z', compass: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM16 8l-2 6-6 2 2-6z',
  camera: 'M4 7h3l2-3h6l2 3h3v13H4zM12 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', pin: 'M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', map: 'M9 3 3 5v16l6-2 6 2 6-2V3l-6 2zM9 3v16M15 5v16', search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5',
  wifi: 'M2 9a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M12 20h.01', wifioff: 'M2 2l20 20M5 13a10 10 0 0 1 5-2.7M2 9a15 15 0 0 1 5-3M8.5 16.5a5 5 0 0 1 7 0M12 20h.01M19 13a10 10 0 0 0-3-2',
  warn: 'M12 3 2 21h20zM12 10v5M12 18h.01', info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 11v6M12 7h.01', user: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21a8 8 0 0 1 16 0', 
  menu: 'M3 6h18M3 12h18M3 18h18', back: 'M15 5l-7 7 7 7', chev: 'M9 5l7 7-7 7', send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z', sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  moon: 'M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z', mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3', home: 'M3 11 12 3l9 8M5 10v10h14V10',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2', upload: 'M12 16V4M7 9l5-5 5 5M4 20h16', users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M17 4a3.5 3.5 0 0 1 0 7M22 20a7 7 0 0 0-4-6', gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 12l2-1-2-4-2 1-2-1-1-2H9L8 7 6 8 4 7l-2 4 2 1v2l-2 1 2 4 2-1 2 1 1 2h4l1-2 2-1 2 1 2-4-2-1z',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16', lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4', refresh: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5', flag: 'M5 21V4M5 4h13l-2 4 2 4H5', share: 'M12 3v12M7 8l5-5 5 5M5 14v7h14v-7', plus: 'M12 5v14M5 12h14', box: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
};
export const Icon = ({ n, size, ...p }) => <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" style={size ? { width: size, height: size } : undefined} {...p}><path d={P[n] || P.info} /></svg>;
// Logo Safelock: escudo monolínea con rayo y candado (ojo del candado en el rayo)
export const Logo = ({ size = 36 }) => <svg class="logo" width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="#FFC21A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-label="Safelock"><path d="M32 5 10 13v17c0 14 9 24 22 29 13-5 22-15 22-29V13z" /><path d="M35 17 24 33h8l-3 14 11-17h-8z" fill="#FFC21A" stroke="none" /></svg>;
