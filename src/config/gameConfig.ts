import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { LevelScene } from '../scenes/LevelScene';
import { MenuScene } from '../scenes/MenuScene';
import { ResultsScene } from '../scenes/ResultsScene';
import { UIScene } from '../scenes/UIScene';
import { SettingsScene } from '../scenes/SettingsScene';
import { PauseScene } from '../scenes/PauseScene';
import { RunSetupScene } from '../scenes/RunSetupScene';
import { ControlsScene } from '../scenes/ControlsScene';
import { MOVEMENT } from './movementConfig';
import { AnalyticsScene } from '../scenes/AnalyticsScene';
import { FloorSelectScene } from '../scenes/FloorSelectScene';
import { TowerSetupScene } from '../scenes/TowerSetupScene';
import { TowerFloorResultsScene } from '../scenes/TowerFloorResultsScene';
import { EndingScene } from '../scenes/EndingScene';
import { TowerResultsScene } from '../scenes/TowerResultsScene';
import { HelpScene } from '../scenes/HelpScene';
import { CreditsScene } from '../scenes/CreditsScene';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

const debugPhysics = import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug');

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  title: 'One More Floor',
  version: __APP_VERSION__,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#080b12',
  pixelArt: true,
  roundPixels: true,
  fps: {
    target: 60,
    smoothStep: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: MOVEMENT.gravity },
      fixedStep: true,
      fps: 120,
      overlapBias: 8,
      debug: debugPhysics,
    },
  },
  input: {
    gamepad: true,
  },
  scene: [
    BootScene,
    MenuScene,
    LevelScene,
    UIScene,
    ResultsScene,
    SettingsScene,
    PauseScene,
    RunSetupScene,
    ControlsScene,
    AnalyticsScene,
    FloorSelectScene,
    TowerSetupScene,
    TowerFloorResultsScene,
    EndingScene,
    TowerResultsScene,
    HelpScene,
    CreditsScene,
  ],
};
