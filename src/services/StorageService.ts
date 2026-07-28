import type { Rank } from '../types/game';
import { TOTAL_FLOORS } from '../config/levelConfig';
import type { GhostRun } from '../runs/GhostTypes';
import { validateGhostRun } from '../runs/GhostValidator';
import { defaultInputSettings, type InputSettings } from '../input/InputBindings';
import { validateInputSettings } from '../input/InputValidation';
import { LEVELS } from '../config/levelConfig';
import { calculateBestTheoretical } from '../systems/SplitComparisons';
export interface FloorRecord {
  completed: boolean;
  bestTimeMs: number | null;
  fewestDeaths: number | null;
  rank: Rank | null;
  bestGhost: GhostRun | null;
  bestRunSplits: Record<string, number>;
  bestSegments: Record<string, number>;
}
export interface TowerRecord {
  completed: boolean;
  bestTimeMs: number | null;
  fewestDeaths: number | null;
  bestRank: Rank | null;
  bestRunFloorTimes: Record<string, number>;
  bestRunCumulativeTimes: Record<string, number>;
  bestRunDeaths: number | null;
  bestRunRank: Rank | null;
  bestIndividualFloorTimes: Record<string, number>;
}
export interface Settings {
  volume: number;
  mute: boolean;
  screenShake: boolean;
  reducedShake: boolean;
  reduceFlashes: boolean;
  highContrast: boolean;
  fullscreen: boolean;
  showGhost: boolean;
  localAnalyticsEnabled: boolean;
  particleIntensity: 'normal' | 'reduced' | 'off';
}
export interface SaveData {
  version: 9;
  unlockedFloor: number;
  floors: Record<string, FloorRecord>;
  settings: Settings;
  input: InputSettings;
  tower: TowerRecord;
}
export interface RecordFloorResult {
  save: SaveData;
  newBestTime: boolean;
  ghostSaved: boolean;
  rankImproved: boolean;
}
export interface CompletionPolicy {
  progress: boolean;
  bestTime: boolean;
  rank: boolean;
  ghost: boolean;
}
export interface CompletionOutcome extends RecordFloorResult {
  progressSaved: boolean;
  floorUnlocked: boolean;
  improvedSegments: readonly string[];
  bestTheoreticalMs: number | null;
}
export interface TowerCompletionOutcome {
  save: SaveData;
  persisted: boolean;
  eligible: boolean;
  newBestTime: boolean;
  deathsImproved: boolean;
  rankImproved: boolean;
  previousBestTimeMs: number | null;
  currentBestTimeMs: number | null;
  bestRunReplaced: boolean;
  improvedIndividualFloors: readonly number[];
}
type Store = Pick<Storage, 'getItem' | 'setItem'>;
export const SAVE_KEY = 'one-more-floor.save.v9';
const KEY = SAVE_KEY;
const OLD_KEYS = [
  'one-more-floor.save.v8',
  'one-more-floor.save.v7',
  'one-more-floor.save.v6',
  'one-more-floor.save.v5',
  'one-more-floor.save.v4',
  'one-more-floor.save.v3',
  'one-more-floor.save.v2',
];
const LEGACY_KEY = 'one-more-floor.save.v1';
const defaultSettings = (): Settings => ({
  volume: 0.7,
  mute: false,
  screenShake: true,
  reducedShake: false,
  reduceFlashes: false,
  highContrast: false,
  fullscreen: false,
  showGhost: true,
  localAnalyticsEnabled: true,
  particleIntensity: 'normal',
});
const defaults = (): SaveData => ({
  version: 9,
  unlockedFloor: 1,
  floors: {},
  settings: defaultSettings(),
  input: defaultInputSettings(),
  tower: defaultTower(),
});
export const defaultTower = (): TowerRecord => ({
  completed: false,
  bestTimeMs: null,
  fewestDeaths: null,
  bestRank: null,
  bestRunFloorTimes: {},
  bestRunCumulativeTimes: {},
  bestRunDeaths: null,
  bestRunRank: null,
  bestIndividualFloorTimes: {},
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
    for (const key of OLD_KEYS) {
      const old = this.parse(this.storage.getItem(key));
      if (old) {
        const migrated = validate(old);
        this.save(migrated);
        return migrated;
      }
    }
    const legacy = migrateLegacy(this.parse(this.storage.getItem(LEGACY_KEY)));
    this.save(legacy);
    return legacy;
  }
  save(data: SaveData): boolean {
    try {
      this.storage?.setItem(
        KEY,
        JSON.stringify(validate(data as unknown as Record<string, unknown>)),
      );
      return Boolean(this.storage);
    } catch {
      return false;
    }
  }
  recordFloor(
    floor: number,
    time: number,
    deaths: number,
    rank: Rank,
    ghost?: GhostRun,
  ): RecordFloorResult {
    return this.completeFloor(
      floor,
      time,
      deaths,
      rank,
      {},
      {},
      { progress: true, bestTime: true, rank: true, ghost: true },
      ghost,
    );
  }
  completeFloor(
    floor: number,
    time: number,
    deaths: number,
    rank: Rank,
    splits: Readonly<Record<string, number>>,
    segments: Readonly<Record<string, number>>,
    policy: CompletionPolicy,
    ghost?: GhostRun,
  ): CompletionOutcome {
    const data = this.load();
    const key = String(Math.floor(floor));
    const unchanged: CompletionOutcome = {
      save: data,
      progressSaved: false,
      floorUnlocked: false,
      newBestTime: false,
      ghostSaved: false,
      rankImproved: false,
      improvedSegments: [],
      bestTheoreticalMs: null,
    };
    if (floor < 1 || floor > TOTAL_FLOORS) return unchanged;
    const safeTime = finite(time, 1);
    const safeDeaths = finite(deaths, 0);
    if (safeTime === null || safeDeaths === null) return unchanged;
    const old = data.floors[key];
    const newBestTime = policy.bestTime && (old?.bestTimeMs == null || safeTime < old.bestTimeMs);
    const nextRank = policy.rank ? betterRank(old?.rank ?? null, rank) : (old?.rank ?? null);
    const rankImproved = policy.rank && old?.rank !== nextRank;
    const validGhost = ghost && policy.ghost && newBestTime ? validateGhostRun(ghost, floor) : null;
    const ghostSaved = validGhost !== null;
    const bestSegments = { ...(old?.bestSegments ?? {}) };
    const improvedSegments: string[] = [];
    if (policy.bestTime)
      for (const [id, value] of Object.entries(segments))
        if (
          finite(value, 1) !== null &&
          (bestSegments[id] === undefined || value < bestSegments[id])
        ) {
          bestSegments[id] = value;
          improvedSegments.push(id);
        }
    data.floors[key] = {
      completed: policy.progress || old?.completed === true,
      bestTimeMs: newBestTime ? safeTime : (old?.bestTimeMs ?? null),
      fewestDeaths: policy.rank
        ? old?.fewestDeaths == null
          ? safeDeaths
          : Math.min(old.fewestDeaths, safeDeaths)
        : (old?.fewestDeaths ?? null),
      rank: nextRank,
      bestGhost: validGhost ?? old?.bestGhost ?? null,
      bestRunSplits: newBestTime ? { ...splits } : (old?.bestRunSplits ?? {}),
      bestSegments,
    };
    const previousUnlocked = data.unlockedFloor;
    if (policy.progress)
      data.unlockedFloor = Math.min(TOTAL_FLOORS, Math.max(data.unlockedFloor, floor + 1));
    this.save(data);
    const level = LEVELS[floor - 1];
    return {
      save: data,
      progressSaved: policy.progress,
      floorUnlocked: data.unlockedFloor > previousUnlocked,
      newBestTime,
      ghostSaved,
      rankImproved,
      improvedSegments,
      bestTheoreticalMs: level ? calculateBestTheoretical(level, bestSegments) : null,
    };
  }
  clearGhosts(): SaveData {
    const data = this.load();
    for (const record of Object.values(data.floors)) record.bestGhost = null;
    this.save(data);
    return data;
  }
  clearRecords(): SaveData {
    const data = this.load();
    for (const record of Object.values(data.floors)) {
      record.bestTimeMs = null;
      record.fewestDeaths = null;
      record.rank = null;
      record.bestGhost = null;
      record.bestRunSplits = {};
      record.bestSegments = {};
    }
    this.save(data);
    return data;
  }
  resetProgress(): SaveData {
    const data = defaults();
    this.save(data);
    return data;
  }
  resetControls(): SaveData {
    const data = this.load();
    data.input = defaultInputSettings();
    this.save(data);
    return data;
  }
  exportBackup(): string {
    return JSON.stringify({ format: 'one-more-floor-backup', schema: 9, save: this.load() });
  }
  importBackup(text: string): { ok: boolean; error?: string } {
    try {
      const raw: unknown = JSON.parse(text);
      if (!raw || typeof raw !== 'object' || Array.isArray(raw))
        return { ok: false, error: 'FORMATO INVÁLIDO' };
      const envelope = raw as Record<string, unknown>;
      if (
        envelope.format !== 'one-more-floor-backup' ||
        envelope.schema !== 9 ||
        !envelope.save ||
        typeof envelope.save !== 'object' ||
        Array.isArray(envelope.save)
      )
        return { ok: false, error: 'VERSIÓN INCOMPATIBLE' };
      if (containsUnsafeKey(envelope.save)) return { ok: false, error: 'CONTENIDO NO SEGURO' };
      return this.save(validate(envelope.save as Record<string, unknown>))
        ? { ok: true }
        : { ok: false, error: 'NO SE PUDO GUARDAR' };
    } catch {
      return { ok: false, error: 'JSON INVÁLIDO' };
    }
  }
  recordResult(time: number, deaths: number) {
    const record = this.recordFloor(1, time, deaths, 'C').save.floors['1'];
    return { bestTimeMs: record?.bestTimeMs ?? null, fewestDeaths: record?.fewestDeaths ?? null };
  }
  recordTower(
    time: number,
    deaths: number,
    rank: Rank,
    results: readonly { floor: number; elapsedMs: number; cumulativeTowerMs: number }[],
    eligible = true,
  ): TowerCompletionOutcome {
    const data = this.load();
    const invalid =
      results.length !== TOTAL_FLOORS || finite(time, 1) === null || finite(deaths, 0) === null;
    const base = (persisted = false): TowerCompletionOutcome => ({
      save: data,
      persisted,
      eligible,
      newBestTime: false,
      deathsImproved: false,
      rankImproved: false,
      previousBestTimeMs: data.tower.bestTimeMs,
      currentBestTimeMs: data.tower.bestTimeMs,
      bestRunReplaced: false,
      improvedIndividualFloors: [],
    });
    if (invalid || !eligible) return base();
    const old = data.tower;
    const newBestTime = old.bestTimeMs === null || time < old.bestTimeMs;
    const bestIndividualFloorTimes = { ...old.bestIndividualFloorTimes };
    const floorTimes: Record<string, number> = {};
    const cumulativeTimes: Record<string, number> = {};
    const improvedIndividualFloors: number[] = [];
    let cumulative = 0;
    for (const result of results) {
      const key = String(result.floor);
      if (
        result.floor < 1 ||
        result.floor > TOTAL_FLOORS ||
        finite(result.elapsedMs, 1) === null ||
        finite(result.cumulativeTowerMs, 1) === null
      )
        return base();
      cumulative += result.elapsedMs;
      if (
        result.floor !== Object.keys(floorTimes).length + 1 ||
        result.cumulativeTowerMs !== cumulative
      )
        return base();
      floorTimes[key] = result.elapsedMs;
      cumulativeTimes[key] = result.cumulativeTowerMs;
      if (
        bestIndividualFloorTimes[key] === undefined ||
        result.elapsedMs < bestIndividualFloorTimes[key]
      ) {
        bestIndividualFloorTimes[key] = result.elapsedMs;
        improvedIndividualFloors.push(result.floor);
      }
    }
    if (cumulative !== time) return base();
    const deathsImproved = old.fewestDeaths === null || deaths < old.fewestDeaths;
    const nextRank = betterRank(old.bestRank, rank);
    const rankImproved = nextRank !== old.bestRank;
    data.tower = {
      completed: true,
      bestTimeMs: newBestTime ? time : old.bestTimeMs,
      fewestDeaths: old.fewestDeaths === null ? deaths : Math.min(old.fewestDeaths, deaths),
      bestRank: nextRank,
      bestRunFloorTimes: newBestTime ? floorTimes : old.bestRunFloorTimes,
      bestRunCumulativeTimes: newBestTime ? cumulativeTimes : old.bestRunCumulativeTimes,
      bestRunDeaths: newBestTime ? deaths : old.bestRunDeaths,
      bestRunRank: newBestTime ? rank : old.bestRunRank,
      bestIndividualFloorTimes,
    };
    const persisted = this.save(data);
    return {
      save: data,
      persisted,
      eligible,
      newBestTime,
      deathsImproved,
      rankImproved,
      previousBestTimeMs: old.bestTimeMs,
      currentBestTimeMs: data.tower.bestTimeMs,
      bestRunReplaced: newBestTime,
      improvedIndividualFloors,
    };
  }
  private parse(raw: string | null): Record<string, unknown> | null {
    if (!raw) return null;
    try {
      const value: unknown = JSON.parse(raw);
      return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
}
export const validate = (raw: Record<string, unknown>): SaveData => {
  const result = defaults();
  result.input = validateInputSettings(raw.input);
  result.unlockedFloor = Math.floor(finite(raw.unlockedFloor, 1, TOTAL_FLOORS) ?? 1);
  result.tower = validateTower(raw.tower);
  const source =
    raw.settings && typeof raw.settings === 'object'
      ? (raw.settings as Record<string, unknown>)
      : {};
  const fallback = defaultSettings();
  result.settings = {
    volume: finite(source.volume, 0, 1) ?? fallback.volume,
    mute: typeof source.mute === 'boolean' ? source.mute : fallback.mute,
    screenShake:
      typeof source.screenShake === 'boolean' ? source.screenShake : fallback.screenShake,
    reducedShake:
      typeof source.reducedShake === 'boolean' ? source.reducedShake : fallback.reducedShake,
    reduceFlashes:
      typeof source.reduceFlashes === 'boolean' ? source.reduceFlashes : fallback.reduceFlashes,
    highContrast:
      typeof source.highContrast === 'boolean' ? source.highContrast : fallback.highContrast,
    fullscreen: typeof source.fullscreen === 'boolean' ? source.fullscreen : fallback.fullscreen,
    showGhost: typeof source.showGhost === 'boolean' ? source.showGhost : true,
    localAnalyticsEnabled:
      typeof source.localAnalyticsEnabled === 'boolean' ? source.localAnalyticsEnabled : true,
    particleIntensity:
      source.particleIntensity === 'reduced' || source.particleIntensity === 'off'
        ? source.particleIntensity
        : 'normal',
  };
  if (raw.floors && typeof raw.floors === 'object')
    for (const [key, value] of Object.entries(raw.floors as Record<string, unknown>)) {
      const floor = Number(key);
      if (
        !Number.isInteger(floor) ||
        floor < 1 ||
        floor > TOTAL_FLOORS ||
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
        bestGhost: validateGhostRun(record.bestGhost, floor),
        bestRunSplits: validTimes(record.bestRunSplits),
        bestSegments: validTimes(record.bestSegments),
      };
    }
  return result;
};
const containsUnsafeKey = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  for (const [key, child] of Object.entries(value as Record<string, unknown>))
    if (
      key === '__proto__' ||
      key === 'prototype' ||
      key === 'constructor' ||
      containsUnsafeKey(child)
    )
      return true;
  return false;
};
export const validateTower = (raw: unknown): TowerRecord => {
  if (!raw || typeof raw !== 'object') return defaultTower();
  const value = raw as Record<string, unknown>;
  const times = (candidate: unknown): Record<string, number> => {
    const output: Record<string, number> = {};
    if (!candidate || typeof candidate !== 'object') return output;
    for (const [key, item] of Object.entries(candidate as Record<string, unknown>))
      if (Number(key) >= 1 && Number(key) <= TOTAL_FLOORS && finite(item, 1) !== null)
        output[key] = item as number;
    return output;
  };
  const legacyIndividual = times(value.bestFloorTimes);
  return {
    completed: value.completed === true,
    bestTimeMs: finite(value.bestTimeMs, 1),
    fewestDeaths: finite(value.fewestDeaths, 0),
    bestRank: validRank(value.bestRank) ?? validRank(value.rank),
    bestRunFloorTimes: times(value.bestRunFloorTimes),
    bestRunCumulativeTimes: times(value.bestRunCumulativeTimes),
    bestRunDeaths: finite(value.bestRunDeaths, 0),
    bestRunRank: validRank(value.bestRunRank),
    bestIndividualFloorTimes: Object.keys(times(value.bestIndividualFloorTimes)).length
      ? times(value.bestIndividualFloorTimes)
      : legacyIndividual,
  };
};
const migrateLegacy = (old: Record<string, unknown> | null): SaveData => {
  const data = defaults();
  if (!old) return data;
  data.settings.volume = finite(old.volume, 0, 1) ?? data.settings.volume;
  data.settings.fullscreen = old.fullscreen === true;
  const time = finite(old.bestTimeMs, 1);
  const deaths = finite(old.fewestDeaths, 0);
  if (time !== null || deaths !== null)
    data.floors['1'] = {
      completed: true,
      bestTimeMs: time,
      fewestDeaths: deaths,
      rank: null,
      bestGhost: null,
      bestRunSplits: {},
      bestSegments: {},
    };
  return data;
};
const validTimes = (raw: unknown): Record<string, number> => {
  const result: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return result;
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const safe = finite(value, 1);
    if (/^[a-z0-9-]{1,80}$/.test(id) && safe !== null) result[id] = safe;
  }
  return result;
};
const betterRank = (current: Rank | null, candidate: Rank): Rank => {
  const order: readonly Rank[] = ['S', 'A', 'B', 'C'];
  return current && order.indexOf(current) < order.indexOf(candidate) ? current : candidate;
};
