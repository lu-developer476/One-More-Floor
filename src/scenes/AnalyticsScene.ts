import Phaser from 'phaser';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { StorageService } from '../services/StorageService';
import { LocalAnalyticsService } from '../analytics/LocalAnalyticsService';
import { completionRate, median, mostInconsistentSegment, slowestSegment, topEntry } from '../analytics/AnalyticsStatistics';
import { LEVELS } from '../config/levelConfig';
import { calculateBestTheoretical } from '../systems/SplitComparisons';
import { createAnalyticsReport } from '../analytics/AnalyticsReport';

export class AnalyticsScene extends Phaser.Scene {
  private manager!: InputManager;
  private selected = 0;
  private detail!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;
  constructor() { super('Analytics'); }
  create(): void {
    const save = new StorageService().load();
    this.manager = new InputManager(this, save.input); this.manager.blockInherited();
    this.cameras.main.setBackgroundColor('#071018');
    this.add.rectangle(480, 270, 900, 480, 0x0c1119, 0.96).setStrokeStyle(2, 0x5ef1ff);
    this.add.text(480, 42, 'ESTADÍSTICAS Y BALANCE', { fontFamily: 'monospace', fontSize: '30px', color: '#5ef1ff' }).setOrigin(0.5);
    LEVELS.forEach((level, index) => this.add.text(70, 105 + index * 55, `PISO ${level.floor}\n${level.name}`, {
      fontFamily: 'monospace', fontSize: '15px', color: '#ffffff', backgroundColor: '#16232c', padding: { x: 8, y: 5 },
    }).setInteractive().on('pointerdown', () => { this.selected = index; this.render(); }));
    this.detail = this.add.text(300, 105, '', { fontFamily: 'monospace', fontSize: '15px', color: '#d9e7ed', lineSpacing: 7 });
    const copy = this.add.text(480, 465, 'COPIAR INFORME', { fontFamily: 'monospace', fontSize: '18px', color: '#f5c84c' }).setOrigin(0.5).setInteractive();
    copy.on('pointerdown', () => void this.copy());
    this.status = this.add.text(480, 500, 'ESC · VOLVER', { fontFamily: 'monospace', fontSize: '13px', color: '#91a6b6' }).setOrigin(0.5);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.manager.destroy()); this.render();
  }
  update(): void {
    this.manager.poll();
    if (this.manager.wasPressed(InputAction.MENU_UP)) { this.selected = (this.selected + 4) % 5; this.render(); }
    if (this.manager.wasPressed(InputAction.MENU_DOWN)) { this.selected = (this.selected + 1) % 5; this.render(); }
    if (this.manager.wasPressed(InputAction.CONFIRM)) void this.copy();
    if (this.manager.wasPressed(InputAction.BACK)) this.scene.start('Menu');
  }
  private render(): void {
    const service = new StorageService(), save = service.load(), level = LEVELS[this.selected]!;
    const data = new LocalAnalyticsService(false).load().floors[String(level.floor)];
    const record = save.floors[String(level.floor)], attempts = data?.attempts ?? 0;
    const rate = completionRate(attempts, data?.completions ?? 0);
    this.detail.setText([
      `INTENTOS ${attempts} · COMP ${data?.competitive ?? 0} · PRÁCTICA ${data?.practice ?? 0} · ASISTIDOS ${data?.assisted ?? 0}`,
      `COMPLETADOS ${data?.completions ?? 0} · TASA ${rate === null ? '--' : `${(rate * 100).toFixed(1)}%`}`,
      `REINICIOS ${data?.restarts ?? 0} · ABANDONOS ${data?.abandons ?? 0} · MUERTES ${data?.deaths ?? 0}`,
      `CAUSA PRINCIPAL ${topEntry(data?.deathCauses ?? {}) ?? 'MUESTRA INSUFICIENTE'}`,
      `HAZARD MÁS LETAL ${topEntry(data?.deathSources ?? {}) ?? 'MUESTRA INSUFICIENTE'}`,
      `MEDIANA ${median(data?.completionTimes ?? []) === null ? 'MUESTRA INSUFICIENTE' : `${(median(data?.completionTimes ?? [])! / 1000).toFixed(2)} s`}`,
      `PB ${record?.bestTimeMs ? `${(record.bestTimeMs / 1000).toFixed(2)} s` : '--'}`,
      `TEÓRICO ${calculateBestTheoretical(level, record?.bestSegments ?? {}) === null ? '--' : `${(calculateBestTheoretical(level, record?.bestSegments ?? {})! / 1000).toFixed(2)} s`}`,
      `SEGMENTO MÁS LENTO ${slowestSegment(data?.segmentTimes ?? {}) ?? 'MUESTRA INSUFICIENTE'}`,
      `MÁS INCONSISTENTE ${mostInconsistentSegment(data?.segmentTimes ?? {}) ?? 'MUESTRA INSUFICIENTE'}`,
    ]);
  }
  private async copy(): Promise<void> {
    const report = createAnalyticsReport(new LocalAnalyticsService(false).load(), new StorageService().load());
    try { await navigator.clipboard.writeText(report); this.status.setText('INFORME COPIADO'); }
    catch { this.status.setText('NO SE PUDO COPIAR'); }
  }
}
