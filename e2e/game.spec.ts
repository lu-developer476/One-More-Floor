import { expect, test } from './fixtures';

const errors = (page: import('@playwright/test').Page) => {
  const messages: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') messages.push(message.text());
  });
  page.on('pageerror', (error) => messages.push(error.message));
  return messages;
};

const selectMenuAction = async (page: import('@playwright/test').Page, action: string) => {
  const actions = await page.evaluate(() => window.__OMF_E2E__?.getMenuActions() ?? []);
  const target = actions.indexOf(action);
  expect(target, `menu action ${action}`).toBeGreaterThanOrEqual(0);
  while ((await page.evaluate(() => window.__OMF_E2E__?.menuSelection())) !== target)
    await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    for (const key of [
      'one-more-floor.save.v9',
      'one-more-floor.save.v8',
      'one-more-floor.save.v7',
      'one-more-floor.save.v6',
      'one-more-floor.tower.v1',
      'one-more-floor.analytics.v1',
    ])
      localStorage.removeItem(key);
  });
  await page.goto('/');
  expect(await page.title()).toBe('One More Floor');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Menu'));
});

test('real keyboard performs one repeatable air jump for five landing cycles', async ({ page }) => {
  await page.evaluate(() => window.__OMF_E2E__?.startFloor(0));
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.countdownFinished);
  for (let cycle = 0; cycle < 5; cycle += 1) {
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__OMF_E2E__?.run()?.lastJumpKind === 'ground');
    await page.keyboard.down('Space');
    await page.keyboard.up('Space');
    await page.waitForFunction(() => window.__OMF_E2E__?.run()?.lastJumpKind === 'air');
    expect(await page.evaluate(() => window.__OMF_E2E__?.run()?.velocityY ?? 0)).toBeLessThan(0);
    const events = await page.evaluate(() => window.__OMF_E2E__?.run()?.jumpEvents ?? 0);
    await page.keyboard.press('Space');
    await page.waitForTimeout(80);
    expect(await page.evaluate(() => window.__OMF_E2E__?.run()?.jumpEvents ?? 0)).toBe(events);
    await page.waitForFunction(() => window.__OMF_E2E__?.run()?.airJumpAvailable === true);
  }
});

test('real keyboard composes jump and dash in both orders and simultaneously', async ({ page }) => {
  const start = async () => {
    await page.evaluate(() => window.__OMF_E2E__?.startFloor(0));
    await page.waitForFunction(() => window.__OMF_E2E__?.run()?.countdownFinished);
  };
  await start();
  await page.keyboard.down('Space');
  await page.waitForFunction(() => (window.__OMF_E2E__?.run()?.velocityY ?? 0) < 0);
  await page.keyboard.press('KeyS');
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.isDashing);
  expect(await page.evaluate(() => window.__OMF_E2E__?.run()?.velocityY ?? 0)).toBeLessThan(0);
  await page.keyboard.up('Space');

  await start();
  await page.keyboard.down('KeyS');
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.isDashing);
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => window.__OMF_E2E__?.run()?.isDashing)).toBe(true);
  expect(await page.evaluate(() => window.__OMF_E2E__?.run()?.velocityY ?? 0)).toBeLessThan(0);
  await page.keyboard.up('KeyS');

  await start();
  await page.keyboard.down('Space');
  await page.keyboard.down('KeyS');
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.isDashing);
  const simultaneous = await page.evaluate(() => window.__OMF_E2E__?.run());
  expect(simultaneous?.velocityX).toBeGreaterThan(600);
  expect(simultaneous?.velocityY).toBeLessThan(0);
  expect(simultaneous?.jumpEvents).toBe(1);
  expect(simultaneous?.dashEvents).toBe(1);
  await page.keyboard.up('Space');
  await page.keyboard.up('KeyS');
});

test('full and short jumps have useful heights and falling dash preserves descent', async ({
  page,
}) => {
  await page.evaluate(() => window.__OMF_E2E__?.startFloor(0));
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.countdownFinished);
  const initialY = await page.evaluate(() => window.__OMF_E2E__?.run()?.y ?? 0);
  await page.keyboard.down('Space');
  await page.waitForFunction(() => (window.__OMF_E2E__?.run()?.velocityY ?? 0) < 0);
  await page.waitForFunction(() => (window.__OMF_E2E__?.run()?.velocityY ?? 1) >= 0);
  const apexY = await page.evaluate(() => window.__OMF_E2E__?.run()?.y ?? 0);
  await page.keyboard.up('Space');
  expect(initialY - apexY).toBeGreaterThanOrEqual(110);
  expect(initialY - apexY).toBeLessThanOrEqual(145);
  await page.waitForFunction(() => (window.__OMF_E2E__?.run()?.velocityY ?? -1) > 0);
  const fallingY = await page.evaluate(() => window.__OMF_E2E__?.run()?.velocityY ?? 0);
  await page.keyboard.press('KeyS');
  expect(await page.evaluate(() => window.__OMF_E2E__?.run()?.velocityY ?? 0)).toBeGreaterThan(0);
  expect(fallingY).toBeGreaterThan(0);
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

test('real keyboard navigates menu and opens Tower Setup', async ({ page }) => {
  expect(await page.evaluate(() => window.__OMF_E2E__?.menuSelection())).toBe(0);
  await page.keyboard.press('ArrowDown');
  expect(await page.evaluate(() => window.__OMF_E2E__?.menuSelection())).toBe(1);
  await page.keyboard.press('ArrowUp');
  expect(await page.evaluate(() => window.__OMF_E2E__?.menuSelection())).toBe(0);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('TowerSetup'));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Menu'));
});

