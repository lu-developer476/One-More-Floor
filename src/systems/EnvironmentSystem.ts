import Phaser from 'phaser';
import type { LevelDefinition } from '../types/game';

export class EnvironmentSystem {
  private readonly farLayer: Phaser.GameObjects.TileSprite;
  private readonly midLayer: Phaser.GameObjects.TileSprite;
  private readonly pipeLayer: Phaser.GameObjects.TileSprite;
  private readonly alarmGlow: Phaser.GameObjects.Rectangle;
  private readonly dust: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly sparks: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly smoke: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(
    scene: Phaser.Scene,
    private readonly level: LevelDefinition,
  ) {
    scene.add.rectangle(0, 0, level.width, level.height, 0x080b12).setOrigin(0).setDepth(-120);

    this.farLayer = scene.add
      .tileSprite(0, 0, level.width, level.height, 'bg-far')
      .setOrigin(0)
      .setScrollFactor(0.08, 0.12)
      .setDepth(-110);

    this.midLayer = scene.add
      .tileSprite(0, 90, level.width, level.height - 90, 'bg-mid')
      .setOrigin(0)
      .setScrollFactor(0.28, 0.24)
      .setAlpha(0.82)
      .setDepth(-100);

    this.pipeLayer = scene.add
      .tileSprite(0, 120, level.width, level.height - 120, 'pipe-tile')
      .setOrigin(0)
      .setScrollFactor(0.58, 0.55)
      .setAlpha(0.68)
      .setDepth(-90);

    this.dust = scene.add.particles(0, 0, 'particle-dust', {
      x: { min: 0, max: level.width },
      y: { min: 70, max: level.height - 90 },
      lifespan: { min: 4_500, max: 8_500 },
      frequency: 150,
      quantity: 1,
      speedX: { min: -8, max: 8 },
      speedY: { min: -5, max: 2 },
      alpha: { start: 0.28, end: 0 },
      scale: { start: 0.9, end: 0.25 },
    });
    this.dust.setDepth(-40);

    this.sparks = scene.add.particles(0, 0, 'particle-spark', {
      lifespan: { min: 180, max: 420 },
      speed: { min: 80, max: 260 },
      angle: { min: 195, max: 345 },
      gravityY: 520,
      alpha: { start: 1, end: 0 },
      scale: { start: 1.2, end: 0.2 },
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    this.sparks.setDepth(35);

    this.smoke = scene.add.particles(0, 0, 'particle-smoke', {
      lifespan: { min: 650, max: 1_150 },
      speedX: { min: -20, max: 20 },
      speedY: { min: -55, max: -18 },
      alpha: { start: 0.35, end: 0 },
      scale: { start: 0.45, end: 1.8 },
      rotate: { min: -30, max: 30 },
      emitting: false,
    });
    this.smoke.setDepth(20);

    this.alarmGlow = scene.add
      .rectangle(480, 0, 960, 180, level.accentColor, 0)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(80);

    scene.add
      .rectangle(480, 10, 960, 20, 0x000000, 0.38)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(79);

    scene.add
      .rectangle(480, 526, 960, 28, 0x000000, 0.48)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(79);
  }

  update(cameraScrollX: number, urgency: number, time: number): void {
    this.farLayer.tilePositionX = cameraScrollX * 0.06;
    this.midLayer.tilePositionX = cameraScrollX * 0.15 + time * 0.004;
    this.pipeLayer.tilePositionX = cameraScrollX * 0.28;

    const pulse = (Math.sin(time * 0.012) + 1) * 0.5;
    const critical = Phaser.Math.Clamp((urgency - 0.72) / 0.28, 0, 1);
    this.alarmGlow.setFillStyle(this.level.accentColor, critical * (0.08 + pulse * 0.13));
  }

  burstSparks(x: number, y: number, quantity = 12): void {
    this.sparks.explode(quantity, x, y);
  }

  burstSmoke(x: number, y: number, quantity = 6): void {
    this.smoke.explode(quantity, x, y);
  }

  destroy(): void {
    this.dust.destroy();
    this.sparks.destroy();
    this.smoke.destroy();
  }
}
