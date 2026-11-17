# Safelock — contexto del proyecto

PWA **demo de venta** para un contratista de la empresa eléctrica en Ambato (Tungurahua, Ecuador). **No hay backend**: todo corre en el navegador (IndexedDB/Dexie) con datos 100 % ficticios. Toda lectura/escritura pasa por `src/js/data.js`.

## Problema que resuelve
La app actual: (1) el mapa no lleva al medidor (pines amontonados, sin ruta/distancia/navegación; en zona rural se pierden); (2) registrar un trabajo exige saltar entre pestañas, cámara, checks, lectura con su propio "guardar", sellos y observaciones; (3) un menú de ~10 botones sin flujo claro. Las órdenes llegan en PDF.

## Decisiones de UX
- **Un flujo, no un menú:** Jornada → "Ir a la siguiente" → Llegué → Registrar → Siguiente → Cierre. Rutas: `#/` jornada · `#/mapa[/id]` · `#/brujula/id` · `#/registro/id` · `#/cierre`.
- **Llegar:** mapa con clusters y ruta (vecino más cercano respetando la secuencia/MRU), hoja inferior con Navegar (deep link Google Maps/Waze), Brújula (flecha + metros en vivo + vibración a 30 m), foto del lugar y nota "cómo llegar". Calidad de ubicación 🟢 verificada / 🟡 aproximada / 🔴 sin ubicación, siempre con ícono y texto. La base de ubicaciones **aprende**: cada ejecución con GPS ≤ 15 m guarda el punto del medidor.
- **Registrar en una pantalla:** ¿Se pudo? SÍ/NO → campos del tipo (config en `src/data/order-types.json`) → un botón fijo "GUARDAR Y SIGUIENTE". El campo de lectura recibe foco solo; validación inline (menor que la anterior = error; salto anormal = pide confirmar). Guardado local inmediato.
- **Offline primero:** service worker (app shell + tiles OSM en caché), cola de envío = órdenes con `sync:'pendiente'`, envío automático al volver la red.
- **Evidencia:** foto con marca de agua (fecha, hora, GPS, precisión, CUEN, operario), ~300 KB; el GPS de la ejecución y su precisión se guardan siempre. Alerta si precisión > 50 m.
- **Sol y guantes:** botones ≥ 56 px, texto grande, alto contraste, tema claro (día) / oscuro (noche, auto), números tabulares.

## Ruta del día (`src/js/route.js`)
Ruta **fija** por operario (se guarda en `settings` como `ruta:<op>:<fecha>`): se calcula al abrir la jornada y solo se recalcula si llegan órdenes nuevas, si aparece el GPS por primera vez o si el operario pulsa "Reordenar". Algoritmo: agrupa por MRU/sector (zonas ordenadas por cercanía) → vecino más cercano + 2-opt dentro de cada zona → órdenes sin ubicación al final de su zona. Opción en Configuración: respetar la secuencia del PDF dentro de cada MRU. Distancias en línea recta × 1.3 (aprox. por calle). El ahorro mostrado compara contra el orden del PDF; en la demo es exagerado porque la secuencia sembrada es aleatoria. Siguiente paso en producción: distancias por calle (OSRM/Valhalla) calculadas en la oficina.

## Paleta (justificación)
- **Azul marino `#0E1B2C`** (base, cabeceras): sobrio, técnico, transmite seguridad eléctrica y da el mayor contraste con el amarillo.
- **Ámbar `#FFC21A`** (acción principal): color universal de "precaución/seguridad", se ve a pleno sol y sobre marino; texto oscuro encima (contraste > 10:1).
- **Estados** (verde `#0B7A4B`, rojo `#B3261E`, azul `#1F5FBF`, ámbar-oscuro): se eligieron con luminosidad distinta entre verde y rojo y **nunca van solos**: siempre ícono (✓, ✕, ⚠, bandera) + texto, para daltonismo.
- **Tipos de orden** (consistentes en toda la app): Corte `#D81B60` · Reconexión `#0097A7` · Notificación `#7E57C2` · Retiro `#8D6E63` · Revisión `#3949AB`; también llevan ícono propio.
- Logo: escudo monolínea con rayo (seguridad + electricidad); ícono maskable a 48 px legible.

## Stack
Preact + Vite (≈4 KB de framework, rápido en Android de gama baja) · Dexie · Leaflet + markercluster (tiles OSM) · pdf.js (carga diferida) · Chart.js · jsPDF · read/write-excel-file · vite-plugin-pwa.

## Modelo de datos (`orders`)
```
id, fecha(YYYY-MM-DD), estado: pendiente|hecha|no_ejecutada, tipo: corte|reconexion|notificacion|retiro|revision,
cuen, cuentaContrato, medidor, cliente, direccion, sector, mru, rural, secuencia, deuda, planillas, lecturaAnterior,
loc:{lat,lng,calidad: verificada|aprox|ninguna, precision}, asignadoA, notaLlegada, fotoLugar,
sync: pendiente|ok, cerrada,
ejecucion:{si, motivo, obs, campos:{lectura,tipoCorte,sello1,sello2,…}, fotos:[id], gps:{lat,lng,acc}, gpsBaja, distPunto, hora, durSeg, operario}
```
Otras tablas: `operarios`, `photos`(blob+meta), `locations`(medidor→punto verificado+nota), `positions`(última posición por operario), `history`(quién/qué/cuándo), `settings`.
Login simulado: OP-01/1234, OP-02/2345, OP-03/3456, SUP-01/0000.

## Supuestos (inventados en la demo — confirmar)
- Tipos de orden: corte, reconexión, notificación, retiro, revisión. Campos de los 4 tipos distintos a corte **inventados**.
- El PDF de ejemplo (`public/samples/ordenes-ejemplo.pdf`) es **ficticio**: una tabla con encabezados `CUEN, CTA CONTRATO, MEDIDOR, CLIENTE, DIRECCIÓN, SECTOR, MRU, RUR, SEC, ADEUDADO, PLAN, TIPO ORDEN, LAT, LNG`. El parser (`src/js/parsers/eea-pdf.js`) detecta columnas por alias y tiene un modo alterno "ETIQUETA: valor".
- Formato de exportación (CSV/Excel/PDF): una fila por orden, columnas en `src/js/exports.js`.
- Lecturas: "salto anormal" = aumento > max(2000, lectura anterior) kWh.
- Ruta aproximada = línea recta × 1.35 a 24 km/h (urbano) / 32 km/h (rural).
- Km recorridos = suma de distancias entre puntos de ejecución × 1.3.

## Pendientes a confirmar con el contratista
1. PDF real (columnas, páginas, si trae coordenadas/secuencia) y si hay Excel. 2. Campos exactos de cada tipo de orden. 3. Formato de exportación que exige la eléctrica. 4. ¿Escanean sellos (código de barras/QR)? Hoy el botón aparece solo si el navegador soporta `BarcodeDetector`. 5. Lista de motivos de no ejecución. 6. Reglas de lectura (máximos/saltos). 7. Quién cierra la jornada y plazos de corrección. 8. Políticas de fotos/video (cantidad, retención).

## Pruebas (`npm run test:*`, requieren `npm run build && npm run preview`)
`test:corte` (toques y tiempo) · `test:offline` (modo avión) · `test:gps` (brújula/llegada) · `test:supervisor` (importar PDF) · `test:viewports` · `test:pwa` · `node tests/e2e-ruta.mjs`.
