import { expect, test as base } from '@playwright/test';
import { installBrowserErrorCollector } from './browserErrors';
export const STORAGE_KEYS = [
  'one-more-floor.save.v11',
  'one-more-floor.save.v10',
  'one-more-floor.save.v9',
  'one-more-floor.save.v8',
  'one-more-floor.save.v7',
  'one-more-floor.save.v6',
  'one-more-floor.tower.v1',
  'one-more-floor.analytics.v1',
] as const;
export const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors = await installBrowserErrorCollector(page);
      const browserErrors: string[] = [];
      await use(browserErrors);
      expect([...browserErrors, ...errors.all()]).toEqual([]);
    },
    { auto: true },
  ],
  page: async ({ page }, use) => {
    await page.addInitScript(
      (keys) => keys.forEach((key) => localStorage.removeItem(key)),
      STORAGE_KEYS,
    );
    await use(page);
  },
});
export { expect } from '@playwright/test';
