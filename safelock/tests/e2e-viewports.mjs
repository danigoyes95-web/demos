import { chromium, URL_, newCtx, sleep } from './helpers.mjs';
const b = await chromium.launch(); const errs = [];
for (const [name, w, h] of [['360x740', 360, 740], ['390x844', 390, 844], ['tablet', 820, 1180]]) {
  const ctx = await newCtx(b, { viewport: { width: w, height: h }, isMobile: w < 800 }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
  await p.addInitScript(() => { localStorage.setItem('sl_help_seen', '1'); localStorage.setItem('sl_gps_ok', '1'); });
  await p.goto(URL_); await p.click('#demo-op'); await p.waitForSelector('#btn-next'); await sleep(600);
  await p.screenshot({ path: `/tmp/vp-${name}-jornada.png` });
  const hs = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await p.click('#btn-next'); await p.waitForSelector('#sheet'); await sleep(500); await p.screenshot({ path: `/tmp/vp-${name}-mapa.png` });
  await p.click('#btn-llegue'); await p.waitForSelector('#btn-si'); await p.click('#btn-si'); await sleep(300); await p.screenshot({ path: `/tmp/vp-${name}-registro.png` });
  console.log(name, 'scroll horizontal:', hs);
  if (name === '390x844') { await p.evaluate(() => { localStorage.setItem('sl_theme', 'dark'); document.documentElement.dataset.theme = 'dark'; }); await sleep(300); await p.screenshot({ path: '/tmp/vp-dark-registro.png' }); await p.goBack(); await sleep(400); await p.goto(URL_ + '#/'); await sleep(500); await p.screenshot({ path: '/tmp/vp-dark-jornada.png' }); }
  await ctx.close();
}
console.log('JS errors:', errs.length ? errs : 'ninguno'); await b.close();
