import Phaser from 'phaser';
import { eventBus, Events } from '../utils/EventBus';
import type { HudData } from '../types/game';

export class UIScene extends Phaser.Scene {
  private title!: Phaser.GameObjects.Text;
  private timer!: Phaser.GameObjects.Text;
  private stats!: Phaser.GameObjects.Text;
  private dash!: Phaser.GameObjects.Text;
  private bar!: Phaser.GameObjects.Rectangle;
  constructor() {
    super('UI');
  }
  create(): void {
    const style = { fontFamily: 'monospace', fontSize: '17px', color: '#fff' };
    this.add.rectangle(480, 30, 930, 45, 0x071018, 0.82).setStrokeStyle(1, 0x526c7e);
    this.title = this.add.text(30, 20, '', style);
    this.timer = this.add.text(480, 20, '', style).setOrigin(0.5, 0);
    this.stats = this.add.text(930, 20, '', style).setOrigin(1, 0);
    this.dash = this.add.text(30, 495, 'DASH ●', style);
    this.bar = this.add.rectangle(480, 525, 0, 4, 0x5ef1ff).setOrigin(0, 0.5);
    eventBus.on(Events.HUD, this.onHud, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }
  private onHud(data: HudData): void {
    this.title.setText(`PISO ${data.floor}/${data.totalFloors} · ${data.floorName}`);
    this.timer
      .setText(
        `INTENTO ${(data.attemptMs / 1000).toFixed(2)} · COLAPSO ${(data.remainingMs / 1000).toFixed(1)}`,
      )
      .setColor(data.remainingMs < 10000 ? '#ff405c' : '#fff')
      .setScale(data.remainingMs < 10000 ? 1.12 : 1);
    this.stats.setText(
      `${data.ghostActive ? 'FANTASMA · ' : ''}PB ${data.bestTimeMs === null ? '--' : (data.bestTimeMs / 1000).toFixed(2)} · MUERTES ${data.deaths}`,
    );
    this.dash
      .setText(data.dashReady ? 'DASH ●' : 'DASH ○')
      .setColor(data.dashReady ? '#5ef1ff' : '#667782');
    this.bar.setDisplaySize(930 * Phaser.Math.Clamp(data.progress, 0, 1), 4).setPosition(15, 525);
  }
  private shutdown(): void {
    eventBus.off(Events.HUD, this.onHud, this);
  }
}
