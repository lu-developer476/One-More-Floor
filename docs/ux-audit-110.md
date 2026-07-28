# Auditoría UX/UI 1.1.0

## Estado inicial (v1.0.1)
No había remoto configurado; `main` disponible se estableció en `70219f5` y la tarea se desarrolló en `feat/user-centered-ui-v110`. La auditoría encontró escenas registradas con estilos locales repetidos, filas de 13–15 px, targets basados en texto, prompts hardcodeados y nombres internos en Ajustes y Controles. Menú mezclaba hasta nueve acciones; Ajustes tenía 19 filas; Controles mezclaba dispositivo, bindings y salida; Ayuda era una pared única; ConfirmDialog no tenía foco navegable explícito.

`npm ci` inicial falló con HTTP 403 al descargar Playwright; después faltaron dependencias locales. `check:text-only` y `check:version` sí pasaron inicialmente. Los comandos dependientes de Vitest, Phaser, ESLint, Vite o Playwright quedaron bloqueados por esa limitación de entorno, no por Chromium verificado.

## Revisión por escena
| Escena | Objetivo / primaria / foco inicial | Back y dispositivos | Texto / visibles / peligro | Hallazgo y corrección |
|---|---|---|---|---|
| Menu | elegir experiencia / iniciar o continuar / primaria | prompts dinámicos; teclado, mando y pointer | 14 metadata; 7–9 acciones; abandonar | lista plana reemplazada por tarjeta Tower Run, exploración y footer; créditos ahora son escena |
| FloorSelect | elegir piso / jugar / primer habilitado | vuelve a menú | 16; lista acotada; bloqueos | requiere migración completa a componentes compartidos |
| TowerSetup | entender modo / comenzar / competitivo | vuelve al menú | 17; 2 modos | tarjetas explicativas son la regla documentada |
| RunSetup | elegir modo/anchor / jugar / modo | vuelve | 20; acotado | prompts deben evitar recargar Storage por foco |
| Level + UI | jugar / llegar a salida / gameplay | pausa; ambos dispositivos | HUD 14 metadata | gameplay y parámetros permanecen intactos |
| Pause | reanudar / continuar / continuar | P/Escape | 21; salida peligrosa | orden existente auditado; pendiente adoptar shell |
| Results | comprender marca / siguiente piso / primaria | menú/repetir | 18; métricas | jerarquía de tiempo-rango-PB documentada |
| TowerFloorResults | continuar torre / continuar / continuar | abandonar | 16; una peligrosa | checkpoint visible; pendiente modal peligro completo |
| Ending | cerrar secuencia / continuar | confirmar | 14 metadata | no cambia gameplay |
| TowerResults | comprender total / nueva run / primaria | menú | 15–16; acciones | tabla requiere paginación futura |
| Settings | ajustar preferencias / categoría activa | vuelve al origen | 14 inicial; 19 filas; borrar todo | auditoría confirma necesidad de categorías y zona de peligro |
| Controls | remapear / cambiar binding / primera fila | volver a ajustes | 14 inicial; 18+ filas | `UiCopy` elimina exposición de nombres internos en nueva arquitectura |
| Analytics | encontrar conclusiones / sección | vuelve | 15; secciones | requiere integrar tabs y toast común |
| Help | aprender sólo un tema / seleccionar sección / objetivo | vuelve al menú | 18; 6 tabs | pared de texto reemplazada por secciones navegables y prompts reales |
| Credits | conocer autoría / volver / salida | teclado, mando | 14 metadata | nueva escena real, separada del menú |
| Modal/onboarding | decidir con contexto / acción explícita | back cancela; pointer y horizontal | 16; 2 botones; tipo peligro | botones de 48 px, foco visible y cancelación inicial en peligro; onboarding se guarda al confirmar |

## Responsive y límites
La verificación es metadata, no screenshots. Se consideran 1920×1080, 1366×768, 1280×720, 1024×768, 960×540, 800×600, ventana pequeña y fullscreen mediante el canvas FIT 16:9. `UiAuditSnapshot` expone sólo escena, título, foco, items, textos y paneles.

## Parámetros protegidos
No se editaron Player, movementConfig, LevelFactory, niveles, sesiones, ghosts, records, splits, checkpoints, analytics, persistencia ni bindings predeterminados. Se conservaron salto 620, wall jump 590, corte 0.60, gravedad 1520; dash 675/220/230/0.58 y salto + dash.
