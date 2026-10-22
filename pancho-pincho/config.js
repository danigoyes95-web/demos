/* Datos del local · lo único que se cambia por cliente. MODO DEMO: todo se guarda solo en este navegador (localStorage). */
window.LOCAL = {
  nombre: 'Pancho Pincho', lema: '¡Sabor popular!', ciudad: 'Ingahurco · Ambato',
  wa: '593962949801', tel: '0962949801', ig: 'panchopincho_',
  horario: 'Lunes a Sábado · 6:00pm a 10:30pm',
  maps: 'https://maps.app.goo.gl/UW2Wk8L4f2guybeZ6',
  claveDueno: '1234',   // PIN del panel del dueño en la demo (con backend real se cambia por login)
  // Menú inicial (precios de ejemplo; el dueño los edita desde su panel)
  menu: [
    { id: 'p1', cat: 'Pinchos', nombre: 'Pincho de Carne', desc: 'A la parrilla con salsa de la casa', precio: 3.5, ico: '🍢' },
    { id: 'p2', cat: 'Pinchos', nombre: 'Pincho de Pollo', desc: 'Jugoso, marinado en achiote', precio: 3.0, ico: '🍗' },
    { id: 'p3', cat: 'Pinchos', nombre: 'Pincho de Matambre', desc: 'El favorito de los que saben', precio: 4.0, ico: '🥩' },
    { id: 'a1', cat: 'Acompañantes', nombre: 'Choclo frito', desc: 'Crocante por fuera, tierno por dentro', precio: 1.5, ico: '🌽' },
    { id: 'a2', cat: 'Acompañantes', nombre: 'Maduros fritos', desc: 'Dorados y dulcecitos', precio: 1.5, ico: '🍌' },
    { id: 'a3', cat: 'Acompañantes', nombre: 'Porción de moro', desc: 'Arroz con lenteja, como en casa', precio: 1.5, ico: '🍚' },
    { id: 'c1', cat: 'Combos', nombre: "Combo pa' campeones", desc: 'Pincho + moro', precio: 4.5, ico: '🏆' },
    { id: 'c2', cat: 'Combos', nombre: 'Pinchos a la parrilla', desc: 'Plato de 4 pinchos surtidos con acompañantes', precio: 12.0, ico: '🔥' },
    { id: 'b1', cat: 'Bebidas', nombre: 'Gaseosa personal', desc: 'Bien fría', precio: 1.0, ico: '🥤' },
    { id: 'b2', cat: 'Bebidas', nombre: 'Jugo natural', desc: 'Fruta del día', precio: 1.5, ico: '🧃' }
  ]
};
