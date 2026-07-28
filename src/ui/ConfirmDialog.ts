import Phaser from 'phaser';
import { InputAction } from '../input/InputAction';
import type { InputManager } from '../input/InputManager';
import { eventBus, Events } from '../utils/EventBus';
export class ConfirmDialog {
  private root: Phaser.GameObjects.Container;
  private armed = false;
  constructor(
    scene: Phaser.Scene,
    title: string,
    description: string,
    private confirm: () => void,
    private cancel: () => void,
    labels: { confirm: string; cancel: string } = { confirm: 'CONFIRMAR', cancel: 'CANCELAR' },
  ) {
    const shade = scene.add.rectangle(480, 270, 960, 540, 0x000000, 0.78).setInteractive();
    const panel = scene.add.rectangle(480, 270, 650, 260, 0x071018, 1).setStrokeStyle(2, 0xf5c84c);
    const text = scene.add
      .text(480, 230, [title, description, '[CONFIRMAR]     [CANCELAR]'], {
        fontFamily: 'monospace',
        fontSize: '19px',
        color: '#fff',
        align: 'center',
        lineSpacing: 18,
      })
      .setOrigin(0.5);
    const yes = scene.add
      .text(390, 330, labels.confirm, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ff7185',
      })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => this.accept());
    const no = scene.add
      .text(570, 330, labels.cancel, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#5ef1ff',
      })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => this.reject());
    this.root = scene.add.container(0, 0, [shade, panel, text, yes, no]).setDepth(1000);
    scene.time.delayedCall(0, () => {
      this.armed = true;
    });
    eventBus.emit(Events.DIALOG_OPENED, title);
  }
  update(input: InputManager) {
    if (!this.armed) return;
    if (input.wasPressed(InputAction.CONFIRM)) this.accept();
    else if (input.wasPressed(InputAction.BACK)) this.reject();
  }
  private accept() {
    if (!this.armed) return;
    this.destroy();
    this.confirm();
  }
  private reject() {
    if (!this.armed) return;
    this.destroy();
    this.cancel();
  }
  destroy() {
    this.armed = false;
    this.root.destroy(true);
    eventBus.emit(Events.DIALOG_CLOSED);
  }
}
