import { useState, useEffect, useCallback } from 'preact/hooks';
import { useApp, go, toast, Modal } from '../common.jsx';
import { Icon, Logo } from '../icons.jsx';
import { resetDemo, closeDay, dayKey, listOrders, getPositions, getOperarios } from '../../js/data.js';
import { applyTheme } from '../App.jsx';
import Monitoreo from './Monitoreo.jsx';
import Ordenes from './Ordenes.jsx';
import Cargar from './Cargar.jsx';
import Asignar from './Asignar.jsx';
import Reportes from './Reportes.jsx';
import Config from './Config.jsx';

const NAV = [['', 'Monitoreo', 'map'], ['ordenes', 'Órdenes', 'list'], ['cargar', 'Cargar PDF', 'upload'], ['asignar', 'Asignar', 'users'], ['reportes', 'Reportes', 'chart'], ['config', 'Configuración', 'gear']];
// Datos compartidos del panel (refresca cada 5 s para el monitoreo "en vivo")
export function useData(fecha) {
  const [d, set] = useState(null);
  const load = useCallback(async () => set({ orders: await listOrders(fecha ? { fecha } : {}), pos: await getPositions(), ops: (await getOperarios()).filter(o => o.rol === 'operario') }), [fecha]);
  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, [load]);
  return [d, load];
}
export default function Supervisor({ route }) {
  const { user, logout, tipos, motivos, cfg, reload } = useApp(); const sub = route.parts[1] || '';
  const [confirm, setConfirm] = useState(null);
  const reset = async () => { await resetDemo(); await reload(); toast('Demo reiniciada con los datos originales'); setConfirm(null); location.hash = '#/'; location.reload(); };
  const theme = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('sl_theme', t); applyTheme(); };
  const props = { tipos, motivos, cfg, user };
  return <div class="sup">
    <nav class="side" aria-label="Principal">
      <div class="row brand" style={{ padding: '4px 8px 14px' }}><Logo size={40} /><div><div class="b" style={{ fontSize: 20 }}>Safelock</div><div class="small" style={{ opacity: .7 }}>Panel supervisor</div></div></div>
      {NAV.map(([k, l, i]) => <a href={'#/sup' + (k ? '/' + k : '')} class={sub === k ? 'on' : ''}><Icon n={i} />{l}</a>)}
      <div class="grow" />
      <div class="foot col" style={{ gap: 8 }}>
        <button class="btn sm" style={{ background: '#26405f', color: '#fff', borderColor: '#35557f' }} onClick={() => setConfirm('cerrar')}><Icon n="lock" size={20} />Cerrar jornada de hoy</button>
        <button class="btn sm" style={{ background: 'transparent', color: '#fff', borderColor: '#35557f' }} id="btn-reset" onClick={() => setConfirm('reset')}><Icon n="refresh" size={20} />Reiniciar demo</button>
        <div class="row"><button class="btn sm grow" style={{ background: 'transparent', color: '#fff', borderColor: '#35557f' }} onClick={theme}><Icon n="sun" size={20} />Tema</button><button class="btn sm grow" style={{ background: 'transparent', color: '#fff', borderColor: '#35557f' }} onClick={logout}>Salir</button></div>
        <div class="small" style={{ opacity: .6 }}>{user.nombre}</div>
      </div>
    </nav>
    <main class="main">
      {sub === '' && <Monitoreo {...props} />}
      {sub === 'ordenes' && <Ordenes {...props} />}
      {sub === 'cargar' && <Cargar {...props} />}
      {sub === 'asignar' && <Asignar {...props} />}
      {sub === 'reportes' && <Reportes {...props} />}
      {sub === 'config' && <Config {...props} reload={reload} />}
    </main>
    {confirm && <Modal onClose={() => setConfirm(null)}>
      <h2>{confirm === 'reset' ? '¿Reiniciar la demo?' : '¿Cerrar la jornada de hoy?'}</h2>
      <p class="muted">{confirm === 'reset' ? 'Se borran todos los cambios y vuelven los datos de ejemplo originales (3 operarios, 60 órdenes, 2 semanas de historial).' : 'Los operarios ya no podrán corregir los registros de hoy.'}</p>
      <div class="qrow"><button class="btn" onClick={() => setConfirm(null)}>Cancelar</button>
        <button class="btn primary" id="btn-confirm" onClick={confirm === 'reset' ? reset : async () => { await closeDay(dayKey(), user.id); toast('Jornada cerrada'); setConfirm(null); }}>{confirm === 'reset' ? 'REINICIAR' : 'CERRAR'}</button></div>
    </Modal>}
  </div>;
}
