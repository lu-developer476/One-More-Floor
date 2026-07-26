export type CollapsePhase = 'normal' | 'warning' | 'critical' | 'collapse';
export const collapsePhase = (remainingMs: number, durationMs: number): CollapsePhase => {
  const ratio = remainingMs / durationMs;
  if (remainingMs <= 0) return 'collapse';
  if (ratio <= 0.2) return 'critical';
  if (ratio <= 0.45) return 'warning';
  return 'normal';
};
