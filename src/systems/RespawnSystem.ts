import Phaser from 'phaser';
export class RespawnSystem { constructor(private readonly scene: Phaser.Scene) {} restart(delayMs=620): void { this.scene.time.delayedCall(delayMs,()=>this.scene.scene.restart()); } }
