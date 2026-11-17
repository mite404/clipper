import { test, expect, type Locator } from '@playwright/test';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

type MediaWindow = Window & { liveMediaUrls: Set<string> };

// An inline duration error must sit below its field, not float over neighbouring headings.
async function expectBelow(error: Locator, field: Locator) {
  const [e, f] = [(await error.boundingBox())!, (await field.boundingBox())!];
  expect(e.y).toBeGreaterThanOrEqual(f.y + f.height);
}

test('imports still images with editable clip duration, alpha and portable reopen', async ({
  page,
}) => {
  const uploads: string[] = [];
  page.on('request', (r) => {
    if (r.method() !== 'GET') uploads.push(r.url());
  });
  await page.addInitScript(() => {
    const live = new Set<string>();
    const create = URL.createObjectURL.bind(URL),
      revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      const url = create(blob);
      live.add(url);
      return url;
    };
    URL.revokeObjectURL = (url) => {
      live.delete(url);
      revoke(url);
    };
    Object.assign(window, { liveMediaUrls: live });
  });
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const pictures = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#0000ff80';
    ctx.fillRect(200, 0, 100, 200);
    return [canvas.toDataURL('image/png'), canvas.toDataURL('image/jpeg')];
  });
  const png = Buffer.from(pictures[0].split(',')[1], 'base64');
  await page.getByLabel('Import local media').setInputFiles([
    { name: 'overlay.PNG', mimeType: '', buffer: png },
    { name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('invalid') },
    {
      name: 'portrait.JPG',
      mimeType: '',
      buffer: Buffer.from(pictures[1].split(',')[1], 'base64'),
    },
  ]);
  await expect(page.getByTestId('media-status')).toHaveText('6 assets ready', { timeout: 30000 });
  await expect(page.locator('.app-footer [role="status"]')).toContainText('broken.png');
  await page.getByRole('button', { name: 'Select overlay.PNG', exact: true }).click();
  await expect(page.locator('.source-preview img')).toHaveJSProperty('naturalWidth', 400);
  await expect(page.getByLabel('Still duration seconds', { exact: true })).toHaveValue('5');
  await expect(page.getByLabel('Insert onto track').locator('option')).toHaveCount(2);
  const stillDuration = page.getByLabel('Still duration seconds', { exact: true });
  await stillDuration.fill('0');
  await stillDuration.press('Enter');
  await expect(page.locator('.source-panel .source-error')).toContainText('one frame');
  await expectBelow(page.locator('.source-panel .source-error'), stillDuration);
  await expect(stillDuration).toHaveValue('5');
  await stillDuration.fill('0.033333');
  await stillDuration.press('Enter');
  await expect(stillDuration).toHaveValue('0.033');
  await stillDuration.fill('86400.1');
  await stillDuration.press('Enter');
  await expect(stillDuration).toHaveValue('0.033');
  await stillDuration.fill('86400');
  await stillDuration.press('Enter');
  await page.getByRole('button', { name: 'Insert source at playhead' }).click();
  await expect(page.getByTestId('track-screen').getByRole('button')).toHaveCount(2);
  await expect(page.locator('.app-footer [role="status"]')).toContainText('24');
  await stillDuration.fill('5');
  await stillDuration.press('Enter');
  await page.getByRole('button', { name: 'Insert source at playhead' }).click();
  const screen = page.getByTestId('track-screen');
  await expect(screen.getByRole('button')).toHaveCount(3);
  await expect(page.getByLabel('Selected still duration seconds')).toHaveValue('5');
  await page.getByLabel('Selected still duration seconds').fill('6');
  await page.getByLabel('Selected still duration seconds').press('Enter');
  await expect(
    page.getByRole('region', { name: 'Still image clip' }).getByRole('status'),
  ).toContainText('overlap');
  await expectBelow(
    page.getByRole('region', { name: 'Still image clip' }).getByRole('status'),
    page.getByLabel('Selected still duration seconds'),
  );
  await expect(page.getByLabel('Selected still duration seconds')).toHaveValue('5');
  await page.getByLabel('Selected still duration seconds').fill('2');
  await page.getByLabel('Selected still duration seconds').press('Enter');
  await expect(page.getByLabel('Selected still duration seconds')).toHaveValue('2');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByLabel('Selected still duration seconds')).toHaveValue('5');
  const originalClips = await page
    .locator('.timeline-clip')
    .evaluateAll((clips) => clips.map((c) => c.getAttribute('style')));
  await page.getByLabel('Selected still duration seconds').fill('0');
  await page.getByLabel('Selected still duration seconds').press('Enter');
  await expect(page.getByLabel('Selected still duration seconds')).toHaveValue('5');
  expect(
    await page
      .locator('.timeline-clip')
      .evaluateAll((clips) => clips.map((c) => c.getAttribute('style'))),
  ).toEqual(originalClips);
  await page.getByLabel('Selected still duration seconds').fill('0.033333');
  await page.getByLabel('Selected still duration seconds').press('Enter');
  await expect(page.getByLabel('Selected still duration seconds')).toHaveValue('0.033');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.getByRole('slider', { name: 'Timeline playhead' }).fill('45');
  await page.getByRole('button', { name: 'Split selected clip', exact: true }).click();
  await expect(screen.getByRole('button')).toHaveCount(4);
  await page.getByRole('button', { name: 'Delete selected clip or zoom', exact: true }).click();
  await expect(screen.getByRole('button')).toHaveCount(3);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(screen.getByRole('button')).toHaveCount(4);
  const rightStill = screen.getByRole('button', {
    name: 'overlay.PNG at 1.5 seconds',
    exact: true,
  });
  await rightStill.getByRole('slider', { name: 'Trim left edge' }).press('ArrowRight');
  await expect(rightStill.getByRole('slider', { name: 'Trim left edge' })).toHaveAttribute(
    'aria-valuenow',
    '46',
  );
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(
    page.locator('[data-testid="screen-mask"] img[src^="blob:"]').first(),
  ).toHaveJSProperty('naturalWidth', 400);
  await page.getByRole('button', { name: 'Select portrait.JPG', exact: true }).click();
  await page.getByLabel('Insert onto track').selectOption('camera');
  await page.getByLabel('Still duration seconds', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Insert source at playhead' }).click();
  await expect(page.getByTestId('track-camera').getByRole('button')).toHaveCount(3);
  const saving = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const download = await saving;
  const { readFile } = await import('node:fs/promises');
  const saved = await readFile((await download.path())!, 'utf8');
  const envelope = JSON.parse(saved);
  expect(envelope.version).toBe(3);
  const embedded = envelope.media.find((m: { name: string }) => m.name === 'overlay.PNG');
  expect(Buffer.from(embedded.data.split(',')[1], 'base64')).toEqual(png);
  page.on('dialog', (d) => d.accept());
  const urls = await page.evaluate(() => (window as unknown as MediaWindow).liveMediaUrls.size);
  envelope.media.push({
    id: 'corrupt-still',
    name: 'corrupt.png',
    kind: 'image',
    data: 'data:image/png;base64,iVBORw0KGgo=',
  });
  await page.getByLabel('Open local project').setInputFiles({
    name: 'corrupt.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(envelope)),
  });
  await expect(page.locator('.app-footer [role="status"]')).toContainText('corrupt');
  await expect(page.getByTestId('media-status')).toHaveText('6 assets ready');
  await expect
    .poll(() => page.evaluate(() => (window as unknown as MediaWindow).liveMediaUrls.size))
    .toBe(urls);
  await expect(screen.getByRole('button')).toHaveCount(4);
  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page.getByLabel('Open local project').setInputFiles({
    name: 'stills.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(saved),
  });
  await expect(page.locator('.app-footer [role="status"]')).toContainText('Project reopened');
  await expect(screen.getByRole('button')).toHaveCount(4);
  await page.getByRole('slider', { name: 'Timeline playhead' }).fill('46');
  await expect(
    page.locator('[data-testid="screen-mask"] img[src^="blob:"]').first(),
  ).toHaveJSProperty('naturalWidth', 400);
  expect(uploads).toEqual([]);
});

