# El Pretexto · demo de pedido en 3 toques

Demo funcional, mobile-first, sin build. Ver `CONTEXTO-CLAUDE.md` para decisiones y pendientes.

```bash
cd pretexto && python3 -m http.server 8000   # http://localhost:8000  (panel: /admin/)
```

Parámetros de prueba: `?reset=1` borra datos guardados · `?forzar=abierto|cerrado` simula horario.
Estructura: `index.html`, `css/`, `js/` (state, app, checkout, ui, icons), `data/`, `admin/`, `img/LEEME.md`.
