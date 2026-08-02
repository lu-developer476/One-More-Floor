import { expect, test, type Page } from '@playwright/test';
import { bootWithEmptySave } from './boot';
import { installBrowserErrorCollector } from './browserErrors';

const startFloor = (page: Page, index: number) => page.evaluate((floor) => window.__OMF_E2E__?.startFloor(floor), index);
const run = (page: Page) => page.evaluate(() => window.__OMF_E2E__?.run() ?? null);

test.describe('real-browser enemy lifecycle', () => {
  test.beforeEach(async ({ page }) => { installBrowserErrorCollector(page); });

  test('maintenance bot contact, pause, dash and restart use real input', async ({ page }) => {
    const errors = installBrowserErrorCollector(page);
    await bootWithEmptySave(page); await startFloor(page, 1);
    await expect.poll(async () => (await run(page))?.countdownFinished).toBe(true);
    await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1700); await page.keyboard.up('ArrowRight');
    const before = (await run(page))?.enemies[0]; expect(before?.kind).toBe('maintenance-bot'); expect(before?.active).toBe(true);
    await page.keyboard.press('KeyP'); const paused = (await run(page))?.enemies[0]; await page.waitForTimeout(500); const frozen = (await run(page))?.enemies[0];
    expect(frozen?.x).toBeCloseTo(paused?.x ?? 0, 1); expect(frozen?.contactDangerous).toBe(false);
    await page.keyboard.press('KeyP');
    await page.keyboard.down('ArrowRight'); await page.keyboard.press('KeyS'); await page.waitForTimeout(450); await page.keyboard.up('ArrowRight');
    expect((await run(page))?.enemies[0]?.active).toBe(false);
    await page.keyboard.press('KeyR');
    await expect.poll(async () => (await run(page))?.enemies[0]?.state).toBe('patrol');
    expect(errors.all()).toEqual([]);
  });

  test('drone respects countdown, blockers, alert, charge and recover', async ({ page }) => {
    const errors = installBrowserErrorCollector(page);
    await bootWithEmptySave(page); await startFloor(page, 2);
    const duringCountdown = (await run(page))?.enemies[0]; expect(duringCountdown?.contactDangerous).toBe(false); expect(duringCountdown?.attacking).toBe(false);
    await expect.poll(async () => (await run(page))?.countdownFinished).toBe(true);
    const drone = (await run(page))?.enemies[0]; expect(drone?.kind).toBe('security-drone'); expect(drone?.state).toBe('patrol');
    expect(drone?.attacking).toBe(false); expect((await run(page))?.enemyBlockers?.blockerRebuildCount).toBe(1);
    await page.keyboard.down('ArrowRight');
    await expect.poll(async () => (await run(page))?.enemies.some((enemy) => enemy.state === 'alert')).toBe(true);
    await expect.poll(async () => (await run(page))?.enemies.some((enemy) => enemy.state === 'charge')).toBe(true);
    await expect.poll(async () => (await run(page))?.enemies.some((enemy) => enemy.state === 'recover')).toBe(true);
    await page.keyboard.up('ArrowRight');
    expect(errors.all()).toEqual([]);
  });
});
