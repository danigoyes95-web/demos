# Valnu en su Fiesta — contexto del demo

## Negocio
Valnu en su Fiesta, Ambato (Ecuador). Importadores de artículos para fiestas y regalos, obsequios personalizados, cakes y bocaditos,
decoración y «expertos en globos». Instagram `@valnuensufiesta` (~8.200 seguidores, +22.000 publicaciones). WhatsApp **0987522450 — confirmar**.
Líneas: Decoración · Alquileres · Cakes y bocaditos · Regalos y obsequios · Tienda de temporada.
**Problema:** el cliente llega por Instagram, ve fotos sueltas y pregunta por UNA cosa. La landing le hace descubrir todo lo que puede sumar (armador + sugerencias «también llevaron») y cotizar en minutos.

## Dos pantallas conectadas (misma fuente de datos local)
1. **Landing `/`** (`index.html`): hero con globos que se revientan, mosaico de líneas, **Arma tu fiesta**, galería «Fiestas reales», regalos, temporada, cómo funciona, testimonios (ejemplos marcados), ubicación. Todo su contenido sale de `js/data.js`.
2. **Panel `/admin/`**: login simulado (cualquier clave), sin enlace desde la landing. Resultados, Cotizaciones (Kanban/lista, cotización formal imprimible), Calendario + stock de alquileres, Catálogo/sugerencias/ocasiones, Contenido de la landing, Configuración, «Reiniciar demo» y etiqueta «Modo demo».
**Conexión:** lo que se guarda en el panel se ve en la landing al recargar (mismo navegador); lo que se cotiza en la landing aparece en el panel.

## Modo demo (regla principal)
Sin backend, sin SDKs, sin `.env`, sin pagos ni correo. Solo `localStorage` + `data/seed.json`. Externos permitidos: enlaces `wa.me`, Google Fonts, iframe de Google Maps. Chart.js y canvas-confetti están **copiados en `js/vendor/`**.
**`js/data.js` es el único archivo que toca el almacenamiento**; todas sus funciones son `async`. Plan de conexión: `docs/PLAN-CONEXION.md`.

## Decisiones tomadas
- HTML/CSS/JS sin compilación; módulos ES (requiere servidor estático).
- Escena del armador en SVG propio con capas por elemento; colores por variables CSS (cambian en vivo); captura = SVG estático guardado con la cotización.
- Precios siempre como **rango** («desde $X – $Y»); los ítems por invitado escalan por cada N invitados.
- Alquileres: bloquean fecha solo las cotizaciones con **anticipo pagado** (o realizadas).
- Dirección visual y de movimiento: ver `DESIGN.md` (papel crema, filetes, easing por rol; criterios inspirados en HyperFrames).
- Fechas del seed son **relativas** a la fecha en que se carga/reinicia el demo. La temporada (Halloween/Finados) está configurada para estar activa al abrir el demo.
- Fotos: 15 recortes de capturas del Instagram como placeholders en `assets/fotos/`. Sustituir por las originales (`tools/actualizar-fotos.py` regenera el índice).

## Datos provisionales (confirmar con la dueña)
Rangos de precios por elemento (inventados, razonables) · WhatsApp 0987522450 · dirección exacta y horario · cobertura (Ambato + Latacunga, Riobamba, Baños, Pelileo, Píllaro) y traslado $10–$35 · anticipo **50 %** · validez de cotización 7 días · políticas de montaje/desmontaje/cancelación · stock de alquileres (algodón 1, canguil 1, snacks 2, cilindros 6, mesas 4, carpas 2) · pasos «reservas con anticipo» y «montamos y desmontamos» · testimonios reales.

## Pendientes
Fotos reales de tortas y bocaditos (carpetas vacías) · sustituir logo de 150 px por el original · GA4/Pixel/Clarity en la versión final · conectar Supabase · login real.
