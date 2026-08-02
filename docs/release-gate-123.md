# Puerta de release 1.2.3

## Base y auditoría inicial

La rama `chore/release-gate-v123` parte de `5a8164829604ddfed451e4b9a5f9c277b96f1dc1`. El intento de sincronizar `origin/main` no pudo ejecutarse: el proxy respondió HTTP 403 al conectar con GitHub. Por eso no se afirma que la base remota estuviera verde ni actualizada.

El entorno inicial fue Node 24.15.0 y npm 11.4.2, distinto del Node 22.12.0 fijado para CI. `npm ci` se ejecutó, duró 7 s y terminó con código 1 por HTTP 403 al descargar `@playwright/test`; no hubo instalación parcial aceptada. Después de esa limpieza, los comandos que necesitan dependencias fallaron de forma consecuente. `check:text-only`, `check:version` y `check:ui:static` sí terminaron con código 0 (2 s cada uno). `check:levels` (1 s, 127), typecheck (5 s, 1), lint (2 s, 2), unitarios (2 s, 127), build (4 s, 1), E2E (2 s, 127), smoke (2 s, 127), runtime UI (2 s, 1) y validate (4 s, 127) no pasaron. No hubo conteos reales de tests porque Vitest y Playwright no llegaron a ejecutarse. El warning observado fue la configuración npm `http-proxy` desconocida.

## Contratos de la puerta

- `.nvmrc` y `engines` fijan Node 22.12.0 y npm 10 o superior; `npm ci` conserva el lockfile.
- `check:lockfile` compara identidad, versión, dependencias raíz, formato 3, orígenes inseguros, referencias locales y conflictos.
- `verify:static` reúne política textual, versión, lockfile, UI, niveles, tipos, lint, unitarios, build y `check:dist`. `validate` es sólo su alias.
- `verify:browser` reúne E2E, smoke local y auditoría UI. `verify:release` ejecuta ambas puertas.
- Vite emite un `release.json` textual y estático con sólo nombre, versión, commit seguro, schema 11, ruleset 2 y entorno production. `check:dist` rechaza harness, debug, saves, reportes, sourcemaps, rutas locales, assets ausentes y contenido incrustado.
- El puente accesible recibe eventos tipados, usa `textContent`, evita duplicados y actualizaciones por frame, y elimina su único nodo al destruirse.
- El fixture común captura `console.error`, `pageerror` y rechazos no manejados. Los helpers semánticos usan entradas reales; el harness observa objetivos locales pero no sustituye la entrada.
- El smoke desplegado valida primero el manifiesto (hasta cinco intentos separados por 15 s), luego metadata, estados accesibles y transiciones de teclado sin habilitar el harness.

## CI, deploy y configuración manual

`Validate project` y `Browser acceptance` son jobs separados y bloqueantes, con reporter de lista y sin artifacts visuales. `Deployed smoke` es manual para no confundir propagación de Render con aceptación. La protección de rama y ambos checks requeridos deben configurarse manualmente según `required-checks.md`; ningún workflow hace merge.

## Evidencia final

Los resultados finales deben reemplazar o complementar esta sección únicamente después de ejecutar los comandos. Un test escrito es `NOT RUN` hasta que su proceso termine con código 0; la presencia de un spec nunca se informa como PASS. En este entorno la restricción HTTP 403 impidió restaurar dependencias y, por tanto, impide afirmar que la release fue aceptada localmente. CI deberá proporcionar la evidencia real antes del merge.

### Corrección posterior de CI

La primera ejecución del PR detectó dos defectos reales de la propuesta: un import de `MOVEMENT` quedó sin uso después de retirar la UI de debug, y `check:dist` confundía implementaciones internas de loaders/texturas de Phaser con contenido emitido por la aplicación. Se eliminó el import y el auditor ahora separa explícitamente el chunk vendor, cuya procedencia e integridad quedan fijadas por `package-lock.json`, de los chunks propios que siguen sujetos a la prohibición de contenido embebido y rutas locales.

Después de la corrección, `verify:static` terminó con código 0: 2 tests de niveles y 125 tests unitarios pasaron; typecheck, lint, build y `check:dist` también pasaron. La colección E2E enumeró 32 tests válidos. Chromium no pudo descargarse localmente porque todos los endpoints de Playwright respondieron HTTP 403, por lo que no se presenta la suite de navegador local como aprobada; el job de GitHub instala Chromium efímeramente y sigue siendo la autoridad bloqueante.
