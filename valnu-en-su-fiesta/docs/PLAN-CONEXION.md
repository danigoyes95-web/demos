# Plan de conexión a backend (solo documento — nada de esto está instalado)

Hoy todo pasa por **`js/data.js`** (localStorage + `data/seed.json`). Al comprar, se cambia solo ese archivo; la landing y el panel no se tocan.

## Tablas necesarias
`items` (catálogo: nombre, categoría, línea, precio desde/hasta, foto, ocasiones, activo, alquiler/stock, unidad por invitados) ·
`occasions` (nombre, ícono, paleta, ambiente, orden, activa) · `suggestions` (ocasión, ítem, orden) ·
`quotes` (código, estado, motivo de pérdida, contacto, ocasión, fecha, invitados, lugar, colores, nombre, total final, anticipo, notas, snapshot, origen) ·
`quote_items` (cotización, ítem, cantidad, rango, precio final) · `site_content` (hero, cómo funciona, testimonios, secciones visibles, galería, temporada) ·
`settings` (WhatsApp, dirección, horario, cobertura, % anticipo, políticas) · `events` (visita, abrió armador, 3+ elementos, sugerencias; con sesión y fecha).

## Funciones de `data.js` que cambian
| Función | Cambio |
|---|---|
| `getItems/saveItem/deleteItem`, `getOccasions/saveOccasions`, `getSuggestions/saveSuggestions`, `getContent/saveContent`, `getSettings/saveSettings` | `select/upsert/delete` sobre su tabla |
| `getQuotes/getQuote/createQuote/updateQuote/deleteQuote` | tablas `quotes` + `quote_items`; `createQuote` abierto a anónimos (solo insertar) |
| `getAvailability(fecha)` | consulta/vista: reservas con anticipo de esa fecha vs. stock |
| `getDashboard(rango)` | vista o RPC con las mismas métricas (hoy se calcula en el navegador) |
| `trackEvent` | insert en `events` (sin bloquear la landing) |
| `getPhotoLibrary/saveUpload/deleteUpload` | Storage: subir la foto original, guardar URL pública (adiós compresión a 300 KB) |
| `login/logout/isLoggedIn` | autenticación real (correo + enlace mágico) |
| `resetDemo` | se elimina (o queda solo en un entorno de demostración) |

## Qué se activa al conectar
1. **Login real** del panel y reglas de acceso: la landing solo lee y crea cotizaciones; el panel lee/escribe todo.
2. **Fotos en Storage** con URL pública y optimización (WebP, varios tamaños).
3. **Sincronización entre dispositivos**: lo que guarda la dueña en el celular se ve en cualquier navegador, no solo en el suyo.
4. **Notificación de nuevas cotizaciones** (WhatsApp/correo/push) y recordatorio automático de «sin responder en 2 h».
5. Analítica real (GA4/Meta Pixel + mapas de calor) y pruebas A/B de la promesa del hero.
