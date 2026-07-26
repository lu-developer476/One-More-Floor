import Phaser from 'phaser';
import type { TimedHazardDefinition } from '../types/game';
import { timedCycleState } from '../systems/TimedCycle';

export class LaserGate {
  readonly hitbox: Phaser.GameObjects.Zone;

  private readonly beam: Phaser.GameObjects.Rectangle;
  private readonly glow: Phaser.GameObjects.Rectangle;
  private readonly emitters: Phaser.GameObjects.Image[];
  private active = false;

  constructor(
    scene: Phaser.Scene,
    private readonly definition: TimedHazardDefinition,
  ) {
    this.glow = scene.add
      .rectangle(
        definition.x,
        definition.y,
        definition.width + 14,
        definition.height + 14,
        0xff405c,
        0,
      )
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(12);

    this.beam = scene.add
      .rectangle(
        definition.x,
        definition.y,
        definition.width,
        definition.height,
        0xff405c,
        0,
      )
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(13);

    this.hitbox = scene.add
      .zone(definition.x, definition.y, definition.width, definition.height)
      .setOrigin(0.5);
    scene.physics.add.existing(this.hitbox, true);

    const body = this.hitbox.body as Phaser.Physics.Arcade.StaticBody;
    body.enable = false;
    body.updateFromGameObject();

    const horizontal = definition.width > definition.height;
    const offsetX = horizontal ? definition.width * 0.5 + 10 : 0;
    const offsetY = horizontal ? 0 : definition.height * 0.5 + 10;
    const first = scene.add
      .image(definition.x - offsetX, definition.y - offsetY, 'laser-emitter')
      .setDepth(14);
    const second = scene.add
      .image(definition.x + offsetX, definition.y + offsetY, 'laser-emitter')
      .setDepth(14)
      .setAngle(horizontal ? 180 : 180);

    if (horizontal) {
      first.setAngle(90);
      second.setAngle(-90);
    }

    this.emitters = [first, second];
  }

  update(time: number): void {
    const state = timedCycleState(time, this.definition.activeMs, this.definition.inactiveMs,
      this.definition.warningMs, this.definition.phaseMs);
    const nextActive = state === 'active';
    const warning = state === 'warning';

    if (nextActive !== this.active) {
      this.active = nextActive;
      const body = this.hitbox.body as Phaser.Physics.Arcade.StaticBody;
      body.enable = nextActive;
    }

    const pulse = 0.72 + Math.sin(time * 0.035) * 0.2;
    this.beam.setAlpha(nextActive ? pulse : warning ? 0.18 : 0);
    this.glow.setAlpha(nextActive ? 0.22 + pulse * 0.18 : warning ? 0.08 : 0);

    for (const emitter of this.emitters) {
      emitter.setTint(nextActive || warning ? 0xff405c : 0x526c7e);
    }
  }

  destroy(): void {
    this.hitbox.destroy();
    this.beam.destroy();
    this.glow.destroy();
    for (const emitter of this.emitters) {
      emitter.destroy();
    }
  }
}
