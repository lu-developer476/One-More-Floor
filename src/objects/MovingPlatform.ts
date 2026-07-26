import Phaser from 'phaser';
export class MovingPlatform extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, private readonly startX: number, private readonly endX: number) { super(scene,x,y,'platform'); scene.add.existing(this); scene.physics.add.existing(this,true); this.setDisplaySize(150,24); (this.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject(); }
  update(time: number): void { this.x = Phaser.Math.Linear(this.startX,this.endX,(Math.sin(time/900)+1)/2); (this.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject(); }
}
