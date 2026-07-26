# One More Floor

Juego 2D de plataformas de precisión: atravesá un piso industrial en colapso y alcanzá el ascensor antes de que termine la cuenta regresiva de 45 segundos.

> Superar un piso más antes de que todo se derrumbe.

## Características

- Movimiento con aceleración, control aéreo, salto variable, *coyote time* y *jump buffering*.
- Salto en pared, deslizamiento y dash aéreo con estela.
- Piso corto con plataformas, pinchos, plataforma móvil, pozo de dash y ascensor.
- Colapso visual, alerta final, muerte y reintento automático en menos de un segundo.
- HUD superpuesto, pausa, gamepad, resultados y mejores marcas persistentes.
- Placeholders generados por código: no se necesitan recursos remotos.

## Controles

| Acción | Teclado | Gamepad |
|---|---|---|
| Mover | A/D o flechas | Stick izquierdo / cruceta |
| Saltar | W, ↑ o espacio | Botón inferior (A) |
| Dash | Shift | RB/RT |
| Reiniciar | R | — |
| Pausa | Escape | Start |
| Pantalla completa | F (menú) | — |

## Requisitos e instalación

Node.js 20.19+ (o 22.12+) y npm.

```bash
npm install
npm run dev
```

Vite mostrará la URL local. Para producción: `npm run build`; para revisar el resultado: `npm run preview`.

## Calidad y pruebas

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run format
```

Agregá `?debug` a la URL del servidor de desarrollo para visualizar cuerpos Arcade. La depuración queda desactivada en producción.

## Estructura

- `src/config`: física, movimiento y definición de pisos.
- `src/scenes`: arranque, menú, nivel, HUD y resultados.
- `src/entities`, `src/objects`: jugador y objetos físicos.
- `src/states`: máquina de estados del jugador.
- `src/systems`: temporizador, colapso, reaparición, niveles y estadísticas.
- `src/services`: persistencia validada y fachada de audio preparada para assets futuros.

## Decisiones técnicas

Arcade Physics ofrece colisiones deterministas y simples para el alcance del MVP. La resolución interna es 960×540, con `FIT`, centrado y pixel art. Los valores de movimiento están centralizados. Las escenas se comunican con eventos, el HUD no modifica físicas y `LevelManager` permite sumar definiciones o migrar luego a Tiled sin volverlo una dependencia. La música y efectos no incluyen archivos todavía; `AudioService` ignora claves inexistentes de forma segura.

Para sumar un piso, incorporá una definición en `levelConfig.ts`, construí su geometría (o un adaptador de Tiled) y hacé que `LevelManager` seleccione el índice. Conservá cada piso corto y probá su ruta con teclado y gamepad.

## Scope

Este MVP **no incluye** combate, enemigos, inventario, campaña, multijugador, generación procedural, editor interno ni sistema narrativo. Tampoco agrega armas, economía, crafting o cinemáticas.

## Próximos pasos

Validar y ajustar el movimiento mediante playtesting, añadir audio local, extraer la geometría a datos, incorporar un segundo piso y sumar pruebas de integración en navegador.

## Licencia

Pendiente de definir. El archivo `License` existente se conserva sin cambios.
