import Phaser from 'phaser';
import type { Player } from '../entities/Player';
import type { Settings } from '../services/StorageService';
import { audioService } from '../services/AudioService';
import { EnemyActor } from './EnemyActor';
import { MaintenanceBot } from './MaintenanceBot';
import { SecurityDrone } from './SecurityDrone';
import { resolveEnemyContact } from './EnemyContact';
import type { EnemyBlocker, EnemyContactOutcome, EnemyDebugState, EnemyDefinition, EnemyEffectSink, EnemyWorldBlockers } from './EnemyTypes';

const ACTIVATE_MARGIN = 120, SLEEP_MARGIN = 220;
export class EnemySystem {
  private readonly actors: EnemyActor[]; private readonly colliders: Phaser.Physics.Arcade.Collider[] = [];
  private paused = true; private destroyed = false; private playerDead = false;
  private readonly resolvingEnemyIds = new Set<string>();
  private readonly staticBlockers: EnemyBlocker[] = [];
  private readonly dynamicBlockers: EnemyBlocker[] = [];
  private readonly allBlockers: EnemyBlocker[] = [];
  private blockerRebuildCount = 0;
  private readonly effects: EnemyEffectSink;
  constructor(private readonly scene: Phaser.Scene, definitions: readonly EnemyDefinition[], private readonly player: Player, settings: Settings, private readonly world: EnemyWorldBlockers, private readonly onKilled: (id: string) => void, private readonly onDisabled?: (actor: EnemyActor) => void) {
    this.effects = {
      alert: (id) => { if (!this.paused && !this.destroyed && !this.playerDead) audioService.play('enemyAlert', 300, `enemy-alert:${id}`); },
      charge: (id) => { if (!this.paused && !this.destroyed && !this.playerDead) audioService.play('enemyCharge', 300, `enemy-charge:${id}`); },
      disabled: (id) => { if (!this.paused && !this.destroyed && !this.playerDead) audioService.play('enemyDisabled', 100, `enemy-disabled:${id}`); },
    };
    this.actors = definitions.map((definition) => definition.kind === 'maintenance-bot' ? new MaintenanceBot(scene, definition) : new SecurityDrone(scene, definition, this.effects));
    this.cacheBlockers();
    for (const actor of this.actors) {
      this.colliders.push(scene.physics.add.collider(actor.sprite, world.staticPlatforms));
      for (const door of world.timedDoors) { door.addObstruction(actor.sprite); this.colliders.push(scene.physics.add.collider(actor.sprite, door.blocker)); }
      this.colliders.push(scene.physics.add.overlap(player, actor.sprite, () => this.resolvePlayerContact(actor)));
      actor.setHighContrast(settings.highContrast);
    }
  }
  private cacheBlockers(): void {
    for (const child of this.world.staticPlatforms.getChildren()) { const object = child as Phaser.GameObjects.GameObject & { x: number; y: number; displayWidth: number; displayHeight: number; getData(key: string): unknown }; if (object.getData?.('oneWay') === true) continue; this.staticBlockers.push({ x: object.x, y: object.y, width: object.displayWidth, height: object.displayHeight }); }
    for (const door of this.world.timedDoors) this.dynamicBlockers.push({ x: door.blocker.x, y: door.blocker.y, width: door.blocker.displayWidth, height: door.blocker.displayHeight, active: door.closed });
    this.allBlockers.push(...this.staticBlockers, ...this.dynamicBlockers); this.blockerRebuildCount++;
  }
  update(gameplayTimeMs: number, deltaMs: number): void {
    if (this.paused || this.destroyed || this.playerDead) return; const camera = this.scene.cameras.main;
    for (let index = 0; index < this.dynamicBlockers.length; index++) this.dynamicBlockers[index]!.active = this.world.timedDoors[index]!.closed;
    for (const actor of this.actors) {
      const margin = actor.cameraActive ? SLEEP_MARGIN : ACTIVATE_MARGIN;
      const visible = actor.sprite.x + 30 >= camera.worldView.left - margin && actor.sprite.x - 30 <= camera.worldView.right + margin && actor.sprite.y + 30 >= camera.worldView.top - margin && actor.sprite.y - 30 <= camera.worldView.bottom + margin;
      actor.setCameraActive(visible); if (actor instanceof SecurityDrone) actor.setBlockers(this.allBlockers);
      actor.update(gameplayTimeMs, deltaMs, this.player.x, this.player.y);
    }
  }
  resolvePlayerContact(enemy: EnemyActor): EnemyContactOutcome {
    const id = enemy.definition.id;
    if (this.paused || this.destroyed || this.playerDead || this.resolvingEnemyIds.has(id)) return 'ignored';
    this.resolvingEnemyIds.add(id);
    try {
      const outcome = resolveEnemyContact({ contactDangerous: enemy.contactDangerous, canBeDisabled: enemy.canBeDisabled, dashActive: this.player.isDashing && this.player.dashRemainingMs > 0, playerAlive: !this.playerDead });
      if (outcome === 'enemy-disabled' && enemy.disable()) { this.effects.disabled(id); this.onDisabled?.(enemy); }
      else if (outcome === 'player-killed') { this.playerDead = true; this.onKilled(id); }
      return outcome;
    } finally { this.resolvingEnemyIds.delete(id); }
  }
  pause(): void { this.paused = true; for (const actor of this.actors) actor.setPaused(true); }
  resume(): void { if (this.destroyed || this.playerDead) return; this.paused = false; for (const actor of this.actors) actor.setPaused(false); }
  onAttemptStart(): void { if (this.destroyed) return; this.playerDead = false; this.resume(); }
  onPlayerDeath(): void { if (this.destroyed) return; this.playerDead = true; this.pause(); }
  applySettings(settings: Settings): void { for (const actor of this.actors) actor.setHighContrast(settings.highContrast); }
  debug(): readonly EnemyDebugState[] { return this.actors.map((actor) => actor.debug()); }
  blockerDebug(): { staticBlockerCount: number; dynamicBlockerCount: number; blockerRebuildCount: number } { return { staticBlockerCount: this.staticBlockers.length, dynamicBlockerCount: this.dynamicBlockers.length, blockerRebuildCount: this.blockerRebuildCount }; }
  get count(): number { return this.actors.length; } get activeCount(): number { return this.actors.filter((actor) => !actor.disabled).length; }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.resolvingEnemyIds.clear(); for (const collider of this.colliders) collider.destroy(); for (const actor of this.actors) actor.destroy(); this.colliders.length = 0; this.staticBlockers.length = 0; this.dynamicBlockers.length = 0; this.allBlockers.length = 0; }
}
