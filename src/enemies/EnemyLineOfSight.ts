import type { EnemyBlocker } from './EnemyTypes';

interface Point { readonly x: number; readonly y: number }
const finitePoint = (point: Point): boolean => Number.isFinite(point.x) && Number.isFinite(point.y);
const finiteBlocker = (blocker: EnemyBlocker): boolean => Number.isFinite(blocker.x) && Number.isFinite(blocker.y) && Number.isFinite(blocker.width) && Number.isFinite(blocker.height) && blocker.width >= 0 && blocker.height >= 0;
const intersectsSegment = (origin: Point, target: Point, blocker: EnemyBlocker): boolean => {
  if (blocker.active === false) return false;
  const left = blocker.x - blocker.width / 2, right = blocker.x + blocker.width / 2;
  const top = blocker.y - blocker.height / 2, bottom = blocker.y + blocker.height / 2;
  const dx = target.x - origin.x, dy = target.y - origin.y;
  let near = 0, far = 1;
  for (const [start, delta, min, max] of [[origin.x, dx, left, right], [origin.y, dy, top, bottom]] as const) {
    if (delta === 0) { if (start < min || start > max) return false; continue; }
    const a = (min - start) / delta, b = (max - start) / delta;
    near = Math.max(near, Math.min(a, b)); far = Math.min(far, Math.max(a, b));
    if (near > far) return false;
  }
  return near > 0.001 && near < 0.999;
};
export const hasEnemyLineOfSight = (origin: Point, target: Point, blockers: readonly EnemyBlocker[]): boolean => finitePoint(origin) && finitePoint(target) && blockers.every(finiteBlocker) && !blockers.some((blocker) => intersectsSegment(origin, target, blocker));
export const distanceToFirstBlocker = (origin: Point, direction: -1 | 1, maximum: number, blockers: readonly EnemyBlocker[]): number => {
  if (!finitePoint(origin) || !Number.isFinite(maximum) || maximum < 0 || blockers.some((blocker) => !finiteBlocker(blocker))) return 0;
  let result = maximum;
  for (const blocker of blockers) {
    if (blocker.active === false || origin.y < blocker.y - blocker.height / 2 || origin.y > blocker.y + blocker.height / 2) continue;
    const edge = blocker.x - direction * blocker.width / 2;
    const distance = (edge - origin.x) * direction;
    if (distance > 0) result = Math.min(result, distance);
  }
  return Math.max(0, result);
};
