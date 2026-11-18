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
    const toggle = page.locator('button[aria-controls="media-drawer"]');
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

  test('Escape pressed in the commit that opens the peek closes it', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
    const drawer = page.locator('#media-drawer');
    await page.locator('button[aria-controls="media-drawer"]').click();
    await expect(drawer).toHaveAttribute('data-mode', 'closed');
    // A pointer outside the pool zones ends the suppression that follows a toggle click.
    await page.mouse.move(700, 80);
    // Presses Escape in the commit that turns the drawer into a peek, before any passive effect.
    await drawer.evaluate((element) => {
      new MutationObserver((_, observer) => {
        if (element.getAttribute('data-mode') !== 'peek') return;
        observer.disconnect();
        document.body.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
        );
        element.setAttribute('data-escape-sent', 'yes');
      }).observe(element, { attributes: true, attributeFilter: ['data-mode'] });
    });
    const workspace = (await page.locator('.workspace').boundingBox())!;
    await page.mouse.move(workspace.x + 2, workspace.y + 40);
    await expect(drawer).toHaveAttribute('data-escape-sent', 'yes');
    await expect(drawer).toHaveAttribute('data-mode', 'closed');
  });

  test('holds keyboard focus, returns it on Escape and removes closed rows from Tab order', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
    const toggle = page.locator('button[aria-controls="media-drawer"]');
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
    const toggle = page.locator('button[aria-controls="media-drawer"]');
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
    const toggle = page.locator('button[aria-controls="media-drawer"]');
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
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await expect
      .poll(async () => {
        await scale.fill((await scale.getAttribute('min'))!);
        return scroll.evaluate((el) => el.scrollWidth - el.clientWidth);
      })
      .toBeLessThanOrEqual(1);
    const { min, max } = await scale.evaluate((element) => ({
      min: Number(element.getAttribute('min')),
      max: Number(element.getAttribute('max')),
    }));
    expect(max / min).toBeCloseTo(32);
    const lane = (await page.getByTestId('track-screen').boundingBox())!;
    expect(lane.width / 12).toBeCloseTo(min, 1);
    const ticks = page.locator('.ruler > span');
    // Marks sit on whole seconds: no two labels read alike, each sits at its own time, and the
    // last is the largest step at or before the 12 s end.
    const rulerBox = (await page.locator('.ruler').boundingBox())!;
    const marks = await ticks.evaluateAll((elements) =>
      elements.map((el) => {
        const box = el.getBoundingClientRect();
        const [minutes, seconds] = el.textContent!.split(':').map(Number);
        return {
          text: el.textContent!,
          at: minutes * 60 + seconds,
          left: box.left,
          right: box.right,
        };
      }),
    );
    expect(new Set(marks.map((mark) => mark.text)).size).toBe(marks.length);
    for (const mark of marks) {
      const anchor =
        mark.at === 0 ? mark.left : mark.at === 12 ? mark.right : (mark.left + mark.right) / 2;
      expect(
        Math.abs(anchor - (rulerBox.x + (mark.at / 12) * rulerBox.width)),
        mark.text,
      ).toBeLessThan(1.5);
    }
    expect(marks.at(-1)!.at).toBeGreaterThan(12 - (marks[1].at - marks[0].at));
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

test('timeline resizing remembers custom height across default, hide and viewport clamps', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const sequence = page.getByRole('region', { name: 'Main sequence' });
  const handle = page.getByRole('separator', { name: 'Resize timeline' });
  const height = async () => (await sequence.boundingBox())!.height;
  const original = await height();
  await handle.focus();
  await page.keyboard.press('ArrowDown');
  await expect.poll(height).toBeCloseTo(original - 16, 0);
  const custom = await height();
  await page.getByRole('button', { name: 'Use default timeline height' }).click();
  await expect.poll(height).toBeCloseTo(original, 0);
  await page.getByRole('button', { name: 'Restore custom timeline height' }).click();
  await expect.poll(height).toBeCloseTo(custom, 0);
  const scale = page.getByRole('slider', { name: 'Timeline scale' });
  const maxScale = (await scale.getAttribute('max'))!;
  await scale.fill(maxScale);
  const chosenScale = await scale.inputValue();
  const scroll = page.getByTestId('timeline-scroll');
  await scroll.evaluate((element) => {
    element.scrollLeft = 500;
    element.scrollTop = 80;
  });
  const offset = await scroll.evaluate((element) => ({
    x: element.scrollLeft,
    y: element.scrollTop,
  }));
  const camera = page.locator('[data-testid="camera-mask"] video:visible');
  await page.getByRole('button', { name: 'Play composition', exact: true }).click();
  await page.getByRole('button', { name: 'Hide timeline', exact: true }).click();
  await expect(sequence).toBeHidden();
  const restore = page.getByRole('button', { name: 'Show timeline', exact: true });
  await expect(restore).toBeFocused();
  await expect(
    page.locator('.app-footer').getByRole('button', { name: 'Show timeline' }),
  ).toBeVisible();
  const before = await camera.evaluate((video: HTMLVideoElement) => video.currentTime);
  await expect
    .poll(() => camera.evaluate((video: HTMLVideoElement) => video.currentTime))
    .toBeGreaterThan(before);
  await restore.press('Enter');
  await expect(page.getByRole('button', { name: 'Hide timeline', exact: true })).toBeFocused();
  await expect(page.getByTestId('transport-state')).toHaveText('Playing · 1×');
  await page.keyboard.press('Space');
  await expect(page.getByTestId('transport-state')).toHaveText('Paused');
  await expect.poll(height).toBeCloseTo(custom, 0);
  await expect(scale).toHaveValue(chosenScale);
  expect(
    await scroll.evaluate((element) => ({ x: element.scrollLeft, y: element.scrollTop })),
  ).toEqual(offset);
  await page.setViewportSize({ width: 1440, height: 720 });
  await expect.poll(height).toBeLessThan(custom);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect.poll(height).toBeCloseTo(custom, 0);
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
});