test('imports qualified H264 and AAC MP4/MOV, rejects ProRes and reopens exported sources', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const files: string[] = [];
  for (const [extension, audio] of [
    ['mp4', false],
    ['mp4', true],
    ['mov', false],
    ['mov', true],
  ] as const) {
    const file = info.outputPath(`h264${audio ? '-aac' : ''}.${extension}`);
    execFileSync('ffmpeg', [
      '-v',
      'error',
      '-y',
      '-f',
      'lavfi',
      '-i',
      'testsrc2=size=240x120:rate=30:duration=1',
      ...(audio ? ['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=1'] : []),
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      ...(audio ? ['-c:a', 'aac', '-ac', '2'] : ['-an']),
      file,
    ]);
    const probe = JSON.parse(
      execFileSync(
        'ffprobe',
        ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file],
        { encoding: 'utf8' },
      ),
    );
    expect(probe.streams[0].codec_name).toBe('h264');
    expect(probe.streams[0].pix_fmt).toBe('yuv420p');
    expect(probe.format.tags.major_brand).toBe(extension === 'mov' ? 'qt  ' : 'isom');
    expect(probe.streams.some((s: { codec_name: string }) => s.codec_name === 'aac')).toBe(audio);
    files.push(file);
  }
  const unsupported = info.outputPath('unsupported-prores.mov');
  execFileSync('ffmpeg', [
    '-v',
    'error',
    '-y',
    '-f',
    'lavfi',
    '-i',
    'testsrc2=size=240x120:rate=30:duration=1',
    '-c:v',
    'prores_ks',
    '-pix_fmt',
    'yuv422p10le',
    '-threads',
    '1',
    unsupported,
  ]);
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page.getByLabel('Open local project').setInputFiles({
    name: 'empty.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        version: 2,
        fps: 30,
        media: [],
        clips: [],
        zooms: [],
        muted: [],
        layout: { radius: 22, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
      }),
    ),
  });
  await expect(page.getByTestId('media-status')).toHaveText('0 assets ready');
  await page.getByLabel('Import local media').setInputFiles([...files, unsupported]);
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await expect(page.locator('.app-footer [role="status"]')).toContainText(
    'video codec is not supported',
  );
  for (const file of files) {
    await page.getByRole('button', { name: `Select ${path.basename(file)}`, exact: true }).click();
    const video = page.locator('.source-preview video');
    await page.getByRole('button', { name: 'Play source', exact: true }).click();
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
      .toBeGreaterThan(0.15);
    await page.getByRole('button', { name: 'Pause source', exact: true }).click();
    await page.getByRole('button', { name: 'Insert source at playhead', exact: true }).click();
  }
  await page.getByLabel('Insert onto track').selectOption('voice');
  await page.getByRole('button', { name: 'Insert source at playhead', exact: true }).click();
  const saving = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const saved = readFileSync((await (await saving).path())!, 'utf8');
  expect(JSON.parse(saved).version).toBe(2);
  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page.getByLabel('Open local project').setInputFiles({
    name: 'qualified.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(saved),
  });
  await expect(page.locator('.app-footer [role="status"]')).toContainText('Project reopened');
  await expect(page.getByTestId('track-screen').getByRole('button')).toHaveCount(4);
  await expect(page.getByTestId('track-voice').getByRole('button')).toHaveCount(1);
  const rendered = page.waitForEvent('download', { timeout: 90000 });
  await page.getByRole('button', { name: 'Export video', exact: true }).click();
  await page.getByRole('button', { name: 'Render video', exact: true }).click();
  const output = info.outputPath('qualified.mp4');
  await (await rendered).saveAs(output);
  const probe = JSON.parse(
    execFileSync(
      'ffprobe',
      ['-v', 'error', '-count_frames', '-show_streams', '-of', 'json', output],
      { encoding: 'utf8' },
    ),
  );
  expect(probe.streams[0].codec_name).toBe('h264');
  expect(Number(probe.streams[0].nb_read_frames)).toBe(120);
  expect(probe.streams[1].codec_name).toBe('aac');
  const samples = execFileSync('ffmpeg', [
    '-v',
    'error',
    '-i',
    output,
    '-map',
    '0:a',
    '-t',
    '0.8',
    '-f',
    'f32le',
    '-',
  ]);
  const audio = new Float32Array(samples.buffer, samples.byteOffset, samples.byteLength / 4);
  expect(Math.max(...audio.subarray(0, 20000).map(Math.abs))).toBeGreaterThan(0.02);
  execFileSync('ffmpeg', ['-v', 'error', '-i', output, '-f', 'null', '-']);
});

