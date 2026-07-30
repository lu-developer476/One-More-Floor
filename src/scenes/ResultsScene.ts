import { ScreenShell } from '../ui/UiKit';
import Phaser from 'phaser';
import type { ResultData } from '../types/game';
import { LEVELS } from '../config/levelConfig';
import { getNextFloor, StorageService } from '../services/StorageService';
import { calculateRank, nextRankGap, seconds } from '../systems/Statistics';
import { audioService } from '../services/AudioService';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { formatPrompt } from '../input/InputPromptFormatter';
import { createFloorRunData } from '../runs/RunContext';
export class ResultsScene extends Phaser.Scene {
  private manager?: InputManager;
  private resultData?: ResultData;
  constructor() {
    super('Results');
  }
  create(data: ResultData): void {
    new ScreenShell(this, 'RESULTADOS', 'Navegación accesible · foco visible · volver siempre disponible');
    const level = LEVELS[data.levelIndex];
    if (!level) throw new Error('Invalid result level');
    const rank = calculateRank(level, data.elapsedMs, data.deaths);
    const service = new StorageService();
    const outcome = service.completeFloor(
      data.floor,
      data.elapsedMs,
      data.deaths,
      rank,
      data.splits,
      data.segments,
      data.eligibility,
      data.ghostRun,
    );
    const best = (outcome?.save ?? service.load()).floors[String(data.floor)];
    this.manager = new InputManager(this, service.load().input);
    this.manager.blockInherited();
    this.resultData = data;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.manager?.destroy());
    this.cameras.main.setBackgroundColor('#0c1119');
    const heading = this.add
      .text(480, 82, data.final ? 'EVACUACIÓN COMPLETA' : 'PISO COMPLETADO', {
        fontFamily: 'monospace',
        fontSize: '42px',
        color: '#5ef1ff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    if (outcome?.newBestTime) {
      heading.setText('NUEVO RÉCORD');
      this.tweens.add({ targets: heading, scale: 1.08, duration: 420, yoyo: true, repeat: 2 });
      audioService.play('record', 0);
    }
    const bindings = service.load().input;
    this.add
      .text(
        480,
        220,
        [
          `RANGO  ${rank}  ·  MEJOR ${best?.rank ?? rank}`,
          level.name,
          `TIEMPO ${seconds(data.elapsedMs)} s  ·  MEJOR ${seconds(best?.bestTimeMs ?? data.elapsedMs)} s`,
          `SPLITS ${Object.keys(data.splits).length}/${level.splits.length} · SEGMENTOS MEJORADOS ${outcome.improvedSegments.length}`,
          `MUERTES ${data.deaths}  ·  MEJOR ${best?.fewestDeaths ?? data.deaths}`,
          nextRankGap(level, rank, data.elapsedMs, data.deaths),
          data.eligibility.status,
          outcome?.ghostSaved
            ? 'FANTASMA NUEVO GUARDADO'
            : data.eligibility.ghost
              ? 'FANTASMA SIN CAMBIOS'
              : 'RESULTADO NO COMPETITIVO',
          outcome.bestTheoreticalMs === null
            ? 'TEÓRICO --'
            : `TEÓRICO ${seconds(outcome.bestTheoreticalMs)} s`,
          data.final ? `TOTAL ${seconds(data.totalElapsedMs)} s` : '',
          outcome.floorUnlocked ? `PISO ${getNextFloor(data.floor)} DESBLOQUEADO` : '',
        ].filter(Boolean),
        {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#fff',
          align: 'center',
          lineSpacing: 9,
        },
      )
      .setOrigin(0.5);
    this.add
      .text(
        480,
        440,
        `${formatPrompt(InputAction.CONFIRM, this.manager.activeDevice, bindings)} ${data.floor === 2 && outcome.floorUnlocked ? 'IR AL PISO 3' : data.final ? 'MENÚ' : 'IR AL SIGUIENTE PISO'}\n${formatPrompt(InputAction.RESTART, this.manager.activeDevice, bindings)} REPETIR   ${formatPrompt(InputAction.BACK, this.manager.activeDevice, bindings)} VOLVER AL MENÚ`,
        {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#f5c84c',
        },
      )
      .setOrigin(0.5);
  }
  update(): void {
    const data = this.resultData,
      manager = this.manager;
    if (!data || !manager) return;
    manager.poll();
    if (manager.wasPressed(InputAction.BACK)) this.scene.start('Menu');
    else if (manager.wasPressed(InputAction.RESTART))
      this.scene.start('Level', { ...data.context });
    else if (manager.wasPressed(InputAction.CONFIRM))
      if (data.final || data.mode !== 'competitive') this.scene.start('Menu');
      else this.scene.start('Level', createFloorRunData(data.levelIndex + 1, 'competitive'));
  }
}
