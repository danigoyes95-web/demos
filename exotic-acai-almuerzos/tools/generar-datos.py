#!/usr/bin/env python3
"""Genera los datos MOCK del demo (6 meses de historia) y las ilustraciones de platos.
Uso:  python3 tools/generar-datos.py
Salida: data/seed.json, data/seed.js, assets/img/plato-*.svg
Todo es inventado para la demo. Reemplazar por datos reales en la fase 2 (Supabase)."""
import json, random, math, datetime as dt, os, hashlib

R = random.Random(2026)
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
HOY = dt.date(2026, 11, 5)
INICIO_HIST = dt.date(2026, 6, 1)
IVA = 0.15
FERIADOS = {dt.date(2026, 8, 10), dt.date(2026, 10, 9), dt.date(2026, 11, 2), dt.date(2026, 11, 3)}

PLANES = {  # espejo de config/plans.js (precios PVP con IVA)
    'oficina':  {'p20': 85,  'p12': 55, 'costo': 2.20},
    'fit':      {'p20': 105, 'p12': 68, 'costo': 2.85},
    'especial': {'p20': 110, 'p12': 72, 'costo': 3.05},
}
ZONAS = [('centro', 30), ('ficoa', 15), ('atocha', 12), ('huachi', 15), ('izamba', 8), ('miraflores', 10), ('retiro', 10)]
VENTANAS = ['12:00–12:30', '12:30–13:00', '13:00–13:30']
NOMBRES = ['María', 'José', 'Andrea', 'Carlos', 'Paola', 'Luis', 'Daniela', 'Diego', 'Gabriela', 'Santiago', 'Verónica', 'Pablo', 'Karla', 'Fernando', 'Lucía', 'Mateo', 'Carolina', 'Esteban', 'Mónica', 'Andrés', 'Sofía', 'Jorge', 'Valeria', 'Marcelo', 'Estefanía', 'Cristian', 'Nathaly', 'Byron', 'Tatiana', 'Xavier', 'Pamela', 'Ricardo', 'Jessica', 'Patricio', 'Anabel', 'Henry', 'Silvana', 'Wilson', 'Dayana', 'Alex']
APELLIDOS = ['Naranjo', 'Villacís', 'Altamirano', 'Salazar', 'Cevallos', 'Mera', 'Proaño', 'Freire', 'Sánchez', 'Llerena', 'Beltrán', 'Pazmiño', 'Zurita', 'Álvarez', 'Guevara', 'Moreta', 'Sevilla', 'Robalino', 'Vásconez', 'Acosta', 'Tello', 'Garcés', 'Escobar', 'Paredes', 'Cando', 'Haro', 'Lascano', 'Yánez', 'Cárdenas', 'Mayorga']
CALLES = ['Av. Cevallos', 'Calle Bolívar', 'Av. Los Chasquis', 'Calle Montalvo', 'Av. Atahualpa', 'Calle Sucre', 'Av. Rodrigo Pachano', 'Calle Mera', 'Av. Miraflores', 'Calle Lalama', 'Av. Bolivariana', 'Calle Quito']
ALERGIAS = ['maní', 'mariscos', 'lácteos', 'huevo', 'frutos secos']
RESTR_ESP = ['vegano', 'vegetariano', 'keto', 'sin gluten', 'bajo en azúcar']

# fuente -> (peso tráfico, conv visita->pago base, campañas con (nombre, peso, público probable))
FUENTES = {
    'instagram': (0.52, 0.040, [('reel-almuerzo-oficina', 4, 'oficina'), ('historia-gym', 3, 'gym'), ('bio-link', 3, 'mixto')]),
    'whatsapp':  (0.20, 0.085, [('estado-whatsapp', 1, 'mixto')]),
    'directo':   (0.17, 0.055, [('', 1, 'mixto')]),
    'referidos': (0.11, 0.120, [('amigo-referido', 1, 'mixto')]),
}


def pick(ws):
    tot = sum(w for _, w in ws)
    x = R.random() * tot
    for v, w in ws:
        x -= w
        if x <= 0:
            return v
    return ws[-1][0]


