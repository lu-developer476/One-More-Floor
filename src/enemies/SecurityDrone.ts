import Phaser from 'phaser';
import { EnemyActor } from './EnemyActor';
import { distanceToFirstBlocker, hasEnemyLineOfSight } from './EnemyLineOfSight';
import type { DroneEnemyDefinition, DroneState, EnemyBlocker, EnemyDebugState, EnemyEffectSink } from './EnemyTypes';

export class SecurityDrone extends EnemyActor {
  state: DroneState = 'patrol'; private direction: -1 | 1 = 1; private stateRemainingMs = 0;
  private cooldownMs = 0; private detected = false; private lineOfSight = false; private patrolPhaseMs = 0;
  private blockers: readonly EnemyBlocker[] = []; private attackLaneY: number;
  readonly telegraph: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene, readonly drone: DroneEnemyDefinition, private readonly effects: EnemyEffectSink) {
    super(scene, drone, 'security-drone-patrol-0'); this.attackLaneY = drone.y;
    (this.sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.sprite.setCollideWorldBounds(true).setBodySize(38, 24).setOffset(7, 10);
    this.telegraph = scene.add.graphics().setDepth(21).setVisible(false);
  }
  setBlockers(blockers: readonly EnemyBlocker[]): void { this.blockers = blockers; }
  update(_time: number, deltaMs: number, playerX: number, playerY: number): void {
    if (this.paused || this.disabled || !this.visibleToCamera) return;
    const dt = Math.max(0, Math.min(50, deltaMs)); this.cooldownMs = Math.max(0, this.cooldownMs - dt);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (this.state === 'patrol') {
      this.patrolPhaseMs += dt; const phase = this.patrolPhaseMs * this.drone.patrolSpeed / 100000;
      const targetX = this.drone.x + Math.sin(phase) * this.drone.patrolRadiusX;
      const targetY = this.drone.y + Math.sin(phase * 2) * 12;
      this.sprite.setVelocity((targetX - this.sprite.x) * 12, (targetY - this.sprite.y) * 12);
      this.direction = Math.cos(phase) >= 0 ? 1 : -1;
      this.sprite.setFlipX(this.direction < 0).setTexture(`security-drone-patrol-${Math.floor(this.patrolPhaseMs / 240) % 2}`);
      const inRange = Math.abs(playerX - this.sprite.x) <= this.drone.detectionRangeX && Math.abs(playerY - this.sprite.y) <= this.drone.detectionRangeY;
      this.lineOfSight = inRange && hasEnemyLineOfSight(this.sprite, { x: playerX, y: playerY }, this.blockers);
      this.detected = this.cooldownMs === 0 && inRange && this.lineOfSight;
      if (this.detected) {
        this.direction = playerX < this.sprite.x ? -1 : 1; this.attackLaneY = this.sprite.y;
        this.state = 'alert'; this.stateRemainingMs = this.drone.alertMs; this.sprite.setVelocity(0).setTexture('security-drone-alert');
        this.effects.alert(this.drone.id);
      }
    } else {
      this.stateRemainingMs = Math.max(0, this.stateRemainingMs - dt);
      if (this.state === 'alert') {
        this.sprite.setVelocity(0); this.drawTelegraph();
        if (this.stateRemainingMs === 0) { this.state = 'charge'; this.stateRemainingMs = this.drone.chargeMs; this.telegraph.setVisible(false); this.sprite.setTexture('security-drone-charge').setVelocity(this.direction * this.drone.chargeSpeed, 0); this.effects.charge(this.drone.id); }
      } else if (this.state === 'charge') {
        this.sprite.setVelocity(this.direction * this.drone.chargeSpeed, (this.attackLaneY - this.sprite.y) * 14);
        if (body.blocked.left || body.blocked.right || this.stateRemainingMs === 0) this.recover();
      } else if (this.state === 'recover') {
        const remainingSeconds = Math.max(0.08, this.stateRemainingMs / 1000);
        this.sprite.setVelocity((this.drone.x - this.sprite.x) / remainingSeconds, (this.drone.y - this.sprite.y) / remainingSeconds);
        if (body.blocked.left || body.blocked.right || this.stateRemainingMs === 0) { this.sprite.setVelocity(0); this.state = 'patrol'; this.cooldownMs = this.drone.cooldownMs; this.detected = false; this.lineOfSight = false; }
      }
    }
    this.drawOutline('drone');
  }
  private recover(): void { this.state = 'recover'; this.stateRemainingMs = this.drone.recoverMs; this.sprite.setVelocity(0).setTexture('security-drone-recover'); }
  private drawTelegraph(): void {
    this.telegraph.clear().setVisible(true);
    const length = distanceToFirstBlocker(this.sprite, this.direction, this.drone.detectionRangeX, this.blockers);
    const progress = 1 - this.stateRemainingMs / this.drone.alertMs;
    this.telegraph.lineStyle(3, 0xffe66d, 0.95).lineBetween(this.sprite.x, this.sprite.y, this.sprite.x + this.direction * length * Math.max(0.15, progress), this.sprite.y);
    for (let x = 45; x < length; x += 45) this.telegraph.fillStyle(0xffffff, 0.95).fillTriangle(this.sprite.x + this.direction * x, this.sprite.y - 7, this.sprite.x + this.direction * (x + 12), this.sprite.y, this.sprite.x + this.direction * x, this.sprite.y + 7);
    this.telegraph.lineStyle(4, 0xffffff, 1).strokeCircle(this.sprite.x, this.sprite.y, 10 + progress * 8);
  }
  override get attacking(): boolean { return this.contactDangerous && this.state === 'charge'; }
  override onCameraSleep(): void { super.onCameraSleep(); this.telegraph.setVisible(false); }
  override setPaused(value: boolean): void { super.setPaused(value); if (value) this.telegraph.setVisible(false); }
  override disable(): boolean { const result = super.disable(); if (result) { this.state = 'disabled'; this.sprite.setVelocity(0); this.telegraph.clear().setVisible(false); } return result; }
  override destroy(): void { if (this.destroyed) return; if (this.telegraph.active) this.telegraph.destroy(); super.destroy(); }
  debug(): EnemyDebugState { const body = this.sprite.body as Phaser.Physics.Arcade.Body; return { id: this.drone.id, kind: this.drone.kind, state: this.state, active: this.active, dangerous: this.contactDangerous, contactDangerous: this.contactDangerous, attacking: this.attacking, canBeDisabled: this.canBeDisabled, cameraActive: this.cameraActive, x: this.sprite.x, y: this.sprite.y, bodyX: body.x, bodyY: body.y, velocityX: body.velocity.x, direction: this.direction, stateRemainingMs: this.stateRemainingMs, detected: this.detected, lineOfSight: this.lineOfSight, visibleToCamera: this.cameraActive, visualBounds: { x: this.sprite.x - this.sprite.displayWidth / 2, y: this.sprite.y - this.sprite.displayHeight / 2, width: this.sprite.displayWidth, height: this.sprite.displayHeight }, bodyBounds: { x: body.x, y: body.y, width: body.width, height: body.height } }; }
}
