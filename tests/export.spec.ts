import { expect, test } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { choose } from './choice';

function inspectExport(file: string, width: number, format: string | undefined, audible: boolean) {
  const probe = JSON.parse(
    execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], {
      encoding: 'utf8',
    }),
  );
  const video = probe.streams.find(
    (stream: { codec_type: string }) => stream.codec_type === 'video',
  );
  expect(video.width).toBe(width);
  expect(video.height).toBe((width * 9) / 16);
  expect(Number(probe.format.duration)).toBeCloseTo(1, 1);
  if (format === 'mov' || format === 'mp4') {
    expect(video.codec_name).toBe('h264');
    expect(probe.format.tags.major_brand).toBe(format === 'mov' ? 'qt  ' : 'isom');
  }
  if (format === 'webm') {
    expect(video.codec_name).toBe('vp9');
    expect(probe.format.format_name).toBe('matroska,webm');
  }
  const audio = probe.streams.find(
    (stream: { codec_type: string }) => stream.codec_type === 'audio',
  );
  expect(Boolean(audio)).toBe(audible);
  if (audio && format) {
    expect(audio.codec_name).toBe(
      format === 'mov' ? 'pcm_s16le' : format === 'mp4' ? 'aac' : 'opus',
    );
    expect(audio.sample_rate).toBe('48000');
    expect(audio.channels).toBe(2);
  }
  execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-']);
  return probe;
}

test.beforeEach(async ({ page }, info) => {
  for (const [name, source] of [
    [
      'landscape.mp4',
      'testsrc2=size=640x360:rate=30:duration=4,setparams=colorspace=smpte170m:color_primaries=smpte170m:color_trc=smpte170m:range=tv',
    ],
    [
      'portrait.mp4',
      'testsrc2=size=180x320:rate=30:duration=4,hue=h=80,setparams=colorspace=smpte170m:color_primaries=smpte170m:color_trc=smpte170m:range=tv',
    ],
    [
      'voice.wav',
      'aevalsrc=0.2*sin(2*PI*(260*t+15*t*t))|0.13*sin(2*PI*(370*t+11*t*t)):s=44100:d=4',
    ],
    ['music.wav', 'aevalsrc=0.1*sin(2*PI*(130*t+5*t*t))|0.08*sin(2*PI*(195*t+7*t*t)):s=44100:d=4'],
  ]) {
    const file = info.outputPath(name);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', source, file]);
    await page.route(`**/media/${name}`, (route) => route.fulfill({ path: file }));
  }
});

for (const kind of ['png', 'jpeg'])
  for (const width of [1920, 3840])
    for (const format of ['mp4', 'mov', 'webm'] as const) {
      test(`exports ${kind} still images at ${width}px in ${format}`, async ({ page }, info) => {
        test.setTimeout(120000);
        await page.goto('/');
        const result = await page.evaluate(
          async ({ width, format, kind }) => {
            const mediaModule = '/src/media.ts',
              exportModule = '/src/export.ts';
            const { readMedia } = await import(mediaModule);
            const { renderVideo } = await import(exportModule);
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 200;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, 200, 200);
            ctx.fillStyle = '#0000ff80';
            ctx.fillRect(200, 0, 100, 200);
            const blob = await new Promise<Blob>((resolve) =>
              canvas.toBlob((b) => resolve(b!), `image/${kind}`),
            );
            const asset = await readMedia(blob, `split.${kind}`);
            try {
              const video = await renderVideo({
                assets: [asset],
                clips: [
                  {
                    id: 'left',
                    assetId: asset.id,
                    track: 'screen',
                    start: 0,
                    duration: 15,
                    offset: 0,
                  },
                  {
                    id: 'right',
                    assetId: asset.id,
                    track: 'screen',
                    start: 15,
                    duration: 15,
                    offset: 15,
                  },
                ],
                zooms: [],
                muted: [],
                layout: { radius: 22, screenX: 100, screenY: 50, cameraX: 50, cameraY: 50 },
                width,
                format,
                onProgress: () => {},
              });
              return {
                bytes: Array.from(new Uint8Array(await video.arrayBuffer())),
                mime: video.type,
              };
            } finally {
              URL.revokeObjectURL(asset.url);
            }
          },
          { width, format, kind },
        );
        expect(result.mime).toBe(format === 'mov' ? 'video/quicktime' : `video/${format}`);
        const file = info.outputPath(`still.${format}`);
        writeFileSync(file, Buffer.from(result.bytes));
        inspectExport(file, width, format, false);
        for (const seconds of ['0', '0.5', '0.966667']) {
          for (const [x, expected] of [
            [25, [255, 0, 0]],
            [400, kind === 'png' ? [8, 12, 141] : [0, 0, 128]],
            [850, kind === 'png' ? [16, 24, 27] : [0, 0, 0]],
          ] as const) {
            const pixels = execFileSync('ffmpeg', [
              '-v',
              'error',
              '-ss',
              seconds,
              '-i',
              file,
              '-frames:v',
              '1',
              '-vf',
              `format=rgb24,crop=1:1:${Math.round((x * width) / 1280)}:${Math.round((300 * width) / 1280)}`,
              '-f',
              'rawvideo',
              '-',
            ]);
            expect(pixels.length).toBe(3);
            expected.forEach((value, i) => expect(Math.abs(pixels[i] - value)).toBeLessThan(10));
          }
        }
      });
    }

