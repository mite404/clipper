import { expect, test } from '@playwright/test';

test('rotates about the recorded hotspot in preview and encoded output with offsets, cuts and reverse seeks', async ({
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
    await video.add(0, 0.6);
    video.close();
    await output.finalize();
    const source = new Blob([target.buffer], { type: 'video/webm' });
    const bitmap = document.createElement('canvas');
    bitmap.width = 100;
    bitmap.height = 20;
    const paint = bitmap.getContext('2d')!;
    paint.fillStyle = '#ff00ff';
    paint.fillRect(0, 0, 100, 20);
    const cursor = {
      recording: {
        version: 2,
        provider: 'native',
        samples: [
          { timeMs: 0, cx: 0.3, cy: 0.3, assetId: 'bar' },
          { timeMs: 100, cx: 0.6, cy: 0.3, assetId: 'bar' },
          { timeMs: 200, cx: 0.3, cy: 0.3, assetId: 'bar' },
          { timeMs: 300, cx: 0.3, cy: 0.3, assetId: 'bar' },
          { timeMs: 400, cx: 0.3, cy: 0.3, assetId: 'bar' },
        ],
        assets: [
          {
            id: 'bar',
            platform: 'synthetic',
            imageDataUrl: bitmap.toDataURL(),
            width: 100,
            height: 20,
            hotspotX: 4.5,
            hotspotY: 2.5,
          },
        ],
      },
      offsetMs: 50,
      settings: { mode: 'raw', size: 2, hidden: false, rotate: true },
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
      { id: 'a', assetId: 'synthetic', track: 'screen', start: 0, duration: 9, offset: 3 },
      { id: 'b', assetId: 'synthetic', track: 'screen', start: 9, duration: 6, offset: 6 },
    ];
    const asset = {
      id: 'synthetic',
      name: 'Synthetic rotation',
      kind: 'video',
      width: 1600,
      height: 1000,
      duration: 18,
      peaks: [],
      hasAudio: false,
      thumbnail: '',
      url: URL.createObjectURL(source),
      cursor,
    };
    const pixels: number[][] = [];
    try {
      for (const rotate of [false, true]) {
        const encoded = await renderVideo({
          assets: [{ ...asset, cursor: { ...cursor, settings: { ...cursor.settings, rotate } } }],
          clips,
          layout,
          zooms: [],
          muted: [],
          width: 1920,
          onProgress: () => {},
        });
        const decoded = new Input({ source: new BlobSource(encoded), formats: ALL_FORMATS });
        try {
          const track = await decoded.getPrimaryVideoTrack();
          const sink = new CanvasSink(track, { width: 1280 });
          // At frame 2 the hotspot is (946,220), with a +12° lean. Local (110,40)
          // lies inside only the rotated bar. A center pivot misses this probe.
          // Frame 4 hotspot (722,220) leans -12°; local (110,-20) is inside only it.
          for (const [frame, x, y] of [
            [2, 1056, 260],
            [4, 832, 200],
            [9, 944, 260],
          ]) {
            const picture = await sink.getCanvas((frame + 0.01) / 30);
            pixels.push(Array.from(picture.canvas.getContext('2d').getImageData(x, y, 1, 1).data));
          }
        } finally {
          decoded.dispose();
        }
      }
    } finally {
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
        zooms: [],
        layout,
        muted: [],
        media: [{ id: asset.id, name: asset.name, data, cursor }],
      }),
    };
  });
  for (const pixel of [...result.pixels.slice(0, 3), result.pixels[5]])
    for (const channel of pixel.slice(0, 3)) expect(channel).toBeLessThan(40);
  for (const [red, green, blue] of result.pixels.slice(3, 5)) {
    expect(red).toBeGreaterThan(220);
    expect(green).toBeLessThan(40);
    expect(blue).toBeGreaterThan(220);
  }
  await page.getByLabel('Open local project').setInputFiles({
    name: 'synthetic-rotation.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(result.project),
  });
  const cursor = page.getByTestId('cursor-preview');
  const angle = () =>
    cursor.evaluate((element) => {
      const matrix = new DOMMatrix(getComputedStyle(element).transform);
      return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
    });
  await expect(page.getByLabel('Rotate with movement', { exact: true })).toBeChecked();
  await expect.poll(angle).toBeCloseTo(0);
  for (let frame = 1; frame <= 9; frame++) {
    await page.getByRole('button', { name: 'Next frame', exact: true }).click();
    if (frame === 2) {
      await expect.poll(angle).toBeCloseTo(12);
      await expect(cursor).toHaveCSS('transform-origin', '9.45px 5.25px');
      await expect(cursor).toHaveCSS('left', '824.55px');
    }
    if (frame === 4) await expect.poll(angle).toBeCloseTo(-12);
  }
  await expect.poll(angle).toBeCloseTo(0);
  for (let frame = 9; frame > 2; frame--)
    await page.getByRole('button', { name: 'Previous frame', exact: true }).click();
  await expect.poll(angle).toBeCloseTo(12);
  await page.getByLabel('Rotate with movement', { exact: true }).uncheck();
  await expect.poll(angle).toBeCloseTo(0);
});
