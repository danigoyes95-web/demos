// Prueba: flujo de 1 corte desde "Llegué" hasta "Guardar y siguiente" (tiempo y toques reales)
import { chromium, URL_, newCtx, sleep } from './helpers.mjs';
import fs from 'node:fs';
const b = await chromium.launch(); const ctx = await newCtx(b); const p = await ctx.newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.stack.split('\n').slice(0,7).join('\n')));
await p.goto(URL_); await p.click('#demo-op'); await p.getByText('ENTENDIDO').click(); await p.waitForSelector('#btn-next');
await p.screenshot({ path: '/tmp/s-jornada.png' });
// foto de prueba
await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 1600; c.height = 1200; const g = c.getContext('2d'); g.fillStyle = '#556'; g.fillRect(0, 0, 1600, 1200); g.fillStyle = '#ddd'; g.fillRect(500, 300, 600, 600); window.__img = c.toDataURL('image/jpeg', .9); });
const data = (await p.evaluate(() => window.__img)).split(',')[1]; fs.writeFileSync('/tmp/foto.jpg', Buffer.from(data, 'base64'));
// primera orden pendiente de tipo corte de Carlos
const id = await p.evaluate(async () => { const r = await new Promise(res => { const q = indexedDB.open('safelock-v2'); q.onsuccess = () => { const t = q.result.transaction('orders').objectStore('orders').getAll(); t.onsuccess = () => res(t.result); }; }); return r.find(o => o.estado === 'pendiente' && o.tipo === 'corte' && o.asignadoA === 'op1' && o.loc.lat)?.id; });
console.log('orden', id);
await p.goto(URL_ + '#/mapa/' + id); await p.waitForSelector('#btn-llegue');
let taps = 0; await p.exposeFunction('__tap', () => taps++);
await p.evaluate(() => addEventListener('pointerdown', e => { if (e.target.closest('button,label,input,textarea,a')) window.__tap(); }, true));
const t0 = Date.now();
await p.tap('#btn-llegue'); await p.waitForSelector('#btn-si');
await p.tap('#btn-si'); await p.waitForFunction(() => document.activeElement?.id === 'f-lectura');
await p.keyboard.type('8100');                       // lectura (teclado numérico)
await p.tap('#ch-medidor');                          // tipo de corte
await p.tap('#f-sello1'); await p.keyboard.type('S123456');
await p.setInputFiles('#in-foto', '/tmp/foto.jpg'); taps++; // 1 toque en TOMAR FOTO (abre cámara)
await p.waitForSelector('.thumbs img');
await p.screenshot({ path: '/tmp/s-registro.png' });
await p.tap('#btn-guardar'); await sleep(1500); await p.screenshot({ path: '/tmp/s-after.png' }); console.log('hash', await p.evaluate(() => location.hash), (await p.locator('.alert.bad').allTextContents()).join('|'));
await p.waitForFunction(i => location.hash.startsWith('#/mapa/') && !location.hash.includes(i), id, { timeout: 5000 });
const dt = (Date.now() - t0) / 1000;
console.log('TOQUES (sin contar teclear):', taps, '| segundos automatizado:', dt.toFixed(1));
await p.screenshot({ path: '/tmp/s-siguiente.png' });
const saved = await p.evaluate(async id => new Promise(res => { const q = indexedDB.open('safelock-v2'); q.onsuccess = () => { const t = q.result.transaction('orders').objectStore('orders').get(id); t.onsuccess = () => res(t.result); }; }), id);
console.log('estado', saved.estado, 'sync', saved.sync, 'fotos', saved.ejecucion.fotos.length, 'gps', JSON.stringify(saved.ejecucion.gps), 'loc', saved.loc.calidad);
await b.close();
