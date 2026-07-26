import Phaser from 'phaser';
export const eventBus = new Phaser.Events.EventEmitter();
export const Events = { HUD: 'hud:update', COMPLETE: 'level:complete' } as const;
