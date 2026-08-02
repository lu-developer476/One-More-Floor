import { describe, expect, it } from 'vitest';
import { StorageService } from './StorageService';
class MemoryStorage {
  values = new Map<string, string>();
  writes = 0;
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.writes += 1;
    this.values.set(key, value);
  }
}
describe('StorageService', () => {
  it('migrates v8 to v9 and forces layout 2 exactly once', () => {
    const store = new MemoryStorage();
    store.values.set(
      'one-more-floor.save.v8',
      JSON.stringify({
        version: 8,
        unlockedFloor: 4,
        floors: { '1': { completed: true, bestTimeMs: 900 } },
        settings: { mute: true },
        input: {
          keyboard: {
            MOVE_LEFT: 'KeyQ',
            MOVE_RIGHT: 'KeyE',
            JUMP: 'KeyW',
            DASH: 'ShiftLeft',
            PAUSE: 'Escape',
            RESTART: 'KeyT',
            MENU_UP: 'KeyI',
            MENU_DOWN: 'KeyK',
            MENU_LEFT: 'KeyJ',
            MENU_RIGHT: 'KeyL',
            CONFIRM: 'Space',
            BACK: 'Backspace',
          },
          gamepad: { DASH: 7 },
          deadZone: 0.4,
          promptStyle: 'xbox',
        },
      }),
    );
    const data = new StorageService(store).load();
    expect(data).toMatchObject({ version: 9, unlockedFloor: 4, settings: { mute: true } });
    expect(data.input.keyboard).toMatchObject({
      MOVE_LEFT: 'ArrowLeft',
      MOVE_RIGHT: 'ArrowRight',
      JUMP: 'Space',
      DASH: 'KeyS',
      PAUSE: 'KeyP',
      RESTART: 'KeyT',
      MENU_UP: 'KeyI',
      CONFIRM: 'Space',
      BACK: 'Backspace',
    });
    expect(data.input).toMatchObject({
      keyboardLayoutVersion: 2,
      deadZone: 0.4,
      promptStyle: 'xbox',
      gamepad: { DASH: 7 },
    });
    expect(data.floors['1']?.bestTimeMs).toBe(900);
  });

  it('preserves a post-migration v9 remap and resetControls preserves progress', () => {
    const store = new MemoryStorage();
    const service = new StorageService(store);
    const save = service.load();
    save.unlockedFloor = 5;
    save.input.keyboard.JUMP = 'KeyQ';
    service.save(save);
    expect(service.load().input.keyboard.JUMP).toBe('KeyQ');
    const reset = service.resetControls();
    expect(reset.unlockedFloor).toBe(5);
    expect(reset.input.keyboard.JUMP).toBe('Space');
    expect(reset.input.keyboard.DASH).toBe('KeyS');
    expect(reset.input.keyboard.PAUSE).toBe('KeyP');
    expect(reset.input.keyboardLayoutVersion).toBe(2);
  });
  it('migrates v4 input defaults without losing progress', () => {
    const store = new MemoryStorage();
    store.values.set(
      'one-more-floor.save.v4',
      JSON.stringify({
        version: 4,
        unlockedFloor: 3,
        floors: { '1': { completed: true, bestTimeMs: 900, fewestDeaths: 0, rank: 'S' } },
        settings: { showGhost: true },
        input: { keyboard: { JUMP: 'invalid', DASH: 'KeyQ' } },
      }),
    );
    const data = new StorageService(store).load();
    expect(data.version).toBe(9);
    expect(data.unlockedFloor).toBe(3);
    expect(data.floors['1']?.bestTimeMs).toBe(900);
    expect(data.input.keyboard.JUMP).toBe('Space');
    expect(data.input.keyboard.DASH).toBe('KeyS');
    expect(data.input.keyboardLayoutVersion).toBe(2);
  });

  it('returns defaults for empty and invalid JSON', () => {
    const store = new MemoryStorage();
    expect(new StorageService(store).load().unlockedFloor).toBe(1);
    store.values.set('one-more-floor.save.v3', '{');
    expect(new StorageService(store).load().version).toBe(9);
  });
  it('does not write during a valid read and writes completion exactly once', () => {
    const store = new MemoryStorage();
    const service = new StorageService(store);
    const save = service.load();
    expect(store.writes).toBe(0);
    service.save(save);
    const afterSeed = store.writes;
    service.load();
    expect(store.writes).toBe(afterSeed);
    const outcome = service.recordFloor(1, 1000, 0, 'S');
    expect(store.writes).toBe(afterSeed + 1);
    expect(outcome).toMatchObject({ persisted: true, progressEligible: true, progressChanged: true, previousUnlockedFloor: 1, currentUnlockedFloor: 2, newlyUnlockedFloor: 2 });
  });
  it('reports an in-memory progress change when persistence fails', () => {
    const store = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
    const outcome = new StorageService(store).recordFloor(1, 1000, 0, 'S');
    expect(outcome).toMatchObject({ persisted: false, progressChanged: true, currentUnlockedFloor: 2 });
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
    expect(data.unlockedFloor).toBe(2);
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
    expect(data.version).toBe(9);
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
describe('tower persistence v7', () => {
  it('migrates v6 and isolates a corrupt tower record', () => {
    const store = new MemoryStorage();
    store.values.set(
      'one-more-floor.save.v6',
      JSON.stringify({
        version: 6,
        unlockedFloor: 4,
        floors: { '1': { completed: true, bestTimeMs: 1000 } },
        settings: { mute: true },
        tower: { completed: true, bestTimeMs: -1 },
      }),
    );
    const data = new StorageService(store).load();
    expect(data.version).toBe(9);
    expect(data.unlockedFloor).toBe(4);
    expect(data.floors['1']?.bestTimeMs).toBe(1000);
    expect(data.tower.bestTimeMs).toBeNull();
  });
  it('keeps faster time and independently improves deaths', () => {
    const service = new StorageService(new MemoryStorage()),
      results = [1, 2, 3, 4, 5].map((floor) => ({
        floor,
        elapsedMs: 1000,
        cumulativeTowerMs: floor * 1000,
      }));
    service.recordTower(5000, 8, 'B', results);
    service.recordTower(
      6000,
      3,
      'A',
      results.map((result) => ({
        ...result,
        elapsedMs: 1200,
        cumulativeTowerMs: result.floor * 1200,
      })),
    );
    const tower = service.load().tower;
    expect(tower.bestTimeMs).toBe(5000);
    expect(tower.fewestDeaths).toBe(3);
    expect(tower.bestRank).toBe('A');
  });
});

describe('tower persistence v8 coherence', () => {
  const run = (floorMs: number[]) =>
    floorMs.map((elapsedMs, index) => ({
      floor: index + 1,
      elapsedMs,
      cumulativeTowerMs: floorMs.slice(0, index + 1).reduce((sum, value) => sum + value, 0),
    }));
  it('replaces the complete PB reference but keeps independent floor bests', () => {
    const service = new StorageService(new MemoryStorage());
    const first = service.recordTower(5000, 5, 'B', run([1000, 1000, 1000, 1000, 1000]));
    expect(first).toMatchObject({ persisted: true, newBestTime: true, bestRunReplaced: true });
    service.recordTower(4900, 7, 'C', run([500, 1100, 1100, 1100, 1100]));
    const tower = service.load().tower;
    expect(tower.bestRunFloorTimes).toEqual({
      '1': 500,
      '2': 1100,
      '3': 1100,
      '4': 1100,
      '5': 1100,
    });
    expect(tower.bestRunCumulativeTimes['5']).toBe(4900);
    service.recordTower(5400, 1, 'S', run([400, 1250, 1250, 1250, 1250]));
    expect(service.load().tower.bestRunCumulativeTimes['5']).toBe(4900);
    expect(service.load().tower.bestIndividualFloorTimes['1']).toBe(400);
  });
  it('does not persist an assisted result', () => {
    const service = new StorageService(new MemoryStorage());
    const outcome = service.recordTower(5000, 0, 'S', run([1000, 1000, 1000, 1000, 1000]), false);
    expect(outcome).toMatchObject({ eligible: false, persisted: false, newBestTime: false });
    expect(service.load().tower.completed).toBe(false);
  });
  it('migrates v7 without treating cumulative minima as one run', () => {
    const store = new MemoryStorage();
    store.values.set(
      'one-more-floor.save.v7',
      JSON.stringify({
        version: 7,
        unlockedFloor: 3,
        tower: {
          completed: true,
          bestTimeMs: 5000,
          fewestDeaths: 2,
          rank: 'A',
          bestFloorTimes: { '1': 800 },
          bestCumulativeTimes: { '1': 800, '5': 5000 },
        },
      }),
    );
    const tower = new StorageService(store).load().tower;
    expect(tower.bestTimeMs).toBe(5000);
    expect(tower.bestRank).toBe('A');
    expect(tower.bestIndividualFloorTimes).toEqual({ '1': 800 });
    expect(tower.bestRunCumulativeTimes).toEqual({});
  });
});
