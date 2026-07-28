import { LEVELS } from '../config/levelConfig';
import type { Rank, RunMode } from '../types/game';
export type TowerRunStatus = 'active' | 'between-floors' | 'completed' | 'abandoned';
export interface TowerFloorResult {
  floor: number;
  elapsedMs: number;
  deaths: number;
  rank: Rank;
  cumulativeTowerMs: number;
}
export interface TowerCheckpoint {
  schemaVersion: 1;
  mode: Exclude<RunMode, 'practice'>;
  status: TowerRunStatus;
  nextFloor: number;
  totalElapsedMs: number;
  totalDeaths: number;
  results: TowerFloorResult[];
  /** Compatibility field. restore() always derives this value from mode. */
  eligible: boolean;
  sessionId: string;
}
const rank = (v: unknown): v is Rank => v === 'S' || v === 'A' || v === 'B' || v === 'C';
const integer = (v: unknown, min = 0): v is number =>
  Number.isSafeInteger(v) && (v as number) >= min;
export class TowerRunSession {
  private constructor(private data: TowerCheckpoint) {}
  static start(
    mode: Exclude<RunMode, 'practice'>,
    sessionId = `tower-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`,
  ): TowerRunSession {
    if (!/^[a-z0-9-]{8,100}$/.test(sessionId)) throw new Error('Invalid session id');
    return new TowerRunSession({
      schemaVersion: 1,
      mode,
      status: 'active',
      nextFloor: 1,
      totalElapsedMs: 0,
      totalDeaths: 0,
      results: [],
      eligible: mode === 'competitive',
      sessionId,
    });
  }
  static restore(raw: unknown): TowerRunSession | null {
    if (!raw || typeof raw !== 'object') return null;
    const d = raw as Partial<TowerCheckpoint>;
    if (
      d.schemaVersion !== 1 ||
      (d.mode !== 'competitive' && d.mode !== 'assisted') ||
      !['active', 'between-floors', 'completed', 'abandoned'].includes(String(d.status)) ||
      !integer(d.nextFloor, 1) ||
      d.nextFloor > LEVELS.length ||
      !integer(d.totalElapsedMs) ||
      !integer(d.totalDeaths) ||
      typeof d.sessionId !== 'string' ||
      !/^[a-z0-9-]{8,100}$/.test(d.sessionId) ||
      !Array.isArray(d.results) ||
      d.results.length > LEVELS.length
    )
      return null;
    let time = 0,
      deaths = 0;
    const results: TowerFloorResult[] = [];
    for (let i = 0; i < d.results.length; i += 1) {
      const item = d.results[i] as Partial<TowerFloorResult>;
      if (
        item.floor !== i + 1 ||
        !integer(item.elapsedMs, 1) ||
        !integer(item.deaths) ||
        !rank(item.rank) ||
        !integer(item.cumulativeTowerMs)
      )
        return null;
      time += item.elapsedMs;
      deaths += item.deaths;
      if (item.cumulativeTowerMs !== time) return null;
      results.push({
        floor: item.floor,
        elapsedMs: item.elapsedMs,
        deaths: item.deaths,
        rank: item.rank,
        cumulativeTowerMs: item.cumulativeTowerMs,
      });
    }
    if (
      time !== d.totalElapsedMs ||
      deaths !== d.totalDeaths ||
      (d.status !== 'completed' && d.nextFloor !== results.length + 1) ||
      (d.status === 'completed' &&
        (results.length !== LEVELS.length || d.nextFloor !== LEVELS.length)) ||
      (d.status === 'active' && results.length >= LEVELS.length) ||
      (d.status === 'between-floors' &&
        (results.length === 0 || results.length >= LEVELS.length)) ||
      (d.status === 'abandoned' && results.length >= LEVELS.length)
    )
      return null;
    return new TowerRunSession({
      ...(d as TowerCheckpoint),
      eligible: d.mode === 'competitive',
      results,
    });
  }
  get state(): Readonly<TowerCheckpoint> {
    return this.serialize();
  }
  completeFloor(
    floor: number,
    elapsedMs: number,
    deaths: number,
    floorRank: Rank,
  ): TowerFloorResult {
    if (this.data.status !== 'active') throw new Error('Tower is not active');
    if (floor !== this.data.nextFloor) throw new Error('Floor out of order');
    if (!integer(elapsedMs, 1) || !integer(deaths)) throw new Error('Invalid result');
    this.data.totalElapsedMs += elapsedMs;
    this.data.totalDeaths += deaths;
    const result = Object.freeze({
      floor,
      elapsedMs,
      deaths,
      rank: floorRank,
      cumulativeTowerMs: this.data.totalElapsedMs,
    });
    this.data.results.push(result);
    if (floor === LEVELS.length) this.data.status = 'completed';
    else {
      this.data.nextFloor = floor + 1;
      this.data.status = 'between-floors';
    }
    return result;
  }
  advance(): void {
    if (this.data.status !== 'between-floors') throw new Error('Cannot advance');
    this.data.status = 'active';
  }
  abandon(): void {
    if (this.data.status === 'completed' || this.data.status === 'abandoned')
      throw new Error('Cannot abandon');
    this.data.status = 'abandoned';
  }
  serialize(): TowerCheckpoint {
    return { ...this.data, results: this.data.results.map((item) => ({ ...item })) };
  }
}
