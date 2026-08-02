import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { LevelManager } from '../systems/LevelManager';
import { LevelFactory, type BuiltLevel } from '../systems/LevelFactory';
import { CollapseSystem } from '../systems/CollapseSystem';
import { EnvironmentSystem } from '../systems/EnvironmentSystem';
import { eventBus, Events } from '../utils/EventBus';
import type { LevelDefinition, LevelSceneData } from '../types/game';
import { MOVEMENT } from '../config/movementConfig';
import { StorageService, type SaveData, type Settings } from '../services/StorageService';
import { TOTAL_FLOORS } from '../config/levelConfig';
import { audioService } from '../services/AudioService';
import { RunCountdown } from '../systems/RunCountdown';
import { visualState } from '../runs/RunRecorder';
import { AttemptSession, type DeathCause, type RunContext } from '../runs/AttemptSession';
import { GhostPlayer } from '../runs/GhostPlayer';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { LocalAnalyticsService } from '../analytics/LocalAnalyticsService';
import { SplitFeedback } from '../ui/SplitFeedback';
import { calculateBestTheoretical } from '../systems/SplitComparisons';
import { createFloorRunData, initialAnchor } from '../runs/RunContext';
import { EnemySystem } from '../enemies/EnemySystem';

const DEATH_FADE_MS = 260;
const DEATH_RESTART_MS = 480;
const MAX_FRAME_DELTA_MS = 50;

export class LevelScene extends Phaser.Scene {
  private player!: Player;
  private level!: LevelDefinition;
  private built!: BuiltLevel;
  private collapse!: CollapseSystem;
  private environment!: EnvironmentSystem;
  private enemies!: EnemySystem;
  private debugText?: Phaser.GameObjects.Text;
  private dead = false;
  private complete = false;
  private paused = false;
  private deaths = 0;
  private levelIndex = 0;
  private totalElapsedMs = 0;
  private gameplayTimeMs = 0;
  private deltaSeconds = 0;
  private countdown!: RunCountdown;
  private ghost?: GhostPlayer;
  private bestTimeMs: number | null = null;
  private inputManager!: InputManager;
  private session!: AttemptSession;
  private context!: RunContext;
  private analytics!: LocalAnalyticsService;
  private feedback!: SplitFeedback;
  private bestRunSplits: Record<string, number> = {};
  private bestTheoreticalMs: number | null = null;
  private lastDeltaMs: number | null = null;
  private closure: 'active' | 'died' | 'restarted' | 'completed' | 'abandoned' = 'active';
  private jumpEvents = 0;
  private dashEvents = 0;
  private saveSnapshot!: SaveData;

  constructor() {
    super('Level');
  }
  getRunState() {
    return {
      countdownFinished: this.countdown?.finished ?? false,
      attemptMs: this.session.attemptMs,
      ghostActive: Boolean(this.ghost),
      playerState: this.player?.states.state ?? 'NONE',
      mode: this.session.context.mode,
      eligibility: this.session.eligibility,
      anchorId: this.session.context.anchorId,
      x: this.player?.x ?? 0,
      y: this.player?.y ?? 0,
      velocityX: (this.player?.body as Phaser.Physics.Arcade.Body | undefined)?.velocity.x ?? 0,
      velocityY: (this.player?.body as Phaser.Physics.Arcade.Body | undefined)?.velocity.y ?? 0,
      currentSplit: this.session?.splits.current ?? null,
      nextSplit: this.session?.splits.next ?? null,
      completedSplits: this.session?.splits.completed ?? [],
      lastSplitFeedback: this.feedback?.last ?? null,
      isDashing: this.player?.isDashing ?? false,
      dashRemainingMs: this.player?.dashRemainingMs ?? 0,
      jumpEvents: this.jumpEvents,
      airJumpAvailable: this.player?.airJumpAvailable ?? false,
      lastJumpKind: this.player?.jumpKind ?? null,
      dashEvents: this.dashEvents,
      enemies: this.enemies?.debug() ?? [],
    };
  }

