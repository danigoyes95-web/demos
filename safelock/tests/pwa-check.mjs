import { chromium, URL_, sleep } from './helpers.mjs';
const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
await p.goto(URL_); await p.evaluate(() => navigator.serviceWorker.ready); await sleep(1500);
const c = await ctx.newCDPSession(p); await c.send('Page.enable');
const m = await c.send('Page.getAppManifest'); const inst = await c.send('Page.getInstallabilityErrors');
console.log('manifest url:', m.url, '| errores manifest:', m.errors.length, '| installability errors:', JSON.stringify(inst.installabilityErrors));
const man = JSON.parse(m.data); console.log('name:', man.name, '| display:', man.display, '| icons:', man.icons.map(i => i.sizes + (i.purpose ? ':' + i.purpose : '')).join(', '));
await b.close();
