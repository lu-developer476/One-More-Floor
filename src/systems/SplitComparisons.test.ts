import { expect, it } from 'vitest';
import { LEVELS } from '../config/levelConfig';
import { calculateBestTheoretical, formatDelta } from './SplitComparisons';
it('requires every expected segment', () => { const level = LEVELS[0]!, complete = Object.fromEntries(level.splits.map((split) => [split.id, 100])); expect(calculateBestTheoretical(level, complete)).toBe(level.splits.length * 100); delete complete[level.splits[0]!.id]; expect(calculateBestTheoretical(level, complete)).toBeNull(); });
it('formats comparisons', () => { expect(formatDelta(-420)).toBe('−0.42 s'); expect(formatDelta(null)).toBe('SIN REFERENCIA'); expect(formatDelta(1)).toBe('IGUAL'); });
