import { useState, useEffect } from 'preact/hooks';
import { useApp, go, Empty, toast } from '../common.jsx';
import { Icon } from '../icons.jsx';
import { distanceDone, syncAll } from '../../js/data.js';
import { useOnline, usePending, onSynced, autoSync } from '../../js/sync.js';
import { fmtDist } from '../../js/geo.js';
import { useToday } from './hooks.js';

export default function Cierre() {
  const { user, motivos, tipos } = useApp(); const [orders, reload] = useToday(user.id); const [km, setKm] = useState(0), [busy, setBusy] = useState(false);
  const online = useOnline(); const pending = usePending(user.id, orders);
  useEffect(() => { distanceDone(user.id).then(setKm); }, [orders]);
  if (!orders) return <div class="shell" />;
  const hechas = orders.filter(o => o.estado === 'hecha'), no = orders.filter(o => o.estado === 'no_ejecutada'), pend = orders.filter(o => o.estado === 'pendiente');
  const porMotivo = {}; no.forEach(o => { const k = o.ejecucion?.motivo; porMotivo[k] = (porMotivo[k] || 0) + 1; });
  const enviar = async () => { setBusy(true); const n = await syncAll(user.id); setBusy(false); toast(n ? `✓ ${n} registros enviados a la empresa (simulado)` : 'Todo estaba enviado'); reload(); };
  return <div class="shell">
    <header class="top"><button aria-label="Volver" onClick={() => go('/')} style={{ color: '#fff' }}><Icon n="back" size={28} /></button><div class="grow b" style={{ fontSize: 18 }}>Cierre de jornada</div></header>
    <div class="scroll col">
      <div class="row"><div class="stat"><b class="num" style={{ color: 'var(--ok)' }}>{hechas.length}</b><span class="small b">Ejecutadas</span></div><div class="stat"><b class="num" style={{ color: 'var(--bad)' }}>{no.length}</b><span class="small b">No ejecutadas</span></div><div class="stat"><b class="num" style={{ color: 'var(--info)' }}>{pend.length}</b><span class="small b">Pendientes</span></div></div>
      <div class="card row"><Icon n="nav" /><div class="grow">Recorrido estimado</div><b class="num" style={{ fontSize: 22 }}>{fmtDist(km)}</b></div>
      {no.length > 0 && <div class="card"><h3 style={{ marginBottom: 8 }}>No ejecutadas por motivo</h3>{Object.entries(porMotivo).map(([k, n]) => <div class="row" style={{ padding: '4px 0' }}><span class="grow">{motivos.find(m => m[0] === k)?.[1] || k}</span><b class="num">{n}</b></div>)}</div>}
      {pend.length > 0 && <div class="alert warn"><Icon n="warn" />Te faltan {pend.length} órdenes por atender. Puedes volver a la ruta o cerrar así.</div>}
      <div class={'alert ' + (pending ? 'info' : 'ok')}><Icon n={online ? 'wifi' : 'wifioff'} /><div>{pending ? `${pending} registro${pending > 1 ? 's' : ''} guardado${pending > 1 ? 's' : ''} en tu celular, por enviar.` : 'Todo está enviado y respaldado.'}{!online && ' Sin señal: se enviarán solos cuando vuelva.'}</div></div>
      <button class="btn primary xl" id="btn-enviar" disabled={busy || !online || !pending} onClick={enviar}><Icon n="send" size={28} />{busy ? 'ENVIANDO…' : 'ENVIAR TODO'}</button>
      {pend.length > 0 && <button class="btn dark block" onClick={() => go('/')}>Volver a mi jornada</button>}
      <p class="muted small center">Puedes corregir cualquier registro hasta que el supervisor cierre la jornada (toca la orden en la lista).</p>
    </div>
  </div>;
}
