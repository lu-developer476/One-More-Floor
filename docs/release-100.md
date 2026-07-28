# Release 1.0.0

## Base y reconciliación

La base local de `main` es `442c0d7`. Package, lock, `gameConfig` y menú indicaban 0.9.2. El entorno bloqueó GitHub, Render y npm con HTTP 403/401, por lo que no fue posible demostrar rama/commit de Render ni recuperar una hipotética v0.9.3. No había refs locales adicionales ni commits locales de ControlsScene sin fusionar. La rama es autosuficiente y documenta esta limitación en vez de inventar evidencia.

## Contrato congelado

Se conservaron gravedad, movimiento, geometría y los cinco pisos. Teclado: flechas, Space, S, P y R. Dash: velocidad 675, duración 220 ms, cooldown 230 ms y multiplicador final 0.58. Los bindings predeterminados de gamepad se mantienen.

## Alcance verificado por código

- ControlsScene: teclado/gamepad, todos los bindings, deadzone 0.10–0.90 en pasos 0.05, cuatro estilos, reset y back.
- Tower Run: competitiva/asistida, checkpoints, cinco resultados y elegibilidad existentes.
- Persistencia: schema v9, migraciones legacy, validación seccional, backup sin analytics e importación defensiva.
- Accesibilidad: contraste, flashes, shake, audio, fullscreen, ghost y partículas con fallback.
- Inicio: fallback textual, reintento y restauración de controles.

## Pruebas, rendimiento y deploy

La configuración prohíbe trace, screenshot y video. El build separa Phaser del código propio para medir chunks. La suite desplegada se ejecuta con `OMF_BASE_URL=https://one-more-floor.onrender.com npm run test:deployed`; no usa harness. La validación local completa quedó limitada porque `npm ci` recibió 403 y eliminó dependencias instaladas. No se afirma validación de hardware físico ni CI remota.
