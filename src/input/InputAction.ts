export const InputAction = {
  MOVE_LEFT: 'MOVE_LEFT',
  MOVE_RIGHT: 'MOVE_RIGHT',
  JUMP: 'JUMP',
  DASH: 'DASH',
  PAUSE: 'PAUSE',
  RESTART: 'RESTART',
  MENU_UP: 'MENU_UP',
  MENU_DOWN: 'MENU_DOWN',
  MENU_LEFT: 'MENU_LEFT',
  MENU_RIGHT: 'MENU_RIGHT',
  CONFIRM: 'CONFIRM',
  BACK: 'BACK',
} as const;
export type InputAction = (typeof InputAction)[keyof typeof InputAction];
export const INPUT_ACTIONS = Object.values(InputAction);
export type InputDevice = 'keyboard' | 'gamepad' | 'pointer';
