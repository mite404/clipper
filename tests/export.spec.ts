import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

test('rejects cancelled exports and stops an in-progress render', async ({ page }) => {
  test.setTimeout(60000);
  await page.route('**/export-fixture', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<html><body>Export fixture</body></html>' }),
  );
  await page.goto('/export-fixture');
  const result = await page.evaluate(async () => {
    const mediaModule = '/src/media.ts',
      exportModule = '/src/export.ts';
    const { loadDemo } = await import(mediaModule);
    const { renderVideo } = await import(exportModule);
    const assets = await loadDemo();
    const options = {
      assets,
      clips: [
        { id: 's', assetId: 'landscape', track: 'screen', start: 0, duration: 30, offset: 0 },
      ],
      zooms: [],
      layout: { radius: 16, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
      muted: [],
      width: 1920,
    };
    const names: string[] = [];
    for (const initiallyAborted of [true, false]) {
      const controller = new AbortController();
      if (initiallyAborted) controller.abort();
      try {
        await renderVideo({
          ...options,
          signal: controller.signal,
          onProgress: (value: number) => {
            if (value > 0.1) controller.abort();
          },
        });
        names.push('resolved');
      } catch (error) {
        names.push(error instanceof Error ? error.name : String(error));
      }
    }
    return names;
  });
  expect(result).toEqual(['AbortError', 'AbortError']);
});

test('omits muted voice and music from the encoded file', async ({ page }) => {
  await page.route('**/export-fixture', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<html><body>Export fixture</body></html>' }),
  );
  await page.goto('/export-fixture');
  const audioCount = await page.evaluate(async () => {
    const mediaModule = '/src/media.ts',
      exportModule = '/src/export.ts';
    const bunnyModule = '/node_modules/mediabunny/dist/bundles/mediabunny.mjs';
    const { loadDemo } = await import(mediaModule);
    const { renderVideo } = await import(exportModule);
    const { Input, BlobSource, ALL_FORMATS } = await import(bunnyModule);
    const assets = await loadDemo();
    const blob = await renderVideo({
      assets,
      clips: [
        { id: 's', assetId: 'landscape', track: 'screen', start: 0, duration: 3, offset: 0 },
        { id: 'v', assetId: 'voice', track: 'voice', start: 0, duration: 3, offset: 0 },
        { id: 'm', assetId: 'music', track: 'music', start: 0, duration: 3, offset: 0 },
      ],
      zooms: [],
      layout: { radius: 16, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
      muted: ['voice', 'music'],
      width: 1920,
      onProgress: () => {},
    });
    const input = new Input({ source: new BlobSource(blob), formats: ALL_FORMATS });
    try {
      return (await input.getAudioTracks()).length;
    } finally {
      input.dispose();
    }
  });
  expect(audioCount).toBe(0);
});

for (const width of [1920, 3840]) {
  test(`renders a local one-second ${width}px video with mixed audio`, async ({ page }, info) => {
    test.setTimeout(180000);
    await page.route('**/export-fixture', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<html><body>Export fixture</body></html>' }),
    );
    await page.goto('/export-fixture');
    const result = await page.evaluate(async (width) => {
      const seekFrame = (video: HTMLVideoElement, time: number) =>
        new Promise<void>((resolve, reject) => {
          let lastPresented = -1;
          const timeout = setTimeout(() => {
            reject(
              new Error(
                `Frame not presented: target ${time}, current ${video.currentTime}, last ${lastPresented}`,
              ),
            );
          }, 5000);
          const presented: VideoFrameRequestCallback = (_now, metadata) => {
            lastPresented = metadata.mediaTime;
            if (Math.abs(metadata.mediaTime - time) < 0.05) {
              clearTimeout(timeout);
              resolve();
            } else video.requestVideoFrameCallback(presented);
          };
          video.requestVideoFrameCallback(presented);
          video.currentTime = time;
        });
      const mediaModule = '/src/media.ts';
      const exportModule = '/src/export.ts';
      const { loadDemo } = await import(mediaModule);
      const { renderVideo } = await import(exportModule);
      const assets = await loadDemo();
      const progress: number[] = [];
      const blob = await renderVideo({
        assets,
        clips: [
          { id: 's', assetId: 'landscape', track: 'screen', start: 0, duration: 30, offset: 60 },
          { id: 'c', assetId: 'portrait', track: 'camera', start: 0, duration: 30, offset: 30 },
          { id: 'v', assetId: 'voice', track: 'voice', start: 6, duration: 24, offset: 15 },
          { id: 'm', assetId: 'music', track: 'music', start: 0, duration: 30, offset: 30 },
        ],
        zooms: [{ id: 'z', start: 0, duration: 30, scale: 1.6, x: 35, y: 60 }],
        layout: { radius: 32, screenX: 20, screenY: 70, cameraX: 80, cameraY: 25, swapped: true },
        muted: [],
        width,
        onProgress: (value: number) => progress.push(value),
      });
      const url = URL.createObjectURL(blob);
      const video = document.createElement('video');
      video.src = url;
      await new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => resolve();
        video.onerror = () => reject(new Error('Export is not playable'));
      });
      await seekFrame(video, 0.5);
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const context = canvas.getContext('2d')!;
      context.drawImage(video, 0, 0, 1280, 720);
      const pixel = (x: number, y: number) =>
        Array.from(context.getImageData(x, y, 1, 1).data).slice(0, 3);
      const reference = document.createElement('canvas');
      reference.width = 1280;
      reference.height = 720;
      const expected = reference.getContext('2d')!;
      expected.fillStyle = '#172324';
      expected.fillRect(0, 0, 1280, 720);
      for (const [id, x, w, time, px, py, scale, dx, dy] of [
        ['portrait', 10, 362, 1.5, 80, 25, 1, 0, 0],
        ['landscape', 390, 880, 2.5, 20, 70, 1.6, 24, -16],
      ] as const) {
        const source = document.createElement('video');
        source.src = assets.find((a: { id: string }) => a.id === id).url;
        await new Promise<void>((resolve) => {
          source.onloadeddata = () => resolve();
        });
        await seekFrame(source, time);
        expected.save();
        expected.beginPath();
        expected.roundRect(x, 10, w, 700, 32);
        expected.clip();
        expected.fillStyle = '#10181b';
        expected.fillRect(x, 10, w, 700);
        expected.translate(x + w / 2 + (dx * w) / 100, 360 + dy * 7);
        expected.scale(scale, scale);
        const cover = Math.max(w / source.videoWidth, 700 / source.videoHeight);
        const dw = source.videoWidth * cover,
          dh = source.videoHeight * cover;
        expected.drawImage(
          source,
          -w / 2 + ((w - dw) * px) / 100,
          -350 + ((700 - dh) * py) / 100,
          dw,
          dh,
        );
        expected.restore();
      }
      // One mean error per panel: averaged together, a wrong camera hides behind a right screen.
      const panelError = (from: number, to: number) => {
        let difference = 0,
          channels = 0;
        for (let y = 50; y < 680; y += 40)
          for (let x = from; x < to; x += 40) {
            const actual = pixel(x, y),
              wanted = expected.getImageData(x, y, 1, 1).data;
            for (let channel = 0; channel < 3; channel++) {
              difference += Math.abs(actual[channel] - wanted[channel]);
              channels++;
            }
          }
        return difference / channels;
      };
      const link = document.createElement('a');
      link.href = url;
      link.download = blob.type.includes('mp4') ? 'render.mp4' : 'render.webm';
      link.textContent = 'Download rendered file';
      document.body.append(link);
      return {
        mime: blob.type,
        size: blob.size,
        progress,
        cameraError: panelError(50, 372),
        screenError: panelError(410, 1270),
        background: pixel(0, 0),
        camera: pixel(180, 350),
        screen: pixel(800, 350),
      };
    }, width);
    expect(result.size).toBeGreaterThan(10000);
    expect(result.mime).toMatch(/^video\/(mp4|webm)/);
    expect(result.progress[0]).toBe(0);
    expect(result.progress.at(-1)).toBe(1);
    expect(
      result.progress.every((p, i) => p >= 0 && p <= 1 && (!i || p >= result.progress[i - 1])),
    ).toBe(true);
    expect(
      result.background.every((value, index) => Math.abs(value - [23, 35, 36][index]) < 10),
    ).toBe(true);
    expect(result.camera).not.toEqual(result.screen);
    // A correct render scores about 4 (camera) and 1.4 (screen) at both widths. A camera drawn with
    // the wrong crop or source offset scores 25 or more; a screen without its crop or zoom, 50.
    console.log(`panel errors ${JSON.stringify([result.cameraError, result.screenError])}`);
    expect(result.cameraError).toBeLessThan(8);
    expect(result.screenError).toBeLessThan(4);
    const downloadPromise = page.waitForEvent('download');
    await page.locator('a').click();
    const download = await downloadPromise;
    const file = info.outputPath(download.suggestedFilename());
    await download.saveAs(file);
    const probe = JSON.parse(
      execFileSync(
        'ffprobe',
        ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file],
        { encoding: 'utf8' },
      ),
    );
    const video = probe.streams.find(
      (stream: { codec_type: string }) => stream.codec_type === 'video',
    );
    expect(video.width).toBe(width);
    expect(video.height).toBe((width * 9) / 16);
    expect(Number(probe.format.duration)).toBeCloseTo(1, 1);
    expect(
      probe.streams.some((stream: { codec_type: string }) => stream.codec_type === 'audio'),
    ).toBe(true);
    const audio = execFileSync('ffmpeg', [
      '-v',
      'error',
      '-i',
      file,
      '-af',
      'pan=mono|c0=c0',
      '-f',
      'f32le',
      '-ac',
      '1',
      '-ar',
      '48000',
      '-',
    ]);
    let energy = 0;
    for (let i = 0; i + 4 <= audio.length; i += 4) energy += audio.readFloatLE(i) ** 2;
    expect(Math.sqrt(energy / (audio.length / 4))).toBeGreaterThan(0.001);
    const referenceAudio = execFileSync('ffmpeg', [
      '-v',
      'error',
      '-i',
      'public/media/voice.wav',
      '-i',
      'public/media/music.wav',
      '-filter_complex',
      '[0:a]atrim=start=0.5:end=1.3,asetpts=PTS-STARTPTS,adelay=200:all=1[v];' +
        '[1:a]atrim=start=1:end=2,asetpts=PTS-STARTPTS,volume=0.22[m];' +
        '[v][m]amix=inputs=2:normalize=0:duration=longest',
      '-f',
      'f32le',
      '-ac',
      '1',
      '-ar',
      '48000',
      '-',
    ]);
    let squaredError = 0,
      referenceEnergy = 0;
    for (let i = 0; i + 4 <= Math.min(audio.length, referenceAudio.length); i += 4) {
      const expected = referenceAudio.readFloatLE(i);
      squaredError += (audio.readFloatLE(i) - expected) ** 2;
      referenceEnergy += expected ** 2;
    }
    expect(Math.sqrt(squaredError / referenceEnergy)).toBeLessThan(0.12);
    execFileSync('ffmpeg', [
      '-v',
      'error',
      '-ss',
      '0.5',
      '-i',
      file,
      '-frames:v',
      '1',
      info.outputPath('decoded.png'),
    ]);
  });
}

