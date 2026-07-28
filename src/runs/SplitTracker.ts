import type { SplitDefinition } from '../types/game';

export interface SplitTime {
  readonly id: string;
  readonly name: string;
  readonly cumulativeMs: number;
  readonly segmentMs: number;
}
export const cumulativeSplitRecord = (times: readonly SplitTime[]): Record<string, number> =>
  Object.fromEntries(times.map((split) => [split.id, split.cumulativeMs]));
export const segmentSplitRecord = (times: readonly SplitTime[]): Record<string, number> =>
  Object.fromEntries(times.map((split) => [split.id, split.segmentMs]));

export class SplitTracker {
  private nextIndex = 0;
  private previousMs = 0;
  private readonly times: SplitTime[] = [];
  private readonly initialIndex: number;

  constructor(
    private readonly definitions: readonly SplitDefinition[],
    startingSplitId: string | null = null,
  ) {
    if (startingSplitId) {
      const index = definitions.findIndex(({ id }) => id === startingSplitId);
      this.nextIndex = index < 0 ? 0 : index + 1;
    }
    this.initialIndex = this.nextIndex;
  }

  trigger(id: string, elapsedMs: number): SplitTime | null {
    const expected = this.definitions[this.nextIndex];
    if (
      !expected ||
      expected.id !== id ||
      !Number.isFinite(elapsedMs) ||
      elapsedMs < this.previousMs
    )
      return null;
    const result = Object.freeze({
      id,
      name: expected.name,
      cumulativeMs: Math.round(elapsedMs),
      segmentMs: Math.round(elapsedMs - this.previousMs),
    });
    this.times.push(result);
    this.previousMs = elapsedMs;
    this.nextIndex += 1;
    return result;
  }

  get current(): SplitTime | null {
    return this.times.at(-1) ?? null;
  }
  get next(): SplitDefinition | null {
    return this.definitions[this.nextIndex] ?? null;
  }
  get completed(): readonly SplitTime[] {
    return this.times;
  }
  get omitted(): readonly string[] {
    return this.definitions.slice(0, this.initialIndex).map(({ id }) => id);
  }
  reset(): void {
    this.nextIndex = this.initialIndex;
    this.previousMs = 0;
    this.times.length = 0;
  }
}
