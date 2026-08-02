# Aceptación de enemigos — v1.2.2

## Auditoría inicial

La base real disponible fue `9cbc794`, correspondiente al cierre de PR #21. El checkout no incluía remoto ni referencias de `main`, por lo que no fue posible hacer fetch, consultar PR #21 en GitHub ni verificar sus jobs. `npm ci` se intentó antes de editar y falló con HTTP 403 al descargar `@playwright/test`; por ello ningún comando posterior que dependa de `node_modules` se presenta como ejecutado o aprobado. La cobertura anterior sólo comprobaba un recorrido corto de movimiento, pausa, countdown y reinicio; no aceptaba físicamente todos los estados y rutas solicitados.

## Contrato de peligro y contacto

Cada actor expone por separado actividad lógica, visibilidad de cámara, peligro de contacto, ataque y posibilidad de desactivación. Patrol y turning del autómata, y patrol, alert, charge y recover del dron, conservan contacto peligroso mientras el actor está despierto y el intento corre. Sólo charge declara `attacking`. Disabled, pausa, countdown, muerte y sueño de cámara eliminan inmediatamente peligro y desactivación.

La resolución de contacto es una función pura que recibe el contrato lógico: ignora un jugador muerto o un actor inactivo, prioriza un dash realmente activo y, después, resuelve contacto mortal. No consulta sprites, texturas, alpha ni snapshots de debug.

## Side effects y sonido duplicado

Los métodos `disable()` sólo mutan actor, cuerpo, presentación, velocidad, tween y telegraph. `EnemySystem` es la única autoridad del outcome: reproduce una vez `enemyDisabled` y ejecuta una vez el callback que produce toast y analytics. Alert y charge se emiten por transición mediante un sink y quedan bloqueados durante suspensión, muerte o destrucción.

## Blockers, cámara, pausa y destrucción

Las plataformas sólidas se convierten una vez a blockers estáticos. Las puertas conservan wrappers dinámicos mutables cuyo flag `active` se actualiza sin reconstruir arrays. Los contadores `staticBlockerCount`, `dynamicBlockerCount` y `blockerRebuildCount` están disponibles sólo en el harness E2E.

El loop usa getters baratos y nunca `debug()` como gameplay. El sueño de cámara detiene velocidad y oculta telegraph/outline; el despertar conserva estado y timers. Pausa y countdown detienen IA y hacen el contacto inocuo. Muerte usa una transición semántica distinta de reanudación. `SecurityDrone.destroy()` limpia recursos propios antes de la limpieza base y tolera una segunda llamada o un telegraph ya destruido.

## Enemy Lab y rutas físicas

No se añadió un piso, modo ni contenido visible. El harness sigue compilándose únicamente con `VITE_E2E=true`; expone estado y contadores de aceptación sin publicar una API de debug. Las pruebas de rutas deben operar sobre los pisos reales 2–5 y Tower Run, sin `e2eComplete()` para omitir encuentros. En este entorno no fue posible ejecutar Chromium por el fallo de instalación descrito, por lo que esas rutas no se declaran verdes.

## Rendimiento

El update no crea snapshots debug ni arrays/wrappers de blockers. Los Graphics, colliders, listeners y texturas continúan creándose fuera del loop. El snapshot debug se construye sólo bajo demanda desde el harness o panel técnico.

## Producción local y deployed smoke

El E2E local construye con `VITE_E2E=true` y puede observar contratos internos. El smoke desplegado no observa estados internos: comprueba respuesta HTTP, título exacto, versión accesible, canvas, navegación, teclado, pausa/reanudación y errores de navegador. El smoke no constituye prueba de IA enemiga.

## CI y resultados

CI mantiene jobs bloqueantes separados: Validate y Browser tests. Chromium se instala efímeramente, y Playwright tiene screenshots, video y traces desactivados; no se suben artifacts. Resultado local inicial: `npm ci` falló con HTTP 403; el resto de la matriz quedó no ejecutable al no existir dependencias. El PR no debe fusionarse hasta que ambos jobs remotos estén verdes. No se generaron capturas ni binarios.
