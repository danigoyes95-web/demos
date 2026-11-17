// Genera src/data/seed.json — datos 100% FICTICIOS (Ambato y parroquias rurales).
import fs from 'node:fs';
let s = 20241117;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = a => a[Math.floor(rnd() * a.length)];
const ri = (a, b) => Math.floor(a + rnd() * (b - a + 1));

const SECTORES = [
  { n: 'Centro', lat: -1.2417, lng: -78.6197, rural: false, mru: 'AMB-01' },
  { n: 'Ficoa', lat: -1.2270, lng: -78.6330, rural: false, mru: 'AMB-02' },
  { n: 'Atocha', lat: -1.2330, lng: -78.6270, rural: false, mru: 'AMB-03' },
  { n: 'Huachi Chico', lat: -1.2680, lng: -78.6300, rural: false, mru: 'AMB-04' },
  { n: 'Miraflores', lat: -1.2500, lng: -78.6100, rural: false, mru: 'AMB-05' },
  { n: 'Ingahurco', lat: -1.2380, lng: -78.6140, rural: false, mru: 'AMB-06' },
  { n: 'Izamba', lat: -1.2010, lng: -78.5990, rural: true, mru: 'AMB-R1' },
  { n: 'Pinllo', lat: -1.2790, lng: -78.6020, rural: true, mru: 'AMB-R2' },
  { n: 'Santa Rosa', lat: -1.3010, lng: -78.6710, rural: true, mru: 'AMB-R3' },
  { n: 'Quisapincha', lat: -1.2300, lng: -78.7040, rural: true, mru: 'AMB-R4' },
  { n: 'Totoras', lat: -1.3240, lng: -78.6480, rural: true, mru: 'AMB-R5' },
  { n: 'Picaihua', lat: -1.2940, lng: -78.6180, rural: true, mru: 'AMB-R6' },
  { n: 'Cunchibamba', lat: -1.1900, lng: -78.6520, rural: true, mru: 'AMB-R7' },
];
const NOM = ['María','José','Luis','Rosa','Carmen','Juan','Segundo','Mariana','Pedro','Gladys','Manuel','Olga','Washington','Mercedes','Édison','Blanca','Klever','Narcisa','Wilson','Teresa','Galo','Lucía'];
const APE = ['Chiliquinga','Tipán','Yánez','Cando','Masaquiza','Lascano','Paredes','Sánchez','Toapanta','Mayorga','Guamán','Naranjo','Cuji','Villacís','Analuisa','Quishpe','Llerena','Pico','Altamirano','Caiza','Moposita','Freire'];
const CALLES = ['Av. Los Chasquis','Calle Bolívar','Av. Cevallos','Calle Sucre','Av. Atahualpa','Calle Quito','Pasaje B','Calle Los Pinos','Av. Rodrigo Pachano','Calle 12 de Noviembre','Calle Montalvo','Av. Colombia'];
const REF_RURAL = ['Camino de tierra junto a la capilla','Vía principal, barrio El Calvario','Frente a la escuela comunitaria','Sector La Libertad, lote 14','Entrada al barrio San Vicente'];
const NOTAS = ['Casa verde junto a la iglesia, medidor en el poste del lado derecho.','Portón negro, medidor en la pared exterior a la izquierda.','Tras la tienda "Don Pepe", camino empedrado, medidor en caja gris.','Poste de madera frente a la casa de dos pisos, medidor a 3 m de altura.','Perro suelto: avisar antes. Medidor junto al portón azul.'];
const MOTIVOS = ['pago','no_encontrado','acceso','peligro','direccion','ausente'];
const TIPOS = ['corte','reconexion','notificacion','retiro','revision'];
const PESOS = [0.40, 0.17, 0.22, 0.08, 0.13];
const tipo = () => { let r = rnd(), a = 0; for (let i = 0; i < 5; i++) { a += PESOS[i]; if (r < a) return TIPOS[i]; } return 'corte'; };
const dig = n => Array.from({ length: n }, () => ri(0, 9)).join('');
const near = (lat, lng, m) => [lat + (rnd() - .5) * m / 111000, lng + (rnd() - .5) * m / 111000];

// Clientes/medidores (fijos, se reutilizan en el historial)
const medidores = [];
function nuevoMedidor(sec, verif) {
  const [lat, lng] = near(sec.lat, sec.lng, sec.rural ? 4500 : 1800);
  const m = {
    medidor: 'M' + dig(7), cuen: dig(8), cuentaContrato: '40' + dig(8),
    cliente: `${pick(NOM)} ${pick(APE)} ${pick(APE)}`.toUpperCase(),
    direccion: sec.rural ? pick(REF_RURAL) : `${pick(CALLES)} y ${pick(CALLES)}, N° ${ri(1, 99)}-${ri(1, 99)}`,
    sector: sec.n, mru: sec.mru, rural: sec.rural, lat, lng,
    lecturaAnterior: ri(400, 9000), verif, nota: verif && rnd() < .6 ? pick(NOTAS) : '',
  };
  medidores.push(m); return m;
}
const loc = m => {
  const r = m.calidad;
  if (r === 'ninguna') return { lat: null, lng: null, calidad: 'ninguna', precision: null };
  return { lat: +m.lat.toFixed(6), lng: +m.lng.toFixed(6), calidad: r, precision: r === 'verificada' ? ri(4, 14) : null };
};

