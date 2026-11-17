import { useState, useEffect } from 'preact/hooks';
import { ensureSeed, currentUser, getTipos, getMotivos, getConfig, logout } from '../js/data.js';
import { Ctx, useRoute, go, Toasts, toast } from './common.jsx';
import { swState } from '../js/sw-state.js';
import { autoSync, onSynced } from '../js/sync.js';
import Login from './Login.jsx';
import { InstallHelp } from './Help.jsx';
import Operario from './operario/Operario.jsx';
import Supervisor from './supervisor/Supervisor.jsx';
import { Icon } from './icons.jsx';

export const applyTheme = () => {
  const p = localStorage.getItem('sl_theme') || 'auto', h = new Date().getHours();
  const t = p === 'auto' ? (h >= 19 || h < 6 ? 'dark' : 'light') : p;
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'dark' ? '#0A1320' : '#0E1B2C');
};
applyTheme();

export default function App() {
  const [ready, setReady] = useState(false), [user, setUser] = useState(null), [env, setEnv] = useState({});
  const [help, setHelp] = useState(false), [upd, setUpd] = useState(swState.needRefresh);
  const route = useRoute();
  const loadEnv = async () => setEnv({ tipos: await getTipos(), motivos: await getMotivos(), cfg: await getConfig() });
  useEffect(() => { (async () => { await ensureSeed(); await loadEnv(); setUser(await currentUser()); setReady(true); document.getElementById('boot')?.remove(); if (!localStorage.getItem('sl_help_seen')) setHelp(true); })(); }, []);
  useEffect(() => { const f = () => setUpd(true); swState.listeners.add(f); return () => swState.listeners.delete(f); }, []);
  useEffect(() => onSynced(n => toast(`✓ ${n} registro${n > 1 ? 's' : ''} sincronizado${n > 1 ? 's' : ''}`)), []);
  useEffect(() => { if (user?.rol === 'operario') autoSync(user.id); }, [user]);
  if (!ready) return null;
  const doLogout = () => { logout(); setUser(null); go('/'); };
  const closeHelp = () => { localStorage.setItem('sl_help_seen', '1'); setHelp(false); };
  const ctx = { user, tipos: env.tipos, motivos: env.motivos, cfg: env.cfg, reload: loadEnv, logout: doLogout, showHelp: () => setHelp(true) };
  const isSup = user?.rol === 'supervisor';
  return <Ctx.Provider value={ctx}>
    {!user ? <Login onLogin={u => { setUser(u); }} /> : isSup ? <Supervisor route={route} /> : <Operario route={route} />}
    {help && user && <InstallHelp onClose={closeHelp} />}
    {upd && <div class="toast" style={{ top: 'auto', bottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}><Icon n="refresh" />Nueva versión disponible<button class="btn primary sm" onClick={() => swState.update?.(true)}>ACTUALIZAR</button></div>}
    <Toasts />
  </Ctx.Provider>;
}
