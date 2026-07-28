# One More Floor v1.0.0

Plataformas de precisión procedural en Phaser: cinco pisos, práctica, ghosts, splits y Tower Run competitiva o asistida. Todo el progreso permanece local; no se envía a un servidor.

## Controles predeterminados

- Movimiento: `ArrowLeft` / `ArrowRight`
- Salto: `Space`
- Dash: `KeyS`
- Pausa: `KeyP`
- Reinicio: `KeyR`
- Menús: flechas, `Enter` para confirmar y `Escape` para volver

Los controles y prompts de gamepad pueden remapearse desde Ajustes. El dash estable usa velocidad 675, duración 220 ms, cooldown 230 ms y multiplicador final 0.58.

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