def binom(n, p):
    if n <= 0: return 0
    if n > 60:  # aprox. normal
        m, sd = n * p, math.sqrt(n * p * (1 - p))
        return max(0, min(n, int(round(R.gauss(m, sd)))))
    return sum(1 for _ in range(n) if R.random() < p)


def daterange(a, b):
    d = a
    while d <= b:
        yield d
        d += dt.timedelta(days=1)


def add_months(d, k):
    m = d.month - 1 + k
    y = d.year + m // 12
    m = m % 12 + 1
    return dt.date(y, m, min(d.day, 28))


# ───────────────────────── 1) EMBUDO diario (visitas → pago)
# Crece de ~11 a ~26 pagos/mes por día; la última semana trae más visitas con peor conversión (alerta demo).
funnel = []          # filas agregadas por día/fuente/campaña
nuevos = []          # cada pago "nuevo" -> un suscriptor
for d in daterange(INICIO_HIST, HOY):
    t = (d - INICIO_HIST).days / (HOY - INICIO_HIST).days
    base = 17 + (38 - 17) * min(1, t * 1.1)       # visitas diarias totales
    dow = d.weekday()
    base *= [1.15, 1.1, 1.0, 1.0, 1.05, 0.7, 0.75][dow]
    ultima_semana = (HOY - d).days <= 6
    if ultima_semana: base *= 1.55
    for src, (peso, conv, camps) in FUENTES.items():
        for cname, cw, cpub in camps:
            wsum = sum(c[1] for c in camps)
            vis = int(round(base * peso * cw / wsum * R.uniform(.8, 1.25)))
            if vis == 0: continue
            ini = binom(vis, conv * R.uniform(.9, 1.1) * (0.38 if ultima_semana and src == 'instagram' else 1))
            p1 = binom(ini, .86); p2 = binom(p1, .90); p3 = binom(p2, .87); p4 = binom(p3, .76)
            pago = binom(p4, .78)
            funnel.append({'f': d.isoformat(), 'fuente': src, 'campana': cname, 'visitas': vis, 'inicio': ini,
                           'p1': p1, 'p2': p2, 'p3': p3, 'p4': p4, 'pago': pago})
            for _ in range(pago):
                nuevos.append((d, src, cname, cpub))

# ───────────────────────── 2) SUSCRIPTORES
subs = []


def crear_sub(inicio, src, camp, cpub, pre=False):
    if cpub == 'mixto':
        pub = pick([('oficina', 5), ('gym', 3), ('especial', 2)])
    else:
        pub = cpub if R.random() < .85 else pick([('oficina', 1), ('gym', 1), ('especial', 1)])
    plan = {'oficina': pick([('oficina', 85), ('fit', 10), ('especial', 5)]),
            'gym': pick([('fit', 85), ('oficina', 10), ('especial', 5)]),
            'especial': pick([('especial', 90), ('fit', 10)])}[pub]
    frec = 20 if R.random() < .78 else 12
    restr = []
    if pub == 'especial' or plan == 'especial':
        restr = R.sample(RESTR_ESP, R.choice([1, 1, 2]))
        if 'vegano' in restr and 'vegetariano' not in restr: restr.append('vegetariano')
    elif R.random() < .10:
        restr = [R.choice(RESTR_ESP)]
    alerg = [R.choice(ALERGIAS)] if R.random() < .10 else []
    zona = pick(ZONAS)
    n = R.choice(NOMBRES); a = R.choice(APELLIDOS)
    precio = PLANES[plan]['p20' if frec == 20 else 'p12']
    s = {
        'id': 'S%03d' % (len(subs) + 1), 'nombre': '%s %s' % (n, a),
        'tel': '09%08d' % R.randint(10000000, 99999999),
        'email': ('%s.%s@correo.ec' % (n, a)).lower().replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n'),
        'plan': plan, 'frec': frec, 'porcion': (R.choice(['volumen', 'definicion']) if plan == 'fit' else 'normal'),
        'publico': pub, 'restricciones': restr, 'alergias': alerg,
        'zona': zona, 'direccion': '' if zona == 'retiro' else '%s %d y %s' % (R.choice(CALLES), R.randint(100, 999), R.choice(CALLES)),
        'ventana': VENTANAS[0] if plan == 'fit' and R.random() < .6 else R.choice(VENTANAS),
        'inicio': inicio.isoformat(), 'fin': None, 'pausas': [],
        'precio': precio, 'fuente': src, 'campana': camp,
    }
    subs.append(s)
    return s


