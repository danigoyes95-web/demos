// Genera íconos PNG (192, 512, maskable) desde el logo usando Chromium/Playwright.
import { createRequire } from 'node:module'; import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const shield = '<g fill="none" stroke="#FFC21A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M32 5 10 13v17c0 14 9 24 22 29 13-5 22-15 22-29V13z"/><path d="M35 17 24 33h8l-3 14 11-17h-8z" fill="#FFC21A" stroke="none"/></g>';
const svg = (size, pad, r) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64"><rect width="64" height="64" rx="${r}" fill="#0E1B2C"/><g transform="translate(${pad} ${pad}) scale(${(64 - 2 * pad) / 64})">${shield}</g></svg>`;
const b = await chromium.launch(); const p = await b.newPage();
for (const [name, size, pad, r] of [['icon-192', 192, 7, 14], ['icon-512', 512, 7, 14], ['maskable-512', 512, 14, 0]]) {
  await p.setViewportSize({ width: size, height: size }); await p.setContent(`<body style="margin:0">${svg(size, pad, r)}</body>`);
  fs.writeFileSync(`public/icons/${name}.png`, await p.screenshot({ omitBackground: true }));
}
await b.close(); console.log('íconos listos');
