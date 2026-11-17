import { chromium, URL_, sleep } from './helpers.mjs';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, locale: 'es-EC', acceptDownloads: true });
const p = await ctx.newPage(); const errs = [];
p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/tile|ERR_|Failed to load resource/.test(m.text()) && errs.push(m.text()));
await p.goto(URL_); await p.click('#demo-sup'); await p.getByText('ENTENDIDO').click(); await sleep(1200);
await p.screenshot({ path: '/tmp/sup-mon.png' });
for (const r of ['ordenes', 'asignar', 'reportes', 'config']) { await p.goto(URL_ + '#/sup/' + r); await sleep(1500); await p.screenshot({ path: `/tmp/sup-${r}.png` }); }
// Importar PDF de ejemplo
await p.goto(URL_ + '#/sup/cargar'); await sleep(500); await p.click('#btn-sample'); await p.waitForSelector('#resumen', { timeout: 20000 });
console.log('RESUMEN:', await p.textContent('#resumen')); await p.screenshot({ path: '/tmp/sup-cargar.png' });
console.log('errores en tabla:', await p.locator('td.err').count());
// corregir: medidor faltante, cuen duplicado, coordenadas
for (const el of await p.locator('td.err input').all()) { const ph = await el.evaluate(n => n.closest('td').textContent); }
await b.close(); console.log('JS ERRORS:', errs.length ? errs : 'ninguno');