# base previa a junio (12 suscriptores desde mayo)
for i in range(12):
    d = dt.date(2026, 5, R.randint(4, 28))
    crear_sub(d, pick([('directo', 4), ('referidos', 3), ('instagram', 3)]), '', R.choice(['oficina', 'gym', 'mixto']), True)
for (d, src, camp, cpub) in nuevos:
    crear_sub(d, src, camp, cpub)

# bajas (churn mensual ~ 6-9 %): sólo después de, al menos, un ciclo (≥ 28 días)
for s in subs:
    ini = dt.date.fromisoformat(s['inicio'])
    dias_activo = (HOY - ini).days
    if dias_activo < 30: continue
    ciclos = dias_activo // 30
    prob = 1 - (1 - 0.075) ** ciclos
    if R.random() < prob:
        # cae en un momento aleatorio (preferentemente cerca de renovaciones)
        k = R.randint(1, ciclos)
        fin = add_months(ini, k) + dt.timedelta(days=R.randint(-2, 3))
        if fin < HOY and fin > ini + dt.timedelta(days=28):
            s['fin'] = fin.isoformat()

# pausas: 5 pausados hoy y ~8 pausas pasadas
activos_hoy = [s for s in subs if not s['fin']]
for s in R.sample(activos_hoy, 5):
    s['pausas'].append([(HOY - dt.timedelta(days=R.randint(1, 6))).isoformat(), None])
for s in R.sample([x for x in activos_hoy if not x['pausas']], 8):
    a = dt.date.fromisoformat(s['inicio']) + dt.timedelta(days=R.randint(35, 60))
    if a + dt.timedelta(days=10) < HOY - dt.timedelta(days=8):
        s['pausas'].append([a.isoformat(), (a + dt.timedelta(days=R.randint(5, 10))).isoformat()])


def en_pausa(s, d):
    for a, b in s['pausas']:
        a = dt.date.fromisoformat(a)
        if d >= a and (b is None or d < dt.date.fromisoformat(b)):
            return True
    return False


def activo_en(s, d):
    ini = dt.date.fromisoformat(s['inicio'])
    if d < ini: return False
    if s['fin'] and d >= dt.date.fromisoformat(s['fin']): return False
    return True


def recibe(s, d):
    if d.weekday() > 4 or d in FERIADOS: return False
    if not activo_en(s, d) or en_pausa(s, d): return False
    return True if s['frec'] == 20 else d.weekday() in (0, 2, 4)


# ───────────────────────── 3) PAGOS (un cobro por ciclo mensual)
pagos = []
for s in subs:
    ini = dt.date.fromisoformat(s['inicio'])
    k = 0
    while True:
        f = add_months(ini, k)
        if f > HOY: break
        if s['fin'] and f >= dt.date.fromisoformat(s['fin']): break
        if k > 0 and en_pausa(s, f):
            k += 1; continue
        neto = round(s['precio'] / (1 + IVA), 2)
        estado = 'cobrado'
        r = R.random()
        if r < .035: estado = 'cobrado'  # fallo resuelto en reintento (se ve como cobrado)
        pagos.append({'id': 'P%04d' % (len(pagos) + 1), 'sub': s['id'], 'f': f.isoformat(), 'plan': s['plan'], 'frec': s['frec'],
                      'monto': s['precio'], 'iva': round(s['precio'] - neto, 2), 'neto': neto, 'estado': estado,
                      'metodo': 'Tarjeta' if R.random() < .72 else 'Transferencia', 'nuevo': k == 0})
        k += 1
# estados recientes: 3 fallidos y 2 pendientes en los últimos 6 días
recientes = [p for p in pagos if (HOY - dt.date.fromisoformat(p['f'])).days <= 6 and not p['nuevo']]
R.shuffle(recientes)
for p in recientes[:3]: p['estado'] = 'fallido'
for p in recientes[3:5]: p['estado'] = 'pendiente'
# fallidos antiguos ya recuperados (marca informativa)
for p in R.sample([x for x in pagos if (HOY - dt.date.fromisoformat(x['f'])).days > 20], 10): p['nota'] = 'Cobrado en segundo intento'

