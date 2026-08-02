import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { installE2EHarness } from './e2eHarness';
import { StorageService } from './services/StorageService';
import { GameAccessibilityBridge } from './accessibility/GameAccessibilityBridge';
import './style.css';
const query = new URLSearchParams(window.location.search);
if (query.has('reset-controls')) {
  new StorageService().resetControls();
  sessionStorage.setItem('one-more-floor.controls-restored', '1');
  query.delete('reset-controls');
  const suffix = query.toString();
  history.replaceState(
    null,
    '',
    `${location.pathname}${suffix ? `?${suffix}` : ''}${location.hash}`,
  );
}
let game: Phaser.Game;
const root = document.getElementById('game');
const accessibility = root ? new GameAccessibilityBridge(root) : undefined;
try {
  game = new Phaser.Game(gameConfig);
  if (!game.canvas) throw new Error('Canvas unavailable');
  installE2EHarness(game);
} catch (error) {
  if (import.meta.env.DEV) console.error(error);
  const root = document.getElementById('game');
  if (root)
    root.innerHTML = `<section class="startup-error"><h1>NO SE PUDO INICIAR EL JUEGO</h1><p>El navegador no pudo crear el canvas. Revisá WebGL o restaurá los controles.</p><button onclick="location.reload()">REINTENTAR</button><button onclick="location.search='reset-controls'">RESTAURAR CONTROLES</button></section>`;
  game = undefined as unknown as Phaser.Game;
}
const focusCanvas = (): void => {
  const canvas = game?.canvas;
  if (!canvas) return;
  canvas.tabIndex = 0;
  canvas.focus({ preventScroll: true });
};
requestAnimationFrame(focusCanvas);
game?.canvas?.addEventListener('pointerdown', focusCanvas);
root?.setAttribute('aria-label', `One More Floor v${__APP_VERSION__}`);
root?.setAttribute('data-app-version', __APP_VERSION__);
root?.setAttribute('data-save-schema', '11');
root?.setAttribute('data-tower-ruleset', '2');
window.addEventListener('pagehide', () => accessibility?.destroy(), { once: true });
