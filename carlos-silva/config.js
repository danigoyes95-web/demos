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
  comunidad: ['assets/comunidad/1.jpg', 'assets/comunidad/2.jpg', 'assets/comunidad/3.jpg', 'assets/comunidad/4.jpg', 'assets/comunidad/5.jpg', 'assets/comunidad/6.jpg', 'assets/comunidad/7.jpg', 'assets/comunidad/8.jpg', 'assets/comunidad/9.jpg'],
  servicios: [
    ['Guía nutricional', 'apple'], ['Plan alimenticio (Dieta)', 'plate'], ['Chequeo InBody mensual', 'scale'],
    ['Apoyo vía WhatsApp 24/7', 'chat'], ['Seguimiento 1:1', 'user'], ['Rutinas personalizadas', 'dumbbell'],
    ['Evaluación técnica semanal', 'check'], ['Planes presenciales y virtuales', 'pin'], ['Asesoría en suplementación deportiva', 'pill']
  ]
};
