import Phaser from 'phaser';
import { StorageService } from '../services/StorageService';
import { InputAction, type InputAction as Action } from '../input/InputAction';
import { InputManager } from '../input/InputManager';
import {
  DEFAULT_GAMEPAD_BINDINGS,
  DEFAULT_KEYBOARD_BINDINGS,
  defaultInputSettings,
  type InputSettings,
} from '../input/InputBindings';
import {
  bindingConflict,
  isValidButton,
  isValidKeyCode,
  swapBinding,
} from '../input/InputValidation';
import { formatKey, formatPrompt } from '../input/InputPromptFormatter';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { eventBus, Events } from '../utils/EventBus';
const editable: readonly Action[] = [
  InputAction.MOVE_LEFT,
  InputAction.MOVE_RIGHT,
  InputAction.JUMP,
  InputAction.DASH,
  InputAction.PAUSE,
  InputAction.RESTART,
  InputAction.CONFIRM,
  InputAction.BACK,
];
export class ControlsScene extends Phaser.Scene {
  private service = new StorageService();
  private settings!: InputSettings;
  private manager!: InputManager;
  private selected = 0;
  private device: 'keyboard' | 'gamepad' = 'keyboard';
  private rows: Phaser.GameObjects.Text[] = [];
  private capture = false;
  private message!: Phaser.GameObjects.Text;
  private dialog?: ConfirmDialog;
  constructor() {
    super('Controls');
  }
  create() {
    this.settings = this.service.load().input;
    this.manager = new InputManager(this, this.settings);
    this.manager.blockInherited();
    this.add.rectangle(480, 270, 820, 510, 0x071018, 0.98).setStrokeStyle(2, 0x5ef1ff);
    this.add
      .text(480, 30, 'CONTROLES', { fontFamily: 'monospace', fontSize: '30px', color: '#5ef1ff' })
      .setOrigin(0.5);
    this.rows = editable.map((_a, i) =>
      this.add
        .text(480, 75 + i * 36, '', { fontFamily: 'monospace', fontSize: '16px', color: '#91a6b6' })
        .setOrigin(0.5),
    );
    this.message = this.add
      .text(480, 390, '', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#f5c84c',
        align: 'center',
      })
      .setOrigin(0.5);
    this.add
      .text(
        480,
        455,
        `TAB: TECLADO/GAMEPAD · ←→ DEADZONE/ESTILO\n${formatPrompt(InputAction.RESTART, this.device, this.settings)} RESTAURAR · ${formatPrompt(InputAction.BACK, this.device, this.settings)} VOLVER`,
        {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#91a6b6',
          align: 'center',
        },
      )
      .setOrigin(0.5);
    this.render();
    document.addEventListener('keydown', this.onUtilityKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }
  update() {
    this.manager.poll();
    this.dialog?.update(this.manager);
    if (this.dialog || this.capture) return;
    if (this.manager.wasPressed(InputAction.MENU_UP))
      this.selected = (this.selected + editable.length - 1) % editable.length;
    if (this.manager.wasPressed(InputAction.MENU_DOWN))
      this.selected = (this.selected + 1) % editable.length;
    if (this.manager.wasPressed(InputAction.CONFIRM)) this.beginCapture();
    if (this.manager.wasPressed(InputAction.BACK)) this.back();
    this.render();
  }
  private onUtilityKey = (event: KeyboardEvent): void => {
    if (event.repeat || this.capture || this.dialog) return;
    if (event.code === 'Tab') {
      event.preventDefault();
      this.device = this.device === 'keyboard' ? 'gamepad' : 'keyboard';
      this.render();
    } else if (event.code === 'KeyR') this.restore();
  };
  private beginCapture() {
    this.capture = true;
    this.message.setText(
      this.device === 'keyboard'
        ? `PRESIONÁ UNA TECLA · ${formatPrompt(InputAction.BACK, this.device, this.settings)} CANCELA`
        : 'PRESIONÁ UN BOTÓN · B CANCELA',
    );
    if (this.device === 'keyboard') this.input.keyboard!.once('keydown', this.captureKey, this);
  }
  private captureKey = (event: KeyboardEvent) => {
    this.capture = false;
    if (event.code === 'Escape') return this.render();
    if (!isValidKeyCode(event.code)) {
      this.message.setText('TECLA RESERVADA O INVÁLIDA');
      return;
    }
    this.assign(event.code);
  };
  private assign(value: string | number) {
    const action = editable[this.selected]!;
    const bindings = this.device === 'keyboard' ? this.settings.keyboard : this.settings.gamepad;
    const conflict = bindingConflict(bindings, action, value);
    if (conflict) this.message.setText(`CONFLICTO CON ${conflict}: ASIGNACIONES INTERCAMBIADAS`);
    if (this.device === 'keyboard' && typeof value === 'string')
      this.settings.keyboard = swapBinding(this.settings.keyboard, action, value);
    else if (this.device === 'gamepad' && isValidButton(value))
      this.settings.gamepad = swapBinding(this.settings.gamepad, action, value);
    this.persist();
  }
  private restore() {
    this.dialog = new ConfirmDialog(
      this,
      'RESTAURAR CONTROLES',
      'Se perderán tus asignaciones personalizadas.',
      () => {
        this.settings = {
          ...defaultInputSettings(),
          keyboard: { ...DEFAULT_KEYBOARD_BINDINGS },
          gamepad: { ...DEFAULT_GAMEPAD_BINDINGS },
        };
        this.dialog = undefined;
        this.persist();
      },
      () => {
        this.dialog = undefined;
      },
    );
  }
  private persist() {
    const save = this.service.load();
    save.input = this.settings;
    this.service.save(save);
    eventBus.emit(Events.BINDINGS_CHANGED, this.settings);
    this.manager.setSettings(this.settings);
    this.render();
  }
  private render() {
    this.rows.forEach((row, i) => {
      const action = editable[i]!;
      const value =
        this.device === 'keyboard'
          ? formatKey(this.settings.keyboard[action])
          : `BOTÓN ${this.settings.gamepad[action]}`;
      row
        .setText(`${i === this.selected ? '▶' : ' '} ${action.padEnd(12)} ${value}`)
        .setColor(i === this.selected ? '#fff' : '#91a6b6');
    });
    if (!this.capture && !this.message.text)
      this.message.setText(
        `${this.device.toUpperCase()} · DEADZONE ${this.settings.deadZone.toFixed(2)} · ${this.settings.promptStyle.toUpperCase()}`,
      );
  }
  private back() {
    this.scene.stop();
    if (this.scene.isPaused('Pause')) this.scene.resume('Pause');
    else this.scene.start('Settings');
  }
  private shutdown(): void {
    document.removeEventListener('keydown', this.onUtilityKey);
    this.input.keyboard?.off('keydown', this.captureKey, this);
    this.manager.destroy();
  }
}
