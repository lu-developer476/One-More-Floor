import Phaser from 'phaser';
import { Countdown } from './Countdown';
export class CollapseSystem {
  readonly timer: Countdown;
  private nextShake = 0;
  constructor(
    private readonly scene: Phaser.Scene,
    durationMs: number,
  ) {
    this.timer = new Countdown(durationMs);
  }
  update(delta: number): void {
    const left = this.timer.update(delta);
    const urgency = 1 - left / this.timer.durationMs;
    this.scene.cameras.main.setBackgroundColor(
      Phaser.Display.Color.Interpolate.ColorWithColor(
        new Phaser.Display.Color(12, 17, 25),
        new Phaser.Display.Color(75, 14, 20),
        1,
        urgency,
      ),
    );
    if (left < 10000 && this.scene.time.now > this.nextShake) {
      this.scene.cameras.main.shake(75, 0.0015);
      this.nextShake = this.scene.time.now + 1400;
    }
  }
  stop(): void {
    this.timer.stop();
  }
}
