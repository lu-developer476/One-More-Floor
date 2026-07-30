import { ScreenShell } from '../ui/UiKit';
import Phaser from 'phaser';
import { StorageService, type Settings } from '../services/StorageService';
import { audioService } from '../services/AudioService';
import { eventBus, Events } from '../utils/EventBus';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { LocalAnalyticsService } from '../analytics/LocalAnalyticsService';

const labels: readonly (
  | keyof Settings
  | 'controls'
  | 'copyBackup'
  | 'importBackup'
  | 'reset'
  | 'clearGhosts'
  | 'clearRecords'
  | 'clearAnalytics'
  | 'resetProgress'
  | 'back'
)[] = [
  'volume',
  'mute',
  'screenShake',
  'reducedShake',
  'reduceFlashes',
  'highContrast',
  'showGhost',
  'localAnalyticsEnabled',
  'particleIntensity',
  'fullscreen',
  'controls',
  'copyBackup',
  'importBackup',
  'clearGhosts',
  'clearRecords',
  'clearAnalytics',
  'resetProgress',
  'reset',
  'back',
];
const names: Record<(typeof labels)[number], string> = {
  volume: 'VOLUMEN',
  mute: 'SILENCIO',
  screenShake: 'SACUDIDA DE CÁMARA',
  reducedShake: 'INTENSIDAD REDUCIDA',
  reduceFlashes: 'REDUCIR FLASHES',
  highContrast: 'ALTO CONTRASTE',
  showGhost: 'MOSTRAR FANTASMA',
  localAnalyticsEnabled: 'ESTADÍSTICAS LOCALES',
  particleIntensity: 'INTENSIDAD DE PARTÍCULAS',
  fullscreen: 'PANTALLA COMPLETA',
  controls: 'PERSONALIZAR CONTROLES',
  copyBackup: 'COPIAR COPIA DE SEGURIDAD',
  importBackup: 'IMPORTAR DESDE PORTAPAPELES',
  clearGhosts: 'BORRAR FANTASMAS',
  clearRecords: 'BORRAR RÉCORDS',
  clearAnalytics: 'BORRAR ESTADÍSTICAS LOCALES',
  resetProgress: 'BORRAR TODO EL PROGRESO',
  reset: 'RESTAURAR AJUSTES',
  back: 'VOLVER',
};

export class SettingsScene extends Phaser.Scene {
  private selected = 0;
  private items: Phaser.GameObjects.Text[] = [];
  private service = new StorageService();
  private settings!: Settings;
  private manager!: InputManager;
  private dialog?: ConfirmDialog;
  constructor() {
    super('Settings');
  }