# ───────────────────────── 4) PLATOS y MENÚ SEMANAL
PLATOS = [
    # id, día(1-5), slot(0 oficina,1 gym,2 especial), nombre, desc, P, C, G, etiquetas
    ('d01', 1, 0, 'Pollo a la plancha con quinua', 'Pechuga a la plancha, quinua y vegetales salteados.', 38, 52, 14, ['balanceado']),
    ('d02', 1, 1, 'Res magra con arroz integral', 'Res magra salteada, arroz integral y brócoli al vapor.', 48, 58, 16, ['alto en proteína']),
    ('d03', 1, 2, 'Bowl vegano de lenteja y camote', 'Lenteja guisada, camote asado, espinaca y semillas de zapallo.', 24, 72, 12, ['vegano', 'vegetariano']),
    ('d04', 2, 0, 'Pescado al horno con puré de camote', 'Filete de pescado blanco al horno, puré de camote y ensalada fresca.', 34, 48, 15, ['balanceado']),
    ('d05', 2, 1, 'Pechuga en salsa de champiñones', 'Pechuga jugosa, salsa de champiñones, quinua y espinaca.', 52, 46, 14, ['alto en proteína']),
    ('d06', 2, 2, 'Bowl keto de pollo y aguacate', 'Pollo, aguacate, coliflor al ajo y mix de hojas.', 36, 14, 34, ['keto', 'sin gluten', 'bajo en azúcar']),
    ('d07', 3, 0, 'Seco de pollo liviano', 'Seco de pollo con menos grasa, arroz integral y ensalada de cebolla.', 36, 60, 13, ['balanceado']),
    ('d08', 3, 1, 'Lomo de res con quinua tricolor', 'Lomo de res magro, quinua tricolor y verduras al vapor.', 50, 55, 18, ['alto en proteína']),
    ('d09', 3, 2, 'Crema de zapallo con tofu', 'Crema de zapallo, tofu a la plancha y ensalada de hojas verdes.', 22, 38, 16, ['vegano', 'vegetariano', 'sin gluten']),
    ('d10', 4, 0, 'Pasta integral con pollo y pesto', 'Pasta integral, pollo desmenuzado y pesto de albahaca.', 35, 62, 17, ['balanceado']),
    ('d11', 4, 1, 'Pavo molido con camote y fréjol', 'Pavo molido sazonado, camote al horno y fréjol.', 46, 64, 12, ['alto en proteína']),
    ('d12', 4, 2, 'Bowl de arroz, atún y aguacate', 'Arroz, atún en agua, aguacate, pepino y sésamo.', 34, 44, 22, ['sin gluten', 'bajo en azúcar']),
    ('d13', 5, 0, 'Wrap integral de pollo', 'Tortilla integral, pollo, lechuga, tomate y aderezo de yogur.', 33, 50, 14, ['balanceado']),
    ('d14', 5, 1, 'Churrasco magro con papa', 'Churrasco magro, papa cocida y ensalada fresca.', 51, 52, 19, ['alto en proteína']),
    ('d15', 5, 2, 'Bowl vegano de garbanzo y quinua', 'Garbanzo, quinua, vegetales asados y aderezo de limón.', 25, 70, 15, ['vegano', 'vegetariano']),
]
FOTO = {}
platos = []
for pid, dia, slot, nom, desc, P, C, G, tags in PLATOS:
    slug = nom.lower().replace(' ', '-').replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n').replace(',', '')
    foto = 'assets/img/plato-%s-%s.svg' % (pid, slug)
    FOTO[pid] = foto
    platos.append({'id': pid, 'nombre': nom, 'desc': desc, 'kcal': 4 * P + 4 * C + 9 * G, 'p': P, 'c': C, 'g': G, 'tags': tags, 'foto': foto, 'slot': slot})
semana = {str(d): [p[0] for p in PLATOS if p[1] == d] for d in range(1, 6)}
valor = {  # promedio, votos, comentarios (mock)
    'd01': (4.6, 41), 'd02': (4.5, 33), 'd03': (4.2, 14), 'd04': (4.1, 29), 'd05': (4.7, 38), 'd06': (4.3, 17),
    'd07': (4.8, 44), 'd08': (4.6, 31), 'd09': (3.5, 19), 'd10': (4.3, 36), 'd11': (4.4, 26), 'd12': (4.0, 15),
    'd13': (4.2, 30), 'd14': (4.5, 27), 'd15': (4.1, 12)}
