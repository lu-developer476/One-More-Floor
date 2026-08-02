# One More Floor v1.1.2 — aceptación de producto

## Auditoría inicial

Se intentó sincronizar `origin/main` antes de crear `fix/product-acceptance-v112`; el túnel HTTPS del entorno respondió 403. La rama parte del `main` local en `d57f653`. `npm ci` online también respondió 403; `npm ci --offline` restauró exactamente el lockfile desde caché.

Antes de editar, `check:text-only`, `check:version` y el antiguo `check:ui` pasaban. Este último sólo buscaba el texto `ScreenShell`, pese a títulos, fondos y listas duplicados. Tras el `npm ci` online fallido, los checks dependientes de paquetes fallaron por módulos ausentes; no se contabilizaron como defectos del producto. GitHub Actions no pudo consultarse por la misma restricción de red.

## Interfaz funcional

`ScreenShell` es la autoridad de fondo, safe area, título, contenido y footer. Los botones compartidos registran semántica, hit area, estado, foco y panel padre; `UiFocusController` mantiene una sola selección visual y limpia su ciclo de vida.

Ajustes usa cinco categorías tipadas. La categoría activa reconstruye el panel derecho y ofrece slider de volumen, toggles de accesibilidad y jugabilidad, acceso a controles y subsecciones reales de datos locales. Restaurar ajustes queda separado de la zona destructiva.

Controles presenta tabs Teclado/Mando y bindings agrupados. Zona muerta y estilo existen sólo en Mando. La captura oscurece el fondo y comunica asignación actual y cancelación.

Pisos conserva una snapshot de save durante toda la escena: hover y foco no leen storage. Sus tarjetas informan estado, rango y PB; el detalle explica bloqueos sin emoji. Resultados separa resultado, progreso y acciones; el siguiente piso se resuelve con `LEVELS`, nunca con un caso especial.

## Persistencia y migración

`CompletionOutcome` separa elegibilidad, cambio en memoria y resultado real de `save()`, además de desbloqueos anterior/actual/nuevo. `completeFloor()` carga y guarda una vez. Results consume `outcome.save` y advierte si la escritura falla.

`load()` ya no escribe ante una lectura válida. Sólo persiste una migración o una reparación cuyo JSON cambió. Los helpers E2E instalan saves mediante `addInitScript` antes de `goto`; la migración v8→v9 deja de insertar datos legacy después del arranque.

## Gameplay congelado

Los valores de salto, doble salto, gravedad y dash permanecen intactos. La regresión unitaria incluye veinte ciclos de aterrizaje y restauración del único salto aéreo. Mantenimiento conserva sus pinchos finales de 160 px y la configuración completa de pisos no cambió.

## Validación y CI

`check:ui:static` valida contratos y patrones prohibidos, sin aceptar una escena por un import. `check:ui:runtime` abre Chromium y valida snapshots automáticos: título único, foco, roles, tipografía, safe area y targets de 44 px. CI instala Chromium con dependencias y ejecuta E2E, smoke y auditoría runtime sin capturas, videos, traces, HTML ni artifacts.

El smoke desplegado exige título `One More Floor`, versión 1.1.2, navegación principal y ausencia de errores. Debe ejecutarse contra Render después de que la revisión despliegue exactamente este commit; el repositorio no incorpora imágenes, capturas ni binarios.
