import { PlayerState } from '../types/game';
export class PlayerStateMachine {
  private current: PlayerState = PlayerState.IDLE;
  get state(): PlayerState { return this.current; }
  transition(next: PlayerState): void { if (this.current !== PlayerState.DEAD) this.current = next; }
  kill(): void { this.current = PlayerState.DEAD; }
}
