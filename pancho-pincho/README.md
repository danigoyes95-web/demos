# Pancho Pincho · Pinchos con sabor popular (demo)

Tres paneles conectados entre sí, sin backend (datos en localStorage del navegador; abrir en pestañas distintas del mismo navegador para ver la sincronización en vivo):

- `index.html` — **Vitrina**: web pública con estética retro-cartoon, menú, carrito y seguimiento del pedido en vivo.
- `recepcion.html` — **Recepción**: tablero de pedidos (Nuevos → En parrilla → Listos → Entregados), cobro, pedidos de mostrador, productos agotados, abrir/cerrar local. Suena un aviso cuando entra un pedido desde otra pestaña.
- `dueno.html` — **Dueño** (PIN demo `1234`): ventas, pedidos, ticket promedio, ventas 7 días, pedidos por hora, más vendidos, origen de pedidos, edición de menú/precios, promo y horario.

Datos del local y menú inicial: `config.js`. Datos de ejemplo se generan solos (botón "Reiniciar datos de ejemplo" en el panel del dueño).

Pendiente para producción: base de datos + login real (Supabase como en otras demos), fotos reales del local/comida, y pasarela de pago si se desea.
