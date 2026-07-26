import Phaser from 'phaser';
import type { GhostRun } from './GhostTypes';
import { interpolateGhost } from './GhostInterpolation';
export class GhostPlayer {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private index = 0;
  constructor(scene: Phaser.Scene, private readonly run: GhostRun, opacity = 0.28, highContrast = false) {
    const first = run.samples[0]!;
    this.sprite = scene.add.sprite(first.x, first.y, 'player-idle-0').setAlpha(opacity).setTint(highContrast ? 0xfff06a : 0x9c7cff).setDepth(18);
  }
  update(timeMs: number): void { const result = interpolateGhost(this.run, timeMs, this.index); if (!result) { this.sprite.setVisible(false); return; } this.index = result.index; this.sprite.setVisible(true).setPosition(result.frame.x, result.frame.y).setFlipX(result.frame.facing < 0); }
  destroy(): void { this.sprite.destroy(); }
}
