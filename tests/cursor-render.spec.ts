import { expect, test } from '@playwright/test';

test('draws source-offset cursors through a cut, crop, side swap and zoom in preview and encoded frames', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const result = await page.evaluate(async () => {
    const bunnyModule = '/node_modules/mediabunny/dist/bundles/mediabunny.mjs';
    const exportModule = '/src/export.ts';
    const {
      Output,
      WebMOutputFormat,
      BufferTarget,
      CanvasSource,
      Input,
      BlobSource,
      ALL_FORMATS,
      CanvasSink,
    } = await import(bunnyModule);
    const { renderVideo } = await import(exportModule);
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1000;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#181818';
    context.fillRect(0, 0, 1600, 1000);
    const target = new BufferTarget();
    const output = new Output({ format: new WebMOutputFormat(), target });
    const video = new CanvasSource(canvas, { codec: 'vp9', bitrate: 500000 });
    output.addVideoTrack(video, { frameRate: 30 });
    await output.start();
    for (let frame = 0; frame < 12; frame++) await video.add(frame / 30, 1 / 30);
    video.close();
    await output.finalize();
    const source = new Blob([target.buffer], { type: 'video/webm' });
    const bitmap = document.createElement('canvas');
    bitmap.width = 20;
    bitmap.height = 10;
    const paint = bitmap.getContext('2d')!;
    paint.fillStyle = '#ff00ff';
    paint.fillRect(0, 0, 20, 10);
    const cursor = {
      recording: {
        version: 2,
        provider: 'native',
        samples: [
          { timeMs: 0, cx: 0.6, cy: 0.1, assetId: 'synthetic' },
          { timeMs: 100, cx: 0.9, cy: 0.3, assetId: 'synthetic', interactionType: 'click' },
          { timeMs: 200, cx: 0.1, cy: 0.7, assetId: 'synthetic' },
        ],
        assets: [
          {
            id: 'synthetic',
            platform: 'synthetic',
            imageDataUrl: bitmap.toDataURL(),
            width: 20,
            height: 10,
            hotspotX: 4.5,
            hotspotY: 2.5,
            scaleFactor: 1,
          },
        ],
      },
      offsetMs: 50,
      settings: { mode: 'raw', size: 2, hidden: false },
    };
    const layout = {
      radius: 22,
      swapped: true,
      screenX: 25,
      screenY: 80,
      cameraX: 50,
      cameraY: 50,
    };
    const clips = [
      { id: 'a', assetId: 'synthetic', track: 'screen', start: 0, duration: 3, offset: 3 },
      { id: 'b', assetId: 'synthetic', track: 'screen', start: 3, duration: 3, offset: 6 },
    ];
    const zooms = [{ id: 'zoom', start: 0, duration: 6, scale: 1.2, x: 50, y: 50 }];
    const asset = {
      id: 'synthetic',
      name: 'Synthetic cursor screen',
      kind: 'video',
      width: 1600,
      height: 1000,
      duration: 12,
      peaks: [],
      hasAudio: false,
      thumbnail: '',
      url: URL.createObjectURL(source),
      cursor,
    };
    const encoded = await renderVideo({
      assets: [asset],
      clips,
      layout,
      zooms,
      muted: [],
      width: 1920,
      onProgress: () => {},
    });
    const input = new Input({ source: new BlobSource(encoded), formats: ALL_FORMATS });
    const pixels: number[][] = [];
    try {
      const track = await input.getPrimaryVideoTrack();
      const sink = new CanvasSink(track, { width: 1280 });
      // Hand-derived stage probes. Frame 3 includes the full 1.2 zoom, not only cover crop.
      for (const [frame, x, y] of [
        [3, 925, 364],
        [0, 1178, 154],
        [5, 430, 511],
      ]) {
        const decoded = await sink.getCanvas((frame + 0.01) / 30);
        pixels.push(Array.from(decoded.canvas.getContext('2d').getImageData(x, y, 1, 1).data));
      }
    } finally {
      input.dispose();
      URL.revokeObjectURL(asset.url);
    }
    const stationary = {
      ...cursor,
      offsetMs: -1200,
      recording: {
        ...cursor.recording,
        samples: Array.from({ length: 24 }, (_, i) => ({
          timeMs: i * 100,
          cx: 0.6 + (i % 2) * 0.002,
          cy: 0.1,
          assetId: 'synthetic',
        })),
      },
    };
    for (const variant of [
      {
        cursor: { ...cursor, settings: { ...cursor.settings, style: 'touch', ending: 'loop' } },
        probes: [
          [0, 1178, 150],
          [2, 1178, 150],
        ],
      },
      {
        cursor: {
          ...stationary,
          settings: { ...cursor.settings, hideIdle: true, removeShakes: true },
        },
        probes: [[0, 1010, 80]],
      },
      {
        cursor: {
          ...stationary,
          settings: { ...cursor.settings, hideIdle: true, removeShakes: false },
        },
        probes: [[0, 1010, 80]],
      },
      {
        cursor: {
          ...cursor,
          settings: { ...cursor.settings, hiddenRanges: [{ startMs: 100, endMs: 200 }] },
        },
        probes: [[0, 1178, 154]],
      },
    ]) {
      const url = URL.createObjectURL(source);
      try {
        const rendered = await renderVideo({
          assets: [{ ...asset, url, cursor: variant.cursor }],
          clips,
          layout,
          zooms: [],
          muted: [],
          width: 1920,
          onProgress: () => {},
        });
        const decoded = new Input({ source: new BlobSource(rendered), formats: ALL_FORMATS });
        try {
          const track = await decoded.getPrimaryVideoTrack();
          const sink = new CanvasSink(track, { width: 1280 });
          for (const [frame, x, y] of variant.probes) {
            const picture = await sink.getCanvas((frame + 0.01) / 30);
            pixels.push(Array.from(picture.canvas.getContext('2d').getImageData(x, y, 1, 1).data));
          }
        } finally {
          decoded.dispose();
        }
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    const data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
      };
      reader.readAsDataURL(source);
    });
    return {
      pixels,
      project: JSON.stringify({
        version: 2,
        fps: 30,
        clips,
        zooms,
        layout,
        muted: [],
        media: [{ id: asset.id, name: asset.name, data, cursor }],
      }),
    };
  });
  for (const [red, green, blue] of [...result.pixels.slice(0, 3), result.pixels[6]]) {
    expect(red).toBeGreaterThan(220);
    expect(green).toBeLessThan(40);
    expect(blue).toBeGreaterThan(220);
  }
  for (const pixel of result.pixels.slice(3, 5))
    for (const channel of pixel.slice(0, 3)) {
      expect(channel).toBeGreaterThan(160);
      expect(channel).toBeLessThan(210);
    }
  for (const channel of result.pixels[5].slice(0, 3)) expect(channel).toBeLessThan(40);
  for (const channel of result.pixels[7].slice(0, 3)) expect(channel).toBeLessThan(40);
  await page.getByLabel('Open local project').setInputFiles({
    name: 'synthetic-cursor.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(result.project),
  });
  const cursor = page.getByTestId('cursor-preview');
  await expect(cursor).toBeVisible();
  expect(
    await cursor.evaluate((element) => parseFloat(getComputedStyle(element).left)),
  ).toBeCloseTo(773.7 * 1.5);
  expect(await cursor.evaluate((element) => parseFloat(getComputedStyle(element).top))).toBeCloseTo(
    136.5 * 1.5,
  );
  for (let frame = 0; frame < 3; frame++)
    await page.getByRole('button', { name: 'Next frame', exact: true }).click();
  expect(
    await cursor.evaluate((element) => parseFloat(getComputedStyle(element).left)),
  ).toBeCloseTo(493.7 * 1.5);
  expect(await cursor.evaluate((element) => parseFloat(getComputedStyle(element).top))).toBeCloseTo(
    346.5 * 1.5,
  );
  await page.getByLabel('Cursor style', { exact: true }).selectOption('touch');
  await page.getByText('Advanced cursor', { exact: true }).click();
  await page.getByLabel('Cursor ending', { exact: true }).selectOption('loop');
  for (let frame = 0; frame < 3; frame++)
    await page.getByRole('button', { name: 'Previous frame', exact: true }).click();
  expect(
    await cursor.evaluate((element) => parseFloat(getComputedStyle(element).left)),
  ).toBeCloseTo(757.6 * 1.5);
  expect(await cursor.evaluate((element) => parseFloat(getComputedStyle(element).top))).toBeCloseTo(
    117.6 * 1.5,
  );
  for (let frame = 0; frame < 2; frame++)
    await page.getByRole('button', { name: 'Next frame', exact: true }).click();
  expect(
    await cursor.evaluate((element) => parseFloat(getComputedStyle(element).left)),
  ).toBeCloseTo(757.6 * 1.5);
  expect(await cursor.evaluate((element) => parseFloat(getComputedStyle(element).top))).toBeCloseTo(
    117.6 * 1.5,
  );
  await page.getByLabel('Hide cursor', { exact: true }).check();
  await expect(cursor).toHaveCount(0);
  await page.getByLabel('Hide cursor', { exact: true }).uncheck();
  await page.getByLabel('Cursor ending', { exact: true }).selectOption('none');
  await page.getByLabel('Hide cursor from (source seconds)').fill('0.1');
  await page.getByLabel('Hide cursor until (source seconds)').fill('0.2');
  await page.getByRole('button', { name: 'Add hidden range', exact: true }).click();
  await expect(cursor).toHaveCount(0);
  await page.getByRole('button', { name: 'Next frame', exact: true }).click();
  await expect(cursor).toBeVisible();
  await page.getByRole('button', { name: 'Previous frame', exact: true }).click();
  await expect(cursor).toHaveCount(0);
  await page.getByRole('button', { name: 'Remove hidden range 1', exact: true }).click();
  await expect(cursor).toBeVisible();
});

