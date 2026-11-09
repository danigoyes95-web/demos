/* 2.4 Catálogo y armador: elementos, reglas "también llevaron", ocasiones */
import { getItems, saveItem, deleteItem, getCategories, getAllOccasions, saveOccasions, getSuggestions, saveSuggestions } from '../data.js';
import { $, $$, esc, money, toast } from '../util.js';
import { openModal, confirmBox, bind, thumb, move } from './ui.js';
import { pickPhotos } from './photopicker.js';

const LINES = [['decoracion', 'Decoración'], ['alquileres', 'Alquileres'], ['cakes', 'Cakes y bocaditos'], ['regalos', 'Regalos y obsequios'], ['temporada', 'Tienda de temporada']];
const SCENES = { arch: 'Arco de globos', columns: 'Columnas de globos', helium: 'Globos con helio', number: 'Número gigante', backdrop: 'Backdrop', neon: 'Letras luminosas', pinata: 'Piñata', sweets: 'Mesa de dulces', cupcakes: 'Cupcakes / galletas', cake: 'Torta', cake2: 'Torta de 2 pisos', snacks: 'Bocaditos', cart: 'Carrito', tables: 'Mesas y sillas', cylinders: 'Cilindros y bases', tent: 'Carpa', favors: 'Recuerdos', bouquet: 'Ramo', padrinoBox: 'Caja de padrinos', confetti: 'Confeti / cotillón' };
let tab = 'items', catFilter = '', q = '';

export async function render(view) {
  suggWork = null;
  const draw = async () => {
    view.innerHTML = `<div class="tabs-a"><button data-t="items" class="${tab === 'items' ? 'on' : ''}">Elementos</button><button data-t="sugg" class="${tab === 'sugg' ? 'on' : ''}">Sugerencias</button><button data-t="occ" class="${tab === 'occ' ? 'on' : ''}">Ocasiones</button></div><div id="tab"></div>`;
    $$('[data-t]', view).forEach((b) => (b.onclick = () => { tab = b.dataset.t; draw(); }));
    const box = $('#tab', view);
    if (tab === 'items') await itemsTab(box); else if (tab === 'sugg') await suggTab(box); else await occTab(box);
  };
  await draw();
}

/* ---------- ELEMENTOS ---------- */
async function itemsTab(box) {
  const [items, cats, occasions] = await Promise.all([getItems(), getCategories(), getAllOccasions()]);
  const list = items.filter((i) => (!catFilter || i.cat === catFilter) && (!q || i.name.toLowerCase().includes(q.toLowerCase())));
  box.innerHTML = `<div class="bar wrapbar"><input class="search" id="is" type="search" placeholder="Buscar elemento…" value="${esc(q)}"><select id="cf" class="sel"><option value="">Todas las categorías</option>${cats.map((c) => `<option value="${c.id}" ${c.id === catFilter ? 'selected' : ''}>${c.name}</option>`).join('')}</select><button class="btn primary" id="new">+ Nuevo elemento</button></div>
    <div class="card"><div class="tbl">${list.map((i) => `<div class="trow ${i.active ? '' : 'off'}" data-i="${i.id}">${thumb(i.photo, '🎈')}<span class="t-main"><b>${esc(i.name)}</b><small>${cats.find((c) => c.id === i.cat)?.name || i.cat}${i.rental ? ` · alquiler (stock ${i.stock})` : ''}${i.gift ? ' · regalo' : ''}</small></span><span class="t-price">${money(i.pmin)} – ${money(i.pmax)}</span><span class="badge" style="--bc:${i.active ? '#2A9488' : '#9A8CA3'}">${i.active ? 'Activo' : 'Inactivo'}</span></div>`).join('') || '<p class="muted center pad">Sin resultados</p>'}</div></div>
    <p class="muted sm">${items.length} elementos · el rango «desde–hasta» es lo que ve el cliente en el armador.</p>`;
  $('#is', box).addEventListener('input', (e) => { q = e.target.value; const p = e.target.selectionStart; itemsTab(box).then(() => { const x = $('#is', box); x.focus(); x.setSelectionRange(p, p); }); });
  $('#cf', box).onchange = (e) => { catFilter = e.target.value; itemsTab(box); };
  $('#new', box).onclick = () => editItem(null, cats, occasions, () => itemsTab(box));
  $$('.trow', box).forEach((r) => (r.onclick = () => editItem(items.find((i) => i.id === r.dataset.i), cats, occasions, () => itemsTab(box))));
}

