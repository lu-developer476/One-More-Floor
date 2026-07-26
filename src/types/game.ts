export enum PlayerState {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  JUMPING = 'JUMPING',
  FALLING = 'FALLING',
  WALL_SLIDING = 'WALL_SLIDING',
  DASHING = 'DASHING',
  DEAD = 'DEAD',
}

export type Axis = 'x' | 'y';
export type PlatformStyle = 'floor' | 'wall' | 'warning';

export interface Point {
  x: number;
  y: number;
}

export interface PlatformDefinition extends Point {
  width: number;
  height?: number;
  style?: PlatformStyle;
}

export interface SpikeDefinition extends Point {
  width: number;
  flipY?: boolean;
}

export interface MovingPlatformDefinition extends Point {
  width: number;
  height?: number;
  axis: Axis;
  distance: number;
  speed: number;
}

export interface FallingPlatformDefinition extends Point {
  width: number;
  height?: number;
  delayMs?: number;
}

export interface LaserDefinition extends Point {
  width: number;
  height: number;
  activeMs: number;
  inactiveMs: number;
  phaseMs?: number;
}

export interface ExitDefinition extends Point {
  label: string;
}

export interface LevelDefinition {
  id: string;
  floor: number;
  name: string;
  width: number;
  height: number;
  durationMs: number;
  accentColor: number;
  spawn: Point;
  exit: ExitDefinition;
  platforms: readonly PlatformDefinition[];
  spikes: readonly SpikeDefinition[];
  movingPlatforms: readonly MovingPlatformDefinition[];
  fallingPlatforms: readonly FallingPlatformDefinition[];
  lasers: readonly LaserDefinition[];
}

export interface HudData {
  floor: number;
  totalFloors: number;
  floorName: string;
  remainingMs: number;
  durationMs: number;
  deaths: number;
  dashReady: boolean;
  paused: boolean;
  progress: number;
}

export interface LevelSceneData {
  levelIndex?: number;
  deaths?: number;
  totalElapsedMs?: number;
}

export interface ResultData {
  elapsedMs: number;
  deaths: number;
  floorsCompleted: number;
  totalFloors: number;
}