test('the front screen-role clip owns the cursor and framing in preview, Copy frame and export', async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const result = await page.evaluate(async () => {
    const bunnyModule = '/node_modules/mediabunny/dist/bundles/mediabunny.mjs';
    const exportModule = '/src/export.ts';
    const modelModule = '/src/timeline-model.ts';
    const {
      Output,
      WebMOutputFormat,
      BufferTarget,
      CanvasSource,
      Input,
      BlobSource,
      ALL_FORMATS,
      CanvasSink,
    } = await import(bunnyModule);
    const { renderVideo, renderFrameImage } = await import(exportModule);
    const { DEFAULT_TRACKS } = await import(modelModule);
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1000;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#181818';
    context.fillRect(0, 0, 1600, 1000);
    const target = new BufferTarget();
    const output = new Output({ format: new WebMOutputFormat(), target });
    const video = new CanvasSource(canvas, { codec: 'vp9', bitrate: 500000 });
    output.addVideoTrack(video, { frameRate: 30 });
    await output.start();
    for (let frame = 0; frame < 12; frame++) await video.add(frame / 30, 1 / 30);
    video.close();
    await output.finalize();
    const source = new Blob([target.buffer], { type: 'video/webm' });
    const sidecar = (color: string, mirror: boolean) => {
      const bitmap = document.createElement('canvas');
      bitmap.width = 20;
      bitmap.height = 10;
      const paint = bitmap.getContext('2d')!;
      paint.fillStyle = color;
      paint.fillRect(0, 0, 20, 10);
      const at = (v: number) => (mirror ? 1 - v : v);
      return {
        recording: {
          version: 2,
          provider: 'native',
          samples: [
            { timeMs: 0, cx: at(0.6), cy: at(0.1), assetId: 'synthetic' },
            { timeMs: 100, cx: at(0.9), cy: at(0.3), assetId: 'synthetic' },
            { timeMs: 200, cx: at(0.1), cy: at(0.7), assetId: 'synthetic' },
          ],
          assets: [
            {
              id: 'synthetic',
              platform: 'synthetic',
              imageDataUrl: bitmap.toDataURL(),
              width: 20,
              height: 10,
              hotspotX: 4.5,
              hotspotY: 2.5,
              scaleFactor: 1,
            },
          ],
        },
        offsetMs: 50,
        settings: { mode: 'raw', size: 2, hidden: false },
      };
    };
    const asset = (id: string, cursor: ReturnType<typeof sidecar>) => ({
      id,
      name: `Synthetic ${id}`,
      kind: 'video',
      width: 1600,
      height: 1000,
      duration: 12,
      peaks: [],
      hasAudio: false,
      thumbnail: '',
      url: URL.createObjectURL(source),
      cursor,
    });
    // V1 moves the other way in magenta; V3 is the first test's cyan cursor.
    const back = asset('back', sidecar('#ff00ff', true));
    const front = asset('front', sidecar('#00ffff', false));
    const layout = {
      radius: 22,
      swapped: true,
      screenX: 25,
      screenY: 80,
      cameraX: 50,
      cameraY: 50,
    };
    const tracks = [
      ...DEFAULT_TRACKS,
      { id: 's2', label: 'Screen 2 · Masked', kind: 'visual', role: 'screen' },
    ];
    const v3 = [
      { id: 'a', assetId: 'front', track: 's2', start: 0, duration: 3, offset: 3 },
      { id: 'b', assetId: 'front', track: 's2', start: 3, duration: 3, offset: 6 },
    ];
    const v1 = { id: 'under', assetId: 'back', track: 'screen', start: 0, duration: 9, offset: 0 };
    const still = [{ id: 'zoom', start: 0, duration: 6, scale: 1.2, x: 50, y: 50 }];
    const follow = [{ ...still[0], follow: 'focused' }];
    const assets = [back, front];
    const pixel = (canvas: HTMLCanvasElement | OffscreenCanvas, x: number, y: number) =>
      Array.from(
        (canvas.getContext('2d') as CanvasRenderingContext2D).getImageData(x, y, 1, 1).data,
      );
    const stage = async (blob: Blob) => {
      const image = await createImageBitmap(blob);
      const copy = document.createElement('canvas');
      copy.width = 1280;
      copy.height = 720;
      copy.getContext('2d')!.drawImage(image, 0, 0, 1280, 720);
      return copy;
    };
    const exported = async (edit: object) => {
      const encoded = await renderVideo({ ...edit, muted: [], width: 1920, onProgress: () => {} });
      const input = new Input({ source: new BlobSource(encoded), formats: ALL_FORMATS });
      const frames = [];
      const sink = new CanvasSink(await input.getPrimaryVideoTrack(), { width: 1280 });
      for (const frame of [0, 3, 5])
        frames.push((await sink.getCanvas((frame + 0.01) / 30)).canvas);
      return { frames, input };
    };
    // Count magenta pixels anywhere on the stage: V1's cursor must never draw.
    const magenta = (canvas: HTMLCanvasElement | OffscreenCanvas) => {
      const { data } = (canvas.getContext('2d') as CanvasRenderingContext2D).getImageData(
        0,
        0,
        1280,
        720,
      );
      let count = 0;
      for (let i = 0; i < data.length; i += 4)
        if (data[i] > 200 && data[i + 1] < 60 && data[i + 2] > 200) count++;
      return count;
    };
    const report = {
      copy: [] as number[],
      export: [] as number[][],
      overlapCopies: [] as { worst: number; magenta: number }[],
      overlapExport: [] as { worst: number; magenta: number }[],
    };
    try {
      // 1. V3 alone, still zoom: the first test's hand-derived probes hit V3's cursor.
      const alone = { assets, clips: v3, layout, zooms: still, tracks };
      report.copy = pixel(
        await stage(await renderFrameImage({ ...alone, frame: 0, width: 1920 })),
        1178,
        154,
      );
      const solo = await exported(alone);
      report.export = [
        pixel(solo.frames[1], 925, 364),
        pixel(solo.frames[0], 1178, 154),
        pixel(solo.frames[2], 430, 511),
      ];
      solo.input.dispose();
      // 2. V1 under V3 with a follow zoom: identical to V3 alone, so cursor and camera follow V3.
      const only = { assets, clips: v3, layout, zooms: follow, tracks };
      const both = { ...only, clips: [v1, ...v3] };
      const copies = [];
      for (const frame of [0, 3, 5]) {
        const a = await stage(await renderFrameImage({ ...only, frame, width: 1920 }));
        const b = await stage(await renderFrameImage({ ...both, frame, width: 1920 }));
        const da = a.getContext('2d')!.getImageData(0, 0, 1280, 720).data;
        const db = b.getContext('2d')!.getImageData(0, 0, 1280, 720).data;
        // V1 shows only through V3's anti-aliased mask corners; a moved cursor differs by > 200.
        let worst = 0;
        for (let i = 0; i < da.length; i++) worst = Math.max(worst, Math.abs(da[i] - db[i]));
        copies.push({ worst, magenta: magenta(b) });
      }
      report.overlapCopies = copies;
      const reference = await exported(only);
      const overlap = await exported(both);
      report.overlapExport = overlap.frames.map((frame, i) => {
        const da = reference.frames[i].getContext('2d').getImageData(0, 0, 1280, 720).data;
        const db = frame.getContext('2d').getImageData(0, 0, 1280, 720).data;
        let worst = 0;
        for (let j = 0; j < da.length; j++) worst = Math.max(worst, Math.abs(da[j] - db[j]));
        return { worst, magenta: magenta(frame) };
      });
      reference.input.dispose();
      overlap.input.dispose();
    } finally {
      for (const item of assets) URL.revokeObjectURL(item.url);
    }
    const data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(source);
    });
    const project = (clips: object[], zooms: object[]) =>
      JSON.stringify({
        version: 4,
        fps: 30,
        tracks,
        clips,
        zooms,
        layout,
        muted: [],
        media: assets.map((item) => ({ id: item.id, name: item.name, data, cursor: item.cursor })),
      });
    return {
      ...report,
      front: front.cursor.recording.assets[0].imageDataUrl,
      alone: project(v3, still),
      only: project(v3, follow),
      both: project([v1, ...v3], follow),
    };
  });
  const cyan = ([red, green, blue]: number[]) => {
    expect(red).toBeLessThan(40);
    expect(green).toBeGreaterThan(220);
    expect(blue).toBeGreaterThan(220);
  };
  cyan(result.copy);
  for (const probe of result.export) cyan(probe);
  // Copy frame is lossless; export compares two separate lossy encodes, so report its margin.
  const worst = {
    copy: result.overlapCopies.map((frame) => frame.worst),
    export: result.overlapExport.map((frame) => frame.worst),
  };
  test
    .info()
    .annotations.push({ type: 'worst channel difference', description: JSON.stringify(worst) });
  console.log(`worst channel difference ${JSON.stringify(worst)}`);
  for (const frame of [...result.overlapCopies, ...result.overlapExport]) {
    expect(frame.magenta).toBe(0);
    expect(frame.worst).toBeLessThan(24);
  }
  page.on('dialog', (dialog) => dialog.accept());
  // Each file has a different clip count from the one before it, so the count shows it opened.
  const open = async (name: string, project: string, clips: number) => {
    await page.getByLabel('Open local project').setInputFiles({
      name,
      mimeType: 'application/json',
      buffer: Buffer.from(project),
    });
    await expect(page.locator('.timeline-clip')).toHaveCount(clips);
  };

  const cursor = page.getByTestId('cursor-preview');
  const view = async () => {
    for (let frame = 0; frame < 5; frame++)
      await page.getByRole('button', { name: 'Next frame', exact: true }).click();
    return {
      src: await cursor.getAttribute('src'),
      left: await cursor.evaluate((element) => getComputedStyle(element).left),
      camera: await page
        .getByTestId('s2-content')
        .evaluate((element) => getComputedStyle(element).transform),
    };
  };
  await open('second-screen-alone.clipper.json', result.alone, 2);
  await expect(page.getByTestId('s2-content').getByTestId('cursor-preview')).toBeVisible();
  await expect(cursor).toHaveCount(1);
  expect(
    await cursor.evaluate((element) => parseFloat(getComputedStyle(element).left)),
  ).toBeCloseTo(773.7 * 1.5);
  // The inspector edits the V3 clip's sidecar, and the edit reaches V3's overlay.
  await page.locator('.timeline-clip').first().click();
  await page.getByLabel('Hide cursor', { exact: true }).check();
  await expect(cursor).toHaveCount(0);
  await open('second-screen-both.clipper.json', result.both, 3);
  await expect(cursor).toHaveCount(1);
  await expect(page.getByTestId('s2-content').getByTestId('cursor-preview')).toBeVisible();
  const overlap = await view();
  await open('second-screen-only.clipper.json', result.only, 2);
  expect(overlap).toEqual({ ...(await view()), src: result.front });
});
