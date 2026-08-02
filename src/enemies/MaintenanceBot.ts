import Phaser from 'phaser';
import { EnemyActor } from './EnemyActor';
import type { EnemyDebugState, PatrolEnemyDefinition } from './EnemyTypes';
export class MaintenanceBot extends EnemyActor {
  private direction: -1 | 1;
  constructor(scene: Phaser.Scene, readonly bot: PatrolEnemyDefinition) {
    super(scene, bot, 'maintenance-bot-patrol-0'); this.direction = bot.facing ?? 1;
    this.sprite.setCollideWorldBounds(true).setBodySize(42, 24).setOffset(5, 15).setGravityY(0);
  }
  update(_time: number, deltaMs: number): void {
    if (this.paused || this.disabled) return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if ((this.direction < 0 && (this.sprite.x <= this.bot.patrolMinX || body.blocked.left)) || (this.direction > 0 && (this.sprite.x >= this.bot.patrolMaxX || body.blocked.right))) this.direction = this.direction === 1 ? -1 : 1;
    const next = Phaser.Math.Clamp(this.sprite.x + this.direction * this.bot.speed * Math.max(0, Math.min(50, deltaMs)) / 1000, this.bot.patrolMinX, this.bot.patrolMaxX);
    this.sprite.setX(next).setVelocityX(0).setFlipX(this.direction < 0);
    this.sprite.setTexture(`maintenance-bot-patrol-${Math.floor(next / 18) % 2}`);
  }
  debug(): EnemyDebugState { return { id: this.bot.id, kind: this.bot.kind, state: this.disabled ? 'disabled' : 'patrol', x: this.sprite.x, y: this.sprite.y, velocityX: this.disabled ? 0 : this.direction * this.bot.speed, direction: this.direction, stateRemainingMs: 0, detected: false }; }
}
