import { useState, useEffect, useMemo } from 'preact/hooks';
import { useApp, go, TypeBadge, EstadoBadge, CalidadBadge, Empty, Skeleton, Modal, toast, TYPES_ORDER } from '../common.jsx';
import { Icon, Logo } from '../icons.jsx';
import { useGps, startGps, gpsAllowed, distM, fmtDist, hasLoc, setSim, isSim } from '../../js/geo.js';
import { planRoute } from '../../js/route.js';
import { useOnline, usePending, forceOffline, isForced, autoSync } from '../../js/sync.js';
import { downloadTiles } from '../../js/tiles.js';
import { savePosition, resetDemo } from '../../js/data.js';
import { useToday } from './hooks.js';
import { applyTheme } from '../App.jsx';

export default function Jornada() {
  const { user, tipos, logout, showHelp } = useApp();
  const [orders, reload] = useToday(user.id);
  const [filter, setFilter] = useState('todos'), [q, setQ] = useState(''), [menu, setMenu] = useState(false), [ask, setAsk] = useState(!gpsAllowed() && !isSim());
  const { pos, status } = useGps(); const online = useOnline(); const pending = usePending(user.id, orders);
  useEffect(() => { if (gpsAllowed()) startGps(); }, []);
  useEffect(() => { if (pos) savePosition(user.id, pos); }, [pos && Math.round(pos.lat * 2000), pos && Math.round(pos.lng * 2000)]);
  useEffect(() => { const i = setInterval(reload, 4000); return () => clearInterval(i); }, [reload]);
  const route = useMemo(() => orders ? planRoute(orders, pos) : [], [orders, pos && Math.round(pos.lat * 500), pos && Math.round(pos.lng * 500)]);
  const rank = useMemo(() => Object.fromEntries(route.map((o, i) => [o.id, i + 1])), [route]);
  const hoy = new Date().toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' });
  const cnt = orders ? { p: orders.filter(o => o.estado === 'pendiente').length, h: orders.filter(o => o.estado === 'hecha').length, n: orders.filter(o => o.estado === 'no_ejecutada').length } : { p: 0, h: 0, n: 0 };
  const total = orders?.length || 0;
  const nx = route[0];
  const list = useMemo(() => {
    if (!orders) return [];
    const t = q.trim().toLowerCase();
    let l = orders.filter(o => (filter === 'todos' || o.tipo === filter) && (!t || [o.cuen, o.medidor, o.cliente, o.direccion, o.sector, o.cuentaContrato].some(v => String(v).toLowerCase().includes(t))));
    return l.sort((a, b) => (a.estado === 'pendiente' ? 0 : 1) - (b.estado === 'pendiente' ? 0 : 1) || (rank[a.id] || 999) - (rank[b.id] || 999));
  }, [orders, filter, q, rank]);
  const dist = o => pos && hasLoc(o) ? fmtDist(distM(pos, o.loc)) : null;
  const enableGps = () => { localStorage.setItem('sl_gps_ok', '1'); setAsk(false); startGps(); };

  return <div class="shell">
    <header class="top">
      <Logo size={34} />
      <div class="grow"><div class="b" style={{ fontSize: 18 }}>Hola, {user.nombre.split(' ')[0]}</div><div class="small ellip" style={{ opacity: .8 }}>{hoy}</div></div>
      <span class={'net ' + (online ? 'on' : 'off')} id="net"><Icon n={online ? 'wifi' : 'wifioff'} size={16} />{online ? 'En línea' : 'Sin señal'}{pending > 0 && ` · ${pending} pend.`}</span>
      <button aria-label="Menú" onClick={() => setMenu(true)} style={{ color: '#fff', padding: 6 }}><Icon n="menu" /></button>
    </header>
    <div class="scroll">
      {ask && <div class="card col" style={{ marginBottom: 12, borderColor: 'var(--amber)' }}>
        <div class="row"><Icon n="pin" /><h3>Activa tu ubicación</h3></div>
        <div class="muted">Safelock la usa para llevarte al medidor, mostrar la distancia y guardar la evidencia con GPS. Solo se usa mientras trabajas.</div>
        <button class="btn primary block" id="gps-allow" onClick={enableGps}>PERMITIR UBICACIÓN</button>
        <button class="btn ghost sm" onClick={() => setAsk(false)}>Ahora no</button>
      </div>}
      {status === 'denied' && <div class="alert bad" style={{ marginBottom: 12 }}><Icon n="warn" />Ubicación bloqueada. Actívala en los ajustes del navegador para ver distancias y navegar.</div>}
      {!orders ? <Skeleton /> : total === 0 ? <Empty icon="box" title="No tienes órdenes" text="Pide a tu supervisor que cargue la jornada."><button class="btn dark" onClick={reload}>Actualizar</button></Empty> : <>
        <div class="row" style={{ marginBottom: 10 }}>
          <div class="stat"><b class="num" style={{ color: 'var(--info)' }}>{cnt.p}</b><span class="small b">Pendientes</span></div>
          <div class="stat"><b class="num" style={{ color: 'var(--ok)' }}>{cnt.h}</b><span class="small b">Hechas</span></div>
          <div class="stat"><b class="num" style={{ color: 'var(--bad)' }}>{cnt.n}</b><span class="small b">No ejecutadas</span></div>
        </div>
        <div class="prog" style={{ marginBottom: 6 }} role="progressbar" aria-valuenow={cnt.h + cnt.n} aria-valuemax={total}>
          <i style={{ width: `${cnt.h / total * 100}%`, background: 'var(--ok)' }} /><i style={{ width: `${cnt.n / total * 100}%`, background: 'var(--bad)' }} />
        </div>
        <div class="small muted" style={{ marginBottom: 12 }}>{cnt.h + cnt.n} de {total} órdenes atendidas hoy</div>
        <div style={{ margin: '18px 0 20px' }}>
          {nx ? <button class="btn primary next" id="btn-next" onClick={() => go('/mapa/' + nx.id)}>
              <Icon n="nav" size={30} />
              <span class="grow" style={{ textAlign: 'left' }}><span class="next-t">IR A LA SIGUIENTE</span>
                <span class="next-s ellip">{dist(nx) ? `${dist(nx)} · ` : ''}{nx.cliente}</span></span>
              <Icon n="chev" size={26} />
            </button>
            : <button class="btn ok xl" onClick={() => go('/cierre')}><Icon n="check" size={30} />TERMINAR JORNADA</button>}
        </div>
        <div class="row" style={{ marginBottom: 8 }}>
          <div class="grow sbox"><input id="search" type="search" placeholder="CUEN, medidor, cliente…" value={q} onInput={e => setQ(e.target.value)} /><Icon n="search" /></div>
          <div class="seg" style={{ width: 150 }}><button class="on" aria-pressed="true">Lista</button><button id="to-map" onClick={() => go('/mapa')}>Mapa</button></div>
        </div>
        <div class="chips" role="tablist">
          {['todos', ...TYPES_ORDER].map(t => <button key={t} class={'chip' + (filter === t ? ' on' : '')} onClick={() => setFilter(t)}>{t === 'todos' ? 'Todos' : tipos[t].plural}</button>)}
        </div>
        {list.length === 0 && <Empty icon="search" title="Sin resultados" text="Prueba con otro filtro o búsqueda." />}
        {list.map(o => <button key={o.id} class={'ocard' + (o.estado !== 'pendiente' ? ' done' : '')} style={{ '--c': tipos[o.tipo].color }} onClick={() => go('/mapa/' + o.id)}>
          {rank[o.id] ? <div class="n num">{rank[o.id]}</div> : <div class="n" style={{ background: o.estado === 'hecha' ? 'var(--ok)' : 'var(--bad)' }}><Icon n={o.estado === 'hecha' ? 'check' : 'x'} size={18} /></div>}
          <div class="grow col" style={{ gap: 4 }}>
            <div class="row wrap" style={{ gap: 6 }}><TypeBadge tipo={o.tipo} /><EstadoBadge o={o} /></div>
            <div class="b ellip" style={{ fontSize: 17 }}>{o.cliente}</div>
            <div class="small muted ellip">{o.direccion} · {o.sector}</div>
            <div class="row wrap small" style={{ gap: 8 }}><span class="num b">Med. {o.medidor}</span><CalidadBadge o={o} /></div>
          </div>
          <div style={{ textAlign: 'right', alignSelf: 'center' }}><div class="b num" style={{ fontSize: 18 }}>{dist(o) || '—'}</div><Icon n="chev" /></div>
        </button>)}
      </>}
    </div>
    {total > 0 && <div class="fab" style={{ pointerEvents: 'none' }}><button class="btn dark block" style={{ pointerEvents: 'auto' }} id="btn-cierre" onClick={() => go('/cierre')}><Icon n="send" />Cierre de jornada{pending > 0 ? ` · ${pending} por enviar` : ''}</button></div>}
    {menu && <Menu onClose={() => setMenu(false)} orders={orders} pos={pos} online={online} logout={logout} showHelp={() => { setMenu(false); showHelp(); }} reload={reload} />}
  </div>;
}

