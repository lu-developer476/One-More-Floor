import Phaser from 'phaser';
import { audioService } from '../services/AudioService';
import { EnemyActor } from './EnemyActor';
import type { DroneEnemyDefinition, DroneState, EnemyDebugState } from './EnemyTypes';
export class SecurityDrone extends EnemyActor {
  state: DroneState = 'patrol'; private direction: -1 | 1 = 1; private stateRemainingMs = 0; private cooldownMs = 0; private detected = false; private patrolPhaseMs = 0;
  readonly telegraph: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene, readonly drone: DroneEnemyDefinition) {
    super(scene, drone, 'security-drone-patrol-0'); (this.sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false); this.sprite.setCollideWorldBounds(true).setBodySize(38, 24).setOffset(7, 10);
    this.telegraph = scene.add.graphics().setDepth(19).setVisible(false);
  }
  update(_time: number, deltaMs: number, playerX: number, playerY: number): void {
    if (this.paused || this.disabled) return; const dt = Math.max(0, Math.min(50, deltaMs)); this.cooldownMs = Math.max(0, this.cooldownMs - dt);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (this.state === 'patrol') {
      this.patrolPhaseMs += dt; const phase = this.patrolPhaseMs * this.drone.patrolSpeed / 100000; this.sprite.x = this.drone.x + Math.sin(phase) * this.drone.patrolRadiusX; this.sprite.y = this.drone.y + Math.sin(phase * 2) * 12;
      this.direction = Math.cos(phase) >= 0 ? 1 : -1; this.sprite.setFlipX(this.direction < 0).setTexture(`security-drone-patrol-${Math.floor(this.patrolPhaseMs / 240) % 2}`);
      this.detected = this.cooldownMs === 0 && Math.abs(playerX - this.sprite.x) <= this.drone.detectionRangeX && Math.abs(playerY - this.sprite.y) <= this.drone.detectionRangeY;
      if (this.detected) { this.direction = playerX < this.sprite.x ? -1 : 1; this.state = 'alert'; this.stateRemainingMs = this.drone.alertMs; this.sprite.setTexture('security-drone-alert'); audioService.play('enemyAlert', 300); }
    } else {
      this.stateRemainingMs -= dt;
      if (this.state === 'alert') { this.drawTelegraph(); if (this.stateRemainingMs <= 0) { this.state = 'charge'; this.stateRemainingMs = this.drone.chargeMs; this.telegraph.setVisible(false); this.sprite.setTexture('security-drone-charge'); audioService.play('enemyCharge', 300); } }
      else if (this.state === 'charge') { this.sprite.setVelocityX(this.direction * this.drone.chargeSpeed); if (body.blocked.left || body.blocked.right || this.stateRemainingMs <= 0) this.recover(); }
      else if (this.state === 'recover') { const step = Math.min(1, dt / Math.max(1, this.stateRemainingMs)); this.sprite.x += (this.drone.x - this.sprite.x) * step; this.sprite.y += (this.drone.y - this.sprite.y) * step; if (this.stateRemainingMs <= 0) { this.state = 'patrol'; this.cooldownMs = this.drone.cooldownMs; this.detected = false; } }
    }
  }
  private recover(): void { this.state = 'recover'; this.stateRemainingMs = this.drone.recoverMs; this.sprite.setVelocity(0).setTexture('security-drone-recover'); }
  private drawTelegraph(): void { this.telegraph.clear().setVisible(true); const length = this.drone.detectionRangeX; this.telegraph.lineStyle(3, 0xffe66d, 0.9).lineBetween(this.sprite.x, this.sprite.y, this.sprite.x + this.direction * length, this.sprite.y); for (let x = 45; x < length; x += 45) this.telegraph.fillStyle(0xffffff, 0.95).fillTriangle(this.sprite.x + this.direction * x, this.sprite.y - 7, this.sprite.x + this.direction * (x + 12), this.sprite.y, this.sprite.x + this.direction * x, this.sprite.y + 7); }
  override disable(): boolean { const result = super.disable(); if (result) { this.state = 'disabled'; this.telegraph.setVisible(false); } return result; }
  override destroy(): void { this.telegraph.destroy(); super.destroy(); }
  debug(): EnemyDebugState { return { id: this.drone.id, kind: this.drone.kind, state: this.state, x: this.sprite.x, y: this.sprite.y, velocityX: (this.sprite.body as Phaser.Physics.Arcade.Body).velocity.x, direction: this.direction, stateRemainingMs: Math.max(0, this.stateRemainingMs), detected: this.detected }; }
}
