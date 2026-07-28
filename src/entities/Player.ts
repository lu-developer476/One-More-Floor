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
  private jumpQueuedAt = -Infinity;
  private dashEndsAt = 0;
  private dashReadyAt = 0;
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

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 38).setOffset(4, 2);
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
  unlock(): void {
    this.states.unlock();
    this.jumpQueuedAt = -Infinity;
    this.inputManager.blockInherited();
  }

  update(): void {
    if (this.states.state === PlayerState.DEAD || this.states.state === PlayerState.LOCKED) {
      return;
    }

    const now = this.scene.time.now;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const direction = now < this.directionLockedUntil ? 0 : this.inputManager.axisX;
    const jumpDown = this.inputManager.isDown(InputAction.JUMP);
    const jumpPressed = this.inputManager.wasPressed(InputAction.JUMP);
    const dashPressed = this.inputManager.wasPressed(InputAction.DASH);
    const jumpReleased = this.inputManager.wasReleased(InputAction.JUMP);

    const grounded = body.blocked.down || body.touching.down;
    const wall = body.blocked.left || body.blocked.right;

    if (grounded) {
      this.lastGroundedAt = now;
      this.airDash = true;
    }

    if (jumpPressed) {
      this.jumpQueuedAt = now;
    }

    if (now < this.dashEndsAt && wall) this.dashEndsAt = now;
    if (now < this.dashEndsAt) {
      body.maxVelocity.x = MOVEMENT.dashSpeed;
      this.setVelocityY(0);
      this.setAcceleration(0);
      this.setTint(0x5ef1ff);
      this.states.transition(PlayerState.DASHING);
      return;
    }

    body.maxVelocity.x = MOVEMENT.maxSpeed;
    this.clearTint();
    this.setGravityY(0);

    if (dashPressed && this.dashAvailable) {
      this.startDash(direction);
      return;
    }

    const canJump = grounded || now - this.lastGroundedAt <= MOVEMENT.coyoteMs;

    if (now - this.jumpQueuedAt <= MOVEMENT.jumpBufferMs && (canJump || wall)) {
      this.setVelocityY(-MOVEMENT.jumpSpeed);
      this.scene.events.emit(Events.PLAYER_JUMP, this.x, this.y);

      if (wall && !grounded) {
        this.setVelocityX(body.blocked.left ? MOVEMENT.wallJumpX : -MOVEMENT.wallJumpX);
        this.setVelocityY(-MOVEMENT.wallJumpY);
        this.directionLockedUntil = now + MOVEMENT.wallJumpLockMs;
        this.scene.events.emit(Events.PLAYER_WALL_JUMP, this.x, this.y);
      }

      this.jumpQueuedAt = -Infinity;
      this.lastGroundedAt = -Infinity;
    }

    if (jumpReleased && !jumpDown && body.velocity.y < -170) {
      this.setVelocityY(body.velocity.y * MOVEMENT.jumpCutMultiplier);
    }

    if (direction !== 0) {
      this.facing = Math.sign(direction);
      this.setAccelerationX(
        direction * (grounded ? MOVEMENT.acceleration : MOVEMENT.airAcceleration),
      );
      this.setFlipX(direction < 0);
    } else {
      this.setAccelerationX(0);
    }

    if (wall && !grounded && body.velocity.y > MOVEMENT.wallSlideSpeed) {
      this.setVelocityY(MOVEMENT.wallSlideSpeed);
    }

    if (grounded && !this.wasGrounded) {
      const kind = classifyLanding(this.previousVelocityY);
      this.states.transition(PlayerState.LANDING);
      this.landingEndsAt = now + 85;
      this.scene.events.emit(Events.PLAYER_LAND, this.x, this.y, kind);
    }
    if (this.states.state !== PlayerState.LANDING || now >= this.landingEndsAt || jumpPressed) {
      this.updateState(grounded, wall, direction);
    }
    this.wasGrounded = grounded;
    this.previousVelocityY = body.velocity.y;
    this.updateVisual();
  }

  private startDash(direction: number): void {
    const now = this.scene.time.now;
    this.airDash = false;
    this.dashEndsAt = now + MOVEMENT.dashDurationMs;
    this.dashReadyAt = now + MOVEMENT.dashCooldownMs;
    this.setVelocity((direction || this.facing) * MOVEMENT.dashSpeed, 0);
    this.setAcceleration(0);
    this.scene.events.emit(Events.PLAYER_DASH, this.x, this.y);
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
    this.states.lock();
    this.setAcceleration(0).setVelocity(0);
    this.updateVisual();
  }

  private updateState(grounded: boolean, wall: boolean, direction: number): void {
    const velocityY = (this.body as Phaser.Physics.Arcade.Body).velocity.y;

    if (wall && !grounded && velocityY > 0) {
      this.states.transition(PlayerState.WALL_SLIDING);
    } else if (grounded) {
      this.states.transition(direction === 0 ? PlayerState.IDLE : PlayerState.RUNNING);
    } else {
      this.states.transition(velocityY < 0 ? PlayerState.JUMPING : PlayerState.FALLING);
    }
  }

  kill(): void {
    this.states.kill();
    this.setAcceleration(0).setVelocity(0).setTint(0xff405c);
  }
}
