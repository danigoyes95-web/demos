/* Datos del negocio · lo único que se cambia por cliente.
   Los números de WhatsApp viven solo aquí. [CONFIRMAR] = dato pendiente con el cliente. */
window.TIENDA = {
  nombre: 'Dogo',
  lema: 'Snacks 100 % naturales para perros',
  ciudad: 'Quito',                   // [CONFIRMAR]
  wa: '593999999999',                // [CONFIRMAR] WhatsApp del negocio (593XXXXXXXXX)
  horario: 'Lun a sáb · 9:00 a 19:00', // [CONFIRMAR]
  envio: { domicilio: 2.00, gratisDesde: 20 }, // [CONFIRMAR] costo de envío y monto de envío gratis
  // Precio y costo por pack (tabla de precios del dueño). El panel puede editarlos.
  productos: [
    { id: 'patitas',   nombre: 'Patitas de pollo',        pack: '10 unidades', precio: 2.50, costo: 1.10, icono: 'pata',
      desc: 'Crujientes y fáciles de dar. El premio del día a día.', tag: 'El más pedido',
      bench: 'Con Patitas (Quito): 12 u a $3,75–5,00', conf: 'alta', confNota: 'Ecuador, en USD' },
    { id: 'pulmon',    nombre: 'Pulmón de res',           pack: '100 g',       precio: 4.50, costo: 1.75, icono: 'hoja',
      desc: 'Liviano y suave. Se parte en trocitos para entrenar.', tag: 'Para entrenar',
      bench: 'Dogelthy (México): 100 g a ~$11,84', conf: 'media', confNota: 'Regional, no Ecuador' },
    { id: 'orejas',    nombre: 'Orejas de res',           pack: '5 unidades',  precio: 8.00, costo: 4.00, icono: 'oreja',
      desc: 'Masticación larga para que se entretenga un buen rato.', tag: '',
      bench: 'Éxito (Colombia): 2 u a ~$1,60/u', conf: 'media', confNota: 'Regional, no Ecuador' },
    { id: 'aros',      nombre: 'Aros de tráquea',         pack: '250 g',       precio: 6.90, costo: 4.13, icono: 'aro',
      desc: 'Aros crocantes de tráquea deshidratada.', tag: '',
      bench: 'Sin competidor identificado (margen interno)', conf: 'baja', confNota: 'Dato de mercado ausente' },
    { id: 'traquea-m', nombre: 'Tráquea entera · mediana', pack: '1 pieza',    precio: 3.50, costo: 1.86, icono: 'tubo',
      desc: 'Pieza entera para perros pequeños y medianos.', tag: '',
      bench: 'Éxito (Colombia): pieza individual', conf: 'riesgo', confNota: 'Costo varía por tamaño' },
    { id: 'traquea-g', nombre: 'Tráquea entera · grande',  pack: '1 pieza',    precio: 5.50, costo: 3.10, icono: 'tubo',
      desc: 'Pieza grande para perros de raza grande.', tag: '',
      bench: 'Éxito (Colombia): pieza individual', conf: 'riesgo', confNota: 'Costo varía por tamaño' }
  ],
  // Guía rápida por tamaño de perro (ids de productos)
  guia: {
    pequeno: { txt: 'Perro pequeño (hasta 10 kg)', ids: ['patitas', 'pulmon', 'traquea-m'] },
    mediano: { txt: 'Perro mediano (10 a 25 kg)',  ids: ['patitas', 'aros', 'traquea-m'] },
    grande:  { txt: 'Perro grande (más de 25 kg)', ids: ['orejas', 'aros', 'traquea-g'] }
  }
};
