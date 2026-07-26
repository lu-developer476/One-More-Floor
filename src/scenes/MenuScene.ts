import Phaser from 'phaser';
import { StorageService } from '../services/StorageService';
import { LEVELS, TOTAL_FLOORS } from '../config/levelConfig';
import { audioService } from '../services/AudioService';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { formatPrompt } from '../input/InputPromptFormatter';

const INPUT_GUARD_MS = 180;
export class MenuScene extends Phaser.Scene {
  private selected = 0;
  private items: Phaser.GameObjects.Text[] = [];
  private unlocked = 1;
  private readyAt = 0;
  private manager!: InputManager;

  constructor() {
    super('Menu');
  }

  create(): void {
    const save = new StorageService().load();
    audioService.apply(save.settings);
    this.input.once('pointerdown', () => audioService.unlock());
    this.input.keyboard?.once('keydown', () => audioService.unlock());
    this.unlocked = save.unlockedFloor;
    this.manager = new InputManager(this, save.input);
    this.manager.blockInherited();
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
      .text(480, 137, 'INPUT + PRÁCTICA · v0.6.0', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#f5c84c',
      })
      .setOrigin(0.5);
    const options = [
      'JUGAR / CONTINUAR',
      ...LEVELS.map((level, index) => {
        const record = save.floors[String(level.floor)];
        return `${index < this.unlocked ? '' : '🔒 '}PISO ${level.floor} · ${level.name} · PB ${record?.bestTimeMs ? `${(record.bestTimeMs / 1000).toFixed(2)}s` : '--'} · ${record?.rank ?? '-'}${record?.bestGhost ? ' · FANTASMA DISPONIBLE' : ''}`;
      }),
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
      .text(
        480,
        505,
        `${formatPrompt(InputAction.CONFIRM, this.manager.activeDevice, save.input)} ACEPTAR · ${formatPrompt(InputAction.BACK, this.manager.activeDevice, save.input)} VOLVER`,
        {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#6f8492',
        },
      )
      .setOrigin(0.5);
    this.select(0);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  update(): void {
    this.manager.poll();
    if (this.manager.wasPressed(InputAction.MENU_UP)) this.selectPrevious();
    if (this.manager.wasPressed(InputAction.MENU_DOWN)) this.selectNext();
    if (this.manager.wasPressed(InputAction.CONFIRM)) this.confirm();
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
      this.scene.start('RunSetup', { levelIndex: Math.max(0, this.unlocked - 1) });
      return;
    }
    if (index >= 1 && index <= TOTAL_FLOORS) {
      if (index <= this.unlocked) this.scene.start('RunSetup', { levelIndex: index - 1 });
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
    for (const item of this.items) {
      item.off('pointerover', this.onPointerOver, this);
      item.off('pointerdown', this.onPointerDown, this);
    }
  }
}