  init(data: LevelSceneData): void {
    const levelIndex = data.levelIndex ?? 0;
    this.levelIndex = levelIndex;
    this.deaths = data.deaths ?? 0;
    this.totalElapsedMs = data.totalElapsedMs ?? 0;
    const base = createFloorRunData(
      levelIndex,
      data.mode ?? 'competitive',
      data.anchorId ?? initialAnchor(levelIndex),
      data.allowE2ECompetitive,
    );
    this.context = Object.freeze({
      ...base,
      scope: data.scope ?? base.scope,
      towerRunId: data.towerRunId ?? null,
      gameplayAssist: data.gameplayAssist ?? base.gameplayAssist,
    });
  }

  create(): void {
    this.dead = false;
    this.complete = false;
    this.paused = false;
    this.gameplayTimeMs = 0;
    this.jumpEvents = 0;
    this.dashEvents = 0;
    this.level = new LevelManager().get(this.levelIndex);
    this.physics.world.setBounds(0, 0, this.level.width, this.level.height);
    this.cameras.main
      .setBounds(0, 0, this.level.width, this.level.height)
      .setBackgroundColor(this.level.backgroundColor);
    this.environment = new EnvironmentSystem(this, this.level);
    this.built = new LevelFactory(this).build(this.level);
    const save = new StorageService().load();
    this.saveSnapshot = save;
    const settings = save.settings;
    this.inputManager = new InputManager(this, save.input);
    this.inputManager.blockInherited();

    const anchor =
      this.level.practiceAnchors.find((item) => item.id === this.context.anchorId) ??
      this.level.practiceAnchors[0]!;
    this.player = new Player(this, anchor.x, anchor.y, this.inputManager);
    const anchorSplitOrder = anchor.startingSplitId === null ? -1 : (this.level.splits.find((split) => split.id === anchor.startingSplitId)?.order ?? -1);
    const enemyDefinitions = this.context.mode === 'practice'
      ? this.level.enemies.filter((enemy) => enemy.activationSplitId === null || (this.level.splits.find((split) => split.id === enemy.activationSplitId)?.order ?? -1) >= anchorSplitOrder)
      : this.level.enemies;
    this.enemies = new EnemySystem(
      this,
      enemyDefinitions,
      this.player,
      settings,
      { staticPlatforms: this.built.platforms, timedDoors: this.built.timedDoors, worldBounds: new Phaser.Geom.Rectangle(0, 0, this.level.width, this.level.height) },
      (sourceId) => this.die({ cause: 'enemy', sourceId }),
      (enemy) => { this.analytics.enemyDisabled(this.levelIndex, enemy.definition.id); eventBus.emit(Events.TOAST, enemy.definition.kind === 'maintenance-bot' ? 'AUTÓMATA DESACTIVADO' : 'DRON DESACTIVADO'); },
    );
    const record = save.floors[String(this.level.floor)];
    this.bestTimeMs = record?.bestTimeMs ?? null;
    this.session = new AttemptSession(
      this.context,
      this.level.floor,
      this.level.splits,
      anchor.startingSplitId,
      Boolean(import.meta.env.VITE_E2E),
    );
    this.bestRunSplits = record?.bestRunSplits ?? {};
    this.bestTheoreticalMs = calculateBestTheoretical(this.level, record?.bestSegments ?? {});
    this.analytics = new LocalAnalyticsService(settings.localAnalyticsEnabled);
    this.analytics.start(this.context);
    this.feedback = new SplitFeedback(this, settings.highContrast);
    this.player.lock();
    this.physics.world.pause();
    if (settings.showGhost && record?.bestGhost)
      this.ghost = new GhostPlayer(this, record.bestGhost, 0.28, settings.highContrast);
    audioService.apply(settings);
    this.collapse = new CollapseSystem(this, this.level.durationMs);
    this.bindPhysics();
    this.cameras.main
      .startFollow(this.player, true, 0.14, 0.16)
      .setDeadzone(210, 120)
      .setFollowOffset(-90, 18)
      .fadeIn(180);
    this.scene.launch('UI');
    this.events.on(Events.PLAYER_DASH, this.dashTrail, this);
    this.events.on(Events.PLAYER_LAND, this.onLand, this);
    this.events.on(Events.PLAYER_WALL_JUMP, this.onWallJump, this);
    this.events.on(Events.PLAYER_JUMP, this.onJump, this);
    this.events.on(Events.PLAYER_AIR_JUMP, this.onAirJump, this);
    this.events.on(Events.DOOR_STATE, this.onDoorState, this);
    eventBus.on(Events.SETTINGS_CHANGED, this.applySettings, this);
    eventBus.on(Events.PAUSE_RESTART, this.restart, this);
    eventBus.on(Events.RUN_ABANDON, this.abandon, this);
    this.applySettings(settings);
    this.countdown = new RunCountdown(this, () => {
      if (this.dead || this.complete) return;
      this.session.start();
      this.physics.world.resume();
      this.player.unlock();
      this.enemies.resume();
    });
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
    this.physics.add.overlap(this.player, this.built.hazards, () =>
      this.die({ cause: 'spikes', sourceId: 'level-spikes' }),
    );
    for (const laser of this.built.lasers)
      this.physics.add.overlap(this.player, laser.hitbox, () =>
        this.die({ cause: 'laser', sourceId: laser.id }),
      );
    for (const timed of this.built.timedZones)
      this.physics.add.overlap(this.player, timed.zone, () =>
        this.die({ cause: 'electricity', sourceId: timed.id }),
      );
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
    for (const split of this.built.splitZones)
      this.physics.add.overlap(this.player, split.zone, () =>
        this.triggerSplit(split.definition.id),
      );
    this.physics.add.overlap(this.player, this.built.door, () => this.finish());
  }

