/* Club: QR + diseños imprimibles (imán, sticker, tarjeta). Compartido por cliente y panel. */
const Club = (() => {
  const url = code => Data.BASE + '#/club/' + code;
  function qrSvg(text, size = 200) {
    if (!window.qrcode) return `<svg viewBox="0 0 100 100" width="${size}" height="${size}"><rect width="100" height="100" fill="#fff"/><text x="50" y="54" text-anchor="middle" font-size="9" font-family="monospace">${text.slice(-14)}</text></svg>`;
    const q = qrcode(0, 'M'); q.addData(text); q.make(); const n = q.getModuleCount(); let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + 2} ${r + 2}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n + 4} ${n + 4}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="#121110"/></svg>`;
  }
  const inner = s => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function design(c, variant = 'iman') {
    const qr = qrSvg(url(c.code), 300).replace(/width="300" height="300"/, 'x="0" y="0" width="100%" height="100%"'); const mascot = inner(Mascot.don('hello', 200));
    const G = '#D2A464', head = t => `font-family="Georgia,'Times New Roman',serif" font-weight="700"`;
    if (variant === 'tarjeta') return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 856 540" width="856" height="540"><rect width="856" height="540" rx="36" fill="#121110"/><rect x="14" y="14" width="828" height="512" rx="26" fill="none" stroke="${G}" stroke-width="3"/>
<g transform="translate(40 150) scale(1.35)">${mascot}</g><text x="360" y="120" ${head()} font-size="78" fill="${G}">Don</text><text x="360" y="190" ${head()} font-size="78" fill="#F4EEE4">Snack</text><text x="362" y="222" font-family="Arial" font-weight="700" font-size="16" letter-spacing="5" fill="#b9b0a2">WINE, BEER &amp; SPIRITS</text>
<text x="360" y="300" font-family="Arial" font-weight="800" font-size="34" fill="#F4EEE4">Club Don Snack</text><text x="360" y="345" font-family="Arial" font-size="26" fill="${G}">${esc(c.name)}</text><text x="360" y="385" font-family="Arial" font-size="22" fill="#b9b0a2">Código ${c.code}</text><text x="360" y="470" font-family="Arial" font-size="18" fill="#b9b0a2">Celebra responsablemente · Solo mayores de 18</text>
<g transform="translate(580 150)"><rect width="230" height="230" rx="16" fill="#fff"/><g transform="translate(10 10)"><svg width="210" height="210" viewBox="0 0 100 100" preserveAspectRatio="none">${inner(qr)}</svg></g></g><text x="695" y="415" text-anchor="middle" font-family="Arial" font-weight="800" font-size="24" fill="${G}">Escanea y pide</text></svg>`;
    if (variant === 'sticker') return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500"><circle cx="250" cy="250" r="244" fill="#121110" stroke="${G}" stroke-width="8"/><circle cx="250" cy="250" r="222" fill="none" stroke="${G}" stroke-width="2" stroke-dasharray="4 8"/>
<text x="250" y="86" text-anchor="middle" ${head()} font-size="46" fill="${G}">Don <tspan fill="#F4EEE4">Snack</tspan></text><rect x="150" y="110" width="200" height="200" rx="14" fill="#fff"/><svg x="160" y="120" width="180" height="180" viewBox="0 0 100 100" preserveAspectRatio="none">${inner(qr)}</svg>
<text x="250" y="352" text-anchor="middle" font-family="Arial" font-weight="900" font-size="34" fill="#F4EEE4">ESCANEA Y PIDE</text><text x="250" y="392" text-anchor="middle" font-family="Arial" font-weight="700" font-size="20" fill="${G}">Club · ${c.code}</text><text x="250" y="432" text-anchor="middle" font-family="Arial" font-size="14" letter-spacing="3" fill="#b9b0a2">WINE, BEER &amp; SPIRITS</text></svg>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600"><rect width="600" height="600" rx="56" fill="#121110"/><rect x="14" y="14" width="572" height="572" rx="44" fill="none" stroke="${G}" stroke-width="4"/>
<g transform="translate(30 36) scale(.62)">${mascot}</g><text x="190" y="104" ${head()} font-size="68" fill="${G}">Don</text><text x="190" y="166" ${head()} font-size="68" fill="#F4EEE4">Snack</text><text x="192" y="192" font-family="Arial" font-weight="700" font-size="13" letter-spacing="4" fill="#b9b0a2">WINE, BEER &amp; SPIRITS</text>
<rect x="150" y="222" width="300" height="300" rx="20" fill="#fff"/><svg x="165" y="237" width="270" height="270" viewBox="0 0 100 100" preserveAspectRatio="none">${inner(qr)}</svg>
<text x="300" y="560" text-anchor="middle" font-family="Arial" font-weight="900" font-size="30" fill="${G}">ESCANEA Y PIDE</text><text x="480" y="262" font-family="Arial" font-weight="700" font-size="16" fill="#b9b0a2" transform="rotate(90 480 262)"></text></svg>`;
  }
  function toPng(svg, scale = 2) {
    return new Promise((res, rej) => { const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/), w = +m[1], h = +m[2], img = new Image();
      img.onload = () => { const cv = document.createElement('canvas'); cv.width = w * scale; cv.height = h * scale; const x = cv.getContext('2d'); x.drawImage(img, 0, 0, cv.width, cv.height); res(cv.toDataURL('image/png')); };
      img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  }
  async function download(c, variant) { const a = document.createElement('a'); a.href = await toPng(design(c, variant)); a.download = `club-don-snack-${variant}-${c.code}.png`; document.body.appendChild(a); a.click(); a.remove(); }
  function printDesign(c, variant) { const w = window.open('', '_blank'); if (!w) return alert('Permite ventanas emergentes para imprimir'); w.document.write(`<title>Club Don Snack ${c.code}</title><style>@page{margin:10mm}body{margin:0;display:grid;place-items:center;min-height:100vh}svg{width:${variant === 'tarjeta' ? '85.6mm' : '90mm'};height:auto}</style>${design(c, variant)}<script>setTimeout(()=>print(),300)<\/script>`); w.document.close(); }
  return { url, qrSvg, design, toPng, download, printDesign };
})();
