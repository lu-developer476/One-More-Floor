import { describe, expect, it } from 'vitest';
import { createFloorRunData, createTowerFloorRunData } from './RunContext';
import { LEVELS } from '../config/levelConfig';
describe('run context builders', () => {
  it('uses every floor initial anchor', () => {
    for (let i = 0; i < LEVELS.length; i += 1)
      expect(createFloorRunData(i).anchorId).toBe(`floor0${i + 1}-anchor-start`);
  });
  it('separates scope and mode', () => {
    expect(createTowerFloorRunData(0, 'assisted', 'tower-context').scope).toBe('tower');
    expect(createFloorRunData(0, 'practice').scope).toBe('floor');
  });
});
