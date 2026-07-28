import type Phaser from 'phaser';
import { StorageService } from './services/StorageService';
import type { GhostRun } from './runs/GhostTypes';
import type { LevelScene } from './scenes/LevelScene';
import type { InputAction } from './input/InputAction';
import { LEVELS } from './config/levelConfig';
import type { MenuScene } from './scenes/MenuScene';
import type { RunSetupScene } from './scenes/RunSetupScene';
import { LocalAnalyticsService } from './analytics/LocalAnalyticsService';
import { TowerRunSession } from './runs/TowerRunSession';
import { TowerCheckpointService } from './runs/TowerCheckpointService';
import { createTowerFloorRunData } from './runs/RunContext';

export interface E2EHarness {
  scene: () => string[];
  startFloor: (index: number) => void;
  killPlayer: () => void;
  completeFloor: () => void;
  save: () => ReturnType<StorageService['load']>;
  run: () => ReturnType<LevelScene['getRunState']> | null;
  injectGhost: (floor: number, ghost: GhostRun) => void;
  hasRecord: (floor: number) => boolean;
  dispatchAction: (action: InputAction) => void;
  releaseAction: (action: InputAction) => void;
  getBindings: () => ReturnType<StorageService['load']>['input'];
  setBinding: (action: InputAction, code: string) => void;
  getActiveDevice: () => string;
  startPractice: (floor: number, anchor: string) => void;
  getRunMode: () => string | null;
  getEligibility: () => unknown;
  getPracticeAnchor: () => string | null;
  getGhostState: () => string | null;
  menuSelection: () => number;
  runSetupSelection: () => { mode: number; anchor: number } | null;
  getCurrentSplit: () => unknown;
  getNextSplit: () => unknown;
  getCompletedSplits: () => unknown;
  triggerSplit: (id: string) => unknown;
  getLastSplitFeedback: () => unknown;
  getCompletionOutcome: () => unknown;
  getAnalytics: (floor: number) => unknown;
  clearAnalytics: () => void;
  openAnalytics: () => void;
  startTower: (mode: 'competitive' | 'assisted') => void;
  getTowerState: () => unknown;
  getTowerCheckpoint: () => unknown;
  completeCurrentTowerFloor: () => void;
  abandonTower: () => void;
  resumeTower: () => void;
  getTowerRecord: () => unknown;
  openFloorSelect: () => void;
  openTowerResults: () => void;
  getMenuItemBounds: () => unknown;
  getFocusedAction: () => number;
}

