import type { EnemyActor } from './EnemyActor';
import type { EnemyContactOutcome } from './EnemyTypes';
export const resolveEnemyContact = (enemy: EnemyActor, isDashing: boolean): EnemyContactOutcome => {
  if (enemy.disabled || !enemy.sprite.active) return 'ignored';
  if (isDashing) return enemy.disable() ? 'enemy-disabled' : 'ignored';
  return 'player-killed';
};
