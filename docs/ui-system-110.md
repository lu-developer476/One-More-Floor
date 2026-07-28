# Sistema de UI 1.1.0

## Principios
Cada escena comunica ubicación, información prioritaria, foco, consecuencia, salida, peligro, bloqueo y prompt del dispositivo. `ScreenShell` reserva 24 px de safe area, separa header, contenido y footer, y publica metadata de auditoría sólo con `VITE_E2E`.

## Tokens y jerarquía
`UiTokens` centraliza la paleta industrial azul oscuro/cian/amarillo/blanco/rojo, tipografía monoespaciada, escala 4/8/12/16/24/32/48, target mínimo de 44 px y canvas lógico 960×540. Texto principal usa 16 px como mínimo; 14 px queda limitado a metadata. `contrastRatio` permite verificar WCAG sin imágenes.

## Componentes
- `ScreenShell`: safe area, título, contexto y footer.
- `panel` y `button`: superficies consistentes, foco compuesto, pointer y peligro explícito.
- `FocusModel`: navegación circular que omite elementos deshabilitados y restaura por id.
- `ConfirmDialog`: modal con botones reales, foco izquierda/derecha y cancelación inicial para peligro.
- `ToastController`: canal único reemplazable con variantes información, éxito, advertencia y error.
- `UiCopy`: nombres humanos de acciones, dispositivos y estilos.
- `UiAudit`: bounds, copy, foco y semántica; nunca imágenes ni saves.

Los conceptos de toggle, slider, tabs, sección, scroll list, keycap, badge, progreso y empty state se componen con `ScreenShell`, paneles y botones para no crear gestores de input por componente.

## Navegación
Teclado y mando usan el `InputManager` de la escena. Hover mueve el foco y click ejecuta la misma acción. Back regresa al nivel anterior. Los modales capturan el foco; una acción peligrosa empieza en cancelar. Cada escena elimina su manager y listeners al apagarse.

## Copy y accesibilidad
Todo label visible usa español humano; enums permanecen internos. El foco combina borde grueso, superficie y texto, por lo que no depende sólo del color. Alto contraste debe conservar estas señales. No se emplean flashes continuos ni tweens infinitos.

## Responsive
Phaser conserva 960×540 y escala FIT centrado. Todo contenido vive entre x=24…936 e y=24…516. El footer ocupa su banda propia. Las listas largas deben paginar o desplazar el contenido manteniendo el foco visible.

## Regla para escenas futuras
No introducir estilos hexadecimales, tamaños, prompts o hit areas locales. Registrar auditoría bajo `VITE_E2E`, describir acciones destructivas, ofrecer cancelación y probar copy, contraste, bounds y limpieza sin snapshots visuales.
