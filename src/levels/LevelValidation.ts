import type { LevelDefinition, Point, RectDefinition } from '../types/game';
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export const levelValidationErrors = (levels: readonly LevelDefinition[]): string[] => {
  const errors: string[] = [], ids = new Set<string>();
  const point = (path: string, value: Point, level: LevelDefinition) => { if (![value.x, value.y].every(Number.isFinite) || value.x < 0 || value.x > level.width || value.y < 0 || value.y > level.height) errors.push(`${path}: outside world`); };
  const rect = (path: string, value: RectDefinition, level: LevelDefinition) => { point(path, value, level); if (!(value.width > 0) || (value.height !== undefined && !(value.height > 0))) errors.push(`${path}: non-positive size`); };
  levels.forEach((level, levelIndex) => {
    const root = `floor-${String(level.floor).padStart(2, '0')}`;
    if (level.floor !== levelIndex + 1) errors.push(`${root}.floor: non-consecutive`);
    if (ids.has(level.id)) errors.push(`${root}.id: duplicate`); ids.add(level.id);
    if (![1, 2].includes(level.rulesetVersion) || level.rulesetVersion !== (level.floor === 1 ? 1 : 2)) errors.push(`${root}.rulesetVersion: unexpected`);
    if (!Array.isArray(level.enemies)) errors.push(`${root}.enemies: required`);
    if (level.enemies.length > 3) errors.push(`${root}.enemies: maximum is 3`);
    const enemyIds = new Set<string>();
    level.enemies.forEach((enemy, index) => {
      const path = `${root}.enemies[${index}]`; point(path, enemy, level);
      if (!enemy.id || enemyIds.has(enemy.id)) errors.push(`${path}.id: duplicate or empty`); enemyIds.add(enemy.id);
      if (distance(enemy, level.spawn) < 180) errors.push(`${path}: too close to spawn`);
      if (distance(enemy, level.exit) < 140) errors.push(`${path}: too close to exit`);
      if (enemy.activationSplitId !== null && !level.splits.some(({ id }) => id === enemy.activationSplitId)) errors.push(`${path}.activationSplitId: unknown`);
      if (level.practiceAnchors.some((anchor) => anchor.id !== level.practiceAnchors[0]?.id && distance(enemy, anchor) < 120)) errors.push(`${path}: too close to practice anchor`);
      if (enemy.kind === 'maintenance-bot') { if (!(enemy.speed > 0) || !(enemy.patrolMinX < enemy.patrolMaxX) || enemy.x < enemy.patrolMinX || enemy.x > enemy.patrolMaxX) errors.push(`${path}: invalid maintenance-bot patrol`); }
      else if (enemy.kind === 'security-drone') { if (enemy.alertMs < 400) errors.push(`${path}.alertMs: less than fair reaction window`); if (![enemy.patrolRadiusX, enemy.patrolSpeed, enemy.alertMs, enemy.chargeMs, enemy.recoverMs, enemy.cooldownMs, enemy.chargeSpeed, enemy.detectionRangeX, enemy.detectionRangeY].every((value) => Number.isFinite(value) && value > 0)) errors.push(`${path}: invalid security-drone parameters`); }
      else errors.push(`${path}.kind: unknown`);
    });
    const expected = [0, 1, 2, 2, 3][levelIndex]; if (level.enemies.length !== expected) errors.push(`${root}.enemies: expected ${expected}`);
    if (level.splits.length < 3 || level.splits.length > 6) errors.push(`${root}.splits: expected 3..6`);
    level.splits.forEach((split, index) => { rect(`${root}.splits[${index}]`, split, level); if (split.order !== index) errors.push(`${root}.splits[${index}].order: expected ${index}`); });
    if (Math.abs((level.splits.at(-1)?.x ?? 0) - level.exit.x) > 250) errors.push(`${root}.splits: final split is not near exit`);
    point(`${root}.exit`, level.exit, level);
    level.practiceAnchors.forEach((anchor, index) => { point(`${root}.practiceAnchors[${index}]`, anchor, level); if (anchor.startingSplitId && !level.splits.some(({ id }) => id === anchor.startingSplitId)) errors.push(`${root}.practiceAnchors[${index}].startingSplitId: unknown`); });
    [...level.platforms, ...level.movingPlatforms, ...level.fallingPlatforms, ...level.lasers, ...level.electricZones, ...level.fans, ...level.conveyors, ...level.doors].forEach((object, index) => rect(`${root}.objects[${index}]`, object, level));
    if (!(level.targetTimeMs > 0 && level.targetTimeMs < level.durationMs)) errors.push(`${root}.timings: invalid`);
  }); return errors;
};