test('pane drags follow captured pointers during playback and cancel without keeping a size', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  await playhead.fill('30');
  await page.getByRole('button', { name: 'Play composition', exact: true }).click();
  for (const [name, selector, vertical, direction] of [
    ['Resize media pool', '#media-drawer', false, 1],
    ['Resize inspector', '.inspector', false, -1],
    ['Resize timeline', '.sequence-area', true, -1],
  ] as const) {
    const separator = page.getByRole('separator', { name, exact: true });
    const panel = page.locator(selector);
    const size = async () => {
      const box = (await panel.boundingBox())!;
      return vertical ? box.height : box.width;
    };
    const original = await size();
    const start = (await separator.boundingBox())!;
    const x = start.x + start.width / 2;
    const y = start.y + start.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(
      x + (vertical ? 0 : direction * 64),
      y + (vertical ? direction * 64 : 0),
      { steps: 8 },
    );
    await expect.poll(size).toBeCloseTo(original + 64, 0);
    const at = await playhead.inputValue();
    await expect.poll(() => playhead.inputValue()).not.toBe(at);
    await expect.poll(size).toBeCloseTo(original + 64, 0);
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await expect.poll(size).toBeCloseTo(original, 0);
    await expect(page.locator('html')).not.toHaveAttribute('data-panel-drag');
    await separator.focus();
    await separator.press(vertical ? 'ArrowUp' : direction > 0 ? 'ArrowRight' : 'ArrowLeft');
    await expect.poll(size).toBeCloseTo(original + 16, 0);
    const next = (await separator.boundingBox())!;
    const nx = next.x + next.width / 2;
    const ny = next.y + next.height / 2;
    await page.mouse.move(nx, ny);
    await page.mouse.down();
    await page.mouse.move(
      nx + (vertical ? 0 : direction * 32),
      ny + (vertical ? direction * 32 : 0),
      { steps: 4 },
    );
    await page.mouse.up();
    await expect.poll(size).toBeCloseTo(original + 48, 0);
  }
  await page.getByRole('button', { name: 'Pause playback', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
});

test('all pane bounds fit jointly and preserve desired widths through responsive clamping', async ({
  page,
}) => {
  const resize = async (width: number, height: number) => {
    await page.setViewportSize({ width, height });
    // Viewport emulation returns before resize/ResizeObserver updates the accessible bounds.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
  };
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [width, height] of [
    [1920, 1080],
    [1280, 720],
    [961, 800],
    [1440, 500],
    [960, 900],
    [390, 844],
  ]) {
    await resize(width, height);
    const timeline = page.getByRole('separator', { name: 'Resize timeline' });
    if (width > 960) {
      for (const label of [
        'Resize media pool',
        'Resize inspector',
        ...(height > 600 ? ['Resize timeline'] : []),
      ]) {
        const handle = page.getByRole('separator', { name: label, exact: true });
        await handle.press('End');
        await expect(handle).toHaveAttribute(
          'aria-valuenow',
          (await handle.getAttribute('aria-valuemax'))!,
        );
      }
      const preview = (await page.locator('.editing-area').boundingBox())!;
      expect(preview.width).toBeGreaterThanOrEqual(479);
      expect(preview.height).toBeGreaterThanOrEqual(239);
      const inspector = (await page.locator('.inspector').boundingBox())!;
      const sequence = (await page.locator('.sequence-area').boundingBox())!;
      expect(inspector.y + inspector.height).toBeLessThanOrEqual(sequence.y + 1);
      expect(
        (await page.getByTestId('timeline-scroll').boundingBox())!.height,
      ).toBeGreaterThanOrEqual(160);
      if (height < 600) {
        await expect(timeline).toBeHidden();
        expect((await page.locator('.app-footer').boundingBox())!.y).toBeGreaterThanOrEqual(
          sequence.y + sequence.height,
        );
      }
    } else await expect(page.getByRole('separator')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  }
  await resize(1440, 1000);
  const left = page.getByRole('separator', { name: 'Resize media pool' });
  await left.press('End');
  const desired = await left.getAttribute('aria-valuenow');
  await resize(961, 800);
  await expect
    .poll(async () => Number(await left.getAttribute('aria-valuenow')))
    .toBeLessThan(Number(desired));
  await resize(1440, 1000);
  await expect(left).toHaveAttribute('aria-valuenow', desired!);
  await left.dblclick();
  await expect(left).toHaveAttribute('aria-valuenow', '220');
  for (const [label, key] of [
    ['Resize media pool', 'ArrowRight'],
    ['Resize inspector', 'ArrowLeft'],
    ['Resize timeline', 'ArrowUp'],
  ]) {
    const handle = page.getByRole('separator', { name: label, exact: true });
    await handle.press('Home');
    await expect(handle).toHaveAttribute(
      'aria-valuenow',
      (await handle.getAttribute('aria-valuemin'))!,
    );
    await handle.press(`Shift+${key}`);
    await expect(handle).toHaveAttribute(
      'aria-valuenow',
      String(Number(await handle.getAttribute('aria-valuemin')) + 64),
    );
  }
});

test('cancel, lost capture and blur roll back a default-height drag without inventing custom height', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const handle = page.getByRole('separator', { name: 'Resize timeline' });
  const toggle = page.getByRole('button', { name: 'Restore custom timeline height' });
  const original = await handle.getAttribute('aria-valuenow');
  for (const cancel of ['pointercancel', 'lostcapture', 'blur']) {
    const box = (await handle.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y - 60, { steps: 5 });
    await expect(handle).not.toHaveAttribute('aria-valuenow', original!);
    if (cancel === 'pointercancel') await handle.dispatchEvent('pointercancel', { pointerId: 1 });
    if (cancel === 'lostcapture')
      await handle.evaluate((element) => element.releasePointerCapture(1));
    if (cancel === 'blur') await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.mouse.up();
    await expect(handle).toHaveAttribute('aria-valuenow', original!);
    await expect(toggle).toBeDisabled();
    await expect(page.locator('html')).not.toHaveAttribute('data-panel-drag');
  }
  await handle.dispatchEvent('pointerdown', { pointerId: 4, isPrimary: false, button: 0 });
  await expect(page.locator('html')).not.toHaveAttribute('data-panel-drag');
  await handle.dblclick();
  await expect(toggle).toBeDisabled();
});

