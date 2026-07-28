import { describe, expect, it } from 'vitest';
import { TowerRunSession } from './TowerRunSession';
import { calculateTowerRank, TOWER_RANK_THRESHOLDS } from './TowerRank';
import { LEVELS } from '../config/levelConfig';
describe('TowerRunSession', () => {
  it('enforces ordered, single completions and accumulates gameplay', () => {
    const session = TowerRunSession.start('competitive', 'tower-test-session');
    expect(() => session.completeFloor(2, 1000, 0, 'S')).toThrow();
    session.completeFloor(1, 1000, 2, 'A');
    expect(session.state.totalElapsedMs).toBe(1000);
    expect(session.state.totalDeaths).toBe(2);
    expect(() => session.completeFloor(1, 1000, 0, 'S')).toThrow();
    session.advance();
    for (let floor = 2; floor <= LEVELS.length; floor += 1) {
      session.completeFloor(floor, 1000, 1, 'A');
      if (floor < LEVELS.length) session.advance();
    }
    expect(session.state.status).toBe('completed');
    expect(session.state.results).toHaveLength(LEVELS.length);
    expect(() => session.completeFloor(LEVELS.length, 1, 0, 'S')).toThrow();
  });
  it('validates serialization and corruption', () => {
    const session = TowerRunSession.start('assisted', 'tower-test-restore');
    session.completeFloor(1, 500, 0, 'S');
    expect(TowerRunSession.restore(session.serialize())?.state.nextFloor).toBe(2);
    expect(TowerRunSession.restore({ ...session.serialize(), totalElapsedMs: 501 })).toBeNull();
  });
  it('supports abandonment once', () => {
    const session = TowerRunSession.start('competitive', 'tower-test-abandon');
    session.abandon();
    expect(session.state.status).toBe('abandoned');
    expect(() => session.abandon()).toThrow();
  });
});
describe('calculateTowerRank', () => {
  it('uses exact documented boundaries', () => {
    expect(calculateTowerRank(TOWER_RANK_THRESHOLDS.S.maxTimeMs, 0)).toBe('S');
    expect(calculateTowerRank(TOWER_RANK_THRESHOLDS.S.maxTimeMs + 1, 0)).toBe('A');
    expect(calculateTowerRank(TOWER_RANK_THRESHOLDS.B.maxTimeMs + 1, 0)).toBe('C');
  });
});

describe('checkpoint integrity', () => {
  it('derives eligibility from mode instead of trusting storage', () => {
    const assisted = TowerRunSession.start('assisted', 'tower-assisted-derived').serialize();
    const competitive = TowerRunSession.start('competitive', 'tower-competitive-derived').serialize();
    expect(TowerRunSession.restore({ ...assisted, eligible: true })?.state.eligible).toBe(false);
    expect(TowerRunSession.restore({ ...competitive, eligible: false })?.state.eligible).toBe(true);
  });
  it('rejects incoherent statuses and floor progression', () => {
    const active = TowerRunSession.start('competitive', 'tower-status-check').serialize();
    expect(TowerRunSession.restore({ ...active, status: 'between-floors' })).toBeNull();
    expect(TowerRunSession.restore({ ...active, nextFloor: 2 })).toBeNull();
    expect(TowerRunSession.restore({ ...active, status: 'completed' })).toBeNull();
  });
});
