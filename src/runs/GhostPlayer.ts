import Phaser from 'phaser';
import type { GhostRun } from './GhostTypes';
import { interpolateGhost } from './GhostInterpolation';
export class GhostPlayer {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private index = 0;
  constructor(
    scene: Phaser.Scene,
    private readonly run: GhostRun,
    opacity = 0.28,
    highContrast = false,
  ) {
    const first = run.samples[0]!;
    this.sprite = scene.add
      .sprite(first.x, first.y, 'player-idle-0')
      .setAlpha(opacity)
      .setTint(highContrast ? 0xfff06a : 0x9c7cff)
      .setDepth(18);
  }
  update(timeMs: number): void {
    const result = interpolateGhost(this.run, timeMs, this.index);
    if (!result) {
      this.sprite.setVisible(false);
      return;
    }
    this.index = result.index;
    const key = textureForGhostState(result.frame.state);
    this.sprite
      .setVisible(true)
      .setPosition(result.frame.x, result.frame.y)
      .setFlipX(result.frame.facing < 0);
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key);
  }
  applyAppearance(highContrast: boolean): void {
    this.sprite.setTint(highContrast ? 0xfff06a : 0x9c7cff).setAlpha(highContrast ? 0.52 : 0.28);
  }
  destroy(): void {
    this.sprite.destroy();
  }
}

export const textureForGhostState = (state: string): string =>
  state === 'RUNNING'
    ? 'player-run-0'
    : state === 'DASHING'
      ? 'player-dash'
      : state === 'JUMPING'
        ? 'player-jump'
        : state === 'FALLING'
          ? 'player-fall'
          : state === 'WALL_SLIDING'
            ? 'player-wall'
            : 'player-idle-0';
