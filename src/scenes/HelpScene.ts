import Phaser from 'phaser';
import { StorageService } from '../services/StorageService';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { formatPrompt } from '../input/InputPromptFormatter';
import { ScreenShell, UiTypography } from '../ui/UiKit';
import { UI_TOKENS } from '../ui/UiTokens';
const sections = [
  ['OBJETIVO', 'Llegá a la salida antes de que el colapso te alcance.\nCada piso premia precisión, lectura y constancia.'],
  ['ENEMIGOS', 'AUTÓMATA: patrulla zonas terrestres. Tocarlo elimina; podés saltarlo o desactivarlo con dash.\n\nDRON: patrulla el aire, avisa con una línea y fija la dirección antes de cargar. Evitalo o desactivalo con dash.'],
  ['MOVIMIENTO', 'Saltar: pulsá para despegar y soltá antes para un salto corto.\nWall slide: rozá una pared durante la caída.\nWall jump: saltá desde la pared para cambiar de dirección.\nDash: impulso breve con recarga. Podés combinar salto + dash.'],
  ['MODOS', 'Contrarreloj guarda PB, rango, ghost y splits.\nPráctica habilita anchors y no modifica marcas competitivas.'],
  ['RECORDS Y GHOSTS', 'El PB es tu mejor tiempo. El ghost reproduce tu mejor recorrido.\nLos splits comparan tramos; el mejor teórico combina tus mejores segmentos.'],
  ['TOWER RUN', 'Tower Run encadena cinco pisos. Competitivo guarda PB global.\nAsistido conserva checkpoints pero no registra PB global.'],
  ['CONTROLES', 'Los prompts se adaptan al teclado o mando activo.\nPersonalizá cada acción desde Ajustes > Controles.'],
] as const;
export class HelpScene extends Phaser.Scene {
  private manager!: InputManager; private selected = 0; private body!: Phaser.GameObjects.Text; private tabs: Phaser.GameObjects.Rectangle[] = []; private save!: ReturnType<StorageService['load']>;
  constructor() { super('Help'); }
  create(): void { this.save = new StorageService().load(); this.manager = new InputManager(this, this.save.input); this.manager.blockInherited(); const shell = new ScreenShell(this, 'AYUDA', 'Elegí un tema; no necesitás aprender todo antes de jugar'); shell.panel(270, 120, 650, 330); sections.forEach(([title], i) => { const y = 120 + i * 54; const tab = this.add.rectangle(56 + 95, y + 22, 190, 44, 0x102431).setInteractive({ useHandCursor: true }).on('pointerover', () => this.select(i)).on('pointerdown', () => this.select(i)); this.tabs.push(tab); this.add.text(68, y + 12, title, UiTypography(16)); }); this.body = this.add.text(300, 150, '', { ...UiTypography(18), wordWrap: { width: 580 }, lineSpacing: 10 }); this.select(0); shell.footer(`${formatPrompt(InputAction.MENU_UP, this.manager.activeDevice, this.save.input)} ${formatPrompt(InputAction.MENU_DOWN, this.manager.activeDevice, this.save.input)} Tema   ${formatPrompt(InputAction.BACK, this.manager.activeDevice, this.save.input)} Volver`); this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.manager.destroy()); }
  update(): void { this.manager.poll(); if (this.manager.wasPressed(InputAction.MENU_UP)) this.select((this.selected + sections.length - 1) % sections.length); if (this.manager.wasPressed(InputAction.MENU_DOWN)) this.select((this.selected + 1) % sections.length); if (this.manager.wasPressed(InputAction.BACK)) this.scene.start('Menu'); }
  private select(index: number): void { this.selected = index; this.tabs.forEach((tab, i) => tab.setStrokeStyle(i === index ? 3 : 1, i === index ? 0x5ef1ff : 0x526c7e)); const [title, copy] = sections[index]!; const movementPrompts = (index === 1 || index === 2) ? `\n\n${formatPrompt(InputAction.JUMP, this.manager.activeDevice, this.save.input)} Saltar   ${formatPrompt(InputAction.DASH, this.manager.activeDevice, this.save.input)} Dash` : ''; this.body.setText(`${title}\n\n${copy}${movementPrompts}`).setColor(UI_TOKENS.colors.text); }
}
