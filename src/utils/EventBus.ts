import Phaser from 'phaser';

export const eventBus = new Phaser.Events.EventEmitter();

export const Events = {
  HUD: 'hud:update',
  COMPLETE: 'level:complete',
  SETTINGS_CHANGED: 'settings:changed',
  PLAYER_JUMP: 'player:jump',
  PLAYER_AIR_JUMP: 'player:air-jump',
  PLAYER_WALL_JUMP: 'player:wall-jump',
  PLAYER_DASH: 'player:dash',
  PLAYER_LAND: 'player:land',
  PLAYER_DEATH: 'player:death',
  MENU_MOVE: 'menu:move',
  MENU_CONFIRM: 'menu:confirm',
  DOOR_STATE: 'door:state',
  PAUSE_RESTART: 'pause:restart',
  RUN_ABANDON: 'run:abandon',
  DEVICE_CHANGED: 'input:device-changed',
  BINDINGS_CHANGED: 'input:bindings-changed',
  DIALOG_OPENED: 'dialog:opened',
  DIALOG_CLOSED: 'dialog:closed',
  RUN_MODE_CHANGED: 'run:mode-changed',
  GHOST_CHANGED: 'ghost:changed',
  ELIGIBILITY_CHANGED: 'run:eligibility-changed',
} as const;
