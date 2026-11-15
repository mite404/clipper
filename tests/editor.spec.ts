import { test, expect } from '@playwright/test';
import path from 'node:path';

test('splice, scrub, play, rewind and animate a real media composition', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Developer walkthrough' })).toBeVisible();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page.getByRole('button', { name: 'Play source', exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator('.source-preview video')
        .evaluate((video: HTMLVideoElement) => !video.paused && video.currentTime > 0),
    )
    .toBe(true);
  await page.getByRole('button', { name: 'Pause source', exact: true }).click();
  await page.getByRole('slider', { name: 'Source preview position' }).fill('1');
  await expect
    .poll(() =>
      page
        .locator('.source-preview video')
        .evaluate((video: HTMLVideoElement) => video.currentTime),
    )
    .toBeCloseTo(1, 1);
  await expect(page.getByTestId('track-screen').getByRole('button')).toHaveCount(2);
  await expect(page.getByTestId('track-camera').getByRole('button')).toHaveCount(1);
  await expect(page.locator('svg[data-waveform] path').first()).toHaveAttribute('d', /M/);
  const scrub = page.getByRole('slider', { name: 'Timeline playhead' });
  await scrub.fill('90');
  await expect(page.getByTestId('timecode')).toHaveText('00:03:00');
  await page.getByTestId('track-screen').getByRole('button').first().click();
  await page.getByRole('button', { name: 'Split selected clip' }).click();
  await expect(page.getByTestId('track-screen').getByRole('button')).toHaveCount(3);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByTestId('track-screen').getByRole('button')).toHaveCount(2);
  await page.getByTestId('track-voice').getByRole('button').first().click();
  await page.getByRole('button', { name: 'Split selected clip' }).click();
  await expect(page.getByTestId('track-voice').getByRole('button')).toHaveCount(2);
  await page.getByRole('button', { name: 'Add zoom at playhead' }).first().click();
  await page.getByRole('slider', { name: 'Zoom level' }).fill('2');
  await page.getByLabel('Zoom focus X', { exact: true }).fill('30');
  await page.getByLabel('Zoom focus Y', { exact: true }).fill('65');
  await scrub.fill('135');
  await expect(page.getByTestId('screen-content')).toHaveCSS('transform', /matrix\(2,/);
  await page.getByLabel('screen horizontal crop').fill('25');
  await expect(page.locator('[data-testid="screen-mask"] video:visible')).toHaveCSS(
    'object-position',
    '25% 50%',
  );
  await expect(page.getByTestId('camera-content')).toHaveCSS(
    'transform',
    'matrix(1, 0, 0, 1, 0, 0)',
  );
  await scrub.fill('270');
  await expect(page.getByTestId('screen-content')).toHaveCSS(
    'transform',
    'matrix(1, 0, 0, 1, 0, 0)',
  );
  await scrub.fill('120');
  await page.locator('body').click({ position: { x: 12, y: 100 } });
  await page.keyboard.press('l');
  await expect(page.getByTestId('transport-state')).toHaveText('Playing · 1×');
  await expect.poll(async () => Number(await scrub.inputValue())).toBeGreaterThan(130);
  await page.keyboard.press('l');
  await expect(page.getByTestId('transport-state')).toHaveText('Playing · 2×');
  await page.keyboard.press('k');
  const frame = Number(await scrub.inputValue());
  await page.keyboard.press('j');
  await expect.poll(async () => Number(await scrub.inputValue())).toBeLessThan(frame - 5);
  await page.keyboard.press('k');
  await scrub.fill('75');
  await expect
    .poll(async () =>
      page
        .locator('[data-testid="compose-monitor"] video:visible')
        .first()
        .evaluate((video: HTMLVideoElement) => video.currentTime),
    )
    .toBeCloseTo(2.5, 0);
  await expect(page.getByTestId('screen-mask')).toHaveCSS('border-radius', '22px');
  await expect(page.getByTestId('camera-mask')).toHaveCSS('border-radius', '22px');
  // After the screen splice, its source jumps by one second; camera and split speech do not.
  await scrub.fill('225');
  for (const [selector, expected] of [
    ['[data-testid="screen-mask"] video:visible', 8.5],
    ['[data-testid="camera-mask"] video:visible', 7.5],
    ['[data-testid="compose-monitor"] audio[src^="blob:"]', 7.5],
  ] as const) {
    await expect
      .poll(() =>
        page
          .locator(selector)
          .first()
          .evaluate((media: HTMLMediaElement) => media.currentTime),
      )
      .toBeCloseTo(expected, 1);
  }
  await page.getByRole('button', { name: 'Mute Voiceover', exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator('[data-testid="compose-monitor"] audio[src^="blob:"]')
        .evaluateAll((audio: HTMLAudioElement[]) =>
          audio.map((a) => a.volume).sort((a, b) => a - b),
        ),
    )
    .toEqual([0, 0.22]);
  await page.getByRole('button', { name: 'Unmute Voiceover', exact: true }).click();
  await page.locator('body').click({ position: { x: 12, y: 100 } });
  await page.keyboard.press('l');
  await expect
    .poll(() =>
      page
        .locator('[data-testid="compose-monitor"] audio[src^="blob:"]')
        .evaluateAll((audio: HTMLAudioElement[]) =>
          audio.some((a) => !a.paused && a.currentTime > 7.6 && a.volume === 1),
        ),
    )
    .toBe(true);
  await page.keyboard.press('k');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const download = await downloadEvent;
  const { readFile } = await import('node:fs/promises');
  const saved = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(saved.clips.filter((clip: { track: string }) => clip.track === 'voice')).toHaveLength(2);
  expect(saved.zooms[0].scale).toBe(2);
  expect([saved.zooms[0].x, saved.zooms[0].y]).toEqual([30, 65]);
  expect(saved.layout.radius).toBe(22);
  expect(errors).toEqual([]);
});

