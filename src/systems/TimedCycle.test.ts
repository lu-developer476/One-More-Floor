import { describe, expect, it } from 'vitest';
import { timedCycleState } from './TimedCycle';
describe('timedCycleState', () => {
  it('cycles through active, inactive and warning windows', () => {
    expect(timedCycleState(0, 1000, 1000, 250)).toBe('active');
    expect(timedCycleState(1200, 1000, 1000, 250)).toBe('inactive');
    expect(timedCycleState(1800, 1000, 1000, 250)).toBe('warning');
    expect(timedCycleState(2000, 1000, 1000, 250)).toBe('active');
  });
  it('handles negative and phase-shifted input deterministically', () => {
    expect(timedCycleState(-100, 500, 500, 100)).toBe('active');
    expect(timedCycleState(0, 500, 500, 100, 950)).toBe('warning');
  });
});
