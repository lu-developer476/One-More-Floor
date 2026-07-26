import Phaser from 'phaser';
import type { ResultData } from '../types/game';
import { LEVELS } from '../config/levelConfig';
import { StorageService } from '../services/StorageService';
import { calculateRank, nextRankGap, seconds } from '../systems/Statistics';
export class ResultsScene extends Phaser.Scene {
  constructor() { super('Results'); }
  create(data: ResultData): void {
    const level = LEVELS[data.levelIndex];
    if (!level) throw new Error('Invalid result level');
    const rank = calculateRank(level, data.elapsedMs, data.deaths);
    const saved = new StorageService().recordFloor(data.floor, data.elapsedMs, data.deaths, rank);
    const best = saved.floors[String(data.floor)];
    this.cameras.main.setBackgroundColor('#0c1119');
    this.add.text(480, 82, data.final ? 'EVACUACIÓN COMPLETA' : 'PISO COMPLETADO', { fontFamily: 'monospace', fontSize: '42px', color: '#5ef1ff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(480, 220, [
      `RANGO  ${rank}  ·  MEJOR ${best?.rank ?? rank}`,
      level.name,
      `TIEMPO ${seconds(data.elapsedMs)} s  ·  MEJOR ${seconds(best?.bestTimeMs ?? data.elapsedMs)} s`,
      `MUERTES ${data.deaths}  ·  MEJOR ${best?.fewestDeaths ?? data.deaths}`,
      nextRankGap(level, rank, data.elapsedMs, data.deaths),
      data.final ? `TOTAL ${seconds(data.totalElapsedMs)} s` : '',
    ].filter(Boolean), { fontFamily: 'monospace', fontSize: '20px', color: '#fff', align: 'center', lineSpacing: 9 }).setOrigin(0.5);
    this.add.text(480, 440, data.final ? 'ENTER · MENÚ' : 'ENTER / A · SIGUIENTE PISO', { fontFamily: 'monospace', fontSize: '18px', color: '#f5c84c' }).setOrigin(0.5);
    const next = () => data.final ? this.scene.start('Menu') : this.scene.start('Level', { levelIndex: data.levelIndex + 1, deaths: 0, totalElapsedMs: data.totalElapsedMs });
    this.time.delayedCall(180, () => {
      this.input.keyboard?.once('keydown-ENTER', next);
      this.input.gamepad?.once('down', next);
    });
  }
}
