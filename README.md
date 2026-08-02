# One More Floor v1.2.3

Plataformas de precisión procedural en Phaser: cinco pisos, práctica, ghosts, splits y Tower Run competitiva o asistida. Todo el progreso permanece local; no se envía a un servidor.

La versión 1.2.3 agrega una puerta reproducible de calidad, un manifiesto textual y estados accesibles compartidos. No incorpora contenido ni cambia el gameplay o el ruleset.

## Controles predeterminados

- Movimiento: `ArrowLeft` / `ArrowRight`
- Salto: `Space`
- Dash: `KeyS`
- Pausa: `KeyP`
- Reinicio: `KeyR`
- Menús: flechas, `Enter` para confirmar y `Escape` para volver

Los controles y prompts de gamepad pueden remapearse desde Ajustes. El salto estable conserva `jumpSpeed` 680, `airJumpSpeed` 640, `wallJumpY` 640 y `jumpCutMultiplier` 0.68, con gravedad 1520. Salto y dash se combinan: el salto resuelve el eje vertical mientras el dash conserva ese arco y resuelve el horizontal.

El dash estable mantiene velocidad 675, duración 220 ms, cooldown 230 ms y multiplicador final 0.58. La pestaña del navegador muestra el título limpio **One More Floor**.

## Tower Run

Tower Run enlaza los cinco pisos. Guarda un checkpoint local entre pisos. Competitivo registra el PB global; asistido permite continuar sin alterar ese PB. Práctica y anchors tampoco alteran récords competitivos.

## Datos y privacidad

Ajustes permite copiar e importar una copia JSON mediante el portapapeles, borrar ghosts, estadísticas o progreso con confirmación. No se descargan archivos y analytics es exclusivamente local y no integra la copia principal.

## Desarrollo

Se requiere Node 22.12.0 (ver `.nvmrc`) y npm 10 o superior. `validate` cubre sólo la verificación estática: no representa aceptación de navegador.

### Durante desarrollo

```sh
npm ci
npm run validate
```

### Antes de abrir PR

```sh
npm run verify:static
```

### Antes de release

```sh
npm run verify:release
```

### Después del deploy

```sh
OMF_BASE_URL=https://one-more-floor.onrender.com npm run test:deployed
```

Los checks requeridos y la protección manual de `main` están documentados en `docs/required-checks.md`.
