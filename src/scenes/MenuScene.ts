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
import { ScreenShell, UiTypography } from '../ui/UiKit';
import { UI_TOKENS } from '../ui/UiTokens';
import { publishUiAudit } from '../ui/UiAudit';
import { announceStatus } from '../utils/EventBus';

type MenuButton = ReturnType<ScreenShell['button']>;
export class MenuScene extends Phaser.Scene {
  private selected = 0; private manager!: InputManager; private actions: string[] = [];
  private buttons: MenuButton[] = []; private dialog?: ConfirmDialog; private transitioning = false;
  private onboarding?: ConfirmDialog; private shell!: ScreenShell;
  constructor() { super('Menu'); }
  getSelection(): number { return this.selected; }
  getActions(): readonly string[] { return this.actions; }
  getItemBounds() { return this.shell.audit.interactiveItems.map(({ bounds }) => bounds); }
  create(): void {
    const save = new StorageService().load(); const checkpoint = new TowerCheckpointService().load();
    this.manager = new InputManager(this, save.input); this.manager.blockInherited();
    this.cameras.main.setBackgroundColor(UI_TOKENS.colors.background);
    this.add.tileSprite(480, 270, 960, 540, 'bg-far').setAlpha(0.35);
    this.shell = new ScreenShell(this, 'ONE MORE FLOOR', 'Plataformas de precisión · Cinco pisos · Tower Run');
    this.add.text(895, 40, `v${__APP_VERSION__}`, UiTypography(14, UI_TOKENS.colors.secondary)).setOrigin(1, 0);
    this.shell.panel(40, 112, 560, 310, 'tower-card');
    this.add.text(64, 132, checkpoint ? 'TOWER RUN EN CURSO' : 'TOWER RUN', UiTypography(22, UI_TOKENS.colors.warning, true));
    this.add.text(64, 166, checkpoint ? 'Retomá tu ascenso desde el último checkpoint.' : 'Encadená los cinco pisos en una sola carrera.', UiTypography(16, UI_TOKENS.colors.secondary));
    if (checkpoint) {
      const state = checkpoint.state;
      this.add.text(64, 204, `Piso actual  ${state.nextFloor}/${LEVELS.length}\nCompletados  ${state.results.length}/${LEVELS.length}\nTiempo       ${(state.totalElapsedMs / 1000).toFixed(2)} s\nMuertes      ${state.totalDeaths}\nModo         ${state.mode === 'competitive' ? 'Competitivo' : 'Asistido'}`, UiTypography(16));
      this.add.rectangle(262, 322, 380, 10, 0x263d49).setOrigin(0, 0.5);
      this.add.rectangle(262, 322, 380 * state.results.length / LEVELS.length, 10, 0x5ef1ff).setOrigin(0, 0.5);
      this.actions = ['CONTINUAR', 'NUEVA PARTIDA', 'ABANDONAR', 'PISOS', 'PRÁCTICA', 'ESTADÍSTICAS', 'AJUSTES', 'AYUDA', 'CRÉDITOS'];
      this.addButton('CONTINUAR', 64, 350, 250, true); this.addButton('NUEVA PARTIDA', 326, 350, 200);
      this.addButton('ABANDONAR', 64, 400, 200, false, true);
    } else {
      this.add.text(64, 212, 'Competitivo guarda PB, ghosts y splits.\nAsistido conserva el progreso sin PB global.', UiTypography(16));
      this.actions = ['INICIAR TOWER RUN', 'PISOS', 'PRÁCTICA', 'ESTADÍSTICAS', 'AJUSTES', 'AYUDA', 'CRÉDITOS'];
      this.addButton('INICIAR TOWER RUN', 64, 350, 300, true);
    }
    this.add.text(632, 116, 'EXPLORAR', UiTypography(20, UI_TOKENS.colors.secondary, true));
    ['PISOS', 'PRÁCTICA', 'ESTADÍSTICAS', 'AJUSTES'].forEach((label, index) => this.addButton(label, 632, 150 + index * 54, 264));
    this.addButton('AYUDA', 632, 382, 126); this.addButton('CRÉDITOS', 770, 382, 126);
    this.shell.footer(`${formatPrompt(InputAction.CONFIRM, this.manager.activeDevice, save.input)} Elegir   ${formatPrompt(InputAction.BACK, this.manager.activeDevice, save.input)} Volver`);
    this.select(0); publishUiAudit(this.shell.audit);
    try { if (!localStorage.getItem('one-more-floor.onboarding')) this.showOnboarding(save); } catch { this.showOnboarding(save); }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.manager.destroy());
  }
  update(): void {
    this.manager.poll(); this.dialog?.update(this.manager); this.onboarding?.update(this.manager);
    if (this.dialog || this.onboarding || this.transitioning) return;
    if (this.manager.wasPressed(InputAction.MENU_UP)) this.select((this.selected + this.actions.length - 1) % this.actions.length);
    if (this.manager.wasPressed(InputAction.MENU_DOWN)) this.select((this.selected + 1) % this.actions.length);
    if (this.manager.wasPressed(InputAction.CONFIRM)) this.confirm();
  }
  private addButton(label: string, x: number, y: number, width: number, primary = false, destructive = false): void {
    const index = this.actions.indexOf(label); this.buttons[index] = this.shell.button(label.toLowerCase().replaceAll(' ', '-'), label, x, y, width, () => { this.select(index); this.confirm(); }, { primary, destructive });
  }
  private select(index: number): void { if (index < 0) return; this.selected = index; this.buttons.forEach((button, i) => button?.setFocused(i === index)); this.shell.focus(this.actions[index]!.toLowerCase().replaceAll(' ', '-')); publishUiAudit(this.shell.audit); announceStatus({ scene: 'Menu', message: `Menú principal. ${this.actions[index]} seleccionada.`, priority: 'polite' }); audioService.play('menuMove'); }
  private confirm(): void {
    const action = this.actions[this.selected];
    if (action === 'INICIAR TOWER RUN') this.start('TowerSetup');
    else if (action === 'NUEVA PARTIDA') this.confirmDestructive('NUEVA TOWER RUN', 'Se eliminará el checkpoint actual. Esta acción no puede deshacerse.', () => { new TowerRunCoordinator().abandon(); this.start('TowerSetup'); });
    else if (action === 'CONTINUAR') { const session = new TowerCheckpointService().load(); if (session) { if (session.state.status === 'between-floors') session.advance(); new TowerCheckpointService().save(session); this.transitioning = true; this.scene.start('Level', createTowerFloorRunData(session.state.nextFloor - 1, session.state.mode, session.state.sessionId)); } }
    else if (action === 'ABANDONAR') this.confirmDestructive('ABANDONAR TOWER RUN', 'Se eliminará el checkpoint pendiente. Esta acción no puede deshacerse.', () => { new TowerRunCoordinator().abandon(); this.scene.restart(); });
    else if (action === 'PISOS') this.scene.start('FloorSelect', { practice: false }); else if (action === 'PRÁCTICA') this.scene.start('FloorSelect', { practice: true });
    else if (action === 'ESTADÍSTICAS') this.scene.start('Analytics'); else if (action === 'AJUSTES') this.scene.start('Settings'); else if (action === 'AYUDA') this.scene.start('Help'); else if (action === 'CRÉDITOS') this.scene.start('Credits');
  }
  private showOnboarding(save: ReturnType<StorageService['load']>): void {
    const controls = `${formatPrompt(InputAction.MOVE_LEFT, this.manager.activeDevice, save.input)} ${formatPrompt(InputAction.MOVE_RIGHT, this.manager.activeDevice, save.input)} Mover  ·  ${formatPrompt(InputAction.JUMP, this.manager.activeDevice, save.input)} Saltar  ·  ${formatPrompt(InputAction.DASH, this.manager.activeDevice, save.input)} Dash`;
    this.onboarding = new ConfirmDialog(this, 'TU OBJETIVO', `Llegá a la salida antes del colapso.\n${controls}`, () => { try { localStorage.setItem('one-more-floor.onboarding', '1'); } catch { /* optional */ } this.onboarding = undefined; this.start('FloorSelect'); }, () => { this.onboarding = undefined; this.scene.start('Help', { onboarding: true }); }, { confirmLabel: 'EMPEZAR', cancelLabel: 'VER AYUDA' });
  }
  private start(scene: string): void { if (!this.transitioning) { this.transitioning = true; this.scene.start(scene); } }
  private confirmDestructive(title: string, description: string, confirm: () => void): void { this.dialog = new ConfirmDialog(this, title, description, () => { this.dialog = undefined; confirm(); }, () => { this.dialog = undefined; }, { danger: true, confirmLabel: title.startsWith('ABANDONAR') ? 'ABANDONAR' : 'NUEVA PARTIDA', cancelLabel: 'CONSERVAR PARTIDA' }); }
}
