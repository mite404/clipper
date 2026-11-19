import { test, expect, type Page } from '@playwright/test';
import { markRange, rangeIn, rangeOut, seekSource } from './source-range';

async function openEditor(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

const asset = (page: Page, name: string) =>
  page.getByRole('button', { name: `Select ${name}`, exact: true });
const position = (page: Page) => page.getByTestId('source-position');
const seconds = (page: Page) =>
  page.locator('.source-preview video').evaluate((video: HTMLVideoElement) => video.currentTime);
// The demo's Flower study is 14 s, so its last seekable frame is 419 of 420.
const FLOWER_LAST = 14 - 1 / 30;

test('the mouse over the selected thumbnail seeks the source preview and draws a line; others stay still', async ({
  page,
}) => {
  await openEditor(page);
  const face = asset(page, 'Flower study').locator('.asset-face');
  const box = (await face.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
  await expect(position(page)).toHaveText('00:07');
  await expect.poll(() => seconds(page)).toBeCloseTo(7, 0);
  const line = asset(page, 'Flower study').getByTestId('asset-playhead');
  const lineBox = (await line.boundingBox())!;
  expect(lineBox.x + lineBox.width / 2 - box.x).toBeCloseTo(box.width * 0.5, 0);
  await page.mouse.move(box.x + 1, box.y + box.height / 2);
  await expect(position(page)).toHaveText('00:00');
  // An unselected thumbnail neither seeks nor selects, and shows no line.
  const other = (await asset(page, 'A conversation').boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2);
  await expect(position(page)).toHaveText('00:12');
  await page.mouse.move(other.x + other.width / 2, other.y + 40);
  await expect(position(page)).toHaveText('00:12');
  await expect(asset(page, 'A conversation')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('asset-playhead')).toHaveCount(1);
  await expect(rangeIn(page)).toHaveText('0 s');
  await expect(rangeOut(page)).toHaveText('14 s');
});

test('the wheel over the selected thumbnail steps a second, up ahead, and scrolls the panel at either end', async ({
  page,
}) => {
  await openEditor(page);
  const box = (await asset(page, 'Flower study').locator('.asset-face').boundingBox())!;
  await page.mouse.move(box.x + 2, box.y + box.height / 2);
  await expect(position(page)).toHaveText('00:00');
  await page.mouse.wheel(0, -100);
  await expect(position(page)).toHaveText('00:01');
  await page.mouse.wheel(0, -100);
  await page.mouse.wheel(0, -100);
  await expect(position(page)).toHaveText('00:03');
  await page.mouse.wheel(0, 100);
  await expect(position(page)).toHaveText('00:02');
  // A trackpad's small deltas add up to a step (a high-density screen halves them): one alone
  // moves nothing, a swipe moves at least a second.
  await page.mouse.wheel(0, -10);
  await page.waitForTimeout(200);
  await expect(position(page)).toHaveText('00:02');
  for (let i = 0; i < 8; i++) await page.mouse.wheel(0, -10);
  await expect.poll(() => seconds(page)).toBeGreaterThanOrEqual(3);
  // A consumed wheel is cancelled so the panel holds still; one that cannot seek is left alone.
  const cancelled = (deltaY: number) =>
    asset(page, 'Flower study')
      .locator('.asset-face')
      .evaluate((face, dy) => {
        const event = new WheelEvent('wheel', { deltaY: dy, bubbles: true, cancelable: true });
        face.dispatchEvent(event);
        return event.defaultPrevented;
      }, deltaY);
  expect(await cancelled(-100)).toBe(true);
  await page.getByRole('slider', { name: 'Source preview position' }).fill('0');
  expect(await cancelled(100)).toBe(false);
  await page.getByRole('slider', { name: 'Source preview position' }).fill(String(FLOWER_LAST));
  expect(await cancelled(-100)).toBe(false);
  // Another thumbnail and the audio rows keep normal scrolling.
  const other = asset(page, 'A conversation').locator('.asset-image');
  const consumed = await other.evaluate((element) => {
    const event = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(consumed).toBe(false);
});

test('dragging the mini bar only seeks; Set in and Set out mark the range, never leaving it empty', async ({
  page,
}) => {
  await openEditor(page);
  const bar = page.getByRole('slider', { name: 'Source preview position' });
  const box = (await bar.boundingBox())!;
  await page.mouse.move(box.x + 4, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect.poll(() => seconds(page)).toBeGreaterThan(5);
  await expect(rangeIn(page)).toHaveText('0 s');
  await expect(rangeOut(page)).toHaveText('14 s');
  const range = page.getByTestId('source-bar-range');
  const full = (await range.boundingBox())!;
  await seekSource(page, 90);
  await page.getByRole('button', { name: 'Set in', exact: true }).click();
  await expect(rangeIn(page)).toHaveText('3 s');
  await seekSource(page, 150);
  await page.getByRole('button', { name: 'Set out', exact: true }).click();
  // Out includes the frame it is set on, so the range ends one frame after it.
  await expect(rangeOut(page)).toHaveText('5.033 s');
  const marked = (await range.boundingBox())!;
  expect(marked.width).toBeLessThan(full.width * 0.4);
  expect(marked.x).toBeGreaterThan(full.x + full.width * 0.15);
  // Seeking again moves nothing of the range.
  await seekSource(page, 300);
  await expect(rangeIn(page)).toHaveText('3 s');
  await expect(rangeOut(page)).toHaveText('5.033 s');
  // In cannot pass Out, and Out cannot sit before In: one frame stays.
  await page.getByRole('button', { name: 'Set in', exact: true }).click();
  await expect(rangeIn(page)).toHaveText('5 s');
  await seekSource(page, 10);
  await page.getByRole('button', { name: 'Set out', exact: true }).click();
  await expect(rangeOut(page)).toHaveText('5.033 s');
  // The marked range is what insertion uses: 5 to 5.033 s is one frame.
  await page.getByRole('button', { name: 'Insert source at playhead' }).click();
  await expect(page.getByTestId('track-screen').getByRole('button')).toHaveCount(3);
});

test('audio sources are marked on a bar over the waveform with the same buttons', async ({
  page,
}) => {
  await openEditor(page);
  await asset(page, 'Voiceover').click();
  await expect(page.getByTestId('source-bar-range')).toBeVisible();
  await markRange(page, 30, 90);
  await expect(rangeIn(page)).toHaveText('1 s');
  await expect(rangeOut(page)).toHaveText('3 s');
  // The native audio controls can park at the very end, one frame past the last: Out stops at 14 s.
  await seekSource(page, 420);
  await page.getByRole('button', { name: 'Set out', exact: true }).click();
  await expect(rangeOut(page)).toHaveText('14 s');
});

test('Clip view lists sources compactly, selects like the thumbnails, and goes back', async ({
  page,
}) => {
  await openEditor(page);
  await expect(page.locator('.asset-image')).toHaveCount(4);
  await page.getByRole('button', { name: 'Clip view', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Clip view', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.asset-image')).toHaveCount(0);
  await expect(asset(page, 'Flower study')).toContainText('960 × 540');
  await expect(asset(page, 'Flower study')).toContainText('00:14');
  await expect(asset(page, 'Voiceover')).toContainText('Audio · 00:14');
  await expect(asset(page, 'Flower study')).not.toContainText('fps');
  await asset(page, 'A conversation').click();
  await expect(asset(page, 'A conversation')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.source-preview video')).toBeVisible();
  // Rows have no face to scrub: the mouse and wheel over them seek nothing.
  await seekSource(page, 30);
  const row = (await asset(page, 'A conversation').boundingBox())!;
  await page.mouse.move(row.x + row.width * 0.9, row.y + row.height / 2);
  await page.mouse.wheel(0, -100);
  await expect(position(page)).toHaveText('00:01');
  await page.getByRole('button', { name: 'Thumbnail view', exact: true }).click();
  await expect(page.locator('.asset-image')).toHaveCount(4);
});
