# Hotfix de teclado 0.7.1

## Causa raíz

Los bindings persistían códigos DOM como `KeyA`, `Space` y `ShiftLeft`, pero `InputManager` los entregaba a `Phaser.Input.Keyboard.addKey()`. Esa API interpreta strings con la nomenclatura de Phaser, por lo que la mezcla de representaciones hacía que varios códigos físicos no se registraran de forma fiable, especialmente en la build de producción.

## Archivos afectados

- `src/input/KeyboardInputSource.ts` adapta eventos DOM y administra foco y ciclo de vida.
- `src/input/InputManager.ts` traduce el estado físico a acciones y conserva gamepad, deadzone e histéresis.
- Las escenas destruyen su manager durante `SHUTDOWN`; Controls registra sus teclas auxiliares una sola vez.
- `src/main.ts` restaura controles con la query segura y recupera foco al pulsar el canvas.
- Las pruebas unitarias y `e2e/game.spec.ts` cubren transiciones, remapeo y teclado de navegador real.

## Representación elegida

`KeyboardEvent.code` es la única representación canónica y persistida. Describe la tecla física, no depende del layout y mantiene compatibilidad con saves existentes. Los códigos se validan acción por acción; una acción inválida vuelve a su default sin alterar progreso, récords, ghosts, analytics ni bindings válidos.

## Ciclo de vida y foco

La fuente mantiene un `Set` reutilizable, agrega y elimina códigos en `keydown`/`keyup`, y lo limpia en `blur` o cuando `document.hidden` pasa a verdadero. Cada escena destruye listeners en `SHUTDOWN`. `blockInherited()` sincroniza primero el estado físico: una tecla heredada queda bloqueada hasta soltarse, mientras la siguiente pulsación válida entra inmediatamente.

Sólo los códigos usados por el juego reciben `preventDefault`; se excluyen modificadores Ctrl, Meta y Alt y elementos HTML editables. Un click en el canvas recupera foco y sigue permitiendo el desbloqueo de audio existente.

## Pruebas reales y producción

Vitest cubre códigos, bordes por frame, aliasing de sets, cambio inmediato de settings, limpieza, gamepad e histéresis. Playwright usa `page.keyboard.press`, `down` y `up` para menú, selector, movimiento, salto, dash, pausa, reinicio, remapeo persistente y pérdida de foco. Su `webServer` compila con `VITE_E2E=true` y sirve `dist` mediante `npm run preview`, con trace, screenshot y video desactivados.

## Limitaciones

La automatización cubre Chromium y un gamepad lógico en tests unitarios; la variedad de hardware, drivers, layouts y políticas de fullscreen todavía requiere validación manual. No se agregaron mecánicas ni UI fuera del mensaje textual de recuperación.
