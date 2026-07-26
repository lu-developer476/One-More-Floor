import Phaser from 'phaser';

export const eventBus = new Phaser.Events.EventEmitter();

export const Events = {
  HUD: 'hud:update',
  COMPLETE: 'level:complete',
  SETTINGS_CHANGED: 'settings:changed',
  PLAYER_JUMP: 'player:jump',
  PLAYER_WALL_JUMP: 'player:wall-jump',
  PLAYER_DASH: 'player:dash',
  PLAYER_LAND: 'player:land',
  PLAYER_DEATH: 'player:death',
  MENU_MOVE: 'menu:move',
  MENU_CONFIRM: 'menu:confirm',
  DOOR_STATE: 'door:state',
  PAUSE_RESTART: 'pause:restart',
} as const;
