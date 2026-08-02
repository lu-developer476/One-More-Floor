import Phaser from 'phaser';
import type { Player } from '../entities/Player';
import type { Settings } from '../services/StorageService';
import { audioService } from '../services/AudioService';
import { EnemyActor } from './EnemyActor';
import { MaintenanceBot } from './MaintenanceBot';
import { SecurityDrone } from './SecurityDrone';
import { resolveEnemyContact } from './EnemyContact';
import type { EnemyContactOutcome, EnemyDebugState, EnemyDefinition } from './EnemyTypes';
export class EnemySystem {
  private readonly actors: EnemyActor[]; private readonly colliders: Phaser.Physics.Arcade.Collider[] = []; private paused = true; private destroyed = false; private resolving = false;
  constructor(scene: Phaser.Scene, definitions: readonly EnemyDefinition[], private readonly player: Player, settings: Settings, platforms: Phaser.Physics.Arcade.StaticGroup, private readonly onKilled: (id: string) => void, private readonly onDisabled?: (actor: EnemyActor) => void) {
    this.actors = definitions.map((definition) => definition.kind === 'maintenance-bot' ? new MaintenanceBot(scene, definition) : new SecurityDrone(scene, definition));
    for (const actor of this.actors) {
      this.colliders.push(scene.physics.add.collider(actor.sprite, platforms));
      this.colliders.push(scene.physics.add.overlap(player, actor.sprite, () => this.resolvePlayerContact(actor)));
      if (settings.highContrast) actor.sprite.setTint(0xffffff);
    }
  }
  update(gameplayTimeMs: number, deltaMs: number): void { if (this.paused || this.destroyed) return; for (const actor of this.actors) actor.update(gameplayTimeMs, deltaMs, this.player.x, this.player.y); }
  resolvePlayerContact(enemy: EnemyActor): EnemyContactOutcome { if (this.paused || this.destroyed || this.resolving) return 'ignored'; this.resolving = true; const outcome = resolveEnemyContact(enemy, this.player.isDashing); if (outcome === 'enemy-disabled') { audioService.play('enemyDisabled', 100); this.onDisabled?.(enemy); } else if (outcome === 'player-killed') this.onKilled(enemy.definition.id); this.resolving = false; return outcome; }
  pause(): void { this.paused = true; for (const actor of this.actors) actor.setPaused(true); }
  resume(): void { this.paused = false; for (const actor of this.actors) actor.setPaused(false); }
  applySettings(settings: Settings): void { for (const actor of this.actors) { if (settings.highContrast) actor.sprite.setTint(0xffffff); else actor.sprite.clearTint(); } }
  debug(): readonly EnemyDebugState[] { return this.actors.map((actor) => actor.debug()); }
  get count(): number { return this.actors.length; } get activeCount(): number { return this.actors.filter((actor) => !actor.disabled).length; }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; for (const collider of this.colliders) collider.destroy(); for (const actor of this.actors) actor.destroy(); this.colliders.length = 0; }
}
