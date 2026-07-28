import { LocalAnalyticsService } from '../analytics/LocalAnalyticsService';
import { StorageService } from '../services/StorageService';
import { TowerCheckpointService } from './TowerCheckpointService';

export interface TowerAbandonOutcome {
  abandoned: boolean;
  checkpointCleared: boolean;
  analyticsRecorded: boolean;
  floor: number | null;
}

export class TowerRunCoordinator {
  constructor(
    private readonly checkpoints = new TowerCheckpointService(),
    private readonly storage = new StorageService(),
  ) {}

  abandon(): TowerAbandonOutcome {
    const session = this.checkpoints.load();
    if (!session || !['active', 'between-floors'].includes(session.state.status)) {
      return { abandoned: false, checkpointCleared: false, analyticsRecorded: false, floor: null };
    }
    const floor = session.state.nextFloor;
    const analyticsEnabled = this.storage.load().settings.localAnalyticsEnabled;
    new LocalAnalyticsService(analyticsEnabled).towerAbandon(floor);
    session.abandon();
    const write = this.checkpoints.save(session);
    return {
      abandoned: true,
      checkpointCleared: write.cleared,
      analyticsRecorded: analyticsEnabled,
      floor,
    };
  }
}
