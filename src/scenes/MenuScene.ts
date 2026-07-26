import Phaser from 'phaser';
import { StorageService } from '../services/StorageService';
export class MenuScene extends Phaser.Scene { constructor(){super('Menu');} create():void {
  this.cameras.main.setBackgroundColor('#0c1119'); this.add.text(480,150,'ONE MORE FLOOR',{fontFamily:'monospace',fontSize:'58px',color:'#5ef1ff',fontStyle:'bold'}).setOrigin(.5);
  this.add.text(480,235,'UN PISO MÁS ANTES DEL COLAPSO',{fontFamily:'monospace',fontSize:'18px',color:'#f5c84c'}).setOrigin(.5);
  const start=this.add.text(480,310,'[ ENTER / A ]  INICIAR',{fontFamily:'monospace',fontSize:'25px',color:'#ffffff'}).setOrigin(.5).setInteractive({useHandCursor:true});
  this.add.text(480,405,'A/D · MOVER     W/↑/ESPACIO · SALTAR     SHIFT · DASH\nR · REINICIAR   ESC/START · PAUSA     F · PANTALLA COMPLETA',{align:'center',fontFamily:'monospace',fontSize:'15px',color:'#91a6b6',lineSpacing:10}).setOrigin(.5);
  const launch=()=>this.scene.start('Level'); start.on('pointerdown',launch); this.input.keyboard?.once('keydown-ENTER',launch); this.input.gamepad?.once('down',launch);
  this.input.keyboard?.on('keydown-F',()=>{if(this.scale.isFullscreen)this.scale.stopFullscreen();else this.scale.startFullscreen();const s=new StorageService();const d=s.load();d.fullscreen=!this.scale.isFullscreen;s.save(d);});
} }
