import { describe, expect, it } from 'vitest';
import { StorageService } from './StorageService';
class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}
describe('StorageService', () => {
  it('migrates v4 input defaults without losing progress',()=>{const store=new MemoryStorage();store.values.set('one-more-floor.save.v4',JSON.stringify({version:4,unlockedFloor:3,floors:{'1':{completed:true,bestTimeMs:900,fewestDeaths:0,rank:'S'}},settings:{showGhost:true},input:{keyboard:{JUMP:'invalid',DASH:'KeyQ'}}}));const data=new StorageService(store).load();expect(data.version).toBe(6);expect(data.unlockedFloor).toBe(3);expect(data.floors['1']?.bestTimeMs).toBe(900);expect(data.input.keyboard.JUMP).toBe('Space');expect(data.input.keyboard.DASH).toBe('KeyQ')});

  it('returns defaults for empty and invalid JSON', () => {
    const store = new MemoryStorage();
    expect(new StorageService(store).load().unlockedFloor).toBe(1);
    store.values.set('one-more-floor.save.v3', '{');
    expect(new StorageService(store).load().version).toBe(6);
  });
  it('clamps and rejects corrupt fields without losing valid settings', () => {
    const store = new MemoryStorage();
    store.values.set(
      'one-more-floor.save.v3',
      JSON.stringify({
        unlockedFloor: 99,
        settings: { volume: -2, mute: true, highContrast: true },
        floors: { '1': { completed: true, bestTimeMs: -5, fewestDeaths: -1, rank: 'Z' }, '9': {} },
      }),
    );
    const data = new StorageService(store).load();
    expect(data.unlockedFloor).toBe(1);
    expect(data.settings).toMatchObject({ volume: 0.7, mute: true, highContrast: true });
    expect(data.floors['1']).toMatchObject({
      bestTimeMs: null,
      fewestDeaths: null,
      rank: null,
    });
    expect(data.floors['9']).toBeUndefined();
  });
  it('migrates v2 including missing accessibility fields', () => {
    const store = new MemoryStorage();
    store.values.set(
      'one-more-floor.save.v2',
      JSON.stringify({
        version: 2,
        unlockedFloor: 2,
        floors: { '1': { completed: true, bestTimeMs: 1200, fewestDeaths: 1, rank: 'A' } },
        settings: { volume: 0.4, mute: true },
      }),
    );
    const data = new StorageService(store).load();
    expect(data.version).toBe(6);
    expect(data.settings.showGhost).toBe(true);
    expect(data.unlockedFloor).toBe(2);
    expect(data.settings.reduceFlashes).toBe(false);
    expect(data.floors['1']?.rank).toBe('A');
  });
  it('migrates the v1 flat record', () => {
    const store = new MemoryStorage();
    store.values.set(
      'one-more-floor.save.v1',
      JSON.stringify({ bestTimeMs: 1200, fewestDeaths: 2, volume: 0.4, fullscreen: true }),
    );
    const data = new StorageService(store).load();
    expect(data.floors['1']?.completed).toBe(true);
    expect(data.settings.fullscreen).toBe(true);
  });
  it('records each result once and preserves best values', () => {
    const store = new MemoryStorage();
    const service = new StorageService(store);
    service.recordFloor(1, 2000, 3, 'B');
    const data = service.recordFloor(1, 2500, 1, 'A');
    expect(data.save.floors['1']).toMatchObject({ bestTimeMs: 2000, fewestDeaths: 1, rank: 'A' });
    expect(data.save.unlockedFloor).toBe(2);
  });
  it('saves only a faster valid ghost and can clear ghosts', async () => {
    const { PlayerState } = await import('../types/game');
    const ghost = {
      version: 1 as const,
      floor: 1,
      durationMs: 1000,
      sampleIntervalMs: 50,
      samples: [
        { timeMs: 0, x: 0, y: 0, facing: 1 as const, state: PlayerState.IDLE },
        { timeMs: 1000, x: 10, y: 0, facing: 1 as const, state: PlayerState.RUNNING },
      ],
    };
    const service = new StorageService(new MemoryStorage());
    expect(service.recordFloor(1, 1000, 0, 'S', ghost).save.floors['1']?.bestGhost).not.toBeNull();
    const slower = {
      ...ghost,
      durationMs: 1200,
      samples: ghost.samples.map((sample, index) => ({ ...sample, timeMs: index * 1200 })),
    };
    expect(
      service.recordFloor(1, 1200, 0, 'S', slower).save.floors['1']?.bestGhost?.durationMs,
    ).toBe(1000);
    expect(service.clearGhosts().floors['1']?.bestGhost).toBeNull();
  });
});
