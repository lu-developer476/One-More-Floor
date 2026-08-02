import type { EnemyContactInput, EnemyContactOutcome } from './EnemyTypes';

/** Pure gameplay authority: visual state and Phaser objects never participate. */
export const resolveEnemyContact = (input: EnemyContactInput): EnemyContactOutcome => {
  if (!input.playerAlive) return 'ignored';
  if (!input.contactDangerous && !input.canBeDisabled) return 'ignored';
  if (input.dashActive && input.canBeDisabled) return 'enemy-disabled';
  return input.contactDangerous ? 'player-killed' : 'ignored';
};
