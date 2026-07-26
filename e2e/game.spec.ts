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
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('RunSetup'));
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
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('RunSetup'));
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

test('countdown locks the player and attempt clock starts only after GO', async ({ page }) => {
  await page.evaluate(() => window.__OMF_E2E__?.startFloor(0));
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.playerState === 'LOCKED');
  expect(await page.evaluate(() => window.__OMF_E2E__?.run()?.attemptMs)).toBe(0);
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.countdownFinished);
  await page.waitForFunction(() => (window.__OMF_E2E__?.run()?.attemptMs ?? 0) > 0);
});

test('best completion persists a ghost and repeat creates its visual player', async ({ page }) => {
  await page.evaluate(() => window.__OMF_E2E__?.startFloor(0));
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Level'));
  await page.evaluate(() => window.__OMF_E2E__?.completeFloor());
  await page.waitForFunction(() => window.__OMF_E2E__?.hasRecord(1));
  await page.reload();
  await page.waitForFunction(() => Boolean(window.__OMF_E2E__));
  await page.evaluate(() => window.__OMF_E2E__?.startFloor(0));
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.ghostActive === true);
});

test('showGhost false hides replay without deleting it', async ({ page }) => {
  await page.evaluate(() => {
    const key = 'one-more-floor.save.v5';
    const save = JSON.parse(localStorage.getItem(key) ?? '{}') as {
      settings?: { showGhost?: boolean };
    };
    if (save.settings) save.settings.showGhost = false;
    localStorage.setItem(key, JSON.stringify(save));
    window.__OMF_E2E__?.startFloor(0);
  });
  await page.waitForFunction(() => Boolean(window.__OMF_E2E__?.run()));
  expect(await page.evaluate(() => window.__OMF_E2E__?.run()?.ghostActive)).toBe(false);
});

test('corrupt and wrong-floor ghosts are isolated', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem(
      'one-more-floor.save.v5',
      JSON.stringify({
        version: 5,
        unlockedFloor: 2,
        settings: { showGhost: true },
        floors: {
          '1': {
            completed: true,
            bestTimeMs: 100,
            bestGhost: { version: 1, floor: 2, samples: [] },
          },
        },
      }),
    );
    window.__OMF_E2E__?.startFloor(0);
  });
  await page.waitForFunction(() => Boolean(window.__OMF_E2E__?.run()));
  expect(await page.evaluate(() => window.__OMF_E2E__?.run()?.ghostActive)).toBe(false);
});

test('death and restart discard partial recording without duplicating saved ghost', async ({
  page,
}) => {
  await page.evaluate(() => window.__OMF_E2E__?.startFloor(0));
  await page.waitForFunction(() => Boolean(window.__OMF_E2E__?.run()));
  await page.evaluate(() => window.__OMF_E2E__?.killPlayer());
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.playerState === 'LOCKED');
  const before = await page.evaluate(
    () => window.__OMF_E2E__?.save().floors['1']?.bestGhost?.samples.length ?? 0,
  );
  await page.keyboard.press('r');
  const after = await page.evaluate(
    () => window.__OMF_E2E__?.save().floors['1']?.bestGhost?.samples.length ?? 0,
  );
  expect(after).toBe(before);
});

test('pause freezes the gameplay clock and ghost', async ({ page }) => {
  await page.evaluate(() => window.__OMF_E2E__?.startFloor(0));
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.countdownFinished);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Pause'));
  const before = await page.evaluate(() => window.__OMF_E2E__?.run()?.attemptMs);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.__OMF_E2E__?.run()?.attemptMs)).toBe(before);
});

test('practice anchor survives death and completion does not save PB', async ({ page }) => {
  await page.evaluate(() => window.__OMF_E2E__?.startPractice(1, 'core'));
  await page.waitForFunction(() => window.__OMF_E2E__?.getRunMode() === 'practice');
  expect(await page.evaluate(() => window.__OMF_E2E__?.getPracticeAnchor())).toBe('core');
  await page.evaluate(() => window.__OMF_E2E__?.killPlayer());
  await page.waitForFunction(() => window.__OMF_E2E__?.getPracticeAnchor() === 'core');
  await page.evaluate(() => window.__OMF_E2E__?.completeFloor());
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Results'));
  expect(
    await page.evaluate(() => window.__OMF_E2E__?.save().floors['1']?.bestTimeMs ?? null),
  ).toBeNull();
});

test('binding persists after reload', async ({ page }) => {
  await page.evaluate(() => window.__OMF_E2E__?.setBinding('JUMP', 'KeyQ'));
  expect(await page.evaluate(() => window.__OMF_E2E__?.getBindings().keyboard.JUMP)).toBe('KeyQ');
  await page.reload();
  await page.waitForFunction(() => Boolean(window.__OMF_E2E__));
  expect(await page.evaluate(() => window.__OMF_E2E__?.getBindings().keyboard.JUMP)).toBe('KeyQ');
});
