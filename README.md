<h1 align="center">ONE MORE FLOOR</h1>

<p align="center">
  Prototipo 2D de plataformas de precisión construido con Phaser, TypeScript y Vite.
</p>

<p align="center">
  <a href="https://one-more-floor.onrender.com">
    <img src="https://img.shields.io/website?url=https%3A%2F%2Fone-more-floor.onrender.com&label=live%20demo&up_message=online&down_message=offline" alt="Estado de la demo pública">
  </a>
  <a href="https://github.com/lu-developer476/One-More-Floor/actions/workflows/ci.yml">
    <img src="https://github.com/lu-developer476/One-More-Floor/actions/workflows/ci.yml/badge.svg" alt="Estado de integración continua">
  </a>
  <img src="https://img.shields.io/badge/status-prototype-orange" alt="Estado del proyecto: prototipo">
  <img src="https://img.shields.io/badge/Phaser-3.90.0-211f1f?logo=phaser" alt="Phaser 3.90.0">
  <img src="https://img.shields.io/badge/TypeScript-5.8.3-3178c6?logo=typescript&logoColor=white" alt="TypeScript 5.8.3">
  <img src="https://img.shields.io/badge/Vite-7.0.6-646cff?logo=vite&logoColor=white" alt="Vite 7.0.6">
  <img src="https://img.shields.io/badge/Node.js-%3E%3D22.12.0-339933?logo=node.js&logoColor=white" alt="Node.js 22.12.0 o superior">
  <img src="https://img.shields.io/github/last-commit/lu-developer476/One-More-Floor" alt="Último commit">
  <img src="https://img.shields.io/github/repo-size/lu-developer476/One-More-Floor" alt="Tamaño del repositorio">
  <img src="https://img.shields.io/badge/license-All%20Rights%20Reserved-lightgrey" alt="Licencia: todos los derechos reservados">
</p>

<p align="center">
  <strong><a href="https://one-more-floor.onrender.com">PLAY THE DEMO</a></strong>
</p>

<p align="center">
  <img src="docs/screenshots/gameplay.svg" alt="Captura del prototipo de One More Floor" width="900">
</p>

<p align="center"><em>Prototipo actual con gráficos placeholder generados por código.</em></p>

## Sobre el proyecto

**One More Floor** es un prototipo de plataformas de precisión ambientado en una instalación industrial en colapso. El jugador debe atravesar un piso corto, superar obstáculos y alcanzar el ascensor antes de que termine una cuenta regresiva de 45 segundos.

> Superar un piso más antes de que todo se derrumbe.

## Estado actual

El repositorio contiene un **MVP técnico jugable**. Tiene un único piso y utiliza gráficos placeholder generados mediante Phaser. La prioridad actual es validar el movimiento, el ciclo de muerte y reintento y la arquitectura del proyecto.

La versión desplegada todavía no representa la dirección artística final, ni pretende presentarse como una versión comercial terminada.

## Demo

La compilación pública está disponible como sitio estático en Render:

**https://one-more-floor.onrender.com**

## Características

- Movimiento horizontal con aceleración, desaceleración y control aéreo.
- Salto variable, *coyote time* y *jump buffering*.
- Salto en pared y deslizamiento por pared.
- Dash horizontal con disponibilidad aérea y estela visual.
- Piso corto con plataformas, pinchos, plataforma móvil y ascensor de salida.
- Cuenta regresiva, alerta final y efectos visuales de colapso.
- Muerte por peligros, caída o agotamiento del tiempo.
- Reinicio automático rápido y reinicio manual.
- HUD superpuesto, pausa y pantalla de resultados.
- Soporte básico para teclado y gamepad.
- Persistencia de mejores resultados y preferencias mediante `localStorage`.
- Texturas placeholder generadas por código, sin recursos externos obligatorios.

## Controles

| Acción | Teclado | Gamepad |
|---|---|---|
| Mover | `A` / `D` o flechas | Stick izquierdo o cruceta |
| Saltar | `W`, `↑` o espacio | Botón inferior (`A`) |
| Dash | `Shift` | `RB` o `RT` |
| Reiniciar | `R` | — |
| Pausar | `Escape` | `Start` |
| Pantalla completa | `F` desde el menú | — |

## Tecnologías

