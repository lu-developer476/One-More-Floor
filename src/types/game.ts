export enum PlayerState { IDLE='IDLE', RUNNING='RUNNING', JUMPING='JUMPING', FALLING='FALLING', WALL_SLIDING='WALL_SLIDING', DASHING='DASHING', DEAD='DEAD' }
export interface HudData { floor: number; remainingMs: number; deaths: number; dashReady: boolean; paused: boolean }
export interface ResultData { elapsedMs: number; deaths: number }
export interface LevelDefinition { id: string; floor: number; width: number; height: number; spawn: {x:number;y:number} }
