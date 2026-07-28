import { InputAction, type InputAction as Action } from '../input/InputAction';

export const ACTION_LABELS: Record<Action, string> = {
  [InputAction.MOVE_LEFT]: 'Mover a la izquierda', [InputAction.MOVE_RIGHT]: 'Mover a la derecha',
  [InputAction.JUMP]: 'Saltar', [InputAction.DASH]: 'Dash', [InputAction.PAUSE]: 'Pausa',
  [InputAction.RESTART]: 'Reiniciar', [InputAction.MENU_UP]: 'Menú: arriba',
  [InputAction.MENU_DOWN]: 'Menú: abajo', [InputAction.MENU_LEFT]: 'Menú: izquierda',
  [InputAction.MENU_RIGHT]: 'Menú: derecha', [InputAction.CONFIRM]: 'Confirmar',
  [InputAction.BACK]: 'Volver / cancelar',
};
export const DEVICE_LABELS = { keyboard: 'TECLADO', gamepad: 'MANDO' } as const;
export const PROMPT_STYLE_LABELS = { generic: 'GENÉRICO', xbox: 'XBOX', playstation: 'PLAYSTATION', nintendo: 'NINTENDO' } as const;
