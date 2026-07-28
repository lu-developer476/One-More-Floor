import type { LevelDefinition } from '../types/game';
export const formatDelta = (deltaMs: number | null): string => {
  if (deltaMs === null || !Number.isFinite(deltaMs)) return 'SIN REFERENCIA';
  if (Math.abs(deltaMs) < 10) return 'IGUAL';
  return `${deltaMs < 0 ? '−' : '+'}${(Math.abs(deltaMs) / 1000).toFixed(2)} s`;
};
export const calculateBestTheoretical = (
  level: LevelDefinition,
  bestSegments: Readonly<Record<string, number>>,
): number | null => {
  let total = 0;
  for (const split of [...level.splits].sort((a, b) => a.order - b.order)) {
    const value = bestSegments[split.id];
    if (!Number.isFinite(value) || value === undefined || value <= 0) return null;
    total += value;
  }
  return total;
};
