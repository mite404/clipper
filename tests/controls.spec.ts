import { test, expect, type Page } from '@playwright/test';
import { rangeIn, rangeOut, seekSource } from './source-range';

async function openEditor(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

test('visible native playhead aligns with ruler and tracks through seeking, scale and scroll', async ({
  page,
}) => {
  await openEditor(page);
  const input = page.getByRole('slider', { name: 'Timeline playhead' });
  await expect(input).toHaveCSS('opacity', '1');
  const ruler = page.locator('.ruler');
  const marker = page.locator('.ruler-playhead');
  const body = page.locator('.playhead');
  const scale = page.getByRole('slider', { name: 'Timeline scale' });
  for (const factor of [1, 3]) {
    await scale.fill(String(Number(await scale.getAttribute('min')) * factor));
    for (const frame of [0, 83, 359]) {
      await input.fill(String(frame));
      const r = (await ruler.boundingBox())!;
      const m = (await marker.boundingBox())!;
      const b = (await body.boundingBox())!;
      expect(m.x).toBeCloseTo(r.x + (r.width * frame) / 360, 0);
      expect(m.y).toBeCloseTo(r.y, 0);
      expect(m.height).toBeCloseTo(r.height, 0);
      expect(b.x).toBeCloseTo(m.x, 0);
    }
    await input.focus();
    await input.press('Home');
    await input.press('ArrowRight');
    await expect(input).toHaveValue('1');
    await input.press('End');
    await expect(input).toHaveValue('359');
    await page.getByTestId('timeline-scroll').evaluate((element) => {
      element.scrollLeft = 140;
      element.scrollTop = 60;
    });
    expect((await marker.boundingBox())!.x).toBeCloseTo((await body.boundingBox())!.x, 0);
    expect((await marker.boundingBox())!.y).toBeCloseTo((await ruler.boundingBox())!.y, 0);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await scale.fill((await scale.getAttribute('min')) ?? '40');
  await expect
    .poll(() =>
      page
        .getByTestId('timeline-scroll')
        .evaluate((element) => element.scrollWidth - element.clientWidth),
    )
    .toBeLessThanOrEqual(1);
  await input.fill('0');
  const r = (await ruler.boundingBox())!;
  await page.mouse.move(r.x, r.y + 7);
  await page.mouse.down();
  await page.mouse.move(r.x + r.width * 0.6, r.y + 7, { steps: 12 });
  await page.mouse.up();
  expect(Number(await input.inputValue())).toBeCloseTo(216, 0);
  await page.mouse.move(r.x + (r.width * 359) / 360, r.y + 7);
  await page.mouse.down();
  await page.mouse.up();
  await expect(input).toHaveValue('359');
  expect((await marker.boundingBox())!.x).toBeCloseTo((await body.boundingBox())!.x, 0);
  await expect(page.getByTestId('track-screen').getByRole('button').first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByTestId('track-camera').getByRole('button').first().click();
  await expect(page.getByTestId('track-camera').getByRole('button').first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('the frame buttons step exactly one frame, across a second and at both ends', async ({
  page,
}) => {
  await openEditor(page);
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  const timecode = page.getByTestId('timecode');
  const camera = page.locator('[data-testid="camera-mask"] video:visible');
  const next = page.getByRole('button', { name: 'Next frame', exact: true });
  const previous = page.getByRole('button', { name: 'Previous frame', exact: true });
  // The camera clip starts at frame 0 with no source offset, so the frame the player holds
  // is its decoded position in seconds.
  const heldAt = (seconds: number) =>
    expect
      .poll(() => camera.evaluate((video: HTMLVideoElement) => video.currentTime))
      .toBeCloseTo(seconds, 2);

  await playhead.fill('29');
  await expect(timecode).toHaveText('00:00:29');
  await next.click();
  await expect(timecode).toHaveText('00:01:00');
  await expect(playhead).toHaveValue('30');
  await heldAt(1);
  await previous.click();
  await expect(timecode).toHaveText('00:00:29');
  await expect(playhead).toHaveValue('29');
  await heldAt(29 / 30);
  for (let click = 0; click < 3; click++) await next.click();
  await expect(timecode).toHaveText('00:01:02');
  await expect(playhead).toHaveValue('32');
  await heldAt(32 / 30);

  await playhead.fill('0');
  await previous.click();
  await expect(timecode).toHaveText('00:00:00');
  await expect(playhead).toHaveValue('0');
  // The demo is 360 frames long, so its last frame is 359.
  await playhead.fill('359');
  await next.click();
  await expect(timecode).toHaveText('00:11:29');
  await expect(playhead).toHaveValue('359');
});

test('zoom start, length and focus fields place the zoom in time and pan the screen', async ({
  page,
}) => {
  await openEditor(page);
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  const content = page.getByTestId('screen-content');
  const start = page.getByLabel('Zoom start seconds', { exact: true });
  const length = page.getByLabel('Zoom duration seconds', { exact: true });
  const still = 'matrix(1, 0, 0, 1, 0, 0)';
  const zoomed = /matrix\(2, 0, 0, 2,/;
  const at = async (frame: number) => playhead.fill(String(frame));
  // Where the content's point (fx, fy), as fractions of the content, sits inside the mask.
  const held = async (fx: number, fy: number) => {
    const mask = (await page.getByTestId('screen-mask').boundingBox())!;
    const box = (await content.boundingBox())!;
    return {
      scale: box.width / mask.width,
      x: (box.x + box.width * fx - mask.x) / mask.width,
      y: (box.y + box.height * fy - mask.y) / mask.height,
    };
  };

  await at(60);
  await page.getByRole('button', { name: 'Add zoom at playhead' }).first().click();
  await page.getByRole('slider', { name: 'Zoom level' }).fill('2');
  await expect(start).toHaveValue('2');
  await expect(length).toHaveValue('4');
  // 4 s in is frame 120. 2.5 s long is 75 frames, so the zoom spans frames 120 to 194.
  await start.fill('4');
  await length.fill('2.5');
  await at(90);
  await expect(content).toHaveCSS('transform', still);
  await at(119);
  await expect(content).toHaveCSS('transform', still);
  await at(150);
  await expect(content).toHaveCSS('transform', zoomed);
  await at(195);
  await expect(content).toHaveCSS('transform', still);

  await page.getByLabel('Zoom focus X', { exact: true }).fill('20');
  await page.getByLabel('Zoom focus Y', { exact: true }).fill('80');
  await at(150);
  await expect(content).toHaveCSS('transform', zoomed);
  const panned = await held(0.2, 0.8);
  expect(panned.scale).toBeCloseTo(2, 2);
  expect(panned.x).toBeCloseTo(0.5, 2);
  // The source fills the mask height, so the pan stops at its bottom edge: (1 - 2) + 2 * 0.8.
  expect(panned.y).toBeCloseTo(0.6, 2);

  // The fields stop at what the timeline can hold: 360 frames, and a zoom of at least 6 frames.
  await start.fill('99');
  await expect(start).toHaveValue('9.5');
  await at(284);
  await expect(content).toHaveCSS('transform', still);
  await at(320);
  await expect(content).toHaveCSS('transform', zoomed);
  await length.fill('0.1');
  await expect(length).toHaveValue('0.2');
  await at(288);
  await expect(content).toHaveCSS('transform', zoomed);
  await at(291);
  await expect(content).toHaveCSS('transform', still);
  await length.fill('5');
  await expect(length).toHaveValue('2.5');
});

test('- and = zoom the timeline display one step at a time without editing the sequence', async ({
  page,
}) => {
  await openEditor(page);
  const scale = page.getByRole('slider', { name: 'Timeline scale' });
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  const viewport = page.getByTestId('timeline-scroll');
  const clip = page.getByTestId('track-screen').getByRole('button').first();
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  const value = async () => Number(await scale.inputValue());
  const min = Number(await scale.getAttribute('min'));
  const max = Number(await scale.getAttribute('max'));
  // A clip's length in seconds is its pixel width at the current scale.
  const clipSeconds = async () => (await clip.boundingBox())!.width / (await value());
  const seconds = await clipSeconds();
  await expect(undo).toBeDisabled();

  for (let press = 0; press < 12; press++) await page.keyboard.press('-');
  expect(await value()).toBeCloseTo(min, 3);
  await page.keyboard.press('=');
  expect(await value()).toBeCloseTo(min * Math.SQRT2, 3);
  await page.keyboard.press('-');
  expect(await value()).toBeCloseTo(min, 3);
  for (let press = 0; press < 12; press++) await page.keyboard.press('=');
  expect(await value()).toBeCloseTo(max, 3);
  expect(await clipSeconds()).toBeCloseTo(seconds, 1);
  await expect(undo).toBeDisabled();

  // Zooming in at a late frame, from a focused slider, keeps the playhead on screen.
  for (let press = 0; press < 12; press++) await page.keyboard.press('-');
  await playhead.fill('340');
  for (let press = 0; press < 12; press++) await page.keyboard.press('=');
  expect(await value()).toBeCloseTo(max, 3);
  // The lane area starts where the sticky track labels end, so a playhead under them is hidden.
  const port = (await viewport.boundingBox())!;
  const labels = (await page.locator('.ruler-label').boundingBox())!;
  const head = (await page.locator('.playhead').boundingBox())!;
  expect(head.x).toBeGreaterThanOrEqual(labels.x + labels.width);
  expect(head.x).toBeLessThanOrEqual(port.x + port.width);

  // On layouts where = is typed with Shift (German, Spanish, Swedish), the key is still =.
  await page.keyboard.press('-');
  const stepped = await value();
  await page.evaluate(() =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '=', shiftKey: true })),
  );
  expect(await value()).toBeCloseTo(stepped * Math.SQRT2, 3);

  // A modifier leaves the keys to the browser, and a text field keeps them for typing.
  const before = await value();
  for (const key of ['Control+=', 'Meta+-', 'Alt+=']) await page.keyboard.press(key);
  const place = page.getByRole('spinbutton', { name: 'Place at seconds' });
  await place.focus();
  for (const key of ['-', '=']) await page.keyboard.press(key);
  expect(await value()).toBe(before);
});

test('the backslash key zooms all the way out to the fit window', async ({ page }) => {
  await openEditor(page);
  const scale = page.getByRole('slider', { name: 'Timeline scale' });
  const value = async () => Number(await scale.inputValue());
  const min = Number(await scale.getAttribute('min'));
  for (let press = 0; press < 4; press++) await page.keyboard.press('=');
  expect(await value()).toBeGreaterThan(min);
  await page.keyboard.press('\\');
  expect(await value()).toBeCloseTo(min, 3);
  await expect(scale).toHaveAttribute('aria-valuetext', '1.0 times fit');
  // Already at fit: pressing again is a no-op.
  await page.keyboard.press('\\');
  expect(await value()).toBeCloseTo(min, 3);
  // A text field keeps the key for typing.
  for (let press = 0; press < 4; press++) await page.keyboard.press('=');
  const zoomed = await value();
  const place = page.getByRole('spinbutton', { name: 'Place at seconds' });
  await place.focus();
  await place.press('\\');
  expect(await value()).toBe(zoomed);
});

test('i and o set in/out points in the panel that has focus', async ({ page }) => {
  await openEditor(page);
  // Source panel: park the preview, then i and o mark its range like the Set buttons.
  await seekSource(page, 60);
  await page.locator('.source-panel .monitor-title').click();
  await page.keyboard.press('i');
  await expect(rangeIn(page)).toHaveText('2 s');
  await seekSource(page, 149);
  await page.keyboard.press('o');
  await expect(rangeOut(page)).toHaveText('5 s');
  // The scrub bar's range strip shows both marks between its edges.
  await expect(page.getByTestId('source-bar-range')).toBeVisible();

  // Timeline panel: a clip press hands the keys to it, and the ruler draws the points.
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  await playhead.fill('90');
  await page.getByTestId('track-screen').getByRole('button').first().click();
  await page.keyboard.press('i');
  await expect(page.getByTestId('timeline-in-point')).toHaveAttribute(
    'aria-label',
    'Timeline in at 00:03:00',
  );
  await playhead.fill('240');
  await page.keyboard.press('o');
  await expect(page.getByTestId('timeline-out-point')).toHaveAttribute(
    'aria-label',
    'Timeline out at 00:08:00',
  );
  // Setting a point again moves it.
  await playhead.fill('120');
  await page.keyboard.press('i');
  await expect(page.getByTestId('timeline-in-point')).toHaveAttribute(
    'aria-label',
    'Timeline in at 00:04:00',
  );

  // A form control keeps the keys for itself.
  const place = page.getByRole('spinbutton', { name: 'Place at seconds' });
  await place.focus();
  await page.keyboard.press('o');
  await expect(page.getByTestId('timeline-out-point')).toHaveAttribute(
    'aria-label',
    'Timeline out at 00:08:00',
  );
  await expect(rangeOut(page)).toHaveText('5 s');
});

test('the ruler keeps labelling frames at the deepest zoom', async ({ page }) => {
  await openEditor(page);
  const scale = page.getByRole('slider', { name: 'Timeline scale' });
  const viewport = page.getByTestId('timeline-scroll');
  await scale.fill((await scale.getAttribute('max'))!);
  await page.getByRole('slider', { name: 'Timeline playhead' }).fill('250');
  // Scroll the playhead's frame to the middle of the lanes, as Add zoom or a seek would.
  await viewport.evaluate((element) => {
    const head = document.querySelector('.playhead')!.getBoundingClientRect();
    const port = element.getBoundingClientRect();
    element.scrollLeft += head.left - (port.left + port.width / 2);
  });
  // A label counts as visible where it lies right of the sticky track labels and inside the port.
  const visible = async () =>
    page.locator('.ruler > span').evaluateAll((spans) => {
      const lanes = document.querySelector('.ruler-label')!.getBoundingClientRect().right;
      const edge = document
        .querySelector('[data-testid="timeline-scroll"]')!
        .getBoundingClientRect();
      return spans
        .filter((span) => {
          const box = span.getBoundingClientRect();
          return box.left >= lanes && box.right <= edge.right;
        })
        .map((span) => span.textContent!);
    });
  // The ruler re-renders for the new scroll position before the labels are read.
  await expect.poll(async () => (await visible()).length).toBeGreaterThanOrEqual(2);
  const labels = await visible();
  // Between whole seconds a label is a frame timecode, matching the readout's mm:ss:ff.
  expect(labels.every((label) => /^\d\d:\d\d(:\d\d)?$/.test(label))).toBe(true);
  expect(labels.some((label) => /^\d\d:\d\d:\d\d$/.test(label))).toBe(true);
});

test('the deepest zoom resolves single frames and renders only the visible ruler window', async ({
  page,
}) => {
  await openEditor(page);
  const scale = page.getByRole('slider', { name: 'Timeline scale' });
  // The 12 s demo tops out where the ruler's one-frame step engages, not at REF-60's 32x fit.
  const max = Number(await scale.getAttribute('max'));
  expect(max).toBeCloseTo(4800, 3);
  for (let press = 0; press < 40; press++) await page.keyboard.press('=');
  expect(Number(await scale.inputValue())).toBeCloseTo(max, 3);
  const labels = await page.locator('.ruler > span').allInnerTexts();
  // Marks step one frame at a time from the sequence start, reading as mm:ss:ff between seconds.
  expect(labels[0]).toBe('00:00');
  expect(labels[1]).toBe('00:00:01');
  expect(labels[2]).toBe('00:00:02');
  // 12 s hold 360 frames, but only the window around the viewport renders.
  expect(labels.length).toBeLessThan(100);
});