for (const kind of ['video', 'audio']) {
  test(`busy save, import and open pause source ${kind} without resuming`, async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
    if (kind === 'audio')
      await page.getByRole('button', { name: 'Select Voiceover', exact: true }).click();
    const source = page.locator(`.source-preview ${kind}`);
    for (const action of ['save', 'import', 'open']) {
      if (kind === 'video')
        await page.getByRole('button', { name: 'Play source', exact: true }).click();
      else {
        // The native control is believed to ignore a click until its media has loaded metadata, so
        // wait for the loaded control, then click it as a user would.
        await expect
          .poll(() => source.evaluate((media: HTMLMediaElement) => media.readyState))
          .toBeGreaterThanOrEqual(1);
        const box = (await source.boundingBox())!;
        await source.click({ position: { x: 18, y: box.height / 2 } });
      }
      await expect
        .poll(() => source.evaluate((media: HTMLMediaElement) => media.paused))
        .toBe(false);
      if (action === 'save') {
        const download = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Save project', exact: true }).click();
        await download;
      } else if (action === 'import') {
        await page.getByLabel('Import local media').setInputFiles({
          name: 'broken.mp4',
          mimeType: 'video/mp4',
          buffer: Buffer.from('not media'),
        });
        await expect(
          page.getByRole('status').filter({ hasText: 'Could not import' }),
        ).toBeVisible();
      } else {
        await page.getByLabel('Open local project').setInputFiles({
          name: 'broken.json',
          mimeType: 'application/json',
          buffer: Buffer.from('not JSON'),
        });
        await expect(page.getByRole('status').filter({ hasText: 'Could not open' })).toBeVisible();
      }
      await expect(source).toHaveJSProperty('paused', true);
      const held = await source.evaluate((media: HTMLMediaElement) => media.currentTime);
      await expect(page.getByRole('button', { name: 'Save project', exact: true })).toBeEnabled();
      await expect(source).toHaveJSProperty('currentTime', held);
      await expect(page.locator('.source-error')).toHaveCount(0);
    }
  });
}

