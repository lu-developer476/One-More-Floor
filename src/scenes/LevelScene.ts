import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { LevelManager } from '../systems/LevelManager';
import { LevelFactory, type BuiltLevel } from '../systems/LevelFactory';
import { CollapseSystem } from '../systems/CollapseSystem';
import { EnvironmentSystem } from '../systems/EnvironmentSystem';
import { eventBus, Events } from '../utils/EventBus';
import type { LevelDefinition, LevelSceneData } from '../types/game';
import { StorageService } from '../services/StorageService';

const DEATH_FADE_MS = 260;
const DEATH_RESTART_MS = 480;
const MAX_FRAME_DELTA_MS = 50;

export class LevelScene extends Phaser.Scene {
  private player!: Player;
  private level!: LevelDefinition;
  private built!: BuiltLevel;
  private collapse!: CollapseSystem;
  private environment!: EnvironmentSystem;
  private debugText?: Phaser.GameObjects.Text;
  private dead = false;
  private complete = false;
  private paused = false;
  private deaths = 0;
  private levelIndex = 0;
  private totalElapsedMs = 0;
  private gameplayTimeMs = 0;
  private lastStart = false;

  constructor() { super('Level'); }

  init(data: LevelSceneData): void {
    this.levelIndex = data.levelIndex ?? 0;
    this.deaths = data.deaths ?? 0;
    this.totalElapsedMs = data.totalElapsedMs ?? 0;
  }