comentarios = {
    'd09': ['Muy líquida, me quedé con hambre.', 'El tofu quedó seco.', 'Rica pero la porción es poca.'],
    'd07': ['El mejor del mes, repetiría.', 'Sabe a casa.'],
    'd05': ['Perfecto para después del gym.', 'Mucha proteína, buena salsa.'],
    'd04': ['El pescado un poco seco el jueves.'],
    'd12': ['Más aguacate por favor.'],
}
for p in platos:
    v = valor[p['id']]
    p['rating'] = v[0]; p['votos'] = v[1]; p['comentarios'] = comentarios.get(p['id'], [])

# ───────────────────────── 5) GASTOS (registro manual mock)
PRECIO_ENTREGA = 0.12
gastos = []
gid = 1


def gasto(f, cat, desc, monto, prov=''):
    global gid
    gastos.append({'id': 'G%03d' % gid, 'f': f.isoformat(), 'cat': cat, 'desc': desc, 'monto': round(monto, 2), 'prov': prov})
    gid += 1


for m in range(6):
    ini = add_months(dt.date(2026, 6, 1), m).replace(day=1)
    fin = (add_months(ini, 1).replace(day=1) - dt.timedelta(days=1))
    fin = min(fin, HOY)
    cost = {'ing': 0.0, 'emp': 0.0, 'ent': 0.0}
    for d in daterange(ini, fin):
        for s in subs:
            if recibe(s, d):
                c = PLANES[s['plan']]['costo']
                cost['ing'] += c * .82; cost['emp'] += c * .18
                if s['zona'] != 'retiro': cost['ent'] += PRECIO_ENTREGA
    k = 4
    for i in range(k):
        f = ini + dt.timedelta(days=min(i * 7 + 1, (fin - ini).days))
        if f > HOY: continue
        gasto(f, 'ingredientes', 'Compra semanal de víveres y proteínas', cost['ing'] / k * R.uniform(.96, 1.05), R.choice(['Mercado Mayorista', 'Avícola Ambato', 'Frigorífico Andino']))
    for i in range(2):
        f = ini + dt.timedelta(days=min(i * 14 + 3, (fin - ini).days))
        if f > HOY: continue
        gasto(f, 'empaques', 'Envases y cubiertos compostables', cost['emp'] / 2 * R.uniform(.95, 1.06), 'Empaques del Centro')
    gasto(fin if fin < HOY else HOY, 'delivery', 'Combustible y mantenimiento de moto', cost['ent'] * R.uniform(.98, 1.1) + 25, 'Gasolinera')
    if True:
        factor = (fin - ini).days / 29 if fin == HOY else 1
        for dia in (14, 29):
            f = min(ini + dt.timedelta(days=dia), add_months(ini, 1).replace(day=1) - dt.timedelta(days=1))
            if f <= HOY: gasto(f, 'sueldos', 'Ayudante de cocina y repartidor (quincena)', 550)
        for (dd, cat, ds, mt, pv) in ((2, 'arriendo', 'Arriendo del local', 300, ''), (9, 'servicios', 'Luz, agua, gas e internet', R.uniform(115, 145), ''), (4, 'marketing', 'Pauta en Instagram y contenido', R.uniform(160, 240) + (60 if m >= 4 else 0), 'Meta Ads')):
            if ini + dt.timedelta(days=dd) <= HOY: gasto(ini + dt.timedelta(days=dd), cat, ds, mt, pv)

CATEGORIAS = [
    {'id': 'ingredientes', 'nombre': 'Ingredientes', 'tipo': 'variable'},
    {'id': 'empaques', 'nombre': 'Empaques', 'tipo': 'variable'},
    {'id': 'delivery', 'nombre': 'Delivery', 'tipo': 'variable'},
    {'id': 'sueldos', 'nombre': 'Sueldos', 'tipo': 'fijo'},
    {'id': 'marketing', 'nombre': 'Marketing', 'tipo': 'fijo'},
    {'id': 'arriendo', 'nombre': 'Arriendo', 'tipo': 'fijo'},
    {'id': 'servicios', 'nombre': 'Servicios', 'tipo': 'fijo'},
]

