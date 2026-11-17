// Con datos al estilo empresa (sin cliente, medidor ni coordenadas): importar → asignar → operario → registrar → exportar formato empresa
import { chromium, URL_, newCtx, sleep } from './helpers.mjs';
import fs from 'node:fs';
const b = await chromium.launch(); const ctx = await newCtx(b, { acceptDownloads: true, viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false }); const p = await ctx.newPage(); const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { localStorage.setItem('sl_help_seen', '1'); localStorage.setItem('sl_gps_ok', '1'); });
await p.goto(URL_); await p.click('#demo-sup'); await sleep(400); await p.goto(URL_ + '#/sup/cargar');
await p.click('#btn-sample-dc'); await p.waitForSelector('#resumen'); await p.click('#btn-importar'); await p.waitForSelector('#btn-ir-asignar');
await p.click('#btn-ir-asignar'); await sleep(1500); await p.click('#btn-balance'); await sleep(500); await p.getByText('APLICAR').click(); await sleep(800);
await p.click('text=Salir'); await sleep(400);
// operario
await p.setViewportSize({ width: 390, height: 844 });
await p.click('#demo-op'); await p.waitForSelector('#btn-next'); await sleep(1200);
const nx = (await p.textContent('#btn-next')).replace(/\s+/g, ' ').trim(); console.log('Siguiente:', nx);
console.log('Banner ruta:', (await p.textContent('#ruta-info').catch(() => '(sin banner)')).replace(/\s+/g, ' ').trim());
const firstCards = await p.$$eval('.ocard', c => c.slice(0, 4).map(x => x.innerText.replace(/\n+/g, ' | ')));
firstCards.forEach(t => console.log('  tarjeta:', t));
await p.screenshot({ path: '/tmp/op-excel-jornada.png' });
// primera orden de tipo corte de la ruta
const id = await p.evaluate(async () => (await new Promise(res => { const q = indexedDB.open('safelock-v2'); q.onsuccess = () => { const t = q.result.transaction('orders').objectStore('orders').getAll(); t.onsuccess = () => res(t.result); }; })).filter(o => o.raw && o.tipo === 'corte' && o.asignadoA === 'op1').sort((a, b) => (a.mru + a.secuencia).localeCompare(b.mru + b.secuencia))[0].id);
await p.goto(URL_ + '#/mapa/' + id); await p.waitForSelector('#sheet'); await sleep(400); await p.screenshot({ path: '/tmp/op-excel-mapa.png' });
console.log('Hoja: ', (await p.textContent('#sheet')).replace(/\s+/g, ' ').slice(0, 230));
await p.click('#btn-llegue'); await p.waitForSelector('#btn-si'); await p.click('#btn-si'); await sleep(200);
await p.fill('#f-lectura', '4521'); await p.click('#ch-medidor'); await p.fill('#f-sello1', 'S900123'); await p.fill('#f-medidor', 'M7771234');
await p.setInputFiles('#in-foto', '/tmp/foto.jpg'); await p.waitForSelector('.thumbs img'); await p.screenshot({ path: '/tmp/op-excel-registro.png' });
await p.click('#btn-guardar'); await p.waitForFunction(() => !location.hash.startsWith('#/registro'), null, { timeout: 8000 }); await sleep(600);
console.log('Guardada ✓ → ahora en', await p.evaluate(() => location.hash.slice(0, 20)));
// supervisor: exportar en formato empresa
await p.setViewportSize({ width: 1280, height: 900 }); await p.goto(URL_ + '#/'); await sleep(300);
await p.evaluate(() => { localStorage.removeItem('sl_session'); }); await p.reload(); await p.click('#demo-sup'); await sleep(500); await p.goto(URL_ + '#/sup/reportes'); await sleep(1500);
const [d] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.click('#exp-empresa')]); const f = '/tmp/empresa.xlsx'; await d.saveAs(f); console.log('Descarga formato empresa:', d.suggestedFilename(), fs.statSync(f).size, 'bytes');
await b.close(); console.log('JS errors:', errs.length ? errs : 'ninguno');
