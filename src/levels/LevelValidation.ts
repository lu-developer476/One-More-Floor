import type { LevelDefinition, Point, RectDefinition } from '../types/game';
export const levelValidationErrors = (levels: readonly LevelDefinition[]): string[] => {
  const errors: string[] = [], ids = new Set<string>();
  const point = (path: string, value: Point, level: LevelDefinition) => {
    if (![value.x, value.y].every(Number.isFinite) || value.x < 0 || value.x > level.width || value.y < 0 || value.y > level.height) errors.push(`${path}: outside world`);
  };
  const rect = (path: string, value: RectDefinition, level: LevelDefinition) => {
    point(path, value, level); if (!(value.width > 0) || (value.height !== undefined && !(value.height > 0))) errors.push(`${path}: non-positive size`);
  };
  levels.forEach((level, levelIndex) => {
    const root = `floor-${String(level.floor).padStart(2, '0')}`;
    if (level.floor !== levelIndex + 1) errors.push(`${root}.floor: non-consecutive`);
    if (ids.has(level.id)) errors.push(`${root}.id: duplicate`); ids.add(level.id);
    if (level.splits.length < 3 || level.splits.length > 6) errors.push(`${root}.splits: expected 3..6`);
    level.splits.forEach((split, index) => { rect(`${root}.splits[${index}]`, split, level); if (split.order !== index) errors.push(`${root}.splits[${index}].order: expected ${index}`); });
    if (Math.abs((level.splits.at(-1)?.x ?? 0) - level.exit.x) > 250) errors.push(`${root}.splits: final split is not near exit`);
    point(`${root}.exit`, level.exit, level);
    level.practiceAnchors.forEach((anchor, index) => { point(`${root}.practiceAnchors[${index}]`, anchor, level); if (anchor.startingSplitId && !level.splits.some(({ id }) => id === anchor.startingSplitId)) errors.push(`${root}.practiceAnchors[${index}].startingSplitId: unknown`); });
    [...level.platforms, ...level.movingPlatforms, ...level.fallingPlatforms, ...level.lasers, ...level.electricZones, ...level.fans, ...level.conveyors, ...level.doors].forEach((object, index) => rect(`${root}.objects[${index}]`, object, level));
    if (!(level.targetTimeMs > 0 && level.targetTimeMs < level.durationMs)) errors.push(`${root}.timings: invalid`);
  });
  return errors;
};
