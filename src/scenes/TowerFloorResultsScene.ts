import { ScreenShell } from '../ui/UiKit';
import Phaser from 'phaser';
import type { ResultData } from '../types/game';
import { LEVELS } from '../config/levelConfig';
import { StorageService } from '../services/StorageService';
import { calculateRank, seconds } from '../systems/Statistics';
import { calculateTowerRank } from '../runs/TowerRank';
import { TowerCheckpointService } from '../runs/TowerCheckpointService';
import { createNextTowerFloorData } from '../runs/RunContext';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { formatPrompt } from '../input/InputPromptFormatter';
import { LocalAnalyticsService } from '../analytics/LocalAnalyticsService';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { TowerRunCoordinator } from '../runs/TowerRunCoordinator';
export class TowerFloorResultsScene extends Phaser.Scene {
  private manager!: InputManager;
  private resultData!: ResultData;
  private final = false;
  private dialog?: ConfirmDialog;
  private transitioning = false;
  constructor() {
    super('TowerFloorResults');
  }
  create(data: ResultData): void {
    new ScreenShell(this, 'RESULTADO DE PISO', 'Navegación accesible · foco visible · volver siempre disponible');
    this.resultData = data;
    const level = LEVELS[data.levelIndex];
    if (!level) throw new Error('Invalid result');
    const checkpoints = new TowerCheckpointService(),
      session = checkpoints.load();
    if (
      !session ||
      session.state.sessionId !== data.context.towerRunId ||
      session.state.status !== 'active'
    ) {
      this.scene.start('Menu');
      return;
    }
    const rank = calculateRank(level, data.elapsedMs, data.deaths),
      storage = new StorageService();
    const outcome = storage.completeFloor(
      data.floor,
      data.elapsedMs,
      data.deaths,
      rank,
      data.splits,
      data.segments,
      data.eligibility,
      data.ghostRun,
    );
    session.completeFloor(data.floor, data.elapsedMs, data.deaths, rank);
    this.final = data.floor === LEVELS.length;
    if (this.final) {
      const towerOutcome = storage.recordTower(
        session.state.totalElapsedMs,
        session.state.totalDeaths,
        calculateTowerRank(session.state.totalElapsedMs, session.state.totalDeaths),
        session.state.results,
        session.state.eligible,
      );
      const save = storage.load();
      new LocalAnalyticsService(save.settings.localAnalyticsEnabled).towerComplete(
        session.state.totalElapsedMs,
        session.state.totalDeaths,
        Object.fromEntries(session.state.results.map((item) => [String(item.floor), item.deaths])),
      );
      checkpoints.clear();
      this.transitioning = true;
      this.scene.start('Ending', { checkpoint: session.serialize(), outcome: towerOutcome });
      return;
    }
    const checkpointOutcome = checkpoints.save(session);
    const save = storage.load();
    this.manager = new InputManager(this, save.input);
    this.manager.blockInherited();
    this.cameras.main.setBackgroundColor('#0c1119');
    this.add
      .text(480, 60, `PISO ${data.floor} COMPLETADO`, {
        fontFamily: 'monospace',
        fontSize: '34px',
        color: '#5ef1ff',
      })
      .setOrigin(0.5);
    this.add
      .text(
        480,
        245,
        [
          `TIEMPO DEL PISO ${seconds(data.elapsedMs)} s · PB ${seconds(outcome.save.floors[String(data.floor)]?.bestTimeMs ?? data.elapsedMs)} s`,
          `RANGO ${rank} · MUERTES ${data.deaths}`,
          `TIEMPO DE JUEGO ${seconds(session.state.totalElapsedMs)} s`,
          `MUERTES ACUMULADAS ${session.state.totalDeaths}`,
          `PRÓXIMO: PISO ${session.state.nextFloor}`,
          outcome.newBestTime ? 'NUEVO PB INDIVIDUAL' : 'PB INDIVIDUAL SIN CAMBIOS',
          `SEGMENTOS MEJORADOS ${outcome.improvedSegments.length}`,
          outcome.ghostSaved ? 'GHOST GUARDADO' : 'GHOST SIN CAMBIOS',
          checkpointOutcome.saved ? 'PARTIDA GUARDADA' : 'NO SE PUDO GUARDAR EL CHECKPOINT',
        ].join('\n'),
        {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#fff',
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);
    this.add
      .text(
        480,
        470,
        `${formatPrompt(InputAction.CONFIRM, this.manager.activeDevice, save.input)} CONTINUAR · ${formatPrompt(InputAction.BACK, this.manager.activeDevice, save.input)} ABANDONAR`,
        { fontFamily: 'monospace', fontSize: '16px', color: '#f5c84c' },
      )
      .setOrigin(0.5);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.manager.destroy());
  }
  update(): void {
    if (!this.manager || this.final) return;
    this.manager.poll();
    this.dialog?.update(this.manager);
    if (this.dialog || this.transitioning) return;
    if (this.manager.wasPressed(InputAction.CONFIRM)) {
      const service = new TowerCheckpointService(),
        session = service.load();
      if (!session) return;
      session.advance();
      service.save(session);
      this.transitioning = true;
      this.scene.start('Level', createNextTowerFloorData(this.resultData.context));
    } else if (this.manager.wasPressed(InputAction.BACK)) {
      this.dialog = new ConfirmDialog(
        this,
        'ABANDONAR TOWER RUN',
        'Se eliminará el checkpoint pendiente.',
        () => {
          this.dialog = undefined;
          new TowerRunCoordinator().abandon();
          this.transitioning = true;
          this.scene.start('Menu');
        },
        () => {
          this.dialog = undefined;
        },
      );
    }
  }
}
