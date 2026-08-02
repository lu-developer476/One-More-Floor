export interface EnemyBaseDefinition {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  /** Split after which this encounter becomes relevant. null means the opening segment. */
  readonly activationSplitId: string | null;
}
export interface PatrolEnemyDefinition extends EnemyBaseDefinition {
  readonly kind: 'maintenance-bot'; readonly patrolMinX: number; readonly patrolMaxX: number;
  readonly speed: number; readonly facing?: -1 | 1;
}
export interface DroneEnemyDefinition extends EnemyBaseDefinition {
  readonly kind: 'security-drone'; readonly patrolRadiusX: number; readonly patrolSpeed: number;
  readonly alertMs: number; readonly chargeMs: number; readonly recoverMs: number;
  readonly cooldownMs: number; readonly chargeSpeed: number;
  readonly detectionRangeX: number; readonly detectionRangeY: number;
}
export type EnemyDefinition = PatrolEnemyDefinition | DroneEnemyDefinition;
export type MaintenanceBotState = 'patrol' | 'turning' | 'disabled';
export type DroneState = 'patrol' | 'alert' | 'charge' | 'recover' | 'disabled';
export type EnemyContactOutcome = 'player-killed' | 'enemy-disabled' | 'ignored';
export interface EnemyInteractionState {
  readonly active: boolean; readonly visibleToCamera: boolean; readonly contactDangerous: boolean;
  readonly attacking: boolean; readonly canBeDisabled: boolean;
}
export interface EnemyContactInput {
  readonly contactDangerous: boolean; readonly canBeDisabled: boolean;
  readonly dashActive: boolean; readonly playerAlive: boolean;
}
export interface EnemyEffectSink {
  alert(enemyId: string): void; charge(enemyId: string): void; disabled(enemyId: string): void;
}
export interface EnemyDebugState {
  id: string; kind: EnemyDefinition['kind']; state: string; active: boolean; dangerous: boolean;
  contactDangerous: boolean; attacking: boolean; canBeDisabled: boolean; cameraActive: boolean;
  x: number; y: number; bodyX: number; bodyY: number; velocityX: number; direction: -1 | 1;
  stateRemainingMs: number; detected: boolean; lineOfSight: boolean; visibleToCamera: boolean;
  visualBounds: { x: number; y: number; width: number; height: number };
  bodyBounds: { x: number; y: number; width: number; height: number };
}
export interface EnemyBlocker { readonly x: number; readonly y: number; readonly width: number; readonly height: number; active?: boolean; }
export interface EnemyWorldBlockers {
  readonly staticPlatforms: Phaser.Physics.Arcade.StaticGroup;
  readonly timedDoors: readonly import('../objects/TimedDoor').TimedDoor[];
  readonly worldBounds: Phaser.Geom.Rectangle;
}
