import Phaser from 'phaser';
import type { LevelDefinition, TimedHazardDefinition } from '../types/game';
import { addSpikes } from '../objects/Hazard';
import { timedCycleState } from './TimedCycle';
import { MovingPlatform } from '../objects/MovingPlatform';
import { FallingPlatform } from '../objects/FallingPlatform';
import { LaserGate } from '../objects/LaserGate';
import { ExitDoor } from '../objects/ExitDoor';
import { TimedDoor } from '../objects/TimedDoor';
import { acceleratedVelocity, conveyorVelocity } from './PhysicsMath';

export interface BuiltLevel {
  platforms: Phaser.Physics.Arcade.StaticGroup;
  hazards: Phaser.Physics.Arcade.StaticGroup;
  moving: MovingPlatform[];
  falling: FallingPlatform[];
  lasers: LaserGate[];
  timedZones: TimedZone[];
  forceZones: ForceZone[];
  conveyors: ConveyorZone[];
  timedDoors: TimedDoor[];
  door: ExitDoor;
  objects: number;
}

export class TimedZone {
  readonly id: string;
  readonly zone: Phaser.GameObjects.Zone;
  private readonly visual: Phaser.GameObjects.Rectangle;
  constructor(
    scene: Phaser.Scene,
    private readonly definition: TimedHazardDefinition,
    color: number,
  ) {
    this.id = definition.id ?? 'electricity-unknown';
    this.visual = scene.add
      .rectangle(definition.x, definition.y, definition.width, definition.height ?? 30, color, 0.15)
      .setDepth(10);
    this.zone = scene.add.zone(
      definition.x,
      definition.y,
      definition.width,
      definition.height ?? 30,
    );
    scene.physics.add.existing(this.zone, true);
    (this.zone.body as Phaser.Physics.Arcade.StaticBody).enable = false;
  }
  update(time: number): void {
    const state = timedCycleState(
      time,
      this.definition.activeMs,
      this.definition.inactiveMs,
      this.definition.warningMs,
      this.definition.phaseMs,
    );
    const active = state === 'active';
    (this.zone.body as Phaser.Physics.Arcade.StaticBody).enable = active;
    const warning = state === 'warning';
    this.visual
      .setAlpha(active ? 0.75 : warning ? 0.35 : 0.12)
      .setStrokeStyle(warning ? 3 : 1, 0xffffff, warning ? 0.9 : 0.3);
  }
}

export class ForceZone {
  readonly zone: Phaser.GameObjects.Zone;
  constructor(
    scene: Phaser.Scene,
    readonly forceX: number,
    readonly forceY: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    this.zone = scene.add.zone(x, y, width, height);
    scene.physics.add.existing(this.zone, true);
    for (let index = 0; index < 5; index += 1)
      scene.add
        .text(x - width / 2 + (index * width) / 5, y, forceY < 0 ? '↑' : forceX < 0 ? '←' : '→', {
          fontFamily: 'monospace',
          fontSize: '22px',
          color: '#bcecff',
        })
        .setAlpha(0.45);
  }
  applyToPlayer(player: Phaser.Physics.Arcade.Sprite, deltaSeconds: number): void {
    const velocity = player.body?.velocity ?? new Phaser.Math.Vector2();
    player.setVelocity(
      acceleratedVelocity(velocity.x, this.forceX, deltaSeconds, 760),
      acceleratedVelocity(velocity.y, this.forceY, deltaSeconds, 980),
    );
  }
}

export class ConveyorZone {
  readonly zone: Phaser.GameObjects.Zone;
  private readonly visual: Phaser.GameObjects.TileSprite;
  constructor(
    scene: Phaser.Scene,
    readonly speed: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    this.zone = scene.add.zone(x, y, width, height);
    scene.physics.add.existing(this.zone, true);
    this.visual = scene.add
      .tileSprite(x, y, width, height, 'moving-platform')
      .setTint(speed > 0 ? 0x77f29a : 0xff9c4a)
      .setDepth(5);
  }
  applyToPlayer(player: Phaser.Physics.Arcade.Sprite, deltaSeconds: number): void {
    player.setVelocityX(conveyorVelocity(player.body?.velocity.x ?? 0, this.speed, deltaSeconds));
  }
  update(deltaSeconds: number): void {
    this.visual.tilePositionX -= this.speed * deltaSeconds;
  }
}

export class LevelFactory {
  constructor(private readonly scene: Phaser.Scene) {}
  build(level: LevelDefinition): BuiltLevel {
    const platforms = this.scene.physics.add.staticGroup();
    for (const platform of level.platforms) {
      const sprite = platforms.create(
        platform.x,
        platform.y,
        platform.style === 'warning'
          ? 'platform-warning'
          : platform.style === 'wall'
            ? 'wall'
            : 'platform',
      ) as Phaser.Physics.Arcade.Sprite;
      sprite.setDisplaySize(platform.width, platform.height ?? 24).refreshBody();
      if (platform.oneWay)
        (sprite.body as Phaser.Physics.Arcade.StaticBody).checkCollision.down = false;
    }
    const hazards = this.scene.physics.add.staticGroup();
    for (const spike of level.spikes) addSpikes(hazards, spike.x, spike.y, spike.width);
    const moving = level.movingPlatforms.map(
      (definition) => new MovingPlatform(this.scene, definition),
    );
    const falling = level.fallingPlatforms.map(
      (definition) => new FallingPlatform(this.scene, definition),
    );
    const lasers = level.lasers.map((definition) => new LaserGate(this.scene, definition));
    const timedZones = level.electricZones.map(
      (definition) => new TimedZone(this.scene, definition, 0x5ef1ff),
    );
    const forceZones = level.fans.map(
      (definition) =>
        new ForceZone(
          this.scene,
          definition.forceX,
          definition.forceY,
          definition.x,
          definition.y,
          definition.width,
          definition.height ?? 100,
        ),
    );
    const conveyors = level.conveyors.map(
      (definition) =>
        new ConveyorZone(
          this.scene,
          definition.speed,
          definition.x,
          definition.y,
          definition.width,
          definition.height ?? 28,
        ),
    );
    const timedDoors = level.doors.map((definition) => new TimedDoor(this.scene, definition));
    for (const tutorial of level.tutorials)
      this.scene.add
        .text(tutorial.x, tutorial.y, tutorial.text, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#d9e7ed',
          backgroundColor: '#101820aa',
          padding: { x: 8, y: 5 },
        })
        .setDepth(30);
    const door = new ExitDoor(this.scene, level.exit.x, level.exit.y);
    return {
      platforms,
      hazards,
      moving,
      falling,
      lasers,
      timedZones,
      forceZones,
      conveyors,
      timedDoors,
      door,
      objects:
        platforms.getLength() +
        hazards.getLength() +
        moving.length +
        falling.length +
        lasers.length +
        timedDoors.length,
    };
  }
}
