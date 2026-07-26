# One More Floor v0.4.0

Juego 2D de plataformas de precisión construido con Phaser 3, TypeScript estricto y Vite. Escapá de cinco pisos breves de una instalación industrial antes del colapso.

![One More Floor en ejecución](docs/screenshots/gameplay.svg)

## Qué incluye 0.4.0

- Cinco pisos basados en datos, sin combate ni sistemas ajenos al plataformas de precisión.
- Movimiento con salto variable, coyote time, jump buffer, wall slide/jump y dash aéreo.
- Puerta temporizada de Reactor con placa telegrafiada, indicador de tiempo, apertura visual y cierre que espera si el jugador obstruye el paso.
- Estados reales `IDLE`, `RUNNING`, `JUMPING`, `FALLING`, `WALL_SLIDING`, `DASHING`, `LANDING`, `LOCKED` y `DEAD`; idle/run usan Animation Manager.
- Aterrizaje único clasificado como suave o fuerte a partir de la velocidad previa al impacto.
- Ventiladores y cintas calculados con delta real y limitados; las cintas convergen a una velocidad objetivo.
- Menús independientes de ajustes y pausa, utilizables con teclado, gamepad y mouse.
- Volumen, mute, shake, intensidad reducida, reducción de flashes, alto contraste y fullscreen persistidos en el guardado v3.
- Audio procedural Web Audio compartido, desbloqueado tras interacción, con volumen, mute, pausa y cooldown.
- Cobertura unitaria de temporización de puerta, aterrizaje y fuerzas, más Playwright para los flujos principales.

## Controles

| Acción          | Teclado           | Gamepad                  |
| --------------- | ----------------- | ------------------------ |
| Mover           | `A/D` o flechas   | stick izquierdo          |
| Saltar          | `W`, `↑`, espacio | A                        |
| Dash            | `Shift`           | RB/RT                    |
| Pausa           | `Esc`             | Start                    |
| Reinicio rápido | `R`               | opción del menú de pausa |
| Menús           | flechas + `Enter` | stick + A/B              |

La pausa ofrece continuar, reiniciar, ajustes, controles y volver al menú. Los ajustes se modifican individualmente; no existe remapeo arbitrario.

## Desarrollo

Requiere Node.js 20.19+ o 22.12+.

```bash
npm ci
npm run dev
npm run validate
npm run test:e2e
npm run test:e2e:headed
```

`validate` ejecuta typecheck, ESLint, tests unitarios y build. Playwright inicia una build Vite con `VITE_E2E=true`; el harness no se instala en builds normales. La CI ejecuta validación y Chromium en jobs separados y conserva artefactos sólo al fallar.

## Arquitectura

- `config/`: cinco niveles tipados y parámetros de movimiento.
- `objects/TimedDoor.ts`: presentación y cuerpo Phaser de las puertas.
- `systems/DoorTimer.ts` y `PhysicsMath.ts`: lógica pura, temporal y de fuerzas.
- `entities/Player.ts` y `states/`: controlador, animación y máquina de estados.
- `scenes/SettingsScene.ts` y `PauseScene.ts`: overlays con ciclo de vida explícito.
- `services/`: guardado v3 con migración v1/v2 y autoridad única de audio procedural.
- `e2e/`: pruebas reales del canvas y flujos de navegador.

## Render

Configurar como **Static Site**:

```text
Build Command: npm ci && npm run build
Publish Directory: dist
```

Vite conserva una base relativa; no requiere backend ni recursos externos.

## Limitaciones conocidas

- Los tiempos/rangos todavía requieren balance con una muestra externa de jugadores.
- Fullscreen depende de la concesión del navegador; el guardado se sincroniza con el evento real, no con la intención.
- No hay remapeo arbitrario de controles.
- La pasada automatizada cubre Chromium; hardware gamepad diverso, rendimiento de gama baja y playtesting humano exhaustivo siguen pendientes.
- La captura SVG conserva la imagen real disponible en el repositorio en un formato de texto compatible con la revisión; debe regenerarse desde Playwright en un entorno que permita instalar Chromium antes de publicación definitiva.

La auditoría inicial detallada se conserva en [`docs/production-audit.md`](docs/production-audit.md).

## Licencia

Copyright © 2026 Lucas Leonel Montenegro Burgos. Todos los derechos reservados. Consultá [`License`](License); la licencia no fue modificada.
