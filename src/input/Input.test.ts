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
describe('input', () => {
  it('provides valid defaults and isolated recovery', () => {
    const defaults = defaultInputSettings();
    expect(defaults.keyboard.JUMP).toBe('Space');
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
    expect(bindingConflict(b, InputAction.JUMP, 'KeyA')).toBe(InputAction.MOVE_LEFT);
    const swapped = swapBinding(b, InputAction.JUMP, 'KeyA');
    expect(swapped.MOVE_LEFT).toBe('Space');
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
    ['KeyA', InputAction.MOVE_LEFT],
    ['KeyD', InputAction.MOVE_RIGHT],
    ['Space', InputAction.JUMP],
    ['ShiftLeft', InputAction.DASH],
    ['Escape', InputAction.PAUSE],
    ['Escape', InputAction.BACK],
    ['Enter', InputAction.CONFIRM],
  ])('maps DOM code %s to %s', (code, action) => {
    const state = new InputState(defaultInputSettings());
    state.update({ keys: new Set([code]) });
    expect(state.wasPressed(action)).toBe(true);
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
    const keys = new Set(['KeyA']);
    state.update({ keys });
    keys.clear();
    state.update({ keys });
    expect(state.wasReleased(InputAction.MOVE_LEFT)).toBe(true);
    keys.add('KeyD');
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
