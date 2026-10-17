# Versión B · alternativa generada con IA (Taller 6, Paso 4)

| Campo | Valor |
|---|---|
| Herramienta y modelo | **Claude Sonnet 5.5 (Anthropic), en Claude Code.** No se usó Figma Make ni v0. |
| Fecha | 17-oct-2026 |
| Quién lo ejecutó y revisó | Generado por la IA a pedido del equipo S2DJ; el equipo lo revisa y decide qué se acepta (decisión D-92). |
| Enlace | https://sevalenciaca.github.io/s2dj-tms/final-b/ · formatos: https://sevalenciaca.github.io/s2dj-tms/final-b/formatos.html |
| Prompt | El del Taller 6 (`taller6/paso4_prototipo_B/PROMPT_B_v0_FigmaMake.md`), con el contexto de A (capturas P01–P05 y el código de A), tal cual. |
| Entradas que no se usaron | El código de C no se tomó como base: B se escribió desde el prompt y A. |

## Qué se declara de la herramienta

La guía sugiere Figma Make o v0 «según el acceso disponible». No había acceso, así que B se generó con un asistente de IA de código. **Eso es una diferencia con lo sugerido y está declarada.** Si el equipo prefiere una salida de Figma Make o v0, basta pegar el prompt allí y registrarla aparte; B quedaría como la versión de Claude.

**Límite de independencia.** La misma familia de IA ayudó a construir C. Por eso la comparación «equipo frente a IA» tiene un sesgo: B no es independiente de C. Se mitigó no copiando el código de C y siguiendo el prompt al pie de la letra (por ejemplo, «Deshacer visible durante unos segundos» y un error en el primer intento de «Despachar»), que C modificó a propósito (D-34).

## Mapa de navegación

```
#p1 Pedidos pendientes ──(Generar guía · G)──┬── 1 ciudad ──────────────────────────┐
        │                                     └── 2+ ciudades → P2 diálogo ──┬ una guía por ciudad ┤
        │                                                                     └ agrupar y elegir destino ┤
        ▼                                                                                               ▼
#guias Lista de guías ──(Abrir)──▶ #g  Guía: Pendiente → En preparación → En plataforma → En tránsito
   (las pendientes primero,              P3 datos y conductor (error «Falta el conductor»)
    con «Falta: …»)                      P4 empaque y «Mover a plataforma»
                                         P4b plataforma → confirmación → «Despachando…» → error (1.er intento) → «Reintentar despacho»
                                         P5 En tránsito → «Deshacer (10 s)» → historial → «Ver siguiente guía»
formatos.html  Computador · Tableta · Celular · Reloj (confirmación y resultado del despacho)
```

## Qué corrige B (según el prompt) y cómo se comprobó

| Hallazgo | Cambio en B | Criterio (`pruebas/b_aceptacion.js`) |
|---|---|---|
| HZ-01 | Confirmación que repite guía, destino, pedidos, conductor y cajas; foco inicial en «Cancelar»; Esc cancela; el foco no queda en «Despachar»; «Deshacer (10 s)» | B-01, B-02, B-03 |
| HZ-03 | Hora real al sincronizar, con espera visible; «Guardado automáticamente» con hora real | B-04 |
| HZ-04 | Vista «Guías»; el menú resalta la sección actual (dentro de una guía, «Guías») | B-05 |
| HZ-05 | En «Guías», las guías por completar aparecen primero con «Falta: …» | B-06 |
| HZ-09 | «Se crearon N guías» solo si se crearon N | B-06, B-07 |
| HZ-10, EDA-03 | Lista de pedidos en el diálogo, la guía y la confirmación; los datos salen de los pedidos elegidos | B-06, B-07 |
| Multiformato | Confirmación y resultado del despacho en computador, tableta, celular y reloj | B-09 |
| Accesibilidad | axe sin infracciones serias y sin desplazamiento horizontal en 7 estados a 1440 y 390 px | B-08 |

**Resultado (17-oct, local): 9 de 9** (`pruebas/resultado_2026-10-17.txt`).

## Lo que B no implementa ni comprueba (declarado)

- **«Deshacer» vence a los 10 s.** Es lo que pide el prompt, pero en términos de WCAG 2.2.1 (tiempo ajustable) es una limitación; C la reemplazó por deshacer sin límite mientras se está en la guía (D-34).
- **Nada se conserva al recargar la página** (HZ-05 se cubre solo con la lista de la sesión); C y su iteración 2 sí lo conservan.
- **No hay búsqueda tolerante** más allá de quitar tildes y mayúsculas, ni atajos fuera de G, ni ayuda contextual ni indicador de conexión.
- **El error de «Despachar» ocurre solo en el primer intento de la sesión**, como pide el prompt.
- Los **cuatro formatos son diseños estáticos de apoyo**; solo el computador es navegable. No se probaron en dispositivos reales.
- **Ninguna persona ha probado B.** Las pruebas verifican el prompt, no la usabilidad.
- Datos ficticios; sin backend.
