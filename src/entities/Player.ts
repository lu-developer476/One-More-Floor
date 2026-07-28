import Phaser from 'phaser';
import { MOVEMENT } from '../config/movementConfig';
import { PlayerStateMachine } from '../states/PlayerStateMachine';
import { PlayerState } from '../types/game';
import { Events } from '../utils/EventBus';
import { classifyLanding } from '../systems/PhysicsMath';
import { InputAction } from '../input/InputAction';
import type { InputManager } from '../input/InputManager';

export class Player extends Phaser.Physics.Arcade.Sprite {
  readonly states = new PlayerStateMachine();

  private lastGroundedAt = -Infinity;
  private lastWallAt = -Infinity;
  private lastWallDirection: -1 | 1 = 1;
  private jumpQueuedAt = -Infinity;
  private dashEndsAt = 0;
  private dashReadyAt = 0;
  private dashInProgress = false;
  private airDash = true;
  private facing = 1;
  private directionLockedUntil = 0;
  private wasGrounded = false;
  private previousVelocityY = 0;
  private landingEndsAt = 0;
  private visualState?: PlayerState;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly inputManager: InputManager,
  ) {
    super(scene, x, y, 'player-idle-0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true)
      .setMaxVelocity(MOVEMENT.maxSpeed, MOVEMENT.maxFallSpeed)
      .setDragX(MOVEMENT.drag);
    (this.body as Phaser.Physics.Arcade.Body).setSize(24, 38).setOffset(4, 2);
  }

  get isDashing(): boolean {
    return this.scene.time.now < this.dashEndsAt;
  }
  get dashAvailable(): boolean {
    return this.airDash && this.scene.time.now >= this.dashReadyAt;
  }
  get facingDirection(): -1 | 1 {
    return this.facing < 0 ? -1 : 1;
  }
  get dashRemainingMs(): number {
    return Math.max(0, this.dashEndsAt - this.scene.time.now);
  }
  get jumpQueued(): boolean {
    return this.scene.time.now - this.jumpQueuedAt <= MOVEMENT.jumpBufferMs;
  }
  get coyoteRemainingMs(): number {
    return Math.max(0, MOVEMENT.coyoteMs - (this.scene.time.now - this.lastGroundedAt));
  }

  unlock(): void {
    this.states.unlock();
    this.jumpQueuedAt = -Infinity;
    this.inputManager.blockInherited();
  }

  update(): void {
    if (this.states.state === PlayerState.DEAD || this.states.state === PlayerState.LOCKED) return;

    const now = this.scene.time.now;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const direction = now < this.directionLockedUntil ? 0 : this.inputManager.axisX;
    const jumpDown = this.inputManager.isDown(InputAction.JUMP);
    const jumpPressed = this.inputManager.wasPressed(InputAction.JUMP);
    const jumpReleased = this.inputManager.wasReleased(InputAction.JUMP);
    const dashPressed = this.inputManager.wasPressed(InputAction.DASH);
    const grounded = body.blocked.down || body.touching.down;
    const wall = body.blocked.left || body.blocked.right;

    this.updateContactTimers(now, grounded, wall, body);
    if (jumpPressed) this.queueJump(now);

    // Resolve a wall collision before consuming the jump buffer, so a wall jump on
    // the dash-ending frame remains legal.
    if (this.isDashing && wall) this.endDash();
    else if (this.dashInProgress && !this.isDashing) this.endDash();

    this.consumeQueuedJump(now, grounded, wall, body);
    if (dashPressed) this.tryStartDash(direction);

    if (this.isDashing) this.applyDashMovement();
    else this.applyNormalMovement(direction, grounded);

    this.applyJumpCut(jumpReleased, jumpDown, body);
    this.applyWallSlide(wall, grounded, body);
    this.updateLocomotionState(now, grounded, wall, direction, jumpPressed, body);
    this.wasGrounded = grounded;
    this.previousVelocityY = body.velocity.y;
    this.updateVisual();
  }

  private updateContactTimers(
    now: number,
    grounded: boolean,
    wall: boolean,
    body: Phaser.Physics.Arcade.Body,
  ): void {
    if (grounded) {
      this.lastGroundedAt = now;
      this.airDash = true;
    }
    if (wall) {
      this.lastWallAt = now;
      this.lastWallDirection = body.blocked.left ? 1 : -1;
    }
  }

  private queueJump(now: number): void {
    this.jumpQueuedAt = now;
  }

  private consumeQueuedJump(
    now: number,
    grounded: boolean,
    wall: boolean,
    body: Phaser.Physics.Arcade.Body,
  ): void {
    if (!this.jumpQueued) return;
    const canGroundJump = grounded || now - this.lastGroundedAt <= MOVEMENT.coyoteMs;
    const canWallJump = !grounded && (wall || now - this.lastWallAt <= MOVEMENT.wallCoyoteMs);
    if (!canGroundJump && !canWallJump) return;

    this.setVelocityY(canWallJump ? -MOVEMENT.wallJumpY : -MOVEMENT.jumpSpeed);
    this.scene.events.emit(Events.PLAYER_JUMP, this.x, this.y);
    if (canWallJump) {
      const wallDirection = wall ? (body.blocked.left ? 1 : -1) : this.lastWallDirection;
      this.setVelocityX(wallDirection * MOVEMENT.wallJumpX);
      this.directionLockedUntil = now + MOVEMENT.wallJumpLockMs;
      this.scene.events.emit(Events.PLAYER_WALL_JUMP, this.x, this.y);
    }
    this.jumpQueuedAt = -Infinity;
    this.lastGroundedAt = -Infinity;
    this.lastWallAt = -Infinity;
  }

  private tryStartDash(direction: number): void {
    if (!this.dashAvailable || this.isDashing) return;
    const now = this.scene.time.now;
    this.airDash = false;
    this.dashEndsAt = now + MOVEMENT.dashDurationMs;
    this.dashReadyAt = now + MOVEMENT.dashCooldownMs;
    this.dashInProgress = true;
    this.setVelocityX((direction || this.facing) * MOVEMENT.dashSpeed);
    this.setAccelerationX(0);
    this.scene.events.emit(Events.PLAYER_DASH, this.x, this.y);
  }

  private applyDashMovement(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.maxVelocity.x = MOVEMENT.dashSpeed;
    this.setAccelerationX(0);
    this.setTint(0x5ef1ff);
  }

  private endDash(): void {
    if (!this.dashInProgress) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.dashInProgress = false;
    this.dashEndsAt = 0;
    body.velocity.x *= MOVEMENT.dashEndMultiplier;
    body.maxVelocity.x = MOVEMENT.maxSpeed;
    this.clearTint();
  }

  private applyNormalMovement(direction: number, grounded: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.maxVelocity.x = MOVEMENT.maxSpeed;
    this.clearTint();
    if (direction !== 0) {
      this.facing = Math.sign(direction);
      this.setAccelerationX(
        direction * (grounded ? MOVEMENT.acceleration : MOVEMENT.airAcceleration),
      );
      this.setFlipX(direction < 0);
    } else this.setAccelerationX(0);
  }

  private applyJumpCut(
    jumpReleased: boolean,
    jumpDown: boolean,
    body: Phaser.Physics.Arcade.Body,
  ): void {
    if (jumpReleased && !jumpDown && body.velocity.y < -170)
      this.setVelocityY(body.velocity.y * MOVEMENT.jumpCutMultiplier);
  }

  private applyWallSlide(wall: boolean, grounded: boolean, body: Phaser.Physics.Arcade.Body): void {
    if (wall && !grounded && body.velocity.y > MOVEMENT.wallSlideSpeed)
      this.setVelocityY(MOVEMENT.wallSlideSpeed);
  }

  private updateLocomotionState(
    now: number,
    grounded: boolean,
    wall: boolean,
    direction: number,
    jumpPressed: boolean,
    body: Phaser.Physics.Arcade.Body,
  ): void {
    if (grounded && !this.wasGrounded) {
      const kind = classifyLanding(this.previousVelocityY);
      this.states.transition(PlayerState.LANDING);
      this.landingEndsAt = now + 85;
      this.scene.events.emit(Events.PLAYER_LAND, this.x, this.y, kind);
    }
    if (this.isDashing) this.states.transition(PlayerState.DASHING);
    else if (this.states.state !== PlayerState.LANDING || now >= this.landingEndsAt || jumpPressed)
      this.updateState(grounded, wall, direction, body.velocity.y);
  }

  private updateVisual(): void {
    const state = this.states.state;
    if (state === this.visualState) return;
    this.visualState = state;
    if (state === PlayerState.IDLE) this.play('player-idle');
    else if (state === PlayerState.RUNNING) this.play('player-run');
    else {
      this.stop();
      const texture =
        state === PlayerState.DASHING
          ? 'player-dash'
          : state === PlayerState.JUMPING
            ? 'player-jump'
            : state === PlayerState.FALLING
              ? 'player-fall'
              : state === PlayerState.WALL_SLIDING
                ? 'player-wall'
                : 'player-idle-0';
      this.setTexture(texture);
    }
  }

  lock(): void {
    if (this.dashInProgress) this.endDash();
    this.states.lock();
    this.setAcceleration(0).setVelocity(0);
    this.updateVisual();
  }

  private updateState(
    grounded: boolean,
    wall: boolean,
    direction: number,
    velocityY: number,
  ): void {
    if (wall && !grounded && velocityY > 0) this.states.transition(PlayerState.WALL_SLIDING);
    else if (grounded)
      this.states.transition(direction === 0 ? PlayerState.IDLE : PlayerState.RUNNING);
    else this.states.transition(velocityY < 0 ? PlayerState.JUMPING : PlayerState.FALLING);
  }

  kill(): void {
    if (this.dashInProgress) this.endDash();
    this.states.kill();
    this.setAcceleration(0).setVelocity(0).setTint(0xff405c);
  }
}
