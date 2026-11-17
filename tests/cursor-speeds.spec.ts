import { expect, test } from '@playwright/test';

test('renders distinct cursor speed styles with default pixel parity through offsets and repeated cuts', async ({
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
          { timeMs: 0, cx: 0.2, cy: 0.3, assetId: 'bar' },
          { timeMs: 200, cx: 0.7, cy: 0.3, assetId: 'bar', interactionType: 'click' },
          { timeMs: 400, cx: 0.4, cy: 0.3, assetId: 'bar' },
        ],
        assets: [
          {
            id: 'bar',
            platform: 'synthetic',
            imageDataUrl: bitmap.toDataURL(),
            width: 20,
            height: 10,
            hotspotX: 4.5,
            hotspotY: 2.5,
          },
        ],
      },
      offsetMs: 50,
      settings: { mode: 'smooth', size: 2, hidden: false },
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
      { id: 'a', assetId: 'synthetic', track: 'screen', start: 0, duration: 7, offset: 3 },
      { id: 'b', assetId: 'synthetic', track: 'screen', start: 7, duration: 7, offset: 3 },
    ];
    const asset = {
      id: 'synthetic',
      name: 'Synthetic cursor speed styles',
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
    const pixels: number[][][] = [];
    const defaults = new Map<number, Uint8ClampedArray>();
    let defaultDifference = 0;
    try {
      for (const animationStyle of [undefined, 'smooth', 'medium', 'rapid', 'none']) {
        const encoded = await renderVideo({
          assets: [
            { ...asset, cursor: { ...cursor, settings: { ...cursor.settings, animationStyle } } },
          ],
          clips,
          layout,
          zooms: [],
          muted: [],
          width: 1920,
          onProgress: () => {},
        });
        const decoded = new Input({ source: new BlobSource(encoded), formats: ALL_FORMATS });
        const probes: number[][] = [];
        try {
          const track = await decoded.getPrimaryVideoTrack();
          const sink = new CanvasSink(track, { width: 1280 });
          for (const frame of [0, 3, 6, 7, 10, 13]) {
            const picture = await sink.getCanvas((frame + 0.01) / 30);
            const drawn = picture.canvas.getContext('2d');
            if (!animationStyle) defaults.set(frame, drawn.getImageData(0, 0, 1280, 720).data);
            if (animationStyle === 'smooth') {
              const previous = defaults.get(frame)!;
              drawn.getImageData(0, 0, 1280, 720).data.forEach((value: number, i: number) => {
                defaultDifference = Math.max(defaultDifference, Math.abs(value - previous[i]));
              });
            }
            if (frame === 3 || frame === 10)
              // Source 200 ms minus 50 ms offset gives t=.75, with a zero tangent at the click.
              // Hand-derived normalized x: .6453125, .6074074074, .5125, .2.
              probes.push(
                ...[1063, 1020, 914, 564].map((x) =>
                  Array.from<number>(drawn.getImageData(x, 220, 1, 1).data),
                ),
              );
          }
        } finally {
          decoded.dispose();
        }
        pixels.push(probes);
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
      defaultDifference,
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
  expect(result.defaultDifference).toBeLessThan(35);
  result.pixels.forEach((probes, style) => {
    const selected = style === 0 ? 0 : style - 1;
    for (const [index, pixel] of probes.entries()) {
      const expected = index % 4 === selected ? [255, 0, 255] : [24, 24, 24];
      for (const [channel, value] of expected.entries())
        expect(Math.abs(pixel[channel] - value)).toBeLessThan(35);
    }
  });
  await page.getByLabel('Open local project').setInputFiles({
    name: 'synthetic-speed-styles.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(result.project),
  });
  const animation = page.getByLabel('Cursor animation style', { exact: true });
  const cursor = page.getByTestId('cursor-preview');
  for (let frame = 0; frame < 3; frame++)
    await page.getByRole('button', { name: 'Next frame', exact: true }).click();
  await expect
    .poll(() => cursor.evaluate((element) => parseFloat(getComputedStyle(element).left)))
    .toBeCloseTo(656.45 * 1.5);
  const mask = page.getByTestId('screen-mask');
  const original = await mask.screenshot();
  await animation.selectOption('smooth');
  expect(await mask.screenshot()).toEqual(original);
  for (const [style, x] of [
    ['smooth', 656.45],
    ['medium', 613.9962962962964],
    ['rapid', 507.7],
    ['none', 157.7],
  ] as const) {
    await animation.selectOption(style);
    await page.getByRole('button', { name: 'Go to start', exact: true }).click();
    for (let frame = 0; frame < 3; frame++)
      await page.getByRole('button', { name: 'Next frame', exact: true }).click();
    await expect
      .poll(() => cursor.evaluate((element) => parseFloat(getComputedStyle(element).left)))
      .toBeCloseTo(x * 1.5);
    for (let frame = 0; frame < 7; frame++)
      await page.getByRole('button', { name: 'Next frame', exact: true }).click();
    await expect
      .poll(() => cursor.evaluate((element) => parseFloat(getComputedStyle(element).left)))
      .toBeCloseTo(x * 1.5);
    for (let frame = 0; frame < 7; frame++)
      await page.getByRole('button', { name: 'Previous frame', exact: true }).click();
    await expect
      .poll(() => cursor.evaluate((element) => parseFloat(getComputedStyle(element).left)))
      .toBeCloseTo(x * 1.5);
  }
});
