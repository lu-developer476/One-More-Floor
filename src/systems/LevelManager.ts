import { LEVELS } from '../config/levelConfig';
export class LevelManager {
  get(index = 0) {
    const level = LEVELS[index];
    if (!level) throw new Error(`Unknown level ${index}`);
    return level;
  }
  hasNext(index: number) {
    return index + 1 < LEVELS.length;
  }
}
