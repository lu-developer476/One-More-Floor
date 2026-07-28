export const emptySaveV9 = {
  version: 9,
  unlockedFloor: 1,
  floors: {},
  settings: {},
  input: {},
  tower: {},
} as const;
export const unlockedSaveV9 = { ...emptySaveV9, unlockedFloor: 5 } as const;
export const saveV6 = { version: 6, unlockedFloor: 2, floors: {}, settings: {} } as const;
export const saveV7WithGhost = {
  version: 7,
  unlockedFloor: 2,
  floors: { '1': { completed: true, bestTimeMs: 1000, bestGhost: null } },
  settings: { showGhost: true },
} as const;
export const towerCheckpoint = {
  schemaVersion: 1,
  mode: 'competitive',
  status: 'active',
  nextFloor: 1,
  totalElapsedMs: 0,
  totalDeaths: 0,
  results: [],
  eligible: true,
  sessionId: 'tower-e2e-checkpoint',
} as const;
export const corruptTowerCheckpoint = { ...towerCheckpoint, nextFloor: 4 } as const;
export const analyticsEnabled = { version: 1, floors: {}, tower: { attempts: 0 } } as const;
export const analyticsDisabled = {
  ...emptySaveV9,
  settings: { localAnalyticsEnabled: false },
} as const;
