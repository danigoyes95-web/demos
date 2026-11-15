// Genera data/seed.json — datos de DEMO deterministas (misma semilla = mismos datos).
// Todas las fechas son RELATIVAS al día en que se abre/reinicia la demo (k = días desde el lunes de esta semana).
// Uso: node tools/generar-seed.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'seed.json');

// ---------- PRNG determinista ----------
let s = 20261115;
const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = a => a[Math.floor(rnd() * a.length)];
const wpick = (pairs) => { const tot = pairs.reduce((x, p) => x + p[1], 0); let r = rnd() * tot; for (const [v, w] of pairs) { if ((r -= w) <= 0) return v; } return pairs[0][0]; };

// ---------- CONFIG ----------
const config = {
  v: 1,
  restaurante: {
    nombre: 'Experiencia Nómada',
    instagram: '@nomada.amb',
    instagramUrl: 'https://www.instagram.com/nomada.amb/',
    whatsapp: '593990000000',          // PROVISIONAL (número de prueba)
    direccion: 'San Antonio · Huayna Capac y Cañaris, Ambato',
    horario: 'Miércoles a Domingo · 18h00 a 23h00',
    diasAbierto: [3, 4, 5, 6, 0],
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Nomada+restaurante+Huayna+Capac+y+Cañaris+Ambato',
    mapsEmbed: 'https://www.openstreetmap.org/export/embed.html?bbox=-78.64%2C-1.26%2C-78.60%2C-1.23&layer=mapnik'
  },
  textos: {
    fraseOpciones: ['Cada plato, un destino.', 'Raíces andinas, sabores del mundo.', 'Viaja sin salir de la mesa.'],
    fraseIndex: 0,
    heroSub: 'Cocina de autor con raíces andinas. Coctelería, cervezas del mundo y mesas que se recuerdan.',
    filosofia: [
      'Nómada nace de una idea simple: viajar es una forma de cocinar. Cada plato parte de un ingrediente andino y se va de viaje: toma una técnica de lejos, una especia, un fuego distinto.',
      'Cocinamos despacio, con producto de la sierra y del mercado de Ambato. Servimos pocas mesas para poder mirarte a los ojos cuando llega el plato.'
    ],
    pasaporteTitulo: 'Tu Pasaporte Nómada',
    pasaporteTexto: 'Cada visita es un destino. Reúne sellos, sube de nivel y desbloquea cortesías, preventas y mesas que no se anuncian.',
    reservasTexto: 'Reservamos por WhatsApp. Escríbenos y te confirmamos la mesa.'
  },
  niveles: [
    { id: 'viajero', nombre: 'Viajero', min: 0, desc: 'Tu ruta empieza aquí.' },
    { id: 'explorador', nombre: 'Explorador', min: 5, desc: 'Ya conoces la ruta. Ahora la eliges.' },
    { id: 'nomada', nombre: 'Nómada', min: 10, desc: 'La mesa te conoce por tu nombre.' }
  ],
  premios: [
    { id: 'p3', sellos: 3, nombre: 'Cóctel de autor de bienvenida', desc: 'Un cóctel de la casa en tu próxima escala.', alcohol: true, alt: 'Mocktail de autor' },
    { id: 'p5', sellos: 5, nombre: 'Postre del chef', desc: 'Un postre de cortesía + acceso a preventa de eventos.', preventa: true },
    { id: 'p10', sellos: 10, nombre: 'Experiencia de maridaje para 2', desc: 'Maridaje completo para dos + invitación a una cena privada del chef.', alcohol: true, alt: 'Maridaje sin alcohol' }
  ],
  cumple: { activo: true, nombre: 'Detalle de cumpleaños', desc: 'Un postre y una copa de cortesía durante tu semana de cumpleaños.', alcohol: true, alt: 'Bebida sin alcohol' },
  juego: {
    activo: true,
    premio: 'sello',                    // 'sello' | 'bebida'
    textoSello: 'Tu primer sello de regalo',
    textoBebida: 'Bebida de bienvenida en tu primera visita',
    titulo: 'Maridaje Nómada',
    intro: 'Une cada plato con su pareja ideal en 60 segundos y llévate tu primer sello.',
    segundos: 60,
    ranking: true
  },
  pin: { mesero: '1234', dueno: '2468' },
  plantillas: {
    riesgo: 'Hola [nombre], te extrañamos en Nómada. Tu pasaporte tiene destinos por descubrir: tenemos platos nuevos de temporada. ¿Te guardamos una mesa esta semana?',
    cumple: 'Feliz cumpleaños, [nombre] 🎂 En tu semana tienes un detalle esperándote en Nómada. Escríbenos y reservamos tu mesa.',
    preventa: 'Hola [nombre], como miembro de tu Pasaporte Nómada tienes preventa para nuestro próximo evento. Los cupos son limitados, ¿te reservamos uno?',
    vip: 'Hola [nombre], gracias por ser parte de la ruta Nómada. Queremos invitarte a probar algo antes que nadie. ¿Te cuento?',
    nuevos: 'Hola [nombre], gracias por tu primera visita a Nómada. Tu pasaporte ya tiene su primer sello; con 3 sellos te espera un cóctel de la casa. Te esperamos.',
    cerveza: 'Hola [nombre], llegaron cervezas nuevas a Nómada y creímos que te iban a gustar. ¿Te guardamos una mesa?',
    cocteleria: 'Hola [nombre], estrenamos cóctel de autor en Nómada. Pasa a probarlo esta semana.'
  }
};

