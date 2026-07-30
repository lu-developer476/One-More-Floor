# Correcciones de One More Floor v1.1.1

## Punto de partida: por qué v1.1.0 estaba incompleta

La revisión del estado integrado por el PR #17 (`790c205`) muestra que v1.1.0 terminó MenuScene, HelpScene, CreditsScene, ConfirmDialog y los fundamentos (`UiKit`, tokens, copy, foco y auditoría). SettingsScene, ControlsScene, FloorSelectScene, RunSetupScene, TowerSetupScene, PauseScene, ResultsScene, TowerFloorResultsScene, TowerResultsScene, AnalyticsScene y UIScene/HUD conservaron composiciones planas. El `Player` tampoco tenía carga aérea, velocidad de salto aéreo ni una resolución de salto aéreo: salto con dash, coyote y wall jump no eran doble salto.

La comprobación previa de MANTENIMIENTO encontró una cama final de 220 px entre el último apoyo elevado y la salida. El salto anterior de 620 px/s dejaba un cruce con margen insuficiente para un piso introductorio.

## Doble salto y movimiento

`resolveJump` es la autoridad pura y prioriza suelo, coyote, pared y aire. Una pulsación produce una única decisión. `Player` mantiene una carga (`maxAirJumps: 1`) y registra el último tipo; sólo un aterrizaje restaura la carga. Una pared, techo, trigger, split, hazard, corriente o dash no la restaura. El salto aéreo exige un flanco nuevo, consume una carga y no modifica la autoridad horizontal del dash. El wall jump conserva la carga que existiera, pero nunca crea otra.

Valores v1.1.1: salto 680 (antes 620), salto aéreo 640 (nuevo), wall jump vertical 640 (antes 590), corte 0.68 (antes 0.60). Permanecen gravedad 1520, caída máxima 980, coyote y wall-coyote 100 ms, buffer 120 ms, wall jump X 360, bloqueo 110 ms y dash 675/220/230/0.58.

El segundo salto usa sonido procedural diferenciado, partículas según intensidad y una pose breve sin flash de cámara. El HUD presenta `SALTO EXTRA ●/○` junto al estado separado del dash.

## MANTENIMIENTO y alcance

La cama final cambió de 220 px centrados en x=2350 (bordes 2240–2460) a 160 px centrados en x=2320 (bordes 2240–2400). Conserva el despegue desde el apoyo de x=2100 (170 px, bordes 2015–2185), deja 55 px seguros antes del obstáculo y amplía en 60 px el suelo de aterrizaje. Sigue siendo un obstáculo, pero un salto completo lo cruza; salto+dash aporta margen y el doble salto permite recuperar altura. Los prompts introducen salto, segunda pulsación, dash y la técnica sugerida antes del tramo final.

Los splits mantienen ELECTRICIDAD y ASCENSOR. La finalización continúa siendo idempotente y el resultado se persiste por la política competitiva independientemente de PB, rango, muertes, ghost o analytics.

## Piso 3 y reparación

La progresión usa `isFloorUnlocked`, `getNextFloor`, `unlockAfterCompletion` y `reconcileFloorProgress`. Completar competitivamente el piso 2 marca su record, eleva el desbloqueo a 3, muestra `PISO 3 DESBLOQUEADO` y ofrece `IR AL PISO 3`. Al cargar, sólo las finalizaciones contiguas reparan un `unlockedFloor` atrasado; nunca se reduce progreso ni se usan récords aislados.

## Validación física y CI

Las pruebas unitarias cubren prioridad, tercer salto rechazado, tecla sostenida, caída, coyote, pared, composición con dash y ciclos de aterrizaje de 5 y 20 repeticiones. Los E2E usan eventos reales de teclado y CI instala Chromium sin capturas, video, trazas, HTML ni artefactos.

El resultado definitivo de CI se consulta en los jobs **Validate project** y **Browser tests** del pull request; este documento no anticipa estados externos.
