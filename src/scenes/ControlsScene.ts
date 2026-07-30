import { ScreenShell } from '../ui/UiKit';
import Phaser from 'phaser';
import { StorageService } from '../services/StorageService';
import { InputAction, type InputAction as Action } from '../input/InputAction';
import { InputManager } from '../input/InputManager';
import { defaultInputSettings, type InputSettings, type PromptStyle } from '../input/InputBindings';
import { isValidButton, isValidKeyCode, swapBinding } from '../input/InputValidation';
import { formatKey } from '../input/InputPromptFormatter';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { eventBus, Events } from '../utils/EventBus';

const editable: readonly Action[] = Object.values(InputAction);
const styles: readonly PromptStyle[] = ['generic', 'xbox', 'playstation', 'nintendo'];
type ControlRow = Action | 'DEVICE' | 'DEADZONE' | 'PROMPTS' | 'RESTORE' | 'BACK';
const rows: readonly ControlRow[] = [
  'DEVICE',
  ...editable,
  'DEADZONE',
  'PROMPTS',
  'RESTORE',
  'BACK',
];
const humanName: Record<Action, string> = {
  [InputAction.MOVE_LEFT]: 'MOVER A LA IZQUIERDA',
  [InputAction.MOVE_RIGHT]: 'MOVER A LA DERECHA',
  [InputAction.JUMP]: 'SALTAR',
  [InputAction.DASH]: 'DASH',
  [InputAction.PAUSE]: 'PAUSA',
  [InputAction.RESTART]: 'REINICIAR',
  [InputAction.MENU_UP]: 'MENÚ: ARRIBA',
  [InputAction.MENU_DOWN]: 'MENÚ: ABAJO',
  [InputAction.MENU_LEFT]: 'MENÚ: IZQUIERDA',
  [InputAction.MENU_RIGHT]: 'MENÚ: DERECHA',
  [InputAction.CONFIRM]: 'CONFIRMAR',
  [InputAction.BACK]: 'VOLVER / CANCELAR',
};

