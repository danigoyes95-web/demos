import { useState } from 'preact/hooks';
import { parseFile, validate } from '../../js/parsers/eea-pdf.js';
import { importOrders, findDuplicates, lookupLocation, dayKey } from '../../js/data.js';
import { Icon } from '../icons.jsx';
import { go, toast, TypeBadge, Skeleton } from '../common.jsx';

export default function Cargar({ tipos }) {
  const [st, setSt] = useState('idle'), [rows, setRows] = useState([]), [meta, setMeta] = useState(null), [over, setOver] = useState(false), [dup, setDup] = useState(new Set()), [known, setKnown] = useState({}), [name, setName] = useState(''), [err, setErr] = useState(''), [res, setRes] = useState(0);
  const analyze = async (list) => {
    validate(list);
    setDup(await findDuplicates(list.map(o => o.cuen)));
    const k = {}; for (const o of list) { const l = o.medidor && await lookupLocation(o.medidor, o.cuen); if (l) k[o.cuen + o.medidor] = l; } setKnown(k); setRows([...list]);
  };
  const load = async file => {
    setErr(''); setName(file.name); setSt('parsing');
    try { const r = await parseFile(file); if (!r.orders.length) throw new Error('No se detectaron órdenes. El formato puede ser distinto: hay que ajustar js/parsers/eea-pdf.js.'); setMeta(r.meta); await analyze(r.orders); setSt('review'); }
    catch (e) { setErr(e.message); setSt('idle'); }
  };
  const sample = async () => { const b = await (await fetch('/samples/ordenes-ejemplo.pdf')).blob(); load(new File([b], 'ordenes-ejemplo.pdf', { type: 'application/pdf' })); };
  const edit = (i, k, v) => { rows[i][k] = (k === 'lat' || k === 'lng') ? (v === '' ? NaN : parseFloat(v)) : v; if (k === 'tipo') rows[i]._rawTipo = v; analyze(rows); };
  const bad = rows.filter(o => Object.keys(o._errors || {}).length), good = rows.length - bad.length;
  const isDup = o => dup.has(o.cuen);
  const importable = rows.filter(o => !Object.keys(o._errors).length && !isDup(o));
  const doImport = async () => { const n = await importOrders(importable, dayKey()); setRes(n); setSt('done'); toast(`✓ ${n} órdenes importadas`); };
  const Cell = ({ o, i, k, w, num }) => { const e = o._errors?.[k] || (k === 'lat' ? o._errors?.lat : null); const v = o[k]; const show = num ? (Number.isFinite(v) ? v : '') : (v ?? '');
    return e ? <td class="err" title={e}><input value={show} style={{ minHeight: 36, width: w || 110, fontSize: 13, padding: '0 8px' }} onChange={ev => edit(i, k, ev.target.value)} /><div class="small b" style={{ color: 'var(--bad)' }}>{e}</div></td> : <td class={num ? 'num' : ''}>{show}</td>; };
  return <div class="col" style={{ gap: 14 }}>
    <h1>Cargar órdenes</h1>
    {st === 'idle' && <><div class={'drop' + (over ? ' over' : '')} onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); e.dataTransfer.files[0] && load(e.dataTransfer.files[0]); }}>
      <Icon n="upload" size={48} /><h2 style={{ margin: '8px 0' }}>Arrastra el PDF de la empresa eléctrica</h2><p class="muted">También acepta Excel (.xlsx) o CSV. El archivo se lee en tu navegador: no sale de este equipo.</p>
      <div class="row" style={{ justifyContent: 'center' }}><label class="btn primary">Elegir archivo<input id="file" type="file" accept=".pdf,.csv,.xlsx,.txt" hidden onChange={e => e.target.files[0] && load(e.target.files[0])} /></label><button class="btn" id="btn-sample" onClick={sample}>Usar PDF de ejemplo</button></div></div>
      {err && <div class="alert bad" role="alert"><Icon n="warn" />{err}</div>}
      <div class="alert info"><Icon n="info" />El PDF de ejemplo es ficticio y trae 3 errores a propósito (medidor faltante, CUEN duplicado y coordenadas inválidas) para mostrar la revisión.</div></>}
    {st === 'parsing' && <><div class="b">Leyendo {name}…</div><Skeleton n={5} /></>}
    {st === 'review' && <>
      <div class="card row wrap"><div class="grow"><h2 id="resumen">Se detectaron {rows.length} órdenes · {good} correctas · {bad.length} con problemas</h2>
        <div class="muted small">{name} · {meta.formato}{meta.paginas ? ` · ${meta.paginas} pág.` : ''}{meta.modo ? ` · lectura ${meta.modo}` : ''} · {Object.keys(known).length} ubicaciones verificadas asignadas automáticamente · {dup.size} ya cargadas hoy</div></div>
        <button class="btn ghost" onClick={() => setSt('idle')}>Cancelar</button><button class="btn primary" id="btn-importar" disabled={!importable.length} onClick={doImport}>IMPORTAR {importable.length}</button></div>
      {bad.length > 0 && <div class="alert warn"><Icon n="warn" />Corrige las celdas rojas directamente en la tabla. Las órdenes con problemas no se importan hasta corregirlas.</div>}
      <div class="tw" style={{ maxHeight: '60vh' }}><table class="t"><thead><tr><th>#</th><th>Tipo</th><th>CUEN</th><th>Medidor</th><th>Cliente</th><th>Dirección</th><th>Sector</th><th>Deuda</th><th>Lat</th><th>Lng</th><th>Ubicación</th><th>Estado</th></tr></thead>
        <tbody>{rows.map((o, i) => { const errs = Object.keys(o._errors || {}).length, kn = known[o.cuen + o.medidor];
          return <tr style={errs ? { background: 'var(--bad-bg)' } : null}><td class="num">{i + 1}</td>
            {o._errors.tipo ? <td class="err"><select value={o.tipo || ''} onChange={e => edit(i, 'tipo', e.target.value)} style={{ minHeight: 36, fontSize: 13 }}><option value="">—</option>{Object.entries(tipos).map(([k, t]) => <option value={k}>{t.label}</option>)}</select><div class="small b" style={{ color: 'var(--bad)' }}>{o._errors.tipo}</div></td> : <td>{o.tipo && <TypeBadge tipo={o.tipo} />}</td>}
            <Cell o={o} i={i} k="cuen" num /><Cell o={o} i={i} k="medidor" num /><Cell o={o} i={i} k="cliente" w={170} /><td>{o.direccion}</td><td>{o.sector}</td><td class="num">{o.deuda ? '$' + o.deuda.toFixed(2) : ''}</td>
            <Cell o={o} i={i} k="lat" num w={90} /><Cell o={o} i={i} k="lng" num w={90} />
            <td>{kn ? <span class="badge b-ok"><Icon n="check" />Verificada (base)</span> : Number.isFinite(o.lat) && !o._errors.lat ? <span class="badge b-warn"><Icon n="warn" />Aproximada</span> : <span class="badge b-bad"><Icon n="x" />Sin ubicación</span>}</td>
            <td>{errs ? <span class="badge b-bad"><Icon n="x" />Con problemas</span> : isDup(o) ? <span class="badge b-warn">Ya cargada</span> : <span class="badge b-ok"><Icon n="check" />OK</span>}</td></tr>; })}</tbody></table></div></>}
    {st === 'done' && <div class="card center col" style={{ alignItems: 'center', padding: 40 }}><div style={{ color: 'var(--ok)' }}><Icon n="check" size={64} /></div><h2>{res} órdenes importadas</h2><p class="muted">Quedaron sin asignar. Asígnalas a las cuadrillas.</p><div class="row"><button class="btn primary" id="btn-ir-asignar" onClick={() => go('/sup/asignar')}>ASIGNAR AHORA</button><button class="btn" onClick={() => { setSt('idle'); setRows([]); }}>Cargar otro archivo</button></div></div>}
  </div>;
}
