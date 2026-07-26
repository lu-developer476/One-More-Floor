import type Phaser from 'phaser';
import { StorageService } from './services/StorageService';
import type { GhostRun } from './runs/GhostTypes';
import type { LevelScene } from './scenes/LevelScene';
import type { InputAction } from './input/InputAction';
import { LEVELS } from './config/levelConfig';

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
  };
}

declare global {
  interface Window {
    __OMF_E2E__?: E2EHarness;
  }
}
