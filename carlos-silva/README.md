# Carlos Silva · Personal Trainer (demo)

Sistema para coach: panel (`panel.html`, clave demo `coach`), portal del cliente (`cliente.html`) y landing (`index.html`).
Modo demo: datos en localStorage del navegador, sin backend. Datos del coach: `config.js`.

- Rutina y plan alimenticio en PDF (impresión → "Guardar como PDF"), con referencia visual por ejercicio.
- Biblioteca de 22 ejercicios con figura animada, pasos, errores comunes y respiración (`ejercicios.js`); el coach puede agregar los suyos con enlace a video.
- InBody mensual con gráfico, evaluación técnica semanal, PAR-Q, suplementos, calculadoras (TMB, macros, 1RM).
- Enlace del cliente: el plan viaja dentro del link, abre en su celular sin servidor.

Pendiente para producción: base de datos + login (Supabase como en las otras demos), revisión de las figuras por el coach, y reemplazar la foto del flyer por una de alta resolución.
