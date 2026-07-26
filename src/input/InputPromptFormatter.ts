import type { InputDevice } from './InputAction';
import type { InputSettings, PromptStyle } from './InputBindings';
import type { InputAction } from './InputAction';
const names: Record<PromptStyle, readonly string[]> = {
  generic: ['B1', 'B2', 'B3', 'B4', 'LB', 'RB', 'LT', 'RT', 'BACK', 'START'],
  xbox: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'VIEW', 'START'],
  playstation: [
    'CRUZ',
    'CÍRCULO',
    'CUADRADO',
    'TRIÁNGULO',
    'L1',
    'R1',
    'L2',
    'R2',
    'CREATE',
    'OPTIONS',
  ],
  nintendo: ['B', 'A', 'Y', 'X', 'L', 'R', 'ZL', 'ZR', '-', '+'],
};
export const formatKey = (code: string): string =>
  (
    ({
      Space: 'ESPACIO',
      Enter: 'ENTER',
      Escape: 'ESC',
      ShiftLeft: 'SHIFT',
      ShiftRight: 'SHIFT',
    }) as Record<string, string>
  )[code] ?? code.replace('Key', '').replace('Arrow', '');
export const formatPrompt = (
  action: InputAction,
  device: InputDevice,
  settings: InputSettings,
): string =>
  device === 'gamepad'
    ? `[${names[settings.promptStyle][settings.gamepad[action]] ?? `B${settings.gamepad[action] + 1}`}]`
    : `[${formatKey(settings.keyboard[action])}]`;
