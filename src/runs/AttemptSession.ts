import type { GhostRun } from './GhostTypes';
import { RunRecorder, type RunPose } from './RunRecorder';
import { evaluateRunEligibility, type RunEligibility, type RunMode } from './RunEligibility';
import { SplitTracker, type SplitTime } from './SplitTracker';
import type { SplitDefinition } from '../types/game';

export interface RunContext {
  readonly levelIndex: number;
  readonly mode: RunMode;
  readonly anchorId: string;
  readonly gameplayAssist: boolean;
  readonly allowE2ECompetitive: boolean;
}
export type DeathCause =
  | 'spikes'
  | 'laser'
  | 'electricity'
  | 'fall'
  | 'collapse'
  | 'crush'
  | 'unknown';
export interface DeathEvent {
  readonly cause: DeathCause;
  readonly sourceId: string;
  readonly attemptMs: number;
  readonly splitId: string | null;
}
export interface AttemptResult {
  readonly elapsedMs: number;
  readonly deaths: number;
  readonly splits: readonly SplitTime[];
  readonly ghostRun: GhostRun;
}

export class AttemptSession {
  readonly context: Readonly<RunContext>;
  readonly recorder: RunRecorder;
  readonly eligibility: RunEligibility;
  readonly splits: SplitTracker;
  private elapsed = 0;
  private running = false;
  private finished = false;
  private readonly deathEvents: DeathEvent[] = [];

  constructor(
    context: RunContext,
    floor: number,
    definitions: readonly SplitDefinition[],
    startingSplitId: string | null = null,
    e2e = false,
  ) {
    this.context = Object.freeze({ ...context });
    this.recorder = new RunRecorder(floor);
    this.splits = new SplitTracker(definitions, startingSplitId);
    this.eligibility = evaluateRunEligibility({
      mode: context.mode,
      startAnchorId: context.anchorId,
      gameplayAssist: context.gameplayAssist,
      e2e,
      allowE2ECompetitive: context.allowE2ECompetitive,
    });
  }
  get attemptMs(): number {
    return this.elapsed;
  }
  get started(): boolean {
    return this.running;
  }
  get deaths(): readonly DeathEvent[] {
    return this.deathEvents;
  }
  start(): void {
    if (!this.finished) this.running = true;
  }
  update(delta: number, pose: RunPose): void {
    if (!this.running || this.finished) return;
    const safe = Math.max(0, Math.min(50, delta));
    this.elapsed += safe;
    this.recorder.update(safe, pose);
  }
  triggerSplit(id: string): SplitTime | null {
    return this.splits.trigger(id, this.elapsed);
  }
  recordDeath(cause: DeathCause, sourceId: string): void {
    this.deathEvents.push(
      Object.freeze({
        cause,
        sourceId,
        attemptMs: Math.round(this.elapsed),
        splitId: this.splits.current?.id ?? null,
      }),
    );
  }
  finish(): AttemptResult {
    this.finished = true;
    this.running = false;
    const elapsedMs = Math.round(this.elapsed);
    return Object.freeze({
      elapsedMs,
      deaths: this.deathEvents.length,
      splits: [...this.splits.completed],
      ghostRun: this.recorder.finish(elapsedMs),
    });
  }
  discard(): void {
    this.running = false;
    this.recorder.reset();
    this.splits.reset();
  }
  restartData(): RunContext {
    return this.context;
  }
}