test('reports a genuine source decode failure and clears it on a new playback attempt', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const source = page.locator('.source-preview video');
  const original = await source.evaluate((video: HTMLVideoElement) => {
    const url = video.src;
    video.src = 'data:video/mp4;base64,AAAA';
    video.load();
    return url;
  });
  await expect.poll(() => source.evaluate((video: HTMLVideoElement) => video.error?.code)).toBe(4);
  await page.getByRole('button', { name: 'Play source', exact: true }).click();
  await expect(page.locator('.source-error')).toHaveText(
    'Source playback failed. Try a supported codec.',
  );
  await source.evaluate((video: HTMLVideoElement, url) => {
    video.src = url;
    video.load();
  }, original);
  await expect.poll(() => source.evaluate((video: HTMLVideoElement) => video.readyState)).toBe(4);
  await page.getByRole('button', { name: 'Play source', exact: true }).click();
  await expect
    .poll(() => source.evaluate((video: HTMLVideoElement) => video.currentTime))
    .toBeGreaterThan(0.25);
  await expect(page.locator('.source-error')).toHaveCount(0);
});

test('does not report an interrupted old source as a codec failure on the new source', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const play: HTMLMediaElement['play'] = Object.getOwnPropertyDescriptor(
      HTMLMediaElement.prototype,
      'play',
    )?.value;
    let settled = 0;
    let aborted = 0;
    HTMLMediaElement.prototype.play = function () {
      const promise = play.call(this);
      if (this.matches('.source-preview video'))
        void promise.then(
          () => {
            document.documentElement.dataset.sourceSettled = String(++settled);
          },
          (error: unknown) => {
            if (error instanceof DOMException && error.name === 'AbortError')
              document.documentElement.dataset.sourceAborts = String(++aborted);
            document.documentElement.dataset.sourceSettled = String(++settled);
          },
        );
      return promise;
    };
  });
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  const controls = [
    page.getByRole('button', { name: 'Select Flower study', exact: true }),
    page.locator('.source-controls button'),
    page.getByRole('button', { name: 'Select A conversation', exact: true }),
  ];
  const boxes = await Promise.all(controls.map((control) => control.boundingBox()));
  try {
    for (let attempt = 1; attempt <= 6; attempt++) {
      await Promise.all(
        boxes.flatMap((box) => {
          if (!box) throw new Error('Source playback or selection control is not visible');
          return [false, true].map((released) =>
            cdp.send('Input.dispatchMouseEvent', {
              type: released ? 'mouseReleased' : 'mousePressed',
              x: box.x + box.width / 2,
              y: box.y + box.height / 2,
              button: 'left',
              clickCount: 1,
            }),
          );
        }),
      );
      await expect(page.locator('html')).toHaveAttribute('data-source-settled', String(attempt));
    }
    await expect(page.locator('html')).toHaveAttribute('data-source-aborts', /^[1-9]\d*$/);
  } finally {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  }
  await expect(page.locator('.source-description')).toContainText('A conversation');
  await expect(page.locator('.source-error')).toHaveCount(0);
  await page.getByRole('button', { name: 'Play source', exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator('.source-preview video')
        .evaluate((video: HTMLVideoElement) => video.currentTime),
    )
    .toBeGreaterThan(0.25);
  await page.getByRole('button', { name: 'Pause source', exact: true }).click();
  await expect(page.locator('.source-error')).toHaveCount(0);
});

