import { describe,expect,it } from 'vitest';import { seconds } from './Statistics';
describe('statistics',()=>{it('formats milliseconds',()=>expect(seconds(12345)).toBe('12.35'));});

describe('ranking details',()=>{it('requires both time and death thresholds',async()=>{const {LEVELS}=await import('../config/levelConfig');const {calculateRank,nextRankGap}=await import('./Statistics');const level=LEVELS[0]!;expect(calculateRank(level,level.targetTimeMs,4)).toBe('B');expect(calculateRank(level,level.targetTimeMs,0)).toBe('S');expect(nextRankGap(level,'B',level.ranks.A.maxTimeMs+1000,3)).toContain('1.00 s');});});
