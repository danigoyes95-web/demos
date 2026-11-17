// Modo avión: ejecutar 3 órdenes sin red, reconectar y ver la sincronización
import { chromium, URL_, newCtx, sleep } from './helpers.mjs';
import fs from 'node:fs';
const b = await chromium.launch(); const ctx = await newCtx(b); const p = await ctx.newPage(); const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto(URL_); await p.click('#demo-op'); await p.getByText('ENTENDIDO').click(); await p.waitForSelector('#btn-next');
// esperar al service worker + precache
await p.evaluate(async () => { await navigator.serviceWorker.ready; });
await sleep(2500); await p.reload(); await p.waitForSelector('#btn-next');
console.log('SW controla la página:', await p.evaluate(() => !!navigator.serviceWorker.controller));
fs.existsSync('/tmp/foto.jpg') || (() => { throw new Error('falta /tmp/foto.jpg (corre e2e-corte primero)'); })();
await ctx.setOffline(true); await sleep(300);
console.log('Indicador:', (await p.textContent('#net')).trim());
await p.reload(); await p.waitForSelector('#btn-next', { timeout: 8000 }); console.log('Recarga SIN red: la app abre ✓');
for (let i = 0; i < 3; i++) {
  if (i === 0) await p.click('#btn-next'); await p.waitForSelector('#btn-llegue'); await p.click('#btn-llegue'); await p.waitForSelector('#btn-si');
  await p.click('#btn-si'); await sleep(150);
  const tipo = await p.evaluate(() => document.querySelector('.top .type')?.textContent.trim());
  const lect = await p.$('#f-lectura'); if (lect) { const prev = +(await p.textContent('label[for=f-lectura]')).match(/anterior (\d+)/)[1]; await p.fill('#f-lectura', String(prev + 120)); }
  for (const sel of ['#ch-medidor', '#ch-mano', '#ch-bueno', '#ch-ninguna']) if (await p.$(sel)) await p.click(sel);
  if (await p.$('#f-sello1')) await p.fill('#f-sello1', 'S' + (900000 + i));
  await p.setInputFiles('#in-foto', '/tmp/foto.jpg'); await p.waitForSelector('.thumbs img');
  await p.click('#btn-guardar'); await p.waitForFunction(() => !location.hash.startsWith('#/registro'), null, { timeout: 5000 });
  console.log(`  orden ${i + 1} (${tipo}) guardada sin red · indicador:`, (await p.textContent('#net').catch(() => '(otra pantalla)')).toString().trim());
}
await p.goto(URL_ + '#/'); await p.waitForSelector('#net'); console.log('Pendientes de enviar offline:', (await p.textContent('#net')).trim());
await ctx.setOffline(false); await p.evaluate(() => dispatchEvent(new Event('online')));
await p.waitForFunction(() => !/pend/.test(document.getElementById('net').textContent), null, { timeout: 8000 });
console.log('Tras reconectar:', (await p.textContent('#net')).trim(), '| toast:', await p.textContent('.toast').catch(() => '(ya cerró)'));
await b.close(); console.log('JS ERRORS:', errs.length ? errs : 'ninguno');
