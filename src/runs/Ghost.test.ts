import { describe, expect, it } from 'vitest';
import { PlayerState } from '../types/game';
import { validateGhostRun } from './GhostValidator';
import { interpolateGhost } from './GhostInterpolation';
import { MAX_GHOST_SAMPLES, type GhostRun } from './GhostTypes';
const valid = (): GhostRun => ({
  version: 1,
  floor: 1,
  durationMs: 100,
  sampleIntervalMs: 50,
  samples: [
    { timeMs: 0, x: 0, y: 0, facing: 1, state: PlayerState.IDLE },
    { timeMs: 100, x: 10, y: 20, facing: -1, state: PlayerState.RUNNING },
  ],
});
describe('ghost validation and interpolation', () => {
  it('interpolates both axes', () =>
    expect(interpolateGhost(valid(), 50)?.frame).toMatchObject({ x: 5, y: 10 }));
  it('rejects floor mismatch, non-finite values and temporal disorder', () => {
    expect(validateGhostRun(valid(), 2)).toBeNull();
    const nan = valid();
    nan.samples[1]!.x = Number.NaN;
    expect(validateGhostRun(nan)).toBeNull();
    const infinity = valid();
    infinity.samples[1]!.y = Infinity;
    expect(validateGhostRun(infinity)).toBeNull();
    const order = valid();
    order.samples[1]!.timeMs = 0;
    expect(validateGhostRun(order)).toBeNull();
  });
  it('rejects excessive samples', () => {
    const run = valid();
    run.samples = Array.from({ length: MAX_GHOST_SAMPLES + 1 }, (_, timeMs) => ({
      ...run.samples[0]!,
      timeMs,
    }));
    run.durationMs = MAX_GHOST_SAMPLES + 1;
    expect(validateGhostRun(run)).toBeNull();
  });
});
