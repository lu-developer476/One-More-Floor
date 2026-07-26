import type { LevelDefinition, Rank } from '../types/game';
export const seconds = (milliseconds: number): string => (milliseconds / 1000).toFixed(2);
export const calculateRank = (level: LevelDefinition, timeMs: number, deaths: number): Rank => {
  for (const candidate of ['S', 'A', 'B'] as const) {
    const threshold = level.ranks[candidate];
    if (timeMs <= threshold.maxTimeMs && deaths <= threshold.maxDeaths) return candidate;
  }
  return 'C';
};
export const nextRankGap = (
  level: LevelDefinition,
  rank: Rank,
  timeMs: number,
  deaths: number,
): string => {
  if (rank === 'S') return 'MEJOR RANGO CONSEGUIDO';
  const target = rank === 'A' ? level.ranks.S : rank === 'B' ? level.ranks.A : level.ranks.B;
  const timeGap = Math.max(0, timeMs - target.maxTimeMs);
  const deathGap = Math.max(0, deaths - target.maxDeaths);
  const parts = [
    timeGap > 0 ? `${seconds(timeGap)} s` : '',
    deathGap > 0 ? `${deathGap} muerte${deathGap === 1 ? '' : 's'}` : '',
  ].filter(Boolean);
  return `PRÓXIMO RANGO: MEJORÁ ${parts.join(' Y ')}`;
};
