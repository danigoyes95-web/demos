import { useState } from 'preact/hooks';
import { login } from '../js/data.js';
import { Logo } from './icons.jsx';
import { go } from './common.jsx';
export default function Login({ onLogin }) {
  const [u, setU] = useState(''), [pin, setPin] = useState(''), [err, setErr] = useState('');
  const submit = async (uu = u, pp = pin) => { const o = await login(uu, pp); if (!o) return setErr('Usuario o PIN incorrecto'); onLogin(o); go(o.rol === 'supervisor' ? '/sup' : '/'); };
  return <div class="login"><form class="card col" onSubmit={e => { e.preventDefault(); submit(); }}>
    <div class="row"><Logo size={56} /><div><h1>Safelock</h1><div class="muted">Órdenes de campo · versión demo</div></div></div>
    <div><label class="f" for="u">Usuario o código</label><input id="u" autocomplete="username" value={u} onInput={e => setU(e.target.value)} placeholder="OP-01" /></div>
    <div><label class="f" for="p">PIN</label><input id="p" class="num" type="password" inputmode="numeric" autocomplete="current-password" value={pin} onInput={e => setPin(e.target.value)} placeholder="••••" /></div>
    {err && <div class="alert bad" role="alert">{err}</div>}
    <button class="btn primary block" type="submit">ENTRAR</button>
    <div class="muted small center">Acceso rápido de demostración</div>
    <div class="col">
      <button type="button" class="btn dark block" id="demo-op" onClick={() => submit('OP-01', '1234')}>Entrar como OPERARIO (Carlos)</button>
      <button type="button" class="btn ghost block" id="demo-sup" onClick={() => submit('SUP-01', '0000')}>Entrar como SUPERVISOR</button>
    </div>
    <p class="muted small center" style={{ margin: 0 }}>Datos 100 % ficticios. Nada se envía a ningún servidor.</p>
  </form></div>;
}
