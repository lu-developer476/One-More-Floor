import Phaser from 'phaser';
import { audioService } from '../services/AudioService';
import { eventBus, Events } from '../utils/EventBus';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { StorageService } from '../services/StorageService';

const options = ['CONTINUAR', 'REINICIAR PISO', 'AJUSTES', 'CONTROLES', 'VOLVER AL MENÚ'] as const;
export class PauseScene extends Phaser.Scene {
  private selected = 0;
  private items: Phaser.GameObjects.Text[] = [];
  private controls?: Phaser.GameObjects.Text;
  private manager!: InputManager;
  constructor() {
    super('Pause');
  }
  create(): void {
    this.manager = new InputManager(this, new StorageService().load().input);
    this.manager.blockInherited();
    this.add.rectangle(480, 270, 960, 540, 0x02060a, 0.78);
    this.add
      .text(480, 98, 'PAUSA', { fontFamily: 'monospace', fontSize: '40px', color: '#5ef1ff' })
      .setOrigin(0.5);
    this.items = options.map((label, index) =>
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
    if (this.manager.wasPressed(InputAction.MENU_UP)) this.previous();
    if (this.manager.wasPressed(InputAction.MENU_DOWN)) this.next();
    if (this.manager.wasPressed(InputAction.CONFIRM)) this.confirm();
    if (this.manager.wasPressed(InputAction.BACK)) this.resume();
  }
  private previous(): void {
    this.select((this.selected - 1 + options.length) % options.length);
  }
  private next(): void {
    this.select((this.selected + 1) % options.length);
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
    } else if (this.selected === 3)
      this.controls = this.add
        .text(480, 480, 'A/D o ←/→ mover · espacio saltar · Shift dash · Esc pausa', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#f5c84c',
          backgroundColor: '#071018',
        })
        .setOrigin(0.5);
    else {
      this.scene.stop('UI');
      this.scene.stop('Level');
      this.scene.start('Menu');
      audioService.resume();
    }
  }
  private resume(): void {
    this.scene.stop();
    this.scene.resume('Level');
    audioService.resume();
  }
  private shutdown(): void {
    this.controls?.destroy();
  }
}
