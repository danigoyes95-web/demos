import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import { useApp, go, TypeBadge, Modal, toast, money } from '../common.jsx';
import { Icon } from '../icons.jsx';
import { useGps, startGps, vibrate, getPos } from '../../js/geo.js';
import { saveExecution, photoURL, getPhotoRecord, getOrder, listToday } from '../../js/data.js';
import { stampPhoto, saveVideo } from '../../js/photo.js';
import { ensureRoute } from '../../js/route.js';
import { autoSync } from '../../js/sync.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export default function Registro({ id }) {
  const { user, tipos, motivos, cfg } = useApp();
  const [o, setO] = useState(null), [si, setSi] = useState(null), [vals, setVals] = useState({}), [motivo, setMotivo] = useState(''), [obs, setObs] = useState('');
  const [fotos, setFotos] = useState([]), [errs, setErrs] = useState({}), [confirm, setConfirm] = useState({}), [saving, setSaving] = useState(false), [done, setDone] = useState(false), [more, setMore] = useState(false);
  const [wait, setWait] = useState(0), [rec, setRec] = useState(false);
  const editing0 = useRef(false); const { pos } = useGps(); const t0 = useRef(Date.now()); const refs = useRef({});
  useEffect(() => { startGps(); getOrder(id).then(async ord => {
    setO(ord); editing0.current = !!ord.ejecucion;
    if (ord.ejecucion) { const e = ord.ejecucion; setSi(e.si); setVals(e.campos || {}); setMotivo(e.motivo || ''); setObs(e.obs || ''); setFotos(await Promise.all((e.fotos || []).map(async p => ({ id: p, url: await photoURL(p) })))); }
  }); }, [id]);
  useEffect(() => { if (si && !editing0.current) document.querySelector('.scroll input.big')?.focus(); }, [si]);
  useEffect(() => { if (wait > 0) { const i = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(i); } }, [wait]);
  if (!o) return <div class="shell" />;
  const tipo = tipos[o.tipo], editing = !!o.ejecucion;
  if (o.cerrada) return <div class="shell"><div class="scroll"><div class="alert warn"><Icon n="lock" />La jornada ya fue cerrada por el supervisor. No se puede editar.</div><button class="btn dark block" style={{ marginTop: 12 }} onClick={() => go('/')}>Volver</button></div></div>;
  const set = (k, v) => { setVals(p => ({ ...p, [k]: v })); setErrs(p => ({ ...p, [k]: undefined })); };
  const prev = o.lecturaAnterior;
  const lectura = f => { // validación inmediata de lectura
    const raw = vals[f.key]; if (raw === undefined || raw === '') return null; const v = parseFloat(String(raw).replace(',', '.'));
    if (Number.isNaN(v)) return { lvl: 'bad', msg: 'Escribe solo números.' };
    if (prev != null && v < prev) return { lvl: 'bad', msg: `La lectura (${v}) es MENOR que la anterior (${prev}). Revisa el medidor.` };
    if (prev != null && v - prev > Math.max(2000, prev)) return { lvl: 'warn', msg: `Salto anormal: +${Math.round(v - prev)} kWh sobre la anterior (${prev}). Confirma que es correcta.`, confirmable: true };
    return null;
  };
  const gpsBad = pos && pos.acc > cfg.precisionMala;
  const addPhoto = async (file, video) => {
    if (!file) return; const p = getPos();
    const pid = video ? await saveVideo(file, { cuen: o.cuen, pos: p }) : await stampPhoto(file, { cuen: o.cuen, operario: user.codigo, pos: p });
    const url = video ? null : await photoURL(pid); setFotos(f => [...f, { id: pid, url, video }]); setErrs(e => ({ ...e, fotos: undefined }));
  };
  const toggleChip = c => setObs(v => v.includes(c) ? v.replace(c, '').replace(/\s*·\s*·/g, ' · ').replace(/^\s*·\s*|\s*·\s*$/g, '').trim() : (v ? v + ' · ' : '') + c);
  const dictate = () => { if (!SR) return; const r = new SR(); r.lang = 'es-EC'; r.onresult = e => setObs(v => (v ? v + ' ' : '') + e.results[0][0].transcript); r.onend = () => setRec(false); setRec(true); r.start(); };
  const scan = async file => { try { const bd = new window.BarcodeDetector(); const bmp = await createImageBitmap(file); const r = await bd.detect(bmp); if (r[0]) return r[0].rawValue.slice(0, 20); } catch { /* */ } toast('No se pudo leer el código. Escríbelo.'); return null; };

  const validate = () => {
    const e = {};
    if (si === null) e.si = 'Indica si se pudo ejecutar.';
    if (si === false) { if (!motivo) e.motivo = 'Elige el motivo.'; if (!fotos.length) e.fotos = 'La foto es obligatoria.'; }
    if (si) for (const f of tipo.fields) {
      const v = vals[f.key];
      if (f.kind === 'photos') { if (f.required && fotos.length < (f.min || 1)) e.fotos = 'Toma al menos una foto de evidencia.'; }
      else if (f.required && (v === undefined || String(v).trim() === '')) e[f.key] = 'Este dato es obligatorio.';
      else if (f.validate === 'lectura') { const r = lectura(f); if (r?.lvl === 'bad') e[f.key] = r.msg; else if (r?.confirmable && !confirm[f.key]) e[f.key] = 'Confirma el salto de lectura.'; }
    }
    setErrs(e); const first = Object.keys(e)[0];
    if (first) { vibrate([80, 60, 80]); (refs.current[first] || refs.current.top)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    return !first;
  };
  const guardar = async () => {
    if (saving || !validate()) return; setSaving(true);
    const p = getPos();
    const ej = { si, motivo: si ? null : motivo, obs, campos: si ? vals : {}, fotos: fotos.map(f => f.id), gps: p ? { lat: p.lat, lng: p.lng, acc: p.acc } : null, gpsBaja: !!(p && p.acc > cfg.precisionMala), durSeg: Math.round((Date.now() - t0.current) / 1000) };
    await saveExecution(id, ej, user.id);
    vibrate(180); setDone(true);
    autoSync(user.id);
    setTimeout(async () => {
      if (editing) return go('/', true);
      const all = await listToday(user.id); const next = (await ensureRoute(user.id, all, getPos(), cfg)).route[0];
      go(next ? '/mapa/' + next.id : '/cierre', true);
    }, 700);
  };
  const F = (k, child) => <div ref={el => (refs.current[k] = el)} style={{ scrollMarginTop: 80 }}>{child}{errs[k] && <div class="alert bad" role="alert" style={{ marginTop: 8 }}><Icon n="warn" />{errs[k]}</div>}</div>;

  return <div class="shell">
    <header class="top" style={{ alignItems: 'flex-start' }}>
      <button aria-label="Volver" onClick={() => history.length > 1 ? history.back() : go('/')} style={{ color: '#fff', paddingTop: 4 }}><Icon n="back" size={28} /></button>
      <div class="grow" style={{ minWidth: 0 }}><div class="row" style={{ gap: 8 }}><TypeBadge tipo={o.tipo} />{editing && <span class="badge b-warn">Editando</span>}</div>
        <div class="b ellip" style={{ fontSize: 18, marginTop: 4 }}>{o.cliente}</div>
        <div class="small num" style={{ opacity: .85 }}>Med. {o.medidor} · CUEN {o.cuen}{o.deuda > 0 && ` · ${money(o.deuda)} · ${o.planillas} planillas`}</div></div>
      <button class="btn sm" style={{ background: 'transparent', color: '#fff', borderColor: '#3b5578', minHeight: 40 }} onClick={() => setMore(true)}>+ datos</button>
    </header>
    <div class="scroll col" ref={el => (refs.current.top = el)}>
      {/* GPS */}
      <div class={'alert ' + (!pos ? 'warn' : gpsBad ? 'warn' : 'ok')} id="gps-status">
        <Icon n={pos && !gpsBad ? 'check' : 'warn'} />
        <div class="grow">{!pos ? 'Buscando señal GPS…' : gpsBad ? `Precisión baja: ±${Math.round(pos.acc)} m` : `GPS capturado · precisión ±${Math.round(pos.acc)} m`}
          {gpsBad && <div class="small">Espera unos segundos a cielo abierto para mejorarla; también puedes guardar igual.</div>}</div>
        {gpsBad && <button class="btn sm" onClick={() => setWait(10)} disabled={wait > 0}>{wait > 0 ? `Esperando ${wait}s` : 'Esperar'}</button>}
      </div>
      {F('si', <div><h2 style={{ marginBottom: 10 }}>¿Se pudo ejecutar?</h2>
        <div class="qrow"><button class={'btn xl ok'} id="btn-si" style={{ minHeight: 72, opacity: si === false ? .45 : 1, outline: si ? '4px solid var(--amber)' : 'none' }} onClick={() => { setSi(true); setErrs(e => ({ ...e, si: undefined })); }}><Icon n="check" />SÍ</button>
          <button class="btn xl bad" id="btn-no" style={{ minHeight: 72, opacity: si === true ? .45 : 1, outline: si === false ? '4px solid var(--amber)' : 'none' }} onClick={() => { setSi(false); setErrs(e => ({ ...e, si: undefined })); }}><Icon n="x" />NO</button></div></div>)}
      {si === false && <>
        {F('motivo', <div><label class="f">Motivo</label><div class="col" style={{ gap: 8 }}>{motivos.map(([k, l]) => <button key={k} class={'chip' + (motivo === k ? ' on' : '')} style={{ minHeight: 56, justifyContent: 'flex-start' }} onClick={() => { setMotivo(k); setErrs(e => ({ ...e, motivo: undefined })); }}>{l}</button>)}</div></div>)}
        {F('fotos', <Evidencia fotos={fotos} addPhoto={addPhoto} setFotos={setFotos} label="Foto obligatoria (fachada / medidor)" />)}
        <Obs obs={obs} setObs={setObs} chips={['Cliente presente', 'Sin novedad']} toggleChip={toggleChip} dictate={dictate} rec={rec} />
      </>}
      {si && tipo.fields.map(f => {
        if (f.kind === 'number') { const r = lectura(f); return F(f.key, <div><label class="f" for={'f-' + f.key}>{f.label}{prev != null && <span class="muted small"> · anterior {prev}</span>}</label>
          <input id={'f-' + f.key} class="big num" inputmode="decimal" autocomplete="off" value={vals[f.key] ?? ''} onInput={e => { set(f.key, e.target.value.replace(/[^0-9.,]/g, '')); setConfirm({}); }} placeholder="0000" />
          {r && <div class={'alert ' + r.lvl} style={{ marginTop: 8 }} role="alert"><Icon n="warn" /><div class="grow">{r.msg}</div>{r.confirmable && <button class="btn sm" onClick={() => { setConfirm({ [f.key]: 1 }); setErrs(e => ({ ...e, [f.key]: undefined })); }}>{confirm[f.key] ? '✓ Confirmada' : 'Es correcta'}</button>}</div>}</div>); }
        if (f.kind === 'choice') return F(f.key, <div><label class="f">{f.label}</label><div class="qrow" style={{ gridTemplateColumns: f.options.length > 2 ? '1fr' : '1fr 1fr' }}>{f.options.map(([k, l]) => <button key={k} id={'ch-' + k} class={'btn' + (vals[f.key] === k ? ' dark' : '')} style={{ minHeight: 64, outline: vals[f.key] === k ? '4px solid var(--amber)' : 'none' }} onClick={() => set(f.key, k)}>{l}</button>)}</div></div>);
        if (f.kind === 'seal' || f.kind === 'text') return F(f.key, <div><label class="f" for={'f-' + f.key}>{f.label}{!f.required && <span class="muted small"> (opcional)</span>}<span class="muted small" style={{ float: 'right' }}>{(vals[f.key] || '').length}/{f.max || 20}</span></label>
          <div class="row"><input id={'f-' + f.key} class="grow" style={{ textTransform: f.kind === 'seal' ? 'uppercase' : 'none', fontWeight: 700, fontSize: 20 }} maxLength={f.max || 20} autocomplete="off" value={vals[f.key] ?? ''} onInput={e => set(f.key, e.target.value)} />
            {f.kind === 'seal' && 'BarcodeDetector' in window && <label class="btn" style={{ minWidth: 56, padding: 0 }} aria-label="Escanear código"><Icon n="camera" /><input type="file" accept="image/*" capture="environment" hidden onChange={async e => { const v = await scan(e.target.files[0]); if (v) set(f.key, v); }} /></label>}</div></div>);
        if (f.kind === 'photos') return F('fotos', <Evidencia fotos={fotos} addPhoto={addPhoto} setFotos={setFotos} label={f.label} />);
        if (f.kind === 'notes') return <Obs key={f.key} obs={obs} setObs={setObs} chips={f.chips} toggleChip={toggleChip} dictate={dictate} rec={rec} label={f.label} />;
        if (f.kind === 'nextnote') return <div key={f.key}><label class="f" for="f-next">Nota para el próximo operario <span class="muted small">(opcional)</span></label><textarea id="f-next" rows={2} placeholder={f.label} value={vals.notaProximo ?? o.notaLlegada ?? ''} onInput={e => set('notaProximo', e.target.value)} /></div>;
      })}
      <div style={{ height: 70 }} />
    </div>
    <div class="fab"><button class="btn primary xl" id="btn-guardar" disabled={saving} onClick={guardar}>{editing ? 'GUARDAR CAMBIOS' : 'GUARDAR Y SIGUIENTE'}<Icon n="chev" size={28} /></button></div>
    {done && <div class="modal" style={{ placeItems: 'center' }}><div class="card center" style={{ borderRadius: 24, maxWidth: 300, padding: 28 }} role="status"><div style={{ color: 'var(--ok)' }}><Icon n="check" size={72} /></div><h2>Guardada</h2><div class="muted">{si ? 'Registro completo' : 'Marcada como no ejecutada'}</div></div></div>}
    {more && <Modal onClose={() => setMore(false)}><h2>Más datos</h2><table class="t"><tbody>{[['Cuenta contrato', o.cuentaContrato], ['Dirección', o.direccion], ['Sector', o.sector], ['MRU', o.mru], ['Ruralidad', o.rural ? 'Rural' : 'Urbano'], ['Secuencia', o.secuencia], ['Valor adeudado', money(o.deuda)], ['Planillas', o.planillas], ['Lectura anterior', prev ?? '—']].map(([k, v]) => <tr><td class="muted">{k}</td><td class="b">{v}</td></tr>)}</tbody></table><button class="btn dark block" style={{ marginTop: 12 }} onClick={() => setMore(false)}>CERRAR</button></Modal>}
  </div>;
}

