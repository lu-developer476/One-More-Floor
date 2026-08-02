import { expect, test, type Page } from '@playwright/test';
import { bootWithEmptySave } from './boot';

const startFloor = (page: Page, index: number) => page.evaluate((floor) => window.__OMF_E2E__?.startFloor(floor), index);
const run = (page: Page) => page.evaluate(() => window.__OMF_E2E__?.run() ?? null);

test.describe('real-browser enemy lifecycle', () => {
  test('maintenance bot is visible, moves, freezes in pause, and resets', async ({ page }) => {
    await bootWithEmptySave(page); await startFloor(page, 1);
    await expect.poll(async () => (await run(page))?.countdownFinished).toBe(true);
    await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1700); await page.keyboard.up('ArrowRight');
    const before = (await run(page))?.enemies[0]; expect(before?.kind).toBe('maintenance-bot'); expect(before?.active).toBe(true);
    await page.keyboard.press('KeyP'); const pausedX = (await run(page))?.enemies[0]?.x; await page.waitForTimeout(500); expect((await run(page))?.enemies[0]?.x).toBeCloseTo(pausedX ?? 0, 1);
    await page.keyboard.press('KeyP'); await page.keyboard.press('KeyR');
    await expect.poll(async () => (await run(page))?.enemies[0]?.state).toBe('patrol');
  });
  test('drone countdown and camera activation prevent an early attack', async ({ page }) => {
    await bootWithEmptySave(page); await startFloor(page, 2);
    const duringCountdown = (await run(page))?.enemies[0]; expect(duringCountdown?.dangerous).toBe(false);
    await expect.poll(async () => (await run(page))?.countdownFinished).toBe(true);
    const drone = (await run(page))?.enemies[0]; expect(drone?.kind).toBe('security-drone'); expect(drone?.state).toBe('patrol');
  });
});
