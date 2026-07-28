# Tower Run stability 0.9.1

## Estado inicial y auditoría

El checkout disponible comenzó en `ed7f294`, con el menú v0.9.0 pero una suite de navegador que todavía esperaba `RunSetup`, índices fijos mediante `ArrowDown`, coordenadas del menú anterior y escrituras tardías sobre `one-more-floor.save.v5`. El intento de sincronizar `main` y consultar GitHub Actions fue bloqueado por el proxy HTTP (403), por lo que el estado remoto y el CI real no pudieron verificarse desde este entorno. No se atribuyeron esos defectos al navegador: eran aserciones obsoletas visibles en la suite.

La ejecución inicial produjo: `npm ci` bloqueado por registry 403; `check:text-only` aprobado (119 archivos); el resto de los comandos dependientes falló o no pudo ejecutarse porque el `npm ci` incompleto retiró las dependencias. La instalación pudo recuperarse posteriormente desde la caché con `npm ci --offline`.

## Abandono y confirmaciones

`TowerRunCoordinator` es la única autoridad para validar, registrar una vez el abandono, marcar la sesión y borrar el checkpoint. Menú, pausa y resultados entre pisos lo invocan detrás de `ConfirmDialog`. Reemplazar una torre pendiente requiere confirmación; cancelar conserva el checkpoint.

`PauseScene` recibe el `RunContext` tipado del intento y diferencia `tower` de `floor`. Controles abre `ControlsScene` mientras Level permanece pausada.

## Checkpoints y persistencia v8

La escritura de checkpoints devuelve un outcome explícito para guardado, finalización, abandono, storage no disponible o cuota. La UI entre pisos no afirma que guardó cuando falló.

La key activa es `one-more-floor.save.v8`. La migración conserva progreso, preferencias, input, pisos, ghosts y datos agregados válidos. Los antiguos `bestFloorTimes` pasan a `bestIndividualFloorTimes`; los mínimos acumulados históricos se descartan porque no demuestran pertenecer a una única partida PB.

El récord separa la referencia completa de la mejor torre (`bestRunFloorTimes`, `bestRunCumulativeTimes`, muertes y rango de esa partida) de los mejores pisos individuales. Un PB reemplaza toda la referencia; mejorar sólo un piso no la modifica.

## Outcomes y resultados

`StorageService.recordTower()` devuelve `TowerCompletionOutcome`, incluida elegibilidad, persistencia, PB anterior/vigente, mejoras y pisos individuales. Las torres asistidas nunca escriben el PB global. El outcome viaja desde el último resultado por `EndingScene` hasta `TowerResultsScene`; no se recalcula ni se persiste dos veces.

`TowerResultsScene` presenta modo, PB, muertes, rangos, mejoras y deltas contra una referencia PB real. Ending y resultados usan acciones tipadas, mouse y prompts semánticos.

## Analytics, E2E y CI

Los abandonos pasan por una sola autoridad y respetan la preferencia local. Los fixtures E2E instalan limpieza de saves, checkpoint y analytics antes de `page.goto`, y recolectan `console.error` y `pageerror` desde el inicio. La navegación reutilizable busca acciones por nombre; permanecen pruebas con teclado físico.

`test:e2e` es la suite de producción completa y `test:e2e:smoke` es el smoke de producción sin un build duplicado. CI ejecuta ambos, sin artifacts, screenshots, video, trace ni reporter HTML.

## Limitaciones

No se pudo consultar el último estado remoto de GitHub Actions por el proxy 403. La automatización de gamepad valida el adaptador estándar; la matriz real de mandos, drivers y layouts continúa requiriendo hardware. No se añadieron servicios online, telemetría remota, contenido jugable ni archivos binarios.
