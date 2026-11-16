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
  ).toBeCloseTo(773.7);
  expect(await cursor.evaluate((element) => parseFloat(getComputedStyle(element).top))).toBeCloseTo(
    136.5,
  );
  for (let frame = 0; frame < 3; frame++)
    await page.getByRole('button', { name: 'Next frame', exact: true }).click();
  expect(
    await cursor.evaluate((element) => parseFloat(getComputedStyle(element).left)),
  ).toBeCloseTo(493.7);
  expect(await cursor.evaluate((element) => parseFloat(getComputedStyle(element).top))).toBeCloseTo(
    346.5,
  );
  await page.getByLabel('Cursor style', { exact: true }).selectOption('touch');
  await page.getByText('Advanced cursor', { exact: true }).click();
  await page.getByLabel('Cursor ending', { exact: true }).selectOption('loop');
  for (let frame = 0; frame < 3; frame++)
    await page.getByRole('button', { name: 'Previous frame', exact: true }).click();
  expect(
    await cursor.evaluate((element) => parseFloat(getComputedStyle(element).left)),
  ).toBeCloseTo(757.6);
  expect(await cursor.evaluate((element) => parseFloat(getComputedStyle(element).top))).toBeCloseTo(
    117.6,
  );
  for (let frame = 0; frame < 2; frame++)
    await page.getByRole('button', { name: 'Next frame', exact: true }).click();
  expect(
    await cursor.evaluate((element) => parseFloat(getComputedStyle(element).left)),
  ).toBeCloseTo(757.6);
  expect(await cursor.evaluate((element) => parseFloat(getComputedStyle(element).top))).toBeCloseTo(
    117.6,
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
