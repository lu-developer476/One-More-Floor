import Phaser from 'phaser';
import type { ResultData } from '../types/game';
import { LEVELS } from '../config/levelConfig';
import { StorageService } from '../services/StorageService';
import { calculateRank, nextRankGap, seconds } from '../systems/Statistics';
import { audioService } from '../services/AudioService';
export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }
  create(data: ResultData): void {
    const level = LEVELS[data.levelIndex];
    if (!level) throw new Error('Invalid result level');
    const rank = calculateRank(level, data.elapsedMs, data.deaths);
    const saved = new StorageService().recordFloor(data.floor, data.elapsedMs, data.deaths, rank, data.ghostRun);
    const best = saved.floors[String(data.floor)];
    this.cameras.main.setBackgroundColor('#0c1119');
    const heading = this.add
      .text(480, 82, data.final ? 'EVACUACIÓN COMPLETA' : 'PISO COMPLETADO', {
        fontFamily: 'monospace',
        fontSize: '42px',
        color: '#5ef1ff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    if (data.ghostSaved) {
      heading.setText('NUEVO RÉCORD');
      this.tweens.add({ targets: heading, scale: 1.08, duration: 420, yoyo: true, repeat: 2 });
      audioService.play('record', 0);
    }
    this.add
      .text(
        480,
        220,
        [
          `RANGO  ${rank}  ·  MEJOR ${best?.rank ?? rank}`,
          level.name,
          `TIEMPO ${seconds(data.elapsedMs)} s  ·  MEJOR ${seconds(best?.bestTimeMs ?? data.elapsedMs)} s`,
          `MEJOR ANTERIOR ${data.previousBestMs === null ? '--' : `${seconds(data.previousBestMs)} s`}`,
          `MUERTES ${data.deaths}  ·  MEJOR ${best?.fewestDeaths ?? data.deaths}`,
          nextRankGap(level, rank, data.elapsedMs, data.deaths),
          data.ghostSaved ? 'FANTASMA NUEVO GUARDADO' : 'FANTASMA SIN CAMBIOS',
          data.final ? `TOTAL ${seconds(data.totalElapsedMs)} s` : '',
        ].filter(Boolean),
        {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#fff',
          align: 'center',
          lineSpacing: 9,
        },
      )
      .setOrigin(0.5);
    this.add
      .text(480, 440, `${data.final ? 'ENTER · MENÚ' : 'ENTER / A · SIGUIENTE PISO'}  ·  R REPETIR  ·  M MENÚ`, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#f5c84c',
      })
      .setOrigin(0.5);
    const next = () =>
      data.final
        ? this.scene.start('Menu')
        : this.scene.start('Level', {
            levelIndex: data.levelIndex + 1,
            deaths: 0,
            totalElapsedMs: data.totalElapsedMs,
          });
    this.time.delayedCall(180, () => {
      this.input.keyboard?.once('keydown-ENTER', next);
      this.input.gamepad?.once('down', next);
      this.input.keyboard?.once('keydown-R', () => this.scene.start('Level', { levelIndex: data.levelIndex }));
      this.input.keyboard?.once('keydown-M', () => this.scene.start('Menu'));
    });
  }
}
