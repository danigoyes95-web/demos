// GPS simulado moviéndose hacia un medidor: la brújula y la alerta de llegada (30 m) deben funcionar
import { chromium, URL_, newCtx, sleep } from './helpers.mjs';
const b = await chromium.launch(); const ctx = await newCtx(b, { geolocation: { latitude: -1.2395, longitude: -78.618, accuracy: 6 } }); const p = await ctx.newPage();
await p.addInitScript(() => { window.__vib = []; navigator.vibrate = v => { window.__vib.push(v); return true; }; });
await p.goto(URL_); await p.click('#demo-op'); await p.getByText('ENTENDIDO').click(); await p.waitForSelector('#btn-next');
await p.click('#gps-allow'); await sleep(500);
const o = await p.evaluate(async () => (await new Promise(res => { const q = indexedDB.open('safelock-v2'); q.onsuccess = () => { const t = q.result.transaction('orders').objectStore('orders').getAll(); t.onsuccess = () => res(t.result); }; })).find(o => o.estado === 'pendiente' && o.asignadoA === 'op1' && o.loc.calidad === 'verificada'));
const T = o.loc; console.log('destino', o.cliente, T.lat, T.lng);
await p.goto(URL_ + '#/brujula/' + o.id); await p.waitForSelector('#dist');
// camina desde ~250 m al suroeste hasta 8 m del medidor
const steps = [[-250, -250], [-120, -120], [-60, -40], [-35, -20], [-22, -10], [-8, -4]];
for (const [dy, dx] of steps) {
  await ctx.setGeolocation({ latitude: T.lat + dy / 111000, longitude: T.lng + dx / 111000, accuracy: 6 }); await sleep(900);
  console.log(`  dist: ${(await p.textContent('#dist')).trim().padEnd(8)} | ${(await p.textContent('#rumbo')).trim().slice(0, 40)} | llegada: ${!!(await p.$('#arrived'))}`);
}
console.log('Vibraciones:', JSON.stringify(await p.evaluate(() => window.__vib)));
await p.screenshot({ path: '/tmp/s-brujula.png' });
await b.close();
