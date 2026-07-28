import Phaser from 'phaser';
import { LEVELS } from '../config/levelConfig';
import { StorageService } from '../services/StorageService';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { createFloorRunData } from '../runs/RunContext';
import { calculateBestTheoretical } from '../systems/SplitComparisons';
export class FloorSelectScene extends Phaser.Scene {
  private practice = false;
  private selected = 0;
  private manager!: InputManager;
  private items: Phaser.GameObjects.Text[] = [];
  private detail!: Phaser.GameObjects.Text;
  constructor() {
    super('FloorSelect');
  }
  init(data: { practice?: boolean }) {
    this.practice = data.practice === true;
  }
  create(): void {
    const save = new StorageService().load();
    this.manager = new InputManager(this, save.input);
    this.manager.blockInherited();
    this.cameras.main.setBackgroundColor('#071018');
    this.add
      .text(480, 45, this.practice ? 'PRÁCTICA' : 'PISOS', {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#5ef1ff',
      })
      .setOrigin(0.5);
    this.items = LEVELS.map((level, i) =>
      this.add
        .text(
          85,
          105 + i * 58,
          `${i < save.unlockedFloor ? '' : '🔒 '}PISO ${level.floor} · ${level.name}`,
          { fontFamily: 'monospace', fontSize: '16px', color: '#91a6b6' },
        )
        .setInteractive()
        .on('pointerover', () => this.select(i))
        .on('pointerdown', () => this.confirm()),
    );
    this.detail = this.add.text(520, 115, '', {
      fontFamily: 'monospace',
      fontSize: '17px',
      color: '#fff',
      lineSpacing: 8,
    });
    this.add
      .text(480, 500, 'CONFIRMAR · ELEGIR    VOLVER · MENÚ', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f5c84c',
      })
      .setOrigin(0.5);
    this.select(0);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.manager.destroy());
  }
  update(): void {
    this.manager.poll();
    if (this.manager.wasPressed(InputAction.MENU_UP))
      this.select((this.selected + LEVELS.length - 1) % LEVELS.length);
    if (this.manager.wasPressed(InputAction.MENU_DOWN))
      this.select((this.selected + 1) % LEVELS.length);
    if (this.manager.wasPressed(InputAction.BACK)) this.scene.start('Menu');
    if (this.manager.wasPressed(InputAction.CONFIRM)) this.confirm();
  }
  private select(i: number): void {
    this.selected = i;
    const save = new StorageService().load(),
      level = LEVELS[i]!,
      record = save.floors[String(level.floor)],
      theory = calculateBestTheoretical(level, record?.bestSegments ?? {});
    this.items.forEach((x, n) => x.setColor(n === i ? '#fff' : '#91a6b6'));
    this.detail.setText([
      `PISO ${level.floor}`,
      i < save.unlockedFloor ? 'DESBLOQUEADO' : 'BLOQUEADO',
      `PB ${record?.bestTimeMs ? `${(record.bestTimeMs / 1000).toFixed(2)} s` : '--'}`,
      `RANGO ${record?.rank ?? '--'}`,
      `GHOST ${record?.bestGhost ? 'SÍ' : 'NO'}`,
      `MEJOR TEÓRICO ${theory ? `${(theory / 1000).toFixed(2)} s` : '--'}`,
    ]);
  }
  private confirm(): void {
    const save = new StorageService().load();
    if (this.selected >= save.unlockedFloor) return;
    if (this.practice) this.scene.start('RunSetup', { levelIndex: this.selected });
    else this.scene.start('Level', createFloorRunData(this.selected));
  }
}
