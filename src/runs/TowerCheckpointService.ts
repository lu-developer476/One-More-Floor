import { TowerRunSession, type TowerCheckpoint } from './TowerRunSession';
export const TOWER_CHECKPOINT_KEY = 'one-more-floor.tower.v1';
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export interface CheckpointWriteOutcome {
  saved: boolean;
  cleared: boolean;
  reason: 'saved' | 'completed' | 'abandoned' | 'unavailable' | 'quota';
}
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
  save(session: TowerRunSession): CheckpointWriteOutcome {
    const value = session.serialize();
    if (value.status === 'completed' || value.status === 'abandoned') {
      this.clear();
      return {
        saved: false,
        cleared: true,
        reason: value.status === 'completed' ? 'completed' : 'abandoned',
      };
    }
    if (!this.storage) return { saved: false, cleared: false, reason: 'unavailable' };
    try {
      this.storage.setItem(TOWER_CHECKPOINT_KEY, JSON.stringify(value));
      return { saved: true, cleared: false, reason: 'saved' };
    } catch {
      return { saved: false, cleared: false, reason: 'quota' };
    }
  }
  raw(): TowerCheckpoint | null {
    return this.load()?.serialize() ?? null;
  }
  clear(): void {
    this.storage?.removeItem(TOWER_CHECKPOINT_KEY);
  }
}
