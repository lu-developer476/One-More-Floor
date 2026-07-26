import Phaser from 'phaser';
import { LEVELS } from '../config/levelConfig';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { StorageService } from '../services/StorageService';
export class RunSetupScene extends Phaser.Scene {
  private floor = 0;
  private mode = 0;
  private anchor = 0;
  private inputManager!: InputManager;
  private text!: Phaser.GameObjects.Text;
  constructor() {
    super('RunSetup');
  }
  init(data: { levelIndex: number }) {
    this.floor = data.levelIndex;
  }
  create() {
    this.inputManager = new InputManager(this, new StorageService().load().input);
    this.inputManager.blockInherited();
    this.add.rectangle(480, 270, 760, 430, 0x071018, 0.98).setStrokeStyle(2, 0x5ef1ff);
    this.add
      .text(480, 90, 'ELEGÍ UN MODO', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#5ef1ff',
      })
      .setOrigin(0.5);
    this.text = this.add
      .text(480, 260, '', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#fff',
        align: 'center',
        lineSpacing: 14,
      })
      .setOrigin(0.5);
    this.render();
  }
  update() {
    this.inputManager.poll();
    if (
      this.inputManager.wasPressed(InputAction.MENU_LEFT) ||
      this.inputManager.wasPressed(InputAction.MENU_RIGHT)
    )
      this.mode = 1 - this.mode;
    if (this.mode && this.inputManager.wasPressed(InputAction.MENU_UP))
      this.anchor = (this.anchor + 2) % 3;
    if (this.mode && this.inputManager.wasPressed(InputAction.MENU_DOWN))
      this.anchor = (this.anchor + 1) % 3;
    if (this.inputManager.wasPressed(InputAction.BACK)) this.scene.start('Menu');
    if (this.inputManager.wasPressed(InputAction.CONFIRM)) {
      const level = LEVELS[this.floor]!;
      this.scene.start('Level', {
        levelIndex: this.floor,
        mode: this.mode ? 'practice' : 'competitive',
        anchorId: this.mode ? level.practiceAnchors[this.anchor]!.id : level.practiceAnchors[0]!.id,
      });
    }
    this.render();
  }
  private render() {
    const level = LEVELS[this.floor]!;
    this.text.setText([
      level.name,
      this.mode ? '▶ PRÁCTICA' : '▶ CONTRARRELOJ',
      this.mode
        ? `ANCHOR: ${level.practiceAnchors[this.anchor]!.name}`
        : 'PB, RANGO Y GHOST HABILITADOS',
      '←→ MODO · ↑↓ ANCHOR · ENTER CONFIRMAR · ESC VOLVER',
    ]);
  }
}
