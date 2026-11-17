import { chromium, URL_, newCtx, sleep } from './helpers.mjs';
const b = await chromium.launch(); const errs = [];
// 1) Supervisor: exportaciones + importar + asignar + reset
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => localStorage.setItem('sl_help_seen', '1'));
await p.goto(URL_); await p.click('#demo-sup'); await sleep(600);
await p.goto(URL_ + '#/sup/reportes'); await sleep(1500);
for (const id of ['#exp-csv', '#exp-xlsx', '#exp-pdf']) { const [d] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.click(id)]); console.log('descarga', id, '→', d.suggestedFilename()); }
await p.screenshot({ path: '/tmp/sup-reportes2.png', fullPage: true });
// importar PDF y asignar
await p.goto(URL_ + '#/sup/cargar'); await p.click('#btn-sample'); await p.waitForSelector('#resumen');
// corregir 3 errores
const inputs = p.locator('td.err input, td.err select');
for (let i = 0; i < await inputs.count(); i++) { const el = inputs.nth(i); const tag = await el.evaluate(n => n.tagName); const hdr = await el.evaluate(n => n.closest('td').textContent); if (/Medidor/.test(hdr)) await el.fill('M9990001'); else if (/CUEN/.test(hdr)) await el.fill('99999001'); else if (/Coordenadas/.test(hdr)) { await el.fill(''); } }
await sleep(600); console.log('tras corregir:', await p.textContent('#resumen'));
await p.click('#btn-importar'); await p.waitForSelector('#btn-ir-asignar'); await p.click('#btn-ir-asignar'); await sleep(1200);
await p.click('#btn-balance'); await sleep(400); await p.getByText('APLICAR').click(); await sleep(800);
console.log('sin asignar tras balanceo:', await p.locator('.badge.b-warn', { hasText: 'Sin asignar' }).count());
await p.screenshot({ path: '/tmp/sup-asignar2.png' });
await p.click('#btn-reset'); await p.click('#btn-confirm'); await sleep(1500);
// 2) Operario: flujo NO ejecutado
const c2 = await newCtx(b); const q = await c2.newPage(); q.on('pageerror', e => errs.push(e.message));
await q.addInitScript(() => { localStorage.setItem('sl_help_seen', '1'); localStorage.setItem('sl_gps_ok', '1'); });
await q.goto(URL_); await q.click('#demo-op'); await q.waitForSelector('#btn-next'); await q.click('#btn-next'); await q.click('#btn-llegue'); await q.click('#btn-no'); await q.getByText('Cliente ausente').click();
await q.click('#btn-guardar'); await sleep(300); console.log('NO sin foto →', (await q.locator('.alert.bad').allTextContents()).join('|'));
await q.setInputFiles('#in-foto', '/tmp/foto.jpg'); await q.waitForSelector('.thumbs img'); await q.click('#btn-guardar'); await q.waitForFunction(() => !location.hash.startsWith('#/registro'), null, { timeout: 5000 }); console.log('NO con foto guardada ✓');
await b.close(); console.log('JS ERRORS:', errs.length ? errs : 'ninguno');
