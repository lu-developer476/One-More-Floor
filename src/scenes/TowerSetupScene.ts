import Phaser from 'phaser';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { formatPrompt } from '../input/InputPromptFormatter';
import { StorageService } from '../services/StorageService';
import { TowerRunSession } from '../runs/TowerRunSession';
import { TowerCheckpointService } from '../runs/TowerCheckpointService';
import { createTowerFloorRunData } from '../runs/RunContext';
import { LocalAnalyticsService } from '../analytics/LocalAnalyticsService';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { TowerRunCoordinator } from '../runs/TowerRunCoordinator';
export class TowerSetupScene extends Phaser.Scene {
  private selected = 0;
  private manager!: InputManager;
  private items: Phaser.GameObjects.Text[] = [];
  private dialog?: ConfirmDialog;
  private transitioning = false;
  constructor() {
    super('TowerSetup');
  }
  create(): void {
    const save = new StorageService().load();
    this.manager = new InputManager(this, save.input);
    this.manager.blockInherited();
    this.cameras.main.setBackgroundColor('#071018');
    this.add
      .text(480, 64, 'TOWER RUN', { fontFamily: 'monospace', fontSize: '42px', color: '#5ef1ff' })
      .setOrigin(0.5);
    this.add
      .text(
        480,
        155,
        'COMPETITIVO\nRécord y rango global · records y ghosts individuales · sin ayudas\n\nASISTIDO\nCompleta y progresa · sin récord global ni ghosts competitivos',
        {
          fontFamily: 'monospace',
          fontSize: '17px',
          color: '#d9e7ed',
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);
    this.items = ['COMPETITIVO', 'ASISTIDO', 'VOLVER'].map((label, i) =>
      this.add
        .text(480, 320 + i * 46, label, {
          fontFamily: 'monospace',
          fontSize: '21px',
          color: '#91a6b6',
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerover', () => this.select(i))
        .on('pointerdown', () => this.confirm()),
    );
    this.add
      .text(
        480,
        485,
        `${formatPrompt(InputAction.CONFIRM, this.manager.activeDevice, save.input)} ACEPTAR · ${formatPrompt(InputAction.BACK, this.manager.activeDevice, save.input)} VOLVER`,
        { fontFamily: 'monospace', fontSize: '14px', color: '#f5c84c' },
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
    if (this.manager.wasPressed(InputAction.BACK)) this.scene.start('Menu');
    if (this.manager.wasPressed(InputAction.CONFIRM)) this.confirm();
  }
  private select(i: number): void {
    this.selected = i;
    this.items.forEach((item, x) => item.setColor(x === i ? '#ffffff' : '#91a6b6'));
  }
  private confirm(): void {
    if (this.selected === 2) {
      this.scene.start('Menu');
      return;
    }
    if (new TowerCheckpointService().load()) {
      this.dialog = new ConfirmDialog(
        this,
        'NUEVA TOWER RUN',
        'Existe una Tower Run pendiente.\nComenzar otra eliminará su checkpoint.',
        () => {
          this.dialog = undefined;
          new TowerRunCoordinator().abandon();
          this.begin();
        },
        () => {
          this.dialog = undefined;
        },
        { confirm: 'COMENZAR NUEVA', cancel: 'CANCELAR' },
      );
      return;
    }
    this.begin();
  }
  private begin(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    const session = TowerRunSession.start(this.selected === 0 ? 'competitive' : 'assisted');
    new TowerCheckpointService().save(session);
    const save = new StorageService().load();
    new LocalAnalyticsService(save.settings.localAnalyticsEnabled).towerStart(session.state.mode);
    this.scene.start(
      'Level',
      createTowerFloorRunData(0, session.state.mode, session.state.sessionId),
    );
  }
}
