import Phaser from 'phaser';
import type { SplitTime } from '../runs/SplitTracker';
import { formatDelta } from '../systems/SplitComparisons';

export class SplitFeedback {
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly text: Phaser.GameObjects.Text;
  private tween?: Phaser.Tweens.Tween;
  last: { split: SplitTime; deltaMs: number | null } | null = null;
  constructor(private readonly scene: Phaser.Scene, highContrast: boolean) {
    this.panel = scene.add.rectangle(480, 120, 430, 100, highContrast ? 0x000000 : 0x071018, 0.9)
      .setScrollFactor(0).setDepth(300).setVisible(false);
    this.text = scene.add.text(480, 120, '', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff', align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setVisible(false);
  }
  show(split: SplitTime, deltaMs: number | null, reduceFlashes: boolean): void {
    this.last = { split, deltaMs };
    this.tween?.stop();
    this.panel.setVisible(true).setAlpha(1);
    this.text.setVisible(true).setAlpha(1).setText([
      split.name,
      `SEGMENTO ${(split.segmentMs / 1000).toFixed(2)} s · TOTAL ${(split.cumulativeMs / 1000).toFixed(2)} s`,
      formatDelta(deltaMs),
    ]);
    this.tween = this.scene.tweens.add({
      targets: [this.panel, this.text], alpha: reduceFlashes ? 0.25 : 0, delay: 1100, duration: 400,
      onComplete: () => { this.panel.setVisible(false); this.text.setVisible(false); },
    });
  }
  destroy(): void { this.tween?.stop(); this.panel.destroy(); this.text.destroy(); }
}
