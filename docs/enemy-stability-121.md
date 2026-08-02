# Enemy stability audit — v1.2.1

## Auditoría inicial

La revisión de v1.2.0 encontró cobertura unitaria superficial y ningún recorrido E2E dedicado a enemigos. El autómata mezclaba `setX` con Arcade, el dron escribía `x/y` mientras también usaba velocidad, la detección dependía sólo de distancia y `EnemySystem` tenía un lock global sin `finally`. Las puertas no formaban parte del contrato del mundo enemigo. La sincronización remota y la consulta de jobs de GitHub no estuvieron disponibles en el entorno inicial (HTTP 403); esto no se presenta como un resultado de CI.

## Física, blockers y visibilidad

Arcade es la autoridad de movimiento. El autómata usa gravedad del mundo y velocidad horizontal, con estados `patrol`, `turning` y `disabled`; el frame lógico de giro evita inversiones repetidas. El dron calcula objetivos deterministas y los convierte en velocidad, conserva un carril y dirección fija durante charge y vuelve por velocidad durante recover. Plataformas sólidas, puertas cerradas y límites del mundo integran el contrato de blockers. Las puertas abiertas deshabilitan su cuerpo y una puerta no se cierra cuando un actor ocupa el espacio.

`hasEnemyLineOfSight` es una autoridad pura probada con paredes y puertas. Las plataformas one-way horizontales se omiten deliberadamente: sostienen movimiento desde arriba, pero no representan una pared visual. La activación por cámara usa 120 px y una histéresis de sueño de 220 px; un actor dormido no detecta, ataca ni avanza timers. El telegraph se recorta en el primer blocker.

## Contacto, pausa y ciclo de vida

La resolución usa un lock por ID dentro de `try/finally`, ignora contactos posteriores a la muerte y exige `isDashing` junto con tiempo activo real. Countdown mantiene el sistema pausado. Pausa detiene velocidades y timers; al reanudar continúa el estado y tiempo restantes. Destroy elimina colliders, gráficos, tweens y actores de forma idempotente. Los canales de audio incluyen el ID del actor para evitar repeticiones cruzadas.

## Accesibilidad y práctica

El modo de alto contraste dibuja una silueta procedural persistente y una marca geométrica de orientación, sin hitbox ni objetos creados por frame. Alert combina línea creciente, triángulos direccionales y anillo de carga. La práctica selecciona amenazas mediante `activationSplitId` validado, no mediante una tolerancia arbitraria de coordenadas.

## Tower ruleset, save y backups

Tower Run usa `TOWER_RULESET_VERSION = 2`. El save v11 (`one-more-floor.save.v11`) conserva el resumen competitivo anterior en `previousRuleset`, mantiene progreso, records por piso y ajustes, y comienza un PB Tower comparable vacío. El envelope de backup separa `BACKUP_FORMAT_VERSION = 2` de `SAVE_SCHEMA_VERSION = 11`; también acepta explícitamente el envelope legacy schema 9 y rechaza claves inseguras.

## Pruebas y CI

Hay tests puros de línea de visión, corte del telegraph, migración Tower legacy, backups y contacto. `e2e/enemies.spec.ts` valida en Chromium countdown, movimiento, pausa, cámara y reinicio usando teclado real. El smoke de Render exige v1.2.1, título correcto y ausencia de errores. CI conserva jobs bloqueantes Validate y Browser tests, sin screenshots, video, traces, HTML reports ni artifacts. Las rutas físicas de pisos 2–5 deben verificarse en el navegador antes del merge; este documento no sustituye el estado real de los comandos ni del deploy.
