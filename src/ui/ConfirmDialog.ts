import Phaser from 'phaser';
import { InputAction } from '../input/InputAction';
import type { InputManager } from '../input/InputManager';
import { eventBus, Events } from '../utils/EventBus';
import { UI_TOKENS, hexToNumber } from './UiTokens';
import { UiTypography } from './UiKit';

export interface ConfirmDialogOptions {
  danger?: boolean; confirmLabel?: string; cancelLabel?: string; confirm?: string; cancel?: string;
  consequences?: string;
}
export class ConfirmDialog {
  private root: Phaser.GameObjects.Container; private armed = false; private focused: 'confirm' | 'cancel';
  private confirmButton: Phaser.GameObjects.Rectangle; private cancelButton: Phaser.GameObjects.Rectangle;
  constructor(scene: Phaser.Scene, title: string, description: string, private confirm: () => void, private cancel: () => void, options: ConfirmDialogOptions = {}) {
    const danger = Boolean(options.danger); this.focused = danger ? 'cancel' : 'confirm';
    const confirmLabel = options.confirmLabel ?? options.confirm ?? 'ACEPTAR'; const cancelLabel = options.cancelLabel ?? options.cancel ?? 'CANCELAR';
    const shade = scene.add.rectangle(480, 270, 960, 540, 0x000000, 0.78).setInteractive();
    const panel = scene.add.rectangle(480, 270, 680, 300, hexToNumber(UI_TOKENS.colors.elevated)).setStrokeStyle(2, hexToNumber(danger ? UI_TOKENS.colors.danger : UI_TOKENS.colors.focus));
    const titleText = scene.add.text(176, 150, title, UiTypography(24, danger ? UI_TOKENS.colors.danger : UI_TOKENS.colors.focus, true));
    const descriptionText = scene.add.text(176, 194, `${description}${options.consequences ? `\n${options.consequences}` : ''}`, { ...UiTypography(16), wordWrap: { width: 608 }, lineSpacing: 7 });
    this.cancelButton = scene.add.rectangle(350, 342, 260, 48, hexToNumber(UI_TOKENS.colors.panel)).setInteractive({ useHandCursor: true }).on('pointerover', () => this.setFocus('cancel')).on('pointerdown', () => this.reject());
    this.confirmButton = scene.add.rectangle(610, 342, 240, 48, hexToNumber(danger ? UI_TOKENS.colors.danger : UI_TOKENS.colors.selected)).setInteractive({ useHandCursor: true }).on('pointerover', () => this.setFocus('confirm')).on('pointerdown', () => this.accept());
    const no = scene.add.text(350, 342, cancelLabel, UiTypography(16, UI_TOKENS.colors.text, true)).setOrigin(0.5);
    const yes = scene.add.text(610, 342, confirmLabel, UiTypography(16, UI_TOKENS.colors.text, true)).setOrigin(0.5);
    const hint = scene.add.text(480, 390, '← → Cambiar opción · Confirmar para elegir · Volver para cancelar', UiTypography(14, UI_TOKENS.colors.secondary)).setOrigin(0.5);
    this.root = scene.add.container(0, 0, [shade, panel, titleText, descriptionText, this.cancelButton, this.confirmButton, no, yes, hint]).setDepth(1000);
    this.paintFocus(); scene.time.delayedCall(0, () => { this.armed = true; }); eventBus.emit(Events.DIALOG_OPENED, title);
  }
  update(input: InputManager): void { if (!this.armed) return; if (input.wasPressed(InputAction.MENU_LEFT) || input.wasPressed(InputAction.MENU_RIGHT)) this.setFocus(this.focused === 'confirm' ? 'cancel' : 'confirm'); else if (input.wasPressed(InputAction.CONFIRM)) { if (this.focused === 'confirm') this.accept(); else this.reject(); } else if (input.wasPressed(InputAction.BACK)) this.reject(); }
  getFocusedButton(): 'confirm' | 'cancel' { return this.focused; }
  private setFocus(value: 'confirm' | 'cancel'): void { this.focused = value; this.paintFocus(); }
  private paintFocus(): void { this.confirmButton.setStrokeStyle(this.focused === 'confirm' ? 4 : 1, hexToNumber(this.focused === 'confirm' ? UI_TOKENS.colors.focus : UI_TOKENS.colors.border)); this.cancelButton.setStrokeStyle(this.focused === 'cancel' ? 4 : 1, hexToNumber(this.focused === 'cancel' ? UI_TOKENS.colors.focus : UI_TOKENS.colors.border)); }
  private accept(): void { if (this.armed) { this.destroy(); this.confirm(); } }
  private reject(): void { if (this.armed) { this.destroy(); this.cancel(); } }
  destroy(): void { this.armed = false; this.root.destroy(true); eventBus.emit(Events.DIALOG_CLOSED); }
}
