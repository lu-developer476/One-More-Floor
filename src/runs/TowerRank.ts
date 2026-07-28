import { LEVELS } from '../config/levelConfig';
import type { Rank } from '../types/game';
export interface TowerRankThreshold {
  maxTimeMs: number;
  maxDeaths: number;
}
const target = LEVELS.reduce((sum, level) => sum + level.targetTimeMs, 0);
// Multipliers mirror each floor's S/A/B curve; death limits scale with floor count.
export const TOWER_RANK_THRESHOLDS: Readonly<Record<Exclude<Rank, 'C'>, TowerRankThreshold>> =
  Object.freeze({
    S: { maxTimeMs: target, maxDeaths: 0 },
    A: { maxTimeMs: Math.round(target * 1.35), maxDeaths: LEVELS.length * 2 },
    B: { maxTimeMs: Math.round(target * 1.75), maxDeaths: LEVELS.length * 5 },
  });
export const calculateTowerRank = (timeMs: number, deaths: number): Rank => {
  for (const rank of ['S', 'A', 'B'] as const) {
    const threshold = TOWER_RANK_THRESHOLDS[rank];
    if (timeMs <= threshold.maxTimeMs && deaths <= threshold.maxDeaths) return rank;
  }
  return 'C';
};
