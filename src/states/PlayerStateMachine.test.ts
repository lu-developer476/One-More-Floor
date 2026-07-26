import { describe,expect,it } from 'vitest';import { PlayerStateMachine } from './PlayerStateMachine';import { PlayerState } from '../types/game';
describe('PlayerStateMachine',()=>{it('locks after death',()=>{const machine=new PlayerStateMachine();machine.transition(PlayerState.RUNNING);machine.kill();machine.transition(PlayerState.IDLE);expect(machine.state).toBe(PlayerState.DEAD);});});
