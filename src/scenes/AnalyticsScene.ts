import Phaser from 'phaser';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { formatPrompt } from '../input/InputPromptFormatter';
import { StorageService } from '../services/StorageService';
import { LocalAnalyticsService } from '../analytics/LocalAnalyticsService';
import { completionRate, median, topEntry } from '../analytics/AnalyticsStatistics';
import { LEVELS } from '../config/levelConfig';
import { calculateBestTheoretical } from '../systems/SplitComparisons';
import { createAnalyticsReport } from '../analytics/AnalyticsReport';
export class AnalyticsScene extends Phaser.Scene {
  private manager!: InputManager;
  private selected = 0;
  private choices: Phaser.GameObjects.Text[] = [];
  private detail!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;
  constructor() {
    super('Analytics');
  }
  create(): void {
    const save = new StorageService().load();
    this.manager = new InputManager(this, save.input);
    this.manager.blockInherited();
    this.cameras.main.setBackgroundColor('#071018');
    this.add.rectangle(480, 270, 900, 480, 0x0c1119, 0.96).setStrokeStyle(2, 0x5ef1ff);
    this.add
      .text(480, 38, 'ESTADÍSTICAS', {
        fontFamily: 'monospace',
        fontSize: '29px',
        color: '#5ef1ff',
      })
      .setOrigin(0.5);
    const labels = [...LEVELS.map((level) => `PISO ${level.floor}`), 'TORRE', 'COPIAR', 'VOLVER'];
    this.choices = labels.map((label, i) =>
      this.add
        .text(55, 82 + i * 44, label, {
          fontFamily: 'monospace',
          fontSize: '15px',
          color: '#91a6b6',
          backgroundColor: '#16232c',
          padding: { x: 8, y: 5 },
        })
        .setInteractive()
        .on('pointerover', () => this.select(i))
        .on('pointerdown', () => this.activate()),
    );
    this.detail = this.add.text(270, 90, '', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#d9e7ed',
      lineSpacing: 7,
    });
    this.status = this.add
      .text(
        480,
        505,
        `${formatPrompt(InputAction.CONFIRM, this.manager.activeDevice, save.input)} ELEGIR · ${formatPrompt(InputAction.BACK, this.manager.activeDevice, save.input)} VOLVER`,
        { fontFamily: 'monospace', fontSize: '13px', color: '#91a6b6' },
      )
      .setOrigin(0.5);
    this.select(0);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }
  update(): void {
    this.manager.poll();
    if (this.manager.wasPressed(InputAction.MENU_UP))
      this.select((this.selected + this.choices.length - 1) % this.choices.length);
    if (this.manager.wasPressed(InputAction.MENU_DOWN))
      this.select((this.selected + 1) % this.choices.length);
    if (this.manager.wasPressed(InputAction.CONFIRM)) this.activate();
    if (this.manager.wasPressed(InputAction.BACK)) this.scene.start('Menu');
  }
  private select(i: number): void {
    this.selected = i;
    this.choices.forEach((x, n) => x.setColor(n === i ? '#fff' : '#91a6b6'));
    this.render();
  }
  private render(): void {
    const save = new StorageService().load(),
      analytics = new LocalAnalyticsService(false).load();
    if (this.selected < LEVELS.length) {
      const level = LEVELS[this.selected]!,
        data = analytics.floors[String(level.floor)],
        record = save.floors[String(level.floor)],
        attempts = data?.attempts ?? 0,
        med = median(data?.completionTimes ?? []),
        theory = calculateBestTheoretical(level, record?.bestSegments ?? {});
      this.detail.setText([
        level.name,
        `INTENTOS ${attempts} · COMP ${data?.competitive ?? 0} · PRÁCTICA ${data?.practice ?? 0} · ASISTIDO ${data?.assisted ?? 0}`,
        `COMPLETADOS ${data?.completions ?? 0} · TASA ${completionRate(attempts, data?.completions ?? 0) === null ? '--' : `${(completionRate(attempts, data?.completions ?? 0)! * 100).toFixed(1)}%`}`,
        `REINICIOS ${data?.restarts ?? 0} · ABANDONOS ${data?.abandons ?? 0} · MUERTES ${data?.deaths ?? 0}`,
        `MEDIANA ${med === null ? 'MUESTRA INSUFICIENTE' : `${(med / 1000).toFixed(2)} s`}`,
        `PB ${record?.bestTimeMs ? `${(record.bestTimeMs / 1000).toFixed(2)} s` : '--'} · RANGO ${record?.rank ?? '--'}`,
        `TEÓRICO ${theory === null ? '--' : `${(theory / 1000).toFixed(2)} s`}`,
      ]);
    } else if (this.selected === LEVELS.length) {
      const tower = analytics.tower,
        med = median(tower.completionTimes),
        rate = completionRate(tower.attempts, tower.completed);
      this.detail.setText([
        'TORRE',
        `INTENTOS ${tower.attempts} · COMPLETADAS ${tower.completed}`,
        `TASA ${rate === null ? 'MUESTRA INSUFICIENTE' : `${(rate * 100).toFixed(1)}%`}`,
        `PB GLOBAL ${save.tower.bestTimeMs ? `${(save.tower.bestTimeMs / 1000).toFixed(2)} s` : '--'} · RANGO ${save.tower.bestRank ?? '--'}`,
        `MEDIANA ${med === null || tower.completed < 2 ? 'MUESTRA INSUFICIENTE' : `${(med / 1000).toFixed(2)} s`}`,
        `MUERTES PROMEDIO ${tower.completed ? (tower.totalDeaths / tower.completed).toFixed(1) : 'MUESTRA INSUFICIENTE'}`,
        `PISO MÁS LETAL ${topEntry(tower.deathsByFloor) ?? 'MUESTRA INSUFICIENTE'}`,
        `MÁS ABANDONOS ${topEntry(tower.abandonmentFloors) ?? 'MUESTRA INSUFICIENTE'}`,
      ]);
    } else
      this.detail.setText(
        this.selected === LEVELS.length + 1 ? 'COPIAR INFORME LOCAL' : 'VOLVER AL MENÚ',
      );
  }
  private activate(): void {
    if (this.selected === LEVELS.length + 1) void this.copy();
    else if (this.selected === LEVELS.length + 2) this.scene.start('Menu');
  }
  private async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(
        createAnalyticsReport(new LocalAnalyticsService(false).load(), new StorageService().load()),
      );
      this.status.setText('INFORME COPIADO');
    } catch {
      this.status.setText('NO SE PUDO COPIAR');
    }
    this.time.delayedCall(1400, () => this.status.setText('CONFIRMAR · ELEGIR    VOLVER · MENÚ'));
  }
  private shutdown(): void {
    this.manager.destroy();
    for (const item of this.choices) item.removeAllListeners();
  }
}
