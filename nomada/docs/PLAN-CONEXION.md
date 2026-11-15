# Plan de conexión (versión final) — Experiencia Nómada

Hoy todo vive en `localStorage` detrás de **un solo archivo: `js/data.js`**. Para conectar el backend solo se reemplaza ese archivo; las firmas `async` no cambian y ninguna pantalla toca el almacenamiento.

## Tablas necesarias
| Tabla | Campos clave |
|---|---|
| `config` | fila única JSON: restaurante, textos, niveles, premios, cumple, juego, plantillas |
| `members` | id (NOM-0001), nombre, telefono (único), cumple_dia, cumple_mes, bebida, fav_plato, alergias[], origen, consent_datos, consent_novedades, tags[], alta |
| `member_notes` | member_id, texto, autor, ts |
| `visits` | member_id, ts, monto, personas, staff_id, event_id?, regalo |
| `rewards` | member_id, tipo (hito/cumple/juego), premio_id, nombre, codigo (único), estado, ganado_ts, canjeado_ts, canjeado_por |
| `menu_items` | id, categoria, nombre, precio, precio_botella, descripcion, ingredientes[], foto_url, etiquetas[], alergenos[], agotado, temporada_hasta, orden |
| `pairings` | item_a, item_b (simétrica) |
| `events` / `event_reservations` | datos del evento, preventa_hasta / event_id, member_id, asistio |
| `game_scores` / `tracking` | nombre_pila, segundos, ts / evento, ts, props |
| `staff` | auth user, rol (dueno/mesero), nombre |

## Qué funciones de `data.js` cambian
- **Lectura/escritura simple** (`getConfig/saveConfig`, `getMenu/saveDish/deleteDish`, `getEvents/saveEvent/addReservation/markAttendance`, `getMembers/getMember/findMember/updateMember/addNote`, `getGameScores/saveGameScore`, `trackEvent`): pasan a consultas del SDK.
- **Lógica que se mueve al servidor** (para que no se pueda hacer trampa): `addVisit` (RPC que inserta la visita y emite premios), `redeemReward` (RPC atómica, evita doble canje), `registerMember` (valida teléfono único y premio del juego).
- **Cálculos** (`getSegments`, `getStats`): vistas SQL o RPC en lugar de calcular en el navegador.
- `login/getSession/logout/verifyStaffPin`: pasan a **autenticación real** (el PIN actual es solo demo).
- `getCurrentMember`: sesión del cliente por teléfono + código por WhatsApp (OTP) en lugar de `localStorage`.
- `materialize()/resetDemo()` y `data/seed.json` se eliminan (o quedan para un entorno de pruebas).

## Qué se activa al conectar
1. **Login real del personal**, con roles y registro de quién selló cada visita.
2. **Sincronización entre dispositivos**: la tarjeta del cliente se actualiza al instante cuando el mesero sella (realtime).
3. **Apple / Google Wallet**: el pasaporte como tarjeta con QR y actualización de sellos.
4. **Recordatorios automáticos por WhatsApp** (API oficial): "te extrañamos", cumpleaños, preventas; solo a quienes aceptaron novedades.
5. **Anti-fraude** del juego (un premio por teléfono, no por dispositivo) y respaldo de datos con cumplimiento de la ley de protección de datos personales (Ecuador).
6. **Fotos** en almacenamiento propio (hoy rutas locales o base64).
