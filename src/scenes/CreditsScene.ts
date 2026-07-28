import Phaser from 'phaser';
import { StorageService } from '../services/StorageService';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { formatPrompt } from '../input/InputPromptFormatter';
import { ScreenShell, UiTypography } from '../ui/UiKit';
import { UI_TOKENS } from '../ui/UiTokens';
export class CreditsScene extends Phaser.Scene {
  private manager!: InputManager;
  constructor() { super('Credits'); }
  create(): void { const save = new StorageService().load(); this.manager = new InputManager(this, save.input); this.manager.blockInherited(); const shell = new ScreenShell(this, 'CRÉDITOS', 'Personas y tecnologías detrás del ascenso'); shell.panel(120, 120, 720, 300); this.add.text(152, 146, 'DISEÑO Y DESARROLLO\nLucas Montenegro\n\nTECNOLOGÍAS\nPhaser · TypeScript · Vite\n\nRECURSOS\nArte, audio e iconografía generados proceduralmente\n\nLICENCIA\nConsultá License en el repositorio', UiTypography(18, UI_TOKENS.colors.text)); this.add.text(808, 390, `v${__APP_VERSION__}`, UiTypography(14, UI_TOKENS.colors.secondary)).setOrigin(1); shell.footer(`${formatPrompt(InputAction.BACK, this.manager.activeDevice, save.input)} Volver al menú`); this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.manager.destroy()); }
  update(): void { this.manager.poll(); if (this.manager.wasPressed(InputAction.BACK) || this.manager.wasPressed(InputAction.CONFIRM)) this.scene.start('Menu'); }
}
