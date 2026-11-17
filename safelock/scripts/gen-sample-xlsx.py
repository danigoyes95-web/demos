# Genera Excel de ejemplo con las MISMAS 37 columnas que exporta la empresa (SAP), con datos 100 % ficticios.
# Uso: python3 scripts/gen-sample-xlsx.py   (requiere openpyxl)
import json, random, datetime as dt, openpyxl, os
random.seed(7)
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
seed = json.load(open(root + '/src/data/seed.json'))
H = ['Orden','Clase de orden','Cuenta contrato','Fecha entrada','Creado a las','Descripción Emplazam','Distrito','Calle','Unidad de Lectura -','Área de empresa','Status sistema','Liberación real','Pto.tbjo.resp.','Autor','Descripción Puesto d','Status usuario','Desc.Act.PM','Modificado por','Usuario web ordenes','Fecha de Ingreso','Ce.emplazam.','Emplazamiento','Fecha EjecuciónTrab','Codificación','Hora Inicio Trabajo','Hora Fin de Trabajo','Hora de Ingreso','Estado','Instalación','Desc. Accion Medidor','Fecha modific.','Descripción Tarifa V','Ubicac.técnica','Grupo códigos','Descripción de códig','Cl.actividad PM','CO - Des. Tipo Equip']
# (MRU, distrito, rural) — rutas de lectura ficticias
RUTAS = [('0101M001','AMBATO',0),('0101M002','AMBATO',0),('0102M010','HUACHI CHICO',0),('0102M011','HUACHI CHICO',1),('0103M020','SANTA ROSA',1),('0103M021','IZAMBA',1),('0104M030','QUISAPINCHA',1),('0104M031','PILAHUÍN',1)]
CALLES = ['CALLE LOS CEDROS','AV. LAS PALMAS','PASAJE LA ESPERANZA','CALLE EL MIRADOR','CAMINO A LA CAPILLA','CALLE 10 DE AGOSTO','AV. EL SOL','CALLE LAS ROSAS','VÍA PRINCIPAL','CALLE LOS ALISOS','PASAJE B','CALLE SAN JOSÉ']
TARIFAS = ['BT Residencial']*8 + ['BT Comercial']*2 + ['BT Residencial para el Programa PEC','BT Industrial Artesanal']
def dig(n): return ''.join(random.choice('0123456789') for _ in range(n))
def build(path, clase, desc, n, pm, known, errores):
    wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Hoja1'; ws.append(H)
    hoy = dt.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    seqs = {r[0]: 0 for r in RUTAS}; rows = []
    for i in range(n):
        mru, dist, rural = RUTAS[i % len(RUTAS)] if clase == 'RC01' else random.choice(RUTAS)
        seqs[mru] += random.randint(1, 9)
        cc = known.pop(0) if known else '2010' + dig(8)
        ul = f'{mru}-{seqs[mru]:06d}'
        if errores.get('sinsec') == i: ul = mru
        calle = random.choice(CALLES) + (' Sn' if random.random() < .5 else f' {random.randint(1,99)}')
        orden = dig(8) if clase == 'DC01' else '1300' + dig(8)
        st = 'LIB. DMNV KKMP'
        rows.append([orden, clase, cc, hoy - dt.timedelta(days=random.randint(1, 20)), f'0{random.randint(4,7)}:{random.randint(10,59)}:{random.randint(10,59)}', 'ZONA RURAL' if rural else 'ZONA URBANA', dist, calle, ul, '100', st, hoy, 'E0100000', 'WF-BATCH', 'CONTRATISTA DEMO CIA. LTDA.', 'SINA', desc, '0000000000', None, None, '0300', '0302' if rural else '0300', None, '', '00:00:00', '00:00:00', '00:00:00', '@08@-Activo', dig(10), '', hoy, random.choice(TARIFAS), dig(10), '', '', pm, ''])
    for k, v in errores.get('abie', []): rows[k][10] = 'ABIE DMNV KKMP'; rows[k][11] = None
    if 'dup' in errores: a, b = errores['dup']; rows[b][2] = rows[a][2]
    for r in rows: ws.append(r)
    wb.save(path)
os.makedirs(root + '/public/samples', exist_ok=True)
# Cuentas con ubicación verificada de visitas anteriores (y cuyo tipo de hoy no es reconexión, para no chocar con duplicados)
tipo_hoy = {o['cuentaContrato']: o['tipo'] for o in seed['ordenes']}
known = [l['cuentaContrato'] for l in seed['locations'] if tipo_hoy.get(l['cuentaContrato']) != 'reconexion'][:6]
build(root + '/public/samples/DC01-ejemplo.xlsx', 'DC01', 'Corte por mora', 96, '070', [], {'dup': (10, 40), 'abie': [(5, 1), (60, 1)], 'sinsec': 20})
build(root + '/public/samples/RC01-ejemplo.xlsx', 'RC01', 'Reconexión', 24, '074', known, {})
print('Excel de ejemplo generados')
