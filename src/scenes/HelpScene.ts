import Phaser from 'phaser';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { formatPrompt } from '../input/InputPromptFormatter';
import { StorageService } from '../services/StorageService';

export class HelpScene extends Phaser.Scene {
  private manager!: InputManager;
  constructor() {
    super('Help');
  }
  create(): void {
    const input = new StorageService().load().input;
    this.manager = new InputManager(this, input);
    this.manager.blockInherited();
    const prompt = (action: (typeof InputAction)[keyof typeof InputAction]) =>
      formatPrompt(action, this.manager.activeDevice, input);
    this.add.rectangle(480, 270, 860, 500, 0x071018, 0.99).setStrokeStyle(2, 0x5ef1ff);
    this.add
      .text(480, 42, 'AYUDA', { fontFamily: 'monospace', fontSize: '30px', color: '#5ef1ff' })
      .setOrigin(0.5);
    this.add.text(
      80,
      82,
      `OBJETIVO\nEscapá de cada piso antes del colapso. Los splits miden cada tramo.\n\nCONTROLES REALES\n${prompt(InputAction.MOVE_LEFT)} ${prompt(InputAction.MOVE_RIGHT)} mover · ${prompt(InputAction.JUMP)} saltar / wall jump\n${prompt(InputAction.DASH)} dash · ${prompt(InputAction.PAUSE)} pausa · ${prompt(InputAction.RESTART)} reiniciar\n\nMOVIMIENTO\nDeslizate contra una pared y saltá para hacer wall jump. El dash tiene cooldown.\n\nMODOS\nPRÁCTICA permite anchors y no guarda récords competitivos.\nTOWER RUN encadena los cinco pisos y guarda checkpoints entre pisos.\nCOMPETITIVO puede guardar PB; ASISTIDO conserva progreso pero no PB global.\n\nCONTROLES abre el remapeo completo desde AJUSTES.`,
      {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#d9e7ed',
        wordWrap: { width: 800 },
        lineSpacing: 4,
      },
    );
    this.add
      .text(480, 505, `${prompt(InputAction.BACK)} VOLVER`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f5c84c',
      })
      .setOrigin(0.5);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.manager.destroy());
  }
  update(): void {
    this.manager.poll();
    if (this.manager.wasPressed(InputAction.BACK) || this.manager.wasPressed(InputAction.CONFIRM))
      this.scene.start('Menu');
  }
}
