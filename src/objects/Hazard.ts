import Phaser from 'phaser';

export const addSpikes = (
  group: Phaser.Physics.Arcade.StaticGroup,
  x: number,
  y: number,
  width: number,
): void => {
  for (let positionX = x; positionX < x + width; positionX += 32) {
    const spike = group
      .create(positionX, y, 'spike')
      .setOrigin(0.5, 1) as Phaser.Physics.Arcade.Sprite;
    spike.refreshBody();
    const body = spike.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(22, 19).setOffset(5, 8);
  }
};
