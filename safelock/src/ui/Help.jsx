import { useState, useEffect } from 'preact/hooks';
import { Modal } from './common.jsx';
import { Icon, Logo } from './icons.jsx';
let deferred = null; addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; });
export function InstallHelp({ onClose }) {
  const [can, setCan] = useState(!!deferred);
  useEffect(() => { const f = () => setCan(true); addEventListener('beforeinstallprompt', f); return () => removeEventListener('beforeinstallprompt', f); }, []);
  const install = async () => { if (deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; setCan(false); } };
  return <Modal onClose={onClose}>
    <div class="row"><Logo size={44} /><h2>Instala Safelock en tu celular</h2></div>
    <p class="muted">Se instala con un link, sin tienda de apps. Funciona sin señal una vez instalada.</p>
    {can && <button class="btn primary block" onClick={install}><Icon n="download" />Instalar ahora</button>}
    <div class="card" style={{ marginTop: 12 }}><h3>Android (Chrome)</h3><ol><li>Abre el link en <b>Chrome</b>.</li><li>Toca el menú <b>⋮</b> (arriba a la derecha).</li><li>Elige <b>Instalar aplicación</b> o <b>Agregar a pantalla principal</b>.</li><li>Abre Safelock desde el ícono y permite la ubicación.</li></ol></div>
    <div class="card" style={{ marginTop: 12 }}><h3>iPhone (Safari)</h3><ol><li>Abre el link en <b>Safari</b> (no en Chrome).</li><li>Toca el botón <b>Compartir</b> <Icon n="share" size={18} style={{ verticalAlign: 'middle' }} />.</li><li>Baja y elige <b>Agregar a inicio</b>.</li><li>Toca <b>Agregar</b> y abre Safelock desde el ícono.</li></ol></div>
    <button class="btn dark block" style={{ marginTop: 14 }} onClick={onClose}>ENTENDIDO</button>
  </Modal>;
}