test('imports local video and audio without uploading them', async ({ page }) => {
  const uploads: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') uploads.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page
    .getByLabel('Import local media')
    .setInputFiles([
      path.resolve('public/media/landscape.mp4'),
      path.resolve('public/media/music.wav'),
    ]);
  await expect(page.getByTestId('media-status')).toHaveText('6 assets ready', { timeout: 30000 });
  await page.getByRole('button', { name: 'Select landscape.mp4' }).click();
  await page.getByLabel('Source in seconds').fill('2');
  await page.getByLabel('Source out seconds').fill('4');
  await page.getByRole('button', { name: 'Insert source at playhead' }).click();
  await expect(page.getByTestId('track-screen').getByRole('button')).toHaveCount(3);
  await page.getByRole('button', { name: 'Select music.wav' }).click();
  await page.getByLabel('Insert onto track').selectOption('music');
  await page.getByLabel('Source in seconds').fill('0.5');
  await page.getByLabel('Source out seconds').fill('2');
  await page.getByRole('button', { name: 'Insert source at playhead' }).click();
  await expect(page.getByTestId('track-music').getByRole('button')).toHaveCount(2);
  await expect(page.locator('[role="status"]')).toContainText('Inserted');
  expect(uploads).toEqual([]);
});

test('keeps all tracks on screen and survives realistic difficult imports', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const bottom = await page.getByTestId('track-music').boundingBox();
  expect(bottom && bottom.y + bottom.height).toBeLessThan(1000);
  await page.getByLabel('Import local media').setInputFiles({
    name: 'corrupted-screen-recording.mp4',
    mimeType: 'video/mp4',
    buffer: Buffer.from('not a video'),
  });
  await expect(page.locator('[role="status"]')).toContainText('Could not import');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready');
  const name =
    '2026-11-15_DevRel_Quarterly_Platform_Walkthrough_Review_v12_screen_recording_' +
    'Chrome_1440p_English_Subtitles_Customer_Demo_Approved_by_Product_Engineering_Final.mp4';
  const { readFile } = await import('node:fs/promises');
  await page.getByLabel('Import local media').setInputFiles({
    name,
    mimeType: 'video/mp4',
    buffer: await readFile('public/media/landscape.mp4'),
  });
  await expect(page.getByRole('button', { name: `Select ${name}` })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 900 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(320);
  await expect(page.getByRole('button', { name: 'Insert source at playhead' })).toBeVisible();
  await page.getByRole('button', { name: 'Insert source at playhead' }).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(320);
});

test('shortcuts dialog traps focus and leaves edits untouched', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page.getByRole('button', { name: 'Shortcuts' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('l');
  await expect(page.getByTestId('transport-state')).toHaveText('Paused');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Shortcuts' })).toBeFocused();
});

test('leaves modified keys to the browser instead of editing the timeline', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const clips = page.getByTestId('track-screen').getByRole('button');
  await page.getByRole('slider', { name: 'Timeline playhead' }).fill('45');
  await clips.first().click();
  for (const chord of ['Control+s', 'Meta+s', 'Alt+s', 'Control+Backspace', 'Alt+ArrowRight']) {
    await page.keyboard.press(chord);
    await expect(clips).toHaveCount(2);
    await expect(page.getByTestId('timecode')).toHaveText('00:01:15');
  }
  await page.keyboard.press('s');
  await expect(clips).toHaveCount(3);
  // There is no redo, so the redo chord must not undo a second time.
  await page.keyboard.press('Control+Shift+z');
  await expect(clips).toHaveCount(3);
  await page.keyboard.press('Control+z');
  await expect(clips).toHaveCount(2);
});

test('shows the frame the preview holds after a pause', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const shown = async () => {
    const [minutes, seconds, frames] = (await page.getByTestId('timecode').innerText())
      .split(':')
      .map(Number);
    return (minutes * 60 + seconds) * 30 + frames;
  };
  // Painting is throttled during playback, so several pauses are needed to land between paints.
  for (const playFor of [430, 470, 510, 550, 590]) {
    await page.keyboard.press('l');
    await page.waitForTimeout(playFor);
    await page.keyboard.press('k');
    await expect(page.getByTestId('transport-state')).toHaveText('Paused');
    const paused = await shown();
    // The arrow key steps from the frame the player really holds.
    await page.keyboard.press('ArrowRight');
    expect(await shown()).toBe(paused + 1);
    await page.getByRole('button', { name: 'Previous frame' }).click();
    expect(await shown()).toBe(paused);
  }
});
