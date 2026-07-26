import { describe, expect, it } from 'vitest';
import { MOVEMENT } from './movementConfig';
import { LEVELS, validateLevels } from './levelConfig';
describe('configuration', () => {
  it('centralizes precision timings', () => {
    expect(MOVEMENT.coyoteMs).toBe(100);
    expect(MOVEMENT.jumpBufferMs).toBe(120);
    expect(MOVEMENT.dashDurationMs).toBe(150);
  });
  it('defines five valid, increasingly featured floors', () => {
    expect(validateLevels(LEVELS)).toBe(true);
    expect(LEVELS).toHaveLength(5);
    expect(LEVELS[1]?.electricZones.length).toBeGreaterThan(0);
    expect(LEVELS[2]?.fans.length).toBeGreaterThan(0);
    expect(LEVELS[3]?.doors.length).toBeGreaterThan(0);
    expect(LEVELS[4]?.lasers.length).toBeGreaterThan(0);
  });
});
