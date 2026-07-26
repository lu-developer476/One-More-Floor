# Auditoría de input y práctica — v0.6.0

## Estado inicial real

La base inspeccionada declaraba v0.5.0, cinco pisos, persistencia v4, countdown, recorder/ghost local, Vitest y Playwright configurado con reporter `list` y `trace`, `screenshot` y `video` desactivados. `check:text-only`, typecheck, lint, 33 pruebas unitarias y build pasaron. El build avisó que el chunk principal supera 500 kB. El comando E2E inicial no pudo ejecutarse porque el binario `playwright` no estaba instalado en el entorno, por lo que no se presentó como aprobado.

La auditoría encontró lecturas duplicadas y directas de teclado/gamepad en Player, Level, Menu, Pause, Settings y Results. Settings consultaba B por nivel cada frame; Results avanzaba ante cualquier botón; Settings usaba `window.confirm`; Pause no tenía navegación gamepad; Player repetía su propia detección de flancos. Los listeners de teclado principales sí se retiraban al cerrar escenas, aunque varios callbacks pointer anónimos dificultaban su limpieza. `showGhost` y alto contraste no actualizaban el ghost existente en caliente. Results predecía el guardado antes de validarlo StorageService.

## Arquitectura

`InputAction` define MOVE_LEFT, MOVE_RIGHT, JUMP, DASH, PAUSE, RESTART, MENU_UP, MENU_DOWN, MENU_LEFT, MENU_RIGHT, CONFIRM y BACK. `InputState` conserva down/pressed/released, ejes, deadzone, dispositivo activo y bloqueo hasta liberar. `InputManager` es el único adaptador Phaser que consulta teclado y gamepad una vez por frame. La captura temporal de un binding es la excepción intencional.

Defaults de teclado: A, D, Space, Shift izquierdo, Escape, R, flechas, Enter y Escape. Defaults gamepad estándar: cruceta 12–15, botón 0 para salto/confirmar, 1 para volver, 5 para dash, 9 para pausa y 4 para reinicio. Los conflictos intercambian asignaciones de forma visible; claves desconocidas, reservadas, índices fuera de 0–31 y deadzones fuera de 0.1–0.9 se rechazan.

## Persistencia v5

La clave actual es `one-more-floor.save.v5`. La carga migra de v4, v3, v2 y v1. La validación recupera cada binding corrupto con su default sin borrar pisos, progreso, récords o ghosts. Persiste teclado, gamepad, deadzone y estilo de prompt genérico/Xbox/PlayStation/Nintendo.

## Práctica, asistencia y elegibilidad

Cada definición conserva sus hazards y agrega tres anchors seguros sobre el suelo. Contrarreloj parte de `start`, expira con el colapso y puede persistir. Práctica conserva el anchor al morir, no expira por colapso y no persiste progreso ni resultados. Una asistencia de gameplay permite progresión explícitamente, pero invalida PB, rango y ghost. Accesibilidad visual no invalida. El harness E2E invalida salvo habilitación competitiva explícita.

## Ghost

Los cambios de visibilidad y contraste se aplican inmediatamente mediante el evento de settings. El reproductor mantiene un sprite y selecciona textura por estado almacenado. `recordFloor` devuelve metadatos del guardado validado. El recorder interpola muestras cruzadas por deltas grandes en vez de duplicar la pose actual.

## Tests y limitaciones

Vitest cubre defaults, validación, conflictos/intercambio, flancos, deadzone, dispositivo/desconexión, migración y recuperación, elegibilidad, práctica/asistencia, sampling y resultado real. Playwright conserva salidas text-only. Su adaptador falso sólo valida integración semántica: no prueba hardware Gamepad real, reconexión dependiente del SO, nomenclaturas de fabricantes ni vibración física.
