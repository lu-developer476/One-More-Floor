import Phaser from 'phaser';
import type { DoorDefinition } from '../types/game';
import { updateDoorTimer, type DoorTimerState } from '../systems/DoorTimer';
import { Events } from '../utils/EventBus';

export class TimedDoor {
  readonly blocker: Phaser.GameObjects.Rectangle;
  readonly trigger: Phaser.GameObjects.Arc;
  private readonly indicator: Phaser.GameObjects.Graphics;
  private state: DoorTimerState = { phase: 'closed', remainingMs: 0 };
  private openVisual = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly definition: DoorDefinition,
  ) {
    this.blocker = scene.add
      .rectangle(definition.x, definition.y, definition.width, definition.height ?? 180, 0x18242d)
      .setStrokeStyle(3, 0xff9c4a)
      .setDepth(18);
    scene.physics.add.existing(this.blocker, true);
    this.trigger = scene.add
      .circle(definition.triggerX, definition.triggerY, definition.triggerRadius, 0xff9c4a, 0.12)
      .setStrokeStyle(3, 0xffcf80, 0.85)
      .setDepth(12);
    this.indicator = scene.add.graphics().setDepth(25);
  }

  update(deltaMs: number, player: Phaser.Physics.Arcade.Sprite): void {
    const triggered =
      Phaser.Math.Distance.Between(
        player.x,
        player.y,
        this.definition.triggerX,
        this.definition.triggerY,
      ) <= this.definition.triggerRadius;
    const obstructed = Phaser.Geom.Intersects.RectangleToRectangle(
      player.getBounds(),
      this.blocker.getBounds(),
    );
    const previous = this.state.phase;
    this.state = updateDoorTimer(
      this.state,
      deltaMs,
      triggered,
      obstructed,
      this.definition.openMs,
    );
    const open = this.state.phase !== 'closed';
    (this.blocker.body as Phaser.Physics.Arcade.StaticBody).enable = !open;
    const target = open ? 1 : 0;
    this.openVisual = Phaser.Math.Linear(this.openVisual, target, Math.min(1, deltaMs / 140));
    this.blocker.setScale(1, 1 - this.openVisual * 0.94);
    this.blocker.setY(
      this.definition.y - this.openVisual * ((this.definition.height ?? 180) * 0.47),
    );
    this.drawIndicator();
    if (previous !== this.state.phase) this.scene.events.emit(Events.DOOR_STATE, this.state.phase);
  }

  private drawIndicator(): void {
    this.indicator.clear();
    if (this.state.phase === 'closed') return;
    const fraction = this.state.remainingMs / this.definition.openMs;
    this.indicator.lineStyle(5, 0xffcf80, 1).beginPath();
    this.indicator.arc(
      this.definition.triggerX,
      this.definition.triggerY,
      this.definition.triggerRadius - 6,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * fraction,
    );
    this.indicator.strokePath();
  }

  destroy(): void {
    this.blocker.destroy();
    this.trigger.destroy();
    this.indicator.destroy();
  }
}
