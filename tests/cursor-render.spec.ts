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
  for (const [red, green, blue] of result.pixels) {
    expect(red).toBeGreaterThan(220);
    expect(green).toBeLessThan(40);
    expect(blue).toBeGreaterThan(220);
  }
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
  await page.getByLabel('Hide cursor', { exact: true }).check();
  await expect(cursor).toHaveCount(0);
});
