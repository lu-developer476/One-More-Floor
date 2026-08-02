import { describe, expect, it, vi } from 'vitest';
import { LEVELS } from '../config/levelConfig';
import { resolveEnemyContact } from './EnemyContact';
import type { EnemyActor } from './EnemyActor';

describe('deterministic enemy definitions', () => {
  it('uses the expected rulesets and fixed encounter counts', () => {
    expect(LEVELS.map((level) => level.rulesetVersion)).toEqual([1, 2, 2, 2, 2]);
    expect(LEVELS.map((level) => level.enemies.length)).toEqual([0, 1, 2, 2, 3]);
  });
  it('has globally unique IDs and finite positive motion', () => {
    const enemies = LEVELS.flatMap((level) => level.enemies);
    expect(new Set(enemies.map(({ id }) => id))).toHaveLength(enemies.length);
    expect(enemies.every((enemy) => enemy.kind === 'maintenance-bot' ? enemy.speed > 0 && enemy.patrolMinX <= enemy.x && enemy.x <= enemy.patrolMaxX : enemy.chargeSpeed > 0 && enemy.alertMs > 0)).toBe(true);
  });
});
describe('atomic enemy contact authority', () => {
  const actor = (disabled = false) => ({ disabled, sprite: { active: true }, disable: vi.fn(function(this: { disabled: boolean }) { if (this.disabled) return false; this.disabled = true; return true; }) }) as unknown as EnemyActor;
  it('kills without dash and never disables', () => { const enemy = actor(); expect(resolveEnemyContact(enemy, false)).toBe('player-killed'); expect(enemy.disable).not.toHaveBeenCalled(); });
  it('disables during dash once, then ignores repeated overlap', () => { const enemy = actor(); expect(resolveEnemyContact(enemy, true)).toBe('enemy-disabled'); expect(resolveEnemyContact(enemy, true)).toBe('ignored'); expect(enemy.disable).toHaveBeenCalledTimes(1); });
  it('ignores inactive or previously disabled actors', () => { const enemy = actor(true); expect(resolveEnemyContact(enemy, false)).toBe('ignored'); });
});
