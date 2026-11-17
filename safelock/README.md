# Safelock (demo)

PWA de órdenes de campo para cuadrillas eléctricas. **Demo sin backend**: datos ficticios en el navegador.

## Correr
```bash
cd safelock
npm install
npm run dev          # desarrollo (http://localhost:5173)
npm run build && npm run preview   # versión instalable con service worker (http://localhost:4173)
```
Acceso rápido en la pantalla de login: **Operario (Carlos)** o **Supervisor**. En el panel del supervisor, "Reiniciar demo" restaura los datos.
Para probar GPS en PC: menú ☰ del operario → "GPS simulado" y, en Brújula, "Simular caminata".

## Instalar en un celular
GPS, cámara y PWA exigen **HTTPS**. Despliega la carpeta `dist/` en Vercel o Netlify (build: `npm run build`, salida: `dist`) y abre el link:
- **Android (Chrome):** menú ⋮ → *Instalar aplicación*.
- **iPhone (Safari):** Compartir → *Agregar a inicio*.
(La app muestra estos pasos en el primer ingreso.) Para probar localmente en el celular, usa un túnel HTTPS (p. ej. `cloudflared tunnel --url http://localhost:4173`).

## Regenerar recursos
`npm run seed` (datos ficticios) · `npm run sample-pdf` (PDF de ejemplo) · `npm run icons` (íconos PNG).

Más contexto: `CONTEXTO-CLAUDE.md` · Producción: `docs/PLAN-PRODUCCION.md`.
