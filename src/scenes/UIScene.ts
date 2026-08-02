import { ScreenShell } from '../ui/UiKit';
import Phaser from 'phaser';
import { eventBus, Events } from '../utils/EventBus';
import type { HudData } from '../types/game';
import { ToastController } from '../ui/Toast';

export class UIScene extends Phaser.Scene {
  private title!: Phaser.GameObjects.Text;
  private timer!: Phaser.GameObjects.Text;
  private stats!: Phaser.GameObjects.Text;
  private dash!: Phaser.GameObjects.Text;
  private jump!: Phaser.GameObjects.Text;
  private bar!: Phaser.GameObjects.Rectangle;
  private splits!: Phaser.GameObjects.Text;
  private toast!: ToastController;
  constructor() {
    super('UI');
  }
  create(): void {
    new ScreenShell(this, 'ESTADO DEL INTENTO', 'Navegación accesible · foco visible · volver siempre disponible');
    const style = { fontFamily: 'monospace', fontSize: '17px', color: '#fff' };
    this.add.rectangle(480, 38, 912, 60, 0x071018, 0.9).setStrokeStyle(1, 0x526c7e);
    this.add.rectangle(135, 492, 220, 62, 0x071018, 0.9).setStrokeStyle(1, 0x526c7e);
    this.add.rectangle(790, 472, 290, 112, 0x071018, 0.9).setStrokeStyle(1, 0x526c7e);
    this.title = this.add.text(30, 20, '', style);
    this.timer = this.add.text(480, 20, '', style).setOrigin(0.5, 0);
    this.stats = this.add.text(930, 20, '', style).setOrigin(1, 0);
    this.dash = this.add.text(42, 474, 'DASH  ●', style);
    this.jump = this.add.text(42, 502, 'SALTO EXTRA  ●', style);
    this.bar = this.add.rectangle(480, 525, 0, 4, 0x5ef1ff).setOrigin(0, 0.5);
    this.splits = this.add.text(920, 430, '', { ...style, fontSize: '16px', align: 'right' }).setOrigin(1, 0);
    this.toast = new ToastController(this);
    eventBus.on(Events.HUD, this.onHud, this);
    eventBus.on(Events.TOAST, this.onToast, this);
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
    this.jump
      .setText(data.airJumpReady ? 'SALTO EXTRA  ●' : 'SALTO EXTRA  ○')
      .setColor(data.airJumpReady ? '#77f29a' : '#667782');
    const delta = data.lastDeltaMs === null ? 'SIN REFERENCIA' : `${data.lastDeltaMs < 0 ? '−' : '+'}${(Math.abs(data.lastDeltaMs) / 1000).toFixed(2)} s`;
    this.splits.setText([
      `PRÓXIMO ${data.nextSplit ?? 'META'}${data.nextReferenceMs === null ? '' : ` · PB ${(data.nextReferenceMs / 1000).toFixed(2)}`}`,
      data.lastSplit ? `ÚLTIMO ${data.lastSplit.name} · ${delta}` : 'ÚLTIMO --',
      data.bestTheoreticalMs === null ? 'TEÓRICO --' : `TEÓRICO ${(data.bestTheoreticalMs / 1000).toFixed(2)} s`,
    ]);
    this.bar.setDisplaySize(930 * Phaser.Math.Clamp(data.progress, 0, 1), 4).setPosition(15, 525);
  }
  private onToast(message: string): void { this.toast.show(message, 'success', 1800); }
  private shutdown(): void {
    eventBus.off(Events.HUD, this.onHud, this);
    eventBus.off(Events.TOAST, this.onToast, this);
    this.toast.destroy();
  }
}
