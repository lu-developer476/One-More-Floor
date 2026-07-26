import Phaser from 'phaser';
export class BootScene extends Phaser.Scene { constructor(){super('Boot');} create():void {
  const make=(key:string,w:number,h:number,color:number,draw?:(g:Phaser.GameObjects.Graphics)=>void)=>{const g=this.add.graphics();g.fillStyle(color).fillRect(0,0,w,h);draw?.(g);g.generateTexture(key,w,h);g.destroy();};
  make('player',32,42,0x5ef1ff,g=>g.fillStyle(0x13202c).fillRect(7,8,6,6)); make('platform',64,24,0x344b5e,g=>g.fillStyle(0x58758b).fillRect(0,0,64,4));
  make('spike',32,28,0xff405c,g=>{g.clear();g.fillStyle(0xff405c).fillTriangle(0,28,16,0,32,28);}); make('door',58,86,0x1c2935,g=>{g.lineStyle(5,0xf5c84c).strokeRect(2,2,54,84);g.fillStyle(0xf5c84c).fillCircle(45,44,4);});
  this.scene.start('Menu');
} }
