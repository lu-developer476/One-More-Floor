## 1.2.2

### Fixed

- La desactivación de drones ya no reproduce efectos duplicados.
- Los estados enemigos poseen un contrato de peligro consistente.
- Los enemigos dormidos o pausados no producen contacto mortal.
- La destrucción de drones limpia siempre el actor completo.
- Los blockers estáticos ya no se reconstruyen en cada frame.
- Contacto, pausa, cámara y reinicio poseen cobertura real de navegador.

### Testing

- Aceptación E2E de autómatas y drones.
- Rutas físicas de pisos 2–5.
- Pruebas de paredes y puertas.
- Validación diferenciada de build de producción y deploy.

## 1.2.1

### Fixed

- Sincronización Arcade, gravedad, límites y bloqueos de paredes y puertas para enemigos.
- Línea de visión y activación por cámara justas; contacto atómico y estados congelados durante pausa y countdown.
- Selección de práctica por segmentos, Tower Run ruleset 2, save v11 y backups versionados.

### Accessibility

- Siluetas de alto contraste y telegraphs de dron con línea, dirección, progreso y corte en el primer blocker.

## 1.2.0

### Added

- Autómatas de mantenimiento y drones centinela.
- IA determinista, desactivación mediante dash, telegraphs accesibles, analytics local y records por ruleset.

### Changed

- Los pisos 2–5 incorporan encuentros móviles.
- Ayuda y selección de pisos informan amenazas; Tower Run utiliza el nuevo ruleset.

### Fixed

- Los records antiguos ya no se comparan silenciosamente contra niveles modificados.
- Los enemigos se congelan correctamente en pausa y los contactos de dash se resuelven de forma atómica.

## 1.1.2

- Estabilización de aceptación: categorías de Ajustes, tabs de Controles, foco compartido y resultados accionables.
- Persistencia veraz, lecturas sin escrituras redundantes y migración E2E previa al arranque.
- Auditoría UI estática y runtime con Chromium.

## 1.1.1

- Doble salto real y repetible con feedback procedural y HUD accesible.
- MANTENIMIENTO ajustado para un cruce justo y tutorial contextual.
- Progresión por número de piso con reparación segura de partidas.
- Migración de las pantallas restantes al sistema UX/UI compartido.
- Validación y pruebas ampliadas para movimiento, interfaz y navegador.

# Changelog

## 1.1.0

### Added
- Sistema de diseño compartido, navegación y foco unificados, componentes accesibles, categorías de ajustes, escena de créditos y auditoría automática de UI.

### Changed
- Menú principal, ajustes, controles, ayuda, selección de pisos, setup de modos, pausa, resultados, analytics, HUD y modales.

### Fixed
- Textos internos visibles, listas sobrecargadas, jerarquía insuficiente, hit areas pequeñas, acciones destructivas mezcladas, prompts hardcodeados, foco débil y pantallas difíciles de leer.

## 1.0.1

### Changed

- Mayor altura de salto.
- Wall jump vertical más fuerte.
- Salto breve menos agresivamente recortado.

### Fixed

- Salto y dash pueden combinarse.
- El dash ya no elimina velocidad vertical.
- Los inputs simultáneos no se descartan.
- La pestaña muestra solamente One More Floor.

## 1.0.0

### Added

- Onboarding breve, ayuda contextual, intensidad de partículas y gestión de datos por portapapeles.
- Smoke independiente contra el despliegue y verificación central de versión.

### Changed

- La versión se obtiene de `package.json` durante el build.
- ControlsScene ofrece todas sus acciones mediante navegación normal.

### Fixed

- Captura defensiva de teclado y gamepad, recuperación de inicio y reparación aislada de datos.

### Migration

- Se conserva el schema de save v9 y se validan ajustes nuevos con fallback.

### Known limitations

- La compatibilidad de gamepad físico debe verificarse en hardware real.
- Clipboard, Web Audio y fullscreen dependen de permisos del navegador.
