import { expect, test } from '@playwright/test';
import { choose } from './choice';

test('stabilizes recorded shapes identically in preview and encoded frames through trimmed repeated source cuts', async ({
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
    await video.add(0, 0.4);
    video.close();
    await output.finalize();
    const source = new Blob([target.buffer], { type: 'video/webm' });
    const bitmap = document.createElement('canvas');
    bitmap.width = 20;
    bitmap.height = 10;
    const paint = bitmap.getContext('2d')!;
    const shapes = ['#ff00ff', '#00ff00'].map((color, index) => {
      paint.fillStyle = color;
      paint.fillRect(0, 0, 20, 10);
      return {
        id: String(index),
        platform: 'synthetic',
        imageDataUrl: bitmap.toDataURL(),
        width: 20,
        height: 10,
        hotspotX: 4.5,
        hotspotY: 2.5,
      };
    });
    const cursor = {
      recording: {
        version: 2,
        provider: 'native',
        assets: shapes,
        samples: [
          [0, '0'],
          [40, '1'],
          [90, '0'],
          [140, '1'],
          [240, '1'],
          [340, '1'],
        ].map(([timeMs, assetId]) => ({ timeMs, assetId, cx: 0.6, cy: 0.1 })),
      },
      offsetMs: 50,
      settings: { mode: 'raw', size: 2, hidden: false, stabilizeShapes: true },
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
      { id: 'b', assetId: 'synthetic', track: 'screen', start: 9, duration: 9, offset: 3 },
    ];
    const asset = {
      id: 'synthetic',
      name: 'Synthetic shape changes',
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
    const pixels: number[][] = [];
    try {
      for (const stabilizeShapes of [false, true]) {
        const rendered = await renderVideo({
          assets: [
            { ...asset, cursor: { ...cursor, settings: { ...cursor.settings, stabilizeShapes } } },
          ],
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
          // Source 100 ms, offset 50 ms: frames 0/3 retain magenta, frame 6 confirms green.
          for (const frame of [0, 3, 6, 9, 12, 15]) {
            const picture = await sink.getCanvas((frame + 0.01) / 30);
            pixels.push(
              Array.from(picture.canvas.getContext('2d').getImageData(1010, 80, 1, 1).data),
            );
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
      urls: shapes.map((shape) => shape.imageDataUrl),
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
  const green = [0, 255, 0];
  const magenta = [255, 0, 255];
  const expectedColors = [
    green,
    green,
    green,
    green,
    green,
    green,
    magenta,
    magenta,
    green,
    magenta,
    magenta,
    green,
  ];
  expect(result.pixels).toHaveLength(expectedColors.length);
  for (const [index, pixel] of result.pixels.entries())
    for (const [channel, expected] of expectedColors[index].entries())
      expect(Math.abs(pixel[channel] - expected)).toBeLessThan(35);
  await page.getByLabel('Open local project').setInputFiles({
    name: 'synthetic-shape-stabilization.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(result.project),
  });
  const cursor = page.getByTestId('cursor-preview');
  const stabilize = page.getByLabel('Stabilize recorded shapes', { exact: true });
  await expect(cursor).toHaveAttribute('src', result.urls[0]);
  await expect(stabilize).toBeChecked();
  await stabilize.uncheck();
  await expect(cursor).toHaveAttribute('src', result.urls[1]);
  await stabilize.check();
  for (const mode of ['raw', 'smooth']) {
    await choose(page.getByLabel('Cursor motion', { exact: true }), mode);
    await page.getByRole('button', { name: 'Go to start', exact: true }).click();
    for (let frame = 0; frame < 16; frame++) {
      if ([0, 3, 6, 9, 12, 15].includes(frame))
        await expect(cursor).toHaveAttribute('src', result.urls[frame % 9 >= 6 ? 1 : 0]);
      await page.getByRole('button', { name: 'Next frame', exact: true }).click();
    }
    for (let frame = 0; frame < 7; frame++)
      await page.getByRole('button', { name: 'Previous frame', exact: true }).click();
    await expect(cursor).toHaveAttribute('src', result.urls[0]);
  }
});