test('sideways timeline drag leaves responsive default height selected', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const handle = page.getByRole('separator', { name: 'Resize timeline' });
  const toggle = page.getByRole('button', { name: 'Restore custom timeline height' });
  await expect(toggle).toBeDisabled();
  const box = (await handle.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 80, y, { steps: 8 });
  await page.mouse.up();
  await expect(toggle).toBeDisabled();
  const original = (await page.locator('#sequence-pane').boundingBox())!.height;
  await page.setViewportSize({ width: 1440, height: 1100 });
  await expect
    .poll(async () => (await page.locator('#sequence-pane').boundingBox())!.height)
    .toBeCloseTo(original + 60, 0);
  await expect(toggle).toBeDisabled();
});

test('export cancellation restores short-window timeline resizing without viewport changes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 730 });
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const workspace = page.locator('.workspace');
  const handle = page.getByRole('separator', { name: 'Resize timeline' });
  await expect(workspace).not.toHaveAttribute('data-compact');
  await expect(handle).toBeVisible();
  await page.getByRole('button', { name: 'Export video', exact: true }).click();
  await page.getByRole('button', { name: 'Render video', exact: true }).click();
  await expect(page.getByRole('progressbar', { name: 'Video export progress' })).toBeVisible();
  await expect(workspace).toHaveAttribute('data-compact', 'true');
  await page.getByRole('button', { name: 'Cancel export', exact: true }).click();
  await expect(page.locator('.app-footer [role="status"]')).toContainText('Export cancelled.');
  await expect(workspace).not.toHaveAttribute('data-compact');
  await expect(handle).toBeVisible();
});

