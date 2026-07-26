import type { PlayerState } from '../types/game';
export type GhostVisualState = PlayerState;
export interface GhostSample {
  timeMs: number;
  x: number;
  y: number;
  facing: -1 | 1;
  state: GhostVisualState;
}
export interface GhostRun {
  version: 1;
  floor: number;
  durationMs: number;
  sampleIntervalMs: number;
  samples: GhostSample[];
}
export const GHOST_INTERVAL_MS = 50;
export const MAX_GHOST_DURATION_MS = 120_000;
export const MAX_GHOST_SAMPLES = 2_401;
export const MAX_GHOST_JSON_BYTES = 180_000;
