/* Selector de fotos del panel: biblioteca de /assets/fotos + subida SIMULADA (comprimida a ≤300 KB en localStorage). */
import { getPhotoLibrary, saveUpload, getStorageUsage } from '../data.js';
import { esc, compressImage, toast } from '../util.js';
import { openModal } from './ui.js';

export async function pickPhotos({ multi = false, title = 'Elige una foto' } = {}) {
  return new Promise(async (resolve) => {
    const chosen = new Set(), val = new Map(); let done = false;
    const m = openModal(`<h3>${title}</h3><p class="muted sm" style="margin-top:0">Fotos de <code>/assets/fotos</code>. Subir una nueva es <b>simulado</b> en el demo: se comprime a ~300 KB y queda en este navegador.</p>
      <div class="usage" id="usage"></div><div class="pgrid" id="pg"></div>
      <div class="row end" style="margin-top:14px"><label class="btn ghost">📤 Subir foto (simulado)<input type="file" accept="image/*" id="up" hidden></label><button class="btn primary" id="ok" disabled>${multi ? 'Agregar elegidas' : 'Usar esta foto'}</button></div>`,
      { wide: true, onClose: () => { if (!done) resolve([]); } });
    const grid = m.$('#pg'), ok = m.$('#ok');
    const usage = () => { const u = getStorageUsage(), pc = Math.round(u.pct * 100); m.$('#usage').innerHTML = `Almacenamiento del navegador: <b>${pc}%</b> usado<div class="meterbar"><i class="${pc > 80 ? 'warn' : ''}" style="width:${Math.min(100, pc)}%"></i></div>${pc > 80 ? '<span class="bad sm">⚠️ Te acercas al límite. Elimina fotos subidas o reinicia el demo.</span>' : ''}`; };
    const paint = async () => {
      const lib = await getPhotoLibrary();
      lib.forEach((p) => val.set(p.path, p.path.startsWith('upload:') ? p.preview : p.path)); // las subidas se guardan como referencia en data.js
      grid.innerHTML = lib.map((p) => `<button class="pcell ${chosen.has(p.path) ? 'on' : ''}" data-p="${esc(p.path)}" title="${esc(p.name)}"><span style="background-image:url('${esc(p.preview)}')"></span><small>${esc(p.folder)}${p.kb ? ' · ' + p.kb + ' KB' : ''}</small></button>`).join('');
      grid.querySelectorAll('.pcell').forEach((b) => (b.onclick = () => {
        const p = b.dataset.p; if (!multi) chosen.clear();
        chosen.has(p) ? chosen.delete(p) : chosen.add(p); ok.disabled = !chosen.size; paint();
      }));
    };
    m.$('#up').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const { dataUrl, kb } = await compressImage(f, 300);
        const ref = await saveUpload({ dataUrl, name: f.name }); if (!multi) chosen.clear(); chosen.add(ref); ok.disabled = false;
        toast(`Foto comprimida a ${kb} KB ✔`); usage(); await paint();
        if (getStorageUsage().pct > 0.8) toast('Te acercas al límite de almacenamiento del navegador', 'warn');
      } catch (err) { toast(err.message || 'No se pudo subir la foto', 'err'); }
    };
    ok.onclick = () => { done = true; resolve([...chosen].map((p) => val.get(p) || p)); m.close(); };
    usage(); await paint();
  });
}
