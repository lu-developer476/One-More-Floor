export const seconds = (milliseconds: number): string => (milliseconds / 1000).toFixed(2);
import type {LevelDefinition,Rank} from '../types/game';
export const calculateRank=(level:LevelDefinition,timeMs:number,deaths:number):Rank=>{for(const candidate of ['S','A','B'] as const){const threshold=level.ranks[candidate];if(timeMs<=threshold.maxTimeMs&&deaths<=threshold.maxDeaths)return candidate;}return 'C';};
