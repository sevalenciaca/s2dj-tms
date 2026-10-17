# Versión C · Iteración 3: panel de accesibilidad (17-oct-2026)

**Versión anterior:** etiqueta `c-v2` (iteración 2). La que probaron los usuarios sigue en `c-v1`.
**Referencia:** el «Centro de accesibilidad» del HCI Lab del curso (preferencias de lectura, región que anuncia cambios, lectura en voz y verificación manual).

## Qué se agregó

Un botón **«Accesibilidad»** en el encabezado, visible en todas las pantallas, abre un panel lateral. El panel es un diálogo modal: el foco queda dentro, Esc lo cierra y el foco vuelve al botón. Las preferencias se guardan en este navegador y se aplican antes de pintar la página, así que no hay parpadeo.

| Ajuste | Qué hace | WCAG 2.2 |
|---|---|---|
| Tema automático, claro u oscuro | El automático sigue la preferencia del sistema operativo | 1.4.3 · 1.4.11 en los tres |
| Alto contraste | Texto negro o blanco y bordes de 2 px; también combinado con el tema oscuro | 1.4.6 (AAA) |
| Tamaño del texto, de 100 % a 200 % | Todo el texto está en `rem`, así que escala completo | 1.4.4 |
| Espaciado de lectura | Renglón 1,5; párrafo 2; letras 0,12; palabras 0,16 | 1.4.12 |
| Tipografía legible | Verdana o Tahoma | — |
| Reducir movimiento | Sin transiciones; por defecto sigue al sistema | 2.3.3 (AAA) |
| Foco reforzado | Marco de 5 px con separación | 2.4.7 · 2.4.13 (AAA) |
| Botones grandes | Controles de 48 px | 2.5.8 · 2.5.5 (AAA) |
| **Atajos de una tecla (G, E, M, D)** | **Se pueden apagar**: también se ocultan sus pistas y su `aria-keyshortcuts` | **2.1.4 (A)** |
| Voz | Lee los avisos en voz alta (opcional) y el botón «Leer el estado de esta pantalla» usa la voz del navegador | — |
| Detalles y declaración de accesibilidad | Qué cubre cada ajuste, qué se probó y qué no, y cómo reportar un problema | — |

**Corrección incluida:** el aviso «1 pedidos seleccionados» ahora concuerda («1 pedido seleccionado»).

**Por qué los atajos desactivables no eran opcionales:** desde la iteración 2, C tenía atajos de una sola tecla (G, E, M y D). WCAG 2.1.4, de nivel A, exige poder apagarlos o reasignarlos. Al revisar el panel se detectó que C incumplía este criterio, y queda corregido.

## Criterios de aceptación (`pruebas/iteracion3_accesibilidad.js`): 11 de 11

| ID | Criterio |
|---|---|
| A3-01 | Se llega al botón con Tab, se abre con Enter con el foco en el título, el foco no sale del panel en 40 Tab, y Esc cierra y devuelve el foco. |
| A3-02 | El tema oscuro se aplica y se conserva al recargar. |
| A3-03 | «Automático» sigue al sistema (oscuro o claro). |
| A3-04 | axe sin infracciones serias en 4 temas × 8 estados (incluido el panel abierto). |
| A3-05 | Texto al 200 % (h1 de 28 a 56 px) sin desplazamiento horizontal en el flujo completo. |
| A3-06 | Espaciado de lectura sin desbordes a 1280 y 390 px. |
| A3-07 | Con los atajos apagados, G no hace nada y no se anuncian; encendidos, G funciona. |
| A3-08 | Con «movimiento reducido» en el sistema, no hay transiciones. |
| A3-09 | Foco de 5 px y botones de 48 px. |
| A3-10 | La voz lee los avisos («1 pedido seleccionado») y el estado de la pantalla. |
| A3-11 | «Restablecer preferencias» vuelve a lo predeterminado. |

Regresión: HZ-01 8 de 8, iteración 2 10 de 10 y el recorrido con teclado y axe pasan.

## Límites

- La voz depende del navegador y de las voces instaladas; en la prueba se intercepta la llamada, así que no se oye.
- **No sustituye una prueba con VoiceOver o NVDA ni con personas con discapacidad.**
- axe no evalúa el contraste de todo (algunos nodos quedan para revisar a mano).
- Desde la pantalla, el botón «Accesibilidad» queda a unos 9 Tab, porque el foco empieza en el contenido. Está en el encabezado y es el primer control del documento.
