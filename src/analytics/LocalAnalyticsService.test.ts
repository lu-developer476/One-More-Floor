import { describe, expect, it } from 'vitest';
import { LocalAnalyticsService } from './LocalAnalyticsService';

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
    expect(new LocalAnalyticsService(true, store).load()).toEqual({ version: 1, floors: {} });
  });
});
