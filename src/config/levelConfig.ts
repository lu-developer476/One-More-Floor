import type { LevelDefinition } from '../types/game';
export const LEVEL_DURATION_MS = 45_000;
export const LEVELS: readonly LevelDefinition[] = [
  { id: 'floor-01', floor: 1, width: 3000, height: 720, spawn: { x: 100, y: 565 } },
];