export function installE2EHarness(game: Phaser.Game): void {
  if (!import.meta.env.VITE_E2E) return;
  window.__OMF_E2E__ = {
    scene: () => game.scene.getScenes(true).map((scene) => scene.scene.key),
    startFloor: (index) =>
      game.scene.start('Level', { levelIndex: index, allowE2ECompetitive: true }),
    killPlayer: () => game.scene.getScene('Level').events.emit('e2e:kill'),
    completeFloor: () => game.scene.getScene('Level').events.emit('e2e:complete'),
    save: () => new StorageService().load(),
    run: () => (game.scene.getScene('Level') as LevelScene | undefined)?.getRunState() ?? null,
    injectGhost: (floor, ghost) => {
      const service = new StorageService();
      const save = service.load();
      const key = String(floor);
      const old = save.floors[key];
      save.floors[key] = {
        completed: old?.completed ?? true,
        bestTimeMs: old?.bestTimeMs ?? ghost.durationMs,
        fewestDeaths: old?.fewestDeaths ?? 0,
        rank: old?.rank ?? 'C',
        bestGhost: ghost,
        bestRunSplits: old?.bestRunSplits ?? {},
        bestSegments: old?.bestSegments ?? {},
      };
      service.save(save);
    },
    hasRecord: (floor) => Boolean(new StorageService().load().floors[String(floor)]?.bestGhost),
    dispatchAction: (action) =>
      window.dispatchEvent(new CustomEvent('omf:e2e-action', { detail: { action, down: true } })),
    releaseAction: (action) =>
      window.dispatchEvent(new CustomEvent('omf:e2e-action', { detail: { action, down: false } })),
    getBindings: () => new StorageService().load().input,
    setBinding: (action, code) => {
      const service = new StorageService(),
        save = service.load();
      save.input.keyboard[action] = code;
      service.save(save);
    },
    getActiveDevice: () => 'keyboard',
    startPractice: (floor, anchor) =>
      game.scene.start('Level', {
        levelIndex: Math.max(0, Math.min(LEVELS.length - 1, floor - 1)),
        mode: 'practice',
        anchorId: anchor,
      }),
    getRunMode: () =>
      (game.scene.getScene('Level') as LevelScene | undefined)?.getRunState().mode ?? null,
    getEligibility: () =>
      (game.scene.getScene('Level') as LevelScene | undefined)?.getRunState().eligibility ?? null,
    getPracticeAnchor: () =>
      (game.scene.getScene('Level') as LevelScene | undefined)?.getRunState().anchorId ?? null,
    getGhostState: () =>
      (game.scene.getScene('Level') as LevelScene | undefined)?.getRunState().playerState ?? null,
    menuSelection: () => (game.scene.getScene('Menu') as MenuScene).getSelection(),
    runSetupSelection: () =>
      (game.scene.getScene('RunSetup') as RunSetupScene | undefined)?.getSelection() ?? null,
    getCurrentSplit: () => (game.scene.getScene('Level') as LevelScene | undefined)?.getRunState().currentSplit ?? null,
    getNextSplit: () => (game.scene.getScene('Level') as LevelScene | undefined)?.getRunState().nextSplit ?? null,
    getCompletedSplits: () => (game.scene.getScene('Level') as LevelScene | undefined)?.getRunState().completedSplits ?? [],
    triggerSplit: (id) => (game.scene.getScene('Level') as LevelScene | undefined)?.triggerSplit(id) ?? null,
    getLastSplitFeedback: () => (game.scene.getScene('Level') as LevelScene | undefined)?.getRunState().lastSplitFeedback ?? null,
    getCompletionOutcome: () => null,
    getAnalytics: (floor) => new LocalAnalyticsService(false).load().floors[String(floor)] ?? null,
    clearAnalytics: () => new LocalAnalyticsService(false).clear(),
    openAnalytics: () => game.scene.start('Analytics'),
    startTower: (mode) => { const session=TowerRunSession.start(mode);new TowerCheckpointService().save(session);game.scene.start('Level',createTowerFloorRunData(0,mode,session.state.sessionId,true)); },
    getTowerState: () => new TowerCheckpointService().load()?.state ?? null,
    getTowerCheckpoint: () => new TowerCheckpointService().raw(),
    completeCurrentTowerFloor: () => game.scene.getScene('Level').events.emit('e2e:complete'),
    abandonTower: () => { new TowerCheckpointService().clear(); game.scene.start('Menu'); },
    resumeTower: () => { const session=new TowerCheckpointService().load();if(!session)return;if(session.state.status==='between-floors')session.advance();new TowerCheckpointService().save(session);game.scene.start('Level',createTowerFloorRunData(session.state.nextFloor-1,session.state.mode,session.state.sessionId,true)); },
    getTowerRecord: () => new StorageService().load().tower,
    openFloorSelect: () => game.scene.start('FloorSelect',{practice:false}),
    openTowerResults: () => game.scene.start('TowerResults'),
    getMenuItemBounds: () => (game.scene.getScene('Menu') as MenuScene).getItemBounds(),
    getFocusedAction: () => (game.scene.getScene('Menu') as MenuScene).getSelection(),
  };
}

declare global {
  interface Window {
    __OMF_E2E__?: E2EHarness;
  }
}
