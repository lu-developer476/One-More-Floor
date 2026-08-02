import { expect, test } from '@playwright/test';

test('deployment accepts real browser navigation and gameplay keys', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);
  expect(await page.title()).toBe('One More Floor');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#game')).toHaveAttribute('aria-label', /v1\.1\.2/);
  await page.keyboard.press('Escape');
  for (const key of [
    'ArrowDown',
    'ArrowUp',
    'Enter',
    'Escape',
    'ArrowDown',
    'Enter',
    'Enter',
    'ArrowRight',
    'Space',
    'KeyP',
    'KeyP',
  ])
    await page.keyboard.press(key);
  await expect(page.locator('canvas')).toBeVisible();
  expect(errors).toEqual([]);
});