function editItem(orig, cats, occasions, done) {
  const it = orig ? structuredClone(orig) : { name: '', desc: '', cat: 'globos', line: 'decoracion', photo: '', pmin: 0, pmax: 0, occasions: occasions.map((o) => o.id), scene: 'arch', active: true, rental: false, stock: 1, unitGuests: 0, gift: false };
  const m = openModal(`<h3>${orig ? 'Editar elemento' : 'Nuevo elemento'}</h3><div id="ph" class="phrow"></div>
    <div class="form2">
      <label class="f full">Nombre<input data-path="name"></label>
      <label class="f full">Descripción corta<input data-path="desc"></label>
      <label class="f">Categoría (estante)<select data-path="cat">${cats.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}</select></label>
      <label class="f">Línea de negocio<select data-path="line">${LINES.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
      <label class="f">Precio desde ($)<input type="number" min="0" step="0.5" data-path="pmin"></label>
      <label class="f">Precio hasta ($)<input type="number" min="0" step="0.5" data-path="pmax"></label>
      <label class="f">Dibujo en la escena<select data-path="scene">${Object.entries(SCENES).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
      <label class="f">Precio por cada N invitados <small class="muted">(0 = precio fijo)</small><input type="number" min="0" step="5" data-path="unitGuests"></label>
      <label class="chk"><input type="checkbox" data-path="active"> Activo (visible en el armador)</label>
      <label class="chk"><input type="checkbox" data-path="gift"> Aparece en «Regalos y sorpresas»</label>
      <label class="chk"><input type="checkbox" data-path="rental" id="rent"> Es un alquiler (controla stock por fecha)</label>
      <label class="f" id="stk"><span>Stock disponible</span><input type="number" min="0" data-path="stock"></label>
    </div>
    <h4 style="margin:14px 0 6px">Ocasiones donde aparece</h4><div class="chk-grid" id="occs">${occasions.map((o) => `<label class="chk"><input type="checkbox" value="${o.id}" ${it.occasions.includes(o.id) ? 'checked' : ''}> ${o.icon} ${esc(o.name)}</label>`).join('')}</div>
    <div class="row end" style="margin-top:18px">${orig ? '<button class="btn link-d" id="del" style="margin-right:auto">Eliminar</button>' : ''}<button class="btn ghost" id="cancel">Cancelar</button><button class="btn primary" id="save">Guardar</button></div>`, { wide: true });
  const stk = () => ($('#stk', m.el).hidden = !it.rental);
  bind(m.el, it, (p) => { if (p === 'rental') stk(); });
  stk();
  const ph = () => { $('#ph', m.el).innerHTML = `${thumb(it.photo, '🎈')}<div><button class="btn ghost sm" id="pick">📷 ${it.photo ? 'Cambiar foto' : 'Elegir foto'}</button>${it.photo ? ' <button class="btn link-d sm" id="nop">Quitar</button>' : ''}<p class="muted sm" style="margin:6px 0 0">Si no hay foto se muestra una ilustración.</p></div>`;
    $('#pick', m.el).onclick = async () => { const [p] = await pickPhotos(); if (p) { it.photo = p; ph(); } };
    $('#nop', m.el)?.addEventListener('click', () => { it.photo = ''; ph(); }); };
  ph();
  $('#occs', m.el).addEventListener('change', () => { it.occasions = $$('#occs input:checked', m.el).map((x) => x.value); });
  $('#cancel', m.el).onclick = m.close;
  $('#save', m.el).onclick = async () => {
    if (!it.name.trim()) return toast('Ponle un nombre', 'warn');
    if (it.pmax < it.pmin) return toast('«Hasta» no puede ser menor que «desde»', 'warn');
    try { await saveItem(it); } catch (e) { return toast(e.message, 'err'); }
    m.close(); toast('Elemento guardado ✔'); done();
  };
  $('#del', m.el)?.addEventListener('click', async () => { if (await confirmBox(`¿Eliminar «${esc(it.name)}»?`, 'Eliminar', true)) { await deleteItem(it.id); m.close(); toast('Eliminado'); done(); } });
}

