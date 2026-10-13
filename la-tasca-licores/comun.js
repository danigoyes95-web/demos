/* Compartido entre la tienda y el panel.
   Con TIENDA.supabase.url y anonKey en config.js, todo va a Supabase (schema la_tasca) por funciones SQL.
   Sin ellos, modo demo: pedidos y eventos se guardan solo en este navegador (localStorage). */
(() => {
  const T = window.TIENDA;
  const LS = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const CANALES = { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', whatsapp: 'WhatsApp directo', referido: 'Referido', google: 'Google', directo: 'Directo' };

  /* ---------- Supabase (REST sin librería: rpc + login) ---------- */
  const S = T.supabase || {};
  const api = {
    activo: !!(S.url && S.anonKey),
    sesion() { return LS.get('tasca_sesion', null); },
    salir() { LS.set('tasca_sesion', null); },
    async login(correo, clave) {
      const r = await fetch(`${S.url}/auth/v1/token?grant_type=password`, {
        method: 'POST', headers: { apikey: S.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: correo, password: clave }) });
      if (!r.ok) throw new Error('Correo o clave incorrectos.');
      guardar(await r.json());
    },
    async rpc(fn, args, opt) {
      const ir = async () => {
        const s = api.sesion();
        return fetch(`${S.url}/rest/v1/rpc/${fn}`, {
          method: 'POST', keepalive: !!(opt && opt.keepalive),
          headers: { apikey: S.anonKey, Authorization: 'Bearer ' + (s && !(opt && opt.anon) ? s.access_token : S.anonKey),
            'Content-Type': 'application/json', 'Content-Profile': S.schema || 'la_tasca', 'Accept-Profile': S.schema || 'la_tasca' },
          body: JSON.stringify(args || {}) });
      };
      let r = await ir();
      if (r.status === 401 && api.sesion() && await refrescar()) r = await ir();
      const txt = await r.text();
      let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
      if (!r.ok) { const e = new Error((j && j.message) || 'Error de conexión'); e.servidor = r.status >= 400 && r.status < 500 && r.status !== 401; throw e; }
      return j;
    }
  };
  function guardar(j) { LS.set('tasca_sesion', { access_token: j.access_token, refresh_token: j.refresh_token, expira: Date.now() + (j.expires_in || 3600) * 1000 }); }
  async function refrescar() {
    const s = api.sesion(); if (!s || !s.refresh_token) return false;
    const r = await fetch(`${S.url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: { apikey: S.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.refresh_token }) }).catch(() => null);
    if (!r || !r.ok) { api.salir(); return false; }
    guardar(await r.json()); return true;
  }

  /* ---------- catálogo ---------- */
  // Cada producto con `variantes` (cigarrillos: suelto / cajetilla) se aplana en un SKU por variante: id "marlboro|suelto".
  // Demo: config.js + precios editados en el panel de este navegador. Supabase: precios y envío de la base; textos de config.js.
  function aplanar(lista, o) {
    const out = [];
    for (const p of lista) {
      if (p.variantes) for (const v of p.variantes) { const sku = p.id + '|' + v.k; out.push(Object.assign({}, p, v, { sku, id: sku, base: p.id, marca: p.nombre, nombre: p.nombre + ' · ' + v.etiqueta, variante: v.k, variantes: undefined }, o[sku] || {})); }
      else out.push(Object.assign({}, p, { sku: p.id, base: p.id }, o[p.id] || {}));
    }
    return out;
  }
  function productos() { return aplanar(T.productos, api.activo ? {} : LS.get('tasca_precios', {})); }
  async function cargarCatalogo() {
    if (!api.activo) return productos();
    try {
      const c = await api.rpc('catalogo', {}, { anon: true });
      if (c.envio) T.envio = { domicilio: +c.envio.domicilio, gratisDesde: +c.envio.gratisDesde };
      const precios = Object.fromEntries(c.productos.map(p => [p.id, { precio: +p.precio }]));
      return aplanar(T.productos, precios);
    } catch (e) { return productos(); }
  }

  /* ---------- canal y embudo ---------- */
  function canal() {
    let c = null;
    try {
      const q = new URLSearchParams(location.search);
      c = (q.get('utm_source') || q.get('ref') || '').toLowerCase() || null;
      if (c) sessionStorage.setItem('tasca_canal', c); else c = sessionStorage.getItem('tasca_canal');
    } catch (e) {}
    return CANALES[c] ? c : 'directo';
  }
  function campana() { try { const q = new URLSearchParams(location.search).get('utm_campaign'); if (q) sessionStorage.setItem('tasca_camp', q); return q || sessionStorage.getItem('tasca_camp'); } catch (e) { return null; } }
  function sesionId() {
    try { let s = sessionStorage.getItem('tasca_ses'); if (!s) { s = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => (b % 36).toString(36)).join(''); sessionStorage.setItem('tasca_ses', s); } return s; }
    catch (e) { return 'sinsesion0000'; }
  }
  function track(ev, extra) {
    if (api.activo) { api.rpc('evento', { p_ev: ev, p_sesion: sesionId(), p_canal: canal(), p_campana: campana() }, { anon: true, keepalive: true }).catch(() => {}); return; }
    const t = LS.get('tasca_eventos', []);
    t.push(Object.assign({ ev, t: Date.now(), canal: canal() }, extra || {}));
    LS.set('tasca_eventos', t.slice(-5000));
  }

  const usd = n => '$' + (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
  const tel = s => { let d = String(s || '').replace(/\D/g, ''); if (d.startsWith('0')) d = '593' + d.slice(1); if (d.length === 9) d = '593' + d; return d; };
  window.SP = { T, LS, CANALES, api, productos, cargarCatalogo, canal, campana, track, usd, tel };
})();