// ---------- MENÚ ----------
const M = [];
const d = (id, c, n, p, desc, ing, o = {}) => M.push({ id, c, n, p, desc, ing, foto: o.foto || null, tags: o.tags || [], al: o.al || [], m: [], ag: !!o.ag, t: o.t ?? null, bot: o.bot ?? null, glifo: o.glifo || null });
const F = 'assets/fotos/';
// Entradas
d('tiradito-corvina', 'entradas', 'Tiradito de corvina', 14, 'Láminas de corvina sobre leche de coco y ají amarillo, cacao nacional rallado y puntos de mejillón escabechado.', ['Corvina', 'Cacao nacional', 'Ají amarillo', 'Mejillón'], { foto: F + 'platos/tiradito-corvina.jpg', tags: ['temporada', 'chef'], al: ['pescado', 'mariscos'], t: 21, glifo: 'pez' });
d('gyozas-cerdo', 'entradas', 'Gyozas de cerdo y col', 11, 'Selladas en sartén, rellenas de cerdo y col morada, con ají de la casa.', ['Cerdo', 'Col', 'Ají'], { foto: F + 'platos/gyozas.jpg', tags: ['picante'], al: ['gluten', 'soya'], glifo: 'gyoza' });
d('coliflor-andina', 'entradas', 'Coliflor asada, costra de queso andino', 10, 'Coliflor entera al horno bajo una costra tostada de queso de hoja y morocho.', ['Coliflor', 'Queso de hoja', 'Morocho'], { foto: F + 'platos/coliflor-horno.jpg', tags: ['vegetariano', 'recomendado'], al: ['lacteos'], glifo: 'coliflor' });
d('calabacin-cuscus', 'entradas', 'Calabacín asado, cuscús y queso', 12, 'Calabacín y naranja asados sobre cuscús de hierbas, reducción de mora y queso rallado.', ['Calabacín', 'Cuscús', 'Mora', 'Queso'], { foto: F + 'platos/ensalada-cuscus.jpg', tags: ['temporada', 'vegetariano'], al: ['gluten', 'lacteos'], t: 12, glifo: 'ensalada' });
d('causa-trucha', 'entradas', 'Causa de papa chola y trucha ahumada', 12, 'Papa chola amarilla, trucha ahumada en casa, aguacate y crujiente de quinua.', ['Papa chola', 'Trucha', 'Quinua'], { al: ['pescado'], glifo: 'quinua' });
d('humita-tostada', 'entradas', 'Humita tostada, mantequilla de hierbas', 8, 'Choclo tierno molido, tostado a la plancha, con mantequilla de hierbas del páramo.', ['Choclo', 'Mantequilla de hierbas'], { tags: ['vegetariano', 'singluten'], al: ['lacteos'], glifo: 'maiz' });
// Fuertes
d('lomo-remolacha', 'fuertes', 'Lomo fino, remolacha y hierbas', 26, 'Lomo sellado al carbón sobre crema de remolacha, hinojo fresco y reducción de frutos rojos.', ['Lomo fino', 'Remolacha', 'Hinojo', 'Frutos rojos'], { foto: F + 'platos/lomo-remolacha.jpg', tags: ['temporada', 'recomendado', 'singluten'], al: ['lacteos'], t: 21, glifo: 'carne' });
d('res-yema', 'fuertes', 'Res a baja temperatura, yema de codorniz', 29, 'Doce horas de cocción lenta, laqueada en jugo de vino, con yemas de codorniz en conserva.', ['Res', 'Yema de codorniz', 'Vino tinto'], { foto: F + 'platos/lomo-yema.jpg', tags: ['chef', 'singluten'], al: ['huevo', 'sulfitos'], glifo: 'carne' });
d('trucha-quinua', 'fuertes', 'Trucha de altura, quinua crocante', 22, 'Trucha de Cotopaxi a la plancha, quinua inflada y mantequilla de limón sutil.', ['Trucha', 'Quinua', 'Limón'], { tags: ['singluten'], al: ['pescado', 'lacteos'], glifo: 'pez' });
d('hornado-12h', 'fuertes', 'Cerdo hornado 12 horas', 21, 'Cerdo de cocción larga, mote pillo y encurtido de cebolla paiteña.', ['Cerdo', 'Mote', 'Cebolla paiteña'], { tags: ['recomendado'], al: ['huevo'], glifo: 'carne' });
d('risotto-morocho', 'fuertes', 'Risotto de morocho y hongos', 19, 'Morocho cremoso, hongos de páramo salteados y queso madurado.', ['Morocho', 'Hongos', 'Queso madurado'], { tags: ['vegetariano', 'singluten'], al: ['lacteos'], glifo: 'maiz' });
d('pulpo-brasa', 'fuertes', 'Pulpo a la brasa, papas nativas', 27, 'Pulpo tierno al carbón, papas nativas y chimichurri de ají.', ['Pulpo', 'Papas nativas', 'Ají'], { tags: ['picante', 'singluten'], al: ['mariscos'], glifo: 'pez' });
d('costilla-cacao', 'fuertes', 'Costilla glaseada, ají de cacao', 24, 'Costilla lacada en ají de cacao y panela, con puré de papa.', ['Costilla', 'Cacao', 'Panela'], { tags: ['picante'], al: ['lacteos'], glifo: 'carne' });
// Postres
d('esfera-cacao', 'postres', 'Esfera de cacao nacional', 8, 'Chocolate 70 % con sal de Cachi, centro líquido y helado de tostado.', ['Cacao nacional', 'Sal de Cachi'], { tags: ['chef'], al: ['lacteos', 'huevo'], glifo: 'cacao' });
d('helado-paila', 'postres', 'Helado de paila y mora', 7, 'Helado de paila artesanal, mora de castilla y granola de quinua.', ['Mora', 'Quinua'], { tags: ['vegetariano'], al: ['lacteos', 'gluten'], glifo: 'postre' });
d('cheesecake-naranjilla', 'postres', 'Cheesecake de naranjilla', 8, 'Base de galleta de maíz, crema ligera y gel de naranjilla.', ['Naranjilla', 'Queso crema'], { tags: ['vegetariano'], al: ['lacteos', 'gluten', 'huevo'], glifo: 'naranjilla' });
d('higos-miel', 'postres', 'Higos al horno, queso y miel', 8, 'Higos asados con queso de hoja, miel de abeja y nuez tostada.', ['Higo', 'Miel', 'Nueces'], { tags: ['temporada', 'vegetariano', 'singluten'], al: ['lacteos', 'frutosSecos'], t: 28, glifo: 'postre' });
// Coctelería
d('sangre-paramo', 'cocteleria', 'Sangre de Páramo', 11, 'Mezcal, hibisco, mora y albahaca. Ahumado, ácido y profundo.', ['Mezcal', 'Hibisco', 'Mora', 'Albahaca'], { foto: F + 'cocteles/coctel-rojo.jpg', tags: ['temporada', 'chef'], t: 21, glifo: 'altocopa' });
d('nomada-sour', 'cocteleria', 'Nómada Sour', 10, 'Pisco, maracuyá y espuma de clara con un toque de especias.', ['Pisco', 'Maracuyá', 'Clara'], { foto: F + 'cocteles/coctel-espuma.jpg', tags: ['recomendado'], al: ['huevo'], glifo: 'coupe' });
d('naranjilla-spritz', 'cocteleria', 'Naranjilla Spritz', 9, 'Naranjilla, espumante y bitter de la casa. Ligero y brillante.', ['Naranjilla', 'Espumante'], { al: ['sulfitos'], glifo: 'naranjilla' });
d('old-panela', 'cocteleria', 'Old Fashioned de panela', 11, 'Whisky, panela ahumada y bitter de cacao, sobre hielo claro.', ['Whisky', 'Panela', 'Cacao'], { glifo: 'whisky' });
d('mule-uvilla', 'cocteleria', 'Mule de jengibre y uvilla', 9, 'Vodka, jengibre fresco, uvilla y limón.', ['Vodka', 'Jengibre', 'Uvilla'], { glifo: 'altocopa' });
d('negroni-chuzo', 'cocteleria', 'Negroni ahumado', 11, 'Ginebra, vermut y bitter con humo de madera de la casa.', ['Ginebra', 'Vermut', 'Bitter'], { glifo: 'whisky' });
// Cervezas
d('ipa-artesanal', 'cervezas', 'IPA artesanal · 330 ml', 6, 'Lúpulo cítrico y amargor limpio. Cervecería local.', ['Lúpulo'], { al: ['gluten'], glifo: 'cerveza' });
d('pale-local', 'cervezas', 'Pale ale local · 330 ml', 5, 'Maltosa, de cuerpo medio y final seco.', ['Malta'], { al: ['gluten'], glifo: 'cerveza' });
d('stout-cacao', 'cervezas', 'Stout de cacao · 330 ml', 7, 'Oscura, tostada, con cacao nacional.', ['Malta tostada', 'Cacao'], { tags: ['recomendado'], al: ['gluten'], glifo: 'cerveza' });
d('lager-importada', 'cervezas', 'Lager importada · 500 ml', 6, 'Clásica alemana, limpia y refrescante.', ['Malta'], { al: ['gluten'], glifo: 'cerveza' });
d('weiss-importada', 'cervezas', 'Weissbier importada · 500 ml', 7, 'Trigo, banano y clavo de olor.', ['Trigo'], { al: ['gluten'], glifo: 'cerveza' });
d('sour-frutas', 'cervezas', 'Sour de frutas · 330 ml', 7, 'Ácida y jugosa, con fruta de temporada.', ['Fruta'], { tags: ['temporada'], al: ['gluten'], t: 35, glifo: 'cerveza' });
// Vinos (copa / botella)
d('malbec', 'vinos', 'Malbec · Mendoza', 8, 'Tinto de fruta negra y taninos suaves.', ['Malbec'], { bot: 32, al: ['sulfitos'], glifo: 'vino' });
d('cabernet', 'vinos', 'Cabernet Sauvignon · Colchagua', 8, 'Estructurado, con notas de cedro y mora.', ['Cabernet Sauvignon'], { bot: 30, al: ['sulfitos'], glifo: 'vino' });
d('carmenere', 'vinos', 'Carmenere · Valle Central', 9, 'Especiado y redondo.', ['Carmenere'], { bot: 34, al: ['sulfitos'], glifo: 'vino' });
d('sauvignon', 'vinos', 'Sauvignon Blanc · Marlborough', 8, 'Blanco herbal, cítrico y vibrante.', ['Sauvignon Blanc'], { bot: 34, al: ['sulfitos'], glifo: 'vino' });
d('rosado', 'vinos', 'Rosado de Provenza', 9, 'Seco, floral y muy fresco.', ['Rosado'], { bot: 36, al: ['sulfitos'], glifo: 'vino' });
d('espumante', 'vinos', 'Espumante brut', 9, 'Burbuja fina, ideal para abrir la mesa.', ['Espumante'], { bot: 38, al: ['sulfitos'], glifo: 'coupe' });
// Sin alcohol
d('limonada-hierbas', 'sinalcohol', 'Limonada de hierbas andinas', 4, 'Limón, hierbaluisa y menta.', ['Limón', 'Hierbaluisa'], { tags: ['vegetariano'], glifo: 'altocopa' });
d('kombucha-uvilla', 'sinalcohol', 'Kombucha de uvilla', 5, 'Fermentada en casa, ligera y ácida.', ['Uvilla'], { tags: ['vegetariano'], glifo: 'altocopa' });
d('mocktail-paramo', 'sinalcohol', 'Mocktail Páramo', 7, 'Hibisco, mora y albahaca. La versión sin alcohol de nuestro cóctel insignia.', ['Hibisco', 'Mora', 'Albahaca'], { tags: ['chef'], glifo: 'altocopa' });
d('cerveza-0', 'sinalcohol', 'Cerveza 0,0 %', 4, 'Sin alcohol, con carácter.', ['Malta'], { al: ['gluten'], glifo: 'cerveza' });
d('cafe-especialidad', 'sinalcohol', 'Café de especialidad', 3.5, 'Café de altura de Ecuador, filtrado o espresso.', ['Café'], { glifo: 'postre' });
// Maridajes (se aplican en ambos sentidos)
const pairs = [
  ['tiradito-corvina', 'nomada-sour'], ['tiradito-corvina', 'sauvignon'], ['gyozas-cerdo', 'lager-importada'], ['gyozas-cerdo', 'mule-uvilla'],
  ['coliflor-andina', 'pale-local'], ['calabacin-cuscus', 'rosado'], ['causa-trucha', 'naranjilla-spritz'], ['humita-tostada', 'espumante'],
  ['lomo-remolacha', 'sangre-paramo'], ['lomo-remolacha', 'malbec'], ['res-yema', 'cabernet'], ['res-yema', 'old-panela'],
  ['trucha-quinua', 'sauvignon'], ['hornado-12h', 'ipa-artesanal'], ['risotto-morocho', 'carmenere'], ['pulpo-brasa', 'weiss-importada'],
  ['costilla-cacao', 'stout-cacao'], ['costilla-cacao', 'negroni-chuzo'], ['esfera-cacao', 'stout-cacao'], ['esfera-cacao', 'cafe-especialidad'],
  ['helado-paila', 'espumante'], ['cheesecake-naranjilla', 'sour-frutas'], ['higos-miel', 'carmenere']
];
const byId = Object.fromEntries(M.map(x => [x.id, x]));
for (const [a, b] of pairs) { byId[a].m.push(b); byId[b].m.push(a); }
M.forEach((x, i) => x.o = i);
M[M.findIndex(x => x.id === 'res-yema')].ag = false;
byId['pulpo-brasa'].ag = true; // ejemplo de "Agotado hoy"
const FOODS = M.filter(x => ['entradas', 'fuertes', 'postres'].includes(x.c)).map(x => x.id);

