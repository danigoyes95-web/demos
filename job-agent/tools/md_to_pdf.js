// Usage: node md_to_pdf.js input.md output.pdf  (needs pandoc + playwright)
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const [inp, out] = process.argv.slice(2);
const body = execFileSync('pandoc', ['-f', 'markdown-smart', '-t', 'html', inp]).toString();
const css = `
@page { size: Letter; margin: 14mm 15mm; }
body { font: 10pt/1.38 -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color:#1b1f23; }
h1 { font-size: 21pt; margin: 0 0 2px; letter-spacing:-.3px; }
h1 + p { margin: 0 0 6px; }
h2 { font-size: 10.5pt; text-transform: uppercase; letter-spacing: 1.2px; color:#1f5f7a; border-bottom: 1.5px solid #1f5f7a; padding-bottom: 2px; margin: 13px 0 6px; }
h3 { font-size: 10.5pt; margin: 9px 0 2px; }
p { margin: 3px 0; } ul { margin: 2px 0 4px; padding-left: 16px; } li { margin: 1.5px 0; }
em { color:#444; }
`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setContent(`<html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`);
  await p.pdf({ path: out, format: 'Letter', printBackground: true, preferCSSPageSize: true });
  await b.close();
})();
