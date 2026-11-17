import { test, expect } from '@playwright/test';
import { copyFile, mkdtemp, readFile, truncate, utimes, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

test('opens export settings with MP4 at the app resolution and isolates modal shortcuts', async ({
  page,
}, info) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready');
  await page.getByRole('combobox', { name: 'Export resolution' }).selectOption('3840');
  await page.getByLabel('Timeline playhead', { exact: true }).fill('87');
  const open = page.getByRole('button', { name: 'Export video', exact: true });
  await open.click();
  const dialog = page.getByRole('dialog', { name: 'Export video' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('combobox', { name: 'Format' })).toHaveValue('mp4');
  await expect(dialog).toContainText('3840 × 2160');
  await expect(dialog).toContainText('developer-walkthrough-4k.mp4');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByLabel('Timeline playhead', { exact: true })).toHaveValue('87');
  await dialog.getByRole('combobox', { name: 'Format' }).selectOption('mov');
  await expect(dialog).toContainText('PCM');
  await expect(dialog).toContainText('11.5 MB');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(open).toBeFocused();
  await open.click();
  await expect(dialog.getByRole('combobox', { name: 'Format' })).toHaveValue('mov');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(open).toBeFocused();
  for (const viewport of [1440, 320]) {
    await page.setViewportSize({ width: viewport, height: 1000 });
    for (const width of [1920, 3840]) {
      await page.getByRole('combobox', { name: 'Export resolution' }).selectOption(String(width));
      await open.click();
      for (const format of ['mp4', 'mov', 'webm']) {
        await dialog.getByRole('combobox', { name: 'Format' }).selectOption(format);
        const filename = `developer-walkthrough-${width === 1920 ? '1080p' : '4k'}.${format}`;
        await expect(dialog.getByText(filename, { exact: true })).toBeVisible();
        await expect(dialog).toContainText(
          'The save dialog may hide the extension. The saved file includes it.',
        );
        expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
          true,
        );
        const bounds = (await dialog.boundingBox())!;
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport);
        await dialog.screenshot({
          path: info.outputPath(`filename-${viewport}-${width}-${format}.png`),
        });
      }
      await page.keyboard.press('Escape');
      await expect(open).toBeFocused();
    }
  }
});

test('renders at selected HD and 4K dimensions while preserving fitted framing and held state', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready');
  await page.getByLabel('screen horizontal crop', { exact: true }).fill('17');
  await page.getByRole('slider', { name: 'Corner radius', exact: true }).fill('38');
  await page.getByLabel('Timeline playhead', { exact: true }).fill('87');
  const source = await page.getByTestId('screen-mask').locator('video').first().elementHandle();
  for (const viewport of [1440, 617]) {
    await page.setViewportSize({ width: viewport, height: 1000 });
    const monitor = (await page.getByTestId('compose-monitor').boundingBox())!;
    for (const width of [1920, 3840, 1920]) {
      await page.getByRole('combobox', { name: 'Export resolution' }).selectOption(String(width));
      const root = await page.getByTestId('screen-mask').evaluate((element) => {
        const style = getComputedStyle(element.parentElement!);
        return { width: parseFloat(style.width), height: parseFloat(style.height) };
      });
      expect(root).toEqual({ width, height: (width * 9) / 16 });
      const scale = width / 1280;
      await expect(page.getByTestId('screen-mask')).toHaveCSS('width', `${880 * scale}px`);
      await expect(page.getByTestId('screen-mask')).toHaveCSS('height', `${700 * scale}px`);
      await expect(page.getByTestId('screen-mask')).toHaveCSS('border-radius', `${38 * scale}px`);
      await expect(page.getByLabel('Timeline playhead', { exact: true })).toHaveValue('87');
      await expect(page.getByLabel('screen horizontal crop', { exact: true })).toHaveValue('17');
      expect(
        await page
          .getByTestId('screen-mask')
          .locator('video')
          .first()
          .evaluate((video, original) => video === original, source),
      ).toBe(true);
      const fitted = (await page.getByTestId('compose-monitor').boundingBox())!;
      expect(fitted.width).toBeCloseTo(monitor.width, 1);
      expect(fitted.height).toBeCloseTo(monitor.height, 1);
      await page
        .getByTestId('compose-monitor')
        .screenshot({ path: testInfo.outputPath(`composer-${viewport}-${width}.png`) });
    }
  }
  await page.getByRole('button', { name: 'Play composition', exact: true }).click();
  await page.getByRole('combobox', { name: 'Export resolution' }).selectOption('3840');
  await expect(page.getByRole('button', { name: 'Pause playback', exact: true })).toBeVisible();
  await expect
    .poll(() => page.getByLabel('Timeline playhead', { exact: true }).inputValue())
    .not.toBe('87');
  await page.getByRole('button', { name: 'Pause playback', exact: true }).click();
});

