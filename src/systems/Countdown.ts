export class Countdown {
  private remaining: number;
  private running = true;
  constructor(readonly durationMs: number) {
    this.remaining = durationMs;
  }
  update(deltaMs: number): number {
    if (this.running) this.remaining = Math.max(0, this.remaining - Math.max(0, deltaMs));
    return this.remaining;
  }
  stop(): void {
    this.running = false;
  }
  get remainingMs(): number {
    return this.remaining;
  }
  get expired(): boolean {
    return this.remaining === 0;
  }
}
