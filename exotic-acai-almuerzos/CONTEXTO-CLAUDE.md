# CONTEXTO · Exotic Açaí — Suscripción de almuerzos (demo)

Para retomar el proyecto en otra sesión. Última actualización: 2026-11-05.

## Negocio
- **Exotic Açaí** (Ambato, Ecuador). Local: Azorín y Becquer (Cdla. España). Bowls de açaí + comida tropical saludable. Moneda USD, IVA 15 % (provisional).
- **Producto nuevo:** suscripción mensual de almuerzos saludables con entrega o retiro en local.
- La carpeta hermana `../acai-exotic/` es OTRA demo (pedidos de bowls). Esta es independiente; solo se reutilizaron logo y tres fotos de bowls.
- **Marca:** colores tomados del logo que pasó el cliente: morado açaí `#483469`, crema `#FBF3EE`, verdes de hoja `#477129` / `#82AB5F`. Tokens en `css/brand.css`. No usar rojo/naranja.

## Equipo y rol dentro de la app
| Persona | Cargo | Rol |
|---|---|---|
| Daniel | Tecnología y plataforma | Admin (ve todo) |
| Dueño de Exotic Açaí | Dirección | Admin (ve todo) |
| Nicolás | Chef | Cocina |
| Leo | **Nutricionista** (confirmado) | Menús |
| Cris | Redes y contenido | Contenido |
| Salo | Contabilidad y finanzas | Finanzas |

Permisos (`CFG.permisos` en `config/plans.js`): ✅ edita · 👁 solo lectura · 🔸 resumen. El Admin puede cambiarlos en la app (Equipo y permisos).

## Públicos y ángulo de venta
1. **Oficina:** ahorro de tiempo, entrega puntual, precio fijo.
2. **Gym:** gramos de proteína y kcal por plato, porción volumen o definición.
3. **Dieta especial:** keto, vegano/vegetariano, sin gluten, bajo en azúcar; menús diseñados por Leo.
- ⚠️ **Sin afirmaciones médicas** ("cura", "trata", "apto para diabéticos") salvo que el cliente lo confirme.

## Decisiones tomadas
- Stack: **HTML/CSS/JS sin compilación**, sin build ni dependencias; Chart.js 4.4.1 copiado en `js/chart.umd.min.js` (sin CDN). Funciona con `python3 -m http.server` o GitHub Pages.
- Rutas: `/index.html` (landing), `/suscribirse.html` (flujo), `/admin/#/<sección>` (hash-routing).
- **Datos fase 1:** `data/seed.js` (generado por `python3 tools/generar-datos.py`, semilla fija, 6 meses de historia) + `localStorage` con prefijo `ea_demo1_`. "Hoy" del demo está fijo en `2026-11-05` (`CFG.hoyDemo`).
- **Roles simulados:** selector de usuario en `/admin`; `EA.nivel(sección)` decide qué menú y qué permisos. Es solo demo, no es seguridad real.
- Todo lo creado en la demo (altas por el flujo, gastos, menús, permisos, entregas marcadas) vive en el navegador; "Restablecer" en Equipo y permisos lo borra.
- El menú semanal es único y se repite (lun–vie, 3 platos por día: Oficina/Fit/Especial). Lo que Leo edita en Admin › Menús se ve en la landing.
- Las ilustraciones de platos (`assets/img/plato-*.svg`) son **referenciales**; reemplazar por fotos reales de Cris (mismo nombre o subiéndolas desde Admin › Menús).
- No hay testimonios ni cifras de clientes inventados en la landing. Falta evidencia real (ver pendientes).
- Pago **simulado** y marcado como demo en todo el flujo.
- Facturación electrónica SRI: solo placeholder "próximamente".
- Supabase: `supabase/schema.sql` está escrito pero **NO se ha ejecutado ni conectado** (instrucción del usuario: es demo).

## Datos provisionales (confirmar con el cliente)
Todos viven en `config/plans.js`.
- Precios PVP con IVA: Oficina $85 (20) / $55 (12) · Fit $105 / $68 · Especial $110 / $72.
- Costo estimado por almuerzo (ingredientes + empaque): Oficina $2,20 · Fit $2,85 · Especial $3,05.
- IVA 15 % y que los precios mostrados lo incluyan.
- Zonas y extras mensuales: Centro, Ficoa, Atocha $0 · Huachi $5 · Izamba $8 · Miraflores $8 (tomadas de la demo de bowls). Ventanas 12:00–13:30.
- WhatsApp `593983139928` (de la demo anterior). Instagram `@exotic_acai`.
- Políticas escritas en el FAQ: pausar con 24 h de aviso, cancelar sin permanencia, sin entrega en feriados.
- Gastos fijos y sueldos del mock (`tools/generar-datos.py`): inventados para que el panel se vea vivo.
- Feriados: `CFG.feriados`.

## Pendientes
- Fotos reales de platos y del equipo (Cris).
- Testimonios y reseñas reales; número real de suscriptores para la prueba social.
- Confirmar precios, costos, zonas, IVA y políticas con el dueño y Salo.
- Dominio y despliegue; GA4 + Meta Pixel + Clarity (hoy el embudo es mock en localStorage).
- Fase 2: conectar Supabase (auth con roles, RLS, Edge Function de alta y pagos reales con pasarela).
- Facturación electrónica SRI.

## Cómo correr
```bash
cd exotic-acai-almuerzos && python3 -m http.server 8765
# http://localhost:8765/  ·  /suscribirse.html  ·  /admin/
```
Regenerar datos mock: `python3 tools/generar-datos.py`.

## Mapa de archivos
`config/plans.js` planes, públicos, zonas, equipo, permisos · `js/core.js` store, cálculos y UI común · `js/landing.js`, `js/flujo.js` · `js/admin/*.js` una vista por sección · `css/brand.css|landing.css|flujo.css|app.css` · `data/seed.*` · `supabase/schema.sql` (fase 2).
