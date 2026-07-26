import type { GhostRun, GhostSample } from './GhostTypes';
export type GhostFrame = Omit<GhostSample, 'timeMs'>;
export function interpolateGhost(
  run: GhostRun,
  timeMs: number,
  hint = 0,
): { frame: GhostFrame; index: number } | null {
  if (!run.samples.length || timeMs < 0 || timeMs > run.durationMs) return null;
  let index = Math.max(0, Math.min(hint, run.samples.length - 2));
  while (index + 1 < run.samples.length - 1 && run.samples[index + 1]!.timeMs <= timeMs) index += 1;
  while (index > 0 && run.samples[index]!.timeMs > timeMs) index -= 1;
  const left = run.samples[index]!;
  const right = run.samples[Math.min(index + 1, run.samples.length - 1)]!;
  const ratio =
    right.timeMs === left.timeMs
      ? 0
      : Math.max(0, Math.min(1, (timeMs - left.timeMs) / (right.timeMs - left.timeMs)));
  return {
    index,
    frame: {
      x: left.x + (right.x - left.x) * ratio,
      y: left.y + (right.y - left.y) * ratio,
      facing: ratio < 0.5 ? left.facing : right.facing,
      state: ratio < 0.5 ? left.state : right.state,
    },
  };
}
