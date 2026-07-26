import { describe, expect, it } from 'vitest';
import { evaluateRunEligibility } from './RunEligibility';
describe('RunEligibility', () => {
  it('allows a normal competitive run', () => {
    expect(
      evaluateRunEligibility({
        mode: 'competitive',
        startAnchorId: 'start',
        gameplayAssist: false,
        e2e: false,
      }),
    ).toMatchObject({ status: 'COMPETITIVO', bestTime: true, ghost: true });
  });
  it('never records practice', () => {
    expect(
      evaluateRunEligibility({
        mode: 'practice',
        startAnchorId: 'core',
        gameplayAssist: false,
        e2e: false,
      }),
    ).toMatchObject({
      status: 'PRÁCTICA',
      progress: false,
      bestTime: false,
      rank: false,
      ghost: false,
    });
  });
  it('allows assisted progression but no records', () => {
    expect(
      evaluateRunEligibility({
        mode: 'assisted',
        startAnchorId: 'start',
        gameplayAssist: true,
        e2e: false,
      }),
    ).toMatchObject({
      status: 'ASISTIDO',
      progress: true,
      bestTime: false,
      rank: false,
      ghost: false,
    });
  });
  it('requires explicit harness eligibility', () => {
    expect(
      evaluateRunEligibility({
        mode: 'competitive',
        startAnchorId: 'start',
        gameplayAssist: false,
        e2e: true,
      }).bestTime,
    ).toBe(false);
  });
});
