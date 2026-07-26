export interface SaveData { bestTimeMs: number | null; fewestDeaths: number | null; volume: number; fullscreen: boolean }
const KEY = 'one-more-floor.save.v1';
const defaults = (): SaveData => ({ bestTimeMs: null, fewestDeaths: null, volume: 0.7, fullscreen: false });
export class StorageService {
  constructor(private readonly storage: Pick<Storage, 'getItem'|'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage) {}
  load(): SaveData {
    if (!this.storage) return defaults();
    try {
      const value: unknown = JSON.parse(this.storage.getItem(KEY) ?? 'null');
      if (!value || typeof value !== 'object') return defaults();
      const raw = value as Record<string, unknown>;
      return {
        bestTimeMs: validPositive(raw.bestTimeMs), fewestDeaths: validNonNegative(raw.fewestDeaths),
        volume: typeof raw.volume === 'number' && raw.volume >= 0 && raw.volume <= 1 ? raw.volume : 0.7,
        fullscreen: typeof raw.fullscreen === 'boolean' ? raw.fullscreen : false,
      };
    } catch { return defaults(); }
  }
  save(data: SaveData): void { try { this.storage?.setItem(KEY, JSON.stringify(data)); } catch { /* Storage can be unavailable. */ } }
  recordResult(elapsedMs: number, deaths: number): SaveData {
    const data = this.load();
    data.bestTimeMs = data.bestTimeMs === null ? elapsedMs : Math.min(data.bestTimeMs, elapsedMs);
    data.fewestDeaths = data.fewestDeaths === null ? deaths : Math.min(data.fewestDeaths, deaths);
    this.save(data); return data;
  }
}
const validPositive = (v: unknown): number|null => typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
const validNonNegative = (v: unknown): number|null => typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null;
