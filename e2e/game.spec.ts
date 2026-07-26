import { expect, test } from '@playwright/test';

const errors = (page: import('@playwright/test').Page) => {
  const messages: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') messages.push(message.text());
  });
  page.on('pageerror', (error) => messages.push(error.message));
  return messages;
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Menu'));
});

test('menu loads without console errors and canvas has valid dimensions', async ({ page }) => {
  const messages = errors(page);
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(
    await page
      .locator('canvas')
      .evaluate((canvas) => ({ width: canvas.clientWidth, height: canvas.clientHeight })),
  ).toEqual({ width: 960, height: 540 });
  expect(messages).toEqual([]);
});

test('keyboard starts the unlocked floor and pause resumes without duplicate HUD', async ({
  page,
}) => {
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Level'));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Pause'));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !window.__OMF_E2E__?.scene().includes('Pause'));
  expect(
    (await page.evaluate(() => window.__OMF_E2E__?.scene())).filter((key) => key === 'UI'),
  ).toHaveLength(1);
});

test('mouse selects a floor option', async ({ page }) => {
  await page.mouse.click(480, 190);
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Level'));
});

test('settings change independently and persist after reload', async ({ page }) => {
  for (let index = 0; index < 6; index += 1) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Settings'));
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.__OMF_E2E__?.save().settings.mute)).toBe(true);
  await page.reload();
  await page.waitForFunction(() => Boolean(window.__OMF_E2E__));
  expect(await page.evaluate(() => window.__OMF_E2E__?.save().settings.mute)).toBe(true);
});

test('fullscreen request does not break the game', async ({ page }) => {
  await page.evaluate(() =>
    document
      .querySelector('canvas')
      ?.requestFullscreen()
      .catch(() => undefined),
  );
  await expect(page.locator('canvas')).toBeVisible();
});

test('death restarts floor without duplicating HUD', async ({ page }) => {
  await page.evaluate(() => window.__OMF_E2E__?.startFloor(0));
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Level'));
  await page.evaluate(() => window.__OMF_E2E__?.killPlayer());
  await page.waitForTimeout(700);
  expect(
    (await page.evaluate(() => window.__OMF_E2E__?.scene())).filter((key) => key === 'UI'),
  ).toHaveLength(1);
});

test('locked floor selection does not start another floor', async ({ page }) => {
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.__OMF_E2E__?.scene())).toContain('Menu');
});

test('completion opens results and stores statistics', async ({ page }) => {
  await page.evaluate(() => window.__OMF_E2E__?.startFloor(0));
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Level'));
  await page.evaluate(() => window.__OMF_E2E__?.completeFloor());
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Results'));
  expect(await page.evaluate(() => window.__OMF_E2E__?.save().floors['1']?.completed)).toBe(true);
});
