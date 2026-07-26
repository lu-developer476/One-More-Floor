import Phaser from 'phaser';
export const addSpikes = (scene: Phaser.Scene, group: Phaser.Physics.Arcade.StaticGroup, x:number,y:number,width:number): void => { for(let px=x;px<x+width;px+=32) group.create(px,y,'spike').setOrigin(0.5,1).refreshBody(); };
