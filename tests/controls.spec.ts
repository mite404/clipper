import { test, expect, type Page } from '@playwright/test';

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
  expect(panned.y).toBeCloseTo(0.5, 2);

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
