import { eventBus, Events, type AccessibleStatusEvent } from '../utils/EventBus';
const REGION_ID = 'game-status';
export class GameAccessibilityBridge {
  private readonly region: HTMLDivElement;
  private lastMessage = '';
  private timer: number | undefined;
  constructor(parent: HTMLElement) {
    const existing = document.getElementById(REGION_ID);
    this.region = existing instanceof HTMLDivElement ? existing : document.createElement('div');
    this.region.id = REGION_ID;
    this.region.className = 'visually-hidden';
    this.region.setAttribute('role', 'status');
    this.region.setAttribute('aria-live', 'polite');
    this.region.setAttribute('aria-atomic', 'true');
    if (!this.region.parentElement) parent.append(this.region);
    eventBus.on(Events.ACCESSIBLE_STATUS, this.handleStatus, this);
  }
  destroy(): void {
    eventBus.off(Events.ACCESSIBLE_STATUS, this.handleStatus, this);
    if (this.timer !== undefined) window.clearTimeout(this.timer);
    this.region.textContent = '';
    this.region.remove();
  }
  private handleStatus(event: AccessibleStatusEvent): void {
    const message = event.message.trim();
    if (!message || message === this.lastMessage) return;
    if (this.timer !== undefined) window.clearTimeout(this.timer);
    const update = () => {
      this.region.setAttribute('aria-live', event.priority);
      this.region.textContent = message;
      this.lastMessage = message;
      this.timer = undefined;
    };
    if (event.priority === 'assertive') update();
    else this.timer = window.setTimeout(update, 40);
  }
}
