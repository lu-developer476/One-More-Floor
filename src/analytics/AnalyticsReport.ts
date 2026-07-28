import { LEVELS } from '../config/levelConfig';
import type { AnalyticsData } from './LocalAnalyticsService';
import type { SaveData } from '../services/StorageService';
import { calculateBestTheoretical } from '../systems/SplitComparisons';
export const createAnalyticsReport = (analytics: AnalyticsData, save: SaveData): string =>
  JSON.stringify({
    gameVersion: '0.8.0', schemaVersion: analytics.version,
    floors: LEVELS.map((level) => {
      const record = save.floors[String(level.floor)];
      return {
        floor: level.floor, analytics: analytics.floors[String(level.floor)] ?? null,
        pb: record?.bestTimeMs ?? null, bestRunSplits: record?.bestRunSplits ?? {},
        bestSegments: record?.bestSegments ?? {},
        bestTheoreticalMs: calculateBestTheoretical(level, record?.bestSegments ?? {}),
        durationMs: level.durationMs, targetTimeMs: level.targetTimeMs,
      };
    }),
  }, null, 2);
