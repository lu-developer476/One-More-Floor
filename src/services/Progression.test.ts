import { describe, expect, it } from 'vitest';
import { getNextFloor, isFloorUnlocked, reconcileFloorProgress, unlockAfterCompletion, validate } from './StorageService';

describe('floor-number progression', () => {
  it('unlocks floor three after completing floor two regardless of performance', () => {
    const save = validate({ unlockedFloor: 2, floors: { '1': { completed: true }, '2': { completed: true } } });
    expect(save.unlockedFloor).toBe(3);
    expect(isFloorUnlocked(save, 3)).toBe(true);
    expect(getNextFloor(2)).toBe(3);
  });

  it('uses contiguous completions, preserves valid progress, and ignores isolated records', () => {
    const isolated = validate({ unlockedFloor: 1, floors: { '3': { completed: true, bestTimeMs: 1 } } });
    expect(reconcileFloorProgress(isolated).unlockedFloor).toBe(1);
    isolated.unlockedFloor = 3;
    expect(reconcileFloorProgress(isolated).unlockedFloor).toBe(3);
  });

  it('does not unlock from practice policy authority', () => {
    const save = validate({ unlockedFloor: 2 });
    expect(unlockAfterCompletion(save, 2).unlockedFloor).toBe(3);
  });
});
