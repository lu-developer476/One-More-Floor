export type TimedCycleState = 'active' | 'warning' | 'inactive';
export const timedCycleState = (timeMs: number, activeMs: number, inactiveMs: number, warningMs: number, phaseMs = 0): TimedCycleState => {
  const cycle = Math.max(1, activeMs + inactiveMs);
  const phase = ((Math.max(0, timeMs) + phaseMs) % cycle + cycle) % cycle;
  if (phase < activeMs) return 'active';
  return cycle - phase <= warningMs ? 'warning' : 'inactive';
};