export class ControlsScene extends Phaser.Scene {
  private service = new StorageService();
  private settings!: InputSettings;
  private manager!: InputManager;
  private selected = 0;
  private device: 'keyboard' | 'gamepad' = 'keyboard';
  private labels: Phaser.GameObjects.Text[] = [];
  private capture: ControlRow | null = null;
  private heldBeforeCapture = new Set<number>();
  private message!: Phaser.GameObjects.Text;
  private dialog?: ConfirmDialog;
  constructor() {
    super('Controls');
  }
  create(): void {
    new ScreenShell(this, 'CONTROLES', 'Navegación accesible · foco visible · volver siempre disponible');
    this.settings = this.service.load().input;
    this.manager = new InputManager(this, this.settings);
    this.manager.blockInherited();
    this.add.rectangle(480, 270, 900, 520, 0x071018, 0.99).setStrokeStyle(2, 0x5ef1ff);
    this.add
      .text(480, 25, 'CONTROLES', { fontFamily: 'monospace', fontSize: '26px', color: '#5ef1ff' })
      .setOrigin(0.5);
    this.add.text(55, 78, 'MOVIMIENTO\n\n\n\nSISTEMA\n\n\nNAVEGACIÓN', {
      fontFamily: 'monospace', fontSize: '16px', color: '#5ef1ff', lineSpacing: 18,
    });
    this.labels = rows.map((_row, index) =>
      this.add
        .text(570, 90 + index * 46, '', {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#91a6b6',
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerover', () => {
          this.selected = index;
          this.render();
        })
        .on('pointerdown', () => this.activate(1)),
    );
    this.message = this.add
      .text(480, 500, '', { fontFamily: 'monospace', fontSize: '16px', color: '#f5c84c' })
      .setOrigin(0.5);
    this.render();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }
  update(): void {
    if (this.capture) return this.pollCapture();
    this.manager.poll();
    this.dialog?.update(this.manager);
    if (this.dialog) return;
    if (this.manager.wasPressed(InputAction.MENU_UP))
      this.selected = (this.selected + rows.length - 1) % rows.length;
    if (this.manager.wasPressed(InputAction.MENU_DOWN))
      this.selected = (this.selected + 1) % rows.length;
    if (this.manager.wasPressed(InputAction.MENU_LEFT)) this.activate(-1);
    if (
      this.manager.wasPressed(InputAction.MENU_RIGHT) ||
      this.manager.wasPressed(InputAction.CONFIRM)
    )
      this.activate(1);
    if (this.manager.wasPressed(InputAction.BACK)) this.back();
    this.render();
  }
  private activate(direction: number): void {
    const row = rows[this.selected]!;
    if (row === 'DEVICE') this.device = this.device === 'keyboard' ? 'gamepad' : 'keyboard';
    else if (row === 'DEADZONE') {
      this.settings.deadZone = Phaser.Math.Clamp(
        Math.round((this.settings.deadZone + direction * 0.05) * 100) / 100,
        0.1,
        0.9,
      );
      this.persist();
    } else if (row === 'PROMPTS') {
      const at = styles.indexOf(this.settings.promptStyle);
      this.settings.promptStyle = styles[(at + direction + styles.length) % styles.length]!;
      this.persist();
    } else if (row === 'RESTORE') this.restore();
    else if (row === 'BACK') this.back();
    else this.beginCapture(row);
  }
  private beginCapture(action: Action): void {
    this.capture = action;
    this.manager.blockInherited();
    this.message.setText(
      this.device === 'keyboard'
        ? 'PRESIONÁ UNA TECLA · ESC CANCELA'
        : 'SOLTÁ BOTONES PREVIOS Y PRESIONÁ UNO · BACK CANCELA',
    );
    if (this.device === 'keyboard')
      document.addEventListener('keydown', this.captureKey, { capture: true });
    else this.heldBeforeCapture = this.pressedButtons();
  }
  private captureKey = (event: KeyboardEvent): void => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.repeat) return;
    if (event.code === this.settings.keyboard[InputAction.BACK]) return this.endCapture();
    if (!isValidKeyCode(event.code)) {
      this.message.setText('TECLA RESERVADA O INVÁLIDA');
      return;
    }
    this.assign(event.code);
  };
  private pollCapture(): void {
    if (this.device !== 'gamepad') return;
    const pad = this.input.gamepad?.getPad(0);
    if (!pad) {
      this.message.setText('GAMEPAD DESCONECTADO · ESC PARA CANCELAR');
      return;
    }
    const pressed = this.pressedButtons();
    for (const prior of [...this.heldBeforeCapture])
      if (!pressed.has(prior)) this.heldBeforeCapture.delete(prior);
    const back = this.settings.gamepad[InputAction.BACK];
    if (pressed.has(back) && !this.heldBeforeCapture.has(back)) return this.endCapture();
    for (const button of pressed)
      if (!this.heldBeforeCapture.has(button) && isValidButton(button)) return this.assign(button);
  }
  private pressedButtons(): Set<number> {
    const result = new Set<number>();
    this.input.gamepad?.getPad(0)?.buttons.forEach((b, i) => {
      if (b.pressed) result.add(i);
    });
    return result;
  }
  private assign(value: string | number): void {
    const action = this.capture as Action;
    if (this.device === 'keyboard' && typeof value === 'string')
      this.settings.keyboard = swapBinding(this.settings.keyboard, action, value);
    if (this.device === 'gamepad' && typeof value === 'number')
      this.settings.gamepad = swapBinding(this.settings.gamepad, action, value);
    this.endCapture();
    this.persist();
    this.message.setText('ASIGNACIÓN GUARDADA');
  }
  private endCapture(): void {
    document.removeEventListener('keydown', this.captureKey, { capture: true });
    this.capture = null;
    this.heldBeforeCapture.clear();
    this.render();
  }
  private restore(): void {
    this.dialog = new ConfirmDialog(
      this,
      'RESTAURAR CONTROLES',
      'Se perderán las asignaciones personalizadas.',
      () => {
        this.dialog = undefined;
        this.settings = defaultInputSettings();
        this.persist();
      },
      () => {
        this.dialog = undefined;
      },
    );
  }
  private persist(): void {
    const save = this.service.load();
    save.input = this.settings;
    this.service.save(save);
    eventBus.emit(Events.BINDINGS_CHANGED, this.settings);
    this.manager.setSettings(this.settings);
    this.render();
  }
  private render(): void {
    this.labels.forEach((label, index) => {
      const row = rows[index]!;
      let value: string = row;
      if (row === 'DEVICE') value = `DISPOSITIVO: ${this.device.toUpperCase()}`;
      else if (row === 'DEADZONE') value = `DEADZONE: ${this.settings.deadZone.toFixed(2)}`;
      else if (row === 'PROMPTS') value = `ESTILO: ${this.settings.promptStyle.toUpperCase()}`;
      else if (editable.includes(row as Action))
        value = `${humanName[row as Action]} · ${this.device === 'keyboard' ? formatKey(this.settings.keyboard[row as Action]) : `BOTÓN ${this.settings.gamepad[row as Action]}`}`;
      const scrollStart = Phaser.Math.Clamp(this.selected - 4, 0, Math.max(0, rows.length - 9));
      const visible = index >= scrollStart && index < scrollStart + 9;
      label
        .setVisible(visible)
        .setY(90 + (index - scrollStart) * 46)
        .setText(`${index === this.selected ? '▶' : ' '} ${value}`)
        .setColor(index === this.selected ? '#fff' : '#91a6b6');
    });
  }
  private back(): void {
    this.scene.stop();
    if (this.scene.isPaused('Pause')) this.scene.resume('Pause');
    else this.scene.start('Settings');
  }
  private shutdown(): void {
    this.endCapture();
    this.manager.destroy();
  }
}
