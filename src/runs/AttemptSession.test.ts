import { expect, it } from 'vitest';
import { AttemptSession } from './AttemptSession';
import { cumulativeSplitRecord, segmentSplitRecord } from './SplitTracker';
import { PlayerState } from '../types/game';
const definitions = [{ id: 'a', name: 'A', x: 1, y: 1, width: 1, height: 1, order: 0 }, { id: 'b', name: 'B', x: 2, y: 1, width: 1, height: 1, order: 1 }];
const context = { levelIndex: 0, mode: 'competitive' as const, anchorId: 'start', gameplayAssist: false, allowE2ECompetitive: false };
it('finishes once with real cumulative and segment records', () => {
  const session = new AttemptSession(context, 1, definitions); session.start();
  session.update(40, { x: 0, y: 0, facing: 1, state: PlayerState.IDLE }); session.triggerSplit('a');
  session.update(30, { x: 1, y: 0, facing: 1, state: PlayerState.IDLE }); session.triggerSplit('b');
  const result = session.finish(); expect(result.cumulativeSplits).toEqual({ a: 40, b: 70 }); expect(result.segments).toEqual({ a: 40, b: 30 });
  expect(() => session.finish()).toThrow(/more than once/);
});
it('converts records purely', () => { const times = [{ id: 'a', name: 'A', cumulativeMs: 10, segmentMs: 10 }]; expect(cumulativeSplitRecord(times)).toEqual({ a: 10 }); expect(segmentSplitRecord(times)).toEqual({ a: 10 }); });