// ---------- EVENTOS ----------
// k = día (relativo al lunes de esta semana)
const events = [
  { id: 'ev-cata-1', titulo: 'Cata de cervezas del mundo y maridaje', colab: 'Cervecería invitada (demo)', desc: 'Cinco cervezas, cinco bocados. Una ruta de estilos guiada por el chef y un cervecero invitado.', precio: 35, cupos: 24, k: -10 * 7 + 3, img: 'assets/fotos/ambiente/mesa-servida.jpg', preventa: false, past: true },
  { id: 'ev-cena-raices', titulo: 'Cena Raíces: cinco tiempos', colab: 'Chef invitado de Quito (demo)', desc: 'Cinco tiempos que cruzan la sierra norte y sur. Menú cerrado, maridaje opcional.', precio: 55, cupos: 20, k: -6 * 7 + 5, img: 'assets/fotos/equipo/chef-emplatando.jpg', preventa: false, past: true },
  { id: 'ev-mezcal', titulo: 'Noche de mezcal y brasas', colab: 'Casa de mezcal invitada (demo)', desc: 'Tres mezcales, fuego vivo y platos para compartir.', precio: 42, cupos: 22, k: -2 * 7 + 4, img: 'assets/fotos/cocteles/coctel-rojo.jpg', preventa: false, past: true },
  { id: 'ev-vinos-altura', titulo: 'Cata de vinos de altura y maridaje', colab: 'Bodega invitada (demo)', desc: 'Vinos de valles altos con cuatro pasos del chef. Cupos muy limitados.', precio: 48, cupos: 24, k: 7 + 4, img: 'assets/fotos/ambiente/llama-paja.jpg', preventa: true, preventaHasta: 2 },
  { id: 'ev-cena-japon', titulo: 'Cena del mundo: Japón y los Andes', colab: 'Colaboración con chef invitado (demo)', desc: 'Una cena que une técnicas japonesas con productos de la sierra. Seis tiempos.', precio: 58, cupos: 18, k: 21 + 5, img: 'assets/fotos/equipo/chef-retrato.jpg', preventa: true, preventaHasta: 9 }
];

