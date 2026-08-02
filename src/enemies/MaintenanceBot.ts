import Phaser from 'phaser';
import { EnemyActor } from './EnemyActor';
import type { EnemyDebugState, MaintenanceBotState, PatrolEnemyDefinition } from './EnemyTypes';
export class MaintenanceBot extends EnemyActor {
  private direction: -1 | 1; private state: MaintenanceBotState = 'patrol'; private turnFrames = 0;
  private lastTurnReason = 'spawn'; private lastLimit: number | null = null; private previousX: number;
  constructor(scene: Phaser.Scene, readonly bot: PatrolEnemyDefinition) {
    super(scene, bot, 'maintenance-bot-patrol-0'); this.direction = bot.facing ?? 1; this.previousX = bot.x;
    this.sprite.setCollideWorldBounds(true).setBodySize(42, 24).setOffset(5, 15);
  }
  update(): void {
    if (this.paused || this.disabled || !this.visibleToCamera) return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body; this.previousX = this.sprite.x;
    if (this.state === 'turning') { this.sprite.setVelocityX(0); if (--this.turnFrames <= 0) this.state = 'patrol'; this.drawOutline(); return; }
    const limit = this.direction < 0 ? this.bot.patrolMinX : this.bot.patrolMaxX;
    const reached = this.direction < 0 ? this.sprite.x <= limit : this.sprite.x >= limit;
    const blocked = this.direction < 0 ? body.blocked.left : body.blocked.right;
    if (reached || blocked) {
      this.lastTurnReason = blocked ? 'blocker' : 'patrol-limit'; this.lastLimit = reached ? limit : null;
      this.direction = this.direction === 1 ? -1 : 1; this.state = 'turning'; this.turnFrames = 1; this.sprite.setVelocityX(0);
    } else this.sprite.setVelocityX(this.direction * this.bot.speed);
    this.sprite.setData({ lastTurnReason: this.lastTurnReason, lastLimit: this.lastLimit, previousX: this.previousX });
    this.sprite.setFlipX(this.direction < 0).setTexture(`maintenance-bot-patrol-${Math.floor(Math.abs(this.sprite.x) / 18) % 2}`); this.drawOutline();
  }
  override disable(): boolean { const value = super.disable(); if (value) this.state = 'disabled'; return value; }
  debug(): EnemyDebugState { const body = this.sprite.body as Phaser.Physics.Arcade.Body; return { id: this.bot.id, kind: this.bot.kind, state: this.state, active: !this.disabled, dangerous: !this.paused && !this.disabled && this.visibleToCamera, x: this.sprite.x, y: this.sprite.y, bodyX: body.x, bodyY: body.y, velocityX: body.velocity.x, direction: this.direction, stateRemainingMs: 0, detected: false, lineOfSight: false, visibleToCamera: this.visibleToCamera }; }
}
