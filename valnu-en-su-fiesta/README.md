# Valnu en su Fiesta — demo «Arma tu fiesta»

Demo funcional (landing + panel). **No usa backend**: todo vive en el navegador (`localStorage`) con datos semilla de `data/seed.json`.

## Correrlo
Necesita un servidor estático (usa módulos ES, no abre con doble clic):
```bash
cd valnu-en-su-fiesta
python3 -m http.server 8000
```
Landing: <http://localhost:8000/> · Panel: <http://localhost:8000/admin/> (cualquier clave).

## Desplegarlo para mandar el link
Es 100 % estático. Opciones gratuitas: **GitHub Pages** (el repo ya publica cada carpeta: `…/valnu-en-su-fiesta/` y `…/valnu-en-su-fiesta/admin/`), Netlify (arrastrar la carpeta) o Vercel (importar el repo, *Root Directory* = `valnu-en-su-fiesta`, sin build).

## Presentarlo
1. Panel → Configuración → **Reiniciar demo** (deja todo como al inicio).
2. Panel → cambia un precio (Catálogo), el titular (Contenido) o apaga el banner de temporada → recarga la landing.
3. Landing → arma una fiesta → «Cotizar por WhatsApp» → aparece en Panel → Cotizaciones.
Los datos son por navegador/dispositivo: cada celular tiene su propia copia.

## Estructura
`index.html` · `admin/` · `css/` (tokens compartidos) · `js/data.js` (único acceso a datos) · `js/scene.js` (escena SVG) · `js/landing/` · `js/admin/` · `js/vendor/` (Chart.js, canvas-confetti) · `data/` · `assets/fotos/` · `tools/` (generador del seed y del índice de fotos) · `docs/`.
Más contexto: `CONTEXTO-CLAUDE.md` · dirección visual: `DESIGN.md` · conexión futura: `docs/PLAN-CONEXION.md`.

## Créditos
Chart.js (MIT) y canvas-confetti (ISC) incluidos localmente. Criterios de diseño y movimiento inspirados en las guías de [HyperFrames](https://github.com/heygen-com/hyperframes) (Apache-2.0); no se incluye código suyo.
