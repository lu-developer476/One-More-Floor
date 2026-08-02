import type { DeathCause, RunContext } from '../runs/AttemptSession';
import { LEVELS } from '../config/levelConfig';

const KEY = 'one-more-floor.analytics.v1';
const MAX_SAMPLES = 100;
const MAX_SEGMENTS = 32;
const MAX_SOURCES = 64;
const CAUSES: readonly DeathCause[] = [
  'spikes',
  'laser',
  'electricity',
  'fall',
  'collapse',
  'crush',
  'enemy',
  'unknown',
];
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
  enemiesDisabled: number;
  disabledEnemySources: Record<string, number>;
  deathCauses: Partial<Record<DeathCause, number>>;
  deathSources: Record<string, number>;
  completionTimes: number[];
  segmentTimes: Record<string, number[]>;
  anchors: Record<string, number>;
}
export interface AnalyticsData {
  version: 1;
  floors: Record<string, FloorAnalytics>;
  tower: TowerAnalytics;
}
export interface TowerAnalytics {
  attempts: number;
  competitive: number;
  assisted: number;
  completed: number;
  abandons: number;
  completionTimes: number[];
  totalTimeMs: number;
  totalDeaths: number;
  abandonmentFloors: Record<string, number>;
  deathsByFloor: Record<string, number>;
}
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const towerDefault = (): TowerAnalytics => ({
  attempts: 0,
  competitive: 0,
  assisted: 0,
  completed: 0,
  abandons: 0,
  completionTimes: [],
  totalTimeMs: 0,
  totalDeaths: 0,
  abandonmentFloors: {},
  deathsByFloor: {},
});
const empty = (): AnalyticsData => ({ version: 1, floors: {}, tower: towerDefault() });
const floorDefault = (): FloorAnalytics => ({
  attempts: 0,
  competitive: 0,
  practice: 0,
  assisted: 0,
  completions: 0,
  restarts: 0,
  abandons: 0,
  deaths: 0,
  enemiesDisabled: 0,
  disabledEnemySources: {},
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
  enemyDisabled(levelIndex: number, sourceId: string): void {
    if (!id(sourceId)) return;
    this.mutate(levelIndex, (floor) => {
      floor.enemiesDisabled += 1;
      floor.disabledEnemySources[sourceId] = (floor.disabledEnemySources[sourceId] ?? 0) + 1;
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
  towerStart(mode: 'competitive' | 'assisted'): void {
    this.mutateTower((tower) => {
      tower.attempts += 1;
      tower[mode] += 1;
    });
  }
  towerComplete(
    timeMs: number,
    deaths: number,
    deathsByFloor: Readonly<Record<string, number>>,
  ): void {
    this.mutateTower((tower) => {
      tower.completed += 1;
      tower.totalTimeMs += Math.max(0, Math.round(timeMs));
      tower.totalDeaths += Math.max(0, Math.round(deaths));
      push(tower.completionTimes, timeMs, MAX_SAMPLES);
      for (const [floor, count] of Object.entries(deathsByFloor))
        if (LEVELS[Number(floor) - 1] && Number.isSafeInteger(count) && count >= 0)
          tower.deathsByFloor[floor] = (tower.deathsByFloor[floor] ?? 0) + count;
    });
  }
  towerAbandon(floor: number): void {
    this.mutateTower((tower) => {
      tower.abandons += 1;
      const key = String(floor);
      if (LEVELS[floor - 1]) tower.abandonmentFloors[key] = (tower.abandonmentFloors[key] ?? 0) + 1;
    });
  }
  private mutateTower(change: (tower: TowerAnalytics) => void): void {
    if (!this.enabled) return;
    const data = this.load();
    change(data.tower);
    try {
      this.storage?.setItem(KEY, JSON.stringify(data));
    } catch {
      /* isolated quota failure */
    }
  }
  private mutate(levelIndex: number, change: (floor: FloorAnalytics) => void): void {
    if (
      !this.enabled ||
      !Number.isInteger(levelIndex) ||
      levelIndex < 0 ||
      levelIndex >= LEVELS.length
    )
      return;
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
  const source = raw as { version?: unknown; floors?: unknown; tower?: unknown };
  if (source.version !== 1 || !source.floors || typeof source.floors !== 'object') return empty();
  const result = empty();
  if ('tower' in source && source.tower && typeof source.tower === 'object') {
    const candidate = source.tower as Partial<TowerAnalytics>,
      tower = towerDefault();
    for (const key of [
      'attempts',
      'competitive',
      'assisted',
      'completed',
      'abandons',
      'totalTimeMs',
      'totalDeaths',
    ] as const)
      if (Number.isSafeInteger(candidate[key]) && candidate[key]! >= 0)
        tower[key] = candidate[key]!;
    if (Array.isArray(candidate.completionTimes))
      for (const value of candidate.completionTimes.slice(-MAX_SAMPLES))
        push(tower.completionTimes, value, MAX_SAMPLES);
    for (const field of ['abandonmentFloors', 'deathsByFloor'] as const)
      if (candidate[field] && typeof candidate[field] === 'object')
        for (const [key, value] of Object.entries(candidate[field]!))
          if (LEVELS[Number(key) - 1] && Number.isSafeInteger(value) && (value as number) >= 0)
            tower[field][key] = value as number;
    result.tower = tower;
  }
  for (const [key, value] of Object.entries(source.floors as Record<string, unknown>))
    if (LEVELS[Number(key) - 1] && value && typeof value === 'object') {
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
        'enemiesDisabled',
      ] as const)
        target[name] =
          Number.isSafeInteger(candidate[name]) && candidate[name]! >= 0 ? candidate[name]! : 0;
      if (Array.isArray(candidate.completionTimes))
        for (const time of candidate.completionTimes.slice(-MAX_SAMPLES))
          push(target.completionTimes, time, MAX_SAMPLES);
      if (candidate.deathCauses && typeof candidate.deathCauses === 'object')
        for (const [cause, count] of Object.entries(candidate.deathCauses))
          if (
            CAUSES.includes(cause as DeathCause) &&
            Number.isSafeInteger(count) &&
            (count as number) >= 0
          )
            target.deathCauses[cause as DeathCause] = count as number;
      if (candidate.deathSources && typeof candidate.deathSources === 'object')
        for (const [sourceId, count] of Object.entries(candidate.deathSources).slice(
          0,
          MAX_SOURCES,
        ))
          if (id(sourceId) && Number.isSafeInteger(count) && (count as number) >= 0)
            target.deathSources[sourceId] = count as number;
      if (candidate.disabledEnemySources && typeof candidate.disabledEnemySources === 'object')
        for (const [sourceId, count] of Object.entries(candidate.disabledEnemySources).slice(0, MAX_SOURCES))
          if (id(sourceId) && Number.isSafeInteger(count) && (count as number) >= 0)
            target.disabledEnemySources[sourceId] = count as number;
      if (candidate.anchors && typeof candidate.anchors === 'object')
        for (const [anchorId, count] of Object.entries(candidate.anchors).slice(0, MAX_SOURCES))
          if (id(anchorId) && Number.isSafeInteger(count) && (count as number) >= 0)
            target.anchors[anchorId] = count as number;
      if (candidate.segmentTimes && typeof candidate.segmentTimes === 'object')
        for (const [splitId, values] of Object.entries(candidate.segmentTimes).slice(
          0,
          MAX_SEGMENTS,
        ))
          if (id(splitId) && Array.isArray(values)) {
            const valid: number[] = [];
            for (const time of values.slice(-50)) push(valid, time, 50);
            target.segmentTimes[splitId] = valid;
          }
      result.floors[key] = target;
    }
  return result;
};
