import Phaser from 'phaser';
import { UI_TOKENS, hexToNumber } from './UiTokens';
import type { UiAuditSnapshot } from './UiAudit';

const textStyle = (size: number, color: string = UI_TOKENS.colors.text, bold = false): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: 'monospace', fontSize: `${size}px`, color, fontStyle: bold ? 'bold' : 'normal',
});
export class ScreenShell {
  readonly audit: UiAuditSnapshot;
  constructor(readonly scene: Phaser.Scene, title: string, subtitle?: string) {
    scene.cameras.main.setBackgroundColor(UI_TOKENS.colors.background);
    scene.add.rectangle(480, 270, 912, 492, hexToNumber(UI_TOKENS.colors.elevated), 0.96)
      .setStrokeStyle(2, hexToNumber(UI_TOKENS.colors.border));
    scene.add.text(40, 28, title, textStyle(UI_TOKENS.typography.screenTitle, UI_TOKENS.colors.focus, true));
    if (subtitle) scene.add.text(40, 66, subtitle, textStyle(UI_TOKENS.typography.body, UI_TOKENS.colors.secondary));
    this.audit = { scene: scene.scene.key, title, focusedId: null, interactiveItems: [], textBlocks: [], panels: [{ id: 'shell', bounds: { x: 24, y: 24, width: 912, height: 492 } }] };
  }
  panel(x: number, y: number, width: number, height: number, id = 'panel', danger = false): Phaser.GameObjects.Rectangle {
    this.audit.panels.push({ id, bounds: { x, y, width, height } });
    return this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, hexToNumber(UI_TOKENS.colors.panel), 1)
      .setStrokeStyle(2, hexToNumber(danger ? UI_TOKENS.colors.danger : UI_TOKENS.colors.border));
  }
  button(id: string, label: string, x: number, y: number, width: number, onPress: () => void, options: { primary?: boolean; destructive?: boolean; disabled?: boolean } = {}) {
    const height = UI_TOKENS.layout.hitHeight;
    const bg = this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, hexToNumber(options.primary ? UI_TOKENS.colors.selected : UI_TOKENS.colors.panel))
      .setStrokeStyle(2, hexToNumber(options.destructive ? UI_TOKENS.colors.danger : options.primary ? UI_TOKENS.colors.focus : UI_TOKENS.colors.border));
    const labelObject = this.scene.add.text(x + 16, y + 12, label, textStyle(UI_TOKENS.typography.body, options.disabled ? UI_TOKENS.colors.disabled : UI_TOKENS.colors.text, Boolean(options.primary)));
    if (!options.disabled) bg.setInteractive({ useHandCursor: true }).on('pointerover', () => this.focus(id)).on('pointerdown', () => { bg.setFillStyle(hexToNumber(UI_TOKENS.colors.selected)); onPress(); });
    this.audit.interactiveItems.push({ id, label, enabled: !options.disabled, destructive: Boolean(options.destructive), bounds: { x, y, width, height } });
    return { bg, label: labelObject, setFocused: (focused: boolean) => bg.setStrokeStyle(focused ? 3 : 2, hexToNumber(focused ? UI_TOKENS.colors.focus : options.destructive ? UI_TOKENS.colors.danger : UI_TOKENS.colors.border)) };
  }
  focus(id: string): void { this.audit.focusedId = id; }
  footer(text: string): void { this.scene.add.text(480, 494, text, textStyle(UI_TOKENS.typography.prompt, UI_TOKENS.colors.warning)).setOrigin(0.5); }
}
export const UiTypography = textStyle;
export const UiTheme = UI_TOKENS;
