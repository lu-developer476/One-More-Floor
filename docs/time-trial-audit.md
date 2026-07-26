# Auditoría de producción — v0.5.0

## Estado inicial observado

La copia local inspeccionada estaba en v0.4.0, con Phaser 3.90, TypeScript estricto, cinco definiciones data-driven, guardado v3, Vitest y Playwright. La auditoría encontró un SVG que encapsulaba un PNG, referencia de la captura en README, diagnósticos binarios de Playwright (`trace`, screenshot y video), reporter HTML y subida de artifacts en CI. No había extensiones binarias versionadas separadas.

La ejecución inicial de `npm ci` falló con HTTP 403 al obtener `playwright-core`; como consecuencia, el intento inicial de E2E no encontró el ejecutable. Este problema de acceso del entorno no era un error del proyecto y queda registrado antes de los cambios.

## Diseño temporal

`RunCountdown` controla texto, tweens y eventos `3/2/1/GO`. `LevelScene` bloquea al jugador y retorna antes de avanzar tiempo, collapse, recorder, ghost, hazards, plataformas o ambiente. Tras GO se desbloquea el estado y comienza el delta limitado a 50 ms. Pausa, muerte, finalización y transición detienen la ruta completa de update.

El tiempo de intento es independiente del restante de collapse y del total de campaña. No usa timestamps absolutos.

## Recorder y reproducción

`RunRecorder` toma muestras a 20 Hz, independientemente de FPS. Registra tiempo relativo, X/Y cuantizados a medio píxel, facing y estado visual. El límite es 120 s, 2.401 muestras y 180.000 caracteres JSON. Valores no finitos, coordenadas fuera de rango, intervalos, orden, estados o pisos inválidos se rechazan.

`GhostPlayer` crea un sprite sin cuerpo, detrás del jugador, con tint y alpha. `GhostInterpolation` interpola ambos ejes y conserva un cursor incremental; no ordena ni crea sprites por frame. Pausa/countdown detienen su tiempo porque reciben sólo tiempo de gameplay.

## Migración y recuperación

La clave v4 almacena JSON textual. Si falta, se prueban v3 y v2, luego v1. Cada registro se reconstruye por campo; un ghost corrupto queda en `null` sin perder PB, muertes, rango, otros pisos o settings. `showGhost` migra a `true`. Sólo un tiempo estrictamente mejor puede reemplazar el ghost.

Ajustes ofrece borrado separado de ghosts, récords o progreso y solicita confirmación mediante diálogo del navegador.

## Política text-only

Se eliminó `docs/screenshots/gameplay.svg` y no se creó reemplazo. El script sin dependencias `scripts/check-text-only.mjs` inspecciona exclusivamente archivos versionados y falla por extensiones prohibidas, output generado, SVG con elementos de imagen, data URLs, contenido base64 y archivos sospechosos de gran tamaño. Package lock, Markdown, TypeScript grande y SVG vectorial puro son aceptados.

Playwright usa reporter de consola y desactiva trace, screenshot y video. CI no sube artifacts y ejecuta la política antes del build.

## Limitaciones

No hay ghosts remotos, delta competitivo en vivo, exportación ni compresión. El recorder deja de muestrear al alcanzar límites. El feedback visual debe verificarse con playtesting manual; por política no se producen screenshots, videos ni snapshots de canvas.
