/* 2.5 Contenido de la landing */
import { getContent, saveContent, getAllOccasions } from '../data.js';
import { $, $$, esc, toast } from '../util.js';
import { bind, thumb, move } from './ui.js';
import { pickPhotos } from './photopicker.js';

const SECTIONS = [['hero', 'Portada (hero)'], ['lines', 'Todo lo que puede tener tu fiesta'], ['builder', 'Arma tu fiesta'], ['gallery', 'Fiestas reales (galería)'], ['gifts', 'Regalos y sorpresas'], ['season', 'Temporada actual'], ['how', 'Cómo funciona'], ['testimonials', 'Testimonios'], ['location', 'Ubicación y contacto']];

export async function render(view) {
  const [c, occasions] = await Promise.all([getContent(), getAllOccasions()]);
  const oSel = (path) => `<select data-path="${path}">${occasions.map((o) => `<option value="${o.id}">${o.icon} ${esc(o.name)}</option>`).join('')}</select>`;

  const paint = () => {
    const y = scrollY;
    view.innerHTML = `<div class="savebar"><span class="muted sm">Los cambios se ven en la landing al recargarla.</span><a class="btn ghost sm" href="../" target="_blank" rel="noopener">Ver landing ↗</a><button class="btn primary" id="save">💾 Guardar cambios</button></div>

    <details class="card pad acc" open><summary>👁️ Secciones visibles</summary><p class="muted sm">Apaga las secciones que no quieras mostrar por ahora.</p><div class="chk-grid">${SECTIONS.map(([k, l]) => `<label class="chk"><input type="checkbox" data-path="sections.${k}"> ${l}</label>`).join('')}</div></details>

    <details class="card pad acc" open><summary>🎈 Portada (hero)</summary><div class="form2">
      <label class="f full">Etiqueta superior<input data-path="hero.eyebrow"></label>
      <label class="f full">Titular<input data-path="hero.title"></label>
      <label class="f full">Subtítulo<textarea rows="2" data-path="hero.subtitle"></textarea></label>
      <label class="f">Botón principal<input data-path="hero.cta1"></label><label class="f">Botón WhatsApp<input data-path="hero.cta2"></label>
      <label class="f full">Pista sobre los globos<input data-path="hero.hint"></label></div></details>

    <details class="card pad acc"><summary>🪜 Cómo funciona</summary>${c.how.map((h, i) => `<div class="subrow"><b class="n">${i + 1}</b><div class="form2"><label class="f full">Título<input data-path="how.${i}.title"></label><label class="f full">Texto<textarea rows="2" data-path="how.${i}.text"></textarea></label></div></div>`).join('')}</details>

    <details class="card pad acc"><summary>💬 Testimonios</summary><p class="muted sm">Los marcados como «ejemplo» muestran una etiqueta en la landing. Reemplázalos por reseñas reales y desmarca la casilla.</p>
      ${c.testimonials.map((t, i) => `<div class="subrow"><div class="form2"><label class="f">Nombre<input data-path="testimonials.${i}.name"></label><label class="f">Ocasión<input data-path="testimonials.${i}.occasion"></label><label class="f full">Reseña<textarea rows="2" data-path="testimonials.${i}.text"></textarea></label><label class="chk"><input type="checkbox" data-path="testimonials.${i}.demo"> Es un ejemplo (mostrar etiqueta)</label></div><button class="ib x" data-rt="${i}">✕</button></div>`).join('')}<button class="btn ghost sm" id="addt">+ Agregar testimonio</button></details>

    <details class="card pad acc"><summary>📷 Galería «Fiestas reales»</summary><p class="muted sm">Elige fotos de <code>/assets/fotos</code>, ordénalas y etiquétalas por ocasión. La subida de fotos nuevas es simulada (se comprimen a ~300 KB).</p>
      <div class="glist">${c.gallery.map((g, i) => `<div class="grow">${thumb(g.photo)}<div class="gf"><input data-path="gallery.${i}.caption" placeholder="Descripción"><div class="row">${oSel(`gallery.${i}.occasion`)}<label class="chk"><input type="checkbox" data-path="gallery.${i}.visible"> Visible</label></div></div><div class="oact"><button class="ib" data-gu="${i}">▲</button><button class="ib" data-gd="${i}">▼</button><button class="ib x" data-gx="${i}">✕</button></div></div>`).join('')}</div>
      <button class="btn ghost sm" id="addg">+ Agregar fotos</button></details>

    <details class="card pad acc"><summary>🎁 Regalos y cierre</summary><div class="form2"><label class="f full">Título de regalos<input data-path="giftsIntro.title"></label><label class="f full">Subtítulo<textarea rows="2" data-path="giftsIntro.subtitle"></textarea></label>
      <label class="f full">Título final<input data-path="finalCta.title"></label><label class="f full">Texto final<input data-path="finalCta.text"></label><label class="f">Botón final<input data-path="finalCta.cta"></label>
      <label class="f full">Título de ubicación<input data-path="location.title"></label><label class="f full">Subtítulo de ubicación<input data-path="location.subtitle"></label><label class="f full">Búsqueda del mapa <small class="muted">(se muestra en Google Maps)</small><input data-path="location.mapQuery"></label></div><p class="muted sm">Los precios de regalos se editan en <b>Catálogo</b> (marca «Aparece en Regalos»).</p></details>

    <details class="card pad acc" open><summary>🎃 Banner de temporada</summary><div class="form2">
      <label class="chk full"><input type="checkbox" data-path="season.active"> Banner activo (se apaga solo al terminar la fecha de fin)</label>
      <label class="f full">Título<input data-path="season.title"></label><label class="f full">Subtítulo<input data-path="season.subtitle"></label>
      <label class="f">Inicia<input type="date" data-path="season.start"></label><label class="f">Termina<input type="date" data-path="season.end"></label>
      <label class="f full">Texto del botón<input data-path="season.cta"></label></div>
      <h4 style="margin:14px 0 8px">Productos destacados</h4>
      ${c.season.products.map((p, i) => `<div class="subrow sp"><button class="thbtn" data-sp="${i}" title="Cambiar foto">${thumb(p.photo, '🎃')}</button><label class="f grow1">Nombre<input data-path="season.products.${i}.name"></label><label class="f price">Precio $<input type="number" min="0" step="0.25" data-path="season.products.${i}.price"></label><button class="ib x" data-rp="${i}">✕</button></div>`).join('')}
      <button class="btn ghost sm" id="addp">+ Agregar producto</button></details>`;
    bind(view, c);
    const re = () => { paint(); scrollTo(0, y); };
    $$('[data-rt]', view).forEach((b) => (b.onclick = () => { c.testimonials.splice(+b.dataset.rt, 1); re(); }));
    $('#addt', view).onclick = () => { c.testimonials.push({ name: 'Nombre del cliente', occasion: '', text: '', demo: true }); re(); };
    $$('[data-gu]', view).forEach((b) => (b.onclick = () => { move(c.gallery, +b.dataset.gu, -1); re(); }));
    $$('[data-gd]', view).forEach((b) => (b.onclick = () => { move(c.gallery, +b.dataset.gd, 1); re(); }));
    $$('[data-gx]', view).forEach((b) => (b.onclick = () => { c.gallery.splice(+b.dataset.gx, 1); re(); }));
    $('#addg', view).onclick = async () => { const ps = await pickPhotos({ multi: true, title: 'Agregar fotos a la galería' }); ps.forEach((p) => c.gallery.push({ photo: p, occasion: occasions[0]?.id, caption: '', visible: true })); if (ps.length) re(); };
    $$('[data-sp]', view).forEach((b) => (b.onclick = async () => { const [p] = await pickPhotos(); if (p) { c.season.products[+b.dataset.sp].photo = p; re(); } }));
    $$('[data-rp]', view).forEach((b) => (b.onclick = () => { c.season.products.splice(+b.dataset.rp, 1); re(); }));
    $('#addp', view).onclick = () => { c.season.products.push({ name: 'Nuevo producto', price: 0, photo: '' }); re(); };
    $('#save', view).onclick = async () => { try { await saveContent(c); toast('Contenido guardado ✔ Recarga la landing para verlo'); } catch (e) { toast(e.message, 'err'); } };
  };
  paint();
}