test('pauses source video and audio while export blocks the workspace without resuming', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  for (const kind of ['video', 'audio']) {
    if (kind === 'audio')
      await page.getByRole('button', { name: 'Select Voiceover', exact: true }).click();
    await page.getByLabel('Source in seconds').fill('1');
    await page.getByLabel('Source out seconds').fill('3');
    const target = kind === 'video' ? 'camera' : 'music';
    await page.getByLabel('Insert onto track').selectOption(target);
    const source = page.locator(`.source-preview ${kind}`);
    if (kind === 'video')
      await page.getByRole('button', { name: 'Play source', exact: true }).click();
    else {
      const box = await source.boundingBox();
      if (!box) throw new Error('Native source audio controls are not visible');
      await page.mouse.click(box.x + 18, box.y + box.height / 2);
    }
    await expect
      .poll(() =>
        source.evaluate((media: HTMLMediaElement) => !media.paused && media.currentTime > 0.2),
      )
      .toBe(true);
    const before = await source.evaluate((media: HTMLMediaElement) => media.currentTime);
    await page.getByRole('button', { name: 'Export video', exact: true }).click();
    await page.getByRole('button', { name: 'Render video', exact: true }).click();
    await expect(page.getByRole('progressbar', { name: 'Video export progress' })).toBeVisible();
    await expect.poll(() => source.evaluate((media: HTMLMediaElement) => media.paused)).toBe(true);
    const held = await source.evaluate((media: HTMLMediaElement) => media.currentTime);
    expect(held).toBeGreaterThanOrEqual(before);
    await page.getByRole('button', { name: 'Cancel export', exact: true }).click();
    await expect(page.getByRole('progressbar', { name: 'Video export progress' })).toHaveCount(0);
    await expect(page.getByLabel('Source in seconds')).toHaveValue('1');
    await expect(page.getByLabel('Source out seconds')).toHaveValue('3');
    await expect(page.getByLabel('Insert onto track')).toHaveValue(target);
    await expect(source).toHaveJSProperty('paused', true);
    await expect(source).toHaveJSProperty('currentTime', held);
    await expect(page.locator('.source-error')).toHaveCount(0);
  }
});

