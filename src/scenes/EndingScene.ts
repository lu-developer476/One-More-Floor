import Phaser from 'phaser';
import type { TowerCheckpoint } from '../runs/TowerRunSession';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { StorageService } from '../services/StorageService';
export class EndingScene extends Phaser.Scene {
  private manager!: InputManager;
  private done = false;
  private checkpoint!: TowerCheckpoint;
  constructor() {
    super('Ending');
  }
  create(data: { checkpoint: TowerCheckpoint }): void {
    this.checkpoint = data.checkpoint;
    const save = new StorageService().load();
    this.manager = new InputManager(this, save.input);
    this.manager.blockInherited();
    this.cameras.main.setBackgroundColor('#050b12');
    const lift = this.add.rectangle(480, 430, 150, 90, 0x5ef1ff);
    this.add
      .text(480, 90, 'ASCENSO FINAL', {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.add
      .text(480, 500, 'CONFIRMAR · SALTAR', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#91a6b6',
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: lift,
      y: 145,
      duration: 8000,
      ease: 'Sine.easeInOut',
      onComplete: () => this.finish(),
    });
    this.time.delayedCall(8200, () => this.finish());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.manager.destroy());
  }
  update(): void {
    this.manager.poll();
    if (this.manager.wasPressed(InputAction.CONFIRM)) this.finish();
  }
  private finish(): void {
    if (this.done) return;
    this.done = true;
    this.scene.start('TowerResults', { checkpoint: this.checkpoint });
  }
}
