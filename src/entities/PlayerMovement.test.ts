import { describe, expect, it } from 'vitest';
import { MOVEMENT } from '../config/movementConfig';
import { resolveJump, type JumpContext } from './JumpResolver';
import playerSource from './Player.ts?raw';

const airborne = (remaining = 1): JumpContext => ({
  grounded: false,
  withinCoyote: false,
  atWall: false,
  withinWallCoyote: false,
  airJumpsRemaining: remaining,
  freshPress: true,
});

describe('repeatable double jump', () => {
  it('uses the exact v1.1.1 movement and frozen dash tuning', () => {
    expect(MOVEMENT).toMatchObject({
      gravity: 1520, maxFallSpeed: 980, jumpSpeed: 680, maxAirJumps: 1,
      airJumpSpeed: 640, wallJumpX: 360, wallJumpY: 640, coyoteMs: 100,
      wallCoyoteMs: 100, jumpBufferMs: 120, jumpCutMultiplier: 0.68,
      wallJumpLockMs: 110, dashSpeed: 675, dashDurationMs: 220,
      dashCooldownMs: 230, dashEndMultiplier: 0.58,
    });
  });

  it('prioritizes ground, coyote, wall and then air', () => {
    expect(resolveJump({ ...airborne(), grounded: true }).kind).toBe('ground');
    expect(resolveJump({ ...airborne(), withinCoyote: true }).kind).toBe('coyote');
    expect(resolveJump({ ...airborne(), atWall: true }).kind).toBe('wall');
    expect(resolveJump(airborne()).kind).toBe('air');
  });

  it('allows one air jump and rejects a third jump', () => {
    expect(resolveJump(airborne(1))).toMatchObject({ performed: true, consumeAirJump: true });
    expect(resolveJump(airborne(0))).toMatchObject({ performed: false, kind: null });
  });

  it('requires a new input edge for the air jump', () => {
    expect(resolveJump({ ...airborne(), freshPress: false }).performed).toBe(false);
  });

  it.each([5, 20])('supports %i landing-reset cycles', (cycles) => {
    let completed = 0;
    for (let cycle = 0; cycle < cycles; cycle += 1) {
      let remaining = MOVEMENT.maxAirJumps;
      expect(resolveJump({ ...airborne(remaining), grounded: true }).kind).toBe('ground');
      const air = resolveJump(airborne(remaining));
      if (air.consumeAirJump) remaining -= 1;
      expect(air.kind).toBe('air');
      expect(resolveJump(airborne(remaining)).performed).toBe(false);
      remaining = MOVEMENT.maxAirJumps;
      expect(remaining).toBe(1);
      completed += 1;
    }
    expect(completed).toBe(cycles);
  });

  it('keeps the air charge after an accidental fall and wall jump', () => {
    expect(resolveJump(airborne()).kind).toBe('air');
    expect(resolveJump({ ...airborne(), atWall: true })).toMatchObject({ kind: 'wall', consumeAirJump: false });
  });

  it('does not let wall contact, dash, or buffered held input restore/duplicate authority', () => {
    expect(playerSource).not.toMatch(/if \(wall\)[\s\S]{0,100}airJumpsRemaining\s*=/);
    const dash = playerSource.slice(playerSource.indexOf('private tryStartDash'), playerSource.indexOf('private applyDashMovement'));
    expect(dash).not.toContain('airJumpsRemaining');
    expect(dash).not.toContain('setVelocityY');
    expect(playerSource).toContain('freshPress: boolean');
    expect(playerSource).toContain('if (!this.wasGrounded) this.airJumpsRemaining = MOVEMENT.maxAirJumps');
  });

  it('composes jump and dash without changing vertical dash velocity', () => {
    expect(playerSource.indexOf('consumeQueuedJump')).toBeLessThan(playerSource.indexOf('tryStartDash(direction)'));
    const dash = playerSource.slice(playerSource.indexOf('private tryStartDash'), playerSource.indexOf('private endDash'));
    expect(dash).not.toContain('setVelocityY');
    expect(dash).not.toContain('airJumpsRemaining');
  });
});