// ---------- MIEMBROS Y VISITAS ----------
const NOMBRES = ['Camila', 'Mateo', 'Sofía', 'Joaquín', 'Valeria', 'Andrés', 'Daniela', 'Sebastián', 'Paula', 'Nicolás', 'Gabriela', 'David', 'Mónica', 'Felipe', 'Andrea', 'Esteban', 'Carolina', 'Santiago', 'Lucía', 'Diego', 'Fernanda', 'Martín', 'Isabela', 'Bryan', 'Verónica', 'Cristian', 'Karla', 'Pablo', 'Jessica', 'Ricardo', 'Tatiana', 'Alejandro', 'Mariana', 'Javier', 'Natalia', 'Henry', 'Pamela', 'Israel', 'Lorena', 'Marco', 'Estefanía', 'Xavier', 'Cecilia', 'Patricio', 'Adriana', 'Fabián', 'Silvana', 'Leonardo', 'Evelyn', 'Roberto'];
const APELLIDOS = ['Villacís', 'Naranjo', 'Salazar', 'Cevallos', 'Mera', 'Altamirano', 'Barrionuevo', 'Freire', 'Paredes', 'Garcés', 'Jácome', 'Lascano', 'Sánchez', 'Vargas', 'Proaño', 'Acosta', 'Chiriboga', 'Escobar', 'Moya', 'Tapia', 'Zurita', 'Sevilla', 'Bonilla', 'Arboleda', 'Cárdenas', 'Pazmiño', 'Haro', 'Medina', 'Orozco', 'Toscano'];
const ALERGIAS = ['gluten', 'lacteos', 'mariscos', 'frutos secos', 'huevo'];
const ORIGEN = [['juego', 30], ['menu', 28], ['landing', 14], ['mesero', 28]];
const OPEN = [2, 3, 4, 5, 6]; // mod 7 → mié..dom (k=0 es lunes)
const mod7 = k => ((k % 7) + 7) % 7;
const nextOpen = k => { while (!OPEN.includes(mod7(k))) k++; return k; };
const hora = () => { const h = wpick([[18, 12], [19, 24], [20, 30], [21, 22], [22, 8]]); return `${h}:${String(ri(0, 5) * 10 + (h === 18 ? 15 : 0) % 60).padStart(2, '0')}`; };
const fixT = t => { let [h, m] = t.split(':').map(Number); if (m > 59) m = 55; return `${h}:${String(m).padStart(2, '0')}`; };

