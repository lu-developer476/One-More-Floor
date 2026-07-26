# Auditoría de splits y analytics — v0.7.0

## Estado inicial real

La revisión de `80db4ff` confirmó estado duplicado entre `LevelScene` y
`AttemptSession`, reinicios que omitían modo y anchor, anchors porcentuales,
persistencia indivisible, asignaciones por frame y ausencia de hysteresis.

Antes de editar, `check:text-only` pasó con 86 archivos. `npm ci` falló con HTTP 403
al obtener `playwright-core`; por eso `validate` no encontró Phaser/Vitest y Playwright
no estuvo disponible. E2E no se considera aprobado.

## Arquitectura y privacidad

`AttemptSession` posee contexto inmutable, tiempo, recorder, elegibilidad, splits,
muertes y ciclo de vida. `SplitTracker` es puro y ordenado. Storage v6 aplica progreso,
PB, rango y ghost independientemente; separa splits del PB y mejores segmentos.

Analytics usa almacenamiento separado, sin red ni datos personales. Conserva agregados
acotados: 100 tiempos por piso, 50 por segmento y 64 sources. Puede desactivarse sin
borrar datos, y la corrupción no afecta el save principal.

Los anchors son explícitos. `check:levels` realiza validación estructural, no garantiza
que un nivel sea completable. El balance, la geometría fina y gamepads reales requieren
playtesting humano.
