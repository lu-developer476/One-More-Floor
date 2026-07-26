import { PlayerState } from '../types/game';
import {
  GHOST_INTERVAL_MS,
  MAX_GHOST_DURATION_MS,
  MAX_GHOST_SAMPLES,
  type GhostRun,
  type GhostVisualState,
} from './GhostTypes';
export interface RunPose {
  x: number;
  y: number;
  facing: -1 | 1;
  state: GhostVisualState;
}
export class RunRecorder {
  private elapsedMs = 0;
  private nextSampleMs = 0;
  private samples: GhostRun['samples'] = [];
  private previousPose?: RunPose;
  private previousElapsedMs = 0;
  constructor(
    private readonly floor: number,
    private readonly intervalMs = GHOST_INTERVAL_MS,
    private readonly maxSamples = MAX_GHOST_SAMPLES,
  ) {}
  update(deltaMs: number, pose: RunPose): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0 || this.samples.length >= this.maxSamples) return;
    this.previousElapsedMs = this.elapsedMs;
    this.elapsedMs = Math.min(
      MAX_GHOST_DURATION_MS,
      this.elapsedMs + Math.min(deltaMs, MAX_GHOST_DURATION_MS),
    );
    const from = this.previousPose ?? pose;
    while (this.nextSampleMs <= this.elapsedMs && this.samples.length < this.maxSamples) {
      const span = this.elapsedMs - this.previousElapsedMs;
      const ratio =
        span > 0
          ? Math.max(0, Math.min(1, (this.nextSampleMs - this.previousElapsedMs) / span))
          : 1;
      const x = from.x + (pose.x - from.x) * ratio;
      const y = from.y + (pose.y - from.y) * ratio;
      this.samples.push({
        timeMs: Math.round(this.nextSampleMs),
        x: Math.round(x * 2) / 2,
        y: Math.round(y * 2) / 2,
        facing: ratio < 0.5 ? from.facing : pose.facing,
        state: ratio < 0.5 ? from.state : pose.state,
      });
      this.nextSampleMs += this.intervalMs;
    }
    this.previousPose = { ...pose };
  }
  finish(durationMs = this.elapsedMs): GhostRun {
    return {
      version: 1,
      floor: this.floor,
      durationMs: Math.round(durationMs),
      sampleIntervalMs: this.intervalMs,
      samples: this.samples.map((sample) => ({ ...sample })),
    };
  }
  reset(): void {
    this.elapsedMs = 0;
    this.nextSampleMs = 0;
    this.samples = [];
    this.previousPose = undefined;
    this.previousElapsedMs = 0;
  }
}
export function visualState(value: PlayerState): GhostVisualState {
  return value === PlayerState.LOCKED || value === PlayerState.DEAD ? PlayerState.IDLE : value;
}
