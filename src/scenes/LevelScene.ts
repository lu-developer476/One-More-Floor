import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { LevelManager } from '../systems/LevelManager';
import { LevelFactory, type BuiltLevel } from '../systems/LevelFactory';
import { CollapseSystem } from '../systems/CollapseSystem';
import { EnvironmentSystem } from '../systems/EnvironmentSystem';
import { eventBus, Events } from '../utils/EventBus';
import type { LevelDefinition, LevelSceneData } from '../types/game';
import { StorageService, type Settings } from '../services/StorageService';
import { TOTAL_FLOORS } from '../config/levelConfig';
import { audioService } from '../services/AudioService';
import { RunCountdown } from '../systems/RunCountdown';
import { RunRecorder, visualState } from '../runs/RunRecorder';
import { GhostPlayer } from '../runs/GhostPlayer';

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
  private deltaSeconds = 0;
  private countdown!: RunCountdown;
  private recorder!: RunRecorder;
  private ghost?: GhostPlayer;
  private attemptMs = 0;
  private bestTimeMs: number | null = null;
  private runStarted = false;

  constructor() {
    super('Level');
  }
  getRunState(): { countdownFinished: boolean; attemptMs: number; ghostActive: boolean; playerState: string } { return { countdownFinished: this.countdown?.finished ?? false, attemptMs: this.attemptMs, ghostActive: Boolean(this.ghost), playerState: this.player?.states.state ?? 'NONE' }; }

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
    this.attemptMs = 0;
    this.runStarted = false;
    this.lastStart = false;
    this.level = new LevelManager().get(this.levelIndex);
    this.physics.world.setBounds(0, 0, this.level.width, this.level.height);
    this.cameras.main
      .setBounds(0, 0, this.level.width, this.level.height)
      .setBackgroundColor(this.level.backgroundColor);
    this.environment = new EnvironmentSystem(this, this.level);
    this.built = new LevelFactory(this).build(this.level);
    this.player = new Player(this, this.level.spawn.x, this.level.spawn.y);
    const save = new StorageService().load();
    const settings = save.settings;
    const record = save.floors[String(this.level.floor)];
    this.bestTimeMs = record?.bestTimeMs ?? null;
    this.recorder = new RunRecorder(this.level.floor);
    this.player.lock();
    this.physics.world.pause();
    if (settings.showGhost && record?.bestGhost) this.ghost = new GhostPlayer(this, record.bestGhost, 0.28, settings.highContrast);
    audioService.apply(settings);
    this.collapse = new CollapseSystem(this, this.level.durationMs);
    this.bindPhysics();
    this.cameras.main
      .startFollow(this.player, true, 0.14, 0.16)
      .setDeadzone(210, 120)
      .setFollowOffset(-90, 18)
      .fadeIn(180);
    this.scene.launch('UI');
    this.input.keyboard?.on('keydown-R', this.restart, this);
    this.input.keyboard?.on('keydown-ESC', this.openPause, this);
    this.events.on(Events.PLAYER_DASH, this.dashTrail, this);
    this.events.on(Events.PLAYER_LAND, this.onLand, this);
    this.events.on(Events.PLAYER_WALL_JUMP, this.onWallJump, this);
    this.events.on(Events.PLAYER_JUMP, this.onJump, this);
    this.events.on(Events.DOOR_STATE, this.onDoorState, this);
    eventBus.on(Events.SETTINGS_CHANGED, this.applySettings, this);
    eventBus.on(Events.PAUSE_RESTART, this.restart, this);
    this.applySettings(settings);
    this.countdown = new RunCountdown(this, () => { if (this.dead || this.complete) return; this.runStarted = true; this.physics.world.resume(); this.player.unlock(); });
    if (import.meta.env.VITE_E2E) {
      this.events.on('e2e:kill', this.die, this);
      this.events.on('e2e:complete', this.e2eComplete, this);
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    if (new URLSearchParams(window.location.search).has('debug')) this.createDebugPanel();
  }

  private bindPhysics(): void {
    this.physics.add.collider(this.player, this.built.platforms);
    for (const moving of this.built.moving) this.physics.add.collider(this.player, moving);
    for (const falling of this.built.falling)
      this.physics.add.collider(this.player, falling, () => falling.trigger());
    this.physics.add.overlap(this.player, this.built.hazards, () => this.die());
    for (const laser of this.built.lasers)
      this.physics.add.overlap(this.player, laser.hitbox, () => this.die());
    for (const timed of this.built.timedZones)
      this.physics.add.overlap(this.player, timed.zone, () => this.die());
    for (const fan of this.built.forceZones)
      this.physics.add.overlap(this.player, fan.zone, () =>
        fan.applyToPlayer(this.player, this.deltaSeconds),
      );
    for (const belt of this.built.conveyors)
      this.physics.add.overlap(this.player, belt.zone, () =>
        belt.applyToPlayer(this.player, this.deltaSeconds),
      );
    for (const timedDoor of this.built.timedDoors)
      this.physics.add.collider(this.player, timedDoor.blocker);
    this.physics.add.overlap(this.player, this.built.door, () => this.finish());
  }

  update(_time: number, delta: number): void {
    const start = Boolean(this.input.gamepad?.getPad(0)?.buttons[9]?.pressed);
    if (start && !this.lastStart) this.openPause();
    this.lastStart = start;
    if (this.paused || this.dead || this.complete) return;

    const safeDelta = Math.min(Math.max(delta, 0), MAX_FRAME_DELTA_MS);
    this.deltaSeconds = safeDelta / 1000;
    if (!this.runStarted) { this.emitHud(false); return; }
    this.gameplayTimeMs += safeDelta;
    this.attemptMs += safeDelta;
    this.player.update();
    this.recorder.update(safeDelta, { x: this.player.x, y: this.player.y, facing: this.player.facingDirection, state: visualState(this.player.states.state) });
    this.ghost?.update(this.attemptMs);
    for (const moving of this.built.moving) moving.update();
    for (const falling of this.built.falling) falling.update(this.level.height);
    for (const laser of this.built.lasers) laser.update(this.gameplayTimeMs);
    for (const zone of this.built.timedZones) zone.update(this.gameplayTimeMs);
    for (const belt of this.built.conveyors) belt.update(this.deltaSeconds);
    for (const door of this.built.timedDoors) door.update(safeDelta, this.player);
    this.collapse.update(safeDelta);
    const urgency = 1 - this.collapse.timer.remainingMs / this.level.durationMs;
    this.environment.update(this.cameras.main.scrollX, urgency, this.gameplayTimeMs);
    if (this.player.y > this.level.height + 50 || this.collapse.timer.expired) this.die();
    this.emitHud(false);
    this.updateDebugPanel();
  }

  private emitHud(paused: boolean): void {
    eventBus.emit(Events.HUD, {
      floor: this.level.floor,
      totalFloors: TOTAL_FLOORS,
      floorName: this.level.name,
      remainingMs: this.collapse.timer.remainingMs,
      durationMs: this.level.durationMs,
      deaths: this.deaths,
      dashReady: this.player.dashAvailable,
      paused,
      progress: this.player.x / this.level.width,
      attemptMs: this.attemptMs,
      bestTimeMs: this.bestTimeMs,
      ghostActive: Boolean(this.ghost),
    });
  }

  private die(): void {
    if (this.dead || this.complete) return;
    this.dead = true;
    this.recorder.reset();
    this.deaths += 1;
    this.player.kill();
    audioService.play('death', 300);
    this.collapse.stop();
    this.environment.burstSparks(this.player.x, this.player.y, 20);
    const settings = new StorageService().load().settings;
    if (settings.screenShake) this.cameras.main.shake(110, settings.reducedShake ? 0.002 : 0.005);
    if (!settings.reduceFlashes) this.cameras.main.flash(70, 255, 60, 80);
    this.time.delayedCall(80, () => this.cameras.main.fadeOut(DEATH_FADE_MS));
    this.time.delayedCall(DEATH_RESTART_MS, () =>
      this.scene.restart({
        levelIndex: this.levelIndex,
        deaths: this.deaths,
        totalElapsedMs: this.totalElapsedMs,
      }),
    );
  }

  private finish(): void {
    if (this.dead || this.complete) return;
    this.complete = true;
    this.player.lock();
    audioService.play('elevator', 300);
    this.collapse.stop();
    const elapsed = Math.round(this.attemptMs);
    const previousBestMs = this.bestTimeMs;
    const ghostRun = this.recorder.finish(elapsed);
    const ghostSaved = previousBestMs === null || elapsed < previousBestMs;
    this.cameras.main.zoomTo(1.025, 180);
    this.time.delayedCall(260, () => {
      this.scene.stop('UI');
      this.scene.start('Results', {
        elapsedMs: elapsed,
        deaths: this.deaths,
        floor: this.level.floor,
        levelIndex: this.levelIndex,
        totalElapsedMs: this.totalElapsedMs + elapsed,
        final: this.levelIndex === 4,
        previousBestMs,
        ghostSaved,
        ghostRun,
      });
    });
  }
  private e2eComplete(): void {
    if (!this.runStarted) { this.runStarted = true; this.physics.world.resume(); this.player.unlock(); }
    this.attemptMs = Math.max(this.attemptMs, 100);
    this.recorder.update(50, { x: this.player.x, y: this.player.y, facing: this.player.facingDirection, state: visualState(this.player.states.state) });
    this.recorder.update(50, { x: this.player.x + 1, y: this.player.y, facing: this.player.facingDirection, state: visualState(this.player.states.state) });
    this.finish();
  }

  private restart(): void {
    if (this.dead || this.complete) return;
    this.scene.restart({
      levelIndex: this.levelIndex,
      deaths: this.deaths,
      totalElapsedMs: this.totalElapsedMs,
    });
  }

  private openPause(): void {
    if (this.dead || this.complete) return;
    if (this.scene.isActive('Pause')) return;
    audioService.pause();
    this.scene.pause();
    this.scene.launch('Pause');
  }

  private onLand(x: number, y: number, kind: 'soft' | 'hard'): void {
    this.environment.burstSmoke(x, y + 18, kind === 'hard' ? 9 : 4);
    audioService.play('land');
    if (kind === 'hard') {
      const settings = new StorageService().load().settings;
      if (settings.screenShake) this.cameras.main.shake(70, settings.reducedShake ? 0.001 : 0.0025);
    }
  }

  private onWallJump(): void {
    audioService.play('wallJump');
  }

  private onJump(): void {
    audioService.play('jump');
  }

  private onDoorState(): void {
    audioService.play('door', 200);
  }

  private applySettings(settings: Settings): void {
    audioService.apply(settings);
    if (settings.highContrast) this.player.setTint(0xffffff);
    else this.player.clearTint();
    for (const platform of this.built.platforms.getChildren()) {
      (platform as Phaser.Physics.Arcade.Sprite).setTint(
        settings.highContrast ? 0xe8f7ff : 0xffffff,
      );
    }
  }

  private dashTrail(x: number, y: number): void {
    audioService.play('dash');
    for (let i = 0; i < 4; i += 1) {
      const ghost = this.add.image(x - i * 9, y, 'player-dash').setAlpha(0.45 - i * 0.08);
      this.tweens.add({
        targets: ghost,
        alpha: 0,
        duration: 180 + i * 20,
        onComplete: () => ghost.destroy(),
      });
    }
  }

  private createDebugPanel(): void {
    this.debugText = this.add
      .text(8, 62, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#000000cc',
        padding: { x: 6, y: 5 },
      })
      .setScrollFactor(0)
      .setDepth(200);
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
    this.countdown?.destroy();
    this.ghost?.destroy();
    this.input.keyboard?.off('keydown-R', this.restart, this);
    this.input.keyboard?.off('keydown-ESC', this.openPause, this);
    this.events.off(Events.PLAYER_DASH, this.dashTrail, this);
    this.events.off(Events.PLAYER_LAND, this.onLand, this);
    this.events.off(Events.PLAYER_WALL_JUMP, this.onWallJump, this);
    this.events.off(Events.PLAYER_JUMP, this.onJump, this);
    this.events.off(Events.DOOR_STATE, this.onDoorState, this);
    eventBus.off(Events.SETTINGS_CHANGED, this.applySettings, this);
    eventBus.off(Events.PAUSE_RESTART, this.restart, this);
    this.events.off('e2e:kill', this.die, this);
    this.events.off('e2e:complete', this.e2eComplete, this);
    for (const door of this.built.timedDoors) door.destroy();
    this.environment.destroy();
    this.scene.stop('UI');
  }
}
