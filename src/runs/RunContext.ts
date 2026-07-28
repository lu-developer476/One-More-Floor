import { LEVELS } from '../config/levelConfig';
import type { RunMode, RunScope } from '../types/game';
import type { RunContext } from './AttemptSession';

export const initialAnchor = (levelIndex: number): string => {
  const level = LEVELS[levelIndex];
  if (!level) throw new Error('Invalid floor');
  return level.practiceAnchors[0]!.id;
};

const create = (
  levelIndex: number,
  mode: RunMode,
  scope: RunScope,
  towerRunId: string | null,
  anchorId = initialAnchor(levelIndex),
  allowE2ECompetitive = false,
): RunContext =>
  Object.freeze({
    levelIndex,
    mode,
    scope,
    anchorId,
    towerRunId,
    gameplayAssist: mode === 'assisted',
    allowE2ECompetitive,
  });

export const createFloorRunData = (
  levelIndex: number,
  mode: RunMode = 'competitive',
  anchorId = initialAnchor(levelIndex),
  allowE2ECompetitive = false,
): RunContext => create(levelIndex, mode, 'floor', null, anchorId, allowE2ECompetitive);
export const createTowerFloorRunData = (
  levelIndex: number,
  mode: Exclude<RunMode, 'practice'>,
  towerRunId: string,
  allowE2ECompetitive = false,
): RunContext =>
  create(levelIndex, mode, 'tower', towerRunId, initialAnchor(levelIndex), allowE2ECompetitive);
export const createRestartData = (context: RunContext): RunContext => Object.freeze({ ...context });
export const createNextTowerFloorData = (context: RunContext): RunContext => {
  if (context.scope !== 'tower' || !context.towerRunId) throw new Error('Not a tower run');
  return createTowerFloorRunData(
    context.levelIndex + 1,
    context.mode as Exclude<RunMode, 'practice'>,
    context.towerRunId,
    context.allowE2ECompetitive,
  );
};
