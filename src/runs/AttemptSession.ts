import { RunRecorder, type RunPose } from './RunRecorder';
import { evaluateRunEligibility, type RunMode } from './RunEligibility';
export class AttemptSession {
  readonly recorder: RunRecorder;
  attemptMs = 0;
  started = false;
  constructor(
    readonly floor: number,
    readonly mode: RunMode,
    readonly anchorId = 'start',
    gameplayAssist = false,
    e2e = false,
    allowE2ECompetitive = false,
  ) {
    this.recorder = new RunRecorder(floor);
    this.eligibility = evaluateRunEligibility({
      mode,
      startAnchorId: anchorId,
      gameplayAssist,
      e2e,
      allowE2ECompetitive,
    });
  }
  readonly eligibility;
  start(): void {
    this.started = true;
  }
  update(delta: number, pose: RunPose): void {
    if (!this.started) return;
    this.attemptMs += delta;
    this.recorder.update(delta, pose);
  }
  discard(): void {
    this.recorder.reset();
    this.attemptMs = 0;
  }
}
