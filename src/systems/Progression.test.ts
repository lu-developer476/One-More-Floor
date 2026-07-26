import { describe, expect, it } from 'vitest';
import { LEVELS } from '../config/levelConfig';
import { calculateRank } from './Statistics';
import { collapsePhase } from './CollapsePhase';
describe('gameplay rules', () => {
  it('uses explicit time and death rank thresholds', () => {
    const l = LEVELS[0]!;
    expect(calculateRank(l, 25000, 0)).toBe('S');
    expect(calculateRank(l, 25000, 3)).toBe('B');
    expect(calculateRank(l, 55000, 0)).toBe('C');
  });
  it('exposes collapse phases at stable ratios', () => {
    expect(collapsePhase(80000, 100000)).toBe('normal');
    expect(collapsePhase(40000, 100000)).toBe('warning');
    expect(collapsePhase(10000, 100000)).toBe('critical');
    expect(collapsePhase(0, 100000)).toBe('collapse');
  });
});
