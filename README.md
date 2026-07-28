# One More Floor v0.8.0

Plataformas 2D de precisión construido con Phaser 3.90, TypeScript estricto y Vite. Escapá de cinco pisos data-driven antes del colapso, ahora con contrarreloj justo y fantasma local.

## Qué incluye 0.8.0

### Hotfix 0.7.1

- El teclado usa `KeyboardEvent.code` como representación canónica en desarrollo y producción.
- Las teclas mantenidas se liberan al perder foco o esconder la pestaña, sin dejar acciones atascadas.
- El remapeo persiste, se aplica inmediatamente y puede restaurarse sin borrar progreso con `?reset-controls`.
- Playwright valida los recorridos con eventos reales `page.keyboard`, sin acciones sintéticas del harness.

- Splits físicos data-driven conectados al recorrido, comparación contra los splits del PB y mejores segmentos históricos.
- HUD y resultados muestran deltas sólo al cruzar zonas; el tiempo teórico exige todos los segmentos del piso.
- Estadísticas locales opcionales y acotadas cubren inicio, splits, muerte, reinicio, abandono y finalización. No se envían datos a Internet.
- La pantalla ESTADÍSTICAS resume balance por piso y copia un informe JSON de texto mediante Clipboard API.
- Causas de muerte tipadas y persistencia v6 con migración defensiva.
- Validación estructural de niveles con `npm run check:levels`.

- Cuenta regresiva procedural `3 · 2 · 1 · GO`: jugador, cronómetro, hazards y plataformas permanecen detenidos hasta la salida.
- Cronómetro de intento basado exclusivamente en delta de gameplay limitado; pausa, muerte, resultados y countdown no cuentan.
- Grabación fija a 20 Hz, posiciones cuantizadas, límites estrictos y reproducción interpolada mediante un único sprite sin cuerpo físico.
- El mejor ghost se guarda por piso sólo junto a un récord válido; los intentos fallidos se descartan.
- Menú y HUD muestran PB, rango y disponibilidad del fantasma; `showGhost` se aplica y persiste de inmediato.
- Persistencia JSON v6, con migración defensiva desde v1, v2 y v3 y recuperación aislada de ghosts corruptos.
- Limpieza confirmada de fantasmas, récords o progreso completo desde Ajustes.
- Recursos gráficos y audio generados en runtime. El repositorio aplica una política **text-only** y no contiene capturas.

## Controles

| Acción   | Teclado           | Gamepad         |
| -------- | ----------------- | --------------- |
| Mover    | `A/D` o flechas   | stick izquierdo |
| Saltar   | `W`, `↑`, espacio | A               |
| Dash     | `Shift`           | RB/RT           |
| Pausa    | `Esc`             | Start           |
| Reinicio | `R`               | menú de pausa   |
| Menús    | flechas + `Enter` | stick + A/B     |

La cuenta regresiva permite pausar o volver al menú. No se puede saltar y ningún input anterior a `GO` se convierte en una acción jugable.

## Input, práctica y elegibilidad

- `InputManager` traduce teclado, Gamepad estándar y pointer a acciones semánticas, con estados `down`, `pressed`, `released`, ejes, deadzone y bloqueo de pulsaciones heredadas.
- `ControlsScene` permite remapear teclado y gamepad, resolver conflictos por intercambio, restaurar defaults y persistir estilos de prompt.
- Cada uno de los cinco pisos ofrece contrarreloj o práctica y tres anchors data-driven: inicio, mecánica central y tramo final. La muerte en práctica conserva piso, modo y anchor.
- Práctica nunca expira por colapso y nunca guarda PB, rango, ghost ni desbloqueos. Las asistencias de gameplay permiten progresión pero invalidan récords; opciones puramente visuales no lo hacen.
- `RunEligibility` es la autoridad pura para resultados competitivos, de práctica, asistidos y ejecuciones del harness.
- El gamepad se valida con lógica pura y un adaptador E2E; Chromium automatizado no sustituye pruebas con hardware, drivers y layouts reales. La vibración no se activa cuando no se detecta soporte seguro.

## Desarrollo y política text-only

Requiere Node.js 20.19+ o 22.12+.

```bash
npm ci
npm run check:text-only
npm run check:levels
npm run validate
npm run test:e2e
```

`check:text-only` inspecciona `git ls-files`, extensiones prohibidas, directorios generados, SVG con raster incrustado, referencias data y cargas sospechosas. `validate` lo ejecuta antes de typecheck, ESLint, Vitest y build. Playwright usa sólo reporter `list`, sin screenshots, videos ni traces; el harness existe únicamente con `VITE_E2E=true`.

## Arquitectura

- `config/`: cinco niveles tipados y parámetros de movimiento.
- `systems/RunCountdown.ts`: presentación Phaser y frontera determinista de inicio.
- `runs/RunRecorder.ts`: sampling fijo y cuantizado sin Phaser.
- `runs/GhostValidator.ts`: validación pura de JSON y límites.
- `runs/GhostInterpolation.ts`: reproducción temporal pura y búsqueda incremental.
- `runs/GhostPlayer.ts`: único sprite visual no físico.
- `services/StorageService.ts`: autoridad de persistencia v6 y migraciones.
- `scenes/`: composición, UI, ajustes y resultados.
- `e2e/`: flujos de navegador basados en harness/estado, nunca píxeles.

## Render

Static Site: build `npm ci && npm run build`, publicación `dist`. No requiere backend ni recursos externos.

## Limitaciones conocidas

- Los tiempos y rangos aún requieren balance con una muestra externa de jugadores.
- El ghost es local al navegador y no ofrece ranking remoto ni exportación.
- Si alcanza el máximo de duración o samples, el recorder deja de agregar muestras sin interrumpir la partida.
- Fullscreen depende de la concesión del navegador. El remapeo acepta códigos de teclado conocidos y botones Gamepad estándar.
- Los prompts son textuales y cambian entre estilos genérico, Xbox, PlayStation y Nintendo; el estilo no altera el mapeo físico.
- CI automatiza Chromium; gamepads diversos, equipos de gama baja y playtesting humano exhaustivo siguen pendientes.

La auditoría de esta versión está en [`docs/splits-analytics-completion-080.md`](docs/splits-analytics-completion-080.md).

## Licencia

Copyright © 2026 Lucas Leonel Montenegro Burgos. Todos los derechos reservados. Consultá [`License`](License); la licencia no fue modificada.
