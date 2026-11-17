# Safelock — Plan de producción (1 página)

La demo corre 100 % en el navegador (IndexedDB). Toda lectura/escritura pasa por `src/js/data.js`; llevarla a producción es **reemplazar el cuerpo de esas funciones** por llamadas al backend, sin tocar la UI.

| Área | Decisión propuesta |
|---|---|
| **Backend** | Supabase (Postgres + PostGIS). Tablas: `operarios`, `ordenes`, `ejecuciones`, `ubicaciones` (medidor → lat/lng/precisión/nota), `fotos`, `historial`, `config`. PostGIS para el aviso "registrada > 100 m del punto" y para la asignación por área. |
| **Sincronización multi-dispositivo** | La cola offline ya existe (`sync:'pendiente'` en IndexedDB). Producción: `POST` idempotente por `id` de orden/foto; el servidor es la fuente de verdad, resolución por última edición con historial. Supabase Realtime alimenta el monitoreo en vivo (reemplaza el sondeo de 5 s). Reintentos con *backoff* y Background Sync donde exista. |
| **Autenticación** | Supabase Auth: operarios con código + PIN (mapeados a email sintético) y supervisores con email + 2FA. Roles y RLS (un operario solo ve sus órdenes). Sesión corta con renovación; bloqueo por PIN fallido. |
| **Fotos y video** | Subida directa a Supabase Storage (bucket privado) con URL firmada de corta duración; la foto ya sale comprimida (~300 KB) con marca de agua. Hash SHA-256 guardado junto a la ejecución para probar que no se alteró. Política de retención (p. ej. 24 meses) y borrado. |
| **Datos personales de clientes** | Marco: LOPDP (Ecuador). Cifrado en tránsito y en reposo, mínimos datos en el celular, borrado local al cerrar jornada, RLS, bitácora de accesos, contrato de encargado de tratamiento con la eléctrica. Nada de datos reales en entornos de prueba. |
| **Integración con la eléctrica** | Fase 1: exportación CSV/Excel/PDF en el formato exacto que pida (hoy supuesto, ver `src/js/exports.js`). Fase 2: API/SFTP automatizado con reintentos y acuse de recibo; estados "enviado / confirmado / rechazado". |
| **Mapas** | OSM público no admite descargas masivas: usar un proveedor de tiles contratado (MapTiler/Stadia/Mapbox) o servidor propio. Mantener precarga de la zona de la jornada. |
| **Operación** | Vercel/Netlify para el front; Sentry para errores de campo; métricas de uso (tiempo por orden, % ubicaciones verificadas); pruebas en 3 gamas de Android reales; MDM opcional. |

**Ruta sugerida:** (1) piloto con 1 cuadrilla y exportación manual · (2) backend + auth + fotos · (3) integración automática con la eléctrica · (4) optimización de rutas con tiempos reales de viaje.
