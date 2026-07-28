import { describe, expect, it } from 'vitest';
import { MOVEMENT } from '../config/movementConfig';
import playerSource from './Player.ts?raw';

describe('Player jump and dash composition contract', () => {
  it('keeps the frozen dash tuning', () => {
    expect(MOVEMENT).toMatchObject({
      dashSpeed: 675,
      dashDurationMs: 220,
      dashCooldownMs: 230,
      dashEndMultiplier: 0.58,
    });
  });

  it('starts dash on X without replacing Y or all-axis acceleration', () => {
    const start = playerSource.slice(
      playerSource.indexOf('private tryStartDash'),
      playerSource.indexOf('private applyDashMovement'),
    );
    expect(start).toContain('setVelocityX');
    expect(start).toContain('setAccelerationX(0)');
    expect(start).not.toMatch(/setVelocity\s*\(/);
    expect(start).not.toContain('setVelocityY');
    expect(start.match(/PLAYER_DASH/g)).toHaveLength(1);
  });

  it('keeps active dash movement horizontal and permits jump cut', () => {
    const active = playerSource.slice(
      playerSource.indexOf('private applyDashMovement'),
      playerSource.indexOf('private endDash'),
    );
    expect(active).not.toContain('setVelocityY');
    expect(playerSource.indexOf('consumeQueuedJump')).toBeLessThan(
      playerSource.indexOf('tryStartDash(direction)'),
    );
    expect(playerSource.indexOf('tryStartDash(direction)')).toBeLessThan(
      playerSource.indexOf('applyJumpCut(jumpReleased'),
    );
  });

  it('ends dash once and scales only horizontal velocity', () => {
    const end = playerSource.slice(
      playerSource.indexOf('private endDash'),
      playerSource.indexOf('private applyNormalMovement'),
    );
    expect(end).toContain('if (!this.dashInProgress) return');
    expect(end).toContain('body.velocity.x *= MOVEMENT.dashEndMultiplier');
    expect(end).not.toContain('velocity.y');
    expect(end).not.toContain('setVelocityY');
  });

  it('consumes one legal buffered jump without adding a double jump', () => {
    const jump = playerSource.slice(
      playerSource.indexOf('private consumeQueuedJump'),
      playerSource.indexOf('private tryStartDash'),
    );
    expect(jump).toContain('grounded || now - this.lastGroundedAt');
    expect(jump).toContain('wall || now - this.lastWallAt');
    expect(jump).toContain('this.jumpQueuedAt = -Infinity');
    expect(jump.match(/PLAYER_JUMP/g)).toHaveLength(1);
    expect(playerSource).not.toMatch(/doubleJump|jumpsRemaining/i);
  });

  it('derives dash authority from its deadline, independently of visible state', () => {
    expect(playerSource).toContain('return this.scene.time.now < this.dashEndsAt');
    expect(playerSource).not.toContain('this.states.state === PlayerState.DASHING &&');
  });
});
