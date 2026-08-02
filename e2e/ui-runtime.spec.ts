import { expect, test } from './fixtures';

test('shared components publish valid runtime geometry and semantics', async ({ page }) => {
  await page.goto('/');
  for (const scene of ['Settings', 'Controls', 'FloorSelect'] as const) {
    await page.evaluate(value => window.__OMF_E2E__?.openScene(value), scene);
    await page.waitForFunction(value => window.__OMF_E2E__?.scene().includes(value), scene);
    const audit = await page.evaluate(value => window.__OMF_E2E__?.getUiAudit(value), scene);
    expect(audit).not.toBeNull();
    expect(audit?.titleCount).toBe(1);
    expect(audit?.focusedId).not.toBeNull();
    const enabled = audit?.interactiveItems.filter(item => item.enabled) ?? [];
    expect(enabled.length).toBeGreaterThan(0);
    for (const item of enabled) {
      expect(item.role).toBe('button');
      expect(item.fontSize).toBeGreaterThanOrEqual(16);
      expect(item.bounds.height).toBeGreaterThanOrEqual(44);
      expect(item.bounds.x).toBeGreaterThanOrEqual(24);
      expect(item.bounds.y).toBeGreaterThanOrEqual(24);
      expect(item.bounds.x + item.bounds.width).toBeLessThanOrEqual(936);
      expect(item.bounds.y + item.bounds.height).toBeLessThanOrEqual(516);
    }
    expect(enabled.some(item => item.focused)).toBe(true);
  }
});
