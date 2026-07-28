import Phaser from 'phaser';
import type { TowerCheckpoint } from '../runs/TowerRunSession';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { StorageService, type TowerCompletionOutcome } from '../services/StorageService';
import { formatPrompt } from '../input/InputPromptFormatter';
export class EndingScene extends Phaser.Scene {
  private manager!: InputManager;
  private done = false;
  private checkpoint!: TowerCheckpoint;
  private outcome!: TowerCompletionOutcome;
  private prompt!: Phaser.GameObjects.Text;
  private bindings!: ReturnType<StorageService['load']>['input'];
  private lastDevice = '';
  constructor() {
    super('Ending');
  }
  create(data: { checkpoint: TowerCheckpoint; outcome: TowerCompletionOutcome }): void {
    this.checkpoint = data.checkpoint;
    this.outcome = data.outcome;
    const save = new StorageService().load();
    this.bindings = save.input;
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
    this.prompt = this.add
      .text(480, 500, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#91a6b6',
      })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => this.finish());
    this.tweens.add({
      targets: lift,
      y: 145,
      duration: 8000,
      ease: 'Sine.easeInOut',
      onComplete: () => this.finish(),
    });
    this.time.delayedCall(8200, () => this.finish());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.manager.destroy();
      this.tweens.killAll();
      this.time.removeAllEvents();
    });
  }
  update(): void {
    this.manager.poll();
    if (this.lastDevice !== this.manager.activeDevice) {
      this.lastDevice = this.manager.activeDevice;
      this.prompt.setText(
        `${formatPrompt(InputAction.CONFIRM, this.manager.activeDevice, this.bindings)} SALTAR`,
      );
    }
    if (this.manager.wasPressed(InputAction.CONFIRM)) this.finish();
  }
  private finish(): void {
    if (this.done) return;
    this.done = true;
    this.scene.start('TowerResults', { checkpoint: this.checkpoint, outcome: this.outcome });
  }
}