/* ---------- SUGERENCIAS "también llevaron" ---------- */
let suggOcc = null, suggWork = null;
async function suggTab(box) {
  const [items, occasions] = await Promise.all([getItems(), getAllOccasions()]);
  const map = (suggWork ||= await getSuggestions()); // copia de trabajo hasta pulsar Guardar
  suggOcc ||= occasions[0]?.id;
  const ids = map[suggOcc] ||= [];
  const avail = items.filter((i) => i.active && !ids.includes(i.id));
  box.innerHTML = `<div class="card pad"><p class="muted" style="margin-top:0">Cuando el cliente elige una ocasión, el armador muestra «Las fiestas como la tuya también llevaron…» con estos elementos, en este orden.</p>
    <div class="form2"><label class="f">Ocasión<select id="so">${occasions.map((o) => `<option value="${o.id}" ${o.id === suggOcc ? 'selected' : ''}>${o.icon} ${esc(o.name)}</option>`).join('')}</select></label>
    <label class="f">Agregar elemento<select id="sa"><option value="">Elegir…</option>${avail.map((i) => `<option value="${i.id}">${esc(i.name)}</option>`).join('')}</select></label></div>
    <ol class="olist">${ids.map((id, n) => { const i = items.find((x) => x.id === id); return i ? `<li>${thumb(i.photo, '🎈')}<span class="t-main"><b>${esc(i.name)}</b><small>desde ${money(i.pmin)}</small></span><button class="ib" data-u="${n}">▲</button><button class="ib" data-d="${n}">▼</button><button class="ib x" data-x="${n}">✕</button></li>` : ''; }).join('') || '<p class="muted">Sin sugerencias para esta ocasión.</p>'}</ol>
    <button class="btn primary" id="ss">Guardar sugerencias</button></div>`;
  $('#so', box).onchange = (e) => { suggOcc = e.target.value; suggTab(box); };
  $('#sa', box).onchange = (e) => { if (e.target.value) { ids.push(e.target.value); redo(); } };
  const redo = () => suggTab(box);
  $$('[data-u]', box).forEach((b) => (b.onclick = () => { move(ids, +b.dataset.u, -1); redo(); }));
  $$('[data-d]', box).forEach((b) => (b.onclick = () => { move(ids, +b.dataset.d, 1); redo(); }));
  $$('[data-x]', box).forEach((b) => (b.onclick = () => { ids.splice(+b.dataset.x, 1); redo(); }));
  $('#ss', box).onclick = async () => { await saveSuggestions(map); toast('Sugerencias guardadas ✔'); };
}

/* ---------- OCASIONES ---------- */
async function occTab(box) {
  const occ = await getAllOccasions();
  box.innerHTML = `<div class="card pad"><p class="muted" style="margin-top:0">Ordena, edita y elige la paleta por defecto de cada ocasión (la landing la usa al elegirla).</p>
    <div class="occlist">${occ.map((o, n) => `<div class="orow ${o.active === false ? 'off' : ''}" data-n="${n}"><input class="e" data-k="icon" value="${esc(o.icon)}" maxlength="4" aria-label="Ícono"><div class="ofields"><input data-k="name" value="${esc(o.name)}" aria-label="Nombre"><input data-k="blurb" value="${esc(o.blurb || '')}" placeholder="Frase corta" aria-label="Frase"></div>
      <div class="pal3">${o.palette.map((c, k) => `<input type="color" data-pal="${k}" value="${c}" aria-label="Color ${k + 1}">`).join('')}</div>
      <select data-k="scene" aria-label="Ambiente"><option value="pastel" ${o.scene === 'pastel' ? 'selected' : ''}>Pastel</option><option value="claro" ${o.scene === 'claro' ? 'selected' : ''}>Claro</option><option value="noche" ${o.scene === 'noche' ? 'selected' : ''}>Noche</option></select>
      <label class="chk"><input type="checkbox" data-k="active" ${o.active !== false ? 'checked' : ''}> Activa</label>
      <div class="oact"><button class="ib" data-u="${n}">▲</button><button class="ib" data-d="${n}">▼</button><button class="ib x" data-x="${n}">✕</button></div></div>`).join('')}</div>
    <div class="row" style="margin-top:14px"><button class="btn ghost" id="addo">+ Nueva ocasión</button><button class="btn primary" id="so2">Guardar ocasiones</button></div></div>`;
  $$('.orow', box).forEach((r) => {
    const o = occ[+r.dataset.n];
    $$('[data-k]', r).forEach((i) => i.addEventListener('input', () => { o[i.dataset.k] = i.type === 'checkbox' ? i.checked : i.value; }));
    $$('[data-pal]', r).forEach((i) => i.addEventListener('input', () => { o.palette[+i.dataset.pal] = i.value.toUpperCase(); }));
  });
  $$('[data-u]', box).forEach((b) => (b.onclick = async () => { move(occ, +b.dataset.u, -1); await saveOccasions(occ); occTab(box); }));
  $$('[data-d]', box).forEach((b) => (b.onclick = async () => { move(occ, +b.dataset.d, 1); await saveOccasions(occ); occTab(box); }));
  $$('[data-x]', box).forEach((b) => (b.onclick = async () => { const o = occ[+b.dataset.x]; if (await confirmBox(`¿Eliminar la ocasión «${esc(o.name)}»?`, 'Eliminar', true)) { occ.splice(+b.dataset.x, 1); await saveOccasions(occ); occTab(box); } }));
  $('#addo', box).onclick = async () => { occ.push({ id: 'oc-' + Date.now().toString(36), name: 'Nueva ocasión', icon: '🎉', palette: ['#F06FA6', '#7FD1C7', '#B59BE0'], blurb: '', scene: 'pastel', active: true }); await saveOccasions(occ); occTab(box); };
  $('#so2', box).onclick = async () => { await saveOccasions(occ); toast('Ocasiones guardadas ✔'); };
}
