import { PlayerState } from '../types/game';
import { MAX_GHOST_DURATION_MS, MAX_GHOST_JSON_BYTES, MAX_GHOST_SAMPLES, type GhostRun, type GhostVisualState } from './GhostTypes';
const states = new Set<GhostVisualState>([PlayerState.IDLE, PlayerState.RUNNING, PlayerState.JUMPING, PlayerState.FALLING, PlayerState.WALL_SLIDING, PlayerState.DASHING, PlayerState.LANDING]);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
export function validateGhostRun(value: unknown, expectedFloor?: number): GhostRun | null {
  if (!value || typeof value !== 'object') return null;
  const run = value as Partial<GhostRun>;
  if (run.version !== 1 || !Number.isInteger(run.floor) || run.floor! < 1 || run.floor! > 5 || (expectedFloor !== undefined && run.floor !== expectedFloor)) return null;
  if (!finite(run.durationMs) || run.durationMs <= 0 || run.durationMs > MAX_GHOST_DURATION_MS || !finite(run.sampleIntervalMs) || run.sampleIntervalMs < 20 || run.sampleIntervalMs > 250 || !Array.isArray(run.samples) || run.samples.length < 2 || run.samples.length > MAX_GHOST_SAMPLES) return null;
  let previous = -1;
  for (const sample of run.samples) {
    if (!sample || !finite(sample.timeMs) || !finite(sample.x) || !finite(sample.y) || sample.timeMs < 0 || sample.timeMs > run.durationMs || sample.timeMs <= previous || Math.abs(sample.x) > 20_000 || Math.abs(sample.y) > 20_000 || (sample.facing !== -1 && sample.facing !== 1) || !states.has(sample.state)) return null;
    previous = sample.timeMs;
  }
  try { if (JSON.stringify(run).length > MAX_GHOST_JSON_BYTES) return null; } catch { return null; }
  return run as GhostRun;
}
