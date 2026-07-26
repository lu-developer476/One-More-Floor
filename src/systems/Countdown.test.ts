import { describe, expect, it } from 'vitest';
import { Countdown } from './Countdown';
describe('Countdown', () => {
  it('never drops below zero', () => {
    const timer = new Countdown(100);
    expect(timer.update(40)).toBe(60);
    expect(timer.update(100)).toBe(0);
    expect(timer.expired).toBe(true);
  });
  it('stops', () => {
    const timer = new Countdown(100);
    timer.stop();
    expect(timer.update(50)).toBe(100);
  });
});
