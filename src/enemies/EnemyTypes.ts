export interface PatrolEnemyDefinition {
  readonly id: string;
  readonly kind: 'maintenance-bot';
  readonly x: number;
  readonly y: number;
  readonly patrolMinX: number;
  readonly patrolMaxX: number;
  readonly speed: number;
  readonly facing?: -1 | 1;
}
export interface DroneEnemyDefinition {
  readonly id: string;
  readonly kind: 'security-drone';
  readonly x: number;
  readonly y: number;
  readonly patrolRadiusX: number;
  readonly patrolSpeed: number;
  readonly alertMs: number;
  readonly chargeMs: number;
  readonly recoverMs: number;
  readonly cooldownMs: number;
  readonly chargeSpeed: number;
  readonly detectionRangeX: number;
  readonly detectionRangeY: number;
}
export type EnemyDefinition = PatrolEnemyDefinition | DroneEnemyDefinition;
export type DroneState = 'patrol' | 'alert' | 'charge' | 'recover' | 'disabled';
export type EnemyContactOutcome = 'player-killed' | 'enemy-disabled' | 'ignored';
export interface EnemyDebugState { id: string; kind: EnemyDefinition['kind']; state: string; x: number; y: number; velocityX: number; direction: -1 | 1; stateRemainingMs: number; detected: boolean; }