const N = 180;
const members = [];
const visits = [];
const usados = new Set();
for (let i = 0; i < N; i++) {
  let nombre;
  do { nombre = `${pick(NOMBRES)} ${pick(APELLIDOS)}`; } while (usados.has(nombre));
  usados.add(nombre);
  const arq = wpick([['vip', 11], ['regular', 20], ['ocasional', 33], ['unavez', 26], ['perdido', 10]]);
  let jw = Math.floor(17 * Math.pow(rnd(), 1.6));
  if (arq === 'perdido') jw = ri(9, 16);
  if (arq === 'vip' || arq === 'regular') jw = Math.max(jw, ri(3, 15));
  const jk = nextOpen(-jw * 7 + wpick([[2, 6], [3, 10], [4, 24], [5, 30], [6, 20]]));
  members.push({ i, nombre, arq, jk });
}
members.sort((a, b) => a.jk - b.jk);   // número de miembro = orden de alta
members.forEach((m, n) => { m.i = n; });

function addV(m, k, extra = {}) {
  const tier = m.arq === 'vip' ? 38 : m.arq === 'regular' ? 28 : 23;
  const pax = wpick([[1, 10], [2, 45], [3, 15], [4, 20], [5, 5], [6, 5]]);
  const pp = Math.max(14, tier + (rnd() - 0.5) * 14);
  visits.push({ m: m.i, k, t: fixT(hora()), a: Math.round(pax * pp), p: pax, ...extra });
}
for (const m of members) {
  let k = m.jk;
  addV(m, k);
  const gap = { vip: [6, 12], regular: [12, 21], ocasional: [21, 45], unavez: null, perdido: [9, 18] }[m.arq];
  if (!gap) continue;
  let max = m.arq === 'perdido' ? ri(1, 3) : 99;
  while (max-- > 0) {
    k = nextOpen(k + ri(gap[0], gap[1]));
    if (k > 6) break;
    // los "perdidos" no deben volver: sus visitas terminan hace > 45 días
    if (m.arq === 'perdido' && k > -50) break;
    addV(m, k);
  }
}
// Visitas por eventos pasados
const evAsist = {};
for (const ev of events.filter(e => e.past)) {
  const elig = members.filter(m => m.jk < ev.k - 1 && m.arq !== 'perdido' || (m.jk < ev.k - 1 && rnd() < 0.3));
  const n = Math.round(ev.cupos * (0.8 + rnd() * 0.18));
  const chosen = [...elig].sort(() => rnd() - 0.5).slice(0, n);
  evAsist[ev.id] = chosen.map(m => ({ m: m.i, asistio: rnd() > 0.06 }));
  for (const c of evAsist[ev.id]) {
    if (!c.asistio) continue;
    const mm = members[c.m]; const pax = rnd() < 0.3 ? 2 : 1;
    visits.push({ m: mm.i, k: ev.k, t: '20:00', a: ev.precio * pax, p: pax, ev: ev.id });
  }
}
// Reservas de próximos eventos
const reservasFut = {};
for (const ev of events.filter(e => !e.past)) {
  const n = Math.round(ev.cupos * (ev.id === 'ev-vinos-altura' ? 0.62 : 0.28));
  reservasFut[ev.id] = [...members].filter(m => m.arq !== 'perdido').sort(() => rnd() - 0.5).slice(0, n).map(m => ({ m: m.i, asistio: false }));
}
events.forEach(e => { e.reservas = e.past ? evAsist[e.id] : reservasFut[e.id]; });

