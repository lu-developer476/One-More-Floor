import Phaser from 'phaser';
import { audioService } from '../services/AudioService';
export class RunCountdown {
  private complete = false;
  private readonly text: Phaser.GameObjects.Text;
  private readonly events: Phaser.Time.TimerEvent[] = [];
  constructor(scene: Phaser.Scene, onComplete: () => void) {
    this.text = scene.add
      .text(480, 250, '3', {
        fontFamily: 'monospace',
        fontSize: '86px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(500);
    ['3', '2', '1', 'GO'].forEach((label, index) =>
      this.events.push(
        scene.time.delayedCall(index * 650, () => {
          this.text.setText(label).setScale(0.5).setAlpha(1);
          audioService.play(label === 'GO' ? 'go' : 'countdown', 0);
          scene.tweens.add({
            targets: this.text,
            scale: 1.2,
            alpha: label === 'GO' ? 1 : 0.25,
            duration: 520,
            ease: 'Back.Out',
          });
        }),
      ),
    );
    this.events.push(
      scene.time.delayedCall(3 * 650 + 500, () => {
        this.complete = true;
        this.text.destroy();
        onComplete();
      }),
    );
  }
  get finished(): boolean {
    return this.complete;
  }
  destroy(): void {
    for (const event of this.events) event.remove(false);
    if (this.text.active) this.text.destroy();
  }
}
