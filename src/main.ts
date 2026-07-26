import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { installE2EHarness } from './e2eHarness';
import './style.css';
const game = new Phaser.Game(gameConfig);
installE2EHarness(game);