test('splice, scrub, play, rewind and animate a real media composition', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
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
  await expect(page.getByTestId('screen-mask')).toHaveCSS('border-radius', '33px');
  await expect(page.getByTestId('camera-mask')).toHaveCSS('border-radius', '33px');
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
  await page.keyboard.press('Alt+KeyK');
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
  const leaveControls = () => page.locator('.app-header').click({ position: { x: 4, y: 4 } });

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
  await radius.scrollIntoViewIfNeeded();
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
  await expect(mask).toHaveCSS('border-radius', '33px');
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

test('clamps the rewind clock when undo shortens the timeline', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  await page.getByRole('button', { name: 'Insert source at playhead' }).click();
  await expect(playhead).toHaveAttribute('max', '779');
  await playhead.fill('719');
  await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
  await page.keyboard.press('j');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const samples: number[] = [];
    Object.assign(window, { rewindUndoPaints: samples });
    const sample = () => {
      const slider = document.querySelector<HTMLInputElement>('[aria-label="Timeline playhead"]')!;
      if (slider.max === '359') {
        const [minutes, seconds, frames] = document
          .querySelector('[data-testid="timecode"]')!
          .textContent!.split(':')
          .map(Number);
        samples.push((minutes * 60 + seconds) * 30 + frames);
      }
      if (samples.length < 20) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.keyboard.press('Control+z');
  await expect(playhead).toHaveAttribute('max', '359');
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, 'rewindUndoPaints').length))
    .toBe(20);
  const paints: number[] = await page.evaluate(() => Reflect.get(window, 'rewindUndoPaints'));
  expect(Math.max(...paints)).toBeLessThanOrEqual(359);
  expect(Math.min(...paints)).toBeGreaterThanOrEqual(0);
  await expect.poll(async () => Number(await playhead.inputValue())).toBeLessThan(350);
  await page.keyboard.press('k');
  await expect(page.getByTestId('transport-state')).toHaveText('Paused');
  const held = Number(await playhead.inputValue());
  expect(held).toBeGreaterThan(0);
  await expect
    .poll(() =>
      page
        .locator('[data-testid="camera-mask"] video:visible')
        .evaluate((video: HTMLVideoElement) => Math.round(video.currentTime * 30)),
    )
    .toBe(held);
  await page.keyboard.press('ArrowRight');
  await expect(playhead).toHaveValue(String(held + 1));
});

