import type { Page } from '@playwright/test';

export interface BrowserErrorCollector {
  all(): string[];
}

/** Warnings are not collected. Any future warning gate must use a reviewed, documented allowlist. */
export const installBrowserErrorCollector = async (page: Page): Promise<BrowserErrorCollector> => {
  const messages: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') messages.push(`console.error: ${message.text()}`);
  });
  page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
  await page.addInitScript(() => {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled rejection:', event.reason);
    });
  });
  return { all: () => [...messages] };
};
