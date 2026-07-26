import Phaser from 'phaser';
import { LEVEL_DURATION_MS } from '../config/levelConfig';
import { Player } from '../entities/Player';
import { ExitDoor } from '../objects/ExitDoor';
import { addSpikes } from '../objects/Hazard';
import { MovingPlatform } from '../objects/MovingPlatform';
import { CollapseSystem } from '../systems/CollapseSystem';
import { LevelManager } from '../systems/LevelManager';
import { RespawnSystem } from '../systems/RespawnSystem';
import { eventBus, Events } from '../utils/EventBus';

export class LevelScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private moving!: MovingPlatform;
  private collapse!: CollapseSystem;
  private respawn!: RespawnSystem;
  private dead = false;
  private complete = false;
  private paused = false;
  private deaths = 0;
  private lastStart = false;

  constructor() {
    super('Level');
  }

  create(): void {
    this.dead = false;
    this.complete = false;
    this.paused = false;
    this.deaths = (this.registry.get('deaths') as number) || 0;

    const level = new LevelManager().get();
    this.physics.world.setBounds(0, 0, level.width, level.height);
    this.cameras.main.setBounds(0, 0, level.width, level.height);

    this.createWorld();
    this.player = new Player(this, level.spawn.x, level.spawn.y);
    this.collapse = new CollapseSystem(this, LEVEL_DURATION_MS);
    this.respawn = new RespawnSystem(this);

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.moving);

    const hazards = this.physics.add.staticGroup();
    addSpikes(hazards, 510, 620, 224);
    addSpikes(hazards, 2200, 620, 180);
    this.physics.add.overlap(this.player, hazards, () => this.die());

    const door = new ExitDoor(this, 2870, 530);
    this.physics.add.overlap(this.player, door, () => this.finish());

    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.setDeadzone(260, 130);

    this.scene.launch('UI');
    this.input.keyboard?.on('keydown-R', this.restart, this);
    this.input.keyboard?.on('keydown-ESC', this.togglePause, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-R', this.restart, this);
      this.input.keyboard?.off('keydown-ESC', this.togglePause, this);
      this.events.off('player:dash', this.dashTrail, this);
      this.scene.stop('UI');
    });

    this.events.on('player:dash', this.dashTrail, this);
  }

  update(time: number, delta: number): void {
    const pad = this.input.gamepad?.getPad(0);
    const start = Boolean(pad?.buttons[9]?.pressed);

    if (start && !this.lastStart) {
      this.togglePause();
    }

    this.lastStart = start;

    if (this.paused || this.dead || this.complete) {
      return;
    }

    this.player.update();
    this.moving.update(time);
    this.collapse.update(delta);

    if (this.player.y > 690 || this.collapse.timer.expired) {
      this.die();
    }

    eventBus.emit(Events.HUD, {
      floor: 1,
      remainingMs: this.collapse.timer.remainingMs,
      deaths: this.deaths,
      dashReady: this.player.dashAvailable,
      paused: false,
    });
  }

  private createWorld(): void {
    this.platforms = this.physics.add.staticGroup();

    const add = (x: number, y: number, width: number, height = 24): void => {
      const platform = this.platforms.create(
        x,
        y,
        'platform',
      ) as Phaser.Physics.Arcade.Sprite;
      platform.setDisplaySize(width, height).refreshBody();
    };

    add(180, 640, 360);
    add(420, 570, 150);
    add(830, 640, 190);
    add(1010, 540, 150);
    add(1200, 450, 120);
    add(1400, 640, 220);
    add(1580, 500, 32, 280);
    add(1740, 380, 32, 520);
    add(1660, 610, 130);
    add(1900, 430, 220);
    add(2140, 520, 150);
    add(2500, 640, 500);
    add(2820, 590, 340);

    this.moving = new MovingPlatform(this, 780, 510, 720, 900);

    this.add.text(1510, 270, 'SALTO EN PARED', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#91a6b6',
    });

    this.add.text(2180, 440, 'DASH →', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f5c84c',
    });

    for (let x = 0; x < 3000; x += 180) {
      this.add.rectangle(x, 80, 2, 90, 0x263746, 0.45);
    }
  }

  private die(): void {
    if (this.dead || this.complete) {
      return;
    }

    this.dead = true;
    this.deaths += 1;
    this.registry.set('deaths', this.deaths);
    this.player.kill();
    this.collapse.stop();
    this.cameras.main.shake(180, 0.008);
    this.tweens.add({ targets: this.player, alpha: 0, duration: 320 });
    this.respawn.restart();
  }

  private restart(): void {
    this.scene.restart();
  }

  private togglePause(): void {
    if (this.dead || this.complete) {
      return;
    }

    this.paused = !this.paused;

    if (this.paused) {
      this.physics.world.pause();
    } else {
      this.physics.world.resume();
    }

    eventBus.emit(Events.HUD, {
      floor: 1,
      remainingMs: this.collapse.timer.remainingMs,
      deaths: this.deaths,
      dashReady: this.player.dashAvailable,
      paused: this.paused,
    });
  }

  private finish(): void {
    if (this.complete || this.dead) {
      return;
    }

    this.complete = true;
    this.collapse.stop();
    this.player.setAcceleration(0).setVelocity(0);

    const elapsedMs = LEVEL_DURATION_MS - this.collapse.timer.remainingMs;
    this.scene.stop('UI');
    this.registry.set('deaths', 0);
    this.scene.start('Results', { elapsedMs, deaths: this.deaths });
  }

  private dashTrail(x: number, y: number): void {
    for (let index = 0; index < 5; index += 1) {
      const rectangle = this.add.rectangle(
        x - index * 10,
        y,
        18,
        28,
        0x5ef1ff,
        0.55,
      );

      this.tweens.add({
        targets: rectangle,
        alpha: 0,
        duration: 180,
        delay: index * 18,
        onComplete: () => rectangle.destroy(),
      });
    }
  }
}
