import type Phaser from 'phaser';
import { StorageService } from './services/StorageService';
import type { GhostRun } from './runs/GhostTypes';
import type { LevelScene } from './scenes/LevelScene';

export interface E2EHarness {
  scene: () => string[];
  startFloor: (index: number) => void;
  killPlayer: () => void;
  completeFloor: () => void;
  save: () => ReturnType<StorageService['load']>;
  run: () => ReturnType<LevelScene['getRunState']> | null;
  injectGhost: (floor: number, ghost: GhostRun) => void;
  hasRecord: (floor: number) => boolean;
}

export function installE2EHarness(game: Phaser.Game): void {
  if (!import.meta.env.VITE_E2E) return;
  window.__OMF_E2E__ = {
    scene: () => game.scene.getScenes(true).map((scene) => scene.scene.key),
    startFloor: (index) => game.scene.start('Level', { levelIndex: index }),
    killPlayer: () => game.scene.getScene('Level').events.emit('e2e:kill'),
    completeFloor: () => game.scene.getScene('Level').events.emit('e2e:complete'),
    save: () => new StorageService().load(),
    run: () => (game.scene.getScene('Level') as LevelScene | undefined)?.getRunState() ?? null,
    injectGhost: (floor, ghost) => { const service = new StorageService(); const save = service.load(); const key = String(floor); const old = save.floors[key]; save.floors[key] = { completed: old?.completed ?? true, bestTimeMs: old?.bestTimeMs ?? ghost.durationMs, fewestDeaths: old?.fewestDeaths ?? 0, rank: old?.rank ?? 'C', bestGhost: ghost }; service.save(save); },
    hasRecord: (floor) => Boolean(new StorageService().load().floors[String(floor)]?.bestGhost),
  };
}

declare global {
  interface Window {
    __OMF_E2E__?: E2EHarness;
  }
}
