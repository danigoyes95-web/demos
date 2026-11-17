import { useState, useEffect } from 'preact/hooks';
import { getOperarios, saveOperario, deleteOperario, saveConfig, saveTipos, saveMotivos, getTipos } from '../../js/data.js';
import { toast, Skeleton } from '../common.jsx';
import { Icon } from '../icons.jsx';

export default function Config({ cfg, tipos, motivos, reload }) {
  const [ops, setOps] = useState(null), [c, setC] = useState(cfg), [json, setJson] = useState(JSON.stringify(tipos, null, 2)), [mot, setMot] = useState(motivos.map(m => m[1]).join('\n')), [jerr, setJerr] = useState('');
  const loadOps = () => getOperarios().then(a => setOps(a.filter(o => o.rol === 'operario')));
  useEffect(() => { loadOps(); }, []);
  if (!ops) return <Skeleton />;
  const up = (o, k, v) => { o[k] = v; setOps([...ops]); };
  const saveOp = async o => { if (!o.nombre || !/^\d{4}$/.test(o.pin)) return toast('Nombre obligatorio y PIN de 4 dígitos'); await saveOperario(o); toast('✓ Operario guardado'); };
  const add = () => { const n = ops.length + 1; setOps([...ops, { id: 'op' + Date.now().toString(36), codigo: `OP-${String(n).padStart(2, '0')}`, nombre: '', pin: '', cuadrilla: '', rol: 'operario', color: '#2F6FED' }]); };
  const del = async o => { await deleteOperario(o.id); loadOps(); };
  const num = k => e => setC({ ...c, [k]: parseFloat(e.target.value) || 0 });
  const saveCfg = async () => { await saveConfig(c); await reload(); toast('✓ Configuración guardada'); };
  const saveT = async () => { try { const t = JSON.parse(json); for (const [k, v] of Object.entries(t)) if (!v.label || !Array.isArray(v.fields)) throw new Error(`"${k}" debe tener label y fields`); await saveTipos(t); await reload(); setJerr(''); toast('✓ Tipos de orden guardados'); } catch (e) { setJerr(e.message); } };
  const saveM = async () => { const list = mot.split('\n').map(s => s.trim()).filter(Boolean).map(l => [l.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''), l]); await saveMotivos(list); await reload(); toast('✓ Motivos guardados'); };
  return <div class="col" style={{ gap: 14 }}>
    <h1>Configuración</h1>
    <div class="card col"><div class="row"><h3 class="grow">Operarios</h3><button class="btn sm" onClick={add}><Icon n="plus" size={20} />Agregar</button></div>
      <div class="tw"><table class="t"><thead><tr><th>Código</th><th>Nombre</th><th>PIN</th><th>Cuadrilla</th><th></th></tr></thead><tbody>{ops.map(o => <tr><td><input value={o.codigo} onInput={e => up(o, 'codigo', e.target.value)} style={{ width: 100, minHeight: 40 }} /></td><td><input value={o.nombre} onInput={e => up(o, 'nombre', e.target.value)} style={{ minHeight: 40 }} /></td><td><input value={o.pin} inputmode="numeric" maxLength={4} onInput={e => up(o, 'pin', e.target.value)} style={{ width: 80, minHeight: 40 }} /></td><td><input value={o.cuadrilla} onInput={e => up(o, 'cuadrilla', e.target.value)} style={{ minHeight: 40 }} /></td><td class="row"><button class="btn sm primary" onClick={() => saveOp(o)}>Guardar</button><button class="btn sm ghost" aria-label="Eliminar" onClick={() => del(o)}><Icon n="x" size={20} /></button></td></tr>)}</tbody></table></div></div>
    <div class="card col"><h3>Parámetros de campo</h3>
      <div class="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>{[['radioLlegada', 'Radio de llegada (m)'], ['precisionMala', 'Precisión GPS mala (> m)'], ['precisionVerificada', 'Precisión para ubicación verificada (≤ m)'], ['distanciaSospechosa', 'Distancia sospechosa (> m)'], ['inactividadMin', 'Alerta de inactividad (min)']].map(([k, l]) => <div><label class="f">{l}</label><input type="number" class="num" value={c[k]} onInput={num(k)} /></div>)}
        <label class="row" style={{ gridColumn: '1 / -1' }}><input type="checkbox" style={{ width: 28, minHeight: 28 }} checked={!!c.respetarSecuencia} onChange={e => setC({ ...c, respetarSecuencia: e.target.checked })} /><span><b>Respetar la secuencia del PDF</b> dentro de cada ruta (MRU). Apágalo para que Safelock optimice el orden por cercanía.</span></label>
        <div><label class="f">Empresa eléctrica</label><input value={c.empresa} onInput={e => setC({ ...c, empresa: e.target.value })} /></div></div><div><button class="btn primary" onClick={saveCfg}>Guardar parámetros</button></div></div>
    <div class="card col"><h3>Motivos de no ejecución</h3><div class="muted small">Uno por línea. El último suele ser “Otro”.</div><textarea rows={8} value={mot} onInput={e => setMot(e.target.value)} /><div><button class="btn primary" onClick={saveM}>Guardar motivos</button></div></div>
    <div class="card col"><h3>Tipos de orden y sus campos (JSON)</h3><div class="muted small">Cada tipo define su formulario. Tipos de campo: number, choice, seal, text, photos, notes, nextnote. Es el mismo archivo <code>src/data/order-types.json</code>.</div>
      <textarea rows={16} style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13 }} value={json} onInput={e => setJson(e.target.value)} />{jerr && <div class="alert bad"><Icon n="warn" />{jerr}</div>}
      <div class="row"><button class="btn primary" onClick={saveT}>Guardar tipos</button><button class="btn ghost" onClick={async () => { const d = (await import('../../data/order-types.json')).default; setJson(JSON.stringify(d, null, 2)); }}>Restaurar originales</button></div></div>
  </div>;
}