  triggerSplit(id: string) {
    const result = this.session.triggerSplit(id);
    if (!result) return null;
    const reference = this.bestRunSplits[id];
    this.lastDeltaMs = reference === undefined ? null : result.cumulativeMs - reference;
    this.analytics.split(this.levelIndex, id, result.segmentMs);
    const settings = this.saveSnapshot.settings;
    this.feedback.show(result, this.lastDeltaMs, settings.reduceFlashes);
    return result;
  }

  update(_time: number, delta: number): void {
    this.inputManager.poll();
    if (this.inputManager.wasPressed(InputAction.PAUSE)) this.openPause();
    if (this.inputManager.wasPressed(InputAction.RESTART)) this.restart();
    if (this.paused || this.dead || this.complete) return;

    const safeDelta = Math.min(Math.max(delta, 0), MAX_FRAME_DELTA_MS);
    this.deltaSeconds = safeDelta / 1000;
    if (!this.session.started) {
      this.emitHud(false);
      return;
    }
    this.gameplayTimeMs += safeDelta;
    this.enemies.update(this.gameplayTimeMs, safeDelta);
    this.player.update();
    this.session.update(safeDelta, {
      x: this.player.x,
      y: this.player.y,
      facing: this.player.facingDirection,
      state: visualState(this.player.states.state),
    });
    this.ghost?.update(this.session.attemptMs);
    for (const moving of this.built.moving) moving.update();
    for (const falling of this.built.falling) falling.update(this.level.height);
    for (const laser of this.built.lasers) laser.update(this.gameplayTimeMs);
    for (const zone of this.built.timedZones) zone.update(this.gameplayTimeMs);
    for (const belt of this.built.conveyors) belt.update(this.deltaSeconds);
    for (const door of this.built.timedDoors) door.update(safeDelta, this.player);
    this.collapse.update(safeDelta);
    const urgency = 1 - this.collapse.timer.remainingMs / this.level.durationMs;
    this.environment.update(this.cameras.main.scrollX, urgency, this.gameplayTimeMs);
    if (
      this.player.y > this.level.height + 50 ||
      (this.session.context.mode !== 'practice' && this.collapse.timer.expired)
    )
      this.die({
        cause: this.player.y > this.level.height + 50 ? 'fall' : 'collapse',
        sourceId:
          this.player.y > this.level.height + 50 ? 'world-bottom' : `${this.level.id}-collapse`,
      });
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
      airJumpReady: this.player.airJumpAvailable,
      paused,
      progress: this.player.x / this.level.width,
      attemptMs: this.session.attemptMs,
      bestTimeMs: this.bestTimeMs,
      ghostActive: Boolean(this.ghost),
      runMode: this.session.context.mode,
      eligibility: this.session.eligibility.status,
      practiceAnchor: this.session.context.anchorId,
      nextSplit: this.session.splits.next?.name ?? null,
      nextReferenceMs: this.session.splits.next
        ? (this.bestRunSplits[this.session.splits.next.id] ?? null)
        : null,
      lastSplit: this.session.splits.current,
      lastDeltaMs: this.lastDeltaMs,
      bestTheoreticalMs:
        this.session.context.mode === 'practice' && this.session.splits.omitted.length
          ? null
          : this.bestTheoreticalMs,
    });
  }

  private die(
    details: { cause: DeathCause; sourceId: string } = { cause: 'unknown', sourceId: 'unknown' },
  ): void {
    if (this.dead || this.complete) return;
    this.dead = true;
    this.enemies.pause();
    this.closure = 'died';
    this.session.recordDeath(details.cause, details.sourceId);
    this.analytics.death(this.levelIndex, details.cause, details.sourceId);
    this.session.discard();
    this.deaths += 1;
    this.player.kill();
    audioService.play('death', 300);
    this.collapse.stop();
    this.environment.burstSparks(this.player.x, this.player.y, 20);
    const settings = this.saveSnapshot.settings;
    if (settings.screenShake) this.cameras.main.shake(110, settings.reducedShake ? 0.002 : 0.005);
    if (!settings.reduceFlashes) this.cameras.main.flash(70, 255, 60, 80);
    this.time.delayedCall(80, () => this.cameras.main.fadeOut(DEATH_FADE_MS));
    this.time.delayedCall(DEATH_RESTART_MS, () =>
      this.scene.restart({
        deaths: this.deaths,
        totalElapsedMs: this.totalElapsedMs,
        ...this.session.restartData(),
      }),
    );
  }

  private finish(): void {
    if (this.dead || this.complete) return;
    this.complete = true;
    const finalSplit = this.level.splits.at(-1);
    if (finalSplit && this.session.splits.next?.id === finalSplit.id)
      this.triggerSplit(finalSplit.id);
    if (this.session.splits.next && this.context.mode !== 'practice') {
      this.complete = false;
      return;
    }
    this.closure = 'completed';
    this.player.lock();
    audioService.play('elevator', 300);
    this.collapse.stop();
    const result = this.session.finish();
    const elapsed = result.elapsedMs;
    this.analytics.complete(this.levelIndex, elapsed);
    this.cameras.main.zoomTo(1.025, 180);
    this.time.delayedCall(260, () => {
      this.scene.stop('UI');
      this.scene.start(this.context.scope === 'tower' ? 'TowerFloorResults' : 'Results', {
        elapsedMs: elapsed,
        deaths: this.deaths,
        floor: this.level.floor,
        levelIndex: this.levelIndex,
        totalElapsedMs: this.totalElapsedMs + elapsed,
        final: this.levelIndex === TOTAL_FLOORS - 1,
        ghostRun: result.ghostRun,
        splits: result.cumulativeSplits,
        segments: result.segments,
        mode: this.session.context.mode,
        eligibility: this.session.eligibility,
        context: this.session.context,
      });
    });
  }
  private e2eComplete(): void {
    if (!this.session.started) {
      this.session.start();
      this.physics.world.resume();
      this.player.unlock();
    }
    this.session.recorder.update(50, {
      x: this.player.x,
      y: this.player.y,
      facing: this.player.facingDirection,
      state: visualState(this.player.states.state),
    });
    this.session.recorder.update(50, {
      x: this.player.x + 1,
      y: this.player.y,
      facing: this.player.facingDirection,
      state: visualState(this.player.states.state),
    });
    while (this.session.splits.next) this.triggerSplit(this.session.splits.next.id);
    this.finish();
  }

  private restart(): void {
    if (this.dead || this.complete) return;
    this.closure = 'restarted';
    this.analytics.restart(this.levelIndex);
    this.scene.restart({
      ...this.session.restartData(),
      deaths: this.deaths,
      totalElapsedMs: this.totalElapsedMs,
    });
  }

  private abandon(): void {
    if (this.closure !== 'active') return;
    this.closure = 'abandoned';
    this.analytics.abandon(this.levelIndex);
  }

  private openPause(): void {
    if (this.dead || this.complete) return;
    if (this.scene.isActive('Pause')) return;
    audioService.pause();
    this.scene.pause();
    this.scene.launch('Pause', { context: this.context });
  }

  private onLand(x: number, y: number, kind: 'soft' | 'hard'): void {
    this.environment.burstSmoke(x, y + 18, kind === 'hard' ? 9 : 4);
    audioService.play('land');
    if (kind === 'hard') {
      const settings = this.saveSnapshot.settings;
      if (settings.screenShake) this.cameras.main.shake(70, settings.reducedShake ? 0.001 : 0.0025);
    }
  }

  private onWallJump(): void {
    audioService.play('wallJump');
  }

  private onJump(): void {
    this.jumpEvents += 1;
    audioService.play('jump');
  }

  private onAirJump(x: number, y: number): void {
    const settings = this.saveSnapshot.settings;
    audioService.play('airJump');
    if (settings.particleIntensity !== 'off')
      this.environment.burstSmoke(x, y + 12, settings.particleIntensity === 'reduced' ? 3 : 7);
    this.tweens.add({
      targets: this.player,
      scaleX: 1.14,
      scaleY: 0.88,
      yoyo: true,
      duration: settings.reduceFlashes ? 55 : 80,
    });
  }

  private onDoorState(): void {
    audioService.play('door', 200);
  }

  private applySettings(settings: Settings): void {
    this.saveSnapshot.settings = { ...settings };
    audioService.apply(settings);
    this.enemies?.applySettings(settings);
    if (settings.highContrast) this.player.setTint(0xffffff);
    else this.player.clearTint();
    const record = this.saveSnapshot.floors[String(this.level.floor)];
    if (!settings.showGhost) {
      this.ghost?.destroy();
      this.ghost = undefined;
    } else if (!this.ghost && record?.bestGhost)
      this.ghost = new GhostPlayer(this, record.bestGhost, 0.28, settings.highContrast);
    this.ghost?.applyAppearance(settings.highContrast);
    for (const platform of this.built.platforms.getChildren()) {
      (platform as Phaser.Physics.Arcade.Sprite).setTint(
        settings.highContrast ? 0xe8f7ff : 0xffffff,
      );
    }
  }

  private dashTrail(x: number, y: number): void {
    this.dashEvents += 1;
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
      `INPUT L=${this.inputManager.settings.keyboard.MOVE_LEFT} R=${this.inputManager.settings.keyboard.MOVE_RIGHT}`,
      `INPUT JUMP=${this.inputManager.settings.keyboard.JUMP} DASH=${this.inputManager.settings.keyboard.DASH} PAUSE=${this.inputManager.settings.keyboard.PAUSE}`,
      `JUMP speed=${MOVEMENT.jumpSpeed} cut=${MOVEMENT.jumpCutMultiplier} queued=${this.player.jumpQueued}`,
      `DASH duration=${MOVEMENT.dashDurationMs} speed=${MOVEMENT.dashSpeed} remaining=${this.player.dashRemainingMs.toFixed(0)}`,
      `GROUND ${body.blocked.down || body.touching.down} WALL ${wall} COYOTE ${this.player.coyoteRemainingMs.toFixed(0)}`,
      `DASHING ${this.player.isDashing} AVAILABLE ${this.player.dashAvailable} STATE ${this.player.states.state}`,
      `ENEMIES ${this.enemies.count} ACTIVE ${this.enemies.activeCount} DISABLED ${this.enemies.count - this.enemies.activeCount}`,
      ...this.enemies.debug().slice(0, 3).map((enemy) => `${enemy.id} ${enemy.state} ${enemy.x.toFixed(0)},${enemy.y.toFixed(0)} dir=${enemy.direction} t=${enemy.stateRemainingMs.toFixed(0)}`),
    ]);
  }

  private shutdown(): void {
    this.inputManager.destroy();
    this.countdown?.destroy();
    this.ghost?.destroy();
    this.enemies?.destroy();
    this.events.off(Events.PLAYER_DASH, this.dashTrail, this);
    this.events.off(Events.PLAYER_LAND, this.onLand, this);
    this.events.off(Events.PLAYER_WALL_JUMP, this.onWallJump, this);
    this.events.off(Events.PLAYER_JUMP, this.onJump, this);
    this.events.off(Events.PLAYER_AIR_JUMP, this.onAirJump, this);
    this.events.off(Events.DOOR_STATE, this.onDoorState, this);
    eventBus.off(Events.SETTINGS_CHANGED, this.applySettings, this);
    eventBus.off(Events.PAUSE_RESTART, this.restart, this);
    eventBus.off(Events.RUN_ABANDON, this.abandon, this);
    this.events.off('e2e:kill', this.die, this);
    this.events.off('e2e:complete', this.e2eComplete, this);
    for (const door of this.built.timedDoors) door.destroy();
    this.feedback?.destroy();
    this.environment.destroy();
    this.scene.stop('UI');
  }
}
