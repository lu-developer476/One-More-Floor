# One More Floor v0.9.0 — Tower Run

## Estado inicial auditado

`main` disponible localmente correspondía a v0.8.0. No había una sesión persistente de torre: `totalElapsedMs` viajaba entre escenas, el save v6 sólo tenía pisos, Results construía el siguiente nivel directamente y su prompt anunciaba una tecla de menú que no procesaba. El menú listaba los cinco pisos en bloques de dos líneas hasta invadir el footer. Analytics usaba módulo cinco, copiaba con cualquier confirmación y no limpiaba todos sus listeners de puntero. La descarga de dependencias quedó bloqueada por HTTP 403 del entorno después de ejecutar `npm ci`; la auditoría deja esa limitación explícita.

## Arquitectura

`RunMode` conserva elegibilidad (`competitive`, `practice`, `assisted`) y `RunScope` expresa `floor` o `tower`. Los builders centrales crean contextos completos y resuelven el anchor inicial desde la definición real de cada piso.

`TowerRunSession` es una autoridad pura, sin Phaser. Valida orden, duplicados, estado, tiempo de gameplay, muertes y resultados; sólo completa después del último piso. Su representación textual serializable es validada al restaurarse.

## Checkpoint y reanudación

`one-more-floor.tower.v1` contiene versión, modo, estado, piso siguiente, acumulados, resultados, elegibilidad e identificador textual. Se guarda entre pisos. Una recarga comienza el piso actual desde su anchor inicial: conserva únicamente pisos terminados y descarta posición, input y tiempo parcial. Corrupción elimina sólo el checkpoint.

## Persistencia v7 y récord global

`one-more-floor.save.v7` migra defensivamente v1–v6 y agrega `tower`. El récord global se actualiza únicamente al completar cinco pisos competitivos. Assisted y abandonos nunca escriben PB/rango global. Los récords, segmentos y ghosts individuales siguen pasando por `StorageService`; no existe ghost global.

El rango global deriva sus límites de la suma de `targetTimeMs`, los multiplicadores S/A/B ya usados por los pisos y límites de muertes escalados por `LEVELS.length`.

## Flujo y UI

Menu → TowerSetup → pisos/resultados intermedios → Ending procedural → TowerResults. El menú compacto deriva sus posiciones dentro de 960 × 540 y FloorSelect concentra pisos, bloqueo, PB, rango, ghost y teórico. Ending usa Rectangle, Text y Tween creados en runtime y tiene un guard para no abrir resultados dos veces.

## Analytics

Los agregados locales de torre incluyen intentos por modo, completados, abandonos, tiempos, muertes, piso de abandono y muertes por piso. No hay red ni telemetría remota; los historiales están limitados.

## Pruebas

Se añadieron pruebas puras para ciclo, orden, duplicados, serialización, corrupción, abandono, builders, anchors y límites de rango. El harness E2E permanece condicionado por `VITE_E2E`; Playwright mantiene trace, screenshot y video desactivados.

## Limitaciones

No se restaura una posición dentro de un piso ni existe ghost global. localStorage puede rechazar escrituras por cuota o modo privado. El entorno de trabajo devolvió HTTP 403 al descargar Playwright/dependencias, por lo cual los comandos que dependen de la instalación no pudieron verificarse localmente en la auditoría inicial.