test('exports the exact source frame for every frame of both video tracks', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  // Each source frame is black with one white bar that sits 10 px further right than in the frame
  // before it, so the picture itself says which source frame it is.
  const fixture = info.outputPath('frame-bars.mp4');
  execFileSync('ffmpeg', [
    '-v',
    'error',
    '-y',
    '-f',
    'lavfi',
    '-i',
    'color=c=black:s=640x360:r=30:d=2',
    '-f',
    'lavfi',
    '-i',
    'color=c=white:s=10x360:r=30:d=2',
    '-filter_complex',
    "[0:v][1:v]overlay=x='n*10':y=0:shortest=1,format=yuv420p",
    '-c:v',
    'libx264',
    fixture,
  ]);
  await page.route('**/export-fixture', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<html><body>Export fixture</body></html>' }),
  );
  await page.route('**/frame-bars', (route) => route.fulfill({ path: fixture }));
  await page.goto('/export-fixture');
  const frames = 12;
  const offsets = { screen: 14, camera: 25 };
  const bytes = await page.evaluate(
    async ({ frames, offsets }) => {
      const mediaModule = '/src/media.ts',
        exportModule = '/src/export.ts';
      const { readMedia } = await import(mediaModule);
      const { renderVideo } = await import(exportModule);
      const asset = await readMedia(await (await fetch('/frame-bars')).blob(), 'bars', 'bars');
      const blob = await renderVideo({
        assets: [asset],
        clips: (['screen', 'camera'] as const).map((track) => ({
          id: track,
          assetId: 'bars',
          track,
          start: 0,
          duration: frames,
          offset: offsets[track],
        })),
        zooms: [],
        layout: { radius: 0, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
        muted: [],
        width: 1920,
        onProgress: () => undefined,
      });
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    },
    { frames, offsets },
  );
  const rendered = info.outputPath('frame-bars-export');
  writeFileSync(rendered, Buffer.from(bytes));
  // Every frame of a file in order, as one grey row through its vertical middle.
  const middleRows = (file: string, width: number, height: number) =>
    execFileSync('ffmpeg', [
      '-v',
      'error',
      '-i',
      file,
      '-vf',
      `scale=${width}:${height},format=gray,crop=${width}:1:0:${height / 2}`,
      '-f',
      'rawvideo',
      '-',
    ]);
  // Centre of the white bar within one span of a row, in pixels of that row.
  const barCentre = (rows: Buffer, width: number, frame: number, from: number, to: number) => {
    let sum = 0,
      count = 0;
    for (let x = from; x < to; x++)
      if (rows[frame * width + x] > 128) {
        sum += x + 0.5;
        count++;
      }
    return sum / count;
  };
  // Ground truth comes from the fixture file itself, not from how ffmpeg numbered its frames.
  const source = middleRows(fixture, 640, 360);
  const exported = middleRows(rendered, 1280, 720);
  expect(exported.length).toBe(frames * 1280);
  // Both masks are 700 px tall and crop the 640x360 source about its centre, so source x = 320
  // lands on the mask centre and one source frame moves the bar 10 * 700 / 360 = 19.4 stage px.
  const masks = { screen: [10, 890], camera: [908, 1270] } as const;
  const errors = (['screen', 'camera'] as const).flatMap((track) =>
    Array.from({ length: frames }, (_, frame) => {
      const [from, to] = masks[track];
      const stage = barCentre(exported, 1280, frame, from, to);
      const shown = ((stage - (from + to) / 2) * 360) / 700 + 320; // → source px
      return shown - barCentre(source, 640, offsets[track] + frame, 0, 640);
    }),
  );
  // A quarter of the 10 px step between neighbouring source frames; a correct render is within 0.2.
  expect(
    Math.max(...errors.map(Math.abs)),
    `source px off per frame, screen then camera: ${errors.map((error) => error.toFixed(1)).join(' ')}`,
  ).toBeLessThan(2.5);
});

