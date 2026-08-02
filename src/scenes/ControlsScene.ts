import Phaser from 'phaser';
import { ScreenShell, UiFocusController, UiTypography, type UiButtonHandle } from '../ui/UiKit';
import { StorageService, type SaveData } from '../services/StorageService';
import { InputAction, type InputAction as Action } from '../input/InputAction';
import { InputManager } from '../input/InputManager';
import { type PromptStyle } from '../input/InputBindings';
import { isValidKeyCode, swapBinding } from '../input/InputValidation';
import { formatKey } from '../input/InputPromptFormatter';
import { eventBus, Events } from '../utils/EventBus';
import { ToastController } from '../ui/Toast';

const sections: readonly { title: string; actions: readonly Action[] }[] = [
  { title: 'MOVIMIENTO', actions: [InputAction.MOVE_LEFT, InputAction.MOVE_RIGHT, InputAction.JUMP, InputAction.DASH, InputAction.RESTART] },
  { title: 'SISTEMA', actions: [InputAction.PAUSE] },
  { title: 'NAVEGACIÓN', actions: [InputAction.MENU_UP, InputAction.MENU_DOWN, InputAction.MENU_LEFT, InputAction.MENU_RIGHT, InputAction.CONFIRM, InputAction.BACK] },
];
const names: Record<Action, string> = { MOVE_LEFT:'MOVER A LA IZQUIERDA', MOVE_RIGHT:'MOVER A LA DERECHA', JUMP:'SALTAR', DASH:'DASH', RESTART:'REINICIAR', PAUSE:'PAUSA', MENU_UP:'ARRIBA', MENU_DOWN:'ABAJO', MENU_LEFT:'IZQUIERDA', MENU_RIGHT:'DERECHA', CONFIRM:'CONFIRMAR', BACK:'VOLVER / CANCELAR' };
export class ControlsScene extends Phaser.Scene {
  private service = new StorageService(); private save!: SaveData; private manager!: InputManager; private shell!: ScreenShell;
  private device: 'keyboard'|'gamepad' = 'keyboard'; private rows: UiButtonHandle[] = []; private selected = 0; private focus!: UiFocusController;
  private content: Phaser.GameObjects.GameObject[] = []; private capture: Action|null = null; private modal?: Phaser.GameObjects.Container; private toast!: ToastController;
  constructor(){ super('Controls'); }
  create(): void { this.shell = new ScreenShell(this,'CONTROLES','Elegí una acción para cambiar su tecla o botón.'); this.save=this.service.load(); this.manager=new InputManager(this,this.save.input); this.manager.blockInherited(); this.toast=new ToastController(this); this.shell.panel(40,108,880,344,'controls'); this.shell.tabs([{id:'tab-keyboard',label:'TECLADO',onPress:()=>this.setDevice('keyboard')},{id:'tab-gamepad',label:'MANDO',onPress:()=>this.setDevice('gamepad')}],52,116,320); this.render(); this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.shutdown()); }
  update(): void { if(this.capture)return; this.manager.poll(); if(this.manager.wasPressed(InputAction.MENU_LEFT))this.setDevice('keyboard'); if(this.manager.wasPressed(InputAction.MENU_RIGHT))this.setDevice('gamepad'); if(this.manager.wasPressed(InputAction.MENU_UP)){this.selected=(this.selected+this.rows.length-1)%this.rows.length;this.paint();} if(this.manager.wasPressed(InputAction.MENU_DOWN)){this.selected=(this.selected+1)%this.rows.length;this.paint();} if(this.manager.wasPressed(InputAction.CONFIRM))this.rows[this.selected]?.bg.emit('pointerdown'); if(this.manager.wasPressed(InputAction.BACK))this.back(); }
  private setDevice(device:'keyboard'|'gamepad'):void{this.device=device;this.selected=0;this.render();}
  private render():void{this.rows.forEach(x=>x.destroy());this.rows=[];this.content.forEach(x=>x.destroy());this.content=[]; let y=174; for(const section of sections){this.content.push(this.add.text(64,y,section.title,UiTypography(16,'#5ef1ff',true))); y+=28; for(const action of section.actions){const value=this.device==='keyboard'?formatKey(this.save.input.keyboard[action]):`BOTÓN ${this.save.input.gamepad[action]}`;this.rows.push(this.shell.button(`binding-${this.device}-${action.toLowerCase()}`,`${names[action]}                              [${value}]`,300,y-10,590,()=>this.beginCapture(action),{parent:'controls'}));y+=50;if(y>420)break;}if(y>420)break;} if(this.device==='gamepad'){this.rows.push(this.shell.button('dead-zone',`ZONA MUERTA                              ${this.save.input.deadZone.toFixed(2)}`,300,374,590,()=>{this.save.input.deadZone=this.save.input.deadZone>=.9?.1:Math.round((this.save.input.deadZone+.05)*100)/100;this.persist();},{parent:'controls'}));this.rows.push(this.shell.button('button-style',`ESTILO DE BOTONES                         ${this.styleName(this.save.input.promptStyle)}`,300,424,590,()=>this.cycleStyle(),{parent:'controls'}));} this.focus?.destroy();this.focus=new UiFocusController(this.shell,this.rows);this.paint();}
  private styleName(style:PromptStyle):string{return style==='generic'?'GENÉRICO':style.toUpperCase();}
  private cycleStyle():void{const values:PromptStyle[]=['generic','xbox','playstation','nintendo'];this.save.input.promptStyle=values[(values.indexOf(this.save.input.promptStyle)+1)%values.length]!;this.persist();}
  private paint():void{this.rows.forEach((x,i)=>x.setFocused(i===this.selected));const row=this.rows[this.selected];if(row)this.shell.focus(row.id);}
  private beginCapture(action:Action):void{this.capture=action;const current=this.device==='keyboard'?formatKey(this.save.input.keyboard[action]):`BOTÓN ${this.save.input.gamepad[action]}`;const shade=this.add.rectangle(480,270,960,540,0x000000,.82).setInteractive();const panel=this.add.rectangle(480,270,650,280,0x102431).setStrokeStyle(2,0x5ef1ff);const title=this.add.text(190,170,`CAMBIAR “${names[action]}”`,UiTypography(24,'#5ef1ff',true));const body=this.add.text(190,220,`Asignación actual: [${current}]\n\nPresioná una ${this.device==='keyboard'?'tecla':'opción del mando'} nueva.\n[ESC] CANCELAR`,UiTypography(16));this.modal=this.add.container(0,0,[shade,panel,title,body]).setDepth(1000);document.addEventListener('keydown',this.captureKey,{capture:true});}
  private captureKey=(event:KeyboardEvent):void=>{event.preventDefault();event.stopImmediatePropagation();if(event.code==='Escape')return this.endCapture();if(this.device==='gamepad'){const match=/^Digit([0-9])$/.exec(event.code);if(match){this.save.input.gamepad[this.capture!]=Number(match[1]);this.endCapture();this.persist();}return;}if(!isValidKeyCode(event.code))return;this.save.input.keyboard=swapBinding(this.save.input.keyboard,this.capture!,event.code);this.endCapture();this.persist();};
  private endCapture():void{document.removeEventListener('keydown',this.captureKey,{capture:true});this.capture=null;this.modal?.destroy(true);this.modal=undefined;}
  private persist():void{if(!this.service.save(this.save))this.toast.show('NO SE PUDIERON GUARDAR LOS CONTROLES','warning');eventBus.emit(Events.BINDINGS_CHANGED,this.save.input);this.manager.setSettings(this.save.input);this.render();}
  private back():void{this.scene.stop();if(this.scene.isPaused('Pause'))this.scene.resume('Pause');else this.scene.start('Settings');}
  private shutdown():void{this.endCapture();this.toast.destroy();this.focus?.destroy();this.manager.destroy();}
}
