# Safelock — Mini manual (versión demo)

Demo: todos los datos son ficticios y se guardan solo en el navegador de cada dispositivo. Nada se envía a la empresa eléctrica.

**Entrar:** abre el link → botones de acceso rápido **Operario (Carlos)** o **Supervisor**.
Cuentas: OP-01/1234 · OP-02/2345 · OP-03/3456 · SUP-01/0000.
**Instalar:** Android (Chrome): ⋮ → *Instalar aplicación*. iPhone (Safari): Compartir → *Agregar a inicio*. La app muestra estos pasos la primera vez.

---

## 1. Operario (celular)

### Mi jornada
- Arriba: saludo, fecha y estado de conexión (**En línea** / **Sin señal** + cuántos registros faltan por enviar).
- Resumen: **Pendientes · Hechas · No ejecutadas** con barra de avance del día.
- **IR A LA SIGUIENTE:** te lleva a la orden que sigue en la ruta del día.
- **Ruta del día:** muestra paradas, kilómetros aproximados y cuánto ahorra frente al orden del PDF. **Reordenar** la recalcula desde donde estás (la ruta no cambia sola mientras caminas).
- **Buscador:** por CUEN, medidor, cliente o dirección.
- **Chips** para filtrar por tipo: Cortes, Reconexiones, Notificaciones, Retiros, Revisiones.
- **Lista / Mapa:** alterna entre tarjetas y mapa. Cada tarjeta muestra tipo (color + ícono), cliente, dirección, medidor, distancia, estado y calidad de ubicación.
- **Cierre de jornada** (botón fijo abajo).

### Mapa y cómo llegar
1. Toca una orden o un pin. Los pines cercanos se agrupan en números; haz zoom para separarlos. Los números en los pines son el orden de la ruta.
2. En la hoja inferior verás cliente, dirección, distancia y minutos aproximados.
3. **NAVEGAR:** abre Google Maps o Waze con giro a giro (eliges la app una sola vez; se cambia en *Más datos*).
4. **BRÚJULA** (últimos metros): flecha grande hacia el medidor, metros en vivo, vibra al entrar a 30 m. Sin sensor de brújula, muestra el rumbo en texto ("85 m al noreste").
5. **Foto del lugar:** fachada o medidor de una visita anterior, si existe.
6. **Cómo llegar:** notas de operarios anteriores.
7. **Calidad de ubicación:** 🟢 Verificada (GPS tomado en sitio) · 🟡 Aproximada (del PDF) · 🔴 Sin ubicación (usa dirección y notas, o **Ubicar en mapa**).
8. **Corregir ubicación:** arrastra el pin o usa "Usar mi GPS" y guarda. La próxima orden de ese medidor ya usa el punto correcto.
9. La pantalla se mantiene encendida mientras navegas.

### Registrar una orden (una sola pantalla)
1. Al llegar, toca **LLEGUÉ · REGISTRAR** (la app lo sugiere sola a 30 m).
2. Arriba ves tipo, cliente, medidor, CUEN y deuda. **+ datos** muestra el resto.
3. **¿Se pudo ejecutar?**
   - **NO:** elige el motivo, toma una foto (obligatoria) y guarda.
   - **SÍ:** completa los campos del tipo de orden. Ejemplo de **Corte**: lectura (teclado numérico; avisa si es menor a la anterior o hay un salto raro), **EN MEDIDOR / EN POSTE**, sello 1 y sello 2 (máx. 20 caracteres), fotos y observaciones (frases rápidas, texto o dictado por voz), y una nota para el próximo operario.
4. **Fotos:** *TOMAR FOTO* abre la cámara; puedes tomar varias y un video corto. Cada foto queda con fecha, hora, GPS, precisión, CUEN y operario.
5. **GPS:** se captura solo. Si la precisión es mala (> 50 m) lo avisa y puedes esperar unos segundos.
6. **GUARDAR Y SIGUIENTE:** guarda al instante (aunque no haya señal), vibra y te lleva a la siguiente orden.
7. **Corregir un registro:** toca la orden ya hecha → *Corregir registro*. Se puede hasta que el supervisor cierre la jornada.

