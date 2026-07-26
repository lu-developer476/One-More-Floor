import Phaser from 'phaser';
import {
  INPUT_ACTIONS,
  InputAction,
  type InputAction as Action,
  type InputDevice,
} from './InputAction';
import type { InputSettings } from './InputBindings';
export interface PhysicalInput {
  keys?: ReadonlySet<string>;
  buttons?: ReadonlySet<number>;
  axisX?: number;
  axisY?: number;
  pointer?: boolean;
  gamepadConnected?: boolean;
}
export class InputState {
  private down = new Set<Action>();
  private pressed = new Set<Action>();
  private released = new Set<Action>();
  private blockedUntilRelease = new Set<Action>();
  activeDevice: InputDevice = 'keyboard';
  axisX = 0;
  axisY = 0;
  constructor(public settings: InputSettings) {}
  blockInherited(): void {
    for (const action of this.down) this.blockedUntilRelease.add(action);
  }
  update(input: PhysicalInput): void {
    const previous = this.down;
    const next = new Set<Action>();
    const keys = input.keys ?? new Set<string>();
    const buttons = input.buttons ?? new Set<number>();
    const x = this.axis(input.axisX ?? 0),
      y = this.axis(input.axisY ?? 0);
    if (keys.size) {
      this.activeDevice = 'keyboard';
    }
    if (input.pointer) this.activeDevice = 'pointer';
    if (input.gamepadConnected && (buttons.size || x || y)) this.activeDevice = 'gamepad';
    for (const action of INPUT_ACTIONS)
      if (keys.has(this.settings.keyboard[action]) || buttons.has(this.settings.gamepad[action]))
        next.add(action);
    if (x <= -0.5) next.add(InputAction.MOVE_LEFT);
    if (x >= 0.5) next.add(InputAction.MOVE_RIGHT);
    if (y <= -0.5) next.add(InputAction.MENU_UP);
    if (y >= 0.5) next.add(InputAction.MENU_DOWN);
    this.pressed = new Set();
    this.released = new Set();
    for (const action of INPUT_ACTIONS) {
      if (next.has(action) && !previous.has(action) && !this.blockedUntilRelease.has(action))
        this.pressed.add(action);
      if (!next.has(action) && previous.has(action)) this.released.add(action);
      if (!next.has(action)) this.blockedUntilRelease.delete(action);
    }
    this.down = next;
    this.axisX =
      x || (next.has(InputAction.MOVE_RIGHT) ? 1 : 0) - (next.has(InputAction.MOVE_LEFT) ? 1 : 0);
    this.axisY =
      y || (next.has(InputAction.MENU_DOWN) ? 1 : 0) - (next.has(InputAction.MENU_UP) ? 1 : 0);
  }
  private axis(value: number): number {
    return Math.abs(value) < this.settings.deadZone ? 0 : Math.max(-1, Math.min(1, value));
  }
  isDown(a: Action): boolean {
    return this.down.has(a);
  }
  wasPressed(a: Action): boolean {
    return this.pressed.has(a);
  }
  wasReleased(a: Action): boolean {
    return this.released.has(a);
  }
}
export class InputManager extends InputState {
  private keys = new Map<string, Phaser.Input.Keyboard.Key>();
  constructor(
    private scene: Phaser.Scene,
    settings: InputSettings,
  ) {
    super(settings);
    for (const code of new Set(Object.values(settings.keyboard)))
      this.keys.set(code, scene.input.keyboard!.addKey(code));
  }
  poll(): void {
    const keySet = new Set<string>();
    for (const [code, key] of this.keys) if (key.isDown) keySet.add(code);
    const pad = this.scene.input.gamepad?.getPad(0);
    const buttons = new Set<number>();
    pad?.buttons.forEach((b, i) => {
      if (b.pressed) buttons.add(i);
    });
    this.update({
      keys: keySet,
      buttons,
      axisX: pad?.leftStick.x,
      axisY: pad?.leftStick.y,
      gamepadConnected: Boolean(pad),
      pointer: this.scene.input.activePointer.primaryDown,
    });
  }
}
