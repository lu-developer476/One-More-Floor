import Phaser from 'phaser';
export class ExitDoor extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'door');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
  }
}