seed = {'hoy': HOY.isoformat(), 'subs': subs, 'pagos': pagos, 'funnel': funnel, 'platos': platos, 'semana': semana,
        'gastos': gastos, 'categorias': CATEGORIAS}

os.makedirs(os.path.join(ROOT, 'data'), exist_ok=True)
js = json.dumps(seed, ensure_ascii=False, separators=(',', ':'))
open(os.path.join(ROOT, 'data/seed.json'), 'w', encoding='utf-8').write(js)
open(os.path.join(ROOT, 'data/seed.js'), 'w', encoding='utf-8').write('/* Datos MOCK generados por tools/generar-datos.py — no editar a mano */\nwindow.EA_SEED=' + js + ';\n')

# ───────────────────────── 6) estadísticas de control
act = [s for s in subs if activo_en(s, HOY) and not en_pausa(s, HOY)]
print('suscriptores totales', len(subs), '· activos hoy', len(act), '· pausados', sum(1 for s in subs if activo_en(s, HOY) and en_pausa(s, HOY)),
      '· cancelados', sum(1 for s in subs if s['fin']))
for m in range(6):
    a = add_months(dt.date(2026, 6, 1), m).replace(day=1)
    b = min(HOY, add_months(a, 1).replace(day=1) - dt.timedelta(days=1))
    activos_fin = sum(1 for s in subs if activo_en(s, b))
    nu = sum(1 for s in subs if a <= dt.date.fromisoformat(s['inicio']) <= b)
    ca = sum(1 for s in subs if s['fin'] and a <= dt.date.fromisoformat(s['fin']) <= b)
    ing = sum(p['monto'] for p in pagos if a <= dt.date.fromisoformat(p['f']) <= b and p['estado'] == 'cobrado')
    gas = sum(g['monto'] for g in gastos if a <= dt.date.fromisoformat(g['f']) <= b)
    print(a.strftime('%b'), 'activos', activos_fin, 'nuevos', nu, 'bajas', ca, 'cobrado $%.0f' % ing, 'neto $%.0f' % (ing / 1.15), 'gastos $%.0f' % gas, 'util $%.0f' % (ing / 1.15 - gas))
vis = sum(f['visitas'] for f in funnel); pg = sum(f['pago'] for f in funnel)
print('visitas', vis, 'pagos', pg, 'conv %.2f%%' % (100 * pg / vis))
sem = [f for f in funnel if (HOY - dt.date.fromisoformat(f['f'])).days <= 6]
ant = [f for f in funnel if 7 <= (HOY - dt.date.fromisoformat(f['f'])).days <= 34]
print('conv semana %.2f%%' % (100 * sum(f['pago'] for f in sem) / sum(f['visitas'] for f in sem)), 'conv previas 4 sem %.2f%%' % (100 * sum(f['pago'] for f in ant) / sum(f['visitas'] for f in ant)))
print('fallidos', sum(1 for p in pagos if p['estado'] == 'fallido'), 'pendientes', sum(1 for p in pagos if p['estado'] == 'pendiente'))

# ───────────────────────── 7) ilustraciones de platos (SVG, solo colores de marca)
ACAI, ACAI9, CREMA, HOJA, HOJAL, HOJA9, LILA = '#483469', '#2B1F42', '#FBF3EE', '#477129', '#82AB5F', '#1E3D1D', '#9C8BC0'


def leaf(x, y, ang, l, w, col):
    return ('<g transform="translate(%d %d) rotate(%d)"><path d="M0 0 C %d %d %d %d %d 0 C %d %d %d %d 0 0Z" fill="%s"/>'
            '<path d="M0 0 L %d 0" stroke="%s" stroke-width="2" opacity=".35"/></g>') % (x, y, ang, l * .25, -w, l * .75, -w, l, l * .75, w, l * .25, w, col, l * .9, HOJA9)


