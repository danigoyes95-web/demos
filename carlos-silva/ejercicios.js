/* Biblioteca de ejercicios con referencia visual: figura esquemática por ángulos (inicio → final) + animación.
   Ángulos en grados medidos desde "abajo" (brazos/piernas) o "arriba" (tronco); + = hacia adelante (derecha). */
(() => {
  const D = Math.PI / 180, S = { t: 56, ua: 28, fa: 26, th: 38, sh: 36, ft: 15 }, FLOOR = 186;
  const dn = (a, l) => [Math.sin(a * D) * l, Math.cos(a * D) * l], up = (a, l) => [Math.sin(a * D) * l, -Math.cos(a * D) * l];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const K = ['x', 't', 'hd', 'ua', 'fa', 'ua2', 'fa2', 'th', 'sh', 'th2', 'sh2', 'ft', 'ft2', 'hy'];
  const full = p => { const q = Object.assign({ x: 110, t: 0, hd: 0, ua: 0, fa: 0, th: 0, sh: 0 }, p);
    q.ua2 = q.ua2 ?? q.ua; q.fa2 = q.fa2 ?? q.fa; q.th2 = q.th2 ?? q.th; q.sh2 = q.sh2 ?? q.sh;
    q.ft = q.ft ?? q.sh + 90; q.ft2 = q.ft2 ?? q.sh2 + 90; q.hy = q.hy ?? 0; return q; };
  function calc(p, g) {
    let h = [p.x, 0]; const s = add(h, up(p.t, S.t)), head = add(s, up(p.t + p.hd, 18));
    const arm = (u, f) => { const e = add(s, dn(u, S.ua)); return [e, add(e, dn(f, S.fa))]; };
    const leg = (a, b, f) => { const k = add(h, dn(a, S.th)), an = add(k, dn(b, S.sh)); return [k, an, add(an, dn(f, S.ft))]; };
    const A1 = arm(p.ua, p.fa), A2 = arm(p.ua2, p.fa2), L1 = leg(p.th, p.sh, p.ft), L2 = leg(p.th2, p.sh2, p.ft2);
    const all = [h, s, head, ...A1, ...A2, ...L1, ...L2];
    let dy;
    if (g === 'all') dy = FLOOR - Math.max(...all.map(q => q[1]));
    else if (typeof g === 'number') dy = g - A1[1][1];
    else dy = FLOOR - Math.max(L1[1][1], L1[2][1], L2[1][1], L2[2][1]);
    const m = q => [q[0], q[1] + dy];
    return { h: m(h), s: m(s), head: m(head), A1: A1.map(m), A2: A2.map(m), L1: L1.map(m), L2: L2.map(m) };
  }
  const f = n => n.toFixed(1), pl = (...a) => a.map(q => f(q[0]) + ',' + f(q[1])).join(' ');
  function draw(p, ex) {
    const P = calc(p, ex.g), o = ex.eq || {}; let out = `<line class="fl" x1="10" y1="${FLOOR + 3}" x2="230" y2="${FLOOR + 3}"/>`;
    const dx = P.s[0] - P.h[0], dy = P.s[1] - P.h[1], L = Math.hypot(dx, dy), d = [dx / L, dy / L], bk = [d[1], -d[0]];
    if (o.banco) { const a = [P.h[0] + bk[0] * 8 - d[0] * 12, P.h[1] + bk[1] * 8 - d[1] * 12], b = [P.s[0] + bk[0] * 8 + d[0] * 10, P.s[1] + bk[1] * 8 + d[1] * 10];
      out += `<polyline class="bn" points="${pl(a, b)}"/><line class="bn" x1="${f(P.h[0] + bk[0] * 8)}" y1="${f(P.h[1] + bk[1] * 8)}" x2="${f(P.h[0] + bk[0] * 8)}" y2="${FLOOR + 3}"/>`;
      if (o.banco === 'asiento') out += `<line class="bn" x1="${f(P.h[0] - 16)}" y1="${f(P.h[1] + 8)}" x2="${f(P.h[0] + 18)}" y2="${f(P.h[1] + 8)}"/>`; }
    if (o.fija) out += `<line class="bn" x1="40" y1="${o.fija}" x2="190" y2="${o.fija}"/><line class="bn" x1="40" y1="${o.fija}" x2="40" y2="${FLOOR}"/><line class="bn" x1="190" y1="${o.fija}" x2="190" y2="${FLOOR}"/>`;
    const lim = (a, c, cls) => `<polyline class="${cls}" points="${pl(a, ...c)}"/>`;
    out += lim(P.h, P.L2, 'li far') + lim(P.s, P.A2, 'li far');
    out += `<polyline class="li" points="${pl(P.h, P.s)}"/>` + `<circle class="hd" cx="${f(P.head[0])}" cy="${f(P.head[1])}" r="10"/>`;
    out += lim(P.h, P.L1, 'li') + lim(P.s, P.A1, 'li');
    const hand = P.A1[1], at = o.sobre === 'hombro' ? [P.s[0] - 4, P.s[1] - 2] : o.sobre === 'cadera' ? [P.h[0] + bk[0] * -2, P.h[1] - 6] : hand;
    if (o.cable) out += `<circle class="eq" cx="${o.cable[0]}" cy="${o.cable[1]}" r="4"/><line class="cb" x1="${o.cable[0]}" y1="${o.cable[1]}" x2="${f(hand[0])}" y2="${f(hand[1])}"/>`;
    if (o.barra) out += `<circle class="eq pl" cx="${f(at[0])}" cy="${f(at[1])}" r="12"/><circle class="eq" cx="${f(at[0])}" cy="${f(at[1])}" r="3"/>`;
    if (o.manc) out += `<rect class="eq pl" x="${f(hand[0] - 8)}" y="${f(hand[1] - 5)}" width="16" height="10" rx="3"/>`;
    return out;
  }
  const svg = (inner, w) => `<svg viewBox="0 0 240 200" ${w ? `width="${w}"` : ''} role="img" aria-hidden="true">${inner}</svg>`;

  /* ---- ejercicios: a = inicio, b = final ---- */
  const L = (p) => p;
  const X = [
    { id: 'press-banca', n: 'Press de banca con barra', gr: 'Pecho', eq: { barra: 1, banco: 1 }, mus: 'Pectoral, tríceps, deltoides anterior', niv: 'Intermedio',
      pasos: ['Acuéstate con los ojos bajo la barra, pies firmes en el suelo y escápulas juntas.', 'Baja la barra controlada hasta rozar la parte media del pecho.', 'Empuja hacia arriba sin despegar glúteos del banco.'],
      err: ['Rebotar la barra en el pecho', 'Codos muy abiertos (90°)', 'Levantar la cadera del banco'], resp: 'Inhala al bajar, exhala al empujar.',
      a: { x: 130, t: -90, th: 62, sh: 0, ua: 180, fa: 180, hd: 0 }, b: { x: 130, t: -90, th: 62, sh: 0, ua: 35, fa: 175 } },
    { id: 'press-inclinado', n: 'Press inclinado con mancuernas', gr: 'Pecho', eq: { manc: 1, banco: 1 }, mus: 'Pectoral superior, hombro, tríceps', niv: 'Intermedio',
      pasos: ['Banco a 30–45°, mancuernas a la altura del pecho.', 'Empuja hasta casi extender los codos juntando las mancuernas arriba.', 'Baja lento hasta sentir estiramiento en el pecho.'],
      err: ['Banco demasiado vertical (trabaja solo hombro)', 'Bloquear los codos arriba', 'Soltar la mancuerna al bajar'], resp: 'Exhala al subir.',
      a: { x: 120, t: -52, th: 80, sh: -4, ua: 25, fa: 175 }, b: { x: 120, t: -52, th: 80, sh: -4, ua: 165, fa: 178 } },
    { id: 'flexiones', n: 'Flexiones de pecho', gr: 'Pecho', eq: {}, g: 'all', mus: 'Pectoral, tríceps, core', niv: 'Principiante',
      pasos: ['Manos bajo los hombros, cuerpo en línea recta de cabeza a talones.', 'Baja el pecho hasta casi tocar el suelo con codos a 45°.', 'Empuja hasta extender los brazos sin hundir la cadera.'],
      err: ['Cadera caída o levantada', 'Mirar al frente y adelantar la cabeza', 'Rango corto'], resp: 'Inhala al bajar, exhala al subir.',
      a: { x: 150, t: 78, th: -78, sh: -78, ua: 0, fa: 0 }, b: { x: 150, t: 84, th: -84, sh: -84, ua: -55, fa: 15 } },
    { id: 'dominadas', n: 'Dominadas', gr: 'Espalda', eq: { fija: 24 }, g: 34, mus: 'Dorsal ancho, bíceps, antebrazo', niv: 'Avanzado',
      pasos: ['Agarre un poco más ancho que los hombros, cuelga con brazos extendidos.', 'Lleva los codos hacia abajo y atrás hasta pasar la barbilla.', 'Baja controlado hasta extender por completo.'],
      err: ['Balancearse (kipping) sin control', 'No bajar del todo', 'Encoger los hombros hacia las orejas'], resp: 'Exhala al subir.',
      a: { t: 3, th: 0, sh: -25, ua: 180, fa: 180 }, b: { t: 0, th: 0, sh: -25, ua: 8, fa: 178 } },
    { id: 'remo-barra', n: 'Remo con barra', gr: 'Espalda', eq: { barra: 1 }, mus: 'Dorsal, romboides, bíceps, lumbar', niv: 'Intermedio',
      pasos: ['Pies al ancho de caderas, rodillas flexionadas, torso inclinado ~45° con espalda neutra.', 'Tira de la barra hacia el abdomen llevando los codos atrás.', 'Baja controlado sin redondear la espalda.'],
      err: ['Espalda redondeada', 'Impulsarse con el torso', 'Mirar hacia arriba'], resp: 'Exhala al tirar.',
      a: { x: 100, t: 60, th: 28, sh: -22, ua: 0, fa: 0 }, b: { x: 100, t: 60, th: 28, sh: -22, ua: -85, fa: -5 } },
    { id: 'jalon', n: 'Jalón al pecho en polea', gr: 'Espalda', eq: { barra: 1, cable: [140, 12], banco: 'asiento' }, mus: 'Dorsal ancho, bíceps', niv: 'Principiante',
      pasos: ['Muslos fijos bajo el rodillo, torso ligeramente inclinado atrás.', 'Tira de la barra hacia la parte alta del pecho llevando los codos abajo.', 'Sube lento hasta extender los brazos.'],
      err: ['Jalar detrás de la nuca', 'Balancear el torso', 'Tirar solo con los bíceps'], resp: 'Exhala al jalar.',
      a: { x: 100, t: -5, th: 85, sh: -3, ua: 170, fa: 175, hd: 0 }, b: { x: 100, t: -12, th: 85, sh: -3, ua: -5, fa: 150 } },
    { id: 'peso-muerto', n: 'Peso muerto', gr: 'Espalda', eq: { barra: 1 }, mus: 'Glúteo, isquios, espalda baja, trapecio', niv: 'Avanzado',
      pasos: ['Barra sobre el medio del pie, cadera atrás, espalda recta y pecho arriba.', 'Empuja el suelo con las piernas manteniendo la barra pegada al cuerpo.', 'Termina de pie con glúteos apretados; baja con la cadera atrás.'],
      err: ['Redondear la lumbar', 'Barra lejos del cuerpo', 'Hiperextender al terminar'], resp: 'Inhala y bloquea el core antes de tirar.',
      a: { x: 95, t: 55, th: 38, sh: -14, ua: 5, fa: 0 }, b: { x: 95, t: 0, th: 0, sh: 0, ua: 0, fa: 0 } },
    { id: 'sentadilla', n: 'Sentadilla con barra', gr: 'Pierna', eq: { barra: 1, sobre: 'hombro' }, mus: 'Cuádriceps, glúteo, core', niv: 'Intermedio',
      pasos: ['Barra sobre trapecios, pies al ancho de hombros, puntas ligeramente abiertas.', 'Baja con la cadera atrás y rodillas siguiendo la línea de los pies.', 'Sube empujando el suelo hasta extender cadera y rodillas.'],
      err: ['Rodillas hacia dentro', 'Talones levantados', 'Espalda redondeada al fondo'], resp: 'Inhala al bajar, exhala al subir.',
      a: { x: 105, t: 3, ua: -20, fa: 150 }, b: { x: 85, t: 38, th: 86, sh: -26, ua: -10, fa: 160 } },
    { id: 'zancadas', n: 'Zancadas', gr: 'Pierna', eq: { manc: 1 }, mus: 'Cuádriceps, glúteo, isquios', niv: 'Principiante',
      pasos: ['De pie con mancuernas a los lados.', 'Da un paso largo y baja hasta que ambas rodillas formen ~90°.', 'Empuja con el talón de adelante para volver.'],
      err: ['Paso demasiado corto', 'Rodilla delantera pasa mucho la punta', 'Torso inclinado'], resp: 'Inhala al bajar.',
      a: { x: 110, th: 0, sh: 0 }, b: { x: 110, th: 80, sh: -4, th2: -48, sh2: -82, ft2: 40 } },
    { id: 'rumano', n: 'Peso muerto rumano', gr: 'Pierna', eq: { barra: 1 }, mus: 'Isquios, glúteo, lumbar', niv: 'Intermedio',
      pasos: ['De pie con la barra en los muslos, rodillas casi extendidas.', 'Lleva la cadera atrás deslizando la barra por las piernas.', 'Sube empujando la cadera adelante.'],
      err: ['Doblar mucho las rodillas', 'Redondear la espalda', 'Barra separada de las piernas'], resp: 'Inhala al bajar.',
      a: { x: 95, t: 0, ua: 0, fa: 0 }, b: { x: 80, t: 72, th: 6, sh: -4, ua: 0, fa: 0 } },
    { id: 'hip-thrust', n: 'Hip thrust', gr: 'Pierna', eq: { barra: 1, sobre: 'cadera', banco: 1 }, mus: 'Glúteo mayor, isquios', niv: 'Intermedio',
      pasos: ['Espalda alta apoyada en el banco, barra sobre la cadera, pies firmes.', 'Empuja la cadera hasta alinear rodillas, cadera y hombros.', 'Aprieta glúteos 1 segundo y baja controlado.'],
      err: ['Hiperextender la lumbar', 'Pies demasiado lejos o cerca', 'No llegar a la extensión completa'], resp: 'Exhala al subir.',
      a: { x: 130, t: -62, th: 55, sh: -5, ua: 90, fa: 90 }, b: { x: 130, t: -88, th: 78, sh: -5, ua: 90, fa: 90 } },
    { id: 'ext-cuad', n: 'Extensión de cuádriceps', gr: 'Pierna', eq: { banco: 'asiento' }, mus: 'Cuádriceps', niv: 'Principiante',
      pasos: ['Espalda pegada al respaldo, rodillo sobre los tobillos.', 'Extiende las rodillas hasta casi bloquear.', 'Baja lento sin dejar caer el peso.'],
      err: ['Lanzar el peso', 'Despegar la cadera del asiento'], resp: 'Exhala al extender.',
      a: { x: 105, t: -5, th: 88, sh: 5, ua: 20, fa: 60 }, b: { x: 105, t: -5, th: 88, sh: 88, ua: 20, fa: 60 } },
    { id: 'talones', n: 'Elevación de talones', gr: 'Pierna', eq: { manc: 1 }, mus: 'Gemelos, sóleo', niv: 'Principiante',
      pasos: ['De pie, apoya la parte delantera del pie en un escalón.', 'Sube lo más alto posible sobre las puntas.', 'Baja hasta estirar el talón por debajo del escalón.'],
      err: ['Rebotar', 'Rodillas dobladas', 'Rango corto'], resp: 'Exhala al subir.',
      a: { ft: 90, ft2: 90 }, b: { ft: 25, ft2: 25 } },
    { id: 'press-militar', n: 'Press militar', gr: 'Hombro', eq: { barra: 1 }, mus: 'Deltoides, tríceps, core', niv: 'Intermedio',
      pasos: ['De pie, barra a la altura de la clavícula, glúteos y abdomen firmes.', 'Empuja la barra en vertical, la cabeza pasa hacia adelante al subir.', 'Baja hasta la clavícula con control.'],
      err: ['Arquear la lumbar', 'Empujar con las piernas', 'Barra lejos de la cara'], resp: 'Exhala al empujar.',
      a: { t: 0, ua: -15, fa: 168 }, b: { t: 0, ua: 178, fa: 180 } },
    { id: 'elev-frontal', n: 'Elevación frontal', gr: 'Hombro', eq: { manc: 1 }, mus: 'Deltoides anterior', niv: 'Principiante',
      pasos: ['De pie con mancuernas frente a los muslos.', 'Sube los brazos al frente hasta la altura de los hombros.', 'Baja lento sin balancear el torso.'],
      err: ['Impulso con la espalda', 'Subir por encima de los hombros', 'Peso excesivo'], resp: 'Exhala al subir.',
      a: { ua: 0, fa: 0 }, b: { ua: 88, fa: 90 } },
    { id: 'curl-barra', n: 'Curl de bíceps con barra', gr: 'Brazo', eq: { barra: 1 }, mus: 'Bíceps braquial', niv: 'Principiante',
      pasos: ['De pie, codos pegados al torso, agarre supino.', 'Flexiona los codos llevando la barra a los hombros.', 'Baja completo y controlado.'],
      err: ['Balancear el torso', 'Adelantar los codos', 'Bajar solo la mitad'], resp: 'Exhala al subir.',
      a: { ua: 0, fa: 0 }, b: { ua: 0, fa: 150 } },
    { id: 'pushdown', n: 'Extensión de tríceps en polea', gr: 'Brazo', eq: { barra: 1, cable: [150, 10] }, mus: 'Tríceps', niv: 'Principiante',
      pasos: ['Codos pegados a las costillas, torso ligeramente inclinado.', 'Extiende los codos hasta bajar la barra a los muslos.', 'Sube controlado hasta ~90° sin mover los codos.'],
      err: ['Abrir o mover los codos', 'Usar el cuerpo para empujar'], resp: 'Exhala al extender.',
      a: { t: 8, ua: 0, fa: 115 }, b: { t: 8, ua: 0, fa: 5 } },
    { id: 'press-frances', n: 'Press francés', gr: 'Brazo', eq: { barra: 1, banco: 1 }, mus: 'Tríceps (cabeza larga)', niv: 'Intermedio',
      pasos: ['Acostado, barra sobre el pecho con brazos extendidos y codos fijos.', 'Flexiona solo los codos llevando la barra hacia la frente.', 'Extiende de nuevo sin abrir los codos.'],
      err: ['Mover los codos hacia atrás', 'Bajar la barra a la cara bruscamente'], resp: 'Inhala al bajar.',
      a: { x: 130, t: -90, th: 62, sh: 0, ua: 180, fa: 180 }, b: { x: 130, t: -90, th: 62, sh: 0, ua: 180, fa: -45 } },
    { id: 'plancha', n: 'Plancha abdominal', gr: 'Core', eq: {}, g: 'all', est: 1, mus: 'Recto abdominal, transverso, glúteo', niv: 'Principiante',
      pasos: ['Antebrazos en el suelo, codos bajo los hombros.', 'Cuerpo en línea recta, abdomen y glúteos contraídos.', 'Sostén el tiempo indicado respirando con calma.'],
      err: ['Cadera caída', 'Cadera muy alta', 'Aguantar la respiración'], resp: 'Respira corto y constante.',
      a: { x: 150, t: 80, th: -80, sh: -80, ua: 3, fa: 90 }, b: { x: 150, t: 80, th: -80, sh: -80, ua: 3, fa: 90 } },
    { id: 'crunch', n: 'Crunch abdominal', gr: 'Core', eq: {}, g: 'all', mus: 'Recto abdominal', niv: 'Principiante',
      pasos: ['Acostado, rodillas dobladas, manos tras la cabeza sin jalar el cuello.', 'Enrolla el torso llevando las costillas hacia la pelvis.', 'Baja sin soltar del todo la tensión.'],
      err: ['Jalar el cuello', 'Subir con impulso', 'Despegar la zona lumbar'], resp: 'Exhala al subir.',
      a: { x: 120, t: -90, th: 130, sh: 40, ua: -60, fa: -150 }, b: { x: 120, t: -48, th: 130, sh: 40, ua: -60, fa: -150 } },
    { id: 'elev-piernas', n: 'Elevación de piernas', gr: 'Core', eq: {}, g: 'all', mus: 'Abdomen inferior, flexores de cadera', niv: 'Intermedio',
      pasos: ['Acostado, lumbar pegada al suelo, manos bajo la cadera.', 'Sube las piernas juntas hasta la vertical.', 'Baja lento sin tocar el suelo.'],
      err: ['Arquear la espalda baja', 'Bajar rápido', 'Doblar mucho las rodillas'], resp: 'Exhala al subir.',
      a: { x: 70, t: -90, th: 88, sh: 88, ua: 90, fa: 90 }, b: { x: 70, t: -90, th: 175, sh: 175, ua: 90, fa: 90 } },
    { id: 'mountain', n: 'Mountain climbers', gr: 'Core', eq: {}, g: 'all', mus: 'Core, hombro, cardio', niv: 'Intermedio',
      pasos: ['Posición de plancha alta, manos bajo los hombros.', 'Lleva una rodilla al pecho y alterna rápido.', 'Mantén la cadera baja y el core firme.'],
      err: ['Cadera levantada', 'Manos adelantadas', 'Perder el ritmo respiratorio'], resp: 'Respiración rítmica, 2 pasos por ciclo.',
      a: { x: 150, t: 62, ua: 0, fa: 0, th: 100, sh: -10, th2: -62, sh2: -62 }, b: { x: 150, t: 62, ua: 0, fa: 0, th: -62, sh: -62, th2: 100, sh2: -10 } },
    /* ===== ejercicios con video del tiburón (mascota de FitZone) ===== */
    { id: 'aperturas-banco', n: 'Aperturas en banco', gr: 'Pecho', eq: { manc: 1, banco: 1 }, mus: 'Pectoral, deltoides anterior', niv: 'Intermedio',
      pasos: ['Acostado en el banco plano, mancuernas arriba con las palmas enfrentadas y los codos ligeramente flexionados.', 'Abre los brazos en arco hasta sentir estiramiento en el pecho, sin bajar más allá de la línea de los hombros.', 'Cierra el arco llevando las mancuernas arriba y apretando el pecho.'],
      err: ['Bajar demasiado y cargar el hombro', 'Estirar los codos por completo', 'Usar impulso con la espalda'], resp: 'Inhala al abrir, exhala al cerrar.', a: {}, b: {} },
    { id: 'peck-deck-pecho', n: 'Aperturas en peck deck', gr: 'Pecho', eq: {}, mus: 'Pectoral', niv: 'Principiante',
      pasos: ['Siéntate con la espalda pegada al respaldo y los codos a la altura del pecho.', 'Junta los brazos al frente apretando el pecho, sin despegar la espalda.', 'Regresa lento hasta sentir un estiramiento controlado.'],
      err: ['Despegar la espalda del respaldo', 'Encoger los hombros hacia las orejas', 'Soltar el peso de golpe'], resp: 'Exhala al juntar, inhala al abrir.', a: {}, b: {} },
    { id: 'press-inclinado-hammer', n: 'Press inclinado en hammer', gr: 'Pecho', eq: {}, mus: 'Pectoral superior, hombro, tríceps', niv: 'Principiante',
      pasos: ['Ajusta el asiento para que los agarres queden a la altura del pecho alto.', 'Empuja hacia delante y arriba sin bloquear los codos.', 'Regresa controlado hasta sentir estiramiento en el pecho.'],
      err: ['Despegar la espalda del respaldo', 'Bloquear los codos con fuerza', 'Rebotar al regresar'], resp: 'Exhala al empujar, inhala al regresar.', a: {}, b: {} },
    { id: 'press-plano-manc', n: 'Press plano con mancuernas', gr: 'Pecho', eq: { manc: 1, banco: 1 }, mus: 'Pectoral, tríceps, deltoides anterior', niv: 'Intermedio',
      pasos: ['Acuéstate en el banco plano con las mancuernas a la altura del pecho y los pies firmes.', 'Empuja hasta casi estirar los codos, juntando las mancuernas arriba.', 'Baja lento hasta que los codos queden un poco por debajo del banco.'],
      err: ['Abrir demasiado los codos', 'Bajar sin control', 'Despegar la cadera del banco'], resp: 'Inhala al bajar, exhala al empujar.', a: {}, b: {} },
    { id: 'fondos', n: 'Fondos en paralelas', gr: 'Pecho', eq: {}, mus: 'Pectoral inferior, tríceps, hombro', niv: 'Intermedio',
      pasos: ['Sujétate de las barras con los brazos estirados y el torso ligeramente inclinado hacia delante.', 'Baja flexionando los codos hasta que los brazos formen unos 90°.', 'Empuja hacia arriba sin balancear las piernas.'],
      err: ['Bajar demasiado y cargar el hombro', 'Balancear el cuerpo', 'Encoger los hombros'], resp: 'Inhala al bajar, exhala al subir.', a: {}, b: {} },
    { id: 'hex-press', n: 'Hex press con mancuernas', gr: 'Pecho', eq: { manc: 1, banco: 1 }, mus: 'Pectoral, tríceps', niv: 'Intermedio',
      pasos: ['Acostado, junta las dos mancuernas una contra otra sobre el pecho y apriétalas durante todo el movimiento.', 'Empuja hacia arriba sin separarlas.', 'Baja controlado hasta el pecho manteniendo la presión entre ambas.'],
      err: ['Dejar que las mancuernas se separen', 'Bajar sin control', 'Despegar la cadera del banco'], resp: 'Exhala al empujar, inhala al bajar.', a: {}, b: {} },
    { id: 'remo-sentado-cerrado', n: 'Remo sentado agarre cerrado', gr: 'Espalda', eq: {}, mus: 'Dorsal, romboides, bíceps', niv: 'Principiante',
      pasos: ['Siéntate con el pecho arriba y los pies firmes; toma el agarre cerrado.', 'Tira hacia el abdomen llevando los codos pegados hacia atrás y juntando las escápulas.', 'Regresa lento estirando los brazos sin encorvar la espalda.'],
      err: ['Balancear el torso', 'Encoger los hombros', 'Espalda redondeada'], resp: 'Exhala al tirar, inhala al regresar.', a: {}, b: {} },
    { id: 'jalon-cerrado', n: 'Jalón con agarre cerrado', gr: 'Espalda', eq: {}, mus: 'Dorsal ancho, bíceps', niv: 'Principiante',
      pasos: ['Siéntate con los muslos fijos bajo el soporte y toma el agarre cerrado.', 'Tira hacia el pecho alto llevando los codos hacia abajo y atrás.', 'Sube lento hasta estirar los brazos sin despegarte del asiento.'],
      err: ['Inclinarte demasiado hacia atrás', 'Tirar con los brazos en vez de con la espalda', 'Soltar el peso de golpe'], resp: 'Exhala al tirar, inhala al subir.', a: {}, b: {} },
    { id: 'cruce-poleas', n: 'Cruce de poleas para pecho', gr: 'Pecho', eq: {}, mus: 'Pectoral', niv: 'Intermedio',
      pasos: ['De pie entre las poleas altas, torso ligeramente inclinado y codos un poco flexionados.', 'Junta las manos al frente en arco, apretando el pecho.', 'Regresa lento controlando el peso hasta sentir estiramiento.'],
      err: ['Doblar y estirar los codos en cada repetición', 'Usar impulso con el torso', 'Peso excesivo'], resp: 'Exhala al juntar, inhala al abrir.', a: {}, b: {} },
    { id: 'peck-deck-deltoides', n: 'Peck deck para deltoides', gr: 'Hombro', eq: {}, mus: 'Deltoides posterior, romboides', niv: 'Principiante',
      pasos: ['Siéntate de frente al respaldo (pecho contra el apoyo) y toma los agarres con los codos ligeramente flexionados.', 'Abre los brazos hacia atrás hasta la línea de los hombros, apretando la parte de atrás del hombro.', 'Regresa lento sin soltar el peso.'],
      err: ['Encoger los hombros hacia las orejas', 'Usar impulso con el torso', 'Abrir más allá de lo que permite el hombro'], resp: 'Exhala al abrir, inhala al regresar.', a: {}, b: {} },
    { id: 'remo-mancuerna', n: 'Remo con mancuerna', gr: 'Espalda', eq: { manc: 1, banco: 1 }, mus: 'Dorsal, romboides, bíceps', niv: 'Principiante',
      pasos: ['Apoya una mano y una rodilla (o el pie) en el banco, espalda recta y paralela al suelo.', 'Tira de la mancuerna hacia la cadera llevando el codo hacia atrás y pegado al cuerpo.', 'Baja lento estirando el brazo sin girar el torso.'],
      err: ['Girar el torso para subir el peso', 'Encorvar la espalda', 'Tirar con el brazo en vez de con la espalda'], resp: 'Exhala al tirar, inhala al bajar.', a: {}, b: {} },
    { id: 'curl-biceps-manc', n: 'Curl de bíceps con mancuernas', gr: 'Brazo', eq: { manc: 1 }, mus: 'Bíceps braquial', niv: 'Principiante',
      pasos: ['De pie, mancuernas a los lados con las palmas hacia delante y los codos pegados al torso.', 'Sube las mancuernas flexionando los codos hasta los hombros, apretando el bíceps.', 'Baja lento hasta estirar casi por completo.'],
      err: ['Balancear el cuerpo para subir', 'Separar los codos del torso', 'Bajar de golpe'], resp: 'Exhala al subir, inhala al bajar.', a: {}, b: {} },
    { id: 'curl-martillo', n: 'Curl martillo', gr: 'Brazo', eq: { manc: 1 }, mus: 'Bíceps braquial, braquiorradial, antebrazo', niv: 'Principiante',
      pasos: ['De pie, mancuernas a los lados con las palmas mirándose (agarre neutro).', 'Sube las mancuernas sin girar las muñecas, con los codos pegados al torso.', 'Baja controlado hasta estirar los brazos.'],
      err: ['Impulso con la espalda', 'Girar las muñecas', 'Subir los codos hacia delante'], resp: 'Exhala al subir, inhala al bajar.', a: {}, b: {} },
    { id: 'press-hombro-manc', n: 'Press de hombro con mancuernas', gr: 'Hombro', eq: { manc: 1 }, mus: 'Deltoides, tríceps', niv: 'Intermedio',
      pasos: ['De pie (o sentado), mancuernas a la altura de los hombros con las palmas hacia delante y el abdomen firme.', 'Empuja hacia arriba hasta casi estirar los codos, sin arquear la espalda.', 'Baja controlado hasta la altura de las orejas.'],
      err: ['Arquear la zona lumbar', 'Bloquear los codos con fuerza', 'Subir con impulso de piernas'], resp: 'Exhala al empujar, inhala al bajar.', a: {}, b: {} },
    { id: 'elev-lateral', n: 'Vuelos laterales', gr: 'Hombro', eq: { manc: 1 }, mus: 'Deltoides lateral', niv: 'Principiante',
      pasos: ['De pie, mancuernas a los lados con los codos ligeramente flexionados.', 'Sube los brazos hacia los lados hasta la altura de los hombros, como abriendo alas.', 'Baja lento sin dejar caer las mancuernas.'],
      err: ['Subir por encima de los hombros', 'Balancear el torso para subir', 'Peso excesivo que obliga a encoger los hombros'], resp: 'Exhala al subir, inhala al bajar.', a: {}, b: {} },
    { id: 'copa-triceps', n: 'Copa para tríceps', gr: 'Brazo', eq: { manc: 1 }, mus: 'Tríceps (cabeza larga)', niv: 'Principiante',
      pasos: ['De pie o sentado, sostén una mancuerna con las dos manos sobre la cabeza, en forma de copa.', 'Flexiona los codos bajando la mancuerna detrás de la cabeza, con los codos apuntando al frente.', 'Estira los brazos hacia arriba sin abrir los codos.'],
      err: ['Abrir los codos hacia los lados', 'Arquear la zona lumbar', 'Bajar sin control'], resp: 'Inhala al bajar, exhala al estirar.', a: {}, b: {} },
    { id: 'pajaros', n: 'Pájaros', gr: 'Hombro', eq: { manc: 1 }, mus: 'Deltoides posterior, romboides', niv: 'Principiante',
      pasos: ['Inclina el torso hacia delante con la espalda recta y las mancuernas colgando bajo los hombros.', 'Abre los brazos hacia los lados, con los codos ligeramente flexionados, hasta la altura del torso.', 'Baja lento a la posición inicial.'],
      err: ['Encorvar la espalda', 'Usar impulso del torso', 'Subir los brazos más arriba del torso'], resp: 'Exhala al abrir, inhala al bajar.', a: {}, b: {} },
    { id: 'triceps-nuca-barra', n: 'Tríceps tras nuca con barra recta', gr: 'Brazo', eq: { barra: 1 }, mus: 'Tríceps', niv: 'Intermedio',
      pasos: ['De pie o sentado, sostén la barra sobre la cabeza con los brazos estirados.', 'Baja la barra detrás de la cabeza flexionando solo los codos, que se mantienen cerca de la cabeza.', 'Estira los brazos hacia arriba sin mover los hombros.'],
      err: ['Abrir los codos hacia los lados', 'Arquear la zona lumbar', 'Peso excesivo que obliga a mover el torso'], resp: 'Inhala al bajar, exhala al estirar.', a: {}, b: {} },
    { id: 'triceps-nuca-manc', n: 'Tríceps tras nuca con mancuerna (una mano)', gr: 'Brazo', eq: { manc: 1 }, mus: 'Tríceps', niv: 'Intermedio',
      pasos: ['De pie, sostén una mancuerna sobre la cabeza con una mano y el codo apuntando arriba.', 'Flexiona el codo bajando la mancuerna detrás de la cabeza, sin mover el brazo de arriba.', 'Estira el brazo hasta arriba y repite; luego cambia de mano.'],
      err: ['Mover el codo hacia delante o los lados', 'Inclinar el torso', 'Bajar sin control'], resp: 'Inhala al bajar, exhala al estirar.', a: {}, b: {} },
    { id: 'cruce-piernas', n: 'Cruce de piernas (abdominales)', gr: 'Core', eq: {}, mus: 'Abdomen, oblicuos, flexores de cadera', niv: 'Intermedio',
      pasos: ['Acostado boca arriba, manos detrás de la cabeza y las piernas elevadas.', 'Cruza las piernas una sobre otra de forma alterna, en tijera, con el abdomen firme.', 'Mantén la zona lumbar pegada al suelo durante todo el movimiento.'],
      err: ['Despegar la zona lumbar del suelo', 'Jalar el cuello con las manos', 'Mover las piernas muy rápido sin control'], resp: 'Respira de forma constante, sin aguantar el aire.', a: {}, b: {} },
    { id: 'curl-cable', n: 'Bíceps con cabo (polea)', gr: 'Brazo', eq: {}, mus: 'Bíceps braquial', niv: 'Principiante',
      pasos: ['De pie frente a la polea baja, toma el agarre con las palmas hacia arriba y los codos pegados al torso.', 'Sube el agarre flexionando los codos hasta los hombros, apretando el bíceps.', 'Baja lento sin dejar descansar el peso en la pila.'],
      err: ['Balancear el cuerpo para subir', 'Separar los codos del torso', 'Bajar de golpe'], resp: 'Exhala al subir, inhala al bajar.', a: {}, b: {} }
  ];
  /* video explicativo con la mascota (assets/ejercicios/<id>.mp4) + imágenes: miniatura (id.jpg) y dos cuadros para el PDF (id-a.jpg, id-b.jpg) */
  const CLIPS = ['aperturas-banco', 'peck-deck-pecho', 'press-banca', 'press-inclinado-hammer', 'press-plano-manc', 'dominadas', 'fondos', 'hex-press', 'jalon', 'remo-sentado-cerrado', 'jalon-cerrado', 'cruce-poleas', 'peck-deck-deltoides', 'remo-barra', 'remo-mancuerna', 'curl-biceps-manc', 'curl-martillo', 'press-hombro-manc', 'elev-frontal', 'elev-lateral', 'copa-triceps', 'curl-barra', 'pajaros', 'triceps-nuca-barra', 'triceps-nuca-manc', 'cruce-piernas', 'elev-piernas', 'crunch', 'mountain', 'plancha', 'curl-cable'];
  CLIPS.forEach(id => { const e = X.find(x => x.id === id); if (e) { const b = 'assets/ejercicios/' + id; e.clip = b + '.mp4'; e.img = b + '.jpg'; e.fa = b + '-a.jpg'; e.fb = b + '-b.jpg'; } });
  const CAMPOS = ['n', 'gr', 'mus', 'niv', 'pasos', 'err', 'resp', 'video'];
  const norm = e => { e.a = full(e.a); e.b = full(e.b); e.eq = e.eq || {}; return e; };
  X.forEach(norm);
  const lerp = (a, b, t) => { const r = {}; K.forEach(k => r[k] = a[k] + (b[k] - a[k]) * t); return r; };
  const E = {
    lista: X,
    /* grupos que se ofrecen al crear/editar (incluye los que no tienen ejercicios aún) */
    GRUPOS_BASE: ['Pecho', 'Espalda', 'Pierna', 'Glúteo', 'Hombro', 'Brazo', 'Core', 'Full body', 'Cardio', 'Movilidad'],
    /* grupos con al menos un ejercicio: los de siempre más cualquiera que Carlos haya creado */
    get grupos() { const fijos = ['Pecho', 'Espalda', 'Pierna', 'Hombro', 'Brazo', 'Core'], extra = [...new Set(X.map(x => x.gr).filter(g => g && !fijos.includes(g)))];
      const orden = g => { const i = E.GRUPOS_BASE.indexOf(g); return i < 0 ? 999 : i; };
      return [...fijos, ...extra.sort((a, b) => orden(a) - orden(b) || a.localeCompare(b, 'es'))]; },
    gruposForm() { return [...new Set([...E.GRUPOS_BASE, ...E.grupos])]; },
    get: id => X.find(e => e.id === id),
    frames: (ex, w) => ex.clip ? `<div class="frames clip"><figure><img src="${ex.fa}" alt=""><figcaption>1 · Inicio</figcaption></figure><span class="arrow" aria-hidden="true">→</span><figure><img src="${ex.fb}" alt=""><figcaption>2 · Final</figcaption></figure></div>` : `<div class="frames"><figure>${svg(draw(ex.a, ex), w)}<figcaption>1 · Inicio</figcaption></figure>` +
      (ex.est ? '' : `<span class="arrow" aria-hidden="true">→</span><figure>${svg(draw(ex.b, ex), w)}<figcaption>2 · Final</figcaption></figure>`) + `</div>`,
    miniatura: ex => ex.img ? `<img src="${ex.img}" alt="" loading="lazy">` : svg(draw(ex.b, ex)),
    /* animación en loop: devuelve función para detenerla */
    animar(el, ex) {
      if (ex.clip) { const red = matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.innerHTML = `<video class="clipv" src="${ex.clip}" poster="${ex.img}" muted loop playsinline preload="metadata" aria-label="Video de ${String(ex.n).replace(/"/g, '')}" ${red ? 'controls' : 'autoplay'}></video>`;
        const v = el.querySelector('video'); if (!red) { const p = v.play(); if (p && p.catch) p.catch(() => { v.controls = true; }); }
        return () => { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {} }; }
      if (ex.est) { el.innerHTML = svg(draw(ex.a, ex)); return () => {}; }
      let raf, t0 = performance.now();
      const tick = n => { const ph = ((n - t0) % 3200) / 3200, k = ph < .5 ? ph * 2 : (1 - ph) * 2, e = k * k * (3 - 2 * k);
        el.innerHTML = svg(draw(lerp(ex.a, ex.b, e), ex)); raf = requestAnimationFrame(tick); };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.innerHTML = svg(draw(ex.b, ex)); return () => {}; }
      raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
    },
    /* crea o actualiza un ejercicio: propio (custom) o edición de uno de la biblioteca (ov). Guarda el original para poder restaurarlo. */
    aplicar(o) { let ex = E.get(o.id);
      if (!ex) { ex = norm({ id: o.id, n: o.n || 'Ejercicio', gr: o.gr || 'Core', eq: {}, mus: '', niv: 'Personalizado', pasos: [], err: [], resp: '', video: '', a: {}, b: {}, custom: 1 }); X.push(ex); }
      else if (!ex.custom && !ex._orig && CAMPOS.some(k => o[k] !== undefined)) ex._orig = CAMPOS.reduce((m, k) => (m[k] = Array.isArray(ex[k]) ? ex[k].slice() : ex[k], m), {});
      CAMPOS.forEach(k => { if (o[k] !== undefined) ex[k] = Array.isArray(o[k]) ? o[k].slice() : o[k]; }); ex.oculto = !!o.oculto; return ex; },
    restaurar(id) { const ex = E.get(id); if (ex && ex._orig) { CAMPOS.forEach(k => ex[k] = Array.isArray(ex._orig[k]) ? ex._orig[k].slice() : ex._orig[k]); ex.oculto = false; delete ex._orig; } },
    quitar(id) { const i = X.findIndex(x => x.id === id && x.custom); if (i >= 0) X.splice(i, 1); },
    visibles: () => X.filter(x => !x.oculto),
    agregarPersonalizado(o) { return E.aplicar(Object.assign({ id: 'x' + Date.now().toString(36) }, o)); }
  };
  window.EJ = E;
})();
