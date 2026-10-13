/* Datos del negocio · lo único que se cambia por cliente.
   Los números de WhatsApp viven solo aquí. [CONFIRMAR] = dato pendiente con el cliente.
   OJO: TODO el catálogo (nombres, presentaciones, grados, precios y costos) es de EJEMPLO para la demo.
   Se reemplaza con la lista real del cliente antes de enseñarla como suya. */
window.TIENDA = {
  nombre: 'La Tasca Licores',
  lema: 'Tienda de vinos, cervezas y licores',
  catalogoEjemplo: true,                  // catálogo, precios y costos de ejemplo: quitar al cargar los reales
  ciudad: 'Ambato',                       // Los Guaytambos, Ambato, Ecuador 180102 (Instagram)
  direccion: 'Los Guaytambos, Ambato',    // [CONFIRMAR] dirección exacta
  wa: '593983139928',                     // [CONFIRMAR] PRUEBA: número de la agencia. Antes de enviar: el de La Tasca (en su Instagram se ve 099 990… cortado)
  horario: '[CONFIRMAR] horario',         // [CONFIRMAR]
  instagram: 'https://www.instagram.com/latascalicores/',
  edadMinima: 18,
  envio: { domicilio: 1.50, gratisDesde: 30 },   // [CONFIRMAR] costo por sector y monto de envío gratis
  sectores: ['Los Guaytambos', 'Ficoa', 'Atocha', 'Centro', 'Huachi', 'Otro sector'], // [CONFIRMAR] sectores de entrega
  // Restricciones de venta (horarios, días sin venta): [CONFIRMAR] con Daniel antes de publicarlas en la web.
  restricciones: '',
  supabase: { url: '', anonKey: '', schema: 'la_tasca' },   // vacío = modo demo
  // Categorías = los círculos del menú de abajo.
  categorias: [
    { id: 'whisky',      nombre: 'Whisky',      icono: 'vaso' },
    { id: 'ron',         nombre: 'Ron',         icono: 'botella' },
    { id: 'vodka',       nombre: 'Vodka',       icono: 'botella-alta' },
    { id: 'tequila',     nombre: 'Tequila',     icono: 'tequila' },
    { id: 'vino',        nombre: 'Vino',        icono: 'copa' },
    { id: 'cerveza',     nombre: 'Cerveza',     icono: 'cerveza' },
    { id: 'aguardiente', nombre: 'Aguardiente', icono: 'trago' },
    { id: 'cigarrillos', nombre: 'Cigarrillos', icono: 'cigarro' },
    { id: 'mixers',      nombre: 'Mixers y hielo', icono: 'hielo' }
  ],
  /* Precio y costo por presentación. Los cigarrillos traen `variantes` (suelto o cajetilla).
     ideal: coctel | regalo | fiesta | solo */
  productos: [
    { id: 'jw-red',     cat: 'whisky', nombre: 'Johnnie Walker Red Label',  pack: '750 ml', grados: 40, origen: 'Escocia', ideal: ['coctel', 'fiesta'], precio: 24.00, costo: 18.50, tag: 'El más pedido' },
    { id: 'old-parr',   cat: 'whisky', nombre: 'Old Parr 12 años',          pack: '750 ml', grados: 40, origen: 'Escocia', ideal: ['regalo', 'solo'],   precio: 38.00, costo: 30.00 },
    { id: 'buchanans',  cat: 'whisky', nombre: "Buchanan's 12 años",        pack: '750 ml', grados: 40, origen: 'Escocia', ideal: ['regalo', 'solo'],   precio: 42.00, costo: 34.00 },
    { id: 'abuelo',     cat: 'ron',    nombre: 'Ron Abuelo Añejo',          pack: '750 ml', grados: 40, origen: 'Panamá',  ideal: ['solo', 'coctel'],   precio: 19.00, costo: 14.50 },
    { id: 'havana-7',   cat: 'ron',    nombre: 'Havana Club 7 años',        pack: '750 ml', grados: 40, origen: 'Cuba',    ideal: ['regalo', 'solo'],   precio: 27.00, costo: 21.00 },
    { id: 'ron-blanco', cat: 'ron',    nombre: 'Ron blanco',                pack: '750 ml', grados: null, origen: null,    ideal: ['coctel', 'fiesta'], precio: 12.00, costo: 8.50 },
    { id: 'absolut',    cat: 'vodka',  nombre: 'Absolut Blue',              pack: '750 ml', grados: 40, origen: 'Suecia',  ideal: ['coctel', 'fiesta'], precio: 22.00, costo: 16.50 },
    { id: 'absolut-c',  cat: 'vodka',  nombre: 'Absolut Citron',            pack: '750 ml', grados: 40, origen: 'Suecia',  ideal: ['coctel'],           precio: 23.00, costo: 17.50 },
    { id: 'cuervo',     cat: 'tequila', nombre: 'José Cuervo Especial Silver', pack: '750 ml', grados: 38, origen: 'México', ideal: ['fiesta', 'coctel'], precio: 24.00, costo: 18.00 },
    { id: 'olmeca',     cat: 'tequila', nombre: 'Olmeca Blanco',            pack: '750 ml', grados: 38, origen: 'México', ideal: ['fiesta', 'coctel'], precio: 21.00, costo: 15.50 },
    { id: 'casillero-c', cat: 'vino',  nombre: 'Casillero del Diablo Cabernet Sauvignon', pack: '750 ml', grados: 13.5, origen: 'Chile', ideal: ['regalo', 'solo'], precio: 11.00, costo: 8.00, tag: 'Para regalar' },
    { id: 'casillero-m', cat: 'vino',  nombre: 'Casillero del Diablo Merlot', pack: '750 ml', grados: 13.5, origen: 'Chile', ideal: ['regalo', 'solo'], precio: 11.00, costo: 8.00 },
    { id: 'vino-blanco', cat: 'vino',  nombre: 'Vino blanco',              pack: '750 ml', grados: null, origen: null,    ideal: ['regalo'],           precio: 9.00,  costo: 6.50 },
    { id: 'pilsener',   cat: 'cerveza', nombre: 'Pilsener',                pack: '600 ml · botella', grados: 4.2, origen: 'Ecuador', ideal: ['fiesta'], precio: 1.60, costo: 1.15 },
    { id: 'pilsener-6', cat: 'cerveza', nombre: 'Pilsener · 6 pack',       pack: '6 × 355 ml',       grados: 4.2, origen: 'Ecuador', ideal: ['fiesta'], precio: 6.50, costo: 5.00 },
    { id: 'corona',     cat: 'cerveza', nombre: 'Corona',                  pack: '355 ml · botella', grados: 4.5, origen: 'México',  ideal: ['fiesta', 'solo'], precio: 1.90, costo: 1.35 },
    { id: 'heineken',   cat: 'cerveza', nombre: 'Heineken',                pack: '355 ml · botella', grados: 5,   origen: 'Países Bajos', ideal: ['fiesta', 'solo'], precio: 1.80, costo: 1.30 },
    { id: 'caja-cerveza', cat: 'cerveza', nombre: 'Caja de cerveza',       pack: '12 botellas', grados: null, origen: null, ideal: ['fiesta'], precio: 19.00, costo: 15.00 },
    { id: 'aguardiente', cat: 'aguardiente', nombre: 'Aguardiente de caña', pack: '750 ml', grados: null, origen: 'Ecuador', ideal: ['fiesta'], precio: 8.00, costo: 5.50 },
    { id: 'aguardiente-g', cat: 'aguardiente', nombre: 'Aguardiente de caña', pack: '375 ml', grados: null, origen: 'Ecuador', ideal: ['fiesta'], precio: 4.50, costo: 3.10 },
    { id: 'marlboro',   cat: 'cigarrillos', nombre: 'Marlboro Rojo', pack: '', grados: null, origen: null, ideal: [],
      variantes: [{ k: 'suelto', etiqueta: 'Suelto', pack: '1 unidad', precio: 0.25, costo: 0.18 }, { k: 'cajetilla', etiqueta: 'Cajetilla', pack: '20 unidades', precio: 4.50, costo: 3.60 }] },
    { id: 'lucky',      cat: 'cigarrillos', nombre: 'Lucky Strike', pack: '', grados: null, origen: null, ideal: [],
      variantes: [{ k: 'suelto', etiqueta: 'Suelto', pack: '1 unidad', precio: 0.25, costo: 0.18 }, { k: 'cajetilla', etiqueta: 'Cajetilla', pack: '20 unidades', precio: 4.25, costo: 3.40 }] },
    { id: 'belmont',    cat: 'cigarrillos', nombre: 'Belmont', pack: '', grados: null, origen: null, ideal: [],
      variantes: [{ k: 'suelto', etiqueta: 'Suelto', pack: '1 unidad', precio: 0.20, costo: 0.14 }, { k: 'cajetilla', etiqueta: 'Cajetilla', pack: '20 unidades', precio: 3.50, costo: 2.80 }] },
    { id: 'hielo',      cat: 'mixers', nombre: 'Hielo en bolsa',     pack: '2 kg',    grados: null, origen: null, ideal: ['coctel', 'fiesta'], precio: 1.50, costo: 0.80 },
    { id: 'tonica',     cat: 'mixers', nombre: 'Agua tónica',        pack: '400 ml',  grados: null, origen: null, ideal: ['coctel'],           precio: 1.20, costo: 0.80 },
    { id: 'cola',       cat: 'mixers', nombre: 'Gaseosa cola',       pack: '1,5 L',   grados: null, origen: null, ideal: ['coctel', 'fiesta'], precio: 1.75, costo: 1.20 },
    { id: 'energizante', cat: 'mixers', nombre: 'Energizante',       pack: '250 ml',  grados: null, origen: null, ideal: ['fiesta'],           precio: 1.60, costo: 1.05 },
    { id: 'limones',    cat: 'mixers', nombre: 'Limones',            pack: 'malla',   grados: null, origen: null, ideal: ['coctel'],           precio: 1.00, costo: 0.60 }
  ],
  // Combos armados: ids de productos; los cigarrillos van como 'id|variante'
  combos: [
    { id: 'previa',   nombre: 'Para la previa',      txt: 'Cerveza fría y algo fuerte para arrancar.', items: ['pilsener-6', 'cuervo', 'limones', 'hielo'] },
    { id: 'regalar',  nombre: 'Para regalar',        txt: 'Un whisky de 12 años y un vino para acompañar.', items: ['old-parr', 'casillero-c'] },
    { id: 'cocteleria', nombre: 'Coctelería en casa', txt: 'Todo para preparar la primera ronda.', items: ['absolut', 'tonica', 'limones', 'hielo'] }
  ],
  ideales: { coctel: 'Coctel', regalo: 'Regalo', fiesta: 'Fiesta', solo: 'Solo o con hielo' }
};
