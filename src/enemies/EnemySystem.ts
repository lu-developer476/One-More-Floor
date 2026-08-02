import Phaser from 'phaser';
import type { Player } from '../entities/Player';
import type { Settings } from '../services/StorageService';
import { audioService } from '../services/AudioService';
import { EnemyActor } from './EnemyActor';
import { MaintenanceBot } from './MaintenanceBot';
import { SecurityDrone } from './SecurityDrone';
import { resolveEnemyContact } from './EnemyContact';
import type { EnemyBlocker, EnemyContactOutcome, EnemyDebugState, EnemyDefinition, EnemyWorldBlockers } from './EnemyTypes';

const ACTIVATE_MARGIN = 120, SLEEP_MARGIN = 220;
export class EnemySystem {
  private readonly actors: EnemyActor[]; private readonly colliders: Phaser.Physics.Arcade.Collider[] = [];
  private paused = true; private destroyed = false; private playerDead = false;
  private readonly resolvingEnemyIds = new Set<string>();
  constructor(private readonly scene: Phaser.Scene, definitions: readonly EnemyDefinition[], private readonly player: Player, settings: Settings, private readonly world: EnemyWorldBlockers, private readonly onKilled: (id: string) => void, private readonly onDisabled?: (actor: EnemyActor) => void) {
    this.actors = definitions.map((definition) => definition.kind === 'maintenance-bot' ? new MaintenanceBot(scene, definition) : new SecurityDrone(scene, definition));
    for (const actor of this.actors) {
      this.colliders.push(scene.physics.add.collider(actor.sprite, world.staticPlatforms));
      for (const door of world.timedDoors) { door.addObstruction(actor.sprite); this.colliders.push(scene.physics.add.collider(actor.sprite, door.blocker)); }
      this.colliders.push(scene.physics.add.overlap(player, actor.sprite, () => this.resolvePlayerContact(actor)));
      actor.setHighContrast(settings.highContrast);
    }
  }
  private blockers(): EnemyBlocker[] {
    const result: EnemyBlocker[] = [];
    for (const child of this.world.staticPlatforms.getChildren()) { const object = child as Phaser.GameObjects.GameObject & { x: number; y: number; displayWidth: number; displayHeight: number; getData(key: string): unknown }; if (object.getData?.('oneWay') === true) continue; result.push({ x: object.x, y: object.y, width: object.displayWidth, height: object.displayHeight }); }
    for (const door of this.world.timedDoors) result.push({ x: door.blocker.x, y: door.blocker.y, width: door.blocker.displayWidth, height: door.blocker.displayHeight, active: door.closed });
    return result;
  }
  update(gameplayTimeMs: number, deltaMs: number): void {
    if (this.paused || this.destroyed) return; const camera = this.scene.cameras.main; const blockers = this.blockers();
    for (const actor of this.actors) {
      const current = actor.debug().visibleToCamera; const margin = current ? SLEEP_MARGIN : ACTIVATE_MARGIN;
      const visible = actor.sprite.x + 30 >= camera.worldView.left - margin && actor.sprite.x - 30 <= camera.worldView.right + margin && actor.sprite.y + 30 >= camera.worldView.top - margin && actor.sprite.y - 30 <= camera.worldView.bottom + margin;
      actor.setCameraActive(visible); if (actor instanceof SecurityDrone) actor.setBlockers(blockers);
      actor.update(gameplayTimeMs, deltaMs, this.player.x, this.player.y);
    }
  }
  resolvePlayerContact(enemy: EnemyActor): EnemyContactOutcome {
    const id = enemy.definition.id;
    if (this.paused || this.destroyed || this.playerDead || this.resolvingEnemyIds.has(id)) return 'ignored';
    this.resolvingEnemyIds.add(id);
    try {
      const outcome = resolveEnemyContact(enemy, this.player.isDashing && this.player.dashRemainingMs > 0);
      if (outcome === 'enemy-disabled') { audioService.play('enemyDisabled', 100, `enemy-disabled:${id}`); this.onDisabled?.(enemy); }
      else if (outcome === 'player-killed') { this.playerDead = true; this.onKilled(id); }
      return outcome;
    } finally { this.resolvingEnemyIds.delete(id); }
  }
  pause(): void { this.paused = true; for (const actor of this.actors) actor.setPaused(true); }
  resume(): void { if (this.destroyed) return; this.paused = false; this.playerDead = false; for (const actor of this.actors) actor.setPaused(false); }
  applySettings(settings: Settings): void { for (const actor of this.actors) actor.setHighContrast(settings.highContrast); }
  debug(): readonly EnemyDebugState[] { return this.actors.map((actor) => actor.debug()); }
  get count(): number { return this.actors.length; } get activeCount(): number { return this.actors.filter((actor) => !actor.disabled).length; }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.resolvingEnemyIds.clear(); for (const collider of this.colliders) collider.destroy(); for (const actor of this.actors) actor.destroy(); this.colliders.length = 0; }
}
