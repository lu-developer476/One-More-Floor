import Phaser from 'phaser';
import { UI_TOKENS, hexToNumber } from './UiTokens';
import { publishUiAudit, type UiAuditSnapshot, type UiBounds } from './UiAudit';

const textStyle = (size: number, color: string = UI_TOKENS.colors.text, bold = false): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: 'monospace', fontSize: `${size}px`, color, fontStyle: bold ? 'bold' : 'normal',
});
export interface UiButtonOptions { primary?: boolean; destructive?: boolean; disabled?: boolean; parent?: string }
export interface UiButtonHandle { id: string; bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text; setFocused(value: boolean): void; setEnabled(value: boolean): void; destroy(): void }

/** Owns the sole full-screen surface, heading, content safe-area and footer for a scene. */
export class ScreenShell {
  readonly audit: UiAuditSnapshot;
  private footerObject?: Phaser.GameObjects.Text;
  private components: UiButtonHandle[] = [];
  constructor(readonly scene: Phaser.Scene, title: string, subtitle?: string) {
    scene.cameras.main.setBackgroundColor(UI_TOKENS.colors.background);
    scene.add.rectangle(480, 270, 912, 492, hexToNumber(UI_TOKENS.colors.elevated), 0.96).setStrokeStyle(2, hexToNumber(UI_TOKENS.colors.border));
    scene.add.text(40, 28, title, textStyle(UI_TOKENS.typography.screenTitle, UI_TOKENS.colors.focus, true));
    if (subtitle) scene.add.text(40, 66, subtitle, textStyle(UI_TOKENS.typography.body, UI_TOKENS.colors.secondary));
    this.audit = { scene: scene.scene.key, title, titleCount: 1, footerCount: 0, focusedId: null, interactiveItems: [], textBlocks: [], panels: [{ id: 'shell', bounds: { x: 24, y: 24, width: 912, height: 492 } }] };
    publishUiAudit(this.audit);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }
  panel(x: number, y: number, width: number, height: number, id = 'panel', danger = false): Phaser.GameObjects.Rectangle {
    this.audit.panels.push({ id, bounds: { x, y, width, height } }); this.publish();
    return this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, hexToNumber(UI_TOKENS.colors.panel), 1).setStrokeStyle(2, hexToNumber(danger ? UI_TOKENS.colors.danger : UI_TOKENS.colors.border));
  }
  button(id: string, label: string, x: number, y: number, width: number, onPress: () => void, options: UiButtonOptions = {}): UiButtonHandle {
    const height = UI_TOKENS.layout.hitHeight; let enabled = !options.disabled;
    const bg = this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, hexToNumber(options.primary ? UI_TOKENS.colors.selected : UI_TOKENS.colors.panel));
    const labelObject = this.scene.add.text(x + 16, y + 12, label, textStyle(UI_TOKENS.typography.body));
    const metadata = { id, type: 'button', role: 'button', label, enabled, destructive: Boolean(options.destructive), focused: false, parentPanel: options.parent ?? 'shell', bounds: { x, y, width, height }, fontSize: UI_TOKENS.typography.body };
    const paint = () => { bg.setFillStyle(hexToNumber(metadata.focused ? UI_TOKENS.colors.selected : UI_TOKENS.colors.panel)); bg.setStrokeStyle(metadata.focused ? 3 : 2, hexToNumber(metadata.focused ? UI_TOKENS.colors.focus : metadata.destructive ? UI_TOKENS.colors.danger : UI_TOKENS.colors.border)); labelObject.setColor(enabled ? UI_TOKENS.colors.text : UI_TOKENS.colors.disabled); };
    const focus = () => { if (enabled) { this.focus(id); paint(); } };
    bg.setInteractive({ useHandCursor: enabled }).on('pointerover', focus).on('pointerdown', () => { if (enabled) onPress(); }); paint();
    this.audit.interactiveItems.push(metadata); this.publish();
    const handle: UiButtonHandle = { id, bg, label: labelObject, setFocused: value => { metadata.focused = value && enabled; paint(); this.publish(); }, setEnabled: value => { enabled = value; metadata.enabled = value; paint(); this.publish(); }, destroy: () => { bg.removeAllListeners(); bg.destroy(); labelObject.destroy(); const at = this.audit.interactiveItems.indexOf(metadata); if (at >= 0) this.audit.interactiveItems.splice(at, 1); } };
    this.components.push(handle); return handle;
  }
  toggle(id: string, label: string, value: boolean, x: number, y: number, width: number, onToggle: () => void, parent = 'panel'): UiButtonHandle { return this.button(id, `${label}                       ${value ? 'SÍ' : 'NO'}`, x, y, width, onToggle, { parent }); }
  slider(id: string, label: string, value: number, x: number, y: number, width: number, onChange: () => void, parent = 'panel'): UiButtonHandle { const bars = Math.round(value * 10); return this.button(id, `${label}  ${'■'.repeat(bars)}${'·'.repeat(10 - bars)}  ${Math.round(value * 100)}%`, x, y, width, onChange, { parent }); }
  tabs(items: readonly { id: string; label: string; onPress: () => void }[], x: number, y: number, width: number, vertical = false): UiButtonHandle[] { const size = vertical ? width : width / items.length; return items.map((item, index) => this.button(item.id, item.label, vertical ? x : x + index * size, vertical ? y + index * 50 : y, vertical ? width : size - 8, item.onPress, { parent: 'tabs' })); }
  badge(text: string, x: number, y: number, danger = false): Phaser.GameObjects.Text { return this.scene.add.text(x, y, text, textStyle(16, danger ? UI_TOKENS.colors.danger : UI_TOKENS.colors.success, true)); }
  focus(id: string): void { this.audit.focusedId = id; for (const item of this.audit.interactiveItems) item.focused = item.id === id; for (const component of this.components) component.setFocused(component.id === id); this.publish(); }
  footer(text: string): void { this.footerObject?.destroy(); this.footerObject = this.scene.add.text(480, 494, text, textStyle(UI_TOKENS.typography.prompt, UI_TOKENS.colors.warning)).setOrigin(0.5); this.audit.footerCount = 1; this.publish(); }
  publish(): void { publishUiAudit(this.audit); }
  destroy(): void { this.components.splice(0).forEach(item => item.destroy()); }
}

export class UiFocusController {
  private index = 0;
  constructor(private shell: ScreenShell, private items: UiButtonHandle[]) { this.apply(); }
  move(delta: number): void { if (!this.items.length) return; this.index = (this.index + delta + this.items.length) % this.items.length; this.apply(); }
  focus(id: string): void { const index = this.items.findIndex(item => item.id === id); if (index >= 0) { this.index = index; this.apply(); } }
  get id(): string | null { return this.items[this.index]?.id ?? null; }
  replace(items: UiButtonHandle[], initial = 0): void { this.items = items; this.index = Math.min(initial, Math.max(0, items.length - 1)); this.apply(); }
  private apply(): void { this.items.forEach((item, index) => item.setFocused(index === this.index)); const item = this.items[this.index]; if (item) this.shell.focus(item.id); }
  destroy(): void { this.items = []; }
}
export const UiTypography = textStyle;
export const UiTheme = UI_TOKENS;
export type { UiBounds };