  create(): void {
    new ScreenShell(this, 'AJUSTES', 'Navegación accesible · foco visible · volver siempre disponible');
    const save = this.service.load();
    this.settings = save.settings;
    this.manager = new InputManager(this, save.input);
    this.manager.blockInherited();
    this.add.rectangle(480, 270, 700, 500, 0x071018, 0.97).setStrokeStyle(2, 0x5ef1ff);
    this.add
      .text(480, 28, 'AJUSTES', { fontFamily: 'monospace', fontSize: '32px', color: '#5ef1ff' })
      .setOrigin(0.5);
    this.add.text(150, 92, 'AUDIO\n\nIMAGEN Y ACCESIBILIDAD\n\nJUGABILIDAD\n\nCONTROLES\n\nDATOS LOCALES', {
      fontFamily: 'monospace', fontSize: '16px', color: '#d9e7ed', lineSpacing: 12,
    });
    this.add.rectangle(480, 455, 620, 58, 0x301018, 0.75).setStrokeStyle(2, 0xff405c);
    this.add.text(480, 455, 'ZONA DE PELIGRO · BORRAR TODO EL PROGRESO', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ff8192',
    }).setOrigin(0.5);
    this.items = labels.map((_key, index) => {
      const item = this.add
        .text(620, 88 + index * 44, '', {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#91a6b6',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      item.setVisible(index < 6);
      item.on('pointerover', () => this.select(index));
      item.on('pointerdown', () => this.change(1));
      return item;
    });
    this.scale.on('enterfullscreen', this.syncFullscreen, this);
    this.scale.on('leavefullscreen', this.syncFullscreen, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.select(0);
  }

  update(): void {
    this.manager.poll();
    if (this.dialog) {
      this.dialog.update(this.manager);
      return;
    }
    if (this.manager.wasPressed(InputAction.MENU_UP)) this.previous();
    if (this.manager.wasPressed(InputAction.MENU_DOWN)) this.next();
    if (this.manager.wasPressed(InputAction.MENU_LEFT)) this.decrease();
    if (
      this.manager.wasPressed(InputAction.MENU_RIGHT) ||
      this.manager.wasPressed(InputAction.CONFIRM)
    )
      this.increase();
    if (this.manager.wasPressed(InputAction.BACK)) this.back();
  }

  private previous(): void {
    this.select((this.selected - 1 + labels.length) % labels.length);
  }
  private next(): void {
    this.select((this.selected + 1) % labels.length);
  }
  private decrease(): void {
    this.change(-1);
  }
  private increase(): void {
    this.change(1);
  }
  private select(index: number): void {
    this.selected = index;
    this.render();
    audioService.play('menuMove');
  }
  private value(key: (typeof labels)[number]): string {
    if (
      key === 'controls' ||
      key === 'copyBackup' ||
      key === 'importBackup' ||
      key === 'reset' ||
      key === 'clearGhosts' ||
      key === 'clearRecords' ||
      key === 'clearAnalytics' ||
      key === 'resetProgress' ||
      key === 'back'
    )
      return '';
    if (key === 'volume') return `${Math.round(this.settings.volume * 100)}%`;
    if (key === 'particleIntensity')
      return { normal: 'NORMAL', reduced: 'REDUCIDA', off: 'DESACTIVADA' }[
        this.settings.particleIntensity
      ];
    return this.settings[key] ? 'SÍ' : 'NO';
  }
  private render(): void {
    this.items.forEach((item, index) => {
      const key = labels[index]!;
      const scrollStart = Phaser.Math.Clamp(this.selected - 2, 0, labels.length - 6);
      item
        .setVisible(index >= scrollStart && index < scrollStart + 6)
        .setY(104 + (index - scrollStart) * 52)
        .setText(
          `${index === this.selected ? '▶ ' : '  '}${names[key]}${this.value(key) ? `: ${this.value(key)}` : ''}`,
        )
        .setColor(index === this.selected ? '#ffffff' : '#91a6b6');
    });
  }
  private change(direction: number): void {
    const key = labels[this.selected]!;
    if (key === 'back') return this.back();
    if (key === 'controls') {
      this.scene.pause();
      this.scene.launch('Controls');
      return;
    }
    if (key === 'copyBackup') {
      void this.copyBackup();
      return;
    }
    if (key === 'importBackup') {
      this.confirmImport();
      return;
    }
    if (
      key === 'clearGhosts' ||
      key === 'clearRecords' ||
      key === 'clearAnalytics' ||
      key === 'resetProgress'
    ) {
      this.dialog = new ConfirmDialog(
        this,
        'CONFIRMAR',
        names[key],
        () => {
          this.dialog = undefined;
          if (key === 'clearGhosts') this.service.clearGhosts();
          else if (key === 'clearRecords') this.service.clearRecords();
          else if (key === 'clearAnalytics') new LocalAnalyticsService().clear();
          else {
            this.service.resetProgress();
            this.settings = this.service.load().settings;
          }
          this.persist();
        },
        () => {
          this.dialog = undefined;
        },
      );
      return;
    }
    if (key === 'reset')
      this.settings = new StorageService({
        getItem: () => null,
        setItem: () => undefined,
      }).load().settings;
    else if (key === 'volume')
      this.settings.volume = Phaser.Math.Clamp(
        Math.round((this.settings.volume + direction * 0.1) * 10) / 10,
        0,
        1,
      );
    else if (key === 'particleIntensity') {
      const values: Settings['particleIntensity'][] = ['normal', 'reduced', 'off'];
      const at = values.indexOf(this.settings.particleIntensity);
      this.settings.particleIntensity = values[(at + direction + values.length) % values.length]!;
    } else if (key === 'fullscreen') {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
      return;
    } else this.settings[key] = !this.settings[key];
    this.persist();
  }
  private async copyBackup(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.service.exportBackup());
      this.showMessage('COPIA GUARDADA EN PORTAPAPELES');
    } catch {
      this.showMessage('PORTAPAPELES NO DISPONIBLE');
    }
  }
  private confirmImport(): void {
    this.dialog = new ConfirmDialog(
      this,
      'IMPORTAR DATOS',
      'Una copia válida reemplazará los datos locales.',
      () => {
        this.dialog = undefined;
        void this.importBackup();
      },
      () => {
        this.dialog = undefined;
      },
    );
  }
  private async importBackup(): Promise<void> {
    try {
      const result = this.service.importBackup(await navigator.clipboard.readText());
      this.showMessage(result.ok ? 'COPIA IMPORTADA' : (result.error ?? 'IMPORTACIÓN RECHAZADA'));
      if (result.ok) {
        const save = this.service.load();
        this.settings = save.settings;
        this.manager.setSettings(save.input);
        this.render();
      }
    } catch {
      this.showMessage('PORTAPAPELES NO DISPONIBLE');
    }
  }
  private showMessage(message: string): void {
    const text = this.add
      .text(480, 515, message, { fontFamily: 'monospace', fontSize: '16px', color: '#f5c84c' })
      .setOrigin(0.5);
    this.time.delayedCall(2500, () => text.destroy());
  }
  private persist(): void {
    const save = this.service.load();
    save.settings = { ...this.settings };
    this.service.save(save);
    audioService.apply(this.settings);
    audioService.play('menuConfirm');
    eventBus.emit(Events.SETTINGS_CHANGED, this.settings);
    this.render();
  }
  private syncFullscreen(): void {
    this.settings.fullscreen = this.scale.isFullscreen;
    this.persist();
  }
  private back(): void {
    this.scene.stop();
    if (this.scene.isPaused('Pause')) this.scene.resume('Pause');
    else if (!this.scene.isActive('Menu')) this.scene.start('Menu');
  }
  private shutdown(): void {
    this.manager.destroy();
    this.scale.off('enterfullscreen', this.syncFullscreen, this);
    this.scale.off('leavefullscreen', this.syncFullscreen, this);
  }
}
