# CONTEXTO — Demo "El Pretexto · Liquor Store" (Ambato, Ecuador)

## Negocio
- Licorería **El Pretexto Liquor Store**, **Ambato**. Moneda USD. Lema del logo: *"Cualquiera es bueno…"*.
- Objetivo: que el cliente pida licor y extras desde el celular con el mínimo de toques, con entrega o retiro. El pedido sale como mensaje de WhatsApp pre-armado.
- Usuario típico: con prisa, una mano, de noche. Cada toque extra es una venta perdida.

## Decisiones tomadas
- **La pantalla principal es el producto**: teclado de marcar 3×4, display con lo "marcado", botón circular de pedir. Sin hero ni scroll.
- **Sin build**: HTML/CSS/JS vanilla (módulos ES), sin dependencias, íconos SVG propios, fuentes del sistema. PWA con manifest + service worker.
- **Paleta del logo**: rojo `#D4141C` (rojo del logo, aclarado para fondos oscuros), negro `#0A0A0C`, hueso `#E2CFC8`. Cada categoría tiene un acento propio, tenue. Todo en variables CSS (`css/app.css`, `:root`).
- **Grilla sin scroll**: `--d = min((100vw−56px)/3, (100dvh−292px)/4)`, con mínimo de 72 px. En 375×667 los círculos miden ~94 px.
- **Cigarrillos**: el 12º círculo de la grilla es siempre **Snacks**. Los cigarrillos nunca van en la grilla: solo aparecen como agregado dentro del checkout (sin imágenes, sin destacar, sin combos, con "Prohibida la venta a menores de 18 años") y no se pueden pedir solos. Flag `venderCigarrillos` en `data/config.json` y en Panel → Configuración. (Se resolvió así la contradicción entre "círculo de cigarrillos" y "solo como agregado".)
- **Checkout en 2 pantallas** dentro de un panel: (1) resumen + entrega/retiro + sector + dirección/GPS + nombre/teléfono; (2) pago + enviar. Nombre, teléfono, dirección, sector y pago se recuerdan.
- **Upsell único por sesión**: al pedir licor fuerte sin mixers, "¿Le sumas hielo y cola? +$2.50".
- **Age gate** 18+ con respuesta guardada 24 h (también el "No"). Para pruebas: `?reset=1`.
- **Horario**: configurable por día, soporta cruce de medianoche (10:00–02:00). Fuera de horario la grilla se ve gris con "Abrimos a las HH:MM". Para pruebas: `?forzar=abierto` / `?forzar=cerrado`.
- **Ley seca / cerrado** con mensaje personalizable (Panel → Configuración).
- **Datos**: fase 1 = `data/*.json` + localStorage (claves `pz_*`). El panel y la tienda comparten esas claves y se avisan con BroadcastChannel. Sin Supabase por ahora (es demo); la capa de datos está concentrada en `js/state.js` para conectarla después.
- **Panel** `/admin/`: login simulado (Dueño ve Resultados, Pedidos, Productos, Configuración; Despachador ve Pedidos y Productos con edición solo de stock/agotado). Datos mock de 90 días con semilla fija.
- Sin logos de marcas de licor. Fotos: placeholders por categoría; para fotos reales ver `img/LEEME.md`.

## Pendientes legales (validar antes de publicar)
1. **Venta de cigarrillos**: confirmar con asesor legal la normativa vigente (venta a menores, advertencias sanitarias, exhibición y publicidad). La demo solo los ofrece como agregado y sin promoción.
2. **Horarios municipales de venta de alcohol en Ambato**: confirmar ordenanza vigente (horario máximo, días y restricciones). Los horarios del demo son de ejemplo.
3. **Ley seca** por procesos electorales o feriados: definir quién la activa y cómo se comunica.
4. **Verificación de edad**: el age gate es declarativo; la verificación real es la cédula en la entrega. Definir protocolo del repartidor.
5. **Datos personales**: nombre, teléfono y dirección se guardan en el navegador del cliente (demo). En fase 2 hace falta aviso de privacidad y base legal para guardarlos.
6. Permisos de funcionamiento y expendio de bebidas alcohólicas del local.

## Datos provisionales (todo es simulado)
- WhatsApp `593990000000`, tiempo de entrega ~30 min, retiro ~15 min, pedido mínimo $5.00.
- Horarios: lun–mié 10:00–23:00, jue–sáb 10:00–02:00, dom 10:00–22:00.
- Sectores y costos de envío de Ambato (Centro $1.00 … Pinllo $3.00).
- Catálogo y precios de ejemplo; datos bancarios y link de pago de ejemplo.
- Pedidos y ventas del panel: mock. Pedidos de prueba #0119–#0122; el primero real de la demo es #0123.
