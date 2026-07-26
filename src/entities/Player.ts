import Phaser from 'phaser';
import { MOVEMENT } from '../config/movementConfig';
import { PlayerStateMachine } from '../states/PlayerStateMachine';
import { PlayerState } from '../types/game';

interface Controls { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; arrowLeft: Phaser.Input.Keyboard.Key; arrowRight: Phaser.Input.Keyboard.Key; jump: Phaser.Input.Keyboard.Key; up: Phaser.Input.Keyboard.Key; w: Phaser.Input.Keyboard.Key; dash: Phaser.Input.Keyboard.Key }
export class Player extends Phaser.Physics.Arcade.Sprite {
  readonly states = new PlayerStateMachine();
  private controls: Controls; private lastGroundedAt = -Infinity; private jumpQueuedAt = -Infinity;
  private dashEndsAt = 0; private dashReadyAt = 0; private airDash = true; private facing = 1;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player'); scene.add.existing(this); scene.physics.add.existing(this);
    this.setCollideWorldBounds(true).setMaxVelocity(MOVEMENT.maxSpeed, 900).setDragX(MOVEMENT.drag);
    this.body.setSize(24, 38).setOffset(4, 2);
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input unavailable');
    this.controls = { left: keyboard.addKey('A'), right: keyboard.addKey('D'), arrowLeft: keyboard.addKey('LEFT'), arrowRight: keyboard.addKey('RIGHT'), w: keyboard.addKey('W'), up: keyboard.addKey('UP'), jump: keyboard.addKey('SPACE'), dash: keyboard.addKey('SHIFT') };
  }
  get dashAvailable(): boolean { return this.airDash && this.scene.time.now >= this.dashReadyAt; }
  update(): void {
    if (this.states.state === PlayerState.DEAD) return;
    const now = this.scene.time.now; const body = this.body as Phaser.Physics.Arcade.Body;
    const pad = this.scene.input.gamepad?.getPad(0); const axis = pad && Math.abs(pad.leftStick.x) > 0.2 ? pad.leftStick.x : 0;
    const direction = (this.controls.left.isDown || this.controls.arrowLeft.isDown ? -1 : 0) + (this.controls.right.isDown || this.controls.arrowRight.isDown ? 1 : 0) || axis;
    const jumpDown = this.controls.jump.isDown || this.controls.up.isDown || this.controls.w.isDown || Boolean(pad?.A);
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.controls.jump) || Phaser.Input.Keyboard.JustDown(this.controls.up) || Phaser.Input.Keyboard.JustDown(this.controls.w) || Boolean(pad?.A && !pad.AButton.wasDown);
    const dashPressed = Phaser.Input.Keyboard.JustDown(this.controls.dash) || Boolean(pad?.R1 && !pad.R1Button.wasDown || pad?.R2 > 0.5);
    const grounded = body.blocked.down || body.touching.down; const wall = body.blocked.left || body.blocked.right;
    if (grounded) { this.lastGroundedAt = now; this.airDash = true; }
    if (jumpPressed) this.jumpQueuedAt = now;
    if (now < this.dashEndsAt) { this.setVelocityY(0); this.setAcceleration(0); this.setTint(0x5ef1ff); this.states.transition(PlayerState.DASHING); return; }
    this.clearTint(); this.setGravityY(0);
    if (dashPressed && this.dashAvailable) { this.startDash(direction); return; }
    const canJump = grounded || now - this.lastGroundedAt <= MOVEMENT.coyoteMs;
    if (now - this.jumpQueuedAt <= MOVEMENT.jumpBufferMs && (canJump || wall)) {
      this.setVelocityY(-MOVEMENT.jumpSpeed); if (wall && !grounded) this.setVelocityX(body.blocked.left ? MOVEMENT.wallJumpX : -MOVEMENT.wallJumpX);
      this.jumpQueuedAt = -Infinity; this.lastGroundedAt = -Infinity;
    }
    if (!jumpDown && body.velocity.y < -170) this.setVelocityY(body.velocity.y * MOVEMENT.jumpCutMultiplier);
    if (direction !== 0) { this.facing = Math.sign(direction); this.setAccelerationX(direction * (grounded ? MOVEMENT.acceleration : MOVEMENT.airAcceleration)); this.setFlipX(direction < 0); } else this.setAccelerationX(0);
    if (wall && !grounded && body.velocity.y > MOVEMENT.wallSlideSpeed) this.setVelocityY(MOVEMENT.wallSlideSpeed);
    this.updateState(grounded, wall, direction);
  }
  private startDash(direction: number): void { const now = this.scene.time.now; this.airDash = false; this.dashEndsAt = now + MOVEMENT.dashDurationMs; this.dashReadyAt = now + MOVEMENT.dashCooldownMs; this.setVelocity((direction || this.facing) * MOVEMENT.dashSpeed, 0); this.setAcceleration(0); this.scene.events.emit('player:dash', this.x, this.y); }
  private updateState(grounded: boolean, wall: boolean, direction: number): void { const vy = (this.body as Phaser.Physics.Arcade.Body).velocity.y; if (wall && !grounded && vy > 0) this.states.transition(PlayerState.WALL_SLIDING); else if (grounded) this.states.transition(direction === 0 ? PlayerState.IDLE : PlayerState.RUNNING); else this.states.transition(vy < 0 ? PlayerState.JUMPING : PlayerState.FALLING); }
  kill(): void { this.states.kill(); this.setAcceleration(0).setVelocity(0).setTint(0xff405c); }
}
