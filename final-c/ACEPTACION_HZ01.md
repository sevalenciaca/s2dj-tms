# Versión C · Mejora HZ-01: confirmar o deshacer el despacho

**Origen:** HZ-01 (severidad 3) · patrón P-02 · mejora M-01 del plan del Taller 5 (aceptada; responsable: Santiago Valencia). Evaluación directa EDA-01.
**Requisitos:** RI-11 (espera, falla y reintento también al despachar) y RI-12 (tarea completa con teclado).
**Criterios de la rúbrica:** Usabilidad (prevención y recuperación de errores), Accesibilidad (foco y teclado), UX (aceptación y pruebas), Comparación equipo e IA (mejora integrada en C).
**A no cambia:** `/final/` sigue idéntico a V1. C vive en `/final-c/`.

## Qué cambió (y solo eso)

1. «Despachar · pasa a En tránsito» abre una **confirmación** (`role="alertdialog"`) que repite destino, transportadora, conductor y empaque. El foco inicial está en «Cancelar (Esc)»; el foco queda atrapado en el diálogo y Esc cancela.
2. Al confirmar: «Despachando…» con el botón deshabilitado. Después, En tránsito con **«Deshacer despacho» disponible sin límite de tiempo mientras la guía siga en P5** (se cierra al pasar a la siguiente guía; decisión D-34, por WCAG 2.2.1). Deshacer devuelve la guía a En plataforma con los mismos datos y lo registra en el historial («Despacho deshecho → En plataforma»).
3. Al llegar a En plataforma, el foco va al mensaje de estado, **no** al botón «Despachar» (en A, un Enter despachaba).
4. **Falla del despacho** (simulada con `?simular=fallo-despacho`): el mensaje explica la causa, la guía sigue En plataforma con sus datos y «Reintentar despacho» completa la acción.

## Criterios de aceptación (dado / cuando / entonces)

| ID | Dado | Cuando | Entonces |
|---|---|---|---|
| CA-01 | una guía En plataforma | Marta pulsa «Despachar» | aparece una confirmación con destino, transportadora, conductor y empaque, y la guía **sigue En plataforma** |
| CA-02 | la confirmación abierta | pulsa «Cancelar» o Esc | la guía sigue En plataforma, el historial no cambia y el foco vuelve a «Despachar» |
| CA-03 | la confirmación abierta | pulsa «Sí, despachar» | ve «Despachando…» y luego la guía En tránsito con «Deshacer despacho» y el aviso «Puedes deshacerlo mientras sigas en esta pantalla» |
| CA-04 | una guía recién despachada | pulsa «Deshacer despacho» dentro del plazo | la guía vuelve a En plataforma con las mismas cajas, líos y flete, y el foco va al mensaje |
| CA-04b | un despacho deshecho y vuelto a despachar | revisa el historial | aparecen «Despacho deshecho → En plataforma» y después «En tránsito» |
| CA-05 | el servidor no responde al despachar | confirma el despacho | ve el error con la causa, la guía sigue En plataforma con sus datos, el foco va a «Reintentar despacho», y al reintentar queda En tránsito |
| CA-06 | la guía acaba de pasar a En plataforma | pulsa Enter sin mover el foco | no se despacha nada: el foco no está sobre «Despachar» |
| CA-07 | una guía recién despachada | pasan 2 minutos sin deshacer, y luego pasa a la siguiente guía y vuelve con Atrás | a los 2 minutos «Deshacer» sigue disponible (sin límite de tiempo, 2.2.1); después de pasar a la siguiente guía ya no aparece |

## Comprobación

- **Automatizada:** `pruebas/hz01_aceptacion.js` (Playwright con Chrome), la misma suite contra A y C. Resultado del 16-oct-2026 en `pruebas/resultado_2026-10-16.txt` (el del 15-oct se conserva): **C pasa 8 de 8; A pasa 0 de 7** (línea base). CA-07 usa un reloj simulado.
- **Capturas** (`pruebas/capturas/`): C01 confirmación · C02 despachando · C03 despachada con «Deshacer» · C04 despacho deshecho · C05 historial con la anulación · C06 error al despachar · C07 recuperado tras reintentar.
- **Camino feliz:** CA-01 → CA-03. **Error y recuperación:** CA-05 (falla del servidor) y CA-04 (despacho equivocado → deshacer).

Cómo repetirla:

```
cd s2dj-tms && python3 -m http.server 8765 --bind 127.0.0.1 &
cd final-c/pruebas && npm install && node hz01_aceptacion.js
```

## Qué demuestra y qué no demuestra el 8/8

**La prueba 8/8 frente a 0/7 mide la especificación, no la mejora para el usuario.** Comprueba que C hace lo que dicen los criterios (confirmación, deshacer, foco, error y recuperación) y que A no lo hace. No demuestra que una persona de bodega despache con menos errores ni que lo prefiera. Esa evidencia sale de las sesiones con usuarios. En el curso se usan sesiones **simuladas (SIM)**, que son hipótesis de diseño (`taller6/paso7_usuarios_simulados/`); la prueba con personas reales queda para después de publicar.

## Lo que C no cambia ni comprueba (declarado)

- Después de HZ-01, C incorporó por decisión del equipo (D-27 a D-48): datos de la guía según los pedidos elegidos (EDA-03, HZ-09, HZ-10), horas reales y búsqueda (HZ-03, HZ-02), reflujo a 320 px y foco no tapado (HZ-06/1.4.10, 2.4.11), indicador de pasos accesible (A11Y-01), fila seleccionable (EDA-10), color por estado (EDA-12), ayuda contextual (HZ-08) y el atajo G con foco en una casilla (HZ-12). **Siguen pendientes:** «Guías» y retomar una guía (HZ-04 y HZ-05, D-31); el aviso «Guardado automáticamente» no sobrevive a una recarga.
- **Historial del diseño:** la primera versión usaba un plazo de 10 s. Se cambió (D-34) porque chocaba con WCAG 2.2.1: no se podía extender.
- «Deshacer» en el prototipo solo revierte el estado en pantalla. En el sistema real habría que definir qué pasa si la transportadora ya recibió el aviso: eso queda fuera del alcance.
- No se hizo prueba con lector de pantalla ni auditoría WAVE o Lighthouse de C (pendiente M-10).
- Ninguna persona real ha usado C todavía (ronda R3 pendiente).

## Uso de IA

Implementación, criterios y prueba automatizada: Claude Opus 5.5 (Anthropic) en Claude Code, 15-oct-2026, como agente de ejecución del equipo, a partir del plan aceptado por el equipo (M-01). **Revisión humana pendiente:** Santiago Valencia (responsable de M-01) revisa y acepta o ajusta el cambio antes de publicarlo.
