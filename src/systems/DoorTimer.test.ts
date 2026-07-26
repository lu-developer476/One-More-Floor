import { describe, expect, it } from 'vitest';
import { updateDoorTimer } from './DoorTimer';

describe('door timer', () => {
  it('opens, counts down and closes', () => {
    let state = updateDoorTimer({ phase: 'closed', remainingMs: 0 }, 0, true, false, 4000);
    expect(state).toEqual({ phase: 'open', remainingMs: 4000 });
    state = updateDoorTimer(state, 4000, false, false, 4000);
    expect(state.phase).toBe('closed');
  });
  it('waits until the doorway is clear', () => {
    let state = updateDoorTimer({ phase: 'open', remainingMs: 20 }, 20, false, true, 4000);
    expect(state.phase).toBe('waiting-for-clear');
    state = updateDoorTimer(state, 16, false, false, 4000);
    expect(state.phase).toBe('closed');
  });
  it('does not advance while paused when delta is zero', () => {
    expect(
      updateDoorTimer({ phase: 'open', remainingMs: 900 }, 0, false, false, 4000).remainingMs,
    ).toBe(900);
  });
});
