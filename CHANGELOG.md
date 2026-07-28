# Changelog

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
