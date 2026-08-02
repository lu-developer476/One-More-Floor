import Phaser from 'phaser';
import type { EnemyDebugState, EnemyDefinition } from './EnemyTypes';

export abstract class EnemyActor {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly outline: Phaser.GameObjects.Graphics;
  disabled = false;
  protected paused = true;
  protected destroyed = false;
  protected visibleToCamera = false;
  private disableTween: Phaser.Tweens.Tween | null = null;
  constructor(protected readonly scene: Phaser.Scene, readonly definition: EnemyDefinition, texture: string) {
    this.outline = scene.add.graphics().setDepth(19).setVisible(false);
    this.sprite = scene.physics.add.sprite(definition.x, definition.y, texture).setDepth(20);
    this.sprite.setData('enemyId', definition.id);
  }
  abstract update(gameplayTimeMs: number, deltaMs: number, playerX: number, playerY: number): void;
  abstract debug(): EnemyDebugState;
  setCameraActive(value: boolean): void { this.visibleToCamera = value; if (!value) this.sprite.setVelocity(0); }
  setPaused(value: boolean): void { this.paused = value; if (value) this.sprite.setVelocity(0); }
  setHighContrast(value: boolean): void { this.outline.setVisible(value && !this.destroyed); this.drawOutline(); }
  protected drawOutline(shape: 'bot' | 'drone' = this.definition.kind === 'maintenance-bot' ? 'bot' : 'drone'): void {
    this.outline.clear(); if (!this.outline.visible) return;
    const color = this.disabled ? 0xffffff : 0x000000;
    this.outline.lineStyle(5, color, 1);
    if (shape === 'bot') this.outline.strokeRoundedRect(this.sprite.x - 26, this.sprite.y - 20, 52, 40, 8);
    else this.outline.strokeCircle(this.sprite.x, this.sprite.y, 27);
    this.outline.fillStyle(0xffffff, 1).fillTriangle(this.sprite.x + (this.sprite.flipX ? -32 : 32), this.sprite.y, this.sprite.x + (this.sprite.flipX ? -22 : 22), this.sprite.y - 7, this.sprite.x + (this.sprite.flipX ? -22 : 22), this.sprite.y + 7);
  }
  disable(): boolean {
    if (this.disabled || this.destroyed) return false;
    this.disabled = true; this.sprite.setVelocity(0).disableBody(false, false).setTexture(`${this.definition.kind}-disabled`).setAlpha(0.62);
    this.disableTween = this.scene.tweens.add({ targets: this.sprite, alpha: 0.25, angle: 12, duration: 360 });
    this.drawOutline(); return true;
  }
  destroy(): void {
    if (this.destroyed) return; this.destroyed = true;
    this.disableTween?.stop(); this.disableTween?.remove(); this.disableTween = null;
    this.outline.destroy(); this.sprite.destroy();
  }
}