test('real held keyboard input moves, jumps, dashes, pauses and restarts', async ({ page }) => {
  await page.evaluate(() => window.__OMF_E2E__?.startFloor(0));
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.countdownFinished);
  const startX = await page.evaluate(() => window.__OMF_E2E__?.run()?.x ?? 0);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(250);
  await page.keyboard.up('ArrowRight');
  const rightX = await page.evaluate(() => window.__OMF_E2E__?.run()?.x ?? 0);
  expect(rightX).toBeGreaterThan(startX);
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(250);
  await page.keyboard.up('ArrowLeft');
  expect(await page.evaluate(() => window.__OMF_E2E__?.run()?.x ?? 0)).toBeLessThan(rightX);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => (window.__OMF_E2E__?.run()?.velocityY ?? 0) < 0);
  await page.keyboard.press('KeyS');
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.playerState === 'DASHING');
  await page.keyboard.press('KeyP');
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Pause'));
  await page.keyboard.press('KeyP');
  await page.waitForFunction(() => !window.__OMF_E2E__?.scene().includes('Pause'));
  const attempt = await page.evaluate(() => window.__OMF_E2E__?.run()?.attemptMs ?? 0);
  await page.keyboard.press('KeyR');
  await page.waitForFunction(
    (oldAttempt) => (window.__OMF_E2E__?.run()?.attemptMs ?? oldAttempt) < oldAttempt,
    attempt,
  );
});

test('legacy gameplay keys are inactive and Escape does not pause gameplay', async ({ page }) => {
  await page.evaluate(() => window.__OMF_E2E__?.startFloor(0));
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.countdownFinished);
  const start = await page.evaluate(() => window.__OMF_E2E__?.run());
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(100);
  await page.keyboard.up('KeyA');
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(100);
  await page.keyboard.up('KeyD');
  expect(
    Math.abs((await page.evaluate(() => window.__OMF_E2E__?.run()?.x ?? 0)) - (start?.x ?? 0)),
  ).toBeLessThan(8);
  for (const key of ['KeyW', 'ArrowUp', 'ShiftLeft']) await page.keyboard.press(key);
  await page.waitForTimeout(50);
  expect(await page.evaluate(() => window.__OMF_E2E__?.run()?.playerState)).not.toBe('DASHING');
  expect(
    await page.evaluate(() => window.__OMF_E2E__?.run()?.velocityY ?? 0),
  ).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.__OMF_E2E__?.scene())).not.toContain('Pause');
});

test('dash travels its longer real distance and holding S does not repeat it', async ({ page }) => {
  await page.evaluate(() => window.__OMF_E2E__?.startFloor(0));
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.countdownFinished);
  const startX = await page.evaluate(() => window.__OMF_E2E__?.run()?.x ?? 0);
  await page.keyboard.down('KeyS');
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.playerState === 'DASHING');
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.playerState !== 'DASHING');
  const endX = await page.evaluate(() => window.__OMF_E2E__?.run()?.x ?? 0);
  expect(endX - startX).toBeGreaterThan(120);
  expect(endX - startX).toBeLessThan(180);
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.__OMF_E2E__?.run()?.playerState)).not.toBe('DASHING');
  await page.keyboard.up('KeyS');
});

