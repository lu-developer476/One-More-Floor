import { describe, expect, it } from 'vitest';
import { TowerCheckpointService } from './TowerCheckpointService';
import { TowerRunSession } from './TowerRunSession';
class Store {
  value: string | null = null;
  fail = false;
  getItem() { return this.value; }
  setItem(_key: string, value: string) { if (this.fail) throw new DOMException('quota', 'QuotaExceededError'); this.value = value; }
  removeItem() { this.value = null; }
}
describe('TowerCheckpointService outcomes', () => {
  it('reports saved and quota outcomes', () => {
    const store = new Store();
    const service = new TowerCheckpointService(store);
    const session = TowerRunSession.start('competitive', 'tower-write-outcome');
    expect(service.save(session)).toMatchObject({ saved: true, reason: 'saved' });
    store.fail = true;
    expect(service.save(session)).toMatchObject({ saved: false, reason: 'quota' });
  });
  it('clears an abandoned session', () => {
    const store = new Store(); const service = new TowerCheckpointService(store);
    const session = TowerRunSession.start('competitive', 'tower-clear-outcome');
    service.save(session); session.abandon();
    expect(service.save(session)).toEqual({ saved: false, cleared: true, reason: 'abandoned' });
    expect(store.value).toBeNull();
  });
});
