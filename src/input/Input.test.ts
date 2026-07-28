import { describe, expect, it } from 'vitest';
import { InputAction } from './InputAction';
import { defaultInputSettings } from './InputBindings';
import {
  bindingConflict,
  isValidButton,
  isValidKeyCode,
  swapBinding,
  validateInputSettings,
} from './InputValidation';
import { InputState } from './InputManager';
import { formatKey, formatPrompt } from './InputPromptFormatter';
describe('input', () => {
  it('provides valid defaults and isolated recovery', () => {
    const defaults = defaultInputSettings();
    expect(defaults.keyboard).toMatchObject({
      MOVE_LEFT: 'ArrowLeft',
      MOVE_RIGHT: 'ArrowRight',
      JUMP: 'Space',
      DASH: 'KeyS',
      PAUSE: 'KeyP',
      RESTART: 'KeyR',
    });
    expect(defaults.keyboardLayoutVersion).toBe(2);
    expect(defaults.gamepad).toMatchObject({ JUMP: 0, DASH: 5, PAUSE: 9, RESTART: 4 });
    expect(
      validateInputSettings({ keyboard: { JUMP: 'bad value' }, deadZone: 4 }).keyboard.JUMP,
    ).toBe('Space');
  });
  it('validates keys and buttons', () => {
    expect(isValidKeyCode('KeyQ')).toBe(true);
    expect(isValidKeyCode('F5')).toBe(false);
    expect(isValidButton(31)).toBe(true);
    expect(isValidButton(32)).toBe(false);
  });
  it('detects and swaps conflicts', () => {
    const b = defaultInputSettings().keyboard;
    expect(bindingConflict(b, InputAction.JUMP, 'KeyS')).toBe(InputAction.DASH);
    const swapped = swapBinding(b, InputAction.JUMP, 'KeyS');
    expect(swapped.DASH).toBe('Space');
  });
  it('permits shared bindings across domains but not within a domain', () => {
    const bindings = defaultInputSettings().keyboard;
    expect(bindingConflict(bindings, InputAction.MOVE_LEFT, 'ArrowLeft')).toBeNull();
    expect(bindingConflict(bindings, InputAction.MOVE_RIGHT, 'ArrowRight')).toBeNull();
    expect(bindingConflict(bindings, InputAction.MOVE_LEFT, 'ArrowRight')).toBe(
      InputAction.MOVE_RIGHT,
    );
    expect(bindingConflict(bindings, InputAction.CONFIRM, 'Escape')).toBe(InputAction.BACK);
  });
  it('exposes down pressed released once', () => {
    const state = new InputState(defaultInputSettings());
    state.update({ keys: new Set(['Space']) });
    expect(state.wasPressed(InputAction.JUMP)).toBe(true);
    state.update({ keys: new Set(['Space']) });
    expect(state.wasPressed(InputAction.JUMP)).toBe(false);
    expect(state.isDown(InputAction.JUMP)).toBe(true);
    state.update({ keys: new Set() });
    expect(state.wasReleased(InputAction.JUMP)).toBe(true);
    state.update({ keys: new Set() });
    expect(state.wasReleased(InputAction.JUMP)).toBe(false);
  });
  it.each([
    ['ArrowLeft', InputAction.MOVE_LEFT],
    ['ArrowRight', InputAction.MOVE_RIGHT],
    ['Space', InputAction.JUMP],
    ['KeyS', InputAction.DASH],
    ['KeyP', InputAction.PAUSE],
    ['Escape', InputAction.BACK],
    ['Enter', InputAction.CONFIRM],
  ])('maps DOM code %s to %s', (code, action) => {
    const state = new InputState(defaultInputSettings());
    state.update({ keys: new Set([code]) });
    expect(state.wasPressed(action)).toBe(true);
  });
  it('does not map legacy gameplay defaults', () => {
    const state = new InputState(defaultInputSettings());
    state.update({ keys: new Set(['KeyA', 'KeyD', 'KeyW', 'ArrowUp', 'ShiftLeft', 'Escape']) });
    expect(state.axisX).toBe(0);
    expect(state.wasPressed(InputAction.JUMP)).toBe(false);
    expect(state.wasPressed(InputAction.DASH)).toBe(false);
    expect(state.wasPressed(InputAction.PAUSE)).toBe(false);
    expect(state.wasPressed(InputAction.BACK)).toBe(true);
  });
  it('formats layout 2 prompts without physical-code labels', () => {
    const settings = defaultInputSettings();
    expect(
      ['ArrowLeft', 'ArrowRight', 'Space', 'KeyS', 'KeyP', 'KeyR', 'Enter', 'Escape'].map(
        formatKey,
      ),
    ).toEqual(['←', '→', 'ESPACIO', 'S', 'P', 'R', 'ENTER', 'ESC']);
    expect(formatPrompt(InputAction.DASH, 'keyboard', settings)).toBe('[S]');
    expect(formatPrompt(InputAction.PAUSE, 'keyboard', settings)).toBe('[P]');
  });
  it('applies deadzone and changes device', () => {
    const state = new InputState(defaultInputSettings());
    state.update({ axisX: 0.1, gamepadConnected: true });
    expect(state.axisX).toBe(0);
    state.update({ axisX: 0.8, gamepadConnected: true });
    expect(state.axisX).toBe(0.8);
    expect(state.activeDevice).toBe('gamepad');
    state.update({ gamepadConnected: false });
    expect(state.axisX).toBe(0);
  });
  it('blocks inherited presses until release', () => {
    const state = new InputState(defaultInputSettings());
    state.update({ keys: new Set(['Enter']) });
    state.blockInherited();
    state.update({ keys: new Set(['Enter']) });
    expect(state.wasPressed(InputAction.CONFIRM)).toBe(false);
    state.update({ keys: new Set() });
    state.update({ keys: new Set(['Enter']) });
    expect(state.wasPressed(InputAction.CONFIRM)).toBe(true);
  });
  it('keeps previous and next state independent across alternating frames', () => {
    const state = new InputState(defaultInputSettings());
    const keys = new Set(['ArrowLeft']);
    state.update({ keys });
    keys.clear();
    state.update({ keys });
    expect(state.wasReleased(InputAction.MOVE_LEFT)).toBe(true);
    keys.add('ArrowRight');
    state.update({ keys });
    expect(state.wasPressed(InputAction.MOVE_RIGHT)).toBe(true);
    expect(state.isDown(InputAction.MOVE_LEFT)).toBe(false);
  });
  it('applies remapped settings immediately', () => {
    const state = new InputState(defaultInputSettings());
    const settings = defaultInputSettings();
    settings.keyboard.JUMP = 'KeyJ';
    state.setSettings(settings);
    state.update({ keys: new Set(['KeyJ']) });
    expect(state.wasPressed(InputAction.JUMP)).toBe(true);
  });
  it('keeps gamepad buttons and axis hysteresis working', () => {
    const state = new InputState(defaultInputSettings());
    state.update({ buttons: new Set([0]), axisX: 0.8, gamepadConnected: true });
    expect(state.wasPressed(InputAction.JUMP)).toBe(true);
    expect(state.isDown(InputAction.MOVE_RIGHT)).toBe(true);
    state.update({ axisX: 0.45, gamepadConnected: true });
    expect(state.isDown(InputAction.MOVE_RIGHT)).toBe(true);
    state.update({ axisX: 0.2, gamepadConnected: true });
    expect(state.isDown(InputAction.MOVE_RIGHT)).toBe(false);
  });
});
