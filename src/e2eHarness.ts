import type Phaser from 'phaser';
import { StorageService } from './services/StorageService';

export interface E2EHarness {
  scene: () => string[];
  startFloor: (index: number) => void;
  killPlayer: () => void;
  completeFloor: () => void;
  save: () => ReturnType<StorageService['load']>;
}

export function installE2EHarness(game: Phaser.Game): void {
  if (!import.meta.env.VITE_E2E) return;
  window.__OMF_E2E__ = {
    scene: () => game.scene.getScenes(true).map((scene) => scene.scene.key),
    startFloor: (index) => game.scene.start('Level', { levelIndex: index }),
    killPlayer: () => game.scene.getScene('Level').events.emit('e2e:kill'),
    completeFloor: () => game.scene.getScene('Level').events.emit('e2e:complete'),
    save: () => new StorageService().load(),
  };
}

declare global {
  interface Window {
    __OMF_E2E__?: E2EHarness;
  }
}
