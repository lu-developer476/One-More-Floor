import { expect, test } from '@playwright/test';
import { installBrowserErrorCollector } from './browserErrors';

const expectedRelease = {
  name: 'One More Floor', version: '1.2.3', saveSchema: 11, towerRuleset: 2,
};

test('deployed release exposes an honest semantic gameplay smoke', async ({ page, request }) => {
  let manifest: Record<string, unknown> | undefined;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await request.get('/release.json');
    expect(response.ok()).toBe(true);
    manifest = await response.json();
    if (manifest.version === expectedRelease.version) break;
    if (attempt < 5) await new Promise((resolve) => setTimeout(resolve, 15_000));
  }
  expect(manifest).toMatchObject(expectedRelease);
  const errors = installBrowserErrorCollector(page);
  await page.addInitScript(() => localStorage.setItem('one-more-floor.onboarding', '1'));
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle('One More Floor');
  await expect(page.locator('canvas')).toBeVisible();
  const game = page.locator('#game');
  await expect(game).toHaveAttribute('aria-label', 'One More Floor v1.2.3');
  await expect(game).toHaveAttribute('data-app-version', '1.2.3');
  await expect(game).toHaveAttribute('data-save-schema', '11');
  await expect(game).toHaveAttribute('data-tower-ruleset', '2');
  const status = page.locator('#game-status');
  await expect(status).toHaveAttribute('role', 'status');
  await expect(status).toContainText('Menú principal');
  await page.keyboard.press('ArrowDown');
  await expect(status).toContainText('PISOS seleccionada');
  await page.keyboard.press('Enter');
  await expect(status).toContainText('Selección de pisos');
  await page.keyboard.press('Enter');
  await expect(status).toContainText('Piso 1');
  await page.waitForTimeout(3300);
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(200); await page.keyboard.up('ArrowRight');
  await page.keyboard.press('Space');
  await page.keyboard.press('KeyP');
  await expect(status).toContainText('Juego en pausa');
  await page.keyboard.press('KeyP');
  await page.keyboard.press('KeyP');
  await expect(status).toContainText('Juego en pausa');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(status).toContainText('Menú principal');
  expect(errors.all()).toEqual([]);
});
