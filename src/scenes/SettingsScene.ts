import Phaser from 'phaser';
import { StorageService, type Settings } from '../services/StorageService';
import { audioService } from '../services/AudioService';
import { eventBus, Events } from '../utils/EventBus';

const labels: readonly (keyof Settings | 'reset' | 'clearGhosts' | 'clearRecords' | 'resetProgress' | 'back')[] = [
  'volume',
  'mute',
  'screenShake',
  'reducedShake',
  'reduceFlashes',
  'highContrast',
  'showGhost',
  'fullscreen',
  'clearGhosts',
  'clearRecords',
  'resetProgress',
  'reset',
  'back',
];
const names: Record<(typeof labels)[number], string> = {
  volume: 'VOLUMEN',
  mute: 'SILENCIO',
  screenShake: 'SCREEN SHAKE',
  reducedShake: 'INTENSIDAD REDUCIDA',
  reduceFlashes: 'REDUCIR FLASHES',
  highContrast: 'ALTO CONTRASTE',
  showGhost: 'MOSTRAR FANTASMA',
  fullscreen: 'PANTALLA COMPLETA',
  clearGhosts: 'BORRAR FANTASMAS',
  clearRecords: 'BORRAR RÉCORDS',
  resetProgress: 'BORRAR TODO EL PROGRESO',
  reset: 'RESTAURAR PREDETERMINADOS',
  back: 'VOLVER',
};

export class SettingsScene extends Phaser.Scene {
  private selected = 0;
  private items: Phaser.GameObjects.Text[] = [];
  private service = new StorageService();
  private settings!: Settings;
  private lastPadY = 0;
  private lastPadConfirm = false;
  constructor() {
    super('Settings');
  }

  create(): void {
    this.settings = this.service.load().settings;
    this.add.rectangle(480, 270, 700, 500, 0x071018, 0.97).setStrokeStyle(2, 0x5ef1ff);
    this.add
      .text(480, 48, 'AJUSTES', { fontFamily: 'monospace', fontSize: '32px', color: '#5ef1ff' })
      .setOrigin(0.5);
    this.items = labels.map((_key, index) => {
      const item = this.add
        .text(480, 88 + index * 32, '', {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#91a6b6',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      item.on('pointerover', () => this.select(index));
      item.on('pointerdown', () => this.change(1));
      return item;
    });
    this.input.keyboard?.on('keydown-UP', this.previous, this);
    this.input.keyboard?.on('keydown-DOWN', this.next, this);
    this.input.keyboard?.on('keydown-LEFT', this.decrease, this);
    this.input.keyboard?.on('keydown-RIGHT', this.increase, this);
    this.input.keyboard?.on('keydown-ENTER', this.increase, this);
    this.input.keyboard?.on('keydown-ESC', this.back, this);
    this.scale.on('enterfullscreen', this.syncFullscreen, this);
    this.scale.on('leavefullscreen', this.syncFullscreen, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.select(0);
  }

  update(): void {
    const pad = this.input.gamepad?.getPad(0);
    const y = pad && Math.abs(pad.leftStick.y) > 0.55 ? Math.sign(pad.leftStick.y) : 0;
    if (y && !this.lastPadY) {
      if (y > 0) this.next();
      else this.previous();
    }
    const confirm = Boolean(pad?.A);
    if (confirm && !this.lastPadConfirm) this.change(1);
    if (pad?.B) this.back();
    this.lastPadY = y;
    this.lastPadConfirm = confirm;
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
    if (key === 'reset' || key === 'clearGhosts' || key === 'clearRecords' || key === 'resetProgress' || key === 'back') return '';
    if (key === 'volume') return `${Math.round(this.settings.volume * 100)}%`;
    return this.settings[key] ? 'SÍ' : 'NO';
  }
  private render(): void {
    this.items.forEach((item, index) => {
      const key = labels[index]!;
      item
        .setText(
          `${index === this.selected ? '▶ ' : '  '}${names[key]}${this.value(key) ? `: ${this.value(key)}` : ''}`,
        )
        .setColor(index === this.selected ? '#ffffff' : '#91a6b6');
    });
  }
  private change(direction: number): void {
    const key = labels[this.selected]!;
    if (key === 'back') return this.back();
    if (key === 'clearGhosts' || key === 'clearRecords' || key === 'resetProgress') {
      if (!window.confirm(`¿CONFIRMAR ${names[key]}?`)) return;
      if (key === 'clearGhosts') this.service.clearGhosts();
      else if (key === 'clearRecords') this.service.clearRecords();
      else { this.service.resetProgress(); this.settings = this.service.load().settings; }
      this.persist(); return;
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
    else if (key === 'fullscreen') {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
      return;
    } else this.settings[key] = !this.settings[key];
    this.persist();
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
    this.input.keyboard?.off('keydown-UP', this.previous, this);
    this.input.keyboard?.off('keydown-DOWN', this.next, this);
    this.input.keyboard?.off('keydown-LEFT', this.decrease, this);
    this.input.keyboard?.off('keydown-RIGHT', this.increase, this);
    this.input.keyboard?.off('keydown-ENTER', this.increase, this);
    this.input.keyboard?.off('keydown-ESC', this.back, this);
    this.scale.off('enterfullscreen', this.syncFullscreen, this);
    this.scale.off('leavefullscreen', this.syncFullscreen, this);
  }
}
