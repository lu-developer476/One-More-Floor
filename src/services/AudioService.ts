import Phaser from 'phaser';
export class AudioService {
  constructor(private readonly scene: Phaser.Scene, volume = 0.7) { this.scene.sound.volume = volume; }
  setVolume(value: number): void { this.scene.sound.volume = Phaser.Math.Clamp(value, 0, 1); }
  toggleMute(): boolean { this.scene.sound.mute = !this.scene.sound.mute; return this.scene.sound.mute; }
  playEffect(key: string): void { if (this.scene.cache.audio.exists(key)) this.scene.sound.play(key); }
  playMusic(key: string): void { if (this.scene.cache.audio.exists(key)) this.scene.sound.play(key, { loop: true }); }
}
