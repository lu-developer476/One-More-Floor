import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { installE2EHarness } from './e2eHarness';
import { StorageService } from './services/StorageService';
import './style.css';
const query = new URLSearchParams(window.location.search);
if (query.has('reset-controls')) {
  new StorageService().resetControls();
  sessionStorage.setItem('one-more-floor.controls-restored', '1');
  query.delete('reset-controls');
  const suffix = query.toString();
  history.replaceState(null, '', `${location.pathname}${suffix ? `?${suffix}` : ''}${location.hash}`);
}
const game = new Phaser.Game(gameConfig);
installE2EHarness(game);
const focusCanvas = (): void => {
  const canvas = game.canvas;
  canvas.tabIndex = 0;
  canvas.focus({ preventScroll: true });
};
requestAnimationFrame(focusCanvas);
game.canvas.addEventListener('pointerdown', focusCanvas);
