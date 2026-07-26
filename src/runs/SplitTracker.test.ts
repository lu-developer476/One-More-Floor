import { describe, expect, it } from 'vitest';
import { SplitTracker } from './SplitTracker';
const splits = [
  { id: 'floor01-a', name: 'A', x: 1, y: 1, width: 1, height: 1, order: 0 },
  { id: 'floor01-b', name: 'B', x: 2, y: 1, width: 1, height: 1, order: 1 },
] as const;
describe('SplitTracker', () => {
  it('accepts each split once and in order', () => {
    const tracker = new SplitTracker(splits);
    expect(tracker.trigger('floor01-b', 50)).toBeNull();
    expect(tracker.trigger('floor01-a', 100)?.segmentMs).toBe(100);
    expect(tracker.trigger('floor01-a', 120)).toBeNull();
    expect(tracker.trigger('floor01-b', 250)?.segmentMs).toBe(150);
  });
});
