import { expect, test, type Page } from '@playwright/test';
import { bootWithEmptySave } from './boot';

const startFloor = (page: Page, index: number) => page.evaluate((floor) => window.__OMF_E2E__?.startFloor(floor), index);
const run = (page: Page) => page.evaluate(() => window.__OMF_E2E__?.run() ?? null);

test.describe('real-browser enemy lifecycle', () => {
  test('maintenance bot is visible, moves, freezes in pause, and resets', async ({ page }) => {
    const browserErrors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
    page.on('pageerror', (error) => browserErrors.push(error.message));
    await bootWithEmptySave(page); await startFloor(page, 1);
    await expect.poll(async () => (await run(page))?.countdownFinished).toBe(true);
    await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1700); await page.keyboard.up('ArrowRight');
    const before = (await run(page))?.enemies[0]; expect(before?.kind).toBe('maintenance-bot'); expect(before?.active).toBe(true);
    await page.keyboard.press('KeyP'); const paused = (await run(page))?.enemies[0]; await page.waitForTimeout(1000); const afterPause = (await run(page))?.enemies[0]; expect(afterPause?.x).toBeCloseTo(paused?.x ?? 0, 1); expect(afterPause?.contactDangerous).toBe(false);
    await page.keyboard.press('KeyP'); await page.keyboard.press('KeyR');
    await expect.poll(async () => (await run(page))?.enemies[0]?.state).toBe('patrol');
    expect(browserErrors).toEqual([]);
  });
  test('drone countdown and camera activation prevent an early attack', async ({ page }) => {
    const browserErrors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
    page.on('pageerror', (error) => browserErrors.push(error.message));
    await bootWithEmptySave(page); await startFloor(page, 2);
    const duringCountdown = (await run(page))?.enemies[0]; expect(duringCountdown?.contactDangerous).toBe(false); expect(duringCountdown?.attacking).toBe(false);
    await expect.poll(async () => (await run(page))?.countdownFinished).toBe(true);
    const drone = (await run(page))?.enemies[0]; expect(drone?.kind).toBe('security-drone'); expect(drone?.state).toBe('patrol');
    expect(drone?.attacking).toBe(false);
    expect((await run(page))?.enemyBlockers?.blockerRebuildCount).toBe(1);
    expect(browserErrors).toEqual([]);
  });
});
