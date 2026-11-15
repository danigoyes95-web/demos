# Experiencia Nómada · Pasaporte de fidelización (DEMO)

Demo funcional y sin backend: landing + menú digital + minijuego + Pasaporte Nómada + panel del restaurante.
Todo corre en el navegador (`data/seed.json` + `localStorage`). Más contexto en [`CONTEXTO-CLAUDE.md`](CONTEXTO-CLAUDE.md).

## Correrlo
```bash
cd nomada
python3 -m http.server 8080   # o: npx serve
```
Abre `http://localhost:8080/`. Para probarlo en el celular, usa la IP de tu computadora en la misma red (`http://192.168.x.x:8080`).

| Ruta | Qué es |
|---|---|
| `/` | Landing |
| `/menu/` | Menú digital (el QR de mesa apunta aquí) |
| `/pasaporte/` | Pasaporte del cliente (PWA) |
| `/admin/` | Panel · Mesero `1234` · Dueño `2468` |

## Desplegarlo gratis
- **GitHub Pages**: Settings → Pages → rama y carpeta `/nomada` (o copia el contenido a la raíz de un repo). Las rutas son carpetas con `index.html`, así que funcionan tal cual.
- **Netlify / Vercel**: arrastra la carpeta `nomada/` o apunta el directorio de publicación a `nomada` (sin comando de build).
- Se necesita HTTPS para la cámara (escáner QR) y para instalar la PWA; los tres servicios lo dan por defecto.

## Guion para presentarlo al dueño (en su celular)
1. Abre `/`, juega **Maridaje Nómada** (hay 60 s) y gana → "Activar mi premio".
2. Crea tu pasaporte (verás tu primer sello de regalo estamparse).
3. En el mismo celular abre `/admin/` → **Mesero** (1234) → busca tu teléfono → ingresa un monto → **Sellar visita**.
4. Vuelve a `/pasaporte/`: tu sello nuevo. Repite hasta 3 sellos → premio con código → canjéalo en *Visitas → Canjear premio*.
5. Entra como **Dueño** (2468): Resultados, Clientes (te ves a ti mismo), segmentos y plantillas de WhatsApp, Menú y QR de mesa, Eventos y Ajustes.
- *Reiniciar demo* (Ajustes o barra superior) restaura todo. Para regenerar los datos de ejemplo: `node tools/generar-seed.mjs`.