test.describe('obsolete labels stay removed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', {
      timeout: 30000,
    });
  });

  test('removed labels, tags and the L/R meter stay gone', async ({ page }) => {
    const title = page.locator('.source-panel .monitor-title');
    await expect(title).toHaveText('Source');
    await page.getByRole('button', { name: 'Select Ambient bed' }).click();
    await expect(title).toHaveText('SourceAUDIO');
    await expect(page.locator('.audio-meter')).toHaveCount(0);
    await expect(page.locator('[aria-label^="Audio level"]')).toHaveCount(0);
    for (const text of [
      'EDIT WORKSPACE',
      'On your device',
      'LOCAL PROJECT',
      'Make something worth watching.',
      '1280 × 720',
    ])
      await expect(page.getByText(text, { exact: true })).toHaveCount(0);
    await expect(page.locator('.workspace-label, .privacy')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Shortcuts', exact: true })).toBeVisible();
    await expect(page.getByLabel('Open local project')).toHaveCount(1);
    await expect(page.getByRole('combobox', { name: 'Export resolution' })).toHaveCount(1);
  });

  test('a paused transport keeps Paused readable but not visible', async ({ page }) => {
    const state = page.getByTestId('transport-state');
    const clip = () => state.evaluate((element) => getComputedStyle(element).clipPath);
    const buttons = page.locator('.transport-buttons');
    await expect(state).toHaveText('Paused');
    expect(await clip()).toBe('inset(50%)');
    const paused = (await buttons.boundingBox())!;
    await page.getByRole('button', { name: 'Play composition', exact: true }).click();
    await expect(state).toHaveText('Playing · 1×');
    expect(await clip()).toBe('none');
    const playing = (await buttons.boundingBox())!;
    expect(playing.x).toBeCloseTo(paused.x, 0);
    expect(playing.width).toBeCloseTo(paused.width, 0);
    await page.getByRole('button', { name: 'Pause playback', exact: true }).click();
    await expect(state).toHaveText('Paused');
    expect(await clip()).toBe('inset(50%)');
  });

  test('wide transport controls stay centered without the meter', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const center = async (selector: string) => {
      const box = (await page.locator(selector).boundingBox())!;
      return box.x + box.width / 2;
    };
    expect(
      Math.abs((await center('.transport-buttons')) - (await center('.transport'))),
    ).toBeLessThan(1);
  });

  test('cursor data lives only in the inspector, not above the timeline', async ({ page }) => {
    const cursor = page.getByRole('region', { name: 'Source cursor data' });
    await expect(cursor).toHaveCount(1);
    await expect(
      page.locator('.inspector').getByRole('region', { name: 'Source cursor data' }),
    ).toBeVisible();
    await expect(page.locator('.sequence-area [aria-label="Attach cursor sidecar"]')).toHaveCount(
      0,
    );
    await expect(page.locator('.inspector').getByLabel('Attach cursor sidecar')).toHaveCount(1);
  });
});