// Perfil de cada miembro
const first = {}; visits.forEach(v => { if (!(v.m in first) || v.k < first[v.m]) first[v.m] = v.k; });
const cumpleSemana = new Set([]);
const candidatos = members.filter(m => (m.arq !== 'unavez')).slice(10, 80);
while (cumpleSemana.size < 6) cumpleSemana.add(pick(candidatos).i);
const out = members.map(m => {
  const jk = first[m.i] ?? m.jk;
  const bo = cumpleSemana.has(m.i) ? [0, 1, 2, 3, 4, 5, 6][[...cumpleSemana].indexOf(m.i)] : ri(7, 364);
  return {
    i: m.i,
    n: m.nombre,
    tel: '099000' + String(1000 + m.i * 37 % 9000).padStart(4, '0'),
    jk,
    bo,
    o: wpick(ORIGEN),
    bebida: wpick([['cerveza', 30], ['coctel', 35], ['vino', 25], ['sinalcohol', 10]]),
    ale: rnd() < 0.14 ? [pick(ALERGIAS)] : [],
    fav: rnd() < 0.7 ? pick(FOODS) : null,
    news: rnd() < 0.78
  };
});
// notas y etiquetas de ejemplo
const vipIdx = [...new Set(visits.map(v => v.m))].slice(0, 400);
out[vipIdx[2]].notas = [{ k: -20, by: 'Dueño', txt: 'Prefiere la mesa junto a la ventana.' }];
out[vipIdx[9]].notas = [{ k: -40, by: 'Mesero · Andrea', txt: 'Aniversario en marzo. Le gusta el vino tinto.' }];
out[vipIdx[15]].tags = ['prensa'];
out[vipIdx[21]].tags = ['amigo de la casa'];
out[vipIdx[27]].notas = [{ k: -12, by: 'Mesero · Luis', txt: 'Alergia severa a mariscos, avisar a cocina.' }];

