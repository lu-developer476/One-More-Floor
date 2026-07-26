import { describe,expect,it } from 'vitest';import { seconds } from './Statistics';
describe('statistics',()=>{it('formats milliseconds',()=>expect(seconds(12345)).toBe('12.35'));});