test.describe('default layout shows the whole timeline', () => {
  // Base (2cc11bd) top-row numbers: the timeline rows must fit without taking this space back.
  const sizes = [
    { width: 1440, height: 1000, stage: 244, pool: [1, 0.57] },
    { width: 1440, height: 900, stage: 209, pool: [1, 0.24] },
    { width: 1920, height: 1080, stage: 319, pool: [1, 0.61] },
    // A 1080p screen leaves a browser window about 950 to 990px tall, and 980 is a 1440-wide laptop.
    { width: 1920, height: 960, stage: 203, pool: [1, 0.26] },
    { width: 1440, height: 980, stage: 223, pool: [1, 0.5] },
  ];
  const lanes = ['screen', 'camera', 'voice', 'music'].map((id) => `track-${id}`);
  const creates = ['screen', 'background', 'audio'].map((kind) => `create-${kind}`);

  for (const { width, height, stage, pool } of sizes) {
    test(`${width}x${height} fits every lane and creation row, and keeps the top row`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', {
        timeout: 30000,
      });
      const scroll = (await page.getByTestId('timeline-scroll').boundingBox())!;
      for (const id of [...lanes, ...creates]) {
        const box = (await page.getByTestId(id).boundingBox())!;
        expect(box.y, `${id} top`).toBeGreaterThanOrEqual(scroll.y - 0.5);
        expect(box.y + box.height, `${id} bottom`).toBeLessThanOrEqual(
          scroll.y + scroll.height + 0.5,
        );
      }
      // Fitting the rows must not shrink clips to unreadable sizes or run the waveform through titles.
      for (const id of ['track-camera', 'track-voice']) {
        const clip = (await page.getByTestId(id).locator('.timeline-clip').first().boundingBox())!;
        expect(clip.height, `${id} clip height`).toBeGreaterThanOrEqual(38);
      }
      // The title is drawn over the waveform by design; the bars must not start above its text.
      const { waveTop, textTop } = await page
        .getByTestId('track-voice')
        .locator('.timeline-clip')
        .first()
        .evaluate((clip) => {
          const text = Array.from(clip.querySelector('.clip-title')!.childNodes).find(
            (node) => node.nodeType === Node.TEXT_NODE,
          )!;
          const range = document.createRange();
          range.selectNodeContents(text);
          return {
            waveTop: clip.querySelector('svg[data-waveform]')!.getBoundingClientRect().top,
            textTop: range.getBoundingClientRect().top,
          };
        });
      expect(waveTop).toBeGreaterThanOrEqual(textTop);
      // Reclaiming timeline height must not come out of the stage, source controls or pool.
      const editing = (await page.locator('.editing-area').boundingBox())!;
      const visible = (box: { y: number; height: number }, within: typeof editing) =>
        Math.max(0, Math.min(box.y + box.height, within.y + within.height) - box.y);
      const stageBox = (await page.getByTestId('compose-monitor').boundingBox())!;
      expect(visible(stageBox, editing)).toBeGreaterThanOrEqual(stage);
      const insert = (await page.getByLabel('Insert source at playhead').boundingBox())!;
      expect(visible(insert, editing)).toBeCloseTo(insert.height, 0);
      const drawer = (await page.locator('.media-drawer').boundingBox())!;
      const cards = page.locator('#media-drawer .asset');
      for (const [index, least] of pool.entries()) {
        const card = (await cards.nth(index).boundingBox())!;
        expect(visible(card, drawer) / card.height).toBeGreaterThanOrEqual(least - 0.02);
      }
    });
  }
});
