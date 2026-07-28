import { describe, expect, it } from 'vitest';
import { LocalAnalyticsService, validateAnalytics } from './LocalAnalyticsService';

class MemoryStore {
  private value: string | null = null;
  getItem(): string | null {
    return this.value;
  }
  setItem(_key: string, value: string): void {
    this.value = value;
  }
  removeItem(): void {
    this.value = null;
  }
}

describe('local analytics', () => {
  it('is optional and bounded', () => {
    const store = new MemoryStore();
    new LocalAnalyticsService(false, store).complete(0, 10);
    expect(new LocalAnalyticsService(true, store).load().floors['1']).toBeUndefined();
    const service = new LocalAnalyticsService(true, store);
    for (let index = 0; index < 120; index += 1) service.complete(0, index);
    expect(service.load().floors['1']?.completionTimes).toHaveLength(100);
  });
  it('isolates corrupt data', () => {
    const store = new MemoryStore();
    store.setItem('', '{broken');
    expect(new LocalAnalyticsService(true, store).load()).toMatchObject({
      version: 1,
      floors: {},
      tower: { attempts: 0 },
    });
  });
});

it('preserves valid nested analytics while isolating corrupt fields', () => {
  const value = validateAnalytics({
    version: 1,
    floors: {
      '1': {
        attempts: 2,
        deathCauses: { fall: 2, bogus: 9 },
        deathSources: { 'world-bottom': 2 },
        segmentTimes: { 'floor01-split-entry': [10, Number.NaN, 20] },
        anchors: { 'floor01-anchor-start': 2 },
        completionTimes: [100],
      },
    },
  });
  expect(value.floors['1']).toMatchObject({
    deathCauses: { fall: 2 },
    deathSources: { 'world-bottom': 2 },
    anchors: { 'floor01-anchor-start': 2 },
    segmentTimes: { 'floor01-split-entry': [10, 20] },
  });
});
