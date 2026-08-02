import { expect, type Page } from '@playwright/test';

export const openMainMenu = async (page: Page) => {
  await page.goto('/');
  await expect(page.locator('#game-status')).toContainText('Menú principal');
};
export const selectMenuAction = async (page: Page, action: string) => {
  const actions = await page.evaluate(() => window.__OMF_E2E__?.getMenuActions() ?? []);
  const target = actions.indexOf(action);
  expect(target, `acción ${action}`).toBeGreaterThanOrEqual(0);
  while ((await page.evaluate(() => window.__OMF_E2E__?.menuSelection())) !== target)
    await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
};
export const openFloorSelect = async (page: Page) => selectMenuAction(page, 'PISOS');
export const startFloor = async (page: Page, floor = 1) => {
  await expect(page.locator('#game-status')).toContainText('Selección de pisos');
  for (let current = 1; current < floor; current += 1) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
};
export const openSettingsCategory = async (page: Page, category: string) => {
  await selectMenuAction(page, 'AJUSTES');
  await expect(page.locator('#game-status')).toContainText(category);
};
export const pauseGame = async (page: Page) => {
  await page.keyboard.press('KeyP');
  await expect(page.locator('#game-status')).toContainText('Juego en pausa');
};
export const resumeGame = async (page: Page) => {
  await page.keyboard.press('KeyP');
  await expect(page.locator('#game-status')).not.toContainText('Juego en pausa');
};
