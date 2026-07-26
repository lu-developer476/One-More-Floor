# Auditoría inicial de producción 0.4.0

La revisión partió del commit `61097fe` (versión declarada `0.3.0`). Antes de editar se ejecutaron `npm install` y `npm run validate` (16 tests unitarios, typecheck, lint y build correctos) y se inició Vite localmente.

## Hallazgos confirmados

- Reactor declaraba una puerta temporizada en `doors`, pero `LevelFactory` no construía ninguna; sólo construía la salida.
- Boot registraba `player-idle` y `player-run`, pero `Player.update` reemplazaba la textura manualmente en cada frame.
- `LANDING` y `LOCKED` existían en el enum, pero el controlador nunca transitaba a ellos.
- El aterrizaje consultaba la velocidad vertical después de resolver el contacto y podía perder el impacto.
- Ventiladores y cintas sumaban `force / 60` y `speed / 30` desde callbacks, por lo que dependían de la frecuencia física y las cintas aceleraban sin límite.
- Ajustes cambiaba volumen, shake y flashes como un único preset.
- La pausa era un texto del HUD, sin opciones.
- `AudioService` no estaba instanciado ni conectado.
- Fullscreen se accionaba sin sincronizar el guardado; mute y contraste se guardaban sin aplicación efectiva.
- No existía Playwright ni cobertura de navegador.
- Configuraciones, tipos, factory, UI, audio, estados y varios tests estaban comprimidos en una sola línea.

## Alcance de verificación

Se inspeccionaron las cinco definiciones y se arrancó el servidor de desarrollo. En este contenedor no había un navegador ni binarios Playwright disponibles durante la auditoría inicial, por lo que esa fase no se presenta como playtesting humano de los cinco pisos.
