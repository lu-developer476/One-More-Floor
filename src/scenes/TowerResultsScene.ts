import Phaser from 'phaser';
import type { TowerCheckpoint } from '../runs/TowerRunSession';
import { calculateTowerRank } from '../runs/TowerRank';
import { type TowerCompletionOutcome } from '../services/StorageService';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { formatPrompt } from '../input/InputPromptFormatter';
import { seconds } from '../systems/Statistics';

interface ResultAction {
  label: string;
  run: () => void;
}
export class TowerResultsScene extends Phaser.Scene {
  private selected = 0;
  private items: Phaser.GameObjects.Text[] = [];
  private actions: ResultAction[] = [];
  private manager!: InputManager;
  private transitioning = false;
  constructor() {
    super('TowerResults');
  }
  create(data: { checkpoint: TowerCheckpoint; outcome: TowerCompletionOutcome }): void {
    const save = data.outcome.save;
    this.manager = new InputManager(this, save.input);
    this.manager.blockInherited();
    const rank = calculateTowerRank(data.checkpoint.totalElapsedMs, data.checkpoint.totalDeaths);
    const assisted = data.checkpoint.mode === 'assisted';
    this.cameras.main.setBackgroundColor('#071018');
    this.add
      .text(480, 35, assisted ? 'TOWER RUN ASISTIDA' : 'TORRE COMPETITIVA COMPLETADA', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#5ef1ff',
      })
      .setOrigin(0.5);
    const reference = save.tower.bestRunCumulativeTimes;
    this.add
      .text(
        480,
        190,
        [
          assisted
            ? 'RESULTADO GLOBAL NO COMPETITIVO'
            : data.outcome.newBestTime
              ? 'NUEVO RÉCORD GLOBAL'
              : data.outcome.rankImproved
                ? 'RANGO MEJORADO'
                : 'PB SIN CAMBIOS',
          `TIEMPO ACTUAL ${seconds(data.checkpoint.totalElapsedMs)} s`,
          `PB ANTERIOR ${data.outcome.previousBestTimeMs ? seconds(data.outcome.previousBestTimeMs) : '--'} s · PB VIGENTE ${data.outcome.currentBestTimeMs ? seconds(data.outcome.currentBestTimeMs) : '--'} s`,
          `MUERTES ${data.checkpoint.totalDeaths} · MEJOR ${save.tower.fewestDeaths ?? '--'}`,
          assisted
            ? 'RANGO NO GUARDADO'
            : `RANGO ACTUAL ${rank} · MEJOR ${save.tower.bestRank ?? '--'}`,
          data.outcome.deathsImproved ? 'MEJOR CANTIDAD DE MUERTES' : '',
          `PISOS INDIVIDUALES MEJORADOS ${data.outcome.improvedIndividualFloors.join(', ') || '--'}`,
          ...data.checkpoint.results.map((result) => {
            const delta = reference[String(result.floor)];
            return `PISO ${result.floor}  ${seconds(result.elapsedMs)} s  ${delta === undefined ? '--' : `${result.cumulativeTowerMs - delta >= 0 ? '+' : '−'}${seconds(Math.abs(result.cumulativeTowerMs - delta))} s`}`;
          }),
        ]
          .filter(Boolean)
          .join('\n'),
        {
          fontFamily: 'monospace',
          fontSize: '15px',
          color: '#fff',
          align: 'center',
          lineSpacing: 3,
        },
      )
      .setOrigin(0.5);
    this.actions = [
      { label: 'NUEVA TOWER RUN', run: () => this.start('TowerSetup') },
      { label: 'VER PISOS', run: () => this.scene.start('FloorSelect', { practice: false }) },
      { label: 'ESTADÍSTICAS', run: () => this.start('Analytics') },
      { label: 'MENÚ', run: () => this.start('Menu') },
    ];
    this.items = this.actions.map((action, index) =>
      this.add
        .text(480, 365 + index * 30, action.label, {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#91a6b6',
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerover', () => this.select(index))
        .on('pointerdown', () => this.confirm()),
    );
    this.add
      .text(
        480,
        505,
        `${formatPrompt(InputAction.CONFIRM, this.manager.activeDevice, save.input)} ACEPTAR · ${formatPrompt(InputAction.BACK, this.manager.activeDevice, save.input)} MENÚ`,
        { fontFamily: 'monospace', fontSize: '13px', color: '#f5c84c' },
      )
      .setOrigin(0.5);
    this.select(0);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.manager.destroy());
  }
  update(): void {
    this.manager.poll();
    if (this.transitioning) return;
    if (this.manager.wasPressed(InputAction.MENU_UP))
      this.select((this.selected + this.items.length - 1) % this.items.length);
    if (this.manager.wasPressed(InputAction.MENU_DOWN))
      this.select((this.selected + 1) % this.items.length);
    if (this.manager.wasPressed(InputAction.BACK)) this.start('Menu');
    if (this.manager.wasPressed(InputAction.CONFIRM)) this.confirm();
  }
  private confirm(): void {
    if (!this.transitioning) this.actions[this.selected]?.run();
  }
  private start(scene: string): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.scene.start(scene);
  }
  private select(index: number): void {
    this.selected = index;
    this.items.forEach((item, itemIndex) =>
      item.setColor(itemIndex === index ? '#fff' : '#91a6b6'),
    );
  }
}
