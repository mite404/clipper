import { test, expect } from '@playwright/test';
import path from 'node:path';
import { choose } from './choose';

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
  const screenVideo = page.locator('[data-testid="screen-mask"] video:visible');
  const beforeCrop = await screenVideo.boundingBox();
  await page.getByLabel('screen horizontal crop').fill('25');
  // 960×540 covers 880×700. A 25-point crop shift reveals one quarter of its horizontal overflow.
  await expect
    .poll(async () => ((await screenVideo.boundingBox())!.x - beforeCrop!.x) / beforeCrop!.width)
    .toBeCloseTo(0.073214, 3);
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
  await choose(page, 'Insert onto track', 'A2 · Music');
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

test('names every file a mixed import could not read', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const { readFile } = await import('node:fs/promises');
  const broken = (name: string) => ({
    name,
    mimeType: 'video/mp4',
    buffer: Buffer.from('not a video'),
  });
  await page.getByLabel('Import local media').setInputFiles([
    broken('first-broken.mp4'),
    {
      name: 'good.mp4',
      mimeType: 'video/mp4',
      buffer: await readFile('public/media/landscape.mp4'),
    },
    broken('last-broken.mp4'),
  ]);
  await expect(page.getByTestId('media-status')).toHaveText('5 assets ready', { timeout: 30000 });
  const status = page.locator('.app-footer [role="status"]');
  await expect(status).toContainText('Imported 1 local file.');
  await expect(status).toContainText('Could not import first-broken.mp4.');
  await expect(status).toContainText('Could not import last-broken.mp4.');
});

test('gives up on a stalled demo download and frees what it loaded', async ({ page }) => {
  await page.addInitScript(() => {
    const live = new Set<string>();
    const create = URL.createObjectURL.bind(URL);
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      const url = create(blob);
      live.add(url);
      return url;
    };
    URL.revokeObjectURL = (url) => {
      live.delete(url);
      revoke(url);
    };
    Object.assign(window, { liveUrls: live });
  });
  // The connection accepts the request and then never answers.
  await page.route('**/media/music.wav', () => {});
  await page.goto('/');
  await expect(page.locator('.app-footer [role="status"]')).toContainText(
    'Demo unavailable. Could not load demo music.wav.',
    { timeout: 25000 },
  );
  await expect(page.getByLabel('Import local media')).toBeEnabled();
  expect(
    await page.evaluate(() => (window as unknown as { liveUrls: Set<string> }).liveUrls.size),
  ).toBe(0);
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

test('deletes and restores from the keyboard, refuses overlapping zooms and clamps seeking', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const clips = page.getByTestId('track-screen').getByRole('button');
  const zooms = page.getByRole('button', { name: 'Select zoom', exact: true });
  const status = page.locator('.app-footer [role="status"]');
  const timecode = page.getByTestId('timecode');
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  // Shortcuts are ignored while a form control has focus, so park focus on plain text first.
  const leaveControls = () => page.locator('.project-title').click();

  await clips.nth(1).click();
  await page.keyboard.press('Delete');
  await expect(clips).toHaveCount(1);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(clips).toHaveCount(2);

  const addZoom = page.getByRole('button', { name: 'Add zoom at playhead' }).first();
  await addZoom.click();
  await expect(zooms).toHaveCount(1);
  await addZoom.click();
  await expect(status).toContainText('Zooms cannot overlap');
  await expect(zooms).toHaveCount(1);
  // The new zoom is the selection, so Backspace removes it and leaves the clips alone.
  await page.keyboard.press('Backspace');
  await expect(zooms).toHaveCount(0);
  await expect(clips).toHaveCount(2);

  await playhead.fill('0');
  await leaveControls();
  await page.keyboard.press('ArrowLeft');
  await expect(timecode).toHaveText('00:00:00');
  await page.keyboard.press('ArrowRight');
  await expect(timecode).toHaveText('00:00:01');
  // The demo is 360 frames long, so its last frame is 11 s and 29 frames.
  await playhead.fill((await playhead.getAttribute('max'))!);
  await leaveControls();
  await expect(timecode).toHaveText('00:11:29');
  await page.keyboard.press('ArrowRight');
  await expect(timecode).toHaveText('00:11:29');
  await page.keyboard.press('ArrowLeft');
  await expect(timecode).toHaveText('00:11:28');

  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Pause playback', exact: true })).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Play composition', exact: true })).toBeVisible();
});

test('undoes a slider drag in one step and ignores edits that change nothing', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const clips = page.getByTestId('track-screen').getByRole('button');
  const undo = page.getByRole('button', { name: 'Undo' });
  const radius = page.getByRole('slider', { name: 'Corner radius' });
  const mask = page.getByTestId('screen-mask');

  await page.getByRole('slider', { name: 'Timeline playhead' }).fill('45');
  await clips.first().click();
  await page.getByRole('button', { name: 'Split selected clip' }).click();
  await expect(clips).toHaveCount(3);

  // A real drag: the slider reports every value it passes, 22 up to about 50.
  const box = (await radius.boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + (box.width * 22) / 60, y);
  await page.mouse.down();
  for (let step = 1; step <= 20; step++)
    await page.mouse.move(box.x + (box.width * (22 + step * 1.4)) / 60, y);
  await page.mouse.up();
  const dragged = Number(await radius.inputValue());
  expect(dragged).toBeGreaterThan(40);

  await undo.click();
  await expect(mask).toHaveCSS('border-radius', '22px');
  await expect(clips).toHaveCount(3);
  await undo.click();
  await expect(clips).toHaveCount(2);
  await expect(undo).toBeDisabled();

  // 150 is clamped to the 100 the field already holds, so it is not an edit.
  const crop = page.getByLabel('screen horizontal crop');
  await crop.fill('100');
  await page.waitForTimeout(1000);
  await crop.fill('150');
  await expect(crop).toHaveValue('100');
  await undo.click();
  await expect(crop).toHaveValue('50');
  await expect(undo).toBeDisabled();
});

test('keeps the last 50 edits in undo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const undo = page.getByRole('button', { name: 'Undo' });
  const across = page.getByLabel('screen horizontal crop');
  const down = page.getByLabel('screen vertical crop');

  // Alternating fields keeps the 51 edits from folding into one step.
  for (let edit = 1; edit <= 51; edit++) await (edit % 2 ? across : down).fill(String(edit));
  for (let step = 1; step <= 49; step++) await undo.click();
  await expect(undo).toBeEnabled();
  await undo.click();
  // The oldest step is gone: the first edit stays and Undo has nothing left.
  await expect(undo).toBeDisabled();
  await expect(across).toHaveValue('1');
  await expect(down).toHaveValue('50');
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
