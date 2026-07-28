import { expect, test } from '@playwright/test';
test('production keyboard opens Tower Setup without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect
    .poll(() => page.evaluate(() => window.__OMF_E2E__?.scene() ?? []))
    .toContain('TowerSetup');
  expect(errors).toEqual([]);
});
