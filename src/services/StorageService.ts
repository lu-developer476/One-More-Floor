import type { Rank } from '../types/game';
import { TOTAL_FLOORS } from '../config/levelConfig';

export interface FloorRecord {
  completed: boolean;
  bestTimeMs: number | null;
  fewestDeaths: number | null;
  rank: Rank | null;
}
export interface Settings {
  volume: number;
  mute: boolean;
  screenShake: boolean;
  reducedShake: boolean;
  reduceFlashes: boolean;
  highContrast: boolean;
  fullscreen: boolean;
}
export interface SaveData {
  version: 3;
  unlockedFloor: number;
  floors: Record<string, FloorRecord>;
  settings: Settings;
}
type Store = Pick<Storage, 'getItem' | 'setItem'>;

const KEY = 'one-more-floor.save.v3';
const V2_KEY = 'one-more-floor.save.v2';
const LEGACY_KEY = 'one-more-floor.save.v1';

const defaultSettings = (): Settings => ({
  volume: 0.7,
  mute: false,
  screenShake: true,
  reducedShake: false,
  reduceFlashes: false,
  highContrast: false,
  fullscreen: false,
});
const defaults = (): SaveData => ({
  version: 3,
  unlockedFloor: 1,
  floors: {},
  settings: defaultSettings(),
});
const finite = (value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
    ? value
    : null;
const validRank = (value: unknown): Rank | null =>
  value === 'S' || value === 'A' || value === 'B' || value === 'C' ? value : null;

export class StorageService {
  constructor(
    private readonly storage: Store | null = typeof localStorage === 'undefined'
      ? null
      : localStorage,
  ) {}

  load(): SaveData {
    if (!this.storage) return defaults();
    const current = this.parse(this.storage.getItem(KEY));
    if (current) return validate(current);
    const v2 = this.parse(this.storage.getItem(V2_KEY));
    if (v2) return validate(v2);
    return migrateLegacy(this.parse(this.storage.getItem(LEGACY_KEY)));
  }

  save(data: SaveData): void {
    try {
      this.storage?.setItem(
        KEY,
        JSON.stringify(validate(data as unknown as Record<string, unknown>)),
      );
    } catch {
      /* Storage can be unavailable in private/sandboxed contexts. */
    }
  }

  recordFloor(floor: number, time: number, deaths: number, rank: Rank): SaveData {
    const data = this.load();
    const key = String(Math.floor(floor));
    if (floor < 1 || floor > TOTAL_FLOORS) return data;
    const safeTime = finite(time, 1);
    const safeDeaths = finite(deaths, 0);
    if (safeTime === null || safeDeaths === null) return data;
    const old = data.floors[key];
    data.floors[key] = {
      completed: true,
      bestTimeMs: old?.bestTimeMs == null ? safeTime : Math.min(old.bestTimeMs, safeTime),
      fewestDeaths: old?.fewestDeaths == null ? safeDeaths : Math.min(old.fewestDeaths, safeDeaths),
      rank: betterRank(old?.rank ?? null, rank),
    };
    data.unlockedFloor = Math.min(TOTAL_FLOORS, Math.max(data.unlockedFloor, floor + 1));
    this.save(data);
    return data;
  }

  recordResult(
    time: number,
    deaths: number,
  ): { bestTimeMs: number | null; fewestDeaths: number | null } {
    const record = this.recordFloor(1, time, deaths, 'C').floors['1'];
    return { bestTimeMs: record?.bestTimeMs ?? null, fewestDeaths: record?.fewestDeaths ?? null };
  }

  private parse(raw: string | null): Record<string, unknown> | null {
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
}

const validate = (raw: Record<string, unknown>): SaveData => {
  const result = defaults();
  result.unlockedFloor = Math.floor(finite(raw.unlockedFloor, 1, TOTAL_FLOORS) ?? 1);
  const sourceSettings =
    raw.settings && typeof raw.settings === 'object'
      ? (raw.settings as Record<string, unknown>)
      : {};
  const fallback = defaultSettings();
  result.settings = {
    volume: finite(sourceSettings.volume, 0, 1) ?? fallback.volume,
    mute: typeof sourceSettings.mute === 'boolean' ? sourceSettings.mute : fallback.mute,
    screenShake:
      typeof sourceSettings.screenShake === 'boolean'
        ? sourceSettings.screenShake
        : fallback.screenShake,
    reducedShake:
      typeof sourceSettings.reducedShake === 'boolean'
        ? sourceSettings.reducedShake
        : fallback.reducedShake,
    reduceFlashes:
      typeof sourceSettings.reduceFlashes === 'boolean'
        ? sourceSettings.reduceFlashes
        : fallback.reduceFlashes,
    highContrast:
      typeof sourceSettings.highContrast === 'boolean'
        ? sourceSettings.highContrast
        : fallback.highContrast,
    fullscreen:
      typeof sourceSettings.fullscreen === 'boolean'
        ? sourceSettings.fullscreen
        : fallback.fullscreen,
  };
  if (raw.floors && typeof raw.floors === 'object') {
    for (const [key, value] of Object.entries(raw.floors as Record<string, unknown>)) {
      if (
        !/^\d+$/.test(key) ||
        Number(key) < 1 ||
        Number(key) > TOTAL_FLOORS ||
        !value ||
        typeof value !== 'object'
      )
        continue;
      const record = value as Record<string, unknown>;
      result.floors[key] = {
        completed: record.completed === true,
        bestTimeMs: finite(record.bestTimeMs, 1),
        fewestDeaths: finite(record.fewestDeaths, 0),
        rank: validRank(record.rank),
      };
    }
  }
  return result;
};

const migrateLegacy = (old: Record<string, unknown> | null): SaveData => {
  const data = defaults();
  if (!old) return data;
  data.settings.volume = finite(old.volume, 0, 1) ?? data.settings.volume;
  data.settings.fullscreen = old.fullscreen === true;
  const time = finite(old.bestTimeMs, 1);
  const deaths = finite(old.fewestDeaths, 0);
  if (time !== null || deaths !== null)
    data.floors['1'] = { completed: true, bestTimeMs: time, fewestDeaths: deaths, rank: null };
  return data;
};

const betterRank = (current: Rank | null, candidate: Rank): Rank => {
  const order: readonly Rank[] = ['S', 'A', 'B', 'C'];
  return current && order.indexOf(current) < order.indexOf(candidate) ? current : candidate;
};
