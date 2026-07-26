import { InputAction, type InputAction as Action } from './InputAction';
export type PromptStyle = 'generic' | 'xbox' | 'playstation' | 'nintendo';
export type KeyboardBindings = Record<Action, string>;
export type GamepadBindings = Record<Action, number>;
export interface InputSettings {
  keyboard: KeyboardBindings;
  gamepad: GamepadBindings;
  deadZone: number;
  promptStyle: PromptStyle;
}
export const DEFAULT_KEYBOARD_BINDINGS: KeyboardBindings = {
  [InputAction.MOVE_LEFT]: 'KeyA',
  [InputAction.MOVE_RIGHT]: 'KeyD',
  [InputAction.JUMP]: 'Space',
  [InputAction.DASH]: 'ShiftLeft',
  [InputAction.PAUSE]: 'Escape',
  [InputAction.RESTART]: 'KeyR',
  [InputAction.MENU_UP]: 'ArrowUp',
  [InputAction.MENU_DOWN]: 'ArrowDown',
  [InputAction.MENU_LEFT]: 'ArrowLeft',
  [InputAction.MENU_RIGHT]: 'ArrowRight',
  [InputAction.CONFIRM]: 'Enter',
  [InputAction.BACK]: 'Escape',
};
export const DEFAULT_GAMEPAD_BINDINGS: GamepadBindings = {
  [InputAction.MOVE_LEFT]: 14,
  [InputAction.MOVE_RIGHT]: 15,
  [InputAction.JUMP]: 0,
  [InputAction.DASH]: 5,
  [InputAction.PAUSE]: 9,
  [InputAction.RESTART]: 4,
  [InputAction.MENU_UP]: 12,
  [InputAction.MENU_DOWN]: 13,
  [InputAction.MENU_LEFT]: 14,
  [InputAction.MENU_RIGHT]: 15,
  [InputAction.CONFIRM]: 0,
  [InputAction.BACK]: 1,
};
export const defaultInputSettings = (): InputSettings => ({
  keyboard: { ...DEFAULT_KEYBOARD_BINDINGS },
  gamepad: { ...DEFAULT_GAMEPAD_BINDINGS },
  deadZone: 0.25,
  promptStyle: 'generic',
});
