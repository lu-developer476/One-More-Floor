import { expect, type Page } from '@playwright/test';
import { STORAGE_KEYS } from './fixtures';

const install = async (page: Page, entry?: { key: string; save: unknown }) => {
  await page.addInitScript(({ keys, value }) => {
    keys.forEach(key => localStorage.removeItem(key));
    if (value) localStorage.setItem(value.key, JSON.stringify(value.save));
  }, { keys: STORAGE_KEYS, value: entry });
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.__OMF_E2E__));
};
export const bootWithLegacySave = async (page: Page, version: number, save: unknown) => {
  await install(page, { key: `one-more-floor.save.v${version}`, save });
  await expect.poll(() => page.evaluate(() => localStorage.getItem('one-more-floor.save.v11'))).not.toBeNull();
};
export const bootWithCurrentSave = (page: Page, save: unknown) => install(page, { key: 'one-more-floor.save.v11', save });
export const bootWithEmptySave = (page: Page) => install(page);
