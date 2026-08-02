import { describe, expect, it } from 'vitest';
import { LEVELS } from '../config/levelConfig';
import { resolveEnemyContact } from './EnemyContact';

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
  const input = (changes = {}) => ({ contactDangerous: true, canBeDisabled: true, dashActive: false, playerAlive: true, ...changes });
  it('kills dangerous contact without dash', () => expect(resolveEnemyContact(input())).toBe('player-killed'));
  it('prioritizes a real dash when disabling is allowed', () => expect(resolveEnemyContact(input({ dashActive: true }))).toBe('enemy-disabled'));
  it('ignores dead players, disabled actors, camera sleep, pause, and countdown', () => {
    expect(resolveEnemyContact(input({ playerAlive: false }))).toBe('ignored');
    for (const suspended of ['disabled', 'camera', 'pause', 'countdown']) {
      expect(resolveEnemyContact(input({ contactDangerous: false, canBeDisabled: false })), suspended).toBe('ignored');
    }
  });
  it('does not let dash disable an explicitly non-disableable actor', () => expect(resolveEnemyContact(input({ dashActive: true, canBeDisabled: false }))).toBe('player-killed'));
});