def plato_svg(pid, nombre, tags):
    h = int(hashlib.md5(pid.encode()).hexdigest(), 16)
    r = random.Random(h)
    o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 520" role="img" aria-label="Ilustración referencial: %s">' % nombre,
         '<defs><radialGradient id="g" cx="50%%" cy="40%%" r="75%%"><stop offset="0" stop-color="#5A4580"/><stop offset="1" stop-color="%s"/></radialGradient></defs>' % ACAI9,
         '<rect width="640" height="520" fill="url(#g)"/>']
    for i in range(4):
        o.append(leaf(r.choice([20, 40, 600, 620]), r.choice([30, 60, 480, 500]), r.randint(-60, 60) + (180 if i % 2 else 0), r.randint(150, 230), r.randint(36, 56), r.choice([HOJA, HOJA9, HOJA])))
    o.append('<ellipse cx="322" cy="300" rx="212" ry="30" fill="#000" opacity=".22"/>')
    o.append('<circle cx="320" cy="260" r="206" fill="%s"/><circle cx="320" cy="260" r="176" fill="#F2E8E2"/><circle cx="320" cy="260" r="176" fill="none" stroke="#E4D7DB" stroke-width="3"/>' % CREMA)
    # base (carbo): granos
    bx, by = 320 + r.randint(-60, -30), 290 + r.randint(-10, 20)
    col_c = LILA if 'vegano' in tags or 'keto' in tags else '#E9DDB7'.replace('#E9DDB7', '#E5D9E3')
    o.append('<ellipse cx="%d" cy="%d" rx="82" ry="62" fill="%s"/>' % (bx, by, col_c))
    for _ in range(46):
        a = r.random() * 6.28; rr = r.random() ** .5
        o.append('<ellipse cx="%.0f" cy="%.0f" rx="5" ry="2.6" fill="%s" transform="rotate(%d %.0f %.0f)" opacity=".8"/>' % (bx + 70 * rr * math.cos(a), by + 52 * rr * math.sin(a), '#FFFFFF' if r.random() < .5 else '#CFC1E0', r.randint(0, 180), bx + 70 * rr * math.cos(a), by + 52 * rr * math.sin(a)))
    # proteína
    px, py = 325 + r.randint(20, 55), 235 + r.randint(-20, 15)
    prot_col = ACAI if 'vegano' not in tags else HOJA
    o.append('<rect x="%d" y="%d" width="116" height="74" rx="34" fill="%s" transform="rotate(%d %d %d)"/>' % (px - 58, py - 37, prot_col, r.randint(-25, 25), px, py))
    for i in range(4):
        o.append('<path d="M%d %d q16 -8 32 0" stroke="%s" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round" transform="rotate(%d %d %d)"/>' % (px - 44 + i * 6, py - 18 + i * 14, '#2B1F42', 0, px, py))
    # vegetales
    for i in range(r.randint(5, 8)):
        o.append(leaf(int(320 + r.randint(-110, 40)), int(185 + r.randint(-30, 20)), r.randint(0, 359), r.randint(34, 52), r.randint(10, 16), r.choice([HOJA, HOJAL, HOJA9])))
    for i in range(r.randint(3, 5)):
        cx, cy = 320 + r.randint(-40, 110), 330 + r.randint(-25, 35)
        o.append('<circle cx="%d" cy="%d" r="%d" fill="%s"/><circle cx="%d" cy="%d" r="%d" fill="%s"/>' % (cx, cy, r.randint(13, 19), HOJAL, cx, cy, 6, '#CFE3B6'))
    o.append('<text x="320" y="488" text-anchor="middle" font-family="Georgia,serif" font-size="17" letter-spacing="3" fill="%s" opacity=".55">FOTO REFERENCIAL · REEMPLAZAR</text>' % CREMA)
    o.append('</svg>')
    return ''.join(o)


for p in platos:
    open(os.path.join(ROOT, p['foto']), 'w', encoding='utf-8').write(plato_svg(p['id'], p['nombre'], p['tags']))

# hojas decorativas
hoja_d = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' + leaf(30, 370, -50, 420, 90, HOJA) + leaf(60, 380, -85, 360, 70, HOJA9) + leaf(20, 380, -15, 330, 60, HOJAL) + '</svg>'
open(os.path.join(ROOT, 'assets/img/hojas.svg'), 'w').write(hoja_d)
print('OK')
