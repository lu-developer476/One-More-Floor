import { PlayerState } from '../types/game';
import { GHOST_INTERVAL_MS, MAX_GHOST_DURATION_MS, MAX_GHOST_SAMPLES, type GhostRun, type GhostVisualState } from './GhostTypes';
export interface RunPose { x: number; y: number; facing: -1 | 1; state: GhostVisualState }
export class RunRecorder {
  private elapsedMs = 0;
  private nextSampleMs = 0;
  private samples: GhostRun['samples'] = [];
  constructor(private readonly floor: number, private readonly intervalMs = GHOST_INTERVAL_MS, private readonly maxSamples = MAX_GHOST_SAMPLES) {}
  update(deltaMs: number, pose: RunPose): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0 || this.samples.length >= this.maxSamples) return;
    this.elapsedMs = Math.min(MAX_GHOST_DURATION_MS, this.elapsedMs + deltaMs);
    while (this.nextSampleMs <= this.elapsedMs && this.samples.length < this.maxSamples) {
      this.samples.push({ timeMs: Math.round(this.nextSampleMs), x: Math.round(pose.x * 2) / 2, y: Math.round(pose.y * 2) / 2, facing: pose.facing, state: pose.state });
      this.nextSampleMs += this.intervalMs;
    }
  }
  finish(durationMs = this.elapsedMs): GhostRun { return { version: 1, floor: this.floor, durationMs: Math.round(durationMs), sampleIntervalMs: this.intervalMs, samples: this.samples.map((sample) => ({ ...sample })) }; }
  reset(): void { this.elapsedMs = 0; this.nextSampleMs = 0; this.samples = []; }
}
export function visualState(value: PlayerState): GhostVisualState { return value === PlayerState.LOCKED || value === PlayerState.DEAD ? PlayerState.IDLE : value; }
