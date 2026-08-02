# Enemigos deterministas — One More Floor 1.2.0

## Filosofía

Los enemigos amplían el lenguaje de plataformas de precisión: son obstáculos móviles legibles, evitables y opcionalmente neutralizables con dash. No hay armas, vida, loot ni puntuación por derrotas.

## Arquetipos y estados

El **Autómata de mantenimiento** patrulla límites horizontales explícitos, invierte su orientación en cada límite o pared y nunca persigue. El **Dron centinela** alterna `patrol`, `alert`, `charge`, `recover` y `disabled`: durante alert fija una dirección y dibuja una línea con triángulos; la carga nunca vuelve a apuntar.

El contacto normal elimina al jugador con causa `enemy` y el ID de origen. Un contacto durante `player.isDashing` deshabilita primero y atómicamente el hitbox enemigo, conserva el dash, el arco vertical, el doble salto y el cronómetro.

## Determinismo y ciclo de vida

Las definiciones son explícitas y la actualización integra deltas limitados a 50 ms. No se usa aleatoriedad, reloj del sistema, pathfinding ni decisiones por frame. Countdown y pausa no avanzan IA. Cada reinicio o transición construye un sistema nuevo; `destroy()` elimina colliders, actores, telegraphs y referencias de escena.

En práctica sólo se instancian enemigos a partir de 120 px antes del anchor seleccionado, evitando que amenazas de tramos anteriores invadan la sección. Tower Run crea enemigos por piso y nunca persiste el estado disabled en checkpoints. Los ghosts carecen de collider y no participan en detección.

## Ubicación

- Piso 1: sin enemigos.
- Piso 2: un autómata en suelo seguro antes del tramo final.
- Piso 3: dos drones fuera del wall jump y de encuentros inevitables con ventiladores.
- Piso 4: un autómata y un dron alejados de puerta, láser y salida.
- Piso 5: un autómata y dos drones después de la introducción.

## Accesibilidad

Siluetas industriales distintas al jugador, orientación geométrica, bordes claros, animación y líneas con triángulos complementan el color. Alto contraste refuerza el borde; reducir flashes evita flashes enemigos; disabled conserva una cruz visible aun sin partículas. Los sonidos son osciladores Web Audio procedurales y respetan mute, volumen y pausa.

## Ruleset y migración

Cada piso declara `rulesetVersion`: piso 1 conserva 1 y pisos 2–5 usan 2. El save v10 (`one-more-floor.save.v10`) migra defensivamente versiones anteriores: mantiene progreso y ajustes, preserva un resumen `previousRuleset` y vacía PB, ghost y splits competitivos actuales de pisos modificados. Tower Run deriva su ruta de los cinco pisos y comienza cada piso con enemigos activos.

## Analytics, pruebas y CI

La muerte registra causa `enemy` y source ID. La arquitectura expone estados al harness y al panel `?debug`. Las pruebas cubren definiciones, contacto atómico y transiciones deterministas, junto con validación de cantidades por piso. CI conserva la política text-only, typecheck, lint, unitarios, build y Playwright sin capturas, videos, traces ni reportes HTML.

## Limitaciones

Los encuentros son fijos y deliberadamente pocos. No hay pathfinding, respawn dentro del intento, interacción con ghosts, recompensas ni combate tradicional. La validación estructural complementa —no reemplaza— las rutas físicas con teclado real.