// ---- Órdenes de HOY (60)
const operarios = [
  { id: 'op1', codigo: 'OP-01', nombre: 'Carlos Andrade', pin: '1234', cuadrilla: 'Cuadrilla Norte', rol: 'operario', color: '#2F6FED' },
  { id: 'op2', codigo: 'OP-02', nombre: 'Mónica Tapia', pin: '2345', cuadrilla: 'Cuadrilla Sur', rol: 'operario', color: '#00A37A' },
  { id: 'op3', codigo: 'OP-03', nombre: 'Luis Guamán', pin: '3456', cuadrilla: 'Cuadrilla Rural', rol: 'operario', color: '#B45FE0' },
  { id: 'sup1', codigo: 'SUP-01', nombre: 'Patricia Núñez', pin: '0000', cuadrilla: 'Supervisión', rol: 'supervisor', color: '#FFC21A' },
];
const asigna = sec => ['AMB-01','AMB-02','AMB-06'].includes(sec.mru) ? 'op1' : ['AMB-03','AMB-04','AMB-05','AMB-R2','AMB-R6'].includes(sec.mru) ? 'op2' : sec.rural ? 'op3' : 'op1';
const ordenes = [];
const secuencia = {};
for (let i = 0; i < 60; i++) {
  const sec = SECTORES[i % SECTORES.length];
  const r = rnd();
  const calidad = r < .45 ? 'verificada' : r < .8 ? 'aprox' : 'ninguna';
  const m = nuevoMedidor(sec, calidad === 'verificada'); m.calidad = calidad;
  secuencia[sec.mru] = (secuencia[sec.mru] || 0) + 1;
  const t = tipo();
  ordenes.push({
    n: i + 1, tipo: t, ...pick([{}]), cuen: m.cuen, cuentaContrato: m.cuentaContrato, medidor: m.medidor, cliente: m.cliente,
    direccion: m.direccion, sector: m.sector, mru: m.mru, rural: m.rural, secuencia: secuencia[sec.mru],
    deuda: t === 'reconexion' || t === 'corte' || t === 'notificacion' ? +(rnd() * 180 + 20).toFixed(2) : 0,
    planillas: t === 'retiro' || t === 'revision' ? 0 : ri(2, 6),
    lecturaAnterior: m.lecturaAnterior, loc: loc(m), asignadoA: asigna(sec),
    notaLlegada: m.nota, fotoLugar: calidad === 'verificada' && rnd() < .7,
  });
}
// Estado de hoy: algunas ya hechas
const hechas = [
  [0, 'op1', 190, 0], [1, 'op1', 160, 0], [2, 'op1', 120, 0],
  [3, 'op2', 140, 0], [4, 'op2', 95, 'far'], [5, 'op2', 60, 'pago'],
  [8, 'op3', 70, 0],
];
for (const [i, op, minAgo, x] of hechas) {
  const o = ordenes[i]; o.asignadoA = op; o.hoy = { minAgo, x };
}
// ---- Historial 14 días
const hist = [];
for (let d = -14; d <= -1; d++) {
  const dow = new Date(Date.now() + d * 864e5).getDay();
  if (dow === 0) continue;
  const n = ri(9, 14);
  for (let k = 0; k < n; k++) {
    const m = medidores[ri(0, medidores.length - 1)];
    const op = pick(['op1', 'op2', 'op3']);
    const t = tipo();
    const ok = rnd() > .13;
    hist.push({
      dia: d, min: ri(7 * 60 + 20, 16 * 60 + 30), tipo: t, op, medidor: m.medidor, cuen: m.cuen, cuentaContrato: m.cuentaContrato,
      cliente: m.cliente, direccion: m.direccion, sector: m.sector, mru: m.mru, rural: m.rural, lat: +m.lat.toFixed(6), lng: +m.lng.toFixed(6),
      ok, motivo: ok ? null : pick(MOTIVOS), lectura: m.lecturaAnterior - ri(20, 300), corte: rnd() < .7 ? 'medidor' : 'poste',
      acc: ri(5, 28), fotos: ri(1, 3), dur: ri(4, 14),
    });
  }
}
const locations = medidores.filter(m => m.calidad === 'verificada').map(m => ({ medidor: m.medidor, cuen: m.cuen, lat: +m.lat.toFixed(6), lng: +m.lng.toFixed(6), precision: ri(4, 14), nota: m.nota, fotoLugar: true }));
fs.writeFileSync(new URL('../src/data/seed.json', import.meta.url), JSON.stringify({ operarios, ordenes, historial: hist, locations,
  posiciones: [{ op: 'op1', lat: -1.2395, lng: -78.6180, minAgo: 3 }, { op: 'op2', lat: -1.2610, lng: -78.6240, minAgo: 6 }, { op: 'op3', lat: -1.2160, lng: -78.6360, minAgo: 70 }] }));
console.log('órdenes', ordenes.length, 'historial', hist.length, 'ubicaciones', locations.length);