test('mixes long compressed audio in time proportional to its length', async ({ page }, info) => {
  test.setTimeout(120000);
  const file = info.outputPath('long.webm');
  execFileSync('ffmpeg', [
    '-v',
    'error',
    '-y',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=330:sample_rate=48000:duration=42',
    '-ac',
    '2',
    '-c:a',
    'libopus',
    file,
  ]);
  await page.route('**/export-fixture', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<html><body>Export fixture</body></html>' }),
  );
  await page.route('**/long-audio', (route) => route.fulfill({ path: file }));
  await page.goto('/export-fixture');
  const mixMs = await page.evaluate(async () => {
    const mediaModule = '/src/media.ts',
      exportModule = '/src/export.ts';
    const { readMedia } = await import(mediaModule);
    const { renderVideo } = await import(exportModule);
    const asset = await readMedia(await (await fetch('/long-audio')).blob(), 'long', 'long');
    const controller = new AbortController();
    const started = performance.now();
    let mixed = 0;
    // The mix finishes before the first video frame; progress 0.1 marks that point.
    await renderVideo({
      assets: [asset],
      clips: [{ id: 'v', assetId: 'long', track: 'voice', start: 0, duration: 1200, offset: 30 }],
      zooms: [],
      layout: { radius: 16, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
      muted: [],
      width: 1920,
      signal: controller.signal,
      onProgress: (value: number) => {
        if (value < 0.1 || mixed) return;
        mixed = performance.now() - started;
        controller.abort();
      },
    }).catch(() => undefined);
    return mixed;
  });
  expect(mixMs).toBeGreaterThan(0);
  // One audio node per decoded packet took 13 s for these 40 s; one per clip takes under a second.
  expect(mixMs).toBeLessThan(5000);
});
