import { describe, expect, it } from 'vitest';
import { LEVELS } from '../config/levelConfig';
import { levelValidationErrors } from './LevelValidation';
describe('actual level definitions', () => {
  it('are structurally valid (not a proof of playability)', () => expect(levelValidationErrors(LEVELS)).toEqual([]));
  it('returns useful paths', () => {
    const invalid = [{ ...LEVELS[0]!, splits: [{ ...LEVELS[0]!.splits[0]!, width: 0 }] }];
    expect(levelValidationErrors(invalid).some((error) => error.includes('floor-01.splits[0]'))).toBe(true);
  });
});
