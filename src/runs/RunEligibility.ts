export type RunMode = 'competitive' | 'practice' | 'assisted';
export interface EligibilityRequest {
  mode: RunMode;
  startAnchorId: string;
  gameplayAssist: boolean;
  e2e: boolean;
  allowE2ECompetitive?: boolean;
}
export interface RunEligibility {
  status: 'COMPETITIVO' | 'PRÁCTICA' | 'ASISTIDO';
  progress: boolean;
  bestTime: boolean;
  rank: boolean;
  ghost: boolean;
  reasons: readonly string[];
}
export function evaluateRunEligibility(request: EligibilityRequest): RunEligibility {
  const practice = request.mode === 'practice';
  const assisted = request.mode === 'assisted' || request.gameplayAssist;
  const harness = request.e2e && !request.allowE2ECompetitive;
  const competitive = !practice && !assisted && !harness;
  return {
    status: practice ? 'PRÁCTICA' : assisted || harness ? 'ASISTIDO' : 'COMPETITIVO',
    progress: !practice,
    bestTime: competitive,
    rank: competitive,
    ghost: competitive,
    reasons: [
      practice ? 'practice' : null,
      assisted ? 'gameplay-assist' : null,
      harness ? 'e2e-harness' : null,
    ].filter((v): v is string => Boolean(v)),
  };
}
