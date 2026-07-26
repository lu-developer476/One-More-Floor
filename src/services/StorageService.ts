import type { Rank } from '../types/game';
import { TOTAL_FLOORS } from '../config/levelConfig';
import type { GhostRun } from '../runs/GhostTypes';
import { validateGhostRun } from '../runs/GhostValidator';
export interface FloorRecord { completed: boolean; bestTimeMs: number | null; fewestDeaths: number | null; rank: Rank | null; bestGhost: GhostRun | null }
export interface Settings { volume: number; mute: boolean; screenShake: boolean; reducedShake: boolean; reduceFlashes: boolean; highContrast: boolean; fullscreen: boolean; showGhost: boolean }
export interface SaveData { version: 4; unlockedFloor: number; floors: Record<string, FloorRecord>; settings: Settings }
type Store = Pick<Storage, 'getItem' | 'setItem'>;
const KEY = 'one-more-floor.save.v4';
const OLD_KEYS = ['one-more-floor.save.v3', 'one-more-floor.save.v2'];
const LEGACY_KEY = 'one-more-floor.save.v1';
const defaultSettings = (): Settings => ({ volume: .7, mute: false, screenShake: true, reducedShake: false, reduceFlashes: false, highContrast: false, fullscreen: false, showGhost: true });
const defaults = (): SaveData => ({ version: 4, unlockedFloor: 1, floors: {}, settings: defaultSettings() });
const finite = (value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): number | null => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : null;
const validRank = (value: unknown): Rank | null => value === 'S' || value === 'A' || value === 'B' || value === 'C' ? value : null;
export class StorageService {
  constructor(private readonly storage: Store | null = typeof localStorage === 'undefined' ? null : localStorage) {}
  load(): SaveData {
    if (!this.storage) return defaults();
    const current = this.parse(this.storage.getItem(KEY)); if (current) return validate(current);
    for (const key of OLD_KEYS) { const old = this.parse(this.storage.getItem(key)); if (old) { const migrated = validate(old); this.save(migrated); return migrated; } }
    const legacy = migrateLegacy(this.parse(this.storage.getItem(LEGACY_KEY))); this.save(legacy); return legacy;
  }
  save(data: SaveData): void { try { this.storage?.setItem(KEY, JSON.stringify(validate(data as unknown as Record<string, unknown>))); } catch { /* quota/private mode */ } }
  recordFloor(floor: number, time: number, deaths: number, rank: Rank, ghost?: GhostRun): SaveData {
    const data = this.load(); const key = String(Math.floor(floor));
    if (floor < 1 || floor > TOTAL_FLOORS) return data;
    const safeTime = finite(time, 1); const safeDeaths = finite(deaths, 0); if (safeTime === null || safeDeaths === null) return data;
    const old = data.floors[key]; const isBest = old?.bestTimeMs == null || safeTime < old.bestTimeMs;
    const validGhost = ghost && isBest ? validateGhostRun(ghost, floor) : null;
    data.floors[key] = { completed: true, bestTimeMs: isBest ? safeTime : old!.bestTimeMs, fewestDeaths: old?.fewestDeaths == null ? safeDeaths : Math.min(old.fewestDeaths, safeDeaths), rank: betterRank(old?.rank ?? null, rank), bestGhost: validGhost ?? old?.bestGhost ?? null };
    data.unlockedFloor = Math.min(TOTAL_FLOORS, Math.max(data.unlockedFloor, floor + 1)); this.save(data); return data;
  }
  clearGhosts(): SaveData { const data = this.load(); for (const record of Object.values(data.floors)) record.bestGhost = null; this.save(data); return data; }
  clearRecords(): SaveData { const data = this.load(); for (const record of Object.values(data.floors)) { record.bestTimeMs = null; record.fewestDeaths = null; record.rank = null; record.bestGhost = null; } this.save(data); return data; }
  resetProgress(): SaveData { const data = defaults(); this.save(data); return data; }
  recordResult(time: number, deaths: number) { const record = this.recordFloor(1, time, deaths, 'C').floors['1']; return { bestTimeMs: record?.bestTimeMs ?? null, fewestDeaths: record?.fewestDeaths ?? null }; }
  private parse(raw: string | null): Record<string, unknown> | null { if (!raw) return null; try { const value: unknown = JSON.parse(raw); return value && typeof value === 'object' ? value as Record<string, unknown> : null; } catch { return null; } }
}
export const validate = (raw: Record<string, unknown>): SaveData => {
  const result = defaults(); result.unlockedFloor = Math.floor(finite(raw.unlockedFloor, 1, TOTAL_FLOORS) ?? 1);
  const source = raw.settings && typeof raw.settings === 'object' ? raw.settings as Record<string, unknown> : {}; const fallback = defaultSettings();
  result.settings = { volume: finite(source.volume, 0, 1) ?? fallback.volume, mute: typeof source.mute === 'boolean' ? source.mute : fallback.mute, screenShake: typeof source.screenShake === 'boolean' ? source.screenShake : fallback.screenShake, reducedShake: typeof source.reducedShake === 'boolean' ? source.reducedShake : fallback.reducedShake, reduceFlashes: typeof source.reduceFlashes === 'boolean' ? source.reduceFlashes : fallback.reduceFlashes, highContrast: typeof source.highContrast === 'boolean' ? source.highContrast : fallback.highContrast, fullscreen: typeof source.fullscreen === 'boolean' ? source.fullscreen : fallback.fullscreen, showGhost: typeof source.showGhost === 'boolean' ? source.showGhost : true };
  if (raw.floors && typeof raw.floors === 'object') for (const [key, value] of Object.entries(raw.floors as Record<string, unknown>)) { const floor = Number(key); if (!Number.isInteger(floor) || floor < 1 || floor > TOTAL_FLOORS || !value || typeof value !== 'object') continue; const record = value as Record<string, unknown>; result.floors[key] = { completed: record.completed === true, bestTimeMs: finite(record.bestTimeMs, 1), fewestDeaths: finite(record.fewestDeaths, 0), rank: validRank(record.rank), bestGhost: validateGhostRun(record.bestGhost, floor) }; }
  return result;
};
const migrateLegacy = (old: Record<string, unknown> | null): SaveData => { const data = defaults(); if (!old) return data; data.settings.volume = finite(old.volume, 0, 1) ?? data.settings.volume; data.settings.fullscreen = old.fullscreen === true; const time = finite(old.bestTimeMs, 1); const deaths = finite(old.fewestDeaths, 0); if (time !== null || deaths !== null) data.floors['1'] = { completed: true, bestTimeMs: time, fewestDeaths: deaths, rank: null, bestGhost: null }; return data; };
const betterRank = (current: Rank | null, candidate: Rank): Rank => { const order: readonly Rank[] = ['S','A','B','C']; return current && order.indexOf(current) < order.indexOf(candidate) ? current : candidate; };
