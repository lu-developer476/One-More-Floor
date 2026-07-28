import { describe, expect, it } from 'vitest';
import { ACTION_LABELS, DEVICE_LABELS, PROMPT_STYLE_LABELS } from './UiCopy';
import { contrastRatio, UI_TOKENS } from './UiTokens';
import { FocusModel } from './FocusModel';
import { InputAction } from '../input/InputAction';
describe('sistema de UI', () => {
  it('define tokens completos y mínimos legibles', () => { expect(Object.keys(UI_TOKENS.colors)).toHaveLength(15); expect(UI_TOKENS.typography.body).toBeGreaterThanOrEqual(16); expect(UI_TOKENS.layout.hitHeight).toBeGreaterThanOrEqual(44); });
  it('mantiene contraste suficiente', () => { expect(contrastRatio(UI_TOKENS.colors.text, UI_TOKENS.colors.background)).toBeGreaterThanOrEqual(4.5); expect(contrastRatio(UI_TOKENS.colors.focus, UI_TOKENS.colors.background)).toBeGreaterThanOrEqual(4.5); });
  it('traduce acciones y dispositivos', () => { expect(ACTION_LABELS[InputAction.JUMP]).toBe('Saltar'); expect(ACTION_LABELS[InputAction.BACK]).toBe('Volver / cancelar'); expect(DEVICE_LABELS.gamepad).toBe('MANDO'); expect(PROMPT_STYLE_LABELS.generic).toBe('GENÉRICO'); });
  it('omite deshabilitados y restaura foco', () => { const focus = new FocusModel([{ id: 'one' }, { id: 'locked', enabled: false }, { id: 'three' }], 'three'); expect(focus.focused?.id).toBe('three'); expect(focus.move(1)?.id).toBe('one'); expect(focus.move(1)?.id).toBe('three'); expect(focus.focus('locked')).toBe(false); });
});
