/* 2.6 Configuración */
import { getSettings, saveSettings, getStorageUsage } from '../data.js';
import { $, toast } from '../util.js';
import { bind, doReset } from './ui.js';

export async function render(view) {
  const s = await getSettings();
  const u = getStorageUsage(), pc = Math.round(u.pct * 100);
  view.innerHTML = `<div class="savebar"><span class="muted sm">Estos datos alimentan la landing, las cotizaciones y el WhatsApp.</span><button class="btn primary" id="save">💾 Guardar</button></div>
  <div class="card pad"><h3>Contacto</h3><div class="form2">
    <label class="f">WhatsApp (con código de país, solo números)<input data-path="whatsapp" inputmode="numeric" placeholder="593987522450"></label>
    <label class="f">WhatsApp como se muestra<input data-path="whatsappDisplay"></label>
    <label class="chk full"><input type="checkbox" data-path="whatsappConfirm"> Número provisional — confirmar con la dueña</label>
    <label class="f full">Dirección<input data-path="address"></label>
    <label class="f">Instagram (sin @)<input data-path="instagram"></label>
    <label class="f full">Horario <small class="muted">(una línea por renglón)</small><textarea rows="3" data-path="hours" data-lines="1"></textarea></label></div></div>
  <div class="card pad"><h3>Cobertura y traslado</h3><div class="form2">
    <label class="f">Ciudad base (sin costo)<input data-path="coverage.localCity"></label>
    <label class="f full">Otras ciudades <small class="muted">(separadas por coma)</small><input data-path="coverage.otherCities" data-csv="1"></label>
    <label class="f">Traslado otras ciudades — desde ($)<input type="number" min="0" data-path="coverage.otherFeeMin"></label>
    <label class="f">Traslado otras ciudades — hasta ($)<input type="number" min="0" data-path="coverage.otherFeeMax"></label></div></div>
  <div class="card pad"><h3>Reservas y políticas</h3><div class="form2">
    <label class="f">Anticipo para reservar (%)<input type="number" min="0" max="100" data-path="depositPct"></label>
    <label class="f">Validez de la cotización (días)<input type="number" min="1" data-path="quoteValidityDays"></label>
    <label class="f full">Montaje<textarea rows="2" data-path="policies.montaje"></textarea></label>
    <label class="f full">Desmontaje<textarea rows="2" data-path="policies.desmontaje"></textarea></label>
    <label class="f full">Cancelación<textarea rows="2" data-path="policies.cancelacion"></textarea></label></div></div>
  <div class="card pad demo-box"><h3>🎈 Modo demo</h3><p class="muted">Todo se guarda solo en este navegador (localStorage). Antes de mostrárselo a otro cliente, restaura los datos de ejemplo.</p>
    <div class="usage">Almacenamiento usado: <b>${pc}%</b><div class="meterbar"><i class="${pc > 80 ? 'warn' : ''}" style="width:${Math.min(100, pc)}%"></i></div></div>
    <button class="btn danger" id="reset">↺ Reiniciar demo</button></div>`;
  bind(view, s);
  $('#save', view).onclick = async () => { try { await saveSettings(s); toast('Configuración guardada ✔'); } catch (e) { toast(e.message, 'err'); } };
  $('#reset', view).onclick = doReset;
}
