import Phaser from 'phaser';
import type { FallingPlatformDefinition } from '../types/game';

export class FallingPlatform extends Phaser.Physics.Arcade.Sprite {
  private triggered = false;

  constructor(
    scene: Phaser.Scene,
    private readonly definition: FallingPlatformDefinition,
  ) {
    super(scene, definition.x, definition.y, 'falling-platform');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const height = definition.height ?? 24;
    this.setDisplaySize(definition.width, height);
    this.setImmovable(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.allowGravity = false;
    body.setSize(definition.width, height, true);
  }

  trigger(): void {
    if (this.triggered || !this.active) {
      return;
    }

    this.triggered = true;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.35,
      x: this.x + 3,
      duration: 55,
      yoyo: true,
      repeat: 4,
      onComplete: () => this.release(),
    });
  }

  update(worldHeight: number): void {
    if (this.active && this.y > worldHeight + 120) {
      this.destroy();
    }
  }

  private release(): void {
    if (!this.active) {
      return;
    }

    this.scene.time.delayedCall(this.definition.delayMs ?? 420, () => {
      if (!this.active) {
        return;
      }

      const body = this.body as Phaser.Physics.Arcade.Body;
      body.allowGravity = true;
      this.setImmovable(false);
      this.setVelocityY(45);
      this.setAngularVelocity(35);
    });
  }
}
