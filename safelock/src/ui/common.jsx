import { createContext } from 'preact';
import { useState, useEffect, useContext } from 'preact/hooks';
import { Icon } from './icons.jsx';

export const Ctx = createContext({});
export const useApp = () => useContext(Ctx);

// ---- Router por hash:  #/ruta/a/b?x=1
const parse = () => { const [p, q] = (location.hash.slice(1) || '/').split('?'); return { parts: p.split('/').filter(Boolean), q: Object.fromEntries(new URLSearchParams(q || '')) }; };
export const go = (p, replace) => { if (replace) location.replace('#' + p); else location.hash = p; };
export function useRoute() { const [r, s] = useState(parse()); useEffect(() => { const f = () => s(parse()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []); return r; }

// ---- Toast global
let tset = null; export const toast = (m, ms = 2400) => tset && tset({ m, ms });
export function Toasts() { const [t, s] = useState(null); useEffect(() => { tset = s; return () => { tset = null; }; }, []); useEffect(() => { if (t) { const i = setTimeout(() => s(null), t.ms); return () => clearTimeout(i); } }, [t]); return t ? <div class="toast" role="status">{t.m}</div> : null; }

export function Modal({ onClose, wide, children }) { return <div class={'modal' + (wide ? ' wide' : '')} onClick={e => e.target === e.currentTarget && onClose?.()}><div class="card" role="dialog">{children}</div></div>; }
export const Empty = ({ icon = 'box', title, text, children }) => <div class="empty"><Icon n={icon} /><h3>{title}</h3><p>{text}</p>{children}</div>;
export const Skeleton = ({ n = 4 }) => <div class="col">{Array.from({ length: n }, (_, i) => <div key={i} class="skel" style={{ height: 84 }} />)}</div>;

export function TypeBadge({ tipo }) { const { tipos } = useApp(); const t = tipos?.[tipo]; if (!t) return null; return <span class="type" style={{ background: t.color }}><Icon n={t.icon} />{t.label}</span>; }
export function EstadoBadge({ o }) {
  if (o.estado === 'hecha') return <span class="badge b-ok"><Icon n="check" />Hecha</span>;
  if (o.estado === 'no_ejecutada') return <span class="badge b-bad"><Icon n="x" />No ejecutada</span>;
  return <span class="badge b-info"><Icon n="flag" />Pendiente</span>;
}
export function CalidadBadge({ o, full }) {
  const c = o.loc?.calidad;
  if (c === 'verificada') return <span class="badge b-ok"><Icon n="check" />Verificada{full && o.loc.precision ? ` ±${o.loc.precision} m` : ''}</span>;
  if (c === 'aprox') return <span class="badge b-warn"><Icon n="warn" />Aproximada</span>;
  return <span class="badge b-bad"><Icon n="x" />Sin ubicación</span>;
}
// Nombre y referencia de una orden: el archivo de la empresa no trae cliente ni medidor, así que se usa la dirección y la cuenta.
export const nom = o => o.cliente || o.direccion || ('Cuenta ' + o.cuentaContrato);
export const sub = o => o.cliente ? `${o.direccion} · ${o.sector}` : `${o.sector}${o.rural ? ' · Rural' : ''}`;
export const ref = o => o.medidor ? 'Med. ' + o.medidor : 'Cta. ' + (o.cuentaContrato || o.cuen);
export const hhmm = t => new Date(t).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
export const fdate = t => new Date(t).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
export const money = n => '$' + (n || 0).toFixed(2);
export const TYPES_ORDER = ['corte', 'reconexion', 'notificacion', 'retiro', 'revision'];