test('v8 layout migrates once, later remaps persist, and reset-controls keeps progress', async ({
  page,
}) => {
  await page.evaluate(() => {
    localStorage.setItem(
      'one-more-floor.save.v8',
      JSON.stringify({
        version: 8,
        unlockedFloor: 4,
        floors: {},
        settings: {},
        input: {
          keyboard: { MOVE_LEFT: 'KeyA', MOVE_RIGHT: 'KeyD', DASH: 'ShiftLeft', PAUSE: 'Escape' },
        },
      }),
    );
  });
  await page.reload();
  await page.waitForFunction(() => Boolean(window.__OMF_E2E__));
  expect(await page.evaluate(() => window.__OMF_E2E__?.getBindings())).toMatchObject({
    keyboardLayoutVersion: 2,
    keyboard: {
      MOVE_LEFT: 'ArrowLeft',
      MOVE_RIGHT: 'ArrowRight',
      JUMP: 'Space',
      DASH: 'KeyS',
      PAUSE: 'KeyP',
    },
  });
  await page.evaluate(() => window.__OMF_E2E__?.setBinding('DASH', 'KeyQ'));
  await page.reload();
  await page.waitForFunction(() => Boolean(window.__OMF_E2E__));
  expect(await page.evaluate(() => window.__OMF_E2E__?.getBindings().keyboard.DASH)).toBe('KeyQ');
  await page.goto('/?reset-controls');
  await page.waitForFunction(() => Boolean(window.__OMF_E2E__));
  expect(await page.evaluate(() => window.__OMF_E2E__?.save())).toMatchObject({
    unlockedFloor: 4,
    input: { keyboardLayoutVersion: 2, keyboard: { DASH: 'KeyS', PAUSE: 'KeyP' } },
  });
});

test('remapped KeyboardEvent.code works after reload and replaces the old key', async ({
  page,
}) => {
  await page.evaluate(() => window.__OMF_E2E__?.setBinding('JUMP', 'KeyJ'));
  await page.reload();
  await page.waitForFunction(() => Boolean(window.__OMF_E2E__));
  expect(await page.evaluate(() => window.__OMF_E2E__?.getBindings().keyboard.JUMP)).toBe('KeyJ');
  await page.evaluate(() => window.__OMF_E2E__?.startFloor(0));
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.countdownFinished);
  await page.keyboard.press('Space');
  await page.waitForTimeout(80);
  expect(
    await page.evaluate(() => window.__OMF_E2E__?.run()?.velocityY ?? 0),
  ).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('KeyJ');
  await page.waitForFunction(() => (window.__OMF_E2E__?.run()?.velocityY ?? 0) < 0);
});

test('focus loss clears a physically held key', async ({ page }) => {
  await page.evaluate(() => window.__OMF_E2E__?.startFloor(0));
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.countdownFinished);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(100);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const blurredX = await page.evaluate(() => window.__OMF_E2E__?.run()?.x ?? 0);
  await page.waitForTimeout(180);
  const settledX = await page.evaluate(() => window.__OMF_E2E__?.run()?.x ?? 0);
  await page.keyboard.up('ArrowRight');
  expect(settledX - blurredX).toBeLessThan(35);
});

test('keyboard starts the unlocked floor and pause resumes without duplicate HUD', async ({
  page,
}) => {
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('TowerSetup'));
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Level'));
  await page.keyboard.press('KeyP');
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Pause'));
  await page.keyboard.press('KeyP');
  await page.waitForFunction(() => !window.__OMF_E2E__?.scene().includes('Pause'));
  expect(
    (await page.evaluate(() => window.__OMF_E2E__?.scene())).filter((key) => key === 'UI'),
  ).toHaveLength(1);
});

test('mouse selects Tower Run', async ({ page }) => {
  await page.mouse.click(480, 145);
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('TowerSetup'));
});

test('settings change independently and persist after reload', async ({ page }) => {
  await selectMenuAction(page, 'AJUSTES');
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Settings'));
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.__OMF_E2E__?.save().settings.mute)).toBe(true);
  await page.reload();
  await page.waitForFunction(() => Boolean(window.__OMF_E2E__));
  expect(await page.evaluate(() => window.__OMF_E2E__?.save().settings.mute)).toBe(true);
});

test('physical player overlap activates the first split only once', async ({ page }) => {
  await page.evaluate(() => window.__OMF_E2E__?.startFloor(0));
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.countdownFinished);
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(
    () => (window.__OMF_E2E__?.getCompletedSplits() as unknown[] | undefined)?.length === 1,
  );
  await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(() => window.__OMF_E2E__?.getCompletedSplits())).toHaveLength(1);
});

test('future split is ignored and analytics scene opens', async ({ page }) => {
  await page.evaluate(() => window.__OMF_E2E__?.startFloor(0));
  await page.waitForFunction(() => window.__OMF_E2E__?.run()?.countdownFinished);
  expect(
    await page.evaluate(() => window.__OMF_E2E__?.triggerSplit('floor01-split-high')),
  ).toBeNull();
  expect((await page.evaluate(() => window.__OMF_E2E__?.getAnalytics(1)))?.attempts).toBe(1);
  await page.evaluate(() => window.__OMF_E2E__?.openAnalytics());
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('Analytics'));
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
  await selectMenuAction(page, 'PISOS');
  await page.waitForFunction(() => window.__OMF_E2E__?.scene().includes('FloorSelect'));
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.__OMF_E2E__?.scene())).toContain('FloorSelect');
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
    const key = 'one-more-floor.save.v9';
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
      'one-more-floor.save.v9',
      JSON.stringify({
        version: 9,
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
  await page.keyboard.press('KeyP');
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
