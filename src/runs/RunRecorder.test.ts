import { describe, expect, it } from 'vitest';
import { PlayerState } from '../types/game';
import { RunRecorder } from './RunRecorder';
describe('RunRecorder', () => {
  const pose = { x: 1.26, y: 2.74, facing: 1 as const, state: PlayerState.RUNNING };
  it('samples at fixed frequency independent of frames', () => { const recorder = new RunRecorder(1, 50); recorder.update(120, pose); expect(recorder.finish().samples.map((sample) => sample.timeMs)).toEqual([0, 50, 100]); });
  it('quantizes and limits samples', () => { const recorder = new RunRecorder(1, 20, 2); recorder.update(100, pose); const run = recorder.finish(); expect(run.samples).toHaveLength(2); expect(run.samples[0]?.x).toBe(1.5); });
  it('resets a failed attempt', () => { const recorder = new RunRecorder(1); recorder.update(100, pose); recorder.reset(); recorder.update(1, pose); expect(recorder.finish().samples).toHaveLength(1); });
});
