import type { DeathCause, RunContext } from '../runs/AttemptSession';

const KEY = 'one-more-floor.analytics.v1';
const MAX_SAMPLES = 100;
const MAX_SEGMENTS = 32;
const MAX_SOURCES = 64;
const CAUSES: readonly DeathCause[] = ['spikes', 'laser', 'electricity', 'fall', 'collapse', 'crush', 'unknown'];
export interface Aggregate {
  count: number;
  sum: number;
  min: number | null;
  max: number | null;
  mean: number;
  m2: number;
}
export interface FloorAnalytics {
  attempts: number;
  competitive: number;
  practice: number;
  assisted: number;
  completions: number;
  restarts: number;
  abandons: number;
  deaths: number;
  deathCauses: Partial<Record<DeathCause, number>>;
  deathSources: Record<string, number>;
  completionTimes: number[];
  segmentTimes: Record<string, number[]>;
  anchors: Record<string, number>;
}
export interface AnalyticsData {
  version: 1;
  floors: Record<string, FloorAnalytics>;
}
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const empty = (): AnalyticsData => ({ version: 1, floors: {} });
const floorDefault = (): FloorAnalytics => ({
  attempts: 0,
  competitive: 0,
  practice: 0,
  assisted: 0,
  completions: 0,
  restarts: 0,
  abandons: 0,
  deaths: 0,
  deathCauses: {},
  deathSources: {},
  completionTimes: [],
  segmentTimes: {},
  anchors: {},
});
const id = (value: string): boolean => /^[a-z0-9-]{1,80}$/.test(value);

export class LocalAnalyticsService {
  constructor(
    private readonly enabled = true,
    private readonly storage: Store | null = typeof localStorage === 'undefined'
      ? null
      : localStorage,
  ) {}
  load(): AnalyticsData {
    try {
      const parsed: unknown = JSON.parse(this.storage?.getItem(KEY) ?? 'null');
      return validateAnalytics(parsed);
    } catch {
      return empty();
    }
  }
  clear(): void {
    this.storage?.removeItem(KEY);
  }
  start(context: RunContext): void {
    this.mutate(context.levelIndex, (floor) => {
      floor.attempts += 1;
      floor[context.mode] += 1;
      floor.anchors[context.anchorId] = (floor.anchors[context.anchorId] ?? 0) + 1;
    });
  }
  restart(levelIndex: number): void {
    this.mutate(levelIndex, (floor) => {
      floor.restarts += 1;
    });
  }
  abandon(levelIndex: number): void {
    this.mutate(levelIndex, (floor) => {
      floor.abandons += 1;
    });
  }
  death(levelIndex: number, cause: DeathCause, sourceId: string): void {
    this.mutate(levelIndex, (floor) => {
      floor.deaths += 1;
      floor.deathCauses[cause] = (floor.deathCauses[cause] ?? 0) + 1;
      if (id(sourceId)) {
        floor.deathSources[sourceId] = (floor.deathSources[sourceId] ?? 0) + 1;
        const entries = Object.entries(floor.deathSources);
        if (entries.length > 64)
          delete floor.deathSources[entries.sort((a, b) => a[1] - b[1])[0]![0]];
      }
    });
  }
  split(levelIndex: number, splitId: string, timeMs: number): void {
    if (!id(splitId)) return;
    this.mutate(levelIndex, (floor) => {
      const values = floor.segmentTimes[splitId] ?? [];
      push(values, timeMs, 50);
      floor.segmentTimes[splitId] = values;
    });
  }
  complete(levelIndex: number, timeMs: number): void {
    this.mutate(levelIndex, (floor) => {
      floor.completions += 1;
      push(floor.completionTimes, timeMs, MAX_SAMPLES);
    });
  }
  private mutate(levelIndex: number, change: (floor: FloorAnalytics) => void): void {
    if (!this.enabled || !Number.isInteger(levelIndex) || levelIndex < 0 || levelIndex > 4) return;
    const data = this.load();
    const key = String(levelIndex + 1);
    const floor = data.floors[key] ?? floorDefault();
    change(floor);
    data.floors[key] = floor;
    try {
      this.storage?.setItem(KEY, JSON.stringify(data));
    } catch {
      /* isolated quota failure */
    }
  }
}
const push = (values: number[], value: number, limit: number): void => {
  if (!Number.isFinite(value) || value < 0) return;
  values.push(Math.round(value));
  if (values.length > limit) values.splice(0, values.length - limit);
};
export const validateAnalytics = (raw: unknown): AnalyticsData => {
  if (!raw || typeof raw !== 'object') return empty();
  const source = raw as { version?: unknown; floors?: unknown };
  if (source.version !== 1 || !source.floors || typeof source.floors !== 'object') return empty();
  const result = empty();
  for (const [key, value] of Object.entries(source.floors as Record<string, unknown>))
    if (/^[1-5]$/.test(key) && value && typeof value === 'object') {
      const candidate = value as Partial<FloorAnalytics>;
      const target = floorDefault();
      for (const name of [
        'attempts',
        'competitive',
        'practice',
        'assisted',
        'completions',
        'restarts',
        'abandons',
        'deaths',
      ] as const)
        target[name] =
          Number.isSafeInteger(candidate[name]) && candidate[name]! >= 0 ? candidate[name]! : 0;
      if (Array.isArray(candidate.completionTimes))
        for (const time of candidate.completionTimes.slice(-MAX_SAMPLES))
          push(target.completionTimes, time, MAX_SAMPLES);
      if (candidate.deathCauses && typeof candidate.deathCauses === 'object')
        for (const [cause, count] of Object.entries(candidate.deathCauses))
          if (CAUSES.includes(cause as DeathCause) && Number.isSafeInteger(count) && (count as number) >= 0)
            target.deathCauses[cause as DeathCause] = count as number;
      if (candidate.deathSources && typeof candidate.deathSources === 'object')
        for (const [sourceId, count] of Object.entries(candidate.deathSources).slice(0, MAX_SOURCES))
          if (id(sourceId) && Number.isSafeInteger(count) && (count as number) >= 0)
            target.deathSources[sourceId] = count as number;
      if (candidate.anchors && typeof candidate.anchors === 'object')
        for (const [anchorId, count] of Object.entries(candidate.anchors).slice(0, MAX_SOURCES))
          if (id(anchorId) && Number.isSafeInteger(count) && (count as number) >= 0)
            target.anchors[anchorId] = count as number;
      if (candidate.segmentTimes && typeof candidate.segmentTimes === 'object')
        for (const [splitId, values] of Object.entries(candidate.segmentTimes).slice(0, MAX_SEGMENTS))
          if (id(splitId) && Array.isArray(values)) {
            const valid: number[] = [];
            for (const time of values.slice(-50)) push(valid, time, 50);
            target.segmentTimes[splitId] = valid;
          }
      result.floors[key] = target;
    }
  return result;
};
