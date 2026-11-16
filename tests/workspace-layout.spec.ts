import { expect, test } from '@playwright/test';

test.use({
  launchOptions: {
    args: [
      '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4',
    ],
  },
});

test('media pool pane toggles without resetting selection, zoom or playback', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const toggle = page.getByRole('button', { name: 'Hide media pool pane' });
  const editingArea = page.locator('.editing-area');
  const original = (await editingArea.boundingBox())!;
  const clip = page.getByTestId('track-camera').getByRole('button').first();
  await clip.click();
  const scale = page.getByRole('slider', { name: 'Timeline scale' });
  const chosen = (Number(await scale.getAttribute('min')) * 2).toFixed(3);
  await scale.fill(chosen);
  await page.getByRole('slider', { name: 'Timeline playhead' }).fill('60');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByTestId('transport-state')).toHaveText('Playing · 1×');
  await page.keyboard.press('Space');
  await expect(page.getByTestId('transport-state')).toHaveText('Paused');
  await page.keyboard.press('Enter');
  const show = page.getByRole('button', { name: 'Show media pool pane' });
  await expect(show).toBeFocused();
  await expect(show).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByText('Project media', { exact: true })).toBeHidden();
  expect((await editingArea.boundingBox())!.width).toBeGreaterThan(original.width);
  await expect(clip).toHaveAttribute('aria-pressed', 'true');
  await expect(scale).toHaveValue(chosen);
  await expect(page.getByTestId('transport-state')).toHaveText('Paused');
  await page.keyboard.press('Space');
  await expect(show).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('transport-state')).toHaveText('Playing · 1×');
  await show.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByTestId('transport-state')).toHaveText('Playing · 1×');
  await expect
    .poll(() => page.getByRole('slider', { name: 'Timeline playhead' }).inputValue())
    .not.toBe('60');
  await page.getByRole('button', { name: 'Pause playback', exact: true }).click();
});

test.describe('media edge preview', () => {
  test('previews over the workspace, retreats on leave and pins only on activation', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
    expect(
      await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches),
    ).toBe(true);
    const toggle = page.locator('[aria-controls="media-drawer"]');
    const drawer = page.locator('#media-drawer');
    await toggle.click();
    await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
    await page.waitForTimeout(350);
    await expect(page.getByText('Project media', { exact: true })).toBeHidden();
    const edit = (await page.locator('.editing-area').boundingBox())!;
    const timeline = (await page.getByRole('region', { name: 'Main sequence' }).boundingBox())!;
    const workspace = (await page.locator('.workspace').boundingBox())!;
    await page.mouse.move(workspace.x + 2, workspace.y + 40);
    await expect(page.getByText('Project media', { exact: true })).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect((await page.locator('.editing-area').boundingBox())!).toEqual(edit);
    expect((await page.getByRole('region', { name: 'Main sequence' }).boundingBox())!).toEqual(
      timeline,
    );
    const row = page.getByRole('button', { name: 'Select Flower study' });
    await row.click();
    await expect(row).toHaveAttribute('aria-pressed', 'true');
    await page.mouse.move(700, 80);
    await expect(page.getByText('Project media', { exact: true })).toBeHidden();
    await expect(toggle).toBeFocused();
    await toggle.hover();
    await expect(page.getByText('Project media', { exact: true })).toBeVisible();
    await row.hover();
    await page.mouse.move(700, 80);
    await page.waitForTimeout(100);
    await drawer.hover();
    await expect(page.getByText('Project media', { exact: true })).toBeVisible();
    await page.mouse.move(700, 80);
    await expect(page.getByText('Project media', { exact: true })).toBeHidden();
    await toggle.hover();
    await expect(page.getByText('Project media', { exact: true })).toBeVisible();
    await toggle.click();
    await page.mouse.move(700, 80);
    await page.waitForTimeout(600);
    await expect(page.getByText('Project media', { exact: true })).toBeVisible();
    await toggle.click();
    await page.waitForTimeout(350);
    await expect(page.getByText('Project media', { exact: true })).toBeHidden();
  });

  test('holds keyboard focus, returns it on Escape and removes closed rows from Tab order', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
    const toggle = page.locator('[aria-controls="media-drawer"]');
    await toggle.click();
    await page.mouse.move(700, 80);
    await toggle.hover();
    const row = page.getByRole('button', { name: 'Select Flower study' });
    await expect(row).toBeVisible();
    await row.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(row).toBeFocused();
    await page.mouse.move(700, 80);
    await page.waitForTimeout(600);
    await expect(row).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    await expect(row).toBeHidden();
    for (let tab = 0; tab < 20; tab++) {
      await page.keyboard.press('Tab');
      expect(
        await page.locator('#media-drawer').evaluate((el) => el.contains(document.activeElement)),
      ).toBe(false);
    }
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(row).toBeVisible();
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(row).toBeVisible();
  });

  test('keeps narrow previews within the viewport and reduced motion still', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
    const toggle = page.locator('[aria-controls="media-drawer"]');
    await toggle.click();
    for (const width of [960, 617, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.mouse.move(width - 10, 80);
      await toggle.hover();
      await expect(page.getByText('Project media', { exact: true })).toBeVisible();
      const drawer = (await page.locator('#media-drawer').boundingBox())!;
      expect(drawer.x).toBeGreaterThanOrEqual(0);
      expect(drawer.x + drawer.width).toBeLessThanOrEqual(width);
      if (width <= 620) {
        const title = (await page.locator('#media-drawer .section-title').boundingBox())!;
        const list = (await page.locator('#media-drawer .asset-list').boundingBox())!;
        expect(list.y - (title.y + title.height)).toBeLessThan(16);
        await page.getByRole('button', { name: 'Select Ambient bed' }).scrollIntoViewIfNeeded();
        await expect(page.getByRole('button', { name: 'Select Ambient bed' })).toBeInViewport();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      expect(
        await page
          .locator('#media-drawer')
          .evaluate((el) => el.getAnimations({ subtree: true }).length),
      ).toBe(0);
      await page.keyboard.press('Escape');
      await expect(page.getByText('Project media', { exact: true })).toBeHidden();
    }
  });
});

