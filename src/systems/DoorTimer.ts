export type DoorPhase = 'closed' | 'open' | 'waiting-for-clear';

export interface DoorTimerState {
  phase: DoorPhase;
  remainingMs: number;
}

export function updateDoorTimer(
  state: DoorTimerState,
  deltaMs: number,
  triggered: boolean,
  obstructed: boolean,
  durationMs: number,
): DoorTimerState {
  if (triggered) return { phase: 'open', remainingMs: durationMs };
  if (state.phase === 'closed') return state;
  const remainingMs = Math.max(0, state.remainingMs - Math.max(0, deltaMs));
  if (remainingMs > 0) return { phase: 'open', remainingMs };
  if (obstructed) return { phase: 'waiting-for-clear', remainingMs: 0 };
  return { phase: 'closed', remainingMs: 0 };
}
