# CONTEXTO — Demo "Don Snack — Pide en 2 toques + Club Don Snack"

## Negocio
Don Snack Ambato, "Wine, Beer & Spirits": licores y snacks con servicio personalizado. Av. Los Guaytambos y Pomelos, Ambato. IG @donsnackambato. WhatsApp, horario real, zonas y costos: **pendientes** (placeholders marcados en `seed.json`). Medios de pago: efectivo, transferencia, Payphone (simulado).

## Dos tipos de cliente
1. **La previa** (noche, prisa, grupo, posiblemente ya bebió): velocidad extrema, combos, “lo de siempre”, “otra ronda”.
2. **La cava / el regalo** (cena, regalo, fechas): asesoría rápida en 3 preguntas, vinos/espumantes/premium, empaque y tarjeta.

## Principios UX “a prueba de mareados”
≤3 toques nuevo / ≤2 repetido · cero escritura · botones ≥64 px, texto ≥18 px, precios ≥28 px · Deshacer 5 s en cada acción · carrito siempre visible · “Desliza para pedir” (con resistencia, solo se activa al ~88 %) y pegajoso abajo · anti-duplicado 15 min · lenguaje simple · modo oscuro · vibración y animación <200 ms (respeta `prefers-reduced-motion`).

## Club
QR único por miembro → `#/club/CODIGO` (la app abre reconocida). Niveles por gasto de los últimos 30 días: Socio, VIP (≥$60: envío y hielo gratis, prioridad), Leyenda (≥$150: precio especial premium −5 %, regalo cumpleaños, catas, línea directa). Umbrales y beneficios editables. Imán de refri / sticker / tarjeta generados desde el panel (PNG o imprimir a PDF). “Fans fav.”: votación mensual. Consentimiento de datos obligatorio y promos WhatsApp en checkbox separado sin marcar.

## Marca y mascota
Dorado `#B8894A` (texto sobre oscuro `#D2A464`), negro `#121110`, superficie `#1E1C1A`, crema `#F4EEE4`. Piel pop (amarillo/rosado/cian) solo en la puerta Previa y campañas pop; piel Cava (negro/dorado/vino `#6E1E2B`). Títulos serif slab (Rozha One), display condensada (Bebas Neue) en pop, Inter en el resto. Mascota “Don” (corcho con sombrero y bigote) en SVG (`js/mascot.js`): saluda, celebra, duerme, triste, en moto; amigo limón `Mascot.lime()`. **Es un placeholder**: reemplazar por los archivos originales.

## Modo demo (regla principal)
Sin backend ni servicios externos. Todo pasa por `js/data.js` (async). Datos: `data/seed.json` (catálogo, ajustes, 250 clientes ficticios) + `js/mock.js` (3 meses de pedidos generados al reiniciar). Permitido: wa.me, Google Fonts, tiles OSM. Librerías (QR, Leaflet, confetti, Chart.js) **vendorizadas** en `/vendor` para funcionar sin internet. Panel y app comparten datos solo en el mismo navegador/origen. “Reiniciar” en el panel (Dueño). Login simulado: Dueño `1111`, Despachador `2222`. `/admin/` no tiene enlace desde la app.

## Decisiones
HTML/CSS/JS sin compilación (carga <2 s, se despliega en cualquier hosting estático). Rutas con hash (`#/club/CODIGO`) para funcionar en GitHub Pages sin reglas de servidor. Precios y niveles se calculan en `Data.quote` (en producción, en el servidor). Cigarrillos tras el flag `venderCigarrillos`: sin foto, sin combos ni promos, con leyenda legal. “Lo de siempre” = pedido más repetido del cliente. Modo demo “ignorar horario” disponible porque la demo se presenta a cualquier hora.

## Pendientes
Datos reales (ver README), logo y mascota originales, fotos reales (`/assets/productos/ID.jpg`, luego `node tools/build-seed.js`), conexión real (docs/PLAN-CONEXION.md), prueba con celulares reales y brillo bajo.
