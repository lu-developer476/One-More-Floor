# One More Floor v0.9.2: layout de controles y dash

## Alcance

v0.9.2 cambia únicamente el layout predeterminado de teclado y la duración del dash. No modifica gravedad, salto, aceleración, velocidad normal, wall jump, geometría, gamepad ni capacidades adicionales.

## Layout anterior y nuevo

El layout 1 usaba A/D para movimiento, Espacio para salto, Shift izquierdo para dash y Escape para pausa. El layout 2 usa flechas izquierda/derecha, Espacio, S y P respectivamente. Reinicio continúa en R. Los menús mantienen flechas, Enter para confirmar y Escape para volver.

## Persistencia y migración

La save activa es `one-more-floor.save.v9`, con migración defensiva desde v1 hasta v8. `keyboardLayoutVersion: 2` hace que la migración obligatoria ocurra una sola vez: fuerza los cinco bindings principales y conserva reinicio, navegación, confirmar, volver, gamepad, deadzone, estilo de prompts, progreso, checkpoints, PB, ghosts, splits, analytics, ajustes y Tower Records. Los remapeos guardados después de migrar no se pisan. Un input corrupto se repara aisladamente y un Tower Record corrupto continúa aislándose.

Restaurar controles, incluida la query `?reset-controls`, repone ambos dispositivos y el layout 2 sin borrar progreso ni récords.

## Dominios de conflicto

Los bindings se separan en `gameplay`, `menu` y `system`. Una tecla puede compartirse entre escenas que no compiten: `MOVE_LEFT`/`MENU_LEFT` y `MOVE_RIGHT`/`MENU_RIGHT` comparten flechas. Dentro de un dominio se detecta el conflicto y el remapeo intercambia las asignaciones; por ejemplo, movimiento izquierdo/derecho, salto/dash y confirmar/volver no pueden coincidir.

## Ajuste del dash

`dashDurationMs` pasa de 150 a 220 ms. Se mantienen `dashSpeed: 675`, `dashCooldownMs: 230` y `dashEndMultiplier: 0.58`. La distancia nominal sin colisiones pasa de 101.25 px a 148.5 px (`675 × 220 / 1000`). El controlador conserva pulsación por flanco, disponibilidad, cooldown, orientación y bloqueo físico; la pausa y el countdown no avanzan gameplay.

## Verificación

Las pruebas puras cubren defaults, dominios, migración única, persistencia posterior, reset, prompts y parámetros nominales. Playwright cubre eventos físicos, teclas antiguas inactivas, pausa con P, Escape como BACK, desplazamiento real del dash en el inicio plano del piso 1, colisiones y flujos existentes de los cinco pisos, splits, práctica, ghosts y Tower Run. La validación de niveles revisa los cinco pisos y sus anchors data-driven.

## Compatibilidad y limitaciones

Los PB, mejores segmentos, Tower Records y ghosts anteriores se conservan y reproducen; no se invalida un intento por usar el dash nuevo. El cambio de balance puede permitir tiempos más rápidos. Las pruebas automatizadas no sustituyen playtesting humano exhaustivo ni pruebas con todos los gamepads, drivers, tasas de refresco y equipos disponibles.
