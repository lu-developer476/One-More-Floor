import Phaser from 'phaser';
import type { TowerCheckpoint } from '../runs/TowerRunSession';
import { calculateTowerRank } from '../runs/TowerRank';
import { StorageService } from '../services/StorageService';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { seconds } from '../systems/Statistics';
export class TowerResultsScene extends Phaser.Scene {
  private selected = 0;
  private items: Phaser.GameObjects.Text[] = [];
  private manager!: InputManager;
  constructor() {
    super('TowerResults');
  }
  create(data: { checkpoint: TowerCheckpoint }): void {
    const save = new StorageService().load();
    this.manager = new InputManager(this, save.input);
    this.manager.blockInherited();
    const rank = calculateTowerRank(data.checkpoint.totalElapsedMs, data.checkpoint.totalDeaths);
    this.cameras.main.setBackgroundColor('#071018');
    this.add
      .text(480, 45, 'TORRE COMPLETADA', {
        fontFamily: 'monospace',
        fontSize: '38px',
        color: '#5ef1ff',
      })
      .setOrigin(0.5);
    this.add
      .text(
        480,
        185,
        [
          `TIEMPO DE JUEGO ${seconds(data.checkpoint.totalElapsedMs)} s · MEJOR ${save.tower.bestTimeMs ? seconds(save.tower.bestTimeMs) : '--'} s`,
          `MUERTES ${data.checkpoint.totalDeaths} · MEJOR ${save.tower.fewestDeaths ?? '--'}`,
          `RANGO GLOBAL ${rank} · MEJOR ${save.tower.rank ?? '--'}`,
          ...data.checkpoint.results.map(
            (r) =>
              `PISO ${r.floor}  ${seconds(r.elapsedMs)} s  ACUM ${seconds(r.cumulativeTowerMs)} s`,
          ),
        ].join('\n'),
        {
          fontFamily: 'monospace',
          fontSize: '17px',
          color: '#fff',
          align: 'center',
          lineSpacing: 5,
        },
      )
      .setOrigin(0.5);
    this.items = ['NUEVA TOWER RUN', 'VER PISOS', 'ESTADÍSTICAS', 'MENÚ'].map((label, i) =>
      this.add
        .text(480, 350 + i * 34, label, {
          fontFamily: 'monospace',
          fontSize: '17px',
          color: '#91a6b6',
        })
        .setOrigin(0.5),
    );
    this.select(0);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.manager.destroy());
  }
  update(): void {
    this.manager.poll();
    if (this.manager.wasPressed(InputAction.MENU_UP)) this.select((this.selected + 3) % 4);
    if (this.manager.wasPressed(InputAction.MENU_DOWN)) this.select((this.selected + 1) % 4);
    if (this.manager.wasPressed(InputAction.BACK)) this.scene.start('Menu');
    if (this.manager.wasPressed(InputAction.CONFIRM))
      this.scene.start(['TowerSetup', 'FloorSelect', 'Analytics', 'Menu'][this.selected]!);
  }
  private select(i: number): void {
    this.selected = i;
    this.items.forEach((x, n) => x.setColor(n === i ? '#fff' : '#91a6b6'));
  }
}
