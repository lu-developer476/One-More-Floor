import type { Settings } from './StorageService';

export type Effect =
  | 'jump'
  | 'airJump'
  | 'land'
  | 'dash'
  | 'wallJump'
  | 'death'
  | 'elevator'
  | 'laser'
  | 'electricity'
  | 'break'
  | 'countdown'
  | 'go'
  | 'record'
  | 'complete'
  | 'menuMove'
  | 'menuConfirm'
  | 'door';

const tones: Record<Effect, number> = {
  jump: 440,
  airJump: 740,
  land: 110,
  dash: 220,
  wallJump: 520,
  death: 70,
  elevator: 330,
  laser: 760,
  electricity: 620,
  break: 95,
  countdown: 280,
  go: 720,
  record: 920,
  complete: 660,
  menuMove: 300,
  menuConfirm: 480,
  door: 190,
};

class ProceduralAudioService {
  private context: AudioContext | null = null;
  private volume = 0.7;
  private muted = false;
  private paused = false;
  private readonly lastPlayed = new Map<Effect, number>();

  unlock(): void {
    this.context ??= new AudioContext();
    void this.context.resume();
  }

  apply(settings: Settings): void {
    this.volume = Math.max(0, Math.min(1, settings.volume));
    this.muted = settings.mute;
  }

  pause(): void {
    this.paused = true;
  }
  resume(): void {
    this.paused = false;
  }

  play(effect: Effect, cooldownMs = 70): void {
    const nowMs = performance.now();
    if (
      !this.context ||
      this.muted ||
      this.paused ||
      nowMs - (this.lastPlayed.get(effect) ?? 0) < cooldownMs
    )
      return;
    this.lastPlayed.set(effect, nowMs);
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    oscillator.type = effect === 'death' || effect === 'break' ? 'sawtooth' : 'square';
    oscillator.frequency.setValueAtTime(tones[effect], now);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(40, tones[effect] * 0.62),
      now + 0.1,
    );
    gain.gain.setValueAtTime(this.volume * 0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.13);
  }
}

export const audioService = new ProceduralAudioService();
