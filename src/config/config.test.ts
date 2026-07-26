import { describe,expect,it } from 'vitest';import { MOVEMENT } from './movementConfig';import { LEVEL_DURATION_MS } from './levelConfig';
describe('configuration',()=>{it('keeps requested timing values',()=>{expect(MOVEMENT.coyoteMs).toBe(100);expect(MOVEMENT.jumpBufferMs).toBe(120);expect(MOVEMENT.dashDurationMs).toBe(150);expect(LEVEL_DURATION_MS).toBe(45000);});});