function Evidencia({ fotos, addPhoto, setFotos, label }) {
  const [busy, setBusy] = useState(false);
  const pick = async (e, video) => { setBusy(true); try { for (const f of e.target.files) await addPhoto(f, video); } finally { setBusy(false); e.target.value = ''; } };
  return <div><label class="f">{label}</label>
    <div class="row"><label class="btn dark grow" id="btn-foto" style={{ minHeight: 64 }}><Icon n="camera" size={28} />{busy ? 'Procesando…' : fotos.length ? 'OTRA FOTO' : 'TOMAR FOTO'}<input id="in-foto" type="file" accept="image/*" capture="environment" multiple hidden onChange={e => pick(e, false)} /></label>
      <label class="btn" style={{ minHeight: 64 }} aria-label="Grabar video corto">Video<input type="file" accept="video/*" capture="environment" hidden onChange={e => pick(e, true)} /></label></div>
    <div class="small muted" style={{ margin: '6px 0' }}>Cada foto se guarda con fecha, hora, GPS y CUEN. Se abrirá la cámara del celular.</div>
    {fotos.length > 0 && <div class="thumbs">{fotos.map((f, i) => <div key={f.id} style={{ position: 'relative' }}>{f.url ? <img src={f.url} alt={'Foto ' + (i + 1)} /> : <div class="vid" style={{ display: 'grid', placeItems: 'center', background: 'var(--line)' }}>🎥</div>}
      <button aria-label="Quitar" onClick={() => setFotos(x => x.filter(y => y.id !== f.id))} style={{ position: 'absolute', top: -6, right: -6, background: 'var(--bad)', color: '#fff', borderRadius: 99, width: 26, height: 26, display: 'grid', placeItems: 'center' }}><Icon n="x" size={14} /></button></div>)}</div>}
  </div>;
}
function Obs({ obs, setObs, chips = [], toggleChip, dictate, rec, label = 'Observaciones' }) {
  return <div><label class="f" for="f-obs">{label} <span class="muted small">(opcional)</span></label>
    <div class="chips" style={{ flexWrap: 'wrap', overflow: 'visible' }}>{chips.map(c => <button key={c} class={'chip' + (obs.includes(c) ? ' on' : '')} onClick={() => toggleChip(c)}>{c}</button>)}</div>
    <div class="row" style={{ alignItems: 'flex-start' }}><textarea id="f-obs" class="grow" value={obs} onInput={e => setObs(e.target.value)} placeholder="Escribe o dicta…" />{SR && <button class={'btn' + (rec ? ' bad' : '')} style={{ minWidth: 56, padding: 0 }} aria-label="Dictar" onClick={dictate}><Icon n="mic" /></button>}</div></div>;
}
