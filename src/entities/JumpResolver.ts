import { MOVEMENT } from '../config/movementConfig';

export type JumpKind = 'ground' | 'coyote' | 'wall' | 'air';

export interface JumpDecision {
  performed: boolean;
  kind: JumpKind | null;
  impulseY: number;
  consumeAirJump: boolean;
}

export interface JumpContext {
  grounded: boolean;
  withinCoyote: boolean;
  atWall: boolean;
  withinWallCoyote: boolean;
  airJumpsRemaining: number;
  freshPress: boolean;
}

const rejected = (): JumpDecision => ({
  performed: false,
  kind: null,
  impulseY: 0,
  consumeAirJump: false,
});

/** Pure, single-authority jump priority: ground, coyote, wall, then one fresh air jump. */
export const resolveJump = (context: JumpContext): JumpDecision => {
  if (context.grounded)
    return { performed: true, kind: 'ground', impulseY: MOVEMENT.jumpSpeed, consumeAirJump: false };
  if (context.withinCoyote)
    return { performed: true, kind: 'coyote', impulseY: MOVEMENT.jumpSpeed, consumeAirJump: false };
  if (context.atWall || context.withinWallCoyote)
    return { performed: true, kind: 'wall', impulseY: MOVEMENT.wallJumpY, consumeAirJump: false };
  if (context.freshPress && context.airJumpsRemaining > 0)
    return { performed: true, kind: 'air', impulseY: MOVEMENT.airJumpSpeed, consumeAirJump: true };
  return rejected();
};