// ---------- JUEGO + TRACKING ----------
const scores = [['Camila', 34.2, 5], ['Mateo', 38.9, 22], ['Sofía', 41.5, 31], ['Joaquín', 44.0, 52], ['Valeria', 47.3, 60], ['Andrés', 51.8, 75], ['Paula', 53.1, 90], ['Nicolás', 57.6, 110]].map(([n, t, h]) => ({ n, t, h }));
const tracking = [];
for (let w = 16; w >= 0; w--) {
  const plays = Math.round(14 + (17 - w) * 1.3 + rnd() * 8);
  for (let p = 0; p < plays; p++) {
    const k = nextOpen(-w * 7 + ri(0, 6));
    if (k > 6) continue;
    tracking.push({ e: 'game_play', k });
    if (rnd() < 0.46) tracking.push({ e: 'game_win', k });
  }
}

const seed = { v: 1, config, menu: M, events, members: out, visits, scores, tracking };

// Serialización: bloques grandes en una línea por registro
const line = a => '[\n' + a.map(x => '    ' + JSON.stringify(x)).join(',\n') + '\n  ]';
const txt = '{\n' +
  '  "v": 1,\n' +
  '  "config": ' + JSON.stringify(config, null, 2).replace(/\n/g, '\n  ') + ',\n' +
  '  "menu": ' + line(M) + ',\n' +
  '  "events": ' + JSON.stringify(events, null, 1).replace(/\n\s*/g, ' ') .replace(/\},\s*\{/g, '},\n    {').replace(/^\[ /, '[\n    ').replace(/ \]$/, '\n  ]') + ',\n' +
  '  "members": ' + line(out) + ',\n' +
  '  "visits": ' + line(visits) + ',\n' +
  '  "scores": ' + JSON.stringify(scores) + ',\n' +
  '  "tracking": ' + line(tracking) + '\n}\n';
JSON.parse(txt); // valida
writeFileSync(OUT, txt);
console.log(`seed.json: ${out.length} miembros, ${visits.length} visitas, ${M.length} platos/bebidas, ${events.length} eventos, ${tracking.length} eventos de tracking · ${(txt.length / 1024).toFixed(0)} KB`);
const lv = { v: 0, e: 0, n: 0 }; const cnt = {}; visits.forEach(v => cnt[v.m] = (cnt[v.m] || 0) + 1);
Object.values(cnt).forEach(c => { if (c >= 10) lv.n++; else if (c >= 5) lv.e++; else lv.v++; });
console.log('niveles aprox (por visitas)', lv);
