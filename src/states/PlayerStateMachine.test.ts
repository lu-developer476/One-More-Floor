import { describe, expect, it } from 'vitest';
import { PlayerStateMachine } from './PlayerStateMachine';
import { PlayerState } from '../types/game';
describe('PlayerStateMachine', () => {
  it('moves through active movement and landing states', () => {
    const machine = new PlayerStateMachine();
    for (const state of [
      PlayerState.RUNNING,
      PlayerState.JUMPING,
      PlayerState.FALLING,
      PlayerState.WALL_SLIDING,
      PlayerState.DASHING,
      PlayerState.LANDING,
      PlayerState.IDLE,
    ]) {
      expect(machine.transition(state)).toBe(true);
      expect(machine.state).toBe(state);
    }
  });

  it('locks completion independently from death and can unlock', () => {
    const machine = new PlayerStateMachine();
    machine.lock();
    expect(machine.state).toBe(PlayerState.LOCKED);
    expect(machine.transition(PlayerState.RUNNING)).toBe(false);
    machine.unlock();
    expect(machine.state).toBe(PlayerState.IDLE);
  });

  it('locks after death', () => {
    const machine = new PlayerStateMachine();
    machine.transition(PlayerState.RUNNING);
    machine.kill();
    machine.transition(PlayerState.IDLE);
    expect(machine.state).toBe(PlayerState.DEAD);
  });
});
