import Phaser from 'phaser';
import {
  INPUT_ACTIONS,
  InputAction,
  type InputAction as Action,
  type InputDevice,
} from './InputAction';
import type { InputSettings } from './InputBindings';
import { KeyboardInputSource } from './KeyboardInputSource';
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
  private readonly next = new Set<Action>();
  private axisLatchX = 0;
  private axisLatchY = 0;
  private static readonly emptyKeys: ReadonlySet<string> = new Set();
  private static readonly emptyButtons: ReadonlySet<number> = new Set();
  activeDevice: InputDevice = 'keyboard';
  axisX = 0;
  axisY = 0;
  constructor(public settings: InputSettings) {}
  setSettings(settings: InputSettings): void {
    this.settings = settings;
  }
  blockInherited(): void {
    for (const action of this.down) this.blockedUntilRelease.add(action);
  }
  update(input: PhysicalInput): void {
    const previous = this.down;
    const next = this.next;
    next.clear();
    this.pressed.clear();
    this.released.clear();
    const keys = input.keys ?? InputState.emptyKeys;
    const buttons = input.buttons ?? InputState.emptyButtons;
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
    this.axisLatchX = this.latch(x, this.axisLatchX);
    this.axisLatchY = this.latch(y, this.axisLatchY);
    if (this.axisLatchX < 0) next.add(InputAction.MOVE_LEFT);
    if (this.axisLatchX > 0) next.add(InputAction.MOVE_RIGHT);
    if (this.axisLatchY < 0) next.add(InputAction.MENU_UP);
    if (this.axisLatchY > 0) next.add(InputAction.MENU_DOWN);
    for (const action of INPUT_ACTIONS) {
      if (next.has(action) && !previous.has(action) && !this.blockedUntilRelease.has(action))
        this.pressed.add(action);
      if (!next.has(action) && previous.has(action)) this.released.add(action);
      if (!next.has(action)) this.blockedUntilRelease.delete(action);
    }
    previous.clear();
    for (const action of next) previous.add(action);
    this.axisX =
      x || (next.has(InputAction.MOVE_RIGHT) ? 1 : 0) - (next.has(InputAction.MOVE_LEFT) ? 1 : 0);
    this.axisY =
      y || (next.has(InputAction.MENU_DOWN) ? 1 : 0) - (next.has(InputAction.MENU_UP) ? 1 : 0);
  }
  private latch(value: number, current: number): number {
    if (current !== 0) {
      if (Math.sign(value) !== current && Math.abs(value) >= 0.55) return Math.sign(value);
      if (Math.abs(value) <= Math.max(this.settings.deadZone, 0.35)) return 0;
      return current;
    }
    return Math.abs(value) >= Math.max(this.settings.deadZone, 0.55) ? Math.sign(value) : 0;
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
  private readonly keyboardSource: KeyboardInputSource;
  private readonly buttonSet = new Set<number>();
  constructor(
    private scene: Phaser.Scene,
    settings: InputSettings,
  ) {
    super(settings);
    this.keyboardSource = new KeyboardInputSource((code) =>
      Object.values(this.settings.keyboard).includes(code),
    );
  }
  override blockInherited(): void {
    this.update(this.physicalInput());
    super.blockInherited();
  }
  poll(): void {
    this.update(this.physicalInput());
  }
  private physicalInput(): PhysicalInput {
    const pad = this.scene.input.gamepad?.getPad(0);
    this.buttonSet.clear();
    pad?.buttons.forEach((b, i) => {
      if (b.pressed) this.buttonSet.add(i);
    });
    return {
      keys: this.keyboardSource.activeCodes,
      buttons: this.buttonSet,
      axisX: pad?.leftStick.x,
      axisY: pad?.leftStick.y,
      gamepadConnected: Boolean(pad),
      pointer: this.scene.input.activePointer.primaryDown,
    };
  }
  destroy(): void {
    this.keyboardSource.destroy();
    this.buttonSet.clear();
    // Release the Phaser scene so stopped scenes can be collected.
    this.scene = undefined as unknown as Phaser.Scene;
  }
}
