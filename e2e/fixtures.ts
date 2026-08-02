import { expect, test as base } from '@playwright/test';
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
      const browserErrors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') browserErrors.push(message.text());
      });
      page.on('pageerror', (error) => browserErrors.push(error.message));
      await use(browserErrors);
      expect(browserErrors).toEqual([]);
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
