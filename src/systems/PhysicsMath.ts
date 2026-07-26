export const MAX_ENVIRONMENT_DELTA_SECONDS = 0.05;

export function clampDeltaSeconds(deltaSeconds: number): number {
  return Math.max(0, Math.min(MAX_ENVIRONMENT_DELTA_SECONDS, deltaSeconds));
}

export function acceleratedVelocity(
  velocity: number,
  acceleration: number,
  deltaSeconds: number,
  maximum: number,
): number {
  const next = velocity + acceleration * clampDeltaSeconds(deltaSeconds);
  return Math.max(-maximum, Math.min(maximum, next));
}

export function conveyorVelocity(current: number, target: number, deltaSeconds: number): number {
  const response = Math.min(1, clampDeltaSeconds(deltaSeconds) * 18);
  return current + (target - current) * response;
}

export type LandingKind = 'soft' | 'hard';

export function classifyLanding(impactVelocity: number, hardThreshold = 430): LandingKind {
  return impactVelocity >= hardThreshold ? 'hard' : 'soft';
}