test('releases still bitmaps after success, cancellation and partial decode failure', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const mediaModule = '/src/media.ts',
      exportModule = '/src/export.ts';
    const { readMedia } = await import(mediaModule);
    const { renderVideo, renderFrameImage } = await import(exportModule);
    const decode = window.createImageBitmap;
    let created = 0,
      closed = 0;
    window.createImageBitmap = new Proxy(decode, {
      async apply(target, receiver, args) {
        const bitmap: ImageBitmap = await Reflect.apply(target, receiver, args);
        created++;
        const close = bitmap.close.bind(bitmap);
        bitmap.close = () => {
          closed++;
          close();
        };
        return bitmap;
      },
    });
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 40;
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/png'),
    );
    const asset = await readMedia(blob, 'local.png');
    const badUrl = URL.createObjectURL(new Blob(['not pixels'], { type: 'image/png' }));
    const options = {
      assets: [asset],
      clips: [
        { id: 'a', assetId: asset.id, track: 'screen', start: 0, duration: 1, offset: 0 },
        { id: 'b', assetId: asset.id, track: 'screen', start: 1, duration: 1, offset: 999 },
      ],
      layout: { radius: 22, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
      zooms: [],
      muted: [],
      width: 1920,
      onProgress: () => {},
      format: 'mp4',
    };
    const counts = () => [created, closed];
    try {
      const imported = counts();
      await renderVideo(options);
      const success = counts();
      const signal = new AbortController();
      const cancelled = await renderVideo({
        ...options,
        signal: signal.signal,
        onProgress: (p: number) => {
          if (p >= 0.1) signal.abort();
        },
      }).then(
        () => false,
        () => true,
      );
      const cancellation = counts();
      const failure = await renderVideo({
        ...options,
        assets: [asset, { ...asset, id: 'bad', url: badUrl }],
        clips: [
          ...options.clips,
          { ...options.clips[0], id: 'bad', assetId: 'bad', track: 'camera' },
        ],
      }).then(
        () => false,
        () => true,
      );
      const failed = counts();
      await renderFrameImage({ ...options, frame: 1 });
      return {
        imported,
        success,
        cancelled,
        cancellation,
        failure,
        failed,
        frame: counts(),
        hasDuration: 'duration' in asset,
      };
    } finally {
      window.createImageBitmap = decode;
      URL.revokeObjectURL(asset.url);
      URL.revokeObjectURL(badUrl);
    }
  });
  expect(result).toEqual({
    imported: [1, 1],
    success: [2, 2],
    cancelled: true,
    cancellation: [3, 3],
    failure: true,
    failed: [4, 4],
    frame: [5, 5],
    hasDuration: false,
  });
});

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
    for (const format of [undefined, 'webm', 'mp4', 'mov']) {
      for (const initiallyAborted of [true, false]) {
        const controller = new AbortController();
        if (initiallyAborted) controller.abort();
        try {
          await renderVideo({
            ...options,
            format,
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
      const retried = await renderVideo({ ...options, format, onProgress: () => {} });
      names.push(retried.type);
    }
    return names;
  });
  expect(result).toEqual([
    'AbortError',
    'AbortError',
    'video/mp4',
    'AbortError',
    'AbortError',
    'video/webm',
    'AbortError',
    'AbortError',
    'video/mp4',
    'AbortError',
    'AbortError',
    'video/quicktime',
  ]);
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

for (const { format, width, muted } of [
  ...[undefined, 'webm', 'mov', 'mp4'].flatMap((format) =>
    [1920, 3840].map((width) => ({ format, width, muted: new Array<string>() })),
  ),
  { format: 'mov', width: 1920, muted: ['voice'] },
  { format: 'mov', width: 1920, muted: ['music'] },
]) {
  test(`renders a local one-second ${width}px ${format ?? 'automatic'} video composition muting ${muted.join(',') || 'nothing'}`, async ({
    page,
  }, info) => {
    test.setTimeout(180000);
    await page.route('**/export-fixture', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<html><body>Export fixture</body></html>',
      }),
    );
    await page.goto('/export-fixture');
    const options = { width, format, muted };
    const result = await page.evaluate(async (options) => {
      const { width, format, muted } = options;
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
      const audible = true;
      const assets = await loadDemo();
      const progress: number[] = [];
      const blob = await renderVideo({
        assets,
        clips: [
          {
            id: 's',
            assetId: 'landscape',
            track: 'screen',
            start: 0,
            duration: 30,
            offset: 60,
          },
          { id: 'c', assetId: 'portrait', track: 'camera', start: 0, duration: 30, offset: 30 },
          { id: 'v', assetId: 'voice', track: 'voice', start: 6, duration: 24, offset: 15 },
          { id: 'm', assetId: 'music', track: 'music', start: 0, duration: 30, offset: 30 },
        ],
        zooms: [{ id: 'z', start: 0, duration: 30, scale: 1.6, x: 35, y: 60 }],
        layout: {
          radius: 32,
          screenX: 20,
          screenY: 70,
          cameraX: 80,
          cameraY: 25,
          swapped: true,
        },
        muted: audible ? muted : ['voice', 'music'],
        width,
        format,
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
      link.download =
        blob.type === 'video/quicktime'
          ? 'render.mov'
          : blob.type.includes('mp4')
            ? 'render.mp4'
            : 'render.webm';
      link.textContent = 'Download rendered file';
      document.body.append(link);
      return {
        mime: blob.type,
        audible,
        size: blob.size,
        progress,
        cameraError: panelError(50, 372),
        screenError: panelError(410, 1270),
        background: pixel(0, 0),
        camera: pixel(180, 350),
        screen: pixel(800, 350),
      };
    }, options);
    expect(result.size).toBeGreaterThan(10000);
    if (format) expect(result.mime).toBe(format === 'mov' ? 'video/quicktime' : `video/${format}`);
    else expect(result.mime).toMatch(/^video\/(mp4|webm)/);
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
    const probe = inspectExport(file, width, format, result.audible);
    await info.attach('container.json', {
      body: JSON.stringify(probe, null, 2),
      contentType: 'application/json',
    });
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
    if (!result.audible) return;
    const audio = execFileSync('ffmpeg', [
      '-v',
      'error',
      '-i',
      file,
      '-f',
      'f32le',
      '-ac',
      '2',
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
      info.outputPath('voice.wav'),
      '-i',
      info.outputPath('music.wav'),
      '-filter_complex',
      `[0:a]atrim=start=0.5:end=1.3,asetpts=PTS-STARTPTS,adelay=200:all=1,volume=${muted.includes('voice') ? 0 : 1}[v];` +
        `[1:a]atrim=start=1:end=2,asetpts=PTS-STARTPTS,volume=${muted.includes('music') ? 0 : 0.22}[m];` +
        '[v][m]amix=inputs=2:normalize=0:duration=longest',
      '-f',
      'f32le',
      '-ac',
      '2',
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
    console.log(`relative audio error ${Math.sqrt(squaredError / referenceEnergy)}`);
    expect(Math.sqrt(squaredError / referenceEnergy)).toBeLessThan(0.12);
    expect(audio.length / 4).toBeGreaterThanOrEqual(96000);
    expect(audio.length / 4).toBeLessThanOrEqual(98048);
  });
}

test('rejects blocked local AAC before reading media and permits retry without substituting WebM', async ({
  page,
}) => {
  await page.route('**/export-fixture', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<html><body>Export fixture</body></html>' }),
  );
  await page.goto('/export-fixture');
  const result = await page.evaluate(async () => {
    const mediaModule = '/src/media.ts',
      exportModule = '/src/export.ts';
    const bunnyModule = '/node_modules/mediabunny/dist/bundles/mediabunny.mjs';
    const { loadDemo } = await import(mediaModule);
    const { renderVideo } = await import(exportModule);
    const { canEncodeAudio } = await import(bunnyModule);
    const supported = await canEncodeAudio('aac', {
      sampleRate: 48000,
      numberOfChannels: 2,
      bitrate: 128000,
    });
    if (supported)
      throw new Error('This worker-failure fixture requires native AAC to be unavailable.');
    const assets = await loadDemo();
    const Worker = window.Worker;
    window.Worker = new Proxy(Worker, {
      construct() {
        throw new Error('Synthetic local AAC worker blocked');
      },
    });
    const progress: number[] = [];
    let error = '';
    let mime = '';
    try {
      const blob = await renderVideo({
        assets: assets.map((asset: { url: string }) => ({
          ...asset,
          url: 'blob:unreadable-early-capability-check',
        })),
        clips: [{ id: 'v', assetId: 'voice', track: 'voice', start: 0, duration: 3, offset: 0 }],
        zooms: [],
        layout: { radius: 0, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
        muted: [],
        width: 1920,
        format: 'mp4',
        onProgress: (p: number) => progress.push(p),
      });
      mime = blob.type;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      window.Worker = Worker;
    }
    const retry = await renderVideo({
      assets,
      clips: [{ id: 'v', assetId: 'voice', track: 'voice', start: 0, duration: 3, offset: 0 }],
      zooms: [],
      layout: { radius: 0, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
      muted: [],
      width: 1920,
      format: 'mp4',
      onProgress: () => {},
    });
    return { error, mime, progress, retryMime: retry.type };
  });
  expect(result.error).toMatch(/MP4.*AAC/);
  expect(result.error).toMatch(/MOV|WebM/);
  expect(result.error).toContain('Synthetic local AAC worker blocked');
  expect(result.mime).toBe('');
  expect(result.progress).toEqual([0]);
  expect(result.retryMime).toBe('video/mp4');
});

for (const failure of ['load', 'h264', 'cancel'] as const) {
  test(`rejects MP4 ${failure} before opening source media`, async ({ page }) => {
    await page.route('**/export-fixture', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<html>Export fixture</html>' }),
    );
    if (failure === 'load') await page.route('**/*aac-encoder*', (route) => route.abort('failed'));
    await page.goto('/export-fixture');
    const result = await page.evaluate(async (failure) => {
      const controller = new AbortController();
      const NativeAudioEncoder = window.AudioEncoder;
      window.AudioEncoder = class extends NativeAudioEncoder {
        static override async isConfigSupported(config: AudioEncoderConfig) {
          return config.codec.startsWith('mp4a')
            ? { supported: false, config }
            : NativeAudioEncoder.isConfigSupported(config);
        }
      };
      if (failure === 'h264') {
        const NativeVideoEncoder = window.VideoEncoder;
        window.VideoEncoder = class extends NativeVideoEncoder {
          static override async isConfigSupported(config: VideoEncoderConfig) {
            return { supported: false, config };
          }
        };
      }
      const NativeWorker = window.Worker;
      if (failure === 'cancel')
        window.Worker = new Proxy(NativeWorker, {
          construct(target, args) {
            controller.abort();
            return Reflect.construct(target, args);
          },
        });
      const exportModule = '/src/export.ts';
      const { renderVideo } = await import(exportModule);
      const progress: number[] = [];
      try {
        await renderVideo({
          assets: [
            { id: 'voice', name: 'synthetic.wav', url: 'blob:must-not-open', hasAudio: true },
          ],
          clips: [
            { id: 'voice', assetId: 'voice', track: 'voice', start: 0, duration: 3, offset: 0 },
          ],
          layout: { radius: 0, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
          muted: [],
          zooms: [],
          width: 1920,
          format: 'mp4',
          signal: controller.signal,
          onProgress: (value: number) => progress.push(value),
        });
        return { error: '', name: '', progress };
      } catch (cause) {
        return {
          error: cause instanceof Error ? cause.message : String(cause),
          name: cause instanceof Error ? cause.name : '',
          progress,
        };
      } finally {
        window.Worker = NativeWorker;
        window.AudioEncoder = NativeAudioEncoder;
      }
    }, failure);
    expect(result.progress).toEqual([0]);
    if (failure === 'cancel') expect(result.name).toBe('AbortError');
    else
      expect(result.error).toMatch(
        failure === 'h264' ? /MP4 AVC.*another format/ : /MP4 AAC.*MOV or WebM/,
      );
    expect(result.error).not.toMatch(/must-not-open|Failed to fetch blob/);
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

// Source frame s of the ramp is pure red at 6·s, so one margin pixel names the source frame.
const RAMP = "nullsrc=s=320x180:r=30:d=3,geq=r='min(255\\,6*N)':g=0:b=0,format=yuv420p";
// A transparent still above the ramp, and the swapped pair zoomed 2x above both.
const BACKGROUND_PROBES: [number, number][] = [
  [640, 4], // top margin
  [4, 360], // left margin
  [381, 360], // centre gap of the swapped pair
  [190, 360], // camera mask
  [830, 360], // screen mask
];

for (const width of [1920, 3840])
  test(`a full-frame Background video plays under the swapped, zoomed pair at ${width}px`, async ({
    page,
  }, info) => {
    test.setTimeout(180000);
    const ramp = info.outputPath('ramp.mp4');
    execFileSync('ffmpeg', [
      '-v',
      'error',
      '-y',
      '-f',
      'lavfi',
      '-i',
      RAMP,
      '-c:v',
      'libx264',
      ramp,
    ]);
    await page.route('**/media/ramp.mp4', (route) => route.fulfill({ path: ramp }));
    await page.goto('/');
    const frames = [10, 20, 40, 50];
    const result = await page.evaluate(
      async ({ width, frames, points }) => {
        const mediaModule = '/src/media.ts',
          exportModule = '/src/export.ts',
          modelModule = '/src/timeline-model.ts';
        const { readMedia } = await import(mediaModule);
        const { renderFrameImage, renderVideo } = await import(exportModule);
        const { DEFAULT_TRACKS } = await import(modelModule);
        const canvas = document.createElement('canvas');
        const g = canvas.getContext('2d')!;
        const still = async (name: string, fill?: string) => {
          canvas.width = 320;
          canvas.height = 180;
          g.clearRect(0, 0, 320, 180);
          if (fill) {
            g.fillStyle = fill;
            g.fillRect(0, 0, 320, 180);
          }
          return readMedia(
            await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/png')),
            name,
          );
        };
        const video = await readMedia(await (await fetch('/media/ramp.mp4')).blob(), 'ramp.mp4');
        const clear = await still('clear.png');
        const green = await still('green.png', '#00ff00');
        const blue = await still('blue.png', '#0000ff');
        const assets = [video, clear, green, blue];
        const edit = {
          tracks: [
            { id: 'bg', label: 'Background · Full frame', kind: 'visual', role: 'background' },
            { id: 'clear', label: 'Background 2 · Full frame', kind: 'visual', role: 'background' },
            ...DEFAULT_TRACKS,
          ],
          clips: [
            { id: 'r', assetId: video.id, track: 'bg', start: 15, duration: 30, offset: 10 },
            { id: 't', assetId: clear.id, track: 'clear', start: 0, duration: 60, offset: 0 },
            { id: 's', assetId: green.id, track: 'screen', start: 0, duration: 60, offset: 0 },
            { id: 'c', assetId: blue.id, track: 'camera', start: 0, duration: 60, offset: 0 },
          ],
          zooms: [{ id: 'z', start: 0, duration: 60, scale: 2, x: 50, y: 50 }],
          layout: { radius: 22, swapped: true, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
        };
        const copies = [];
        for (const frame of frames) {
          const bitmap = await createImageBitmap(
            await renderFrameImage({ ...edit, assets, width, frame }),
          );
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          g.drawImage(bitmap, 0, 0);
          const k = bitmap.width / 1280;
          copies.push({
            size: [bitmap.width, bitmap.height],
            px: points.map(([x, y]) =>
              Array.from(g.getImageData(Math.round(x * k), Math.round(y * k), 1, 1).data).slice(
                0,
                3,
              ),
            ),
          });
          bitmap.close();
        }
        const encoded = await renderVideo({
          ...edit,
          assets,
          muted: [],
          width,
          format: 'mp4',
          onProgress: () => {},
        });
        return { copies, video: Array.from(new Uint8Array(await encoded.arrayBuffer())) };
      },
      { width, frames, points: BACKGROUND_PROBES },
    );
    const file = info.outputPath('background.mp4');
    writeFileSync(file, Buffer.from(result.video));
    const probe = execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', file], {
      encoding: 'utf8',
    });
    expect(JSON.parse(probe).streams[0]).toMatchObject({ width, height: (width * 9) / 16 });
    const exported = frames.map((frame) =>
      BACKGROUND_PROBES.map(([x, y]) =>
        Array.from(
          execFileSync('ffmpeg', [
            '-v',
            'error',
            '-ss',
            String((frame + 0.5) / 30),
            '-i',
            file,
            '-frames:v',
            '1',
            '-vf',
            `format=rgb24,crop=1:1:${Math.round((x * width) / 1280)}:${Math.round((y * width) / 1280)}`,
            '-f',
            'rawvideo',
            '-',
          ]),
        ),
      ),
    );
    console.log(`background ${width} ${JSON.stringify({ copies: result.copies, exported })}`);
    const near = (a: number[], b: number[], tol: number) =>
      b.every((v, i) => Math.abs(a[i] - v) <= tol);
    // The ramp's own red at a source frame, decoded by ffmpeg independently of the editor.
    const rampRed = (source: number) =>
      execFileSync('ffmpeg', [
        '-v',
        'error',
        '-i',
        ramp,
        '-vf',
        `select=eq(n\\,${source}),format=rgb24,crop=1:1:160:90`,
        '-frames:v',
        '1',
        '-f',
        'rawvideo',
        '-',
      ])[0];
    // Browser and ffmpeg decoders convert colour slightly differently, but both scale red alike,
    // so the ratio between frames 40 and 20 names the source frames: 35 and 15 with the offset.
    // A dropped offset (25 and 5) gives about 5; a frozen frame gives 1.
    const ratio = (red: (i: number) => number) => red(2) / red(1);
    const expected = rampRed(35) / rampRed(15);
    // Re-encoding moves the export's ratio a few hundredths; per-frame exactness is the job of
    // 'exports the exact source frame for every frame of both video tracks'.
    for (const actual of [ratio((i) => result.copies[i].px[0][0]), ratio((i) => exported[i][0][0])])
      expect(Math.abs(actual - expected), `ratio ${actual} vs ${expected}`).toBeLessThan(0.15);
    frames.forEach((frame, i) => {
      const copy = result.copies[i];
      expect(copy.size).toEqual([width, (width * 9) / 16]);
      const during = frame >= 15 && frame < 45;
      // Zoom and the swapped pair never move the Background: every margin and the gap carry it.
      // Outside its interval the transparent still above it leaves the dark backdrop showing.
      for (const j of [0, 1, 2])
        if (during) expect(copy.px[j][0], `margin ${j} @${frame}`).toBeGreaterThan(60);
        else expect(copy.px[j][0], `margin ${j} @${frame}`).toBeLessThan(30);
      if (!during)
        expect(near(copy.px[0], [21, 33, 34], 6), `backdrop @${frame}: ${copy.px[0].join()}`).toBe(
          true,
        );
      expect(near(copy.px[3], [0, 0, 255], 8), 'camera above the Background').toBe(true);
      expect(near(copy.px[4], [0, 255, 0], 8), 'screen above the Background').toBe(true);
      BACKGROUND_PROBES.forEach((point, j) =>
        expect(
          near(exported[i][j], copy.px[j], 14),
          `export vs copy ${point.join()} @${frame}`,
        ).toBe(true),
      );
    });
  });

for (const muted of [[], ['a3']])
  test(`mixes a new audio track at gain 1 beside music at 0.22, muting ${muted.join() || 'nothing'}`, async ({
    page,
  }, info) => {
    test.setTimeout(120000);
    await page.goto('/');
    const result = await page.evaluate(async (muted) => {
      const mediaModule = '/src/media.ts',
        exportModule = '/src/export.ts',
        modelModule = '/src/timeline-model.ts';
      const { readMedia } = await import(mediaModule);
      const { renderVideo } = await import(exportModule);
      const { DEFAULT_TRACKS } = await import(modelModule);
      const read = async (name: string) =>
        readMedia(await (await fetch(`/media/${name}`)).blob(), name);
      const voice = await read('voice.wav');
      const music = await read('music.wav');
      const blob = await renderVideo({
        assets: [voice, music],
        tracks: [...DEFAULT_TRACKS, { id: 'a3', label: 'Audio 3', kind: 'audio', gain: 1 }],
        clips: [
          { id: 'v', assetId: voice.id, track: 'a3', start: 6, duration: 24, offset: 15 },
          { id: 'm', assetId: music.id, track: 'music', start: 0, duration: 30, offset: 30 },
        ],
        zooms: [],
        layout: { radius: 22, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
        muted,
        width: 1920,
        format: 'mov',
        onProgress: () => {},
      });
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    }, muted);
    const file = info.outputPath('mix.mov');
    writeFileSync(file, Buffer.from(result));
    inspectExport(file, 1920, 'mov', true);
    const pcm = (args: string[]) =>
      execFileSync('ffmpeg', [
        '-v',
        'error',
        ...args,
        '-f',
        'f32le',
        '-ac',
        '2',
        '-ar',
        '48000',
        '-',
      ]);
    const audio = pcm(['-i', file]);
    const reference = pcm([
      '-i',
      info.outputPath('voice.wav'),
      '-i',
      info.outputPath('music.wav'),
      '-filter_complex',
      `[0:a]atrim=start=0.5:end=1.3,asetpts=PTS-STARTPTS,adelay=200:all=1,volume=${muted.length ? 0 : 1}[v];` +
        '[1:a]atrim=start=1:end=2,asetpts=PTS-STARTPTS,volume=0.22[m];' +
        '[v][m]amix=inputs=2:normalize=0:duration=longest',
    ]);
    let squaredError = 0,
      energy = 0;
    for (let i = 0; i + 4 <= Math.min(audio.length, reference.length); i += 4) {
      const expected = reference.readFloatLE(i);
      squaredError += (audio.readFloatLE(i) - expected) ** 2;
      energy += expected ** 2;
    }
    console.log(`new-track audio error ${Math.sqrt(squaredError / energy)}`);
    expect(Math.sqrt(squaredError / energy)).toBeLessThan(0.12);
  });

// Stage points outside both masks: left, top and right margins and the centre gap. The timeline
// covers the preview's bottom edge, so the bottom margin, where a drop shadow falls deepest, is
// probed in Copy frame and export only.
const MARGINS: [number, number][] = [
  [4, 360],
  [640, 4],
  [899, 360],
  [1276, 360],
];
const PROBES: [number, number][] = [...MARGINS, [640, 715]];

test.describe('no mask shadow', () => {
  // A large, sharp preview, so the 10px stage margins are several screen pixels wide.
  test.use({ viewport: { width: 2400, height: 1500 }, deviceScaleFactor: 2 });
  test('preview, Copy frame and export show a white Background unshaded around the masks at 1920px', async ({
    page,
  }, info) => {
    test.setTimeout(120000);
    const width = 1920;
    await page.goto('/');
    await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', {
      timeout: 30000,
    });
    const result = await page.evaluate(
      async ({ width, points }) => {
        const mediaModule = '/src/media.ts',
          exportModule = '/src/export.ts',
          projectModule = '/src/project.ts',
          modelModule = '/src/timeline-model.ts';
        const { readMedia } = await import(mediaModule);
        const { renderFrameImage, renderVideo } = await import(exportModule);
        const { serializeProject } = await import(projectModule);
        const { DEFAULT_TRACKS } = await import(modelModule);
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const g = canvas.getContext('2d')!;
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, 320, 180);
        const png = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/png'));
        const asset = await readMedia(png, 'white.png');
        // A white still on a Background beneath the empty masks.
        const edit = {
          tracks: [
            { id: 'bg', label: 'Background · Full frame', kind: 'visual', role: 'background' },
            ...DEFAULT_TRACKS,
          ],
          clips: [{ id: 'w', assetId: asset.id, track: 'bg', start: 0, duration: 30, offset: 0 }],
          zooms: [],
          layout: { radius: 22, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
        };
        const copied = await createImageBitmap(
          await renderFrameImage({ ...edit, assets: [asset], width, frame: 1 }),
        );
        canvas.width = copied.width;
        canvas.height = copied.height;
        g.drawImage(copied, 0, 0);
        copied.close();
        const k = canvas.width / 1280;
        const copy = points.map(([x, y]) =>
          Array.from(g.getImageData(Math.round(x * k), Math.round(y * k), 1, 1).data).slice(0, 3),
        );
        const video = await renderVideo({
          ...edit,
          assets: [asset],
          muted: [],
          width,
          format: 'mp4',
          onProgress: () => {},
        });
        const project = await (await serializeProject(edit, [asset], [])).file.text();
        return { copy, video: Array.from(new Uint8Array(await video.arrayBuffer())), project };
      },
      { width, points: PROBES },
    );
    const file = info.outputPath('no-shadow.mp4');
    writeFileSync(file, Buffer.from(result.video));
    inspectExport(file, width, 'mp4', false);
    const exported = PROBES.map(([x, y]) =>
      Array.from(
        execFileSync('ffmpeg', [
          '-v',
          'error',
          '-ss',
          '0.033',
          '-i',
          file,
          '-frames:v',
          '1',
          '-vf',
          `format=rgb24,crop=1:1:${Math.round((x * width) / 1280)}:${Math.round((y * width) / 1280)}`,
          '-f',
          'rawvideo',
          '-',
        ]),
      ),
    );

    // The preview at the same render size, through the editor's own project path.
    await choose(page.getByRole('combobox', { name: 'Export resolution' }), String(width));
    await page.getByLabel('Open local project').setInputFiles({
      name: 'no-shadow.clipper.json',
      mimeType: 'application/json',
      buffer: Buffer.from(result.project),
    });
    await expect(page.locator('.app-footer [role="status"]')).toContainText('Project reopened');
    const stage = page.getByTestId('screen-mask').locator('..');
    await expect(stage.locator('img').first()).toHaveJSProperty('naturalWidth', 320);
    // Every probe must land on the stage itself, not on a panel drawn over it.
    const box = (await stage.boundingBox())!;
    for (const [x, y] of MARGINS)
      expect(
        await page.evaluate(
          ([x, y]) =>
            document
              .querySelector('[data-testid="screen-mask"]')!
              .parentElement!.contains(document.elementFromPoint(x, y)),
          [box.x + (x * box.width) / 1280, box.y + (y * box.height) / 720],
        ),
      ).toBe(true);
    const shot = (await stage.screenshot()).toString('base64');
    const preview = await page.evaluate(
      async ({ shot, points }) => {
        const bitmap = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${shot}`)).blob(),
        );
        const c = document.createElement('canvas');
        c.width = bitmap.width;
        c.height = bitmap.height;
        const g = c.getContext('2d')!;
        g.drawImage(bitmap, 0, 0);
        const k = bitmap.width / 1280;
        return points.map(([x, y]) =>
          Array.from(g.getImageData(Math.round(x * k), Math.round(y * k), 1, 1).data).slice(0, 3),
        );
      },
      { shot, points: MARGINS },
    );
    console.log('no-shadow', JSON.stringify({ preview, copy: result.copy, exported }));
    // A drop shadow darkens these by tens of levels; codec rounding moves white by a few at most.
    for (const [name, pixels, points] of [
      ['preview', preview, MARGINS],
      ['copy', result.copy, PROBES],
      ['export', exported, PROBES],
    ] as const)
      pixels.forEach((pixel, i) =>
        expect(Math.min(...pixel), `${name} ${points[i].join()}`).toBeGreaterThanOrEqual(245),
      );
  });
});

// A red-to-blue gradient at 90 degrees runs left to right, so a stage x holds x / 1280 of blue. The
// shadow's blur and drop scale with the render size, so 3840 must agree with 1920 at the same
// stage points, and the exported frame with Copy frame.
for (const width of [1920, 3840])
  test(`a gradient backdrop and panel shadow agree across Copy frame and export at ${width}px`, async ({
    page,
  }, info) => {
    test.setTimeout(240000);
    await page.goto('/');
    await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', {
      timeout: 30000,
    });
    const result = await page.evaluate(
      async ({ width, points }) => {
        const mediaModule = '/src/media.ts',
          exportModule = '/src/export.ts',
          modelModule = '/src/timeline-model.ts';
        const { readMedia } = await import(mediaModule);
        const { renderFrameImage, renderVideo } = await import(exportModule);
        const { DEFAULT_TRACKS } = await import(modelModule);
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const g = canvas.getContext('2d')!;
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, 320, 180);
        const png = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/png'));
        const asset = await readMedia(png, 'white.png');
        const edit = {
          tracks: DEFAULT_TRACKS,
          clips: [
            { id: 'w', assetId: asset.id, track: 'screen', start: 0, duration: 30, offset: 0 },
          ],
          zooms: [],
          assets: [asset],
        };
        const layout = {
          radius: 22,
          screenX: 50,
          screenY: 50,
          cameraX: 50,
          cameraY: 50,
          fill: '#ff0000',
          fillTo: '#0000ff',
          fillAngle: 90,
        };
        const read = async (blob: Blob) => {
          const bitmap = await createImageBitmap(blob);
          const c = document.createElement('canvas');
          c.width = bitmap.width;
          c.height = bitmap.height;
          const context = c.getContext('2d')!;
          context.drawImage(bitmap, 0, 0);
          const k = bitmap.width / 1280;
          const pixels = points.map(([x, y]: number[]) =>
            Array.from(context.getImageData(Math.round(x * k), Math.round(y * k), 1, 1).data).slice(
              0,
              3,
            ),
          );
          bitmap.close();
          return pixels;
        };
        const copy = async (shadow: number | undefined, size: number) =>
          read(
            await renderFrameImage({
              ...edit,
              layout: { ...layout, ...(shadow && { shadow }) },
              width: size,
              frame: 1,
            }),
          );
        const video = await renderVideo({
          ...edit,
          layout: { ...layout, shadow: 100 },
          muted: [],
          width,
          format: 'mp4',
          onProgress: () => {},
        });
        return {
          flat: await copy(undefined, width),
          shaded: await copy(100, width),
          reference: await copy(100, 1920),
          video: Array.from(new Uint8Array(await video.arrayBuffer())),
        };
      },
      { width, points: PROBES },
    );
    const file = info.outputPath('gradient-shadow.mp4');
    writeFileSync(file, Buffer.from(result.video));
    inspectExport(file, width, 'mp4', false);
    const exported = PROBES.map(([x, y]) =>
      Array.from(
        execFileSync('ffmpeg', [
          '-v',
          'error',
          '-ss',
          '0.033',
          '-i',
          file,
          '-frames:v',
          '1',
          '-vf',
          `format=rgb24,crop=1:1:${Math.round((x * width) / 1280)}:${Math.round((y * width) / 1280)}`,
          '-f',
          'rawvideo',
          '-',
        ]),
      ),
    );
    console.log(
      `gradient-shadow ${width}`,
      JSON.stringify(result.shaded),
      JSON.stringify(exported),
    );
    const close = (a: number[], b: number[], tolerance: number) =>
      a.every((value, i) => Math.abs(value - b[i]) <= tolerance);
    PROBES.forEach(([x], i) => {
      const expected = [255 * (1 - x / 1280), 0, (255 * x) / 1280];
      expect(
        close(result.flat[i], expected, 3),
        `flat ${i} ${JSON.stringify(result.flat[i])}`,
      ).toBe(true);
      expect(close(result.shaded[i], result.reference[i], 6), `scale ${i}`).toBe(true);
      expect(
        close(exported[i], result.shaded[i], 14),
        `export ${i} ${JSON.stringify(exported[i])}`,
      ).toBe(true);
    });
    // The gap sits between two panels' shadows, which darken it by tens of levels.
    expect(result.shaded[2][0] + result.shaded[2][2]).toBeLessThan(
      result.flat[2][0] + result.flat[2][2] - 40,
    );
  });

// A WebP background with a transparent right half, over a red-to-blue gradient stage, through the
// same helpers as a PNG: opaque pixels show the picture, transparent ones let the stage through.
test('a WebP background with alpha composites over the gradient in Copy frame and export at 1920px', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const width = 1920;
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  // Stage points in the left margin (the picture, opaque green) and the right margin (transparent).
  const probes: [number, number][] = [
    [5, 360],
    [635, 5],
    [1275, 360],
    [645, 715],
  ];
  const result = await page.evaluate(
    async ({ width, points }) => {
      const mediaModule = '/src/media.ts',
        exportModule = '/src/export.ts',
        modelModule = '/src/timeline-model.ts';
      const { readMedia } = await import(mediaModule);
      const { renderFrameImage, renderVideo } = await import(exportModule);
      const { DEFAULT_TRACKS } = await import(modelModule);
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const g = canvas.getContext('2d')!;
      g.fillStyle = '#00ff00';
      g.fillRect(0, 0, 160, 180); // the right half stays transparent
      const webp = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/webp', 1));
      const head = new Uint8Array(await webp.slice(0, 12).arrayBuffer());
      const asset = await readMedia(webp, 'wall.webp');
      const edit = {
        tracks: [
          { id: 'bg', label: 'Background · Full frame', kind: 'visual', role: 'background' },
          ...DEFAULT_TRACKS,
        ],
        clips: [{ id: 'w', assetId: asset.id, track: 'bg', start: 0, duration: 30, offset: 0 }],
        zooms: [],
        assets: [asset],
        layout: {
          radius: 22,
          screenX: 50,
          screenY: 50,
          cameraX: 50,
          cameraY: 50,
          fill: '#ff0000',
          fillTo: '#0000ff',
          fillAngle: 90,
        },
      };
      const bitmap = await createImageBitmap(await renderFrameImage({ ...edit, width, frame: 1 }));
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      g.drawImage(bitmap, 0, 0);
      const k = bitmap.width / 1280;
      const copy = points.map(([x, y]: number[]) =>
        Array.from(g.getImageData(Math.round(x * k), Math.round(y * k), 1, 1).data).slice(0, 3),
      );
      bitmap.close();
      const video = await renderVideo({
        ...edit,
        muted: [],
        width,
        format: 'mp4',
        onProgress: () => {},
      });
      return {
        kind: asset.kind,
        riff:
          String.fromCharCode(...head.subarray(0, 4)) +
          String.fromCharCode(...head.subarray(8, 12)),
        copy,
        video: Array.from(new Uint8Array(await video.arrayBuffer())),
      };
    },
    { width, points: probes },
  );
  expect(result).toMatchObject({ kind: 'image', riff: 'RIFFWEBP' });
  const file = info.outputPath('webp-background.mp4');
  writeFileSync(file, Buffer.from(result.video));
  inspectExport(file, width, 'mp4', false);
  const exported = probes.map(([x, y]) =>
    Array.from(
      execFileSync('ffmpeg', [
        '-v',
        'error',
        '-ss',
        '0.033',
        '-i',
        file,
        '-frames:v',
        '1',
        '-vf',
        `format=rgb24,crop=1:1:${Math.round((x * width) / 1280)}:${Math.round((y * width) / 1280)}`,
        '-f',
        'rawvideo',
        '-',
      ]),
    ),
  );
  console.log('webp-background', JSON.stringify(result.copy), JSON.stringify(exported));
  const close = (a: number[], b: number[], tolerance: number) =>
    a.every((value, i) => Math.abs(value - b[i]) <= tolerance);
  // Cover fit of a 16:9 picture on the 16:9 stage is exact, so its left half is the left 640 px.
  for (const [name, pixels, tolerance] of [
    ['copy', result.copy, 3],
    ['export', exported, 14],
  ] as const) {
    expect(
      close(pixels[0], [0, 255, 0], tolerance),
      `${name} left ${JSON.stringify(pixels[0])}`,
    ).toBe(true);
    // Transparent: the gradient shows, mostly blue at the right edge and mid-red-blue at the middle.
    expect(close(pixels[2], [0, 0, 255], 12), `${name} right ${JSON.stringify(pixels[2])}`).toBe(
      true,
    );
    expect(pixels[3][1], `${name} lower centre ${JSON.stringify(pixels[3])}`).toBeLessThan(40);
  }
});

// Chrome blocks repeat downloads and Safari asks first unless the user has just acted, so the
// rendered video must download from the user's own click, never from code after a long render.
test('hands the rendered video over from a Save video click, with fresh user activation', async ({
  page,
}) => {
  test.setTimeout(150000);
  await page.addInitScript(() => {
    const clicks: { name: string; active: boolean }[] = [];
    Object.assign(window, { downloadClicks: clicks });
    const record = (anchor: HTMLAnchorElement) =>
      anchor.download &&
      clicks.push({ name: anchor.download, active: navigator.userActivation.isActive });
    const click = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'click')!.value as (
      this: HTMLElement,
    ) => void;
    HTMLAnchorElement.prototype.click = function () {
      record(this);
      click.call(this);
    };
    // A real click on a download link activates the page before the link follows.
    document.addEventListener('click', (event) => {
      const anchor = event.target instanceof Element && event.target.closest('a');
      if (anchor && event.isTrusted) record(anchor);
    });
  });
  const downloads: string[] = [];
  page.on('download', (download) => downloads.push(download.suggestedFilename()));
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const status = page.locator('.app-footer [role="status"]');
  const save = page.getByRole('link', { name: 'Save video', exact: true });
  const render = async () => {
    await page.getByRole('button', { name: 'Export video', exact: true }).click();
    await page.getByRole('button', { name: 'Render video', exact: true }).click();
    await expect(status).toContainText('Video exported at 1920', { timeout: 120000 });
  };

  await render();
  // Nothing downloads until the user asks, and the ready state hands the next key press to Save.
  await page.waitForTimeout(1500);
  expect(downloads).toEqual([]);
  await expect(save).toBeFocused();
  await expect(page.getByRole('status').filter({ hasText: 'Video ready' })).toContainText(
    'developer-walkthrough-1080p.mp4',
  );
  const downloaded = page.waitForEvent('download');
  await save.click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe('developer-walkthrough-1080p.mp4');
  // The blob URL outlives the click, so the browser can still read the whole file.
  expect(
    execFileSync('ffprobe', ['-v', 'error', '-show_format', (await download.path())!]).length,
  ).toBeGreaterThan(0);
  // The render stays after Save, since a cancelled save dialog or a download prompt still needs it.
  const again = page.getByRole('link', { name: 'Save again', exact: true });
  await expect(again).toBeFocused();
  await expect(page.getByRole('status').filter({ hasText: 'Saved ·' })).toContainText(
    'developer-walkthrough-1080p.mp4',
  );
  await page.waitForTimeout(500);
  const redownloaded = page.waitForEvent('download');
  await again.click();
  const second = await redownloaded;
  expect(
    execFileSync('ffprobe', ['-v', 'error', '-show_format', (await second.path())!]).length,
  ).toBeGreaterThan(0);
  expect(await page.evaluate(() => Reflect.get(window, 'downloadClicks'))).toEqual([
    { name: 'developer-walkthrough-1080p.mp4', active: true },
    { name: 'developer-walkthrough-1080p.mp4', active: true },
  ]);
  // Discard releases it and hands focus back to Export video.
  await page.getByRole('button', { name: 'Discard video', exact: true }).click();
  await expect(again).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Export video', exact: true })).toBeFocused();

  // Discarding an unsaved render downloads nothing.
  await render();
  await page.getByRole('button', { name: 'Discard video', exact: true }).click();
  await expect(save).toHaveCount(0);
  await page.waitForTimeout(1000);
  expect(downloads).toEqual(['developer-walkthrough-1080p.mp4', 'developer-walkthrough-1080p.mp4']);
});

// REF-28: when the decoder has no frame for a requested time, Copy frame and export hold the
// nearest decoded frame (the last past the end, the first before the start); a frame that cannot be
// decoded fails loudly and names the clip and time. Source frame n
// is a grey field with a white full-width bar 6 px high at y = n * 6, so the picture says which
// source frame it is.
test.describe('decoder frame gaps', () => {
  const bars = (file: string, frames: number, setpts?: string) =>
    execFileSync('ffmpeg', [
      ...['-v', 'error', '-y', '-f', 'lavfi', '-i'],
      `color=c=0x404040:s=640x360:r=30:d=${frames / 30}`,
      ...['-f', 'lavfi', '-i', `color=c=white:s=640x6:r=30:d=${frames / 30}`],
      ...[
        '-filter_complex',
        `[0:v][1:v]overlay=x=0:y='(n-1)*6':shortest=1,format=yuv420p${setpts ?? ''}`,
      ],
      ...['-c:v', 'libvpx-vp9', '-g', '15', file],
    ]);

  // The stage column at x = 450 through the screen mask, for each frame of an image or video file.
  const columns = (file: string) =>
    execFileSync(
      'ffmpeg',
      [
        '-v',
        'error',
        '-i',
        file,
        '-vf',
        'scale=1280:720,format=gray,crop=1:720:450:0',
        '-f',
        'rawvideo',
        '-',
      ],
      { maxBuffer: 1 << 28 },
    );
  // The source frame whose bar a column shows (the mask is 700 px tall from y = 10 for 360 source
  // rows), or "empty" when no bar is drawn: the mask then holds only its dark placeholder fill.
  const shown = (column: Buffer, frame: number) => {
    const rows = [...column.subarray(frame * 720 + 10, frame * 720 + 710).entries()].filter(
      ([, value]) => value > 200,
    );
    if (rows.length < 4) return 'empty';
    const centre = rows.reduce((sum, [y]) => sum + y, 0) / rows.length + 0.5;
    return Math.max(0, Math.round(((centre * 360) / 700 - 3) / 6));
  };

  for (const [name, frames, setpts, probes, expected] of [
    // A 1 s stream under a 60-frame clip: after its last frame every path holds that frame.
    ['past the end of the stream', 30, undefined, [30, 45, 59], [29, 29, 29]],
    // The first sample is at 0.5 s: before it the first frame is held, as the preview shows.
    ['before the first sample', 60, ',setpts=PTS+0.5/TB', [0, 14, 16], [0, 0, 1]],
  ] as const)
    test(`Copy frame and export hold the ${name === 'past the end of the stream' ? 'last' : 'first'} frame ${name}`, async ({
      page,
    }, info) => {
      test.setTimeout(120000);
      const fixture = info.outputPath('gap.webm');
      bars(fixture, frames, setpts);
      await page.route('**/gap-fixture', (route) =>
        route.fulfill({ contentType: 'text/html', body: '<html><body>Gap fixture</body></html>' }),
      );
      await page.route('**/gap-media', (route) => route.fulfill({ path: fixture }));
      await page.goto('/gap-fixture');
      const rendered = await page.evaluate(
        async ({ probes, length }) => {
          const mediaModule = '/src/media.ts',
            exportModule = '/src/export.ts';
          const { readMedia } = await import(mediaModule);
          const { renderFrameImage, renderVideo } = await import(exportModule);
          const asset = await readMedia(await (await fetch('/gap-media')).blob(), 'gap', 'gap');
          const options = {
            assets: [asset],
            // The clip is longer than the stream, as a stale stored duration would make it.
            clips: [
              { id: 'c', assetId: 'gap', track: 'screen', start: 0, duration: length, offset: 0 },
            ],
            zooms: [],
            layout: { radius: 0, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
            width: 1920,
          };
          const copies = [];
          for (const frame of probes)
            copies.push(
              Array.from(
                new Uint8Array(await (await renderFrameImage({ ...options, frame })).arrayBuffer()),
              ),
            );
          const video = await renderVideo({
            ...options,
            muted: [],
            format: 'webm',
            onProgress: () => {},
          });
          return { copies, video: Array.from(new Uint8Array(await video.arrayBuffer())) };
        },
        { probes: [...probes], length: Math.max(60, frames) },
      );
      const exported = info.outputPath('gap-export.webm');
      writeFileSync(exported, Buffer.from(rendered.video));
      const video = columns(exported);
      const copies = rendered.copies.map((bytes, i) => {
        const png = info.outputPath(`gap-copy-${i}.png`);
        writeFileSync(png, Buffer.from(bytes));
        return shown(columns(png), 0);
      });
      expect(copies, `Copy frame at ${probes.join()}`).toEqual([...expected]);
      expect(
        probes.map((frame) => shown(video, frame)),
        `export at ${probes.join()}`,
      ).toEqual([...expected]);
    });

  test('Copy frame and export name the clip and time of a frame that cannot be decoded', async ({
    page,
  }, info) => {
    test.setTimeout(120000);
    const fixture = info.outputPath('corrupt.webm');
    bars(fixture, 60);
    // Overwrite the payload of packet 35 and leave the container intact.
    const { packets } = JSON.parse(
      execFileSync('ffprobe', [
        ...['-v', 'error', '-show_packets', '-select_streams', 'v'],
        ...['-show_entries', 'packet=pos,size', '-of', 'json', fixture],
      ]).toString(),
    ) as { packets: { pos: string; size: string }[] };
    const bytes = readFileSync(fixture);
    const { pos, size } = packets[35];
    bytes.fill(0xff, Number(pos) + 4, Number(pos) + Number(size));
    writeFileSync(fixture, bytes);
    await page.route('**/gap-fixture', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<html><body>Gap fixture</body></html>' }),
    );
    await page.route('**/gap-media', (route) => route.fulfill({ path: fixture }));
    await page.goto('/gap-fixture');
    const messages = await page.evaluate(async () => {
      const mediaModule = '/src/media.ts',
        exportModule = '/src/export.ts';
      const { readMedia } = await import(mediaModule);
      const { renderFrameImage, renderVideo } = await import(exportModule);
      const asset = await readMedia(await (await fetch('/gap-media')).blob(), 'Flower study', 'f');
      const options = {
        assets: [asset],
        clips: [{ id: 'c', assetId: 'f', track: 'screen', start: 0, duration: 60, offset: 0 }],
        zooms: [],
        layout: { radius: 0, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
        width: 1920,
      };
      const failure = (run: Promise<unknown>) =>
        run.then(
          () => 'rendered',
          (error: Error) => error.message,
        );
      return {
        copy: await failure(renderFrameImage({ ...options, frame: 40 })),
        video: await failure(
          renderVideo({ ...options, muted: [], format: 'webm', onProgress: () => {} }),
        ),
      };
    });
    // Copy frame names the requested frame 40 (00:01:10). The export names the frame where the
    // decoder's read-ahead surfaced the bad packet, somewhere in 00:01:0x.
    expect(messages.copy).toBe('"Flower study" could not be decoded at 00:01:10.');
    expect(messages.video).toMatch(
      /^Video export failed: "Flower study" could not be decoded at 00:01:0\d\.$/,
    );
  });
});

// Clip gain reaches the file: a steady tone at -20 dBFS is exported at several gains, and the level
// read back from the decoded audio moves by the dB asked for. A muted clip leaves no audio at all.
test('exports clip gain as decibels of the decoded audio, and a muted gained clip stays silent', async ({
  page,
}, info) => {
  test.setTimeout(150000);
  const tone = info.outputPath('gain-tone.wav');
  execFileSync('ffmpeg', [
    ...[
      '-v',
      'error',
      '-y',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=440:sample_rate=48000:duration=1',
    ],
    ...['-af', 'volume=0.1', tone],
  ]);
  await page.route('**/gain-fixture', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<html><body>Gain fixture</body></html>' }),
  );
  await page.route('**/gain-media', (route) => route.fulfill({ path: tone }));
  await page.goto('/gain-fixture');
  const gains = [0, 6, -6, -24, 12];
  const files = await page.evaluate(
    async ({ gains }) => {
      const mediaModule = '/src/media.ts',
        exportModule = '/src/export.ts';
      const { readMedia } = await import(mediaModule);
      const { renderVideo } = await import(exportModule);
      const asset = await readMedia(await (await fetch('/gain-media')).blob(), 'tone.wav', 'tone');
      const layout = { radius: 0, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 };
      const render = async (gain: number, muted: string[]) => {
        const clip = {
          id: 'v',
          assetId: 'tone',
          track: 'voice',
          start: 0,
          duration: 30,
          offset: 0,
        };
        const blob = await renderVideo({
          assets: [asset],
          clips: [gain ? { ...clip, gain } : clip],
          zooms: [],
          layout,
          muted,
          width: 1920,
          format: 'webm',
          onProgress: () => {},
        });
        return Array.from(new Uint8Array(await blob.arrayBuffer()));
      };
      const levels = [];
      for (const gain of gains) levels.push(await render(gain, []));
      return { levels, silent: await render(12, ['voice']) };
    },
    { gains },
  );
  // The loudest sample and the mean level of the tone, in dB, read from the decoded file.
  const level = (bytes: number[], name: string) => {
    const file = info.outputPath(name);
    writeFileSync(file, Buffer.from(bytes));
    const log = spawnSync(
      'ffmpeg',
      ['-hide_banner', '-i', file, '-vn', '-af', 'volumedetect', '-f', 'null', '-'],
      { encoding: 'utf8' },
    ).stderr;
    return Number(/mean_volume: (-?[\d.]+) dB/.exec(log)![1]);
  };
  const measured = gains.map((gain, i) => level(files.levels[i], `gain-${gain}.webm`));
  // -20 dBFS peak is about -23 dB mean for a sine; what matters is each step against the 0 dB file.
  gains.forEach((gain, i) =>
    expect(measured[i] - measured[0], `${gain} dB, levels ${measured.join(' ')}`).toBeCloseTo(
      gain,
      -0.3,
    ),
  );
  const silentFile = info.outputPath('gain-muted.webm');
  writeFileSync(silentFile, Buffer.from(files.silent));
  const streams = JSON.parse(
    execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', silentFile], {
      encoding: 'utf8',
    }),
  ).streams.map((stream: { codec_type: string }) => stream.codec_type);
  expect(streams).toEqual(['video']);
});

// One rate per row; MP4 covers every rate, WebM and MOV the cases their timebases handle
// differently: WebM's 1 ms grid at 29.97 and 100, MOV's hint at 29.97 and none at 24.
for (const [format, fps] of [
  ['mp4', '24'],
  ['mp4', '29.97'],
  ['mp4', '60'],
  ['mp4', '100'],
  ['mp4', '120'],
  ['webm', '29.97'],
  ['webm', '100'],
  ['mov', '24'],
  ['mov', '29.97'],
] as const) {
  test(`exports ${fps} fps ${format} at exact rational times, showing the source frame of each time`, async ({
    page,
  }, info) => {
    test.setTimeout(120000);
    // 31 ticks is 1.0333 s: no rate fits it evenly, so every row ends with a short last picture.
    const ticks = 31;
    const offset = 14;
    const [p, q] = fps === '29.97' ? [30000, 1001] : [Number(fps), 1];
    // Independent of the app: the count of output times n·q/p before the end, and the source frame
    // each shows, by exact rational arithmetic.
    const samples = Math.ceil((ticks * p) / (30 * q) - 1e-9);
    const sourceAt = (n: number) => offset + Math.floor((n * 30 * q) / p + 1e-9);
    const fixture = info.outputPath('frame-bars.mp4');
    // Black frames with a white bar 10 px further right on each 30 fps source frame.
    execFileSync('ffmpeg', [
      ...['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=640x360:r=30:d=2'],
      ...['-f', 'lavfi', '-i', 'color=c=white:s=10x360:r=30:d=2', '-filter_complex'],
      ...["[0:v][1:v]overlay=x='n*10':y=0:shortest=1,format=yuv420p", '-c:v', 'libx264', fixture],
    ]);
    await page.route('**/export-fixture', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<html><body>Export fixture</body></html>' }),
    );
    await page.route('**/frame-bars', (route) => route.fulfill({ path: fixture }));
    await page.goto('/export-fixture');
    const bytes = await page.evaluate(
      async ({ ticks, offset, format, fps }) => {
        const mediaModule = '/src/media.ts',
          exportModule = '/src/export.ts';
        const { readMedia } = await import(mediaModule);
        const { renderVideo } = await import(exportModule);
        const asset = await readMedia(await (await fetch('/frame-bars')).blob(), 'bars', 'bars');
        const blob = await renderVideo({
          assets: [asset],
          clips: [{ id: 's', assetId: 'bars', track: 'screen', start: 0, duration: ticks, offset }],
          zooms: [],
          layout: { radius: 0, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
          muted: [],
          width: 1920,
          format,
          fps,
          onProgress: () => undefined,
        });
        return Array.from(new Uint8Array(await blob.arrayBuffer()));
      },
      { ticks, offset, format, fps },
    );
    const rendered = info.outputPath(`export.${format}`);
    writeFileSync(rendered, Buffer.from(bytes));
    const { packets, format: container } = JSON.parse(
      execFileSync('ffprobe', [
        ...['-v', 'error', '-select_streams', 'v', '-show_entries'],
        ...['packet=pts_time,duration_time:format=duration', '-of', 'json', rendered],
      ]).toString(),
    );
    const starts = packets
      .map((packet: { pts_time: string }) => Number(packet.pts_time))
      .sort((a: number, b: number) => a - b);
    // WebM keeps 1 ms timestamps, so each end may move by up to 0.5 ms; MP4 and MOV are exact.
    const tolerance = format === 'webm' ? 0.0005 + 1e-6 : 1e-6;
    expect(starts.length).toBe(samples);
    const drift = starts.map((start: number, n: number) => Math.abs(start - (n * q) / p));
    expect(Math.max(...drift)).toBeLessThanOrEqual(tolerance);
    // The last picture ends with the timeline, not a whole frame later.
    const last = packets.find(
      (packet: { pts_time: string }) => Number(packet.pts_time) === starts.at(-1),
    );
    const end =
      format === 'webm'
        ? Number(container.duration)
        : Number(last.pts_time) + Number(last.duration_time);
    expect(Math.abs(end - ticks / 30)).toBeLessThanOrEqual(tolerance);
    // Every output picture shows the source frame at its own time, read from the bar position.
    const rows = (file: string, width: number, height: number) =>
      execFileSync('ffmpeg', [
        ...['-v', 'error', '-i', file, '-fps_mode', 'passthrough', '-vf'],
        ...[`scale=${width}:${height},format=gray,crop=${width}:1:0:${height / 2}`],
        ...['-f', 'rawvideo', '-'],
      ]);
    const barCentre = (row: Buffer, width: number, frame: number, from: number, to: number) => {
      let sum = 0,
        count = 0;
      for (let x = from; x < to; x++)
        if (row[frame * width + x] > 128) {
          sum += x + 0.5;
          count++;
        }
      return sum / count;
    };
    const source = rows(fixture, 640, 360);
    const exported = rows(rendered, 1280, 720);
    expect(exported.length).toBe(samples * 1280);
    // The screen mask is 880 x 700 at x = 10; its cover-crop puts source x = 320 at its centre.
    const errors = Array.from({ length: samples }, (_, n) => {
      const shown = ((barCentre(exported, 1280, n, 10, 890) - 450) * 360) / 700 + 320;
      return shown - barCentre(source, 640, sourceAt(n), 0, 640);
    });
    expect(
      Math.max(...errors.map(Math.abs)),
      `source px off per picture: ${errors.map((error) => error.toFixed(1)).join(' ')}`,
    ).toBeLessThan(2.5);
  });
}
