import Phaser from 'phaser';
import type { MovingPlatformDefinition } from '../types/game';

export class MovingPlatform extends Phaser.Physics.Arcade.Sprite {
  private direction = 1;
  private readonly minimum: number;
  private readonly maximum: number;

  constructor(
    scene: Phaser.Scene,
    private readonly definition: MovingPlatformDefinition,
  ) {
    super(scene, definition.x, definition.y, 'moving-platform');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const height = definition.height ?? 24;
    this.setDisplaySize(definition.width, height);
    this.setImmovable(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.allowGravity = false;
    body.setSize(definition.width, height, true);

    const center = definition.axis === 'x' ? definition.x : definition.y;
    this.minimum = center - definition.distance * 0.5;
    this.maximum = center + definition.distance * 0.5;
    this.applyVelocity();
  }

  update(): void {
    const position = this.definition.axis === 'x' ? this.x : this.y;

    if (position >= this.maximum) {
      this.direction = -1;
    } else if (position <= this.minimum) {
      this.direction = 1;
    }

    this.applyVelocity();
  }

  private applyVelocity(): void {
    const velocity = this.definition.speed * this.direction;

    if (this.definition.axis === 'x') {
      this.setVelocity(velocity, 0);
    } else {
      this.setVelocity(0, velocity);
    }
  }
}
