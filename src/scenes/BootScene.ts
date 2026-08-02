import Phaser from 'phaser';
import { createEnemyTextures } from '../enemies/EnemyTextures';

type DrawTexture = (graphics: Phaser.GameObjects.Graphics) => void;
type PlayerPose =
  'idle-a' | 'idle-b' | 'run-a' | 'run-b' | 'run-c' | 'jump' | 'fall' | 'wall' | 'dash';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.createWorldTextures();
    this.createPlayerTextures();
    createEnemyTextures(this);
    this.createAnimations();
    this.scene.start('Menu');
  }

  private createWorldTextures(): void {
    this.generateTexture('platform', 64, 24, (graphics) => {
      graphics.fillStyle(0x263746).fillRect(0, 0, 64, 24);
      graphics.fillStyle(0x5f7c90).fillRect(0, 0, 64, 4);
      graphics.fillStyle(0x17232e).fillRect(0, 18, 64, 6);
      graphics.fillStyle(0x7696aa).fillRect(8, 8, 4, 4).fillRect(52, 8, 4, 4);
      graphics.lineStyle(1, 0x0b1118, 0.9).strokeRect(0, 0, 64, 24);
    });

    this.generateTexture('platform-warning', 64, 24, (graphics) => {
      graphics.fillStyle(0x2a3138).fillRect(0, 0, 64, 24);
      graphics.fillStyle(0xf5c84c).fillRect(0, 0, 64, 5);
      for (let x = -10; x < 70; x += 20) {
        graphics.fillStyle(0x17191c).fillTriangle(x, 5, x + 10, 5, x + 20, 0);
      }
      graphics.fillStyle(0x151b20).fillRect(0, 18, 64, 6);
      graphics.lineStyle(1, 0x050709).strokeRect(0, 0, 64, 24);
    });

    this.generateTexture('wall', 32, 64, (graphics) => {
      graphics.fillStyle(0x233442).fillRect(0, 0, 32, 64);
      graphics.fillStyle(0x4e6c80).fillRect(0, 0, 4, 64).fillRect(28, 0, 4, 64);
      graphics.lineStyle(2, 0x111a22).lineBetween(5, 16, 27, 16);
      graphics.lineBetween(5, 32, 27, 32);
      graphics.lineBetween(5, 48, 27, 48);
      graphics.fillStyle(0x86a1b2).fillCircle(9, 9, 2).fillCircle(23, 55, 2);
    });

    this.generateTexture('moving-platform', 128, 24, (graphics) => {
      graphics.fillStyle(0x244152).fillRoundedRect(0, 0, 128, 24, 5);
      graphics.fillStyle(0x5ef1ff).fillRect(8, 2, 112, 3);
      graphics.fillStyle(0x17242d).fillRect(12, 10, 104, 7);
      graphics.fillStyle(0x5ef1ff, 0.45).fillRect(20, 12, 88, 3);
      graphics.lineStyle(1, 0x071015).strokeRoundedRect(0, 0, 128, 24, 5);
    });

    this.generateTexture('falling-platform', 96, 24, (graphics) => {
      graphics.fillStyle(0x3b3330).fillRect(0, 0, 96, 24);
      graphics.fillStyle(0xff7b55).fillRect(0, 0, 96, 4);
      graphics.lineStyle(2, 0x171312).lineBetween(20, 5, 36, 19);
      graphics.lineBetween(36, 19, 50, 7);
      graphics.lineBetween(50, 7, 66, 19);
      graphics.fillStyle(0x8b746a).fillCircle(8, 12, 2).fillCircle(88, 12, 2);
    });

    this.generateTexture('spike', 32, 28, (graphics) => {
      graphics.fillStyle(0x6b1026).fillRect(0, 23, 32, 5);
      graphics.fillStyle(0xff405c).fillTriangle(0, 24, 8, 2, 16, 24);
      graphics.fillTriangle(12, 24, 20, 0, 28, 24);
      graphics.fillStyle(0xffa0ad, 0.8).fillTriangle(7, 18, 8, 4, 11, 18);
    });

    this.generateTexture('door', 64, 96, (graphics) => {
      graphics.fillStyle(0x101820).fillRoundedRect(1, 1, 62, 94, 4);
      graphics.lineStyle(4, 0xf5c84c).strokeRoundedRect(3, 3, 58, 90, 4);
      graphics.fillStyle(0x233542).fillRect(11, 12, 42, 70);
      graphics.fillStyle(0x17242d).fillRect(15, 16, 34, 62);
      graphics.lineStyle(2, 0x415767).lineBetween(32, 16, 32, 78);
      graphics.fillStyle(0x5ef1ff).fillCircle(46, 47, 4);
      graphics.fillStyle(0x5ef1ff, 0.25).fillCircle(46, 47, 8);
      graphics.fillStyle(0x0a0e12).fillRect(7, 84, 50, 6);
    });

    this.generateTexture('laser-emitter', 28, 32, (graphics) => {
      graphics.fillStyle(0x1d2831).fillRoundedRect(0, 0, 28, 32, 4);
      graphics.lineStyle(2, 0x526c7e).strokeRoundedRect(1, 1, 26, 30, 4);
      graphics.fillStyle(0xff405c).fillCircle(14, 16, 6);
      graphics.fillStyle(0xffc2ca).fillCircle(14, 16, 2);
      graphics.fillStyle(0x0a0e12).fillRect(5, 4, 18, 3).fillRect(5, 25, 18, 3);
    });

    this.generateTexture('particle-dust', 4, 4, (graphics) => {
      graphics.fillStyle(0xb6c7d1, 0.9).fillCircle(2, 2, 2);
    });

    this.generateTexture('particle-spark', 6, 3, (graphics) => {
      graphics.fillStyle(0xfff2b0).fillRoundedRect(0, 0, 6, 3, 1);
    });

    this.generateTexture('particle-smoke', 12, 12, (graphics) => {
      graphics.fillStyle(0x71808a, 0.45).fillCircle(6, 6, 6);
      graphics.fillStyle(0xa2adb3, 0.2).fillCircle(4, 4, 3);
    });

    this.generateTexture('bg-far', 256, 128, (graphics) => {
      graphics.fillStyle(0x0a0f17).fillRect(0, 0, 256, 128);
      graphics.fillStyle(0x111d28).fillRect(0, 30, 256, 98);
      for (let x = 12; x < 256; x += 48) {
        graphics.fillStyle(0x1d2b37).fillRect(x, 16, 28, 96);
        graphics.fillStyle(0x233746).fillRect(x + 5, 28, 18, 5);
        graphics.fillStyle(0x0a1118).fillRect(x + 7, 48, 14, 40);
      }
      graphics.fillStyle(0x263c4a, 0.45).fillRect(0, 102, 256, 3);
    });

    this.generateTexture('bg-mid', 256, 128, (graphics) => {
      graphics.clear();
      graphics.lineStyle(10, 0x152630, 0.85).lineBetween(0, 34, 256, 34);
      graphics.lineStyle(4, 0x38505e, 0.65).lineBetween(0, 29, 256, 29);
      graphics.lineStyle(14, 0x111e27, 0.9).lineBetween(0, 92, 256, 92);
      graphics.lineStyle(3, 0x304956, 0.6).lineBetween(0, 86, 256, 86);
      for (let x = 36; x < 256; x += 92) {
        graphics.fillStyle(0x1e313d, 0.9).fillCircle(x, 34, 14);
        graphics.lineStyle(3, 0x4c6573, 0.7).strokeCircle(x, 34, 11);
      }
    });

    this.generateTexture('pipe-tile', 192, 96, (graphics) => {
      graphics.clear();
      graphics.lineStyle(16, 0x172832, 0.9).lineBetween(0, 70, 192, 70);
      graphics.lineStyle(4, 0x395361, 0.7).lineBetween(0, 64, 192, 64);
      graphics.fillStyle(0x203641, 0.9).fillRect(38, 18, 18, 65);
      graphics.fillStyle(0x4a6472, 0.65).fillRect(42, 18, 4, 65);
      graphics.fillStyle(0x203641, 0.9).fillRect(128, 0, 18, 80);
      graphics.fillStyle(0x4a6472, 0.65).fillRect(132, 0, 4, 80);
    });
  }

  private createPlayerTextures(): void {
    const poses: readonly [string, PlayerPose][] = [
      ['player-idle-0', 'idle-a'],
      ['player-idle-1', 'idle-b'],
      ['player-run-0', 'run-a'],
      ['player-run-1', 'run-b'],
      ['player-run-2', 'run-c'],
      ['player-jump', 'jump'],
      ['player-fall', 'fall'],
      ['player-wall', 'wall'],
      ['player-dash', 'dash'],
    ];

    for (const [key, pose] of poses) {
      this.generateTexture(key, 36, 46, (graphics) => this.drawPlayer(graphics, pose));
    }
  }

  private drawPlayer(graphics: Phaser.GameObjects.Graphics, pose: PlayerPose): void {
    const crouched = pose === 'dash';
    const bodyY = crouched ? 16 : pose === 'idle-b' ? 10 : 9;
    const bodyHeight = crouched ? 19 : 25;
    const headY = crouched ? 12 : 5;
    const legY = bodyY + bodyHeight;

    graphics.fillStyle(0x071018, 0.5).fillRoundedRect(7, bodyY + 3, 24, bodyHeight + 4, 5);
    graphics.fillStyle(0x5ef1ff).fillRoundedRect(8, bodyY, 22, bodyHeight, 4);
    graphics.fillStyle(0x9ff7ff).fillRect(10, bodyY + 2, 4, bodyHeight - 4);
    graphics.fillStyle(0x12222d).fillRoundedRect(10, headY, 18, 13, 4);
    graphics.fillStyle(0x5ef1ff).fillRect(11, headY + 1, 16, 3);
    graphics.fillStyle(0xf5c84c).fillRect(23, headY + 6, 3, 3);
    graphics.fillStyle(0x18313d).fillRect(12, bodyY + 8, 14, 5);

    if (pose === 'run-a') {
      graphics
        .fillStyle(0x5ef1ff)
        .fillRect(7, legY, 8, 9)
        .fillRect(22, legY - 2, 8, 6);
    } else if (pose === 'run-b') {
      graphics.fillStyle(0x5ef1ff).fillRect(10, legY, 7, 8).fillRect(20, legY, 7, 8);
    } else if (pose === 'run-c') {
      graphics
        .fillStyle(0x5ef1ff)
        .fillRect(7, legY - 2, 8, 6)
        .fillRect(22, legY, 8, 9);
    } else if (pose === 'jump') {
      graphics
        .fillStyle(0x5ef1ff)
        .fillRect(9, legY - 1, 8, 7)
        .fillRect(21, legY - 4, 8, 6);
      graphics.fillStyle(0x5ef1ff).fillRect(4, bodyY + 9, 6, 5);
    } else if (pose === 'fall') {
      graphics.fillStyle(0x5ef1ff).fillRect(8, legY, 8, 7).fillRect(22, legY, 8, 7);
      graphics
        .fillStyle(0x5ef1ff)
        .fillRect(4, bodyY + 7, 6, 5)
        .fillRect(28, bodyY + 7, 6, 5);
    } else if (pose === 'wall') {
      graphics
        .fillStyle(0x5ef1ff)
        .fillRect(11, legY - 1, 7, 7)
        .fillRect(22, legY - 5, 7, 6);
      graphics.fillStyle(0x5ef1ff).fillRect(29, bodyY + 5, 5, 11);
    } else if (pose === 'dash') {
      graphics
        .fillStyle(0x5ef1ff)
        .fillRect(11, legY - 2, 8, 5)
        .fillRect(21, legY - 2, 8, 5);
      graphics.fillStyle(0xf5c84c).fillRect(1, bodyY + 8, 8, 3);
    } else {
      graphics.fillStyle(0x5ef1ff).fillRect(10, legY, 7, 8).fillRect(21, legY, 7, 8);
    }

    graphics.lineStyle(1, 0x071018, 0.8).strokeRoundedRect(8, bodyY, 22, bodyHeight, 4);
  }

  private createAnimations(): void {
    this.anims.create({
      key: 'player-idle',
      frames: [{ key: 'player-idle-0' }, { key: 'player-idle-1' }],
      frameRate: 2.5,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-run',
      frames: [
        { key: 'player-run-0' },
        { key: 'player-run-1' },
        { key: 'player-run-2' },
        { key: 'player-run-1' },
      ],
      frameRate: 12,
      repeat: -1,
    });
  }

  private generateTexture(key: string, width: number, height: number, draw: DrawTexture): void {
    if (this.textures.exists(key)) {
      return;
    }

    const graphics = this.add.graphics();
    draw(graphics);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }
}
