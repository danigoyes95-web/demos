import { useState } from 'preact/hooks';
import { parseFile, validate } from '../../js/parsers/eea-pdf.js';
import { importOrders, findDuplicates, lookupLocation, locKey, dayKey } from '../../js/data.js';
import { Icon } from '../icons.jsx';
import { go, toast, TypeBadge, Skeleton } from '../common.jsx';

const SHOW_OK = 120; // la tabla muestra primero los problemas y solo las primeras filas correctas (el archivo real trae >1.300)
export default function Cargar({ tipos }) {
  const [st, setSt] = useState('idle'), [rows, setRows] = useState([]), [meta, setMeta] = useState(null), [over, setOver] = useState(false), [dup, setDup] = useState(new Set()), [known, setKnown] = useState({}), [name, setName] = useState(''), [err, setErr] = useState(''), [res, setRes] = useState(0), [busy, setBusy] = useState(false);
  const kd = o => o.tipo + '|' + locKey(o);
  const analyze = async list => {
    validate(list); setDup(await findDuplicates(list));
    const k = {}; for (const o of list) { const l = await lookupLocation(o); if (l) k[kd(o)] = l; } setKnown(k); setRows([...list]);
  };
  const load = async file => {
    setErr(''); setName(file.name); setSt('parsing');
    try { const r = await parseFile(file); if (!r.orders.length) throw new Error('No se detectaron órdenes. El formato puede ser distinto: hay que ajustar js/parsers/eea-pdf.js.'); setMeta(r.meta); await analyze(r.orders); setSt('review'); }
    catch (e) { setErr(e.message); setSt('idle'); }
  };
  const sample = async (path, mime) => { const b = await (await fetch(path)).blob(); load(new File([b], path.split('/').pop(), { type: mime })); };
  const XL = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const edit = (i, k, v) => { rows[i][k] = (k === 'lat' || k === 'lng') ? (v === '' ? NaN : parseFloat(v)) : v; if (k === 'tipo') rows[i]._rawTipo = v; analyze(rows); };
  const discard = i => analyze(rows.filter((_, j) => j !== i));
  const errCount = o => Object.keys(o._errors || {}).length;
  const bad = rows.filter(errCount), good = rows.length - bad.length;
  const isDup = o => dup.has(kd(o));
  const importable = rows.filter(o => !errCount(o) && !isDup(o));
  const doImport = async () => { setBusy(true); const n = await importOrders(importable, dayKey()); setBusy(false); setRes(n); setSt('done'); toast(`✓ ${n} órdenes importadas`); };
  const has = k => rows.some(o => Number.isFinite(o[k]) || (o[k] && o[k] !== 0));
  const cm = has('medidor'), cc = has('cliente'), cl = has('lat'), cd = has('deuda');
  const nKnown = Object.keys(known).length, nCoords = rows.filter(o => Number.isFinite(o.lat)).length;
  const view = [...rows.map((o, i) => [o, i]).filter(([o]) => errCount(o)), ...rows.map((o, i) => [o, i]).filter(([o]) => !errCount(o)).slice(0, SHOW_OK)];
  const Cell = ({ o, i, k, w, num }) => { const e = o._errors?.[k]; const v = o[k]; const show = num ? (Number.isFinite(v) ? v : (v || '')) : (v ?? '');
    return e ? <td class="err" title={e}><input value={show} style={{ minHeight: 36, width: w || 110, fontSize: 13, padding: '0 8px' }} onChange={ev => edit(i, k, ev.target.value)} /><div class="small b" style={{ color: 'var(--bad)' }}>{e}</div></td> : <td class={num ? 'num' : ''}>{show}</td>; };
  const nonEditable = o => ['statusSistema', 'direccion'].map(k => o._errors[k]).filter(Boolean);
  return <div class="col" style={{ gap: 14 }}>
    <h1>Cargar órdenes</h1>
    {st === 'idle' && <><div class={'drop' + (over ? ' over' : '')} onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); e.dataTransfer.files[0] && load(e.dataTransfer.files[0]); }}>
      <Icon n="upload" size={48} /><h2 style={{ margin: '8px 0' }}>Arrastra el Excel o PDF de la empresa eléctrica</h2><p class="muted">Cortes (DC01) y reconexiones (RC01) se cargan por separado. Se lee en tu navegador: el archivo no sale de este equipo.</p>
      <div class="row wrap" style={{ justifyContent: 'center' }}><label class="btn primary">Elegir archivo<input id="file" type="file" accept=".pdf,.csv,.xlsx,.txt" hidden onChange={e => e.target.files[0] && load(e.target.files[0])} /></label></div></div>
      <div class="card col"><div class="b">Probar con archivos de ejemplo (ficticios)</div>
        <div class="row wrap"><button class="btn" id="btn-sample-dc" onClick={() => sample('/samples/DC01-ejemplo.xlsx', XL)}>Cortes (Excel, formato empresa)</button><button class="btn" id="btn-sample-rc" onClick={() => sample('/samples/RC01-ejemplo.xlsx', XL)}>Reconexiones (Excel)</button><button class="btn ghost" id="btn-sample" onClick={() => sample('/samples/ordenes-ejemplo.pdf', 'application/pdf')}>PDF de ejemplo</button></div>
        <div class="muted small">Los Excel de ejemplo tienen las mismas 37 columnas que el archivo real, con datos inventados y algunos errores a propósito.</div></div>
      {err && <div class="alert bad" role="alert"><Icon n="warn" />{err}</div>}</>}
    {st === 'parsing' && <><div class="b">Leyendo {name}…</div><Skeleton n={5} /></>}
    {st === 'review' && <>
      <div class="card row wrap"><div class="grow"><h2 id="resumen">Se detectaron {rows.length} órdenes · {good} correctas · {bad.length} con problemas</h2>
        <div class="muted small">{name} · {meta.formato}{meta.paginas ? ` · ${meta.paginas} pág.` : ''} · {new Set(rows.map(o => o.mru)).size > 1 && `${new Set(rows.map(o => o.mru).filter(Boolean)).size} rutas de lectura · `}{nKnown} con ubicación verificada conocida · {nCoords} con coordenadas · {rows.length - nKnown - nCoords} sin ubicación · {dup.size} ya cargadas hoy</div></div>
        <button class="btn ghost" onClick={() => setSt('idle')}>Cancelar</button><button class="btn primary" id="btn-importar" disabled={!importable.length || busy} onClick={doImport}>{busy ? 'IMPORTANDO…' : `IMPORTAR ${importable.length}`}</button></div>
      {bad.length > 0 && <div class="alert warn"><Icon n="warn" />Corrige las celdas rojas o descarta la fila. Las órdenes con problemas no se importan.</div>}
      {rows.length - nKnown - nCoords > 0 && <div class="alert info"><Icon n="info" />Este archivo no trae coordenadas: esas órdenes se ordenan por <b>ruta de lectura y secuencia</b> de la empresa, y cada visita del operario guarda el punto exacto para los días siguientes.</div>}
      <div class="tw" style={{ maxHeight: '60vh' }}><table class="t"><thead><tr><th>#</th><th>Tipo</th><th>Cuenta</th>{cm && <th>Medidor</th>}{cc && <th>Cliente</th>}<th>Dirección</th><th>Distrito</th><th>Ruta-sec.</th>{cd && <th>Deuda</th>}{cl && <><th>Lat</th><th>Lng</th></>}<th>Ubicación</th><th>Estado</th></tr></thead>
        <tbody>{view.map(([o, i]) => { const errs = errCount(o), kn = known[kd(o)];
          return <tr key={i} style={errs ? { background: 'var(--bad-bg)' } : null}><td class="num">{i + 1}</td>
            {o._errors.tipo ? <td class="err"><select value={o.tipo || ''} onChange={e => edit(i, 'tipo', e.target.value)} style={{ minHeight: 36, fontSize: 13 }}><option value="">—</option>{Object.entries(tipos).map(([k, t]) => <option value={k}>{t.label}</option>)}</select><div class="small b" style={{ color: 'var(--bad)' }}>{o._errors.tipo}</div></td> : <td>{o.tipo && <TypeBadge tipo={o.tipo} />}</td>}
            <Cell o={o} i={i} k="cuen" num />{cm && <Cell o={o} i={i} k="medidor" num />}{cc && <Cell o={o} i={i} k="cliente" w={170} />}<td>{o.direccion}</td><td>{o.sector}</td><td class="num">{o.mru}{o.secuencia ? '-' + o.secuencia : ''}</td>{cd && <td class="num">{o.deuda ? '$' + o.deuda.toFixed(2) : ''}</td>}
            {cl && <><Cell o={o} i={i} k="lat" num w={90} /><Cell o={o} i={i} k="lng" num w={90} /></>}
            <td>{kn ? <span class="badge b-ok"><Icon n="check" />Verificada (base)</span> : Number.isFinite(o.lat) && !o._errors.lat ? <span class="badge b-warn"><Icon n="warn" />Aproximada</span> : <span class="badge b-bad"><Icon n="x" />Sin ubicación</span>}</td>
            <td>{errs ? <div class="col" style={{ gap: 4 }}><span class="badge b-bad"><Icon n="x" />Con problemas</span>{nonEditable(o).map(t => <span class="small b" style={{ color: 'var(--bad)' }}>{t}</span>)}<button class="btn ghost sm" style={{ minHeight: 32, fontSize: 13 }} onClick={() => discard(i)}>Descartar</button></div> : isDup(o) ? <span class="badge b-warn">Ya cargada</span> : <span class="badge b-ok"><Icon n="check" />OK</span>}</td></tr>; })}</tbody></table></div>
      {good > SHOW_OK && <div class="muted small">Mostrando los problemas y las primeras {SHOW_OK} órdenes correctas de {good}. Se importan todas las correctas.</div>}</>}
    {st === 'done' && <div class="card center col" style={{ alignItems: 'center', padding: 40 }}><div style={{ color: 'var(--ok)' }}><Icon n="check" size={64} /></div><h2>{res} órdenes importadas</h2><p class="muted">Quedaron sin asignar. Asígnalas a las cuadrillas (por ruta de lectura es lo más práctico).</p><div class="row"><button class="btn primary" id="btn-ir-asignar" onClick={() => go('/sup/asignar')}>ASIGNAR AHORA</button><button class="btn" onClick={() => { setSt('idle'); setRows([]); }}>Cargar otro archivo</button></div></div>}
  </div>;
}
