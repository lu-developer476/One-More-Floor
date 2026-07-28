# Compleción de splits y analytics — One More Floor v0.8.0

## Estado inicial

La auditoría se realizó sobre `7d92bde`, el estado disponible de `main`. `npm ci` no pudo descargar `@playwright/test` por un HTTP 403 del registro; por esa eliminación parcial de `node_modules`, typecheck, lint, tests, build y E2E iniciales tampoco pudieron ejecutarse. `check:text-only` y el validador heredado sí pasaron. Una instalación posterior exclusivamente desde la caché local permitió trabajar sin descargar recursos.

Se verificaron las causas informadas: las definiciones heredaban tres splits genéricos, `LevelFactory` no construía zonas, `LevelScene` terminaba el recorder directamente, Results enviaba records vacíos, analytics no participaba del ciclo, el validador perdía estructuras anidadas y no existía una escena de estadísticas.

## Pipeline de splits

Cada piso define entre tres y seis hitos propios. `LevelFactory` construye una zona estática, invisible y no bloqueante por definición. El overlap llama a `AttemptSession.triggerSplit`; `SplitTracker` rechaza duplicados y fuera de orden. El resultado alimenta feedback reutilizable, HUD y analytics. La salida fuerza determinísticamente el último split esperado antes de `AttemptSession.finish`, que produce splits acumulados, segmentos y ghost para Results y `StorageService.completeFloor`.

Práctica conserva visualización y comparación, pero su política de elegibilidad impide progreso, PB, segmentos competitivos y ghost. Un anchor intermedio omite intencionalmente hitos previos y reinicia el primer segmento en cero.

## Persistencia y comparaciones

Se mantiene schema `version: 6` y clave `one-more-floor.save.v6`. `bestRunSplits` sólo cambia con un PB; `bestSegments` puede mejorar desde cualquier intento elegible. El ghost sólo cambia con un PB válido. El tiempo teórico devuelve `null` salvo que existan valores finitos y positivos para todos los splits esperados. Los mensajes de persistencia proceden de `CompletionOutcome`, no de predicciones de la escena de nivel.

## Analytics, privacidad e informe

La clave continúa siendo `one-more-floor.analytics.v1`. Se escriben eventos discretos, nunca por frame: inicio, split válido, muerte tipada, reinicio manual, abandono explícito y finalización. Un estado de cierre evita interpretar shutdown técnico como abandono. Al desactivar el ajuste no se agregan eventos ni se borran los existentes.

La validación conserva contadores por modo, causas, sources, anchors, tiempos de finalización y segmentos, descartando aisladamente entradas corruptas y aplicando límites. AnalyticsScene calcula agregados locales, muestra “MUESTRA INSUFICIENTE” cuando corresponde y copia JSON de texto sin URL, user agent, bindings ni almacenamiento completo. No existe telemetría remota.

## Validación y tests

`check:levels` importa las cinco definiciones reales mediante Vitest y comprueba IDs, orden y dimensiones de splits, proximidad de meta, anchors, salida, timings y límites geométricos básicos. Es una validación estructural; no demuestra que un piso sea completable.

Las suites cubren orden, duplicados, anchors, finalización única, records, tiempo teórico completo/parcial, persistencia y validación de analytics, estadísticas puras y estructura de niveles. Playwright conserva reporter list con trace, screenshot y video apagados, mantiene el hotfix de teclado mediante `page.keyboard` y agrega observación de splits y AnalyticsScene.

## Limitaciones

La mediana, dispersión y balance sólo son descriptivos de datos locales; muestras pequeñas no permiten conclusiones fuertes. La automatización no reemplaza playtesting humano, hardware gamepad diverso ni evaluación de accesibilidad asistida. Las verificaciones geométricas no son una prueba formal de traversabilidad.
