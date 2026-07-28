import Phaser from 'phaser';
import { UI_TOKENS, hexToNumber } from './UiTokens';
import { UiTypography } from './UiKit';
export type ToastVariant = 'info' | 'success' | 'warning' | 'error';
export class ToastController {
  private current?: Phaser.GameObjects.Container; private timer?: Phaser.Time.TimerEvent;
  constructor(private scene: Phaser.Scene) {}
  show(message: string, variant: ToastVariant = 'info', duration = 2600): void { this.current?.destroy(true); this.timer?.remove(false); const colors = { info: UI_TOKENS.colors.primary, success: UI_TOKENS.colors.success, warning: UI_TOKENS.colors.warning, error: UI_TOKENS.colors.danger }; const panel = this.scene.add.rectangle(480, 446, 600, 46, hexToNumber(UI_TOKENS.colors.elevated)).setStrokeStyle(2, hexToNumber(colors[variant])); const text = this.scene.add.text(480, 446, message, UiTypography(16)).setOrigin(0.5); this.current = this.scene.add.container(0, 0, [panel, text]).setDepth(900); this.timer = this.scene.time.delayedCall(duration, () => { this.current?.destroy(true); this.current = undefined; }); }
  destroy(): void { this.timer?.remove(false); this.current?.destroy(true); }
}
