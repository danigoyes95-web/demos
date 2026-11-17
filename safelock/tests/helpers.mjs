import { createRequire } from 'node:module';
export const { chromium } = createRequire(import.meta.url)('playwright');
export const URL_ = process.env.URL || 'http://localhost:4173';
export async function newCtx(browser, opts = {}) {
  return browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, permissions: ['geolocation'], geolocation: { latitude: -1.2395, longitude: -78.618, accuracy: 9 }, locale: 'es-EC', ...opts });
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