function Menu({ onClose, orders, pos, online, logout, showHelp, reload }) {
  const [sim, setS] = useState(isSim()), [off, setOff] = useState(isForced()), [prog, setProg] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('sl_theme') || 'auto');
  const dl = async () => {
    const pts = [...(orders || []).filter(hasLoc).map(o => o.loc), ...(pos ? [pos] : [])]; if (!pts.length) return toast('No hay puntos para descargar');
    setProg([0, 1]); const r = await downloadTiles(pts, (d, t) => setProg([d, t])); setProg(null); toast(`Mapa guardado: ${r.ok} de ${r.total} mosaicos`);
  };
  const T = (v) => { localStorage.setItem('sl_theme', v); setTheme(v); applyTheme(); };
  return <Modal onClose={onClose}>
    <div class="row"><h2 class="grow">Menú</h2><button class="btn ghost sm" onClick={onClose} aria-label="Cerrar"><Icon n="x" /></button></div>
    <div class="col" style={{ marginTop: 12 }}>
      <div><div class="b small muted">TEMA</div><div class="seg">{[['light', 'Claro (sol)'], ['dark', 'Oscuro'], ['auto', 'Auto']].map(([v, l]) => <button key={v} class={theme === v ? 'on' : ''} onClick={() => T(v)}>{l}</button>)}</div></div>
      <button class="btn block" disabled={!online || !!prog} onClick={dl}><Icon n="map" />{prog ? `Descargando… ${prog[0]}/${prog[1]}` : 'Descargar mapa de hoy'}</button>
      <button class="btn block" onClick={showHelp}><Icon n="download" />Instalar en tu celular</button>
      <div class="card col"><div class="b">Herramientas de demostración</div>
        <label class="row"><input type="checkbox" style={{ width: 28, minHeight: 28 }} checked={sim} onChange={e => { setSim(e.target.checked); setS(e.target.checked); }} />GPS simulado (para probar en PC)</label>
        <label class="row"><input type="checkbox" id="chk-offline" style={{ width: 28, minHeight: 28 }} checked={off} onChange={e => { forceOffline(e.target.checked); setOff(e.target.checked); }} />Simular modo avión (sin señal)</label>
      </div>
      <button class="btn ghost block" onClick={logout}><Icon n="lock" />Cerrar sesión</button>
    </div>
  </Modal>;
}