test('keeps project delivery controls readable at desktop and narrow widths', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  for (const width of [1440, 960, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const header = (await page.locator('.app-header').boundingBox())!;
    for (const control of [
      page.getByRole('combobox', { name: 'Export resolution' }),
      page.getByRole('button', { name: 'Save project', exact: true }),
      page.getByRole('button', { name: 'Export video', exact: true }),
    ]) {
      const box = (await control.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(header.y);
      expect(box.y + box.height).toBeLessThanOrEqual(header.y + header.height);
    }
    expect(
      (await page.getByRole('combobox', { name: 'Export resolution' }).boundingBox())!.width,
    ).toBeGreaterThanOrEqual(115);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await expect(page.locator('.app-footer [role="status"]')).toBeInViewport({ ratio: 1 });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const musicMute = page.getByRole('button', { name: 'Mute Music', exact: true });
    const muteBox = (await musicMute.boundingBox())!;
    const footerBox = (await page.locator('.app-footer').boundingBox())!;
    expect(muteBox.y + muteBox.height).toBeLessThanOrEqual(footerBox.y);
    await musicMute.click();
    await page.getByRole('button', { name: 'Unmute Music', exact: true }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
  }
});

test('puts Media before Save project and saves by pointer and keyboard at 617×1295', async ({
  page,
}) => {
  await page.setViewportSize({ width: 617, height: 1295 });
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await expect(page.locator('.brand')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Developer walkthrough' })).toHaveCount(0);
  const save = page.getByRole('button', { name: 'Save project', exact: true });
  const media = page.getByRole('button', { name: 'Hide media pool pane' });
  const header = (await page.locator('.app-header').boundingBox())!;
  const mediaBox = (await media.boundingBox())!;
  const box = (await save.boundingBox())!;
  await expect(page.locator('.app-header button').first()).toHaveAttribute(
    'aria-controls',
    'media-drawer',
  );
  expect(mediaBox.x - header.x).toBeLessThanOrEqual(20);
  expect(mediaBox.x + mediaBox.width).toBeLessThan(box.x);
  expect(mediaBox.y).toBe(box.y + (box.height - mediaBox.height) / 2);
  expect(box.y - header.y).toBeLessThanOrEqual(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(617);

  const pointer = page.waitForEvent('download');
  await save.click();
  expect((await pointer).suggestedFilename()).toBe('developer-walkthrough.clipper.json');

  await save.focus();
  const keyboard = page.waitForEvent('download');
  await page.keyboard.press('Enter');
  expect((await keyboard).suggestedFilename()).toBe('developer-walkthrough.clipper.json');
});

test('swaps frames, trims with edge handles and scrolls to the timeline end', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const screen = page.getByTestId('screen-mask');
  const camera = page.getByTestId('camera-mask');
  const original = await screen.boundingBox();
  await expect(page.locator('.monitor-title button', { hasText: 'Composition' })).toHaveCount(0);
  const layoutPreview = page.locator('.inspector').getByRole('button', {
    name: 'Composition: swap sides',
  });
  await layoutPreview.click();
  expect((await camera.boundingBox())!.x).toBeLessThan((await screen.boundingBox())!.x);
  expect((await screen.boundingBox())!.width).toBeCloseTo(original!.width, 0);
  await layoutPreview.focus();
  await page.keyboard.press('Enter');
  expect((await screen.boundingBox())!.x).toBeLessThan((await camera.boundingBox())!.x);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect((await camera.boundingBox())!.x).toBeLessThan((await screen.boundingBox())!.x);
  const clip = page.getByTestId('track-screen').getByRole('button').first();
  const before = await clip.boundingBox();
  const handle = clip.getByRole('slider', { name: 'Trim right edge' });
  const box = await handle.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x - 45, box!.y + box!.height / 2, { steps: 10 });
  await page.mouse.up();
  expect((await clip.boundingBox())!.width).toBeLessThan(before!.width - 20);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect((await clip.boundingBox())!.width).toBeCloseTo(before!.width, 0);
  await page.getByRole('slider', { name: 'Timeline scale' }).fill('160');
  const scroll = page.getByTestId('timeline-scroll');
  expect(await scroll.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  await scroll.evaluate((el) => {
    el.scrollLeft = el.scrollWidth;
  });
  expect(await scroll.evaluate((el) => el.scrollLeft)).toBeGreaterThan(100);
  await expect(page.getByText('12.0 seconds · Stereo · Local workspace')).toBeVisible();
});

test('marks a mouse position, centers it during zoom and reopens embedded media after reload', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page.getByRole('button', { name: 'Add zoom at playhead' }).first().click();
  await page.getByRole('button', { name: 'Mark mouse position' }).click();
  await expect(page.getByText(/Recordings do not contain cursor metadata/)).toBeVisible();
  const target = page.getByRole('button', { name: 'Set mouse focus on screen' });
  await page.getByRole('combobox', { name: 'Export resolution' }).selectOption('3840');
  await expect(target).toHaveCSS('border-top-left-radius', '2.5% 3.14286%');
  const box = await target.boundingBox();
  await page.mouse.click(box!.x + box!.width * 0.25, box!.y + box!.height * 0.65);
  await expect(page.getByRole('button', { name: 'Mark mouse position' })).toBeVisible();
  await expect(page.getByLabel('Zoom focus X', { exact: true })).toHaveValue('25');
  await expect(page.getByLabel('Zoom focus Y', { exact: true })).toHaveValue('65');
  await page.getByRole('slider', { name: 'Zoom level' }).fill('2');
  await page.getByRole('slider', { name: 'Timeline playhead' }).fill('60');
  await expect(page.getByTestId('screen-content')).toHaveCSS('transform', /matrix\(2, 0, 0, 2,/);
  // The pan, not only the scale: the marked 25%, 65% point is held at the mask centre.
  const held = async () => {
    const mask = (await page.getByTestId('screen-mask').boundingBox())!;
    const content = (await page.getByTestId('screen-content').boundingBox())!;
    return {
      scale: content.width / mask.width,
      focusX: (content.x + content.width * 0.25 - mask.x) / mask.width,
      focusY: (content.y + content.height * 0.65 - mask.y) / mask.height,
    };
  };
  const before = await held();
  expect(before.scale).toBeCloseTo(2, 2);
  expect(before.focusX).toBeCloseTo(0.5, 2);
  expect(before.focusY).toBeCloseTo(0.5, 2);
  await page.getByRole('combobox', { name: 'Export resolution' }).selectOption('1920');
  expect(await held()).toEqual(before);
  await page.getByRole('button', { name: 'Composition: swap sides' }).click();
  const swapped = await held();
  expect(swapped.focusX).toBeCloseTo(0.5, 2);
  expect(swapped.focusY).toBeCloseTo(0.5, 2);
  await page.getByRole('button', { name: 'Mute Voiceover', exact: true }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const download = await downloaded;
  const path = (await download.path())!;
  const json = JSON.parse(await readFile(path, 'utf8'));
  expect(json.version).toBe(2);
  expect(json.media).toHaveLength(4);
  expect(json.media.every((asset: { data: string }) => asset.data.startsWith('data:'))).toBe(true);
  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page.getByLabel('Open local project').setInputFiles(path);
  await expect(page.locator('.app-footer [role="status"]')).toContainText('Project reopened', {
    timeout: 30000,
  });
  await page.getByRole('button', { name: 'Select zoom' }).click();
  await expect(page.getByLabel('Zoom focus X', { exact: true })).toHaveValue('25');
  await expect(page.getByRole('button', { name: 'Unmute Voiceover', exact: true })).toBeVisible();
  expect((await page.getByTestId('camera-mask').boundingBox())!.x).toBeLessThan(
    (await page.getByTestId('screen-mask').boundingBox())!.x,
  );
  await page.getByRole('button', { name: 'Play composition', exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator('[data-testid="camera-mask"] video:visible')
        .evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeGreaterThan(0.1);
});

test('a trim grip commits only real trims, on the clip as it is at release', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  const clips = page.getByTestId('track-screen').getByRole('button');
  const grip = clips.first().getByRole('slider', { name: 'Trim right edge' });
  const center = async () => {
    const box = (await grip.boundingBox())!;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  // A click without a drag, and an arrow key in the direction a grip cannot move, edit nothing.
  let at = await center();
  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  await page.mouse.up();
  await grip.focus();
  await page.keyboard.press('ArrowRight');
  await expect(undo).toBeDisabled();
  // Split under a held grip: releasing must trim the shortened clip, not restore the old one.
  await page.getByRole('slider', { name: 'Timeline playhead' }).fill('45');
  await clips.first().click();
  at = await center();
  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  await page.mouse.move(at.x - 20, at.y, { steps: 5 });
  await page.keyboard.press('s');
  await expect(clips).toHaveCount(3);
  await page.mouse.up();
  const first = (await clips.nth(0).boundingBox())!;
  const second = (await clips.nth(1).boundingBox())!;
  expect(first.x + first.width).toBeLessThanOrEqual(second.x + 0.5);
});

test('ends mouse marking when its zoom is removed, and does not arm the next zoom', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page.getByRole('button', { name: 'Add zoom at playhead' }).first().click();
  await page.getByRole('button', { name: 'Mark mouse position' }).click();
  await expect(page.getByRole('button', { name: 'Set mouse focus on screen' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove zoom' }).click();
  await expect(page.getByText(/Recordings do not contain cursor metadata/)).toHaveCount(0);
  // Shortcuts were dead while marking stayed armed with nothing left to cancel it.
  await page.keyboard.press('l');
  await expect(page.getByTestId('transport-state')).not.toHaveText('Paused');
  await page.keyboard.press('k');
  await page.getByRole('button', { name: 'Add zoom at playhead' }).first().click();
  await expect(page.getByRole('button', { name: 'Mark mouse position' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Set mouse focus on screen' })).toHaveCount(0);
});

test('keeps unsaved edits through a tab close and an opened project', async ({ page }) => {
  // What the browser asks the page when the tab closes or reloads: true means "warn the user".
  const warnsOnUnload = () =>
    page.evaluate(() => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    });
  const radius = page.getByRole('slider', { name: 'Corner radius' });
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  expect(await warnsOnUnload()).toBe(false);

  await radius.fill('33');
  expect(await warnsOnUnload()).toBe(true);
  await expect(page.getByTestId('screen-mask')).toHaveCSS('border-radius', '49.5px');

  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const saved = (await (await downloaded).path())!;
  await expect(page.locator('.app-footer [role="status"]')).toContainText('Portable project saved');
  expect(await warnsOnUnload()).toBe(false);

  await radius.fill('12');
  expect(await warnsOnUnload()).toBe(true);
  const questions: string[] = [];
  page.once('dialog', (dialog) => {
    questions.push(dialog.message());
    void dialog.dismiss();
  });
  await page.getByLabel('Open local project').setInputFiles(saved);
  await expect.poll(() => questions).toEqual([expect.stringContaining('unsaved')]);
  await expect(page.getByTestId('screen-mask')).toHaveCSS('border-radius', '18px');

  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByLabel('Open local project').setInputFiles(saved);
  await expect(page.locator('.app-footer [role="status"]')).toContainText('Project reopened', {
    timeout: 30000,
  });
  await expect(page.getByTestId('screen-mask')).toHaveCSS('border-radius', '49.5px');
  expect(await warnsOnUnload()).toBe(false);
});

test('rejects a malformed project without replacing the current edit', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page.getByRole('slider', { name: 'Corner radius' }).fill('33');
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByLabel('Open local project').setInputFiles({
    name: 'invalid.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":999}'),
  });
  await expect(page.locator('.app-footer [role="status"]')).toContainText('Could not open project');
  for (const [width, height] of [
    [1440, 1000],
    [1440, 700],
    [960, 1000],
    [320, 700],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator('.app-footer [role="status"]')).toBeInViewport({ ratio: 1 });
  }
  await expect(page.getByTestId('screen-mask')).toHaveCSS('border-radius', '49.5px');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready');
  await page.getByRole('button', { name: 'Play composition', exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator('[data-testid="camera-mask"] video:visible')
        .evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeGreaterThan(0.1);
});

for (const { width, format } of [1920, 3840].flatMap((width) =>
  ['mp4', 'mov', 'webm'].map((format) => ({ width, format })),
)) {
  test(`exports a spliced ${width}px ${format} project through the actual editor controls`, async ({
    page,
  }, info) => {
    test.setTimeout(180000);
    const writes: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') writes.push(request.url());
    });
    await page.goto('/');
    await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
    const saved = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save project', exact: true }).click();
    const project = JSON.parse(await readFile((await (await saved).path())!, 'utf8'));
    project.clips = project.clips.map((clip: { id: string; start: number; duration: number }) => ({
      ...clip,
      start: clip.id === 's2' ? 15 : 0,
      duration: clip.id.startsWith('s') ? 15 : 30,
    }));
    project.zooms = [{ id: 'zoom', start: 0, duration: 30, scale: 2, x: 25, y: 65 }];
    project.layout.swapped = true;
    await page.getByLabel('Open local project').setInputFiles({
      name: 'one-second-splice.clipper.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(project)),
    });
    await expect(page.locator('.app-footer [role="status"]')).toContainText('Project reopened');
    await page.getByRole('combobox', { name: 'Export resolution' }).selectOption(String(width));
    const rendered = page.waitForEvent('download', { timeout: 150000 });
    await page.getByRole('button', { name: 'Export video', exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Format', exact: true })).toHaveValue('mp4');
    await page.getByRole('combobox', { name: 'Format', exact: true }).selectOption(format);
    const filename = `developer-walkthrough-${width === 1920 ? '1080p' : '4k'}.${format}`;
    const displayed = await page
      .getByRole('dialog', { name: 'Export video' })
      .locator('strong')
      .innerText();
    expect(displayed).toBe(filename);
    await page.getByRole('button', { name: 'Render video', exact: true }).click();
    const download = await rendered;
    expect(download.suggestedFilename()).toBe(displayed);
    const file = info.outputPath(download.suggestedFilename());
    await download.saveAs(file);
    await expect(page.locator('.app-footer [role="status"]')).toContainText(
      `Video exported at ${width}`,
    );
    const probe = JSON.parse(
      execFileSync(
        'ffprobe',
        ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', file],
        { encoding: 'utf8' },
      ),
    );
    const video = probe.streams.find(
      (stream: { codec_type: string }) => stream.codec_type === 'video',
    );
    expect(video.width).toBe(width);
    expect(video.height).toBe((width * 9) / 16);
    expect(video.codec_name).toBe(format === 'webm' ? 'vp9' : 'h264');
    if (format === 'webm') expect(probe.format.format_name).toBe('matroska,webm');
    else expect(probe.format.tags.major_brand).toBe(format === 'mov' ? 'qt  ' : 'isom');
    expect(
      probe.streams.find((stream: { codec_type: string }) => stream.codec_type === 'audio')
        .codec_name,
    ).toBe(format === 'mp4' ? 'aac' : format === 'mov' ? 'pcm_s16le' : 'opus');
    expect(Number(video.nb_read_frames)).toBe(30);
    expect(Number(probe.format.duration)).toBeCloseTo(1, 1);
    expect(
      probe.streams.some((stream: { codec_type: string }) => stream.codec_type === 'audio'),
    ).toBe(true);
    expect(writes).toEqual([]);
  });
}

// The saved project's media names and the media ids its clips use.
async function savedMedia(file: string) {
  const project = JSON.parse(await readFile(file, 'utf8')) as {
    clips: { assetId: string }[];
    media: { id: string; name: string }[];
  };
  const used = new Set(project.clips.map((clip) => clip.assetId));
  return {
    names: project.media.map((media) => media.name),
    used: project.media.filter((media) => used.has(media.id)).map((media) => media.name),
  };
}

test('saves around media that changed on disk, and a re-import repairs media in use', async ({
  page,
}) => {
  const status = page.locator('.app-footer [role="status"]');
  const save = page.getByRole('button', { name: 'Save project', exact: true });
  const importMedia = page.getByLabel('Import local media');
  let downloads = 0;
  page.on('download', () => downloads++);
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });

  const dir = await mkdtemp(path.join(os.tmpdir(), 'clipper-media-'));
  const take = path.join(dir, 'take.mp4');
  const spare = path.join(dir, 'spare.mp4');
  await copyFile('public/media/landscape.mp4', take);
  await copyFile('public/media/portrait.mp4', spare);
  // spare.mp4 first, so a repair that ignored the name would pick it.
  await importMedia.setInputFiles([spare, take]);
  await expect(page.getByTestId('media-status')).toHaveText('6 assets ready', { timeout: 30000 });
  await page.getByRole('button', { name: 'Select take.mp4' }).click();
  await page.getByRole('button', { name: 'Insert source at playhead' }).click();
  await expect(page.getByTestId('track-screen').getByRole('button')).toHaveCount(3);

  // Chromium refuses to read a picked file once its modification time differs.
  const later = new Date(Date.now() + 60_000);
  await utimes(take, later, later);
  await utimes(spare, later, later);

  await save.click();
  await expect(status).toContainText('Could not read local media take.mp4. Import it again');
  await page.getByRole('button', { name: 'Export video', exact: true }).click();
  await page.getByRole('button', { name: 'Render video', exact: true }).click();
  await expect(status).toContainText(
    'Export failed. Video export failed: Could not read local media take.mp4. Import it again',
  );
  expect(downloads).toBe(0);

  // A same-named file that cannot stand in for the old one is refused, not swapped in: this one
  // has no picture, and the clip cut from take.mp4 sits on the screen track.
  await copyFile('public/media/voice.wav', take);
  await importMedia.setInputFiles(take);
  await expect(status).toContainText('Could not import take.mp4. Clip');
  await expect(page.getByTestId('media-status')).toHaveText('6 assets ready');

  // The same name repairs the broken source in place: its clip keeps working, nothing is added.
  await copyFile('public/media/landscape.mp4', take);
  await importMedia.setInputFiles(take);
  await expect(status).toContainText('Relinked take.mp4');
  await expect(page.getByTestId('media-status')).toHaveText('6 assets ready');
  await expect(page.getByTestId('track-screen').getByRole('button')).toHaveCount(3);

  const downloaded = page.waitForEvent('download');
  await save.click();
  const saved = await savedMedia((await (await downloaded).path())!);
  // spare.mp4 is unreadable too, but no clip uses it, so it is left out and named.
  await expect(status).toContainText('Left out unused media: spare.mp4');
  expect(saved.names).toHaveLength(5);
  expect(saved.names).not.toContain('spare.mp4');
  expect(saved.used).toContain('take.mp4');

  // take.mp4 reads fine now, so the same name again is an ordinary import, not a repair.
  await importMedia.setInputFiles(take);
  await expect(page.getByTestId('media-status')).toHaveText('7 assets ready', { timeout: 30000 });
  await expect(status).toContainText('Imported 1 local file');
});

test('never reads media a project file cannot hold', async ({ page }) => {
  const status = page.locator('.app-footer [role="status"]');
  const save = page.getByRole('button', { name: 'Save project', exact: true });
  let downloads = 0;
  page.on('download', () => downloads++);
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });

  // A real 14 s video followed by a 400 MB `free` box, which a sparse file stores in no space:
  // 1,033,661 + 8 + 400,000,000 bytes. With the 4,083,187 bytes of demo media the timeline already
  // uses, that is 405,116,856 bytes, shown rounded up as 406 MB.
  const big = path.join(await mkdtemp(path.join(os.tmpdir(), 'clipper-media-')), 'big.mp4');
  const video = await readFile('public/media/landscape.mp4');
  const padding = 400_000_000;
  const box = Buffer.alloc(8);
  box.writeUInt32BE(padding, 0);
  box.write('free', 4, 'latin1');
  await writeFile(big, Buffer.concat([video, box]));
  await truncate(big, video.length + padding);

  await page.getByLabel('Import local media').setInputFiles(big);
  await expect(page.getByTestId('media-status')).toHaveText('5 assets ready', { timeout: 30000 });
  await expect(status).toContainText('Library media totals 406 MB and a project file holds 375 MB');

  // Unused: Save leaves it out and says so.
  const downloaded = page.waitForEvent('download');
  await save.click();
  const saved = await savedMedia((await (await downloaded).path())!);
  await expect(status).toContainText('Left out unused media: big.mp4');
  expect(saved.names).toHaveLength(4);

  // On the timeline: Save refuses at once, having read none of the 400 MB.
  await page.getByRole('button', { name: 'Select big.mp4' }).click();
  await page.getByRole('button', { name: 'Insert source at playhead' }).click();
  await expect(page.getByTestId('track-screen').getByRole('button')).toHaveCount(3);
  await save.click();
  await expect(status).toContainText(
    'Could not save project. Clips on the timeline use 406 MB of media',
    { timeout: 2000 },
  );
  await expect(status).toContainText('a project file holds 375 MB');
  expect(downloads).toBe(1);
});
