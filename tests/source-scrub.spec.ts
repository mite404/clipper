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

test('the mouse over any thumbnail scrubs that card only; the source preview never moves', async ({
  page,
}) => {
  await openEditor(page);
  const card = asset(page, 'Flower study');
  const face = card.locator('.asset-face');
  const image = face.locator('img');
  const thumbnail = await image.getAttribute('src');
  const box = (await face.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
  // The hovered card's face visibly scrubs to the frame under the pointer, line at its middle.
  await expect.poll(() => image.getAttribute('src')).not.toBe(thumbnail);
  const line = card.getByTestId('asset-playhead');
  const lineBox = (await line.boundingBox())!;
  expect(lineBox.x + lineBox.width / 2 - box.x).toBeCloseTo(box.width * 0.5, 0);
  // The source preview keeps its own playhead, and the range is untouched.
  await expect(position(page)).toHaveText('00:00');
  await expect.poll(() => seconds(page)).toBe(0);
  await expect(rangeIn(page)).toHaveText('0 s');
  await expect(rangeOut(page)).toHaveText('14 s');
  await page.mouse.move(box.x + 1, box.y + box.height / 2);
  const startBox = (await line.boundingBox())!;
  expect(startBox.x + startBox.width / 2 - box.x).toBeLessThan(box.width * 0.1);
  await expect(position(page)).toHaveText('00:00');
  // An unselected card scrubs itself too, without being selected or moving the source.
  const otherCard = asset(page, 'A conversation');
  const otherFace = otherCard.locator('.asset-face');
  const otherThumbnail = await otherFace.locator('img').getAttribute('src');
  const other = (await otherFace.boundingBox())!;
  await page.mouse.move(other.x + other.width * 0.9, other.y + 40);
  await expect.poll(() => otherFace.locator('img').getAttribute('src')).not.toBe(otherThumbnail);
  await expect(otherCard.getByTestId('asset-playhead')).toBeVisible();
  await expect(otherCard).toHaveAttribute('aria-pressed', 'false');
  await expect(position(page)).toHaveText('00:00');
  await expect.poll(() => seconds(page)).toBe(0);
  // Each scrubbed card keeps its own line where the pointer left it.
  await expect(page.getByTestId('asset-playhead')).toHaveCount(2);
});

test('the wheel steps the card itself a second, up ahead, and scrolls the panel at either end', async ({
  page,
}) => {
  await openEditor(page);
  const card = asset(page, 'Flower study');
  const face = card.locator('.asset-face');
  const line = card.getByTestId('asset-playhead');
  const box = (await face.boundingBox())!;
  // The line's rendered position, the percentage the card's frame drives. The card's own box
  // drifts with the panel's scrollbar, so pixel boxes mismeasure it across the run.
  const share = async () => parseFloat(await line.evaluate((el) => (el as HTMLElement).style.left));
  // The demo's Flower study is 14 s at 30 fps: 420 frames, the last seekable is 419.
  const atFrame = (frame: number) => (frame / 419) * 100;
  // A hover at the left edge lands below 10 frames, so one wheel notch back parks the card at
  // frame 0. Wheeling further would scroll the panel: a wheel that cannot step is left to it.
  await page.mouse.move(box.x + 2, box.y + box.height / 2);
  await expect(line).toBeVisible();
  await page.mouse.wheel(0, 100);
  await expect.poll(share).toBeCloseTo(atFrame(0), 3);
  await page.mouse.wheel(0, -100);
  await expect.poll(share).toBeCloseTo(atFrame(30), 3);
  await page.mouse.wheel(0, -100);
  await page.mouse.wheel(0, -100);
  await expect.poll(share).toBeCloseTo(atFrame(90), 3);
  await page.mouse.wheel(0, 100);
  await expect.poll(share).toBeCloseTo(atFrame(60), 3);
  // The source preview never stepped with any of them.
  await expect(position(page)).toHaveText('00:00');
  // A trackpad's small deltas add up to a step: one alone moves nothing, and the nine of a swipe
  // cross the notch twice for two seconds. Synthetic ticks: a trusted small wheel's deltaY
  // halves on a high-density screen, so only a synthetic one is exact at any density.
  const tick = (deltaY: number) =>
    face.evaluate((face, dy) => {
      const event = new WheelEvent('wheel', { deltaY: dy, bubbles: true, cancelable: true });
      face.dispatchEvent(event);
      return event.defaultPrevented;
    }, deltaY);
  expect(await tick(-10)).toBe(true);
  await page.waitForTimeout(200);
  await expect.poll(share).toBeCloseTo(atFrame(60), 3);
  for (let i = 0; i < 8; i++) await tick(-10);
  await expect.poll(share).toBeCloseTo(atFrame(120), 3);
  // A consumed wheel is cancelled so the panel holds still; one that cannot step is left alone.
  const cancelled = tick;
  // The synthetic wheel really steps (it is the same handler), so park at 0 again after it.
  expect(await cancelled(-100)).toBe(true);
  for (let i = 0; i < 5; i++) await page.mouse.wheel(0, 100);
  await expect.poll(share).toBeCloseTo(atFrame(0), 3);
  expect(await cancelled(100)).toBe(false);
  for (let i = 0; i < 14; i++) await page.mouse.wheel(0, -100);
  await expect.poll(share).toBeCloseTo(100, 3);
  expect(await cancelled(-100)).toBe(false);
  // The compact Clip view rows and the audio rows keep normal scrolling.
  const other = asset(page, 'A conversation').locator('.asset-image');
  const consumed = await other.evaluate((element) => {
    const event = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  }, -100);
  expect(consumed).toBe(false);
});

test('clicking a scrubbed card selects it and adopts the position; Set in and Set out follow it', async ({
  page,
}) => {
  await openEditor(page);
  const card = asset(page, 'A conversation');
  const face = card.locator('.asset-face');
  const box = (await face.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
  await expect(card.getByTestId('asset-playhead')).toBeVisible();
  await expect(position(page)).toHaveText('00:00');
  await card.click();
  await expect(card).toHaveAttribute('aria-pressed', 'true');
  await expect(position(page)).toHaveText('00:07');
  await expect.poll(() => seconds(page)).toBeCloseTo(7, 0);
  await page.getByRole('button', { name: 'Set in', exact: true }).click();
  await expect(rangeIn(page)).toHaveText('7 s');
  // Scrubbing the other card afterwards moves nothing the source holds.
  const other = asset(page, 'Flower study');
  const otherBox = (await other.locator('.asset-face').boundingBox())!;
  await page.mouse.move(otherBox.x + otherBox.width * 0.9, otherBox.y + 40);
  await expect(position(page)).toHaveText('00:07');
  await expect(rangeIn(page)).toHaveText('7 s');
  // A card never scrubbed selects as before: the fresh source starts at 0.
  await asset(page, 'Voiceover').click();
  await expect(position(page)).toHaveText('00:00');
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
