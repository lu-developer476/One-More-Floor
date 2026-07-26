import Phaser from 'phaser';

export const addSpikes = (
  group: Phaser.Physics.Arcade.StaticGroup,
  x: number,
  y: number,
  width: number,
): void => {
  for (let positionX = x; positionX < x + width; positionX += 32) {
    group.create(positionX, y, 'spike').setOrigin(0.5, 1).refreshBody();
  }
};