| Tecnología | Uso | Versión |
|---|---|---|
| Phaser | Motor 2D y gestión de escenas | `3.90.0` |
| TypeScript | Código tipado con configuración estricta | `5.8.3` |
| Vite | Desarrollo y compilación de producción | `7.0.6` |
| Arcade Physics | Movimiento y colisiones | Incluido en Phaser |
| Vitest | Pruebas unitarias | `3.2.4` |
| ESLint | Análisis estático | `9.32.0` |
| Prettier | Formato del código | `3.6.2` |
| localStorage | Persistencia del navegador | API web |
| Render | Hosting de la demo estática | — |
| GitHub Actions | Type-check, lint, pruebas y build | — |

## Arquitectura

El proyecto separa las responsabilidades principales para evitar concentrar toda la lógica en una única escena:

- **Scenes:** arranque, menú, nivel, HUD y resultados.
- **Player:** movimiento, controles y estados del personaje.
- **State machine:** estados como reposo, carrera, salto, caída, pared, dash y muerte.
- **Systems:** temporizador, colapso, reaparición, niveles y estadísticas.
- **Objects:** peligros, plataforma móvil y puerta de salida.
- **EventBus:** comunicación entre el nivel y la interfaz.
- **Config:** valores de movimiento, física y nivel centralizados.
- **Services:** persistencia local y base para audio.

## Estructura del proyecto

```text
.
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   └── screenshots/
│       └── gameplay.svg
├── src/
│   ├── config/
│   ├── entities/
│   ├── objects/
│   ├── scenes/
│   ├── services/
│   ├── states/
│   ├── systems/
│   ├── types/
│   ├── utils/
│   ├── main.ts
│   ├── style.css
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Requisitos e instalación

Requiere Node.js `20.19+` o `22.12+` y npm.

```bash
npm install
npm run dev
```

Vite mostrará la dirección local del servidor de desarrollo.

## Scripts disponibles

| Comando | Función |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo de Vite. |
| `npm run build` | Ejecuta TypeScript y genera la compilación de producción. |
| `npm run preview` | Sirve localmente la compilación generada. |
| `npm run lint` | Ejecuta ESLint sobre el proyecto. |
| `npm run format` | Aplica Prettier a los archivos compatibles. |
| `npm run test` | Ejecuta las pruebas con Vitest. |
| `npm run typecheck` | Valida los tipos sin generar archivos. |

## Build de producción

```bash
npm run build
```

La salida se genera dentro de `dist/`.

Para revisarla localmente:

```bash
npm run preview
```

## Integración continua

El workflow `CI` se ejecuta en cada push a `main`, en pull requests dirigidas a `main` y de forma manual. Valida el proyecto con:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Despliegue en Render

La demo se publica como **Static Site** con esta configuración:

```text
Build Command: npm install && npm run build
Publish Directory: dist
Node.js: 22.12.0
```

No requiere backend, base de datos, secretos ni un comando de inicio.

## Scope

Este MVP no incluye:

- combate o enemigos;
- armas, inventario o economía;
- campaña o narrativa extensa;
- crafting o árbol de habilidades;
- multijugador;
- generación procedural;
- editor interno;
- cinemáticas;
- arte o audio definitivos.

## Limitaciones conocidas

- La presentación visual utiliza placeholders.
- Solo existe un piso jugable.
- Todavía no hay audio definitivo.
- El movimiento necesita más sesiones de *playtesting* y balance.
- La arquitectura está preparada para crecer, pero todavía no fue validada con múltiples pisos.
- Los niveles aún no se importan desde Tiled.

## Roadmap

- [x] Movimiento base.
- [x] Coyote time y jump buffering.
- [x] Salto y deslizamiento en pared.
- [x] Dash.
- [x] Temporizador y colapso visual.
- [x] Peligros, muerte y reinicio.
- [x] HUD, pausa y resultados.
- [x] Persistencia local.
- [x] Demo pública.
- [x] Integración continua.
- [ ] Dirección artística definitiva.
- [ ] Assets y animaciones propios.
- [ ] Audio definitivo.
- [ ] Segundo piso.
- [ ] Integración con Tiled.
- [ ] Playtesting y balance del movimiento.
- [ ] Primera versión publicable.

## Licencia

Copyright © 2026 Lucas Leonel Montenegro Burgos. **Todos los derechos reservados.**

El código está disponible públicamente únicamente para visualización y evaluación. No se concede permiso para usar, copiar, modificar, distribuir, sublicenciar o vender el proyecto sin consentimiento previo y por escrito del autor. Consultá el archivo [`License`](License) para ver los términos completos.
