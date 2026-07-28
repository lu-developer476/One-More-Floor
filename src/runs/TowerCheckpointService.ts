import { TowerRunSession, type TowerCheckpoint } from './TowerRunSession';
export const TOWER_CHECKPOINT_KEY = 'one-more-floor.tower.v1';
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export class TowerCheckpointService {
  constructor(
    private readonly storage: Store | null = typeof localStorage === 'undefined'
      ? null
      : localStorage,
  ) {}
  load(): TowerRunSession | null {
    try {
      return TowerRunSession.restore(
        JSON.parse(this.storage?.getItem(TOWER_CHECKPOINT_KEY) ?? 'null'),
      );
    } catch {
      this.clear();
      return null;
    }
  }
  save(session: TowerRunSession): void {
    const value = session.serialize();
    if (value.status === 'completed' || value.status === 'abandoned') {
      this.clear();
      return;
    }
    try {
      this.storage?.setItem(TOWER_CHECKPOINT_KEY, JSON.stringify(value));
    } catch {
      /* isolated quota failure */
    }
  }
  raw(): TowerCheckpoint | null {
    return this.load()?.serialize() ?? null;
  }
  clear(): void {
    this.storage?.removeItem(TOWER_CHECKPOINT_KEY);
  }
}
