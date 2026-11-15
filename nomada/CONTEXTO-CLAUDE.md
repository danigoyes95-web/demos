# CONTEXTO — Demo "Experiencia Nómada · Pasaporte de fidelización"

## Negocio
- **Nómada / Experiencia Nómada** — restaurante de alta cocina en Ambato, Ecuador. Instagram `@nomada.amb` (6 181 seguidores). Dirección: San Antonio (Huayna Capac y Cañaris). Horario: miércoles a domingo, 18h00–23h00. Reservas por WhatsApp.
- Propuesta: cocina de autor contemporánea con raíces andinas, emplatado fino, coctelería de autor, cervezas importadas y artesanales, eventos con cupos limitados (catas, maridajes, colaboraciones, cenas temáticas).
- Problema: el menú se envía por PDF en WhatsApp (fricción) y no hay datos del cliente.
- **Objetivo #1: fidelización** (quién es, cada cuánto viene, cuánto gasta, qué le gusta). Secundarios: menú digital con temporada, difusión de eventos, minijuego que capta registros.

## Modo demo (regla principal)
Es un **demo de venta**; el cliente aún no compra. Sin backend, sin claves, sin `.env`, sin SMS/email/pagos/API de WhatsApp. Todo corre en el navegador: `data/seed.json` + `localStorage`. Lo único externo: enlaces `wa.me`, Google Fonts (CSS/woff2) y librerías **copiadas localmente** en `js/vendor/`. Verificado: la única red es `localhost` + Google Fonts, 0 peticiones POST.
Como todo vive en el mismo navegador, tarjeta y panel solo se sincronizan **en el mismo dispositivo** (y entre pestañas, vía evento `storage`). Presentación sugerida: el dueño crea su pasaporte desde su celular y luego abre `/admin` en ese mismo celular; se ve a sí mismo como cliente.

## Las dos pantallas
**1. Público** — `/` landing (hero con luz que se revela al scroll, temporada, eventos con barra de cupos, pasaporte, minijuego, equipo, ubicación, botón flotante de WhatsApp) · `/menu/` menú digital (pestañas, etiquetas, alérgenos, "Marida con…", "Agotado hoy", banner del pasaporte) · `/pasaporte/` registro + tarjeta con sellos animados, QR, premios, historial, botón "Simular sello del mesero (demo)" (PIN 1234), PWA.
**2. Panel** — `/admin/` (sin enlace visible desde la landing). Login simulado: **Mesero PIN 1234** (solo Visitas + Canjear) · **Dueño PIN 2468** (todo). Secciones: Resultados, Visitas (escáner QR con cámara + búsqueda por teléfono/nombre/código), Clientes (CRM, segmentos, plantillas WhatsApp, CSV, ficha), Menú (CRUD + QR de mesa PNG), Eventos (asistentes → suman sello), Pasaporte y juego, Ajustes (+ "Reiniciar demo").

## Estructura
```
index.html  menu/  pasaporte/  admin/        ← una carpeta por ruta (funciona en GitHub Pages)
css/  tokens.css (variables compartidas) base.css landing.css menu.css pasaporte.css admin.css
js/   data.js (ÚNICO acceso a datos) util.js sellos.js icons.js qr.js landing.js menu.js pasaporte.js juego.js
      admin/ app.js shared.js v-resultados v-visita v-clientes v-menu v-eventos v-pasaporte v-config
      vendor/ qrcode · jsQR · chart.js · canvas-confetti (locales)
data/seed.json  ← generado por tools/generar-seed.mjs (determinista)
assets/ fotos/ (platos, cocteles, cervezas, eventos, equipo, ambiente) · logo/
docs/PLAN-CONEXION.md · manifest.webmanifest · sw.js · icons/
```
`data.js`: getConfig/saveConfig · getMenu/saveDish/deleteDish · getEvents/saveEvent/deleteEvent/addReservation/removeReservation/markAttendance · registerMember/getMember/getMembers/findMember/updateMember/addNote/getCurrentMember · addVisit/getRewards/redeemReward · getSegments/exportSegmentCSV · getStats/rangeOf · trackEvent/getGameScores/saveGameScore/device · login/getSession/logout/verifyStaffPin · resetDemo/onChange.

## Decisiones tomadas
- Sin build: HTML + CSS + ES modules. Las skills sugieren Astro/Tailwind, pero se priorizó la regla "sin compilación" del encargo.
- Fechas del seed **relativas a hoy** (día `k` desde el lunes de la semana actual): la demo siempre se ve "viva" (cumpleaños esta semana, eventos próximos). Si se abre semanas después, usar *Reiniciar demo*.
- Sello = visita (1 visita = 1 sello). Sello de regalo del juego cuenta como sello pero **no** como visita en métricas. Los premios por hito se emiten una vez por cuenta (3, 5 y 10 sellos). Cumpleaños: ±3 días, una vez al año.
- Niveles por sellos: Viajero 0–4, Explorador 5–9, Nómada 10+.
- Premio del juego: 1 por dispositivo, solo se activa creando el pasaporte. Si ya hay pasaporte en el dispositivo, no hay premio. Con premio de bebida: aviso +18 y alternativa sin alcohol.
- Segmentos: VIP = top 10 % de gasto; En riesgo = >45 días y 2+ visitas; Nuevos = 1 visita; Cumpleañeros = próximos 7 días. Mensajes solo a quienes aceptaron novedades.
- Mapa: tarjeta estilizada con enlace a Google Maps (un iframe sería una llamada de red externa).
- Frase de marca (3 opciones, editable en Ajustes): "Cada plato, un destino." (por defecto) · "Raíces andinas, sabores del mundo." · "Viaja sin salir de la mesa."
- Fotos de prueba recortadas de capturas de @nomada.amb (baja resolución). El logo real es un JPG de 150 px; el wordmark en pantalla se dibuja con tipografía (Big Shoulders Display) + mini-íconos.

## Datos provisionales (confirmar con el dueño)
WhatsApp `593990000000` (de prueba) · premios y sellos requeridos (3/5/10) · niveles · beneficio de cumpleaños · todo el menú y los precios (inventados con criterio) · alérgenos · maridajes · eventos y colaboradores (ficticios, marcados "demo") · nombres del equipo · PIN (1234 / 2468) · el acento cobre `#c8873e` · textos de filosofía · teléfonos y nombres de los 180 miembros (ficticios; teléfonos `0990 00x xxx`).

## Pendientes
- Fotos reales (platos, cervezas, eventos, equipo) y logo vectorial.
- Confirmar dominio y hosting; analítica (GA4 + Meta Pixel + Clarity) no incluida en la demo a propósito.
- Versión final: ver `docs/PLAN-CONEXION.md`.
