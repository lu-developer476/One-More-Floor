export interface FocusItem { id: string; enabled?: boolean }
export class FocusModel {
  private index = 0;
  constructor(private items: readonly FocusItem[], initialId?: string) {
    const requested = initialId ? items.findIndex((item) => item.id === initialId && item.enabled !== false) : -1;
    this.index = requested >= 0 ? requested : Math.max(0, items.findIndex((item) => item.enabled !== false));
  }
  get focused(): FocusItem | null { return this.items[this.index] ?? null; }
  move(delta: number): FocusItem | null {
    if (!this.items.length) return null;
    for (let count = 0; count < this.items.length; count += 1) {
      this.index = (this.index + delta + this.items.length) % this.items.length;
      if (this.items[this.index]!.enabled !== false) break;
    }
    return this.focused;
  }
  focus(id: string): boolean {
    const index = this.items.findIndex((item) => item.id === id && item.enabled !== false);
    if (index < 0) return false;
    this.index = index; return true;
  }
}