test('touch uses the persistent Media toggle without a hover preview', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    const toggle = page.locator('[aria-controls="media-drawer"]');
    await toggle.tap();
    await page.mouse.move(380, 80);
    await toggle.hover();
    await page.waitForTimeout(350);
    await expect(page.getByText('Project media', { exact: true })).toBeHidden();
    await toggle.tap();
    await expect(page.getByText('Project media', { exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('long sequences scroll in both axes with every video and audio lane reachable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const inspector = (await page.locator('.inspector').boundingBox())!;
  const sequence = (await page.getByRole('region', { name: 'Main sequence' }).boundingBox())!;
  expect(inspector.y + inspector.height).toBeLessThanOrEqual(sequence.y + 1);
  expect((await page.locator('.import-button').boundingBox())!.height).toBeGreaterThanOrEqual(32);
  const scale = page.getByRole('slider', { name: 'Timeline scale' });
  const initialMin = Number(await scale.getAttribute('min'));
  const initialMax = Number(await scale.getAttribute('max'));
  for (let insertion = 0; insertion < 10; insertion++) {
    await page.getByRole('button', { name: 'Insert source at playhead' }).click();
  }
  expect(Number(await scale.getAttribute('min')) / initialMin).toBeCloseTo(12 / 152);
  expect(Number(await scale.getAttribute('max')) / initialMax).toBeCloseTo(12 / 152);
  await scale.fill((await scale.getAttribute('max'))!);
  const scroll = page.getByTestId('timeline-scroll');
  await expect
    .poll(() => scroll.evaluate((el) => el.scrollHeight - el.clientHeight))
    .toBeGreaterThan(20);
  await expect
    .poll(() => scroll.evaluate((el) => el.scrollWidth - el.clientWidth))
    .toBeGreaterThan(1000);
  const bounds = (await scroll.boundingBox())!;
  expect(bounds.width).toBeGreaterThan(1200);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(720);
  await scroll.hover();
  await page.mouse.wheel(1500, 400);
  await expect.poll(() => scroll.evaluate((el) => el.scrollLeft)).toBeGreaterThan(500);
  await expect.poll(() => scroll.evaluate((el) => el.scrollTop)).toBeGreaterThan(20);
  expect(
    await page.locator('.track-music .track-label').evaluate((label) => {
      const rect = label.getBoundingClientRect();
      return (
        document
          .elementFromPoint(rect.left - 5, rect.y + rect.height / 2)
          ?.closest('.timeline-clip') === null
      );
    }),
  ).toBe(true);
  await expect(page.getByRole('button', { name: 'Mute Music', exact: true })).toBeInViewport();
  await page.getByRole('button', { name: 'Mute Music', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unmute Music', exact: true })).toBeVisible();
  await scroll.focus();
  const frame = await page.getByRole('slider', { name: 'Timeline playhead' }).inputValue();
  const left = await scroll.evaluate((el) => el.scrollLeft);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => scroll.evaluate((el) => el.scrollLeft)).toBeGreaterThan(left);
  await expect(page.getByRole('slider', { name: 'Timeline playhead' })).toHaveValue(frame);
  for (const width of [960, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await scroll.scrollIntoViewIfNeeded();
    await scroll.hover();
    await page.mouse.wheel(-10000, -10000);
    await expect.poll(() => scroll.evaluate((el) => el.scrollLeft)).toBe(0);
    await expect(page.getByTestId('track-screen')).toBeInViewport();
    await scroll.hover();
    await page.mouse.wheel(0, 10000);
    await expect(page.getByRole('button', { name: 'Unmute Music', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  }
});

test('scale bounds follow duration, retaining valid scale and clamping only outside the range', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const scale = page.getByRole('slider', { name: 'Timeline scale' });
  const bounds = () =>
    scale.evaluate((el: HTMLInputElement) => ({ min: Number(el.min), max: Number(el.max) }));
  const initial = await bounds();
  expect(initial.max / initial.min).toBeCloseTo(32);
  const chosen = (initial.min * 2).toFixed(3);
  await scale.fill(chosen);
  await page.getByRole('button', { name: 'Insert source at playhead' }).click();
  await expect(page.getByRole('slider', { name: 'Timeline playhead' })).toHaveAttribute(
    'max',
    '779',
  );
  await expect.poll(async () => (await bounds()).min / initial.min).toBeCloseTo(12 / 26);
  expect((await bounds()).max / initial.max).toBeCloseTo(12 / 26);
  await expect(scale).toHaveValue(chosen);
  await scale.fill(String((await bounds()).min));
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect.poll(async () => Number(await scale.inputValue())).toBeCloseTo(initial.min);
  await scale.fill(String(initial.max));
  await page.getByRole('button', { name: 'Insert source at playhead' }).click();
  await expect
    .poll(async () => Number(await scale.inputValue()))
    .toBeCloseTo((initial.max * 12) / 26);
  const clamped = await scale.inputValue();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(scale).toHaveValue(clamped);
});

test('fit scale follows the viewport and stays finite for empty and one-frame sequences', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const scale = page.getByRole('slider', { name: 'Timeline scale' });
  const scroll = page.getByTestId('timeline-scroll');
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  for (const width of [1440, 960, 390, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await expect
      .poll(async () => {
        await scale.fill((await scale.getAttribute('min'))!);
        return scroll.evaluate((el) => el.scrollWidth - el.clientWidth);
      })
      .toBeLessThanOrEqual(1);
    const min = Number(await scale.getAttribute('min'));
    const max = Number(await scale.getAttribute('max'));
    expect(max / min).toBeCloseTo(32);
    const lane = (await page.getByTestId('track-screen').boundingBox())!;
    expect(lane.width / 12).toBeCloseTo(min, 1);
    const ticks = page.locator('.ruler > span');
    await expect(ticks.last()).toHaveText('00:12');
    const labels = await ticks.evaluateAll((elements) =>
      elements.map((el) => ({
        left: el.getBoundingClientRect().left,
        right: el.getBoundingClientRect().right,
      })),
    );
    expect(labels.length).toBeGreaterThanOrEqual(2);
    expect(labels.length).toBeLessThanOrEqual(9);
    expect(labels.every((label, index) => !index || label.left >= labels[index - 1].right)).toBe(
      true,
    );
    expect(labels.at(-1)!.right).toBeLessThanOrEqual(lane.x + lane.width + 1);
    await page.getByRole('button', { name: 'Hide media pool pane' }).click();
    await expect.poll(async () => Number(await scale.inputValue())).toBeCloseTo(min);
    await page.getByRole('button', { name: 'Show media pool pane' }).click();
    await playhead.fill('60');
    const target = page.getByTestId('track-screen');
    await target.dblclick({ position: { x: lane.width * 0.37, y: 10 } });
    await expect(playhead).toHaveValue(String(Math.round(360 * 0.37)));
  }
  const chosen = (Number(await scale.getAttribute('min')) * 4).toFixed(3);
  await scale.fill(chosen);
  await page.setViewportSize({ width: 960, height: 800 });
  await expect
    .poll(async () => Number(await scale.getAttribute('min')))
    .toBeLessThan(Number(chosen) / 4);
  await expect(scale).toHaveValue(chosen);
  await scale.fill((await scale.getAttribute('max'))!);
  await page.setViewportSize({ width: 390, height: 800 });
  const narrowMaximum = await scroll.evaluate((el) => {
    const style = getComputedStyle(el);
    const label = el.querySelector('.ruler-label')!.getBoundingClientRect().width;
    return (
      ((el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - label) /
        12) *
      32
    );
  });
  await expect.poll(async () => Number(await scale.getAttribute('max'))).toBeCloseTo(narrowMaximum);
  await expect
    .poll(async () => Number(await scale.inputValue()) / Number(await scale.getAttribute('max')))
    .toBeCloseTo(1);
  const clamped = await scale.inputValue();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect
    .poll(async () => Number(await scale.getAttribute('max')))
    .toBeGreaterThan(Number(clamped));
  await expect(scale).toHaveValue(clamped);
  for (let clip = 0; clip < 5; clip++) {
    await page.locator('.timeline-clip').first().click();
    await page.getByRole('button', { name: 'Delete selected clip or zoom' }).click();
  }
  await expect(scale).toBeDisabled();
  const emptyMin = Number(await scale.getAttribute('min'));
  const emptyMax = Number(await scale.getAttribute('max'));
  expect(Number.isFinite(emptyMin) && emptyMin > 0).toBe(true);
  expect(emptyMax / emptyMin).toBeCloseTo(32);
  await page.getByRole('spinbutton', { name: 'Source out seconds' }).fill(String(1 / 30));
  await page.getByRole('button', { name: 'Insert source at playhead' }).click();
  await expect(scale).toBeEnabled();
  expect(Number(await scale.getAttribute('min'))).toBeCloseTo(emptyMin);
  await scale.fill(String(emptyMax));
  await expect
    .poll(() => scroll.evaluate((el) => el.scrollWidth / el.clientWidth))
    .toBeGreaterThan(20);
});
