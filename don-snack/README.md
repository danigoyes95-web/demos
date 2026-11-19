# Don Snack — Pide en 2 toques + Club Don Snack (DEMO)

Demo de venta: app del cliente (`/`) y panel del dueño (`/admin/`). **Sin backend**: JSON semilla + localStorage. Todo pasa por `js/data.js`.

## Correrlo
```bash
cd don-snack && python3 -m http.server 8765
```
- Cliente: http://localhost:8765/ · Panel: http://localhost:8765/admin/ (Dueño `1111`, Despachador `2222`)
- Cliente reconocido por QR: `http://localhost:8765/#/club/DS-0001` (Carlos, VIP cerca) · `DS-0002` (Valeria, cava) · `DS-0003` (Mateo)
- Demo en un solo celular: abre la app y el panel en dos pestañas del mismo navegador (comparten datos). “Reiniciar” (panel, Dueño) vuelve al estado inicial.
- Aviso: el modo “Ley seca/horario” bloquea pedidos; para presentar a cualquier hora hay “Modo demo: entrar igual” o el interruptor en Configuración.

## Desplegarlo
Es estático: súbelo a GitHub Pages / Netlify / Hostinger (carpeta `don-snack/`). Requiere HTTPS para GPS, service worker e instalación PWA. El QR del Club apunta a `…/#/club/CODIGO`.
Fotos reales: copia `assets/productos/ID.jpg` (lista en `LEEME.txt`) y ejecuta `node tools/build-seed.js` (marca las fotos detectadas).

## Estructura
`index.html` · `admin/index.html` · `js/{data,mock,mascot,club,app,admin}.js` · `css/` · `data/seed.json` (generado por `tools/build-seed.js`) · `vendor/` (QR, Leaflet, confetti, Chart.js, sin CDN) · `sw.js` + `manifest.json` · `docs/PLAN-CONEXION.md` · `CONTEXTO-CLAUDE.md`

## Pruebas (Chromium headless, 390×844 y 360×740)
| Prueba | Resultado |
|---|---|
| Pedido repetido desde QR | **1 toque + deslizar** (objetivo ≤2) |
| Combo de previa | **3 toques + deslizar** (puerta → combo → pedido) |
| Asesor de la Cava | **4 toques** de la pregunta 1 al vino en el carrito (5 con la puerta) |
| Dedo torpe | toques en bordes/entre botones: carrito sin cambios; tocar la pista o arrastrar a medias no envía |
| Anti-duplicado | “Ya pediste esto hace N min” al repetir (<15 min) |
| QR → pedido → panel con alerta → estado → seguimiento | OK (Recibido → Preparando → En camino con moto → Entregado) |
| Campaña activada en el panel | banner y −15 % visibles en la app |
| Sin conexión | carga desde caché y guarda el pedido con aviso de enviar por WhatsApp |
Contraste (WCAG): dorado claro `#D2A464` sobre negro 8.3:1; texto negro sobre botón dorado 6.0:1; gris secundario 8.8:1; texto sobre rosado ajustado a negro (5.7:1). **No probado**: celular físico con brillo bajo, vibración y GPS reales, impresora térmica.

## Datos a confirmar con el dueño
Productos y precios reales (los actuales son ficticios) · combos y Wine Combos · WhatsApp · horarios (y especiales) · zonas de delivery, costo y tiempo · pedido mínimo · niveles del Club ($60/$150) y beneficios · precio del empaque de regalo · ¿vende cigarrillos? · taxi seguro · medios de pago (¿otros?) · logo y mascota originales · permiso para usar fotos de Instagram · consentimiento/política de datos.

## 3 mejoras para la versión final
1. Backend real (Supabase): pedidos en tiempo real entre dispositivos, notificaciones push de “otra ronda” y campañas, y cobro Payphone verdadero.
2. Reconocimiento sin QR (cookie/WebAuthn o enlace por WhatsApp) y reabastecimiento predictivo (“¿te llevamos hielo?” según hora y frecuencia).
3. Reparto: asignación con mapa y seguimiento en vivo del repartidor, más impresión térmica directa y verificación de edad en la entrega.
