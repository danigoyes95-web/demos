/* Datos del coach · lo único que se cambia por cliente. MODO DEMO: todo se guarda solo en este navegador (localStorage). */
window.COACH = {
  app: 'FitZone Training',
  nombre: 'Carlos Silva', titulo: 'Personal Trainer', lema: 'Asume el desafío para un cuerpo fuerte',
  wa: '593998094368', ig: 'krlos_guevara', ig2: 'fitzopne_of',
  // Base de datos. Vacío = modo demo (datos de ejemplo solo en el navegador). Solo va la clave anon, NUNCA service_role.
  supabase: { url: '', anonKey: '', schema: 'carlos' },
  diasPrimerMes: 30,   // días de mensualidad con que arranca un cliente nuevo (el primer mes ya viene pagado)
  claveDemo: 'coach',   // solo modo demo;   
  // Planes de la landing. cupos: número de cupos que quedan (null = solo muestra «Cupos limitados»). precio: texto opcional, ej. '$40 / mes'.
  planes: [
    { id: 'presencial', nombre: 'Presencial', tag: 'Entrena con Carlos', cupos: null, precio: '',
      desc: 'Sesiones en persona con corrección técnica en vivo y todo el seguimiento de FitZone.',
      items: ['Todo lo incluido en la asesoría (guía nutricional, dieta, InBody, apoyo 24/7)', 'Corrección de técnica en cada ejercicio', 'Horarios: 5 am a 11 am · 4 pm a 9 pm'] },
    { id: 'semipresencial', nombre: 'Semipresencial', tag: 'Lo mejor de los dos mundos', cupos: null, precio: '',
      desc: 'Combina sesiones presenciales con seguimiento a distancia durante la semana.',
      items: ['Sesiones presenciales según tu agenda', 'Rutina y plan alimenticio en tu portal', 'Apoyo por WhatsApp y evaluación técnica semanal'] },
    { id: 'virtual', nombre: 'Virtual', tag: 'Desde donde estés', cupos: null, precio: '',
      desc: 'Entrena en casa o en tu gimnasio con la guía de Carlos a un mensaje de distancia.',
      items: ['Rutina personalizada con referencia visual de cada ejercicio', 'Plan alimenticio con calorías, macros y horarios', 'Seguimiento 1:1 y apoyo por WhatsApp 24/7'] }
  ],
  // Fotos de la comunidad: súbelas a assets/comunidad/ y agrega aquí su nombre, ej. ['assets/comunidad/foto1.jpg']
  // Formas de pago que ven los clientes en su app (para que renueven a tiempo). Se cambian aquí.
  pagos: {
    titular: 'Carlos Silva Guevara', ci: '1803807500', email: 'krlos9698@gmail.com',
    cuentas: [ { banco: 'Banco Guayaquil', tipo: 'Ahorros', num: '0043086159', color: '#ff2d8a' }, { banco: 'Banco Pichincha', tipo: 'Ahorros', num: '2204322169', color: '#ffd400' } ],
    nota: 'Haz tu transferencia o depósito y envía el comprobante a Carlos por WhatsApp: así tu mes se activa o se renueva sin quedarte sin plan.'
  },
  // Testimonios y cambios físicos (sección «Los resultados hablan por sí mismos»). Si está vacío, la sección no se muestra en la página pública.
  // Cada uno: { nombre: 'Nombre', rol: 'Alumna a distancia', texto: 'Testimonio…', foto: 'assets/resultados/1.jpg', antes: 'assets/resultados/1-antes.jpg' }   («antes» es opcional: si lo pones, se muestra antes/después)
  resultados: [
    { historia: true, etiqueta: 'Historia de un atleta', titulo: 'De la preparación al podio',
      nombre: 'Atleta FitZone Training', rol: 'Competidor · entrenado por Carlos Silva',
      texto: 'Todo gran resultado empieza con una decisión. Este atleta confió en el plan de Carlos y se puso a trabajar en serio: entrenos medidos, comidas planificadas y revisiones constantes. Semana a semana fue ajustando detalles, sin atajos y sin excusas. El día de la competencia el esfuerzo se vio en el escenario, y volvió a casa con el cuello lleno de medallas. Para Carlos no es solo un trofeo: es la prueba de que, con disciplina y buena guía, el cuerpo y la mente llegan mucho más lejos de lo que uno cree.',
      foto: 'assets/comunidad/3.jpg' }
  ],
  comunidad: ['assets/comunidad/1.jpg', 'assets/comunidad/2.jpg', 'assets/comunidad/3.jpg', 'assets/comunidad/4.jpg', 'assets/comunidad/5.jpg', 'assets/comunidad/6.jpg', 'assets/comunidad/7.jpg', 'assets/comunidad/8.jpg', 'assets/comunidad/9.jpg'],
  servicios: [
    ['Guía nutricional', 'apple'], ['Plan alimenticio (Dieta)', 'plate'], ['Chequeo InBody mensual', 'scale'],
    ['Apoyo vía WhatsApp 24/7', 'chat'], ['Seguimiento 1:1', 'user'], ['Rutinas personalizadas', 'dumbbell'],
    ['Evaluación técnica semanal', 'check'], ['Planes presenciales y virtuales', 'pin'], ['Asesoría en suplementación deportiva', 'pill']
  ]
};
