export enum PlayerState {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  JUMPING = 'JUMPING',
  FALLING = 'FALLING',
  WALL_SLIDING = 'WALL_SLIDING',
  DASHING = 'DASHING',
  LANDING = 'LANDING',
  DEAD = 'DEAD',
  LOCKED = 'LOCKED',
}
export type Axis = 'x' | 'y';
export type Rank = 'S' | 'A' | 'B' | 'C';
export interface Point {
  x: number;
  y: number;
}
export interface RectDefinition extends Point {
  id?: string;
  width: number;
  height?: number;
}
export interface PlatformDefinition extends RectDefinition {
  style?: 'floor' | 'wall' | 'warning';
  oneWay?: boolean;
}
export interface MovingPlatformDefinition extends RectDefinition {
  axis: Axis;
  distance: number;
  speed: number;
}
export interface FallingPlatformDefinition extends RectDefinition {
  delayMs?: number;
}
export interface SpikeDefinition extends Point {
  id?: string;
  width: number;
  flipY?: boolean;
}
export interface TimedHazardDefinition extends Point {
  id?: string;
  width: number;
  height: number;
  activeMs: number;
  inactiveMs: number;
  warningMs: number;
  phaseMs?: number;
}
export interface FanDefinition extends RectDefinition {
  forceX: number;
  forceY: number;
}
export interface ConveyorDefinition extends RectDefinition {
  speed: number;
}
export interface DoorDefinition extends RectDefinition {
  openMs: number;
  triggerX: number;
  triggerY: number;
  triggerRadius: number;
}
export interface TutorialDefinition extends Point {
  text?: string;
  action?: import('../input/InputAction').InputAction;
  suffix?: string;
}
export interface RankThreshold {
  maxTimeMs: number;
  maxDeaths: number;
}
export interface PracticeAnchor extends Point {
  id: string;
  name: string;
  startingSplitId: string | null;
}
export interface SplitDefinition extends Point {
  id: string;
  name: string;
  width: number;
  height: number;
  order: number;
}
export interface LevelDefinition {
  id: string;
  floor: number;
  name: string;
  width: number;
  height: number;
  durationMs: number;
  targetTimeMs: number;
  accentColor: number;
  backgroundColor: number;
  spawn: Point;
  practiceAnchors: readonly PracticeAnchor[];
  exit: Point & { id: string; label: string };
  splits: readonly SplitDefinition[];
  platforms: readonly PlatformDefinition[];
  movingPlatforms: readonly MovingPlatformDefinition[];
  fallingPlatforms: readonly FallingPlatformDefinition[];
  spikes: readonly SpikeDefinition[];
  lasers: readonly TimedHazardDefinition[];
  electricZones: readonly TimedHazardDefinition[];
  fans: readonly FanDefinition[];
  conveyors: readonly ConveyorDefinition[];
  doors: readonly DoorDefinition[];
  tutorials: readonly TutorialDefinition[];
  ranks: Record<Exclude<Rank, 'C'>, RankThreshold>;
}
export interface HudData {
  floor: number;
  totalFloors: number;
  floorName: string;
  remainingMs: number;
  durationMs: number;
  deaths: number;
  dashReady: boolean;
  airJumpReady: boolean;
  paused: boolean;
  progress: number;
  attemptMs: number;
  bestTimeMs: number | null;
  ghostActive: boolean;
  runMode: RunMode;
  eligibility: string;
  practiceAnchor: string;
  nextSplit: string | null;
  nextReferenceMs: number | null;
  lastSplit: import('../runs/SplitTracker').SplitTime | null;
  lastDeltaMs: number | null;
  bestTheoreticalMs: number | null;
}
export type RunMode = 'competitive' | 'practice' | 'assisted';
export type RunScope = 'floor' | 'tower';
export interface LevelSceneData {
  levelIndex?: number;
  mode?: RunMode;
  anchorId?: string;
  allowE2ECompetitive?: boolean;
  deaths?: number;
  totalElapsedMs?: number;
  gameplayAssist?: boolean;
  scope?: RunScope;
  towerRunId?: string | null;
}
export interface ResultData {
  elapsedMs: number;
  deaths: number;
  floor: number;
  levelIndex: number;
  totalElapsedMs: number;
  final: boolean;
  mode: RunMode;
  eligibility: import('../runs/RunEligibility').RunEligibility;
  ghostRun: import('../runs/GhostTypes').GhostRun;
  context: import('../runs/AttemptSession').RunContext;
  splits: Record<string, number>;
  segments: Record<string, number>;
}
