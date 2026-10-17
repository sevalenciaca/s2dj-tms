# Versión C · Iteración 2 (derivada de la ronda R3, 17-oct-2026)

**Versión anterior:** etiqueta `c-v1` (commit 1043e33): es la versión que probaron U01 y U02 el 17-oct. Esta iteración **no cambia esa evidencia**; se registra como una iteración nueva.
**A no cambia:** `/final/` sigue idéntico a V1.

## Origen de cada cambio

| Cambio | Origen | Qué se observó |
|---|---|---|
| **Vista «Guías»** con estado, última actualización y acción; el menú resalta «Guías» solo ahí | HZ-04 (sev. 3) · NT-IA-E1-P4.1 y P1.2 | En A y en C, «Guías» abría Pedidos pendientes y no había forma de reencontrar una guía. |
| **Retomar una guía interrumpida; se conserva al recargar** (`localStorage`, solo datos ficticios) | HZ-05 (sev. 3) · U02: «cuando estoy llenando la información de la guía y paso a otro proceso se pierde la información» · U01: «falta historial» | Al recargar, el estado se perdía. |
| **Deshacer despacho desde «Guías»**, también después de pasar a la siguiente guía | S-06 · comentario de uno de los usuarios en C: «es muy importante para la operación, ya que somos humanos y cometemos errores» | En C, al pasar a la siguiente guía el despacho volvía a ser irreversible (CA-07). La condición de HZ-01 («mientras sigas en P5») sigue válida; esta iteración agrega otra vía. |
| **Título de cada pantalla de la guía** con paso y destino | U02: «cuando se llena la guía no tiene título, solo el número» (NT-U02-P1.1) | La guía solo mostraba el número. |
| **Conductor por transportadora** (3 transportadoras y 5 conductores ficticios) | **Comentario de U01 sobre la operación real**: a veces se elige el conductor equivocado. **No fue un error observado en C**: nadie eligió mal durante la sesión. | Con un solo conductor, el riesgo no se podía ver. Se agregaron dos «Andrés» de transportadoras distintas para hacerlo visible. |
| **Atajos E, M y D** (D solo abre la confirmación) | M-11 (aceptada por el equipo contra la recomendación de la IA) · NT-U02-P6.1: «solo hay un atajo, es la G» | Solo existía G. D no despacha: HZ-01 se mantiene. |

## Criterios de aceptación (`pruebas/iteracion2_aceptacion.js`)

| ID | Criterio |
|---|---|
| CI-01 | El conductor depende de la transportadora; al cambiarla hay que volver a elegir. |
| CI-02 | Cada pantalla de la guía tiene título con el número, el paso y el destino. |
| CI-03 | E, M y D activan los botones visibles; D abre la confirmación y la guía sigue En plataforma. |
| CI-04 | Recargar en En plataforma conserva la guía, el estado y lo escrito (HZ-05). |
| CI-05 | Una guía despachada se puede deshacer desde «Guías» después de pasar a la siguiente (S-06). |
| CI-06 | «Guías» lista las guías con su estado; el menú la marca; axe sin infracciones serias. |
| CI-07 | Dentro de una guía el menú no marca «Pedidos pendientes» ni «Guías». |
| CI-08 | La lista sobrevive a recargar y «Retomar» abre la guía en su estado. |
| CI-09 | Una guía interrumpida en «Pendiente» se puede retomar y vuelve al paso 2. |
| CI-10 | «Guías» a 390 px sin desplazamiento horizontal. |

## Resultados (17-oct-2026, sobre el código local antes de publicar)

- Iteración 2: **10 de 10** (`pruebas/resultado_2026-10-17_iteracion2.txt`).
- Aceptación de HZ-01 (regresión): **C 8 de 8**; A falla los 2 criterios que se pueden ejecutar y los otros 5 figuran como NO APLICA (S-09) (`resultado_2026-10-17_hz01.txt`).
- Recorrido solo con teclado + axe, 1440 y 390 px: todas las comprobaciones pasan (`resultado_2026-10-17_e2e.txt`).
- Reflujo a 320 y 390 px en 7 pantallas (incluida «Guías»): sin desplazamiento horizontal.
- Categorías de WAVE medidas con axe: 0 fallas.

## Qué no cubre (límites)

- **Ningún usuario real ha probado esta iteración todavía.** Las pruebas verifican la especificación. Que U01 y U02 repitan T1 y T2 sobre ella queda pendiente (ver `taller6`).
- Las guías se guardan solo en el navegador (`localStorage`): no hay servidor ni sincronización entre equipos. Las horas y la búsqueda siguen simuladas.
- «Ver siguiente guía» sigue llevando a Pedidos pendientes, porque desde ahí se crea la siguiente; la lista completa está en «Guías».
- El conductor por transportadora responde a un comentario, no a un error observado.
