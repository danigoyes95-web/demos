# Plan de conexión (demo → producción) — Don Snack

**Hoy:** todo vive en el navegador (`data/seed.json` + localStorage). **Mañana:** se reemplaza solo `js/data.js` (misma firma, ya es async) y se borra `js/mock.js`. Backend sugerido: Supabase (Postgres + Auth + Realtime + Edge Functions).

**Tablas:** `products` (+`categories`), `combos`/`combo_items`, `campaigns` (cats, product_ids, skin, fechas, descuento), `settings` (1 fila JSON: horario, zonas, pagos, niveles), `zones`, `customers` (code único, consentimientos, cumpleaños), `orders`/`order_items` (estado, pago, regalo, dirección, camp_id, source), `events` (embudo), `votes` (Fans fav.), `push_subscriptions`, `staff` (rol dueño/despachador).

**Funciones de data.js que cambian:** `load/tx/persist` → cliente Supabase; `getProducts/getCombos/getCampaigns/getSettings` → `select`; `createOrder` → RPC `create_order` (calcula precios y nivel en el servidor, nunca en el cliente); `updateOrderStatus`; `getCustomerByCode`/`createMember` (genera el código en servidor); `getStats` → vistas SQL/materializadas; `trackEvent` → insert; `recommendWine` → igual (o RPC); `resetDemo` desaparece. Login simulado → Supabase Auth + RLS (cliente solo ve lo suyo; panel por rol).

**Pedidos en tiempo real entre dispositivos:** hoy `storage`/BroadcastChannel (solo mismo navegador). Producción: Supabase Realtime sobre `orders` (panel suscrito a INSERT/UPDATE; la app del cliente a su pedido). Fallback offline: cola local y reintento al volver `online`.

**Notificaciones push (Web Push + service worker):** (1) “¿Otra ronda?” a quien pidió hoy, jueves a viernes en la noche, vía Edge Function con cron; (2) campañas por segmento (solo `consent_promo = true`); (3) cambios de estado del pedido. Sustituye los enlaces wa.me manuales; WhatsApp Business API es opcional y de pago.

**Payphone real:** Edge Function que crea el link/botón de cobro (`/api/button/Prepare`), guarda `payment_id`, y un webhook que confirma y pasa el pedido a “Nuevo”. La pantalla “link enviado” se vuelve estado real del cobro. Requiere credenciales del negocio (token y storeId), nunca en el cliente.

**Otros:** subir fotos a Storage; QR apuntando a dominio propio (`/club/:codigo` con rewrite); impresión térmica directa (QZ Tray/ESC-POS) si se quiere sin diálogo del navegador; auditoría de verificación de edad en entrega.
