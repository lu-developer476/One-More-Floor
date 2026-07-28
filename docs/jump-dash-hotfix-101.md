# Hotfix de salto y dash 1.0.1

## Causa raíz

El controlador 1.0.0 trataba `DASHING` como un movimiento excluyente. Al iniciar el dash usaba una asignación de velocidad de dos ejes con Y igual a cero; cada frame activo volvía a fijar Y en cero y retornaba antes de procesar salto, buffer y liberación. El inicio del dash también retornaba antes del salto. Por eso el orden accidental de evaluación descartaba uno de dos inputs simultáneos y un dash aéreo producía una pausa vertical.

## Ajuste del salto

| Parámetro           | 1.0.0 | 1.0.1 |
| ------------------- | ----: | ----: |
| `jumpSpeed`         |   535 |   620 |
| `wallJumpY`         |   505 |   590 |
| `jumpCutMultiplier` |  0.46 |  0.60 |

La gravedad permanece en 1520. Las alturas balísticas de referencia son aproximadamente 126.45 px para el salto y 114.51 px para el wall jump. Coyote, buffer, límite de caída, impulso horizontal de pared y lock de dirección no cambian.

## Composición por ejes

El salto establece principalmente Y. El dash establece X con `setVelocityX`, conserva Y y deja que la gravedad continúe. La autoridad del dash es `now < dashEndsAt`, no el estado visual. `DASHING` sigue disponible para animación, HUD, debug y E2E sin bloquear el salto.

La finalización es explícita e idempotente. Tanto por tiempo como por pared aplica 0.58 sólo a X, restaura el límite horizontal y limpia el feedback. El siguiente estado visible se deriva inmediatamente del contacto y de Y, por lo que vuelve a `JUMPING`, `FALLING`, `IDLE` o `RUNNING`.

## Orden de resolución

Cada frame lee input y contactos; actualiza coyote y disponibilidad; encola el salto; termina un dash que chocó o venció; consume un salto legal; inicia el dash; aplica movimiento horizontal; aplica jump cut y wall slide; y finalmente actualiza estado, visuales y valores anteriores. Así Space y S en el mismo frame producen exactamente un evento de cada capacidad, primero Y y después X.

## Pruebas

Las pruebas unitarias fijan los parámetros, las alturas teóricas, el contrato horizontal del inicio y final de dash, el buffer legal sin doble salto, el orden de composición y el título exacto. Los E2E usan teclado real para salto→dash, dash→salto, input simultáneo, salto completo y dash durante caída. Los flujos existentes conservan controles, splits, muerte, reinicio, pausa, Tower Run, práctica y ghosts.

## Compatibilidad

El schema continúa siendo `one-more-floor.save.v9`; no existe migración. PB, splits, mejores segmentos, Tower Records, analytics y progreso se conservan. Los ghosts anteriores pueden reproducir la física 1.0.0; las grabaciones nuevas capturan las posiciones resultantes de 1.0.1 sin recalcular datos guardados.

## Limitaciones

La fórmula balística es una referencia, no sustituye la integración Arcade Physics ni las colisiones. La validación física depende de Chromium disponible en CI. La compatibilidad con gamepads físicos continúa requiriendo hardware real; sus bindings no fueron modificados.
