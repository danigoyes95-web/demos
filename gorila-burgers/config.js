/* Gorila Burgers · Ambato — datos del cliente para la demo.
   Todo número o dato del cliente vive SOLO aquí. Lo que falta va como [MARCADOR]. */
window.DEMO = {
  cliente: 'Gorila Burgers',
  ciudad: 'Ambato',
  waCliente: '593987188071',          // WhatsApp de pedidos (piezas de IG y Facebook)
  waAgencia: '593983139928',          // solo para demo.js (sugerencias) y la propuesta
  direccion: 'FICOA, Las Frambuesas y Guaytambos, frente al Parque de los Quindes',
  horario: '[MARCADOR: horario por día]',
  domicilio: 'confirmar',             // true | false | 'confirmar' (aún no sabemos si hace domicilio)
  envio: null,                        // costo de envío en centavos; null = "por confirmar"
  claveDemo: 'gorila_demo_pedidos',   // pedidos de prueba guardados en el navegador para el panel
  instagram: 'https://www.instagram.com/gorila_burgerambato/',
  facebook: 'https://www.facebook.com/p/Gorila-Burger-61558488550023/',
  // SOLO premium.html. EJEMPLO para mostrar el envío automático: Gorila define sus sectores y precios.
  sectoresEjemplo: [
    { nombre: 'FICOA', costo: 100 }, { nombre: 'Atocha', costo: 150 }, { nombre: 'Miraflores', costo: 150 },
    { nombre: 'Centro', costo: 200 }, { nombre: 'Huachi', costo: 250 }, { nombre: 'Izamba', costo: 300 }
  ]
};
