import Phaser from 'phaser';
import type { EnemyDebugState, EnemyDefinition } from './EnemyTypes';
export abstract class EnemyActor {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  disabled = false;
  protected paused = true;
  protected destroyed = false;
  constructor(protected readonly scene: Phaser.Scene, readonly definition: EnemyDefinition, texture: string) {
    this.sprite = scene.physics.add.sprite(definition.x, definition.y, texture).setDepth(20);
    this.sprite.setData('enemyId', definition.id);
  }
  abstract update(gameplayTimeMs: number, deltaMs: number, playerX: number, playerY: number): void;
  abstract debug(): EnemyDebugState;
  setPaused(value: boolean): void { this.paused = value; if (value) this.sprite.setVelocity(0); }
  disable(): boolean {
    if (this.disabled || this.destroyed) return false;
    this.disabled = true; this.sprite.disableBody(false, false).setTexture(`${this.definition.kind}-disabled`).setAlpha(0.62);
    this.scene.tweens.add({ targets: this.sprite, alpha: 0.25, angle: 12, duration: 360 });
    return true;
  }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.sprite.destroy(); }
}