test('holds the last rewind seek at every speed and at the start boundary', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  const timecode = page.getByTestId('timecode');
  for (const presses of [1, 2, 3]) {
    await playhead.fill('150');
    await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
    for (let press = 0; press < presses; press++) await page.keyboard.press('j');
    await expect(page.getByTestId('transport-state')).toHaveText(
      `Rewinding · ${2 ** (presses - 1)}×`,
    );
    await expect.poll(async () => Number(await playhead.inputValue())).toBeLessThan(140);
    // Stop between readout paints, not on the paint the polling assertion just observed.
    await page.waitForTimeout(65);
    await page.evaluate(() => {
      const samples: { shown: number; held: number }[] = [];
      Object.assign(window, { pausedPaints: samples });
      const sample = () => {
        if (document.querySelector('[data-testid="transport-state"]')?.textContent === 'Paused') {
          const slider = document.querySelector<HTMLInputElement>(
            '[aria-label="Timeline playhead"]',
          )!;
          const camera = document.querySelector<HTMLVideoElement>(
            '[data-testid="camera-mask"] video',
          )!;
          samples.push({ shown: Number(slider.value), held: Math.round(camera.currentTime * 30) });
        }
        if (samples.length < 3) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.keyboard.press('k');
    await expect(page.getByTestId('transport-state')).toHaveText('Paused');
    await expect
      .poll(() => page.evaluate(() => Reflect.get(window, 'pausedPaints').length))
      .toBe(3);
    const paints: { shown: number; held: number }[] = await page.evaluate(() =>
      Reflect.get(window, 'pausedPaints'),
    );
    for (const paint of paints) {
      expect(paint.held).toBeGreaterThan(0);
      expect(paint.shown).toBe(paint.held);
    }
    const held = Number(await playhead.inputValue());
    expect(held).toBeGreaterThan(0);
    // The camera has no splice, so its source time independently identifies the held frame.
    await expect
      .poll(() =>
        page
          .locator('[data-testid="camera-mask"] video:visible')
          .evaluate((video: HTMLVideoElement) => Math.round(video.currentTime * 30)),
      )
      .toBe(held);
    await page.keyboard.press('ArrowRight');
    await expect(playhead).toHaveValue(String(held + 1));
    await page.getByRole('button', { name: 'Previous frame', exact: true }).click();
    await expect(playhead).toHaveValue(String(held));
  }
  await playhead.fill('5');
  await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
  await page.keyboard.press('j');
  await expect(page.getByTestId('transport-state')).toHaveText('Paused');
  await expect(timecode).toHaveText('00:00:00');
  await page.keyboard.press('ArrowRight');
  await expect(timecode).toHaveText('00:00:01');
});

test('reports export progress, cancels cleanly and downloads on retry', async ({ page }) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  const writes: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.method() !== 'GET') writes.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const progress = page.getByRole('progressbar', { name: 'Video export progress' });
  const exportButton = page.getByRole('button', { name: 'Export video', exact: true });
  const status = page.locator('.app-footer [role="status"]');
  let downloads = 0;
  page.on('download', () => downloads++);
  await exportButton.click();
  await page.getByRole('button', { name: 'Render video', exact: true }).click();
  await expect(progress).toBeVisible();
  await expect.poll(async () => Number(await progress.getAttribute('value'))).toBeGreaterThan(0.1);
  await expect(exportButton).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel export', exact: true }).click();
  await expect(status).toContainText('Export cancelled.');
  await expect(progress).toHaveCount(0);
  await expect(exportButton).toBeEnabled();
  expect(downloads).toBe(0);
  // Observe the accessible progress values, not React state or the encoder callback.
  await page.evaluate(() => {
    const values: number[] = [];
    Object.assign(window, { exportValues: values });
    new MutationObserver(() => {
      const bar = document.querySelector<HTMLProgressElement>(
        '[aria-label="Video export progress"]',
      );
      if (bar && values.at(-1) !== bar.value) values.push(bar.value);
    }).observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['value'],
    });
  });
  const downloaded = page.waitForEvent('download', { timeout: 150000 });
  await exportButton.click();
  await page.getByRole('button', { name: 'Render video', exact: true }).click();
  const download = await downloaded;
  await expect(status).toContainText('Video exported at 1920');
  await expect(progress).toHaveCount(0);
  await expect(exportButton).toBeEnabled();
  const values = await page.evaluate(() => Reflect.get(window, 'exportValues') as number[]);
  expect(values[0]).toBe(0);
  expect(values.length).toBeLessThanOrEqual(101);
  expect(values.some((value) => value > 0.1 && value < 0.95)).toBe(true);
  expect(
    values.every(
      (value, index) => value >= 0 && value <= 1 && (!index || value > values[index - 1]),
    ),
  ).toBe(true);
  expect(downloads).toBe(1);
  expect(download.suggestedFilename()).toMatch(/1080p\.(mp4|webm)$/);
  const { stat } = await import('node:fs/promises');
  expect((await stat((await download.path())!)).size).toBeGreaterThan(100000);
  expect(errors).toEqual([]);
  expect(writes).toEqual([]);
});
