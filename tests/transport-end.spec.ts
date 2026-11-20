import { test, expect } from '@playwright/test';

// Continuous raster capture competes with media decoding on two-core runners.
test.use({ trace: { mode: 'on', screenshots: false }, video: 'off' });

test('keeps the final forward frame when fast playback ends', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  const ended = [];
  for (let attempt = 0; attempt < 8; attempt++) {
    await playhead.fill('200');
    await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
    for (let press = 0; press < 3; press++) await page.keyboard.press('l');
    await expect(page.getByTestId('transport-state')).toHaveText('Playing · 4×');
    await expect(page.getByTestId('transport-state')).toHaveText('Paused', { timeout: 30000 });
    ended.push({
      shown: Number(await playhead.inputValue()),
      camera: await page
        .locator('[data-testid="camera-mask"] video:visible')
        .evaluate((video: HTMLVideoElement) => Math.round(video.currentTime * 30)),
    });
  }
  expect(ended).toEqual(Array.from({ length: 8 }, () => ({ shown: 359, camera: 359 })));
});

test('the go-to-end button seeks to the final frame', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  await page.getByRole('button', { name: 'Go to end', exact: true }).click();
  await expect(page.getByTestId('timecode')).toHaveText('00:11:29');
  expect(Number(await playhead.inputValue())).toBe(359);
});
