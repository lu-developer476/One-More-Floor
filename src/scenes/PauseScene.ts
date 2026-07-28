import Phaser from 'phaser';
import { audioService } from '../services/AudioService';
import { eventBus, Events } from '../utils/EventBus';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { StorageService } from '../services/StorageService';
import type { RunContext } from '../runs/AttemptSession';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { TowerRunCoordinator } from '../runs/TowerRunCoordinator';

const commonOptions = ['CONTINUAR', 'REINICIAR PISO', 'AJUSTES', 'CONTROLES'] as const;
export class PauseScene extends Phaser.Scene {
  private selected = 0;
  private items: Phaser.GameObjects.Text[] = [];
  private manager!: InputManager;
  private options: readonly string[] = [];
  private context!: RunContext;
  private dialog?: ConfirmDialog;
  constructor() {
    super('Pause');
  }
  create(data: { context: RunContext }): void {
    this.context = data.context;
    this.options = [
      ...commonOptions,
      data.context.scope === 'tower' ? 'ABANDONAR TOWER RUN' : 'VOLVER AL MENÚ',
    ];
    this.manager = new InputManager(this, new StorageService().load().input);
    this.manager.blockInherited();
    this.add.rectangle(480, 270, 960, 540, 0x02060a, 0.78);
    this.add
      .text(480, 98, 'PAUSA', { fontFamily: 'monospace', fontSize: '40px', color: '#5ef1ff' })
      .setOrigin(0.5);
    this.items = this.options.map((label, index) =>
      this.add
        .text(480, 175 + index * 52, label, {
          fontFamily: 'monospace',
          fontSize: '21px',
          color: '#91a6b6',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.select(index))
        .on('pointerdown', () => this.confirm()),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.select(0);
  }
  update(): void {
    this.manager.poll();
    this.dialog?.update(this.manager);
    if (this.dialog) return;
    if (this.manager.wasPressed(InputAction.MENU_UP)) this.previous();
    if (this.manager.wasPressed(InputAction.MENU_DOWN)) this.next();
    if (this.manager.wasPressed(InputAction.CONFIRM)) this.confirm();
    if (this.manager.wasPressed(InputAction.PAUSE) || this.manager.wasPressed(InputAction.BACK))
      this.resume();
  }
  private previous(): void {
    this.select((this.selected - 1 + this.options.length) % this.options.length);
  }
  private next(): void {
    this.select((this.selected + 1) % this.options.length);
  }
  private select(index: number): void {
    this.selected = index;
    this.items.forEach((item, itemIndex) =>
      item.setColor(itemIndex === index ? '#ffffff' : '#91a6b6'),
    );
  }
  private confirm(): void {
    if (this.selected === 0) this.resume();
    else if (this.selected === 1) {
      this.scene.stop();
      this.scene.resume('Level');
      eventBus.emit(Events.PAUSE_RESTART);
      audioService.resume();
    } else if (this.selected === 2) {
      this.scene.pause();
      this.scene.launch('Settings');
    } else if (this.selected === 3) {
      this.scene.pause();
      this.scene.launch('Controls');
    } else {
      this.dialog = new ConfirmDialog(
        this,
        this.context.scope === 'tower' ? 'ABANDONAR TOWER RUN' : 'VOLVER AL MENÚ',
        'El intento actual terminará.',
        () => {
          this.dialog = undefined;
          if (this.context.scope === 'tower') new TowerRunCoordinator().abandon();
          eventBus.emit(Events.RUN_ABANDON);
          this.scene.stop('UI');
          this.scene.stop('Level');
          this.scene.start('Menu');
          audioService.resume();
        },
        () => {
          this.dialog = undefined;
        },
      );
    }
  }
  private resume(): void {
    this.scene.stop();
    this.scene.resume('Level');
    audioService.resume();
  }
  private shutdown(): void {
    this.manager.destroy();
    this.dialog?.destroy();
  }
}
