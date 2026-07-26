import type { LevelDefinition, PlatformDefinition } from '../types/game';
const ground = (width: number): PlatformDefinition => ({ x: width / 2, y: 680, width, height: 40 });
const base = (
  floor: number,
  name: string,
  width: number,
  durationMs: number,
  targetTimeMs: number,
  accentColor: number,
  backgroundColor: number,
): LevelDefinition => ({
  id: `floor-${String(floor).padStart(2, '0')}`,
  floor,
  name,
  width,
  height: 720,
  durationMs,
  targetTimeMs,
  accentColor,
  backgroundColor,
  spawn: { x: 90, y: 620 },
  practiceAnchors: [
    {
      id: `floor${String(floor).padStart(2, '0')}-anchor-start`,
      name: 'INICIO',
      x: 90,
      y: 620,
      startingSplitId: null,
    },
  ],
  exit: {
    id: `floor${String(floor).padStart(2, '0')}-exit`,
    x: width - 100,
    y: 620,
    label: 'ASCENSOR',
  },
  splits: [
    {
      id: `floor${String(floor).padStart(2, '0')}-split-entry`,
      name: 'SALIDA',
      x: 300,
      y: 480,
      width: 80,
      height: 240,
      order: 0,
    },
    {
      id: `floor${String(floor).padStart(2, '0')}-split-core`,
      name: 'MECÁNICA CENTRAL',
      x: Math.round(width * 0.52),
      y: 360,
      width: 100,
      height: 360,
      order: 1,
    },
    {
      id: `floor${String(floor).padStart(2, '0')}-split-final`,
      name: 'ASCENSOR',
      x: width - 140,
      y: 480,
      width: 100,
      height: 240,
      order: 2,
    },
  ],
  platforms: [ground(width)],
  movingPlatforms: [],
  fallingPlatforms: [],
  spikes: [],
  lasers: [],
  electricZones: [],
  fans: [],
  conveyors: [],
  doors: [],
  tutorials: [],
  ranks: {
    S: { maxTimeMs: targetTimeMs, maxDeaths: 0 },
    A: { maxTimeMs: Math.round(targetTimeMs * 1.35), maxDeaths: 2 },
    B: { maxTimeMs: Math.round(targetTimeMs * 1.75), maxDeaths: 5 },
  },
});
const evacuation = {
  ...base(1, 'EVACUACIÓN', 2800, 50000, 26000, 0x5ef1ff, 0x081521),
  practiceAnchors: [
    { id: 'floor01-anchor-start', name: 'INICIO', x: 90, y: 620, startingSplitId: null },
    {
      id: 'floor01-anchor-high',
      name: 'PLATAFORMAS ALTAS',
      x: 1510,
      y: 470,
      startingSplitId: 'floor01-split-entry',
    },
    {
      id: 'floor01-anchor-final',
      name: 'TRAMO FINAL',
      x: 2360,
      y: 620,
      startingSplitId: 'floor01-split-core',
    },
  ],
  platforms: [
    ground(2800),
    { x: 500, y: 570, width: 180 },
    { x: 820, y: 500, width: 160 },
    { x: 1160, y: 590, width: 190 },
    { x: 1510, y: 520, width: 180 },
    { x: 1870, y: 450, width: 160 },
    { x: 2200, y: 550, width: 190 },
    { x: 2500, y: 490, width: 160 },
  ],
  spikes: [
    { x: 650, y: 660, width: 96 },
    { x: 1340, y: 660, width: 96 },
    { x: 2030, y: 660, width: 128 },
  ],
  tutorials: [
    { x: 150, y: 570, text: 'A/D O ←/→  MOVER' },
    { x: 470, y: 500, text: 'ESPACIO / A  SALTO VARIABLE' },
    { x: 1080, y: 520, text: 'LOS BORDES PERDONAN: COYOTE + BUFFER' },
  ],
};
const maintenance = {
  ...base(2, 'MANTENIMIENTO', 3200, 56000, 30000, 0x77f29a, 0x071b17),
  practiceAnchors: [
    { id: 'floor02-anchor-start', name: 'INICIO', x: 90, y: 620, startingSplitId: null },
    {
      id: 'floor02-anchor-moving',
      name: 'PLATAFORMA MÓVIL',
      x: 650,
      y: 480,
      startingSplitId: 'floor02-split-entry',
    },
    {
      id: 'floor02-anchor-electric',
      name: 'ELECTRICIDAD',
      x: 1300,
      y: 430,
      startingSplitId: 'floor02-split-entry',
    },
  ],
  platforms: [
    ground(3200),
    { x: 650, y: 530, width: 170, oneWay: true },
    { x: 1300, y: 480, width: 150, oneWay: true },
    { x: 2100, y: 500, width: 170 },
  ],
  movingPlatforms: [
    { x: 950, y: 550, width: 150, axis: 'x' as const, distance: 280, speed: 105 },
    { x: 1700, y: 530, width: 140, axis: 'y' as const, distance: 220, speed: 90 },
  ],
  electricZones: [
    { x: 1450, y: 650, width: 220, height: 35, activeMs: 1100, inactiveMs: 1400, warningMs: 350 },
  ],
  spikes: [
    { x: 1120, y: 660, width: 96 },
    { x: 2350, y: 660, width: 220 },
  ],
  tutorials: [
    { x: 450, y: 570, text: 'SHIFT / RB  DASH' },
    { x: 1390, y: 580, text: '⚡ PARPADEO = ACTIVACIÓN' },
  ],
};
const ventilation = {
  ...base(3, 'VENTILACIÓN', 3300, 60000, 34000, 0xc7d5dc, 0x111820),
  practiceAnchors: [
    { id: 'floor03-anchor-start', name: 'INICIO', x: 90, y: 620, startingSplitId: null },
    {
      id: 'floor03-anchor-wall',
      name: 'WALL JUMP',
      x: 1050,
      y: 620,
      startingSplitId: 'floor03-split-entry',
    },
    {
      id: 'floor03-anchor-current',
      name: 'CORRIENTE',
      x: 1800,
      y: 620,
      startingSplitId: 'floor03-split-core',
    },
  ],
  platforms: [
    ground(3300),
    { x: 700, y: 520, width: 100 },
    { x: 1150, y: 420, width: 32, height: 420, style: 'wall' as const },
    { x: 1390, y: 390, width: 32, height: 500, style: 'wall' as const },
    { x: 1270, y: 610, width: 120 },
    { x: 1900, y: 470, width: 95 },
    { x: 2250, y: 390, width: 90 },
    { x: 2700, y: 510, width: 95 },
  ],
  fans: [
    { x: 780, y: 580, width: 240, height: 190, forceX: 0, forceY: -850 },
    { x: 2050, y: 500, width: 300, height: 180, forceX: 420, forceY: -80 },
  ],
  spikes: [
    { x: 1500, y: 660, width: 190 },
    { x: 2380, y: 660, width: 180 },
  ],
  tutorials: [
    { x: 1040, y: 270, text: 'SALTÁ CONTRA LA PARED' },
    { x: 1780, y: 570, text: 'LAS CORRIENTES MUESTRAN SU DIRECCIÓN' },
  ],
};
const reactor = {
  ...base(4, 'REACTOR', 3500, 58000, 33000, 0xff9c4a, 0x251007),
  practiceAnchors: [
    { id: 'floor04-anchor-start', name: 'INICIO', x: 90, y: 620, startingSplitId: null },
    {
      id: 'floor04-anchor-fragile',
      name: 'PLATAFORMAS FRÁGILES',
      x: 650,
      y: 470,
      startingSplitId: 'floor04-split-entry',
    },
    {
      id: 'floor04-anchor-door',
      name: 'PUERTA',
      x: 2760,
      y: 620,
      startingSplitId: 'floor04-split-core',
    },
  ],
  platforms: [
    ground(3500),
    { x: 650, y: 520, width: 160 },
    { x: 1450, y: 470, width: 140 },
    { x: 2300, y: 500, width: 150 },
  ],
  fallingPlatforms: [
    { x: 950, y: 560, width: 130, delayMs: 350 },
    { x: 1800, y: 530, width: 125, delayMs: 320 },
  ],
  lasers: [
    { x: 1250, y: 570, width: 18, height: 210, activeMs: 900, inactiveMs: 1200, warningMs: 350 },
    { x: 2650, y: 550, width: 260, height: 16, activeMs: 1000, inactiveMs: 1000, warningMs: 350 },
  ],
  conveyors: [
    { x: 350, y: 655, width: 350, height: 28, speed: 150 },
    { x: 2100, y: 655, width: 380, height: 28, speed: -170 },
  ],
  doors: [
    {
      x: 3000,
      y: 590,
      width: 44,
      height: 180,
      openMs: 4000,
      triggerX: 2800,
      triggerY: 640,
      triggerRadius: 75,
    },
  ],
  tutorials: [
    { x: 700, y: 600, text: 'CINTAS →  PLACAS FRÁGILES ≋' },
    { x: 2450, y: 410, text: 'LASER: TELEGRAPH ANTES DEL HAZ' },
  ],
};
const collapse = {
  ...base(5, 'COLAPSO', 3900, 56000, 35000, 0xff405c, 0x21060b),
  practiceAnchors: [
    { id: 'floor05-anchor-start', name: 'INICIO', x: 90, y: 620, startingSplitId: null },
    {
      id: 'floor05-anchor-walls',
      name: 'MUROS',
      x: 1300,
      y: 620,
      startingSplitId: 'floor05-split-entry',
    },
    {
      id: 'floor05-anchor-final',
      name: 'VENTILADOR FINAL',
      x: 2880,
      y: 620,
      startingSplitId: 'floor05-split-core',
    },
  ],
  platforms: [
    ground(3900),
    { x: 580, y: 520, width: 130 },
    { x: 1450, y: 430, width: 32, height: 430, style: 'wall' as const },
    { x: 1690, y: 380, width: 32, height: 520, style: 'wall' as const },
    { x: 2400, y: 470, width: 130 },
    { x: 3150, y: 420, width: 110 },
  ],
  movingPlatforms: [{ x: 900, y: 540, width: 130, axis: 'x' as const, distance: 250, speed: 130 }],
  fallingPlatforms: [
    { x: 2050, y: 530, width: 115, delayMs: 280 },
    { x: 2800, y: 510, width: 110, delayMs: 260 },
  ],
  spikes: [
    { x: 1100, y: 660, width: 160 },
    { x: 1800, y: 660, width: 180 },
    { x: 3300, y: 660, width: 200 },
  ],
  lasers: [
    { x: 2600, y: 560, width: 18, height: 220, activeMs: 750, inactiveMs: 850, warningMs: 300 },
  ],
  electricZones: [
    { x: 3500, y: 650, width: 240, height: 35, activeMs: 800, inactiveMs: 900, warningMs: 300 },
  ],
  fans: [{ x: 3000, y: 560, width: 300, height: 180, forceX: 350, forceY: -550 }],
  conveyors: [{ x: 500, y: 655, width: 300, height: 28, speed: 180 }],
  tutorials: [{ x: 120, y: 560, text: 'CORRÉ. TODO SE DERRUMBA.' }],
};
export const LEVELS: readonly LevelDefinition[] = [
  evacuation,
  maintenance,
  ventilation,
  reactor,
  collapse,
];
export const TOTAL_FLOORS = LEVELS.length;
export const LEVEL_DURATION_MS = 45000;
export const validateLevels = (levels: readonly LevelDefinition[]): boolean =>
  levels.length === 5 &&
  levels.every(
    (level, index) =>
      level.floor === index + 1 &&
      level.targetTimeMs < level.durationMs &&
      level.ranks.S.maxTimeMs === level.targetTimeMs &&
      level.durationMs >= 20000 &&
      level.durationMs <= 60000 &&
      level.exit.x < level.width,
  );
