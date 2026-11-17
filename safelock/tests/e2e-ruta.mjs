// Ruta del día: estable, optimizada (vs orden del PDF) y recalculable
import { chromium, URL_, newCtx, sleep } from './helpers.mjs';
const b = await chromium.launch(); const errs = [];
const plan = (p, op) => p.evaluate(op => new Promise(res => { const q = indexedDB.open('safelock-demo'); q.onsuccess = () => { const t = q.result.transaction('settings').objectStore('settings').getAll(); t.onsuccess = () => res(t.result.find(r => r.key.startsWith('ruta:' + op))?.value); }; }), op);
for (const [code, pin] of [['OP-01', '1234'], ['OP-02', '2345'], ['OP-03', '3456']]) {
  const ctx = await newCtx(b); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('sl_help_seen', '1'); localStorage.setItem('sl_gps_ok', '1'); });
  await p.goto(URL_); await p.fill('#u', code); await p.fill('#p', pin); await p.click('button[type=submit]'); await p.waitForSelector('#btn-next'); await sleep(1500);
  const op = 'op' + code.slice(-1); const a = await plan(p, op);
  console.log(code, `→ ${a.paradas} paradas · ruta ${a.km.toFixed(1)} km vs ${a.kmBase.toFixed(1)} km en orden del PDF (−${Math.round((1 - a.km / a.kmBase) * 100)}%)`);
  if (code === 'OP-01') {
    const ids = () => p.$$eval('.ocard .b.ellip', n => n.slice(0, 12).map(x => x.textContent).join(','));
    const r1 = await ids();
    await ctx.setGeolocation({ latitude: -1.2700, longitude: -78.6300, accuracy: 8 }); await sleep(2500);
    console.log('  estable al moverme:', r1 === await ids());
    await p.click('#btn-reorder'); await sleep(1500); console.log('  tras "Reordenar" desde otra posición, siguiente:', (await p.textContent('#btn-next')).trim().slice(0, 60));
    console.log('  banner:', (await p.textContent('#ruta-info')).replace(/\s+/g, ' ').trim());
    await p.screenshot({ path: '/tmp/ruta.png', clip: { x: 0, y: 60, width: 360, height: 420 } });
  }
  await ctx.close();
}
console.log('JS errors:', errs.length ? errs : 'ninguno'); await b.close();
