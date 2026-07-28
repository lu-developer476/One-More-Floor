import Phaser from 'phaser';
import { StorageService } from '../services/StorageService';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { formatPrompt } from '../input/InputPromptFormatter';
import { TowerCheckpointService } from '../runs/TowerCheckpointService';
import { createTowerFloorRunData } from '../runs/RunContext';
import { LEVELS } from '../config/levelConfig';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { TowerRunCoordinator } from '../runs/TowerRunCoordinator';
import { audioService } from '../services/AudioService';
export class MenuScene extends Phaser.Scene {
  private selected = 0;
  private items: Phaser.GameObjects.Text[] = [];
  private manager!: InputManager;
  private actions: string[] = [];
  private dialog?: ConfirmDialog;
  private transitioning = false;
  constructor() {
    super('Menu');
  }
  getSelection(): number {
    return this.selected;
  }
  getActions(): readonly string[] {
    return this.actions;
  }
  getItemBounds() {
    return this.items.map((item) => {
      const b = item.getBounds();
      return { x: b.x, y: b.y, width: b.width, height: b.height };
    });
  }
  create(): void {
    const save = new StorageService().load(),
      checkpoint = new TowerCheckpointService().load();
    this.manager = new InputManager(this, save.input);
    this.manager.blockInherited();
    this.cameras.main.setBackgroundColor('#071018');
    this.add.tileSprite(480, 270, 960, 540, 'bg-far').setAlpha(0.7);
    this.add
      .text(480, 58, 'ONE MORE FLOOR', {
        fontFamily: 'monospace',
        fontSize: '46px',
        color: '#5ef1ff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(480, 100, 'TOWER RUN · v0.9.2', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#f5c84c',
      })
      .setOrigin(0.5);
    this.actions = checkpoint
      ? [
          'CONTINUAR TOWER RUN',
          'NUEVA TOWER RUN',
          'ABANDONAR TOWER RUN',
          'PISOS',
          'PRÁCTICA',
          'ESTADÍSTICAS',
          'AJUSTES',
          'CRÉDITOS',
        ]
      : ['TOWER RUN', 'PISOS', 'PRÁCTICA', 'ESTADÍSTICAS', 'AJUSTES', 'CRÉDITOS'];
    this.items = this.actions.map((label, i) =>
      this.add
        .text(480, 145 + i * 38, label, {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#91a6b6',
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerover', () => this.select(i))
        .on('pointerdown', () => this.confirm()),
    );
    if (checkpoint)
      this.add.text(
        730,
        160,
        `${checkpoint.state.mode === 'competitive' ? 'COMPETITIVO' : 'ASISTIDO'}\nPISO ${checkpoint.state.nextFloor} DE ${LEVELS.length}\nCOMPLETADOS ${checkpoint.state.results.length}\nTIEMPO ${(checkpoint.state.totalElapsedMs / 1000).toFixed(2)} s\nMUERTES ${checkpoint.state.totalDeaths}`,
        { fontFamily: 'monospace', fontSize: '13px', color: '#d9e7ed' },
      );
    this.add
      .text(
        480,
        505,
        `${formatPrompt(InputAction.CONFIRM, this.manager.activeDevice, save.input)} ACEPTAR · ${formatPrompt(InputAction.BACK, this.manager.activeDevice, save.input)} VOLVER`,
        { fontFamily: 'monospace', fontSize: '13px', color: '#6f8492' },
      )
      .setOrigin(0.5);
    this.select(0);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.manager.destroy());
  }
  update(): void {
    this.manager.poll();
    this.dialog?.update(this.manager);
    if (this.dialog || this.transitioning) return;
    if (this.manager.wasPressed(InputAction.MENU_UP))
      this.select((this.selected + this.items.length - 1) % this.items.length);
    if (this.manager.wasPressed(InputAction.MENU_DOWN))
      this.select((this.selected + 1) % this.items.length);
    if (this.manager.wasPressed(InputAction.CONFIRM)) this.confirm();
    if (this.manager.wasPressed(InputAction.BACK)) audioService.play('menuMove');
  }
  private select(i: number): void {
    this.selected = i;
    this.items.forEach((x, n) => x.setColor(n === i ? '#fff' : '#91a6b6'));
  }
  private confirm(): void {
    const action = this.actions[this.selected];
    if (action === 'TOWER RUN') this.start('TowerSetup');
    else if (action === 'NUEVA TOWER RUN')
      this.confirmDestructive(
        'NUEVA TOWER RUN',
        'Existe una Tower Run pendiente.\nComenzar otra eliminará su checkpoint.',
        () => {
          new TowerRunCoordinator().abandon();
          this.start('TowerSetup');
        },
      );
    else if (action === 'CONTINUAR TOWER RUN') {
      const s = new TowerCheckpointService().load();
      if (s) {
        if (s.state.status === 'between-floors') s.advance();
        new TowerCheckpointService().save(s);
        this.transitioning = true;
        this.scene.start(
          'Level',
          createTowerFloorRunData(s.state.nextFloor - 1, s.state.mode, s.state.sessionId),
        );
      }
    } else if (action === 'ABANDONAR TOWER RUN')
      this.confirmDestructive(
        'ABANDONAR TOWER RUN',
        'Se eliminará el checkpoint pendiente.',
        () => {
          new TowerRunCoordinator().abandon();
          this.scene.restart();
        },
      );
    else if (action === 'PISOS') this.scene.start('FloorSelect', { practice: false });
    else if (action === 'PRÁCTICA') this.scene.start('FloorSelect', { practice: true });
    else if (action === 'ESTADÍSTICAS') this.scene.start('Analytics');
    else if (action === 'AJUSTES') this.scene.start('Settings');
    else
      this.add
        .text(480, 470, 'Diseño y desarrollo: Lucas Montenegro · 100% procedural', {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#fff',
        })
        .setOrigin(0.5);
  }
  private start(scene: string): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.scene.start(scene);
  }
  private confirmDestructive(title: string, description: string, confirm: () => void): void {
    this.dialog = new ConfirmDialog(
      this,
      title,
      description,
      () => {
        this.dialog = undefined;
        confirm();
      },
      () => {
        this.dialog = undefined;
      },
    );
  }
}