### Sin señal
Todo funciona sin internet. Los registros quedan en el celular y se envían solos al volver la red. Menú ☰ → **Descargar mapa de hoy** (con Wi-Fi) guarda el mapa de la zona para verlo sin señal.

### Cierre de jornada
Muestra ejecutadas, no ejecutadas por motivo, pendientes y kilómetros recorridos. **ENVIAR TODO** manda los registros pendientes (en la demo es simulado).

### Menú ☰
Tema (Claro para el sol / Oscuro / Automático) · Descargar mapa de hoy · Instalar en tu celular · Herramientas de demostración (GPS simulado, modo avión simulado) · Cerrar sesión.

---

## 2. Supervisor (celular, tablet o PC)

| Sección | Para qué sirve |
|---|---|
| **Monitoreo** | Mapa con el estado de todas las órdenes y la última posición de cada operario. Alertas: operario sin actividad > 45 min, orden registrada a > 100 m del punto, ejecutada sin fotos. Línea de tiempo del día. Se actualiza cada 5 s. |
| **Órdenes** | Tabla con filtros (fechas, tipo, estado, operario, sector, búsqueda). Al abrir una orden: datos, lectura y sellos, galería de fotos, mapa del punto de ejecución e historial de cambios (quién, qué, cuándo). |
| **Cargar PDF** | Arrastra el PDF de la eléctrica (también Excel o CSV). Se lee en el navegador. Muestra "N órdenes · X correctas · Y con problemas", resalta errores (medidor faltante, CUEN duplicado, coordenadas inválidas) y los corriges en la tabla. Detecta las ya cargadas y asigna ubicaciones verificadas conocidas. Botón **Usar PDF de ejemplo** para probar. Luego **IMPORTAR**. |
| **Asignar** | Por sector-ruta, **dibujando un área** en el mapa (toca dos esquinas) o a mano con casillas. **Balanceo sugerido** reparte por cantidad y cercanía; revisas la propuesta y la aplicas. |
| **Reportes** | Órdenes por día, % de efectividad, motivos de no ejecución, tiempo promedio, productividad por operario y % de ubicaciones verificadas. Exporta **CSV**, **Excel** y **Reporte PDF diario con evidencias** (respaldo ante reclamos). |
| **Configuración** | Operarios (nombre, código, PIN, cuadrilla), parámetros (radio de llegada 30 m, umbral de precisión GPS, distancia sospechosa, inactividad), motivos de no ejecución, tipos de orden y sus campos (JSON editable) y la opción de respetar la secuencia del PDF. |

**Barra lateral:** *Cerrar jornada de hoy* (los operarios ya no pueden editar) · **Reiniciar demo** (borra los cambios y vuelve a los datos de ejemplo) · Tema · Salir.

---

## 3. Guion sugerido para mostrar la demo (5 min)
1. **Supervisor → Cargar PDF** → *Usar PDF de ejemplo* → mostrar los 3 errores y corregirlos → Importar.
2. **Asignar** → *Balanceo sugerido* → Aplicar.
3. **Monitoreo** → alertas y posición de operarios.
4. **Operario:** Jornada → *IR A LA SIGUIENTE* → mapa → Brújula → *LLEGUÉ* → registrar un corte → *GUARDAR Y SIGUIENTE*.
5. Menú ☰ → *Simular modo avión* → guardar otra orden → quitar el modo avión y ver cómo se envía sola.
6. **Supervisor → Órdenes** → abrir la orden con foto y GPS → **Reportes → PDF con evidencias**.
7. Al terminar: **Reiniciar demo**.

## 4. Cosas que son simuladas en la demo
Envío a la empresa (simulado) · usuarios y PIN (de ejemplo) · datos y fotos de ejemplo · kilómetros y tiempos aproximados (línea recta × 1,3) · formato de exportación supuesto. Detalles en `CONTEXTO-CLAUDE.md`.
