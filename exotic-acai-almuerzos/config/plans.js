/* ═══════════════════════════════════════════════════════════════════════
   Exotic Açaí · Suscripción de almuerzos — CONFIGURACIÓN EDITABLE
   Todo lo marcado como PROVISIONAL debe confirmarse con el cliente.
   Precios = PVP con IVA incluido. Costos = ingredientes + empaque por almuerzo.
   ═══════════════════════════════════════════════════════════════════════ */
window.CFG = {
  demo: true,
  hoyDemo: '2026-11-05',          // "hoy" fijo para que el demo siempre se vea igual (jueves)

  negocio: {
    nombre: 'Exotic Açaí',
    lema: 'Comida tropical',
    ciudad: 'Ambato',
    direccion: 'Azorín y Becquer (Cdla. España)',
    whatsapp: '593983139928',     // PROVISIONAL (tomado de la demo anterior de bowls)
    instagram: 'https://www.instagram.com/exotic_acai/',
    moneda: 'USD',
    iva: 0.15,                    // PROVISIONAL: confirmar con contabilidad (Salo)
    horarioLocal: 'Lun–Vie 8:00–18:00'
  },

  /* ── Planes (PROVISIONAL: precios y costos) ── */
  plans: {
    oficina: {
      id: 'oficina', nombre: 'Plan Oficina', publico: 'oficina',
      corto: 'Comer sano sin pensar',
      descripcion: 'Un almuerzo equilibrado cada día laborable, listo a la hora que lo necesitas.',
      precio20: 85, precio12: 55,            // 20 almuerzos (lun–vie) · 12 almuerzos (3 días/sem.)
      costo: 2.20,                           // costo estimado por almuerzo
      incluye: ['Menú semanal rotativo', 'Entrega puntual en tu oficina o retiro en local', 'Calorías y macros en cada plato', 'Pausa tus días cuando no estés']
    },
    fit: {
      id: 'fit', nombre: 'Plan Fit / Gym', publico: 'gym',
      corto: 'Proteína en cada plato',
      descripcion: 'Platos altos en proteína con los gramos a la vista. Porción para volumen o definición.',
      precio20: 105, precio12: 68,
      costo: 2.85,
      incluye: ['35–52 g de proteína por plato', 'Porción de volumen o definición', 'Macros (P/C/G) y kcal por plato', 'Entrega temprano, antes o después de entrenar']
    },
    especial: {
      id: 'especial', nombre: 'Plan Especial', publico: 'especial',
      corto: 'Dieta a tu medida',
      descripcion: 'Keto, vegano, vegetariano, sin gluten o bajo en azúcar, con menús diseñados por Leo, nutricionista.',
      precio20: 110, precio12: 72,
      costo: 3.05,
      incluye: ['Menús diseñados por Leo, nutricionista', 'Keto, vegano, vegetariano, sin gluten o bajo en azúcar', 'Registro de alergias y alimentos que no comes', 'Ajustes de menú cuando los necesites']
    }
  },
  frecuencias: { 20: { almuerzos: 20, label: '5 días a la semana', dias: 'Lun a Vie' }, 12: { almuerzos: 12, label: '3 días a la semana', dias: 'Lun, Mié y Vie' } },

  /* ── Públicos (cambian el copy y el plan destacado en la landing) ── */
  publicos: {
    oficina:  { id: 'oficina', label: 'Oficina', plan: 'oficina',
      h1: 'Almuerzo sano en tu oficina, sin pensar qué comer.',
      sub: 'Eliges tu plan una vez al mes y cada día laborable te llega un almuerzo equilibrado, a tu hora y a precio fijo.',
      puntos: ['Entrega puntual', 'Precio fijo al mes', 'Cero trámites'] },
    gym:      { id: 'gym', label: 'Gym', plan: 'fit',
      h1: 'Tu proteína del día, ya servida.',
      sub: 'Gramos de proteína y kcal visibles en cada plato, con porción para volumen o definición. Tú solo entrenas.',
      puntos: ['35–52 g de proteína', 'Macros por plato', 'Volumen o definición'] },
    especial: { id: 'especial', label: 'Dieta especial', plan: 'especial',
      h1: 'Keto, vegano, sin gluten o bajo en azúcar, sin cocinar.',
      sub: 'Menús diseñados por Leo, nutricionista de Exotic Açaí, y ajustados a lo que comes y a lo que no.',
      puntos: ['Diseñado por Leo', 'Registro de alergias', 'Ajustes de menú'] }
  },

  /* ── Entrega (PROVISIONAL: zonas, extras y horarios) ── */
  zonas: [
    { id: 'centro',     nombre: 'Centro',     extra: 0 },
    { id: 'ficoa',      nombre: 'Ficoa',      extra: 0 },
    { id: 'atocha',     nombre: 'Atocha',     extra: 0 },
    { id: 'huachi',     nombre: 'Huachi',     extra: 5 },
    { id: 'izamba',     nombre: 'Izamba',     extra: 8 },
    { id: 'miraflores', nombre: 'Miraflores', extra: 8 },
    { id: 'retiro',     nombre: 'Retiro en local', extra: 0, local: true }
  ],
  ventanas: ['12:00–12:30', '12:30–13:00', '13:00–13:30'],
  feriados: ['2026-11-02', '2026-11-03', '2026-12-25', '2027-01-01'],

  /* ── Equipo y roles ── */
  equipo: [
    { id: 'daniel', nombre: 'Daniel', cargo: 'Tecnología y plataforma', rol: 'admin',     iniciales: 'D' },
    { id: 'duenio', nombre: 'Dueño de Exotic Açaí', corto: 'Dueño', cargo: 'Dirección', rol: 'admin', iniciales: 'EA' },
    { id: 'nicolas', nombre: 'Nicolás', cargo: 'Chef · cocina',               rol: 'cocina',    iniciales: 'N' },
    { id: 'leo',     nombre: 'Leo',     cargo: 'Nutricionista · menús',       rol: 'menus',     iniciales: 'L' },
    { id: 'cris',    nombre: 'Cris',    cargo: 'Redes sociales y contenido',  rol: 'contenido', iniciales: 'C' },
    { id: 'salo',    nombre: 'Salo',    cargo: 'Contabilidad y finanzas',     rol: 'finanzas',  iniciales: 'S' }
  ],
  roles: {
    admin: 'Admin', cocina: 'Cocina', menus: 'Menús', contenido: 'Contenido', finanzas: 'Finanzas'
  },
  secciones: [
    { id: 'resultados',  nombre: 'Panel de Resultados', icon: 'chart' },
    { id: 'cocina',      nombre: 'Cocina',              icon: 'pot' },
    { id: 'menus',       nombre: 'Menús',               icon: 'leaf' },
    { id: 'suscriptores',nombre: 'Suscriptores',        icon: 'users' },
    { id: 'marketing',   nombre: 'Marketing / Embudo',  icon: 'funnel' },
    { id: 'finanzas',    nombre: 'Finanzas',            icon: 'coins' },
    { id: 'equipo',      nombre: 'Equipo y permisos',   icon: 'shield' }
  ],
  /* edit = ve y edita · view = solo lectura · resumen = indicadores de su área · (ausente) = sin acceso */
  permisos: {
    admin:     { resultados: 'edit', cocina: 'edit', menus: 'edit', suscriptores: 'edit', marketing: 'edit', finanzas: 'edit', equipo: 'edit' },
    cocina:    { resultados: 'resumen', cocina: 'edit', menus: 'view' },
    menus:     { resultados: 'resumen', cocina: 'view', menus: 'edit' },
    contenido: { resultados: 'resumen', marketing: 'edit' },
    finanzas:  { resultados: 'edit', suscriptores: 'view', marketing: 'view', finanzas: 'edit' }
  },
  /* indicadores / gráficos / alertas visibles en la versión 🔸 resumida de cada rol */
  resumen: {
    cocina:    { kpis: ['entregados', 'activos', 'porciones'], charts: ['dias'], alertas: ['plato'] },
    menus:     { kpis: ['entregados', 'valoracion', 'activos'], charts: ['planes', 'dias'], alertas: ['plato'] },
    contenido: { kpis: ['visitas', 'inicios', 'nuevos', 'conversion'], charts: ['embudo', 'fuentes'], alertas: ['conversion'] }
  },

  etiquetas: ['balanceado', 'alto en proteína', 'keto', 'vegano', 'vegetariano', 'sin gluten', 'bajo en azúcar'],
  restricciones: ['vegano', 'vegetariano', 'keto', 'sin gluten', 'bajo en azúcar'],
  alergias: ['maní', 'frutos secos', 'mariscos', 'lácteos', 'huevo', 'soya'],

  /* costos fijos y parámetros de proyección (PROVISIONAL) */
  finanzas: { churnProyeccion: null /* null = usa el churn de los últimos 3 meses */ }
};
