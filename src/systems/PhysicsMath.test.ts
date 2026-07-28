import { describe, expect, it } from 'vitest';
import {
  acceleratedVelocity,
  ballisticJumpHeight,
  classifyLanding,
  conveyorVelocity,
} from './PhysicsMath';

describe('frame-independent environment math', () => {
  it('produces equivalent acceleration over one second at common frame rates', () => {
    const simulate = (fps: number) =>
      Array.from({ length: fps }).reduce<number>(
        (velocity) => acceleratedVelocity(velocity, 300, 1 / fps, 1000),
        0,
      );
    expect(simulate(30)).toBeCloseTo(300, 4);
    expect(simulate(60)).toBeCloseTo(300, 4);
    expect(simulate(120)).toBeCloseTo(300, 4);
  });
  it('converges toward conveyor speed without adding indefinitely', () => {
    let velocity = 0;
    for (let index = 0; index < 300; index += 1) velocity = conveyorVelocity(velocity, 170, 1 / 60);
    expect(velocity).toBeCloseTo(170, 4);
  });
  it('classifies landings from pre-impact velocity', () => {
    expect(classifyLanding(220)).toBe('soft');
    expect(classifyLanding(520)).toBe('hard');
  });
  it('shows the v1.0.1 jump and wall jump are theoretically higher', () => {
    expect(ballisticJumpHeight(620, 1520)).toBeCloseTo(126.45, 2);
    expect(ballisticJumpHeight(590, 1520)).toBeCloseTo(114.51, 2);
    expect(ballisticJumpHeight(620, 1520)).toBeGreaterThan(ballisticJumpHeight(535, 1520));
    expect(ballisticJumpHeight(590, 1520)).toBeGreaterThan(ballisticJumpHeight(505, 1520));
  });
  it('rejects non-physical gravity', () => {
    expect(() => ballisticJumpHeight(620, 0)).toThrow(RangeError);
  });
});
