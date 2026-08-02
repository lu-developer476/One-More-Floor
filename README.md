# One More Floor v1.1.2

Plataformas de precisión procedural en Phaser: cinco pisos, práctica, ghosts, splits y Tower Run competitiva o asistida. Todo el progreso permanece local; no se envía a un servidor.

La versión 1.1.2 completa la interfaz centrada en el usuario, incorpora doble salto repetible, ajusta MANTENIMIENTO y garantiza el acceso persistente al piso 3.

## Controles predeterminados

- Movimiento: `ArrowLeft` / `ArrowRight`
- Salto: `Space`
- Dash: `KeyS`
- Pausa: `KeyP`
- Reinicio: `KeyR`
- Menús: flechas, `Enter` para confirmar y `Escape` para volver

Los controles y prompts de gamepad pueden remapearse desde Ajustes. El hotfix 1.0.1 eleva el salto (`jumpSpeed` 620, `wallJumpY` 590 y `jumpCutMultiplier` 0.60) sin cambiar la gravedad 1520. Salto y dash ahora se combinan: el salto resuelve el eje vertical mientras el dash conserva ese arco y resuelve el horizontal.

El dash estable mantiene velocidad 675, duración 220 ms, cooldown 230 ms y multiplicador final 0.58. La pestaña del navegador muestra el título limpio **One More Floor**.

## Tower Run

Tower Run enlaza los cinco pisos. Guarda un checkpoint local entre pisos. Competitivo registra el PB global; asistido permite continuar sin alterar ese PB. Práctica y anchors tampoco alteran récords competitivos.

## Datos y privacidad

Ajustes permite copiar e importar una copia JSON mediante el portapapeles, borrar ghosts, estadísticas o progreso con confirmación. No se descargan archivos y analytics es exclusivamente local y no integra la copia principal.

## Desarrollo

```sh
npm ci
npm run validate
npm run test:e2e
npm run test:e2e:smoke
```

Tras desplegar:

```sh
OMF_BASE_URL=https://one-more-floor.onrender.com npm run test:deployed
```