  create(): void {
    this.dead = false;
    this.complete = false;
    this.paused = false;
    this.gameplayTimeMs = 0;
    this.lastStart = false;
    this.level = new LevelManager().get(this.levelIndex);
    this.physics.world.setBounds(0, 0, this.level.width, this.level.height);
    this.cameras.main.setBounds(0, 0, this.level.width, this.level.height)
      .setBackgroundColor(this.level.backgroundColor);
    this.environment = new EnvironmentSystem(this, this.level);
    this.built = new LevelFactory(this).build(this.level);
    this.player = new Player(this, this.level.spawn.x, this.level.spawn.y);
    this.collapse = new CollapseSystem(this, this.level.durationMs);
    this.bindPhysics();
    this.cameras.main.startFollow(this.player, true, 0.14, 0.16)
      .setDeadzone(210, 120).setFollowOffset(-90, 18).fadeIn(180);
    this.scene.launch('UI');
    this.input.keyboard?.on('keydown-R', this.restart, this);
    this.input.keyboard?.on('keydown-ESC', this.togglePause, this);
    this.events.on('player:dash', this.dashTrail, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    if (new URLSearchParams(window.location.search).has('debug')) this.createDebugPanel();
  }

  private bindPhysics(): void {
    this.physics.add.collider(this.player, this.built.platforms);
    for (const moving of this.built.moving) this.physics.add.collider(this.player, moving);
    for (const falling of this.built.falling) this.physics.add.collider(this.player, falling, () => falling.trigger());
    this.physics.add.overlap(this.player, this.built.hazards, () => this.die());
    for (const laser of this.built.lasers) this.physics.add.overlap(this.player, laser.hitbox, () => this.die());
    for (const timed of this.built.timedZones) this.physics.add.overlap(this.player, timed.zone, () => this.die());
    for (const fan of this.built.forceZones) this.physics.add.overlap(this.player, fan.zone, () => {
      this.player.setVelocity(
        (this.player.body?.velocity.x ?? 0) + fan.forceX / 60,
        (this.player.body?.velocity.y ?? 0) + fan.forceY / 60,
      );
    });
    for (const belt of this.built.conveyors) this.physics.add.overlap(this.player, belt.zone, () => {
      this.player.setVelocityX((this.player.body?.velocity.x ?? 0) + belt.speed / 30);
    });
    this.physics.add.overlap(this.player, this.built.door, () => this.finish());
  }

  update(_time: number, delta: number): void {
    const start = Boolean(this.input.gamepad?.getPad(0)?.buttons[9]?.pressed);
    if (start && !this.lastStart) this.togglePause();
    this.lastStart = start;
    if (this.paused || this.dead || this.complete) return;

    const safeDelta = Math.min(Math.max(delta, 0), MAX_FRAME_DELTA_MS);
    this.gameplayTimeMs += safeDelta;
    this.player.update();
    for (const moving of this.built.moving) moving.update();
    for (const falling of this.built.falling) falling.update(this.level.height);
    for (const laser of this.built.lasers) laser.update(this.gameplayTimeMs);
    for (const zone of this.built.timedZones) zone.update(this.gameplayTimeMs);
    this.collapse.update(safeDelta);
    const urgency = 1 - this.collapse.timer.remainingMs / this.level.durationMs;
    this.environment.update(this.cameras.main.scrollX, urgency, this.gameplayTimeMs);
    if (this.player.y > this.level.height + 50 || this.collapse.timer.expired) this.die();
    this.emitHud(false);
    this.updateDebugPanel();
  }

  private emitHud(paused: boolean): void {
    eventBus.emit(Events.HUD, {
      floor: this.level.floor, totalFloors: 5, floorName: this.level.name,
      remainingMs: this.collapse.timer.remainingMs, durationMs: this.level.durationMs,
      deaths: this.deaths, dashReady: this.player.dashAvailable, paused,
      progress: this.player.x / this.level.width,
    });
  }

  private die(): void {
    if (this.dead || this.complete) return;
    this.dead = true;
    this.deaths += 1;
    this.player.kill();
    this.collapse.stop();
    this.environment.burstSparks(this.player.x, this.player.y, 20);
    const settings = new StorageService().load().settings;
    if (settings.screenShake) this.cameras.main.shake(110, settings.reducedShake ? 0.002 : 0.005);
    if (!settings.reduceFlashes) this.cameras.main.flash(70, 255, 60, 80);
    this.time.delayedCall(80, () => this.cameras.main.fadeOut(DEATH_FADE_MS));
    this.time.delayedCall(DEATH_RESTART_MS, () => this.scene.restart({
      levelIndex: this.levelIndex, deaths: this.deaths, totalElapsedMs: this.totalElapsedMs,
    }));
  }

  private finish(): void {
    if (this.dead || this.complete) return;
    this.complete = true;
    this.collapse.stop();
    const elapsed = this.level.durationMs - this.collapse.timer.remainingMs;
    this.cameras.main.zoomTo(1.025, 180);
    this.time.delayedCall(260, () => {
      this.scene.stop('UI');
      this.scene.start('Results', { elapsedMs: elapsed, deaths: this.deaths, floor: this.level.floor,
        levelIndex: this.levelIndex, totalElapsedMs: this.totalElapsedMs + elapsed, final: this.levelIndex === 4 });
    });
  }

  private restart(): void {
    if (this.dead || this.complete) return;
    this.scene.restart({ levelIndex: this.levelIndex, deaths: this.deaths, totalElapsedMs: this.totalElapsedMs });
  }

  private togglePause(): void {
    if (this.dead || this.complete) return;
    this.paused = !this.paused;
    if (this.paused) this.physics.world.pause(); else this.physics.world.resume();
    this.emitHud(this.paused);
  }

  private dashTrail(x: number, y: number): void {
    for (let i = 0; i < 4; i += 1) {
      const ghost = this.add.image(x - i * 9, y, 'player-dash').setAlpha(0.45 - i * 0.08);
      this.tweens.add({ targets: ghost, alpha: 0, duration: 180 + i * 20, onComplete: () => ghost.destroy() });
    }
  }

  private createDebugPanel(): void {
    this.debugText = this.add.text(8, 62, '', { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
      backgroundColor: '#000000cc', padding: { x: 6, y: 5 } }).setScrollFactor(0).setDepth(200);
  }

  private updateDebugPanel(): void {
    if (!this.debugText) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const objects = this.children.list.filter((child) => child.active).length;
    const wall = body.blocked.left || body.blocked.right;
    this.debugText.setText([
      `FPS ${this.game.loop.actualFps.toFixed(1)}  OBJECTS ~${objects}`,
      `FLOOR ${this.level.floor}  TIME ${(this.collapse.timer.remainingMs / 1000).toFixed(2)}`,
      `${this.player.states.state}  POS ${this.player.x.toFixed(1)},${this.player.y.toFixed(1)}`,
      `VEL ${body.velocity.x.toFixed(1)},${body.velocity.y.toFixed(1)}`,
      `GROUND ${body.blocked.down || body.touching.down}  WALL ${wall}  DASH ${this.player.dashAvailable}`,
    ]);
  }

  private shutdown(): void {
    this.input.keyboard?.off('keydown-R', this.restart, this);
    this.input.keyboard?.off('keydown-ESC', this.togglePause, this);
    this.events.off('player:dash', this.dashTrail, this);
    this.environment.destroy();
    this.scene.stop('UI');
  }
}
