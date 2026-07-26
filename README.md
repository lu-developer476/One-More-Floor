# One More Floor v0.2.0

Vertical slice 2D de plataformas de precisión construida con Phaser 3, TypeScript estricto y Vite. Escapá de cinco pisos breves de una instalación industrial antes del colapso.

> Superar un piso más antes de que todo se derrumbe.

![Vista del juego](docs/screenshots/gameplay.svg)

## Estado y características

La versión `0.2.0` incluye cinco pisos basados en datos, reinicio de muerte menor a 800 ms, menú y selección desbloqueable, resultados/rangos por piso, HUD, pausa, persistencia validada y controles de teclado/gamepad. Toda la presentación usa texturas y formas generadas localmente; no descarga assets.

| Piso | Identidad | Mecánicas principales |
|---|---|---|
| 1 · Evacuación | Azul frío | movimiento, salto variable, coyote, buffer y pinchos |
| 2 · Mantenimiento | Verde técnico | plataformas móviles/one-way, electricidad y dash |
| 3 · Ventilación | Gris | ventiladores, corrientes y wall jump |
| 4 · Reactor | Naranja | cintas, plataformas frágiles, puerta y láseres |
| 5 · Colapso | Rojo alarma | combinación final con presión de tiempo |

El jugador dispone de aceleración, frenado, control aéreo, salto variable, wall slide/jump, bloqueo direccional breve y dash aéreo recuperable. La cámara aplica seguimiento amortiguado, deadzone, fade, flash configurable y shake reducible. El escenario usa parallax con `TileSprite`, partículas, blend modes, texturas procedurales y capas de profundidad.

## Controles

| Acción | Teclado | Gamepad |
|---|---|---|
| Mover | `A/D` o flechas | stick izquierdo |
| Saltar | `W`, `↑`, espacio | A / botón inferior |
| Dash | `Shift` | RB o RT |
| Pausa | `Esc` | Start |
| Reiniciar piso | `R` | menú de pausa |
| Menú | flechas + `Enter` | gamepad |

Los ajustes persistentes contemplan volumen, mute, shake/reducción de shake, reducción de flashes, contraste y fullscreen. La migración desde el guardado v1 se valida antes de usarse. `?debug` activa hitboxes de Arcade Physics durante desarrollo.

## Arquitectura

- `config/levelConfig.ts`: cinco definiciones tipadas, ambientación, geometría, hazards y rangos.
- `systems/LevelFactory.ts`: construcción desacoplada de Phaser, preparada para sustituir la fuente por Tiled.
- `entities/Player.ts` y `states/`: cuerpo físico, controlador y máquina de estados.
- `objects/`: plataformas y hazards reutilizables con telegraph.
- `systems/`: colapso por fases, tiempo, entorno, estadísticas y progresión.
- `services/`: persistencia v2 y sintetizador procedural Web Audio.
- `scenes/`: boot, menú, partida, HUD y resultados.

Las funciones puras de ranking, configuración, temporizador, fases, progresión y migración tienen cobertura unitaria. Los listeners propios de escenas se retiran en `SHUTDOWN`.

## Desarrollo

Requiere Node.js 20.19+ o 22.12+.

```bash
npm install
npm run dev
npm run validate
```

`validate` ejecuta typecheck, ESLint, Vitest y build. La CI ejecuta esos mismos controles sin `continue-on-error`.

## Render

Configurar como **Static Site**:

```text
Build Command: npm install && npm run build
Publish Directory: dist
```

Vite usa una base relativa y no requiere servidor, `PORT`, backend ni servicios externos.

## Limitaciones y roadmap

- El balance de 20–60 segundos es un objetivo de diseño y requiere playtesting con jugadores.
- El audio procedural está implementado como servicio, pero su integración completa con cada evento queda para una siguiente iteración.
- El menú de ajustes usa presets; todavía no ofrece sliders ni remapeo arbitrario.
- Las puertas poseen definición tipada, pero la interacción temporizada visual completa queda pendiente.
- Próximos pasos: tests de navegador, perfiles de rendimiento WebGL/Canvas, mejor navegación gamepad y migración opcional a Tiled.

## Licencia

Copyright © 2026 Lucas Leonel Montenegro Burgos. Todos los derechos reservados. Consultá [`License`](License); la licencia no fue modificada.
