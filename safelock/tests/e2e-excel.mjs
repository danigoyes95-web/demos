// Importar el Excel de la empresa (formato SAP, 37 columnas): por defecto los ejemplos ficticios; con DC=/ruta RC=/ruta se prueba con archivos reales
import { chromium, URL_, newCtx, sleep } from './helpers.mjs';
const DC = process.env.DC || 'public/samples/DC01-ejemplo.xlsx', RC = process.env.RC || 'public/samples/RC01-ejemplo.xlsx';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage(); const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => localStorage.setItem('sl_help_seen', '1'));
await p.goto(URL_); await p.click('#demo-sup'); await sleep(500); await p.goto(URL_ + '#/sup/cargar');
for (const [lbl, f] of [['CORTES', DC], ['RECONEXIONES', RC]]) {
  if (lbl !== 'CORTES') await p.getByText('Cargar otro archivo').click(); await sleep(300); const t0 = Date.now(); await p.setInputFiles('#file', f); await p.waitForSelector('#resumen', { timeout: 60000 });
  console.log(lbl, '→', (await p.textContent('#resumen')).trim(), `(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  console.log('   ', (await p.textContent('#resumen + div')).replace(/\s+/g, ' ').trim().slice(0, 200));
  if (lbl === 'CORTES') await p.screenshot({ path: '/tmp/excel-review.png' });
  const t1 = Date.now(); await p.click('#btn-importar'); await p.waitForSelector('#btn-ir-asignar', { timeout: 60000 }); console.log('    importadas en', ((Date.now() - t1) / 1000).toFixed(1), 's');
}
await p.goto(URL_ + '#/sup/cargar'); await sleep(200); await p.goto(URL_ + '#/sup/asignar'); await sleep(2500);
const sin = await p.textContent('.badge.b-warn'); console.log('Asignar →', sin.trim());
await p.click('#btn-balance'); await sleep(800); console.log('Balanceo:', (await p.textContent('.alert.info')).trim().slice(0, 120));
await p.getByText('APLICAR').click(); await sleep(1500); await p.screenshot({ path: '/tmp/excel-asignar.png' });
console.log('Sin asignar tras balanceo:', await p.locator('.badge.b-warn', { hasText: 'Sin asignar' }).count());
await b.close(); console.log('JS errors:', errs.length ? errs : 'ninguno');
