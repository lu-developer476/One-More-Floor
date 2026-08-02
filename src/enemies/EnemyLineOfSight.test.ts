import { describe, expect, it } from 'vitest';
import { distanceToFirstBlocker, hasEnemyLineOfSight } from './EnemyLineOfSight';

describe('blocker-aware enemy line of sight', () => {
  const origin = { x: 100, y: 100 }, target = { x: 400, y: 100 };
  it('allows a clear lane and ignores open doors', () => {
    expect(hasEnemyLineOfSight(origin, target, [])).toBe(true);
    expect(hasEnemyLineOfSight(origin, target, [{ x: 250, y: 100, width: 30, height: 150, active: false }])).toBe(true);
  });
  it('blocks on walls and closed doors', () => {
    expect(hasEnemyLineOfSight(origin, target, [{ x: 250, y: 100, width: 30, height: 150 }])).toBe(false);
    expect(hasEnemyLineOfSight(origin, target, [{ x: 250, y: 100, width: 30, height: 150, active: true }])).toBe(false);
  });
  it('ends the telegraph at the first blocker', () => {
    expect(distanceToFirstBlocker(origin, 1, 500, [{ x: 300, y: 100, width: 40, height: 100 }, { x: 200, y: 100, width: 20, height: 100 }])).toBe(90);
  });
  it('ignores blockers behind either endpoint and handles both directions', () => {
    expect(hasEnemyLineOfSight(origin, target, [{ x: 50, y: 100, width: 20, height: 20 }])).toBe(true);
    expect(hasEnemyLineOfSight(origin, target, [{ x: 450, y: 100, width: 20, height: 20 }])).toBe(true);
    expect(hasEnemyLineOfSight(target, origin, [{ x: 250, y: 100, width: 20, height: 20 }])).toBe(false);
  });
  it('blocks tangential corners, endpoint edges, and the first of multiple blockers', () => {
    expect(hasEnemyLineOfSight(origin, target, [{ x: 250, y: 150, width: 40, height: 100 }])).toBe(false);
    expect(hasEnemyLineOfSight(origin, { x: 240, y: 100 }, [{ x: 250, y: 100, width: 20, height: 20 }])).toBe(true);
    expect(hasEnemyLineOfSight(origin, target, [{ x: 500, y: 100, width: 20, height: 20 }, { x: 300, y: 100, width: 20, height: 20 }])).toBe(false);
  });
  it('rejects non-finite geometry instead of granting detection', () => {
    expect(hasEnemyLineOfSight({ x: Number.NaN, y: 0 }, target, [])).toBe(false);
    expect(hasEnemyLineOfSight(origin, target, [{ x: Infinity, y: 0, width: 1, height: 1 }])).toBe(false);
    expect(distanceToFirstBlocker(origin, 1, Number.NaN, [])).toBe(0);
  });
});
