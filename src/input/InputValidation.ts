import { INPUT_ACTIONS, InputAction, type InputAction as Action } from './InputAction';
import {
  DEFAULT_GAMEPAD_BINDINGS,
  DEFAULT_KEYBOARD_BINDINGS,
  defaultInputSettings,
  type InputSettings,
} from './InputBindings';
const CODE =
  /^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Enter|Escape|Shift(Left|Right)|Control(Left|Right)|Tab|Backspace)$/;
const RESERVED = new Set(['F5', 'F11', 'F12']);
export const isValidKeyCode = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 20 && CODE.test(value) && !RESERVED.has(value);
export const isValidButton = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 31;
export const bindingConflict = (
  bindings: Record<Action, string | number>,
  action: Action,
  value: string | number,
): Action | null =>
  INPUT_ACTIONS.find((candidate) => candidate !== action && bindings[candidate] === value) ?? null;
export const swapBinding = <T extends string | number>(
  bindings: Record<Action, T>,
  action: Action,
  value: T,
): Record<Action, T> => {
  const next = { ...bindings };
  const conflict = bindingConflict(bindings, action, value);
  if (conflict) next[conflict] = bindings[action];
  next[action] = value;
  return next;
};
export function validateInputSettings(raw: unknown): InputSettings {
  const result = defaultInputSettings();
  if (!raw || typeof raw !== 'object') return result;
  const source = raw as Record<string, unknown>;
  const keyboard =
    source.keyboard && typeof source.keyboard === 'object'
      ? (source.keyboard as Record<string, unknown>)
      : {};
  const gamepad =
    source.gamepad && typeof source.gamepad === 'object'
      ? (source.gamepad as Record<string, unknown>)
      : {};
  for (const action of INPUT_ACTIONS) {
    if (isValidKeyCode(keyboard[action])) result.keyboard[action] = keyboard[action];
    if (isValidButton(gamepad[action])) result.gamepad[action] = gamepad[action];
  }
  if (result.keyboard[InputAction.MOVE_LEFT] === result.keyboard[InputAction.MOVE_RIGHT]) {
    result.keyboard[InputAction.MOVE_LEFT] = DEFAULT_KEYBOARD_BINDINGS[InputAction.MOVE_LEFT];
    result.keyboard[InputAction.MOVE_RIGHT] = DEFAULT_KEYBOARD_BINDINGS[InputAction.MOVE_RIGHT];
  }
  if (result.keyboard[InputAction.CONFIRM] === result.keyboard[InputAction.BACK]) {
    result.keyboard[InputAction.CONFIRM] = DEFAULT_KEYBOARD_BINDINGS[InputAction.CONFIRM];
    result.keyboard[InputAction.BACK] = DEFAULT_KEYBOARD_BINDINGS[InputAction.BACK];
  }
  if (result.gamepad[InputAction.CONFIRM] === result.gamepad[InputAction.BACK]) {
    result.gamepad[InputAction.CONFIRM] = DEFAULT_GAMEPAD_BINDINGS[InputAction.CONFIRM];
    result.gamepad[InputAction.BACK] = DEFAULT_GAMEPAD_BINDINGS[InputAction.BACK];
  }
  result.deadZone =
    typeof source.deadZone === 'number' &&
    Number.isFinite(source.deadZone) &&
    source.deadZone >= 0.1 &&
    source.deadZone <= 0.9
      ? source.deadZone
      : 0.25;
  result.promptStyle =
    source.promptStyle === 'xbox' ||
    source.promptStyle === 'playstation' ||
    source.promptStyle === 'nintendo' ||
    source.promptStyle === 'generic'
      ? source.promptStyle
      : 'generic';
  return result;
}
