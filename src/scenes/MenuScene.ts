import Phaser from 'phaser';
import { StorageService } from '../services/StorageService';
import { LEVELS, TOTAL_FLOORS } from '../config/levelConfig';
import { audioService } from '../services/AudioService';

const INPUT_GUARD_MS = 180;
export class MenuScene extends Phaser.Scene {
  private selected = 0;
  private items: Phaser.GameObjects.Text[] = [];
  private unlocked = 1;
  private readyAt = 0;
  private lastPadVertical = 0;
  private lastPadConfirm = false;
  constructor() {
    super('Menu');
  }

  create(): void {
    const save = new StorageService().load();
    audioService.apply(save.settings);
    this.input.once('pointerdown', () => audioService.unlock());
    this.input.keyboard?.once('keydown', () => audioService.unlock());
    this.unlocked = save.unlockedFloor;
    this.readyAt = this.time.now + INPUT_GUARD_MS;
    this.items = [];
    this.cameras.main.setBackgroundColor('#071018');
    this.add.tileSprite(480, 270, 960, 540, 'bg-far').setAlpha(0.7);
    this.add
      .text(480, 85, 'ONE MORE FLOOR', {
        fontFamily: 'monospace',
        fontSize: '54px',
        color: '#5ef1ff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(480, 137, 'CONTRARRELOJ LOCAL · v0.5.0', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#f5c84c',
      })
      .setOrigin(0.5);
    const options = [
      'JUGAR / CONTINUAR',
      ...LEVELS.map((level, index) => { const record = save.floors[String(level.floor)]; return `${index < this.unlocked ? '' : '🔒 '}PISO ${level.floor} · ${level.name} · PB ${record?.bestTimeMs ? `${(record.bestTimeMs / 1000).toFixed(2)}s` : '--'} · ${record?.rank ?? '-'}${record?.bestGhost ? ' · FANTASMA DISPONIBLE' : ''}`; }),
      'AJUSTES',
      'CRÉDITOS',
    ];
    options.forEach((label, index) => {
      const item = this.add
        .text(480, 190 + index * 34, label, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#91a6b6',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      item.setData('menuIndex', index);
      item.on('pointerover', this.onPointerOver, this);
      item.on('pointerdown', this.onPointerDown, this);
      this.items.push(item);
    });
    this.add
      .text(480, 505, '↑↓ NAVEGAR · ENTER/A ACEPTAR · WASD/FLECHAS · ESPACIO · SHIFT/RB', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#6f8492',
      })
      .setOrigin(0.5);
    this.select(0);
    this.input.keyboard?.on('keydown-UP', this.selectPrevious, this);
    this.input.keyboard?.on('keydown-DOWN', this.selectNext, this);
    this.input.keyboard?.on('keydown-ENTER', this.confirm, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  update(): void {
    const pad = this.input.gamepad?.getPad(0);
    const vertical = pad && Math.abs(pad.leftStick.y) > 0.55 ? Math.sign(pad.leftStick.y) : 0;
    if (vertical !== 0 && this.lastPadVertical === 0) {
      if (vertical > 0) this.selectNext();
      else this.selectPrevious();
    }
    const confirm = Boolean(pad?.A);
    if (confirm && !this.lastPadConfirm) this.confirm();
    this.lastPadVertical = vertical;
    this.lastPadConfirm = confirm;
  }

  private onPointerOver(pointer: Phaser.Input.Pointer): void {
    const target = this.input
      .hitTestPointer(pointer)
      .find((object) => object instanceof Phaser.GameObjects.Text);
    if (target) this.select(Number(target.getData('menuIndex')));
  }
  private onPointerDown(): void {
    this.confirm();
  }
  private selectPrevious(): void {
    this.select((this.selected - 1 + this.items.length) % this.items.length);
  }
  private selectNext(): void {
    this.select((this.selected + 1) % this.items.length);
  }
  private confirm(): void {
    if (this.time.now >= this.readyAt) this.activate(this.selected);
  }
  private select(index: number): void {
    this.selected = index;
    this.items.forEach((item, i) =>
      item.setColor(i === index ? '#ffffff' : '#91a6b6').setScale(i === index ? 1.06 : 1),
    );
  }

  private activate(index: number): void {
    if (index === 0) {
      this.scene.start('Level', { levelIndex: Math.max(0, this.unlocked - 1) });
      return;
    }
    if (index >= 1 && index <= TOTAL_FLOORS) {
      if (index <= this.unlocked) this.scene.start('Level', { levelIndex: index - 1 });
      return;
    }
    if (index === TOTAL_FLOORS + 1) this.scene.start('Settings');
    else
      this.add
        .text(480, 475, 'Diseño y desarrollo: Lucas Montenegro · Recursos 100% procedurales', {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#fff',
        })
        .setOrigin(0.5);
  }

  private shutdown(): void {
    this.input.keyboard?.off('keydown-UP', this.selectPrevious, this);
    this.input.keyboard?.off('keydown-DOWN', this.selectNext, this);
    this.input.keyboard?.off('keydown-ENTER', this.confirm, this);
    for (const item of this.items) {
      item.off('pointerover', this.onPointerOver, this);
      item.off('pointerdown', this.onPointerDown, this);
    }
  }
}
