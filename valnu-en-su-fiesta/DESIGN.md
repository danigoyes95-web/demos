# Valnu en su Fiesta — Sistema de diseño

Fuente única de la dirección visual y de movimiento. Los tokens viven en `css/tokens.css`; si cambia algo aquí, cambia allí.
El enfoque («papel impreso», easing por rol, sin brillos ni bucles genéricos) se apoya en las guías de *look* y *motion* de
[HyperFrames](https://github.com/heygen-com/hyperframes) (Apache-2.0): se tomaron criterios de oficio, **no se copió código**.

## Intención
Festivo y alegre, pero de catálogo editorial: papel crema, tinta ciruela, filetes finos y color plano de marca.
Debe sentirse hecho a mano por un estudio, no como una plantilla de cotillón ni como un degradado con brillos.

## Color (valores exactos)
| Rol | Token | Hex |
|---|---|---|
| Papel (fondo) | `--paper` | `#FBF5EC` |
| Tinta | `--ink` | `#2E1B36` |
| Rosado (acento principal) | `--pink-d` / `--pink` | `#C2467A` / `#F06FA6` |
| Turquesa/menta | `--mint-d` / `--mint` | `#2A9488` / `#7FD1C7` |
| Lila | `--lilac-d` / `--lilac` | `#7152B8` / `#B59BE0` |
| Sol (detalles) | `--sun` | `#F4C95D` |
| Filete | `--hair` | `rgba(46,27,54,.13)` |

Una sola palabra por titular va en `--pink-d` y debe aportar significado. Colores de ocasión y de globos: ver *Ocasiones* en el panel.

## Tipografía
- Display: **Fredoka** 500–600, interlineado 1.02–1.1, tracking −0.02/−0.03em (redondeada, la voz de la marca).
- Texto: **DM Sans** 400/500/700. En el panel, prioridad a la legibilidad.
- Etiquetas de sección: DM Sans 700 en mayúsculas, tracking .16em, numeradas `01 — …` con filete.
- Cifras con `font-variant-numeric: tabular-nums`.

## Superficies
- Tarjetas planas sobre papel con **filete de 1 px** (`--shadow-sm`), no sombras suaves. Radios 10–16 px; píldoras solo donde hay una razón.
- Botón primario plano (`--pink-d`; en el panel, tinta). Sin degradados, sin resplandor.
- Planos de color duros (círculo turquesa del hero, esquina naranja de temporada) + grano impreso estático en el hero.
- Los globos del hero y la escena SVG comparten gramática: color plano + reflejo en media luna + contorno fino.

## Movimiento
| Rol | Token | Uso |
|---|---|---|
| Llegada | `--ease-arrive` (expo.out) | entradas, estantes, escena; cola larga |
| Movimiento | `--ease-move` (inOut) | acordeón de líneas, cambios de color |
| Salida | `--ease-exit` (power3.in) | quitar elementos, barra flotante; **~45 % más corta** que la entrada |
| Resorte | `--spring` (≈0,8 de amortiguación) | posición y tamaño; **nunca** opacidad ni color |

Reglas: titulares entran **por palabra con blur** (8 px → 0, 70 ms entre palabras, sin desplazamiento); el resto con *blur-swap* escalonado
(40–80 ms); las fotos con revelado por recorte (`clip-path`). Un titular que ya aterrizó queda **quieto**. El carrito que entra rodando lleva
desenfoque de movimiento que se aclara al llegar. `prefers-reduced-motion` lo desactiva todo.

## No hacer
Bucles que «respiran» o pulsan (botón de WhatsApp, pistas), todo entrando con *fade + slide-up*, degradados radiales difusos como fondo,
resplandores en botones, emojis como íconos del panel, cuatro curvas iguales (`ease-out .5s`) en todas partes, rebotes en la UI.
