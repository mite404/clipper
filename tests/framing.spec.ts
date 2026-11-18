import { expect, test } from '@playwright/test';
import { choose } from './choice';

for (const width of [1920, 3840]) {
  for (const target of [
    { cx: 0.65, frame: 16, left: 543.333 },
    { cx: 0.95, frame: 25, left: 790.694 },
  ]) {
    test(`follows source x=${target.cx} at ${width}px identically in preview and export, with seek-stable camera and editable styles`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(60000);
      await page.goto('/');
      await expect(page.getByTestId('media-status')).toHaveText('4 assets ready');
      const fixture = await page.evaluate(
        async (target) => {
          const mediaModule = '/src/media.ts',
            exportModule = '/src/export.ts';
          const bunnyModule = '/node_modules/mediabunny/dist/bundles/mediabunny.mjs';
          const { loadDemo } = await import(mediaModule);
          const { renderVideo } = await import(exportModule);
          const { Input, BlobSource, ALL_FORMATS, CanvasSink } = await import(bunnyModule);
          const assets = await loadDemo();
          const asset = assets[0];
          const bitmap = document.createElement('canvas');
          bitmap.width = bitmap.height = 16;
          const paint = bitmap.getContext('2d')!;
          paint.fillStyle = '#ff00ff';
          paint.fillRect(0, 0, 16, 16);
          const cursor = {
            offsetMs: 0,
            recording: {
              version: 2,
              provider: 'native',
              assets: [
                {
                  id: 'arrow',
                  platform: 'synthetic',
                  width: 16,
                  height: 16,
                  hotspotX: 0,
                  hotspotY: 0,
                  scaleFactor: 1,
                  imageDataUrl: bitmap.toDataURL(),
                },
              ],
              samples: Array.from({ length: 31 }, (_, frame) => ({
                timeMs: (frame * 1000) / 30,
                cx: frame < 10 ? 0.5 : target.cx,
                cy: 0.5,
                assetId: 'arrow',
              })),
            },
          };
          asset.cursor = cursor;
          const clips = [
            { id: 'take', assetId: asset.id, track: 'screen', start: 0, offset: 0, duration: 30 },
          ];
          const layout = { radius: 22, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 };
          const zooms = [
            {
              id: 'z',
              start: 0,
              duration: 30,
              scale: 2,
              x: 50,
              y: 50,
              follow: 'focused',
              instant: true,
            },
          ];
          const encoded = await renderVideo({
            assets,
            clips,
            layout,
            zooms,
            muted: [],
            width: target.width,
            onProgress: () => {},
          });
          const input = new Input({ source: new BlobSource(encoded), formats: ALL_FORMATS });
          let pixel;
          try {
            const track = await input.getPrimaryVideoTrack();
            const decoded = await new CanvasSink(track, { width: 1280 }).getCanvas(
              (target.frame + 0.01) / 30,
            );
            pixel = Array.from(
              decoded.canvas.getContext('2d').getImageData(target.left + 6, 365, 1, 1).data,
            );
          } finally {
            input.dispose();
          }
          const blob = await (await fetch(asset.url)).blob();
          const data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') resolve(reader.result);
            };
            reader.readAsDataURL(blob);
          });
          for (const item of assets) URL.revokeObjectURL(item.url);
          return {
            pixel,
            project: JSON.stringify({
              version: 2,
              fps: 30,
              clips,
              layout,
              zooms,
              muted: [],
              media: [{ id: asset.id, name: asset.name, data, cursor }],
            }),
          };
        },
        { ...target, width },
      );
      expect(fixture.pixel[0]).toBeGreaterThan(220);
      expect(fixture.pixel[1]).toBeLessThan(50);
      expect(fixture.pixel[2]).toBeGreaterThan(220);
      await page.getByLabel('Open local project').setInputFiles({
        name: 'follow.clipper.json',
        mimeType: 'application/json',
        buffer: Buffer.from(fixture.project),
      });
      await choose(page.getByRole('combobox', { name: 'Export resolution' }), String(width));
      await expect(page.getByTestId('screen-mask')).toHaveCSS('width', `${(width * 880) / 1280}px`);
      const scrub = page.getByLabel('Timeline playhead', { exact: true });
      await scrub.fill(String(target.frame));
      const mask = await page.getByTestId('screen-mask').boundingBox();
      const cursor = await page.getByTestId('cursor-preview').boundingBox();
      expect(((cursor!.x - mask!.x) / mask!.width) * 880).toBeCloseTo(target.left - 10, 0);
      const content = page.getByTestId('screen-content');
      const transform = await content.evaluate((element) => getComputedStyle(element).transform);
      for (const frame of ['28', '1', '10', String(target.frame)]) await scrub.fill(frame);
      await expect(content).toHaveCSS('transform', transform);
      if (target.cx > 0.9) {
        const video = await page.getByTestId('screen-mask').locator('video').boundingBox();
        expect(video!.x + video!.width).toBeGreaterThanOrEqual(mask!.x + mask!.width - 1);
        await page.screenshot({ path: testInfo.outputPath('cropped-edge.png') });
      }
      await expect(page.getByTestId('camera-content')).toHaveCSS(
        'transform',
        'matrix(1, 0, 0, 1, 0, 0)',
      );
      await page.getByRole('button', { name: 'Select zoom', exact: true }).click();
      await expect(page.getByLabel('Camera follow')).toHaveValue('focused');
      await choose(page.getByLabel('Camera follow'), 'smooth');
      await expect(content).not.toHaveCSS('transform', transform);
      await choose(page.getByLabel('Camera follow'), 'fixed');
      await page.getByLabel('Instant zoom').uncheck();
      await scrub.fill('0');
      await expect(content).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
    });
  }
}

// Mask fraction u shows source fraction source(u) in each case. A 1.4x zoom at 83%, 87% clamps at
// the bottom-right edge. A 3x Fast then settle ramp is a third in at frame 2 of its 6-frame ramp:
// x(u) = 1/3 at u ≈ 0.54, so it has eased 1 - 0.46³ ≈ 0.903 of the way, a 2.805x scale about the
// centre; smoothstep would be 1 + 2 · 7/27 ≈ 1.519x there.
for (const { title, zoom, frame, source, smooth } of [
  {
    title: 'a 1.4x zoom focused at 83%, 87% stops at the source edge',
    zoom: { id: 'z', start: 0, duration: 12, scale: 1.4, x: 83, y: 87, instant: true },
    frame: 6,
    source: (u: number) => (u + 0.4) / 1.4,
    smooth: undefined,
  },
  {
    title: 'a Fast then settle zoom ramp eases to the same scale',
    zoom: { id: 'z', start: 0, duration: 12, scale: 3, x: 50, y: 50, curve: [0.16, 1, 0.3, 1] },
    frame: 2,
    source: (u: number) => 0.5 + (u - 0.5) / 2.805,
    smooth: (u: number) => 0.5 + (u - 0.5) / 1.519,
  },
])
  test(`${title} in preview, Copy frame and export`, async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/');
    await expect(page.getByTestId('media-status')).toHaveText('4 assets ready');
    // Mask-local probes near each corner and the centre, as fractions of the 880x700 screen mask.
    const probes = [
      [0.05, 0.05],
      [0.95, 0.05],
      [0.05, 0.95],
      [0.95, 0.95],
      [0.5, 0.5],
    ];
    const fixture = await page.evaluate(
      async ({ probes, zoom, frame }) => {
        const exportModule = '/src/export.ts';
        const modelModule = '/src/timeline-model.ts';
        const bunnyModule = '/node_modules/mediabunny/dist/bundles/mediabunny.mjs';
        const { renderVideo, renderFrameImage } = await import(exportModule);
        const { DEFAULT_TRACKS } = await import(modelModule);
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
        // Same aspect as the mask, so cover equals the mask: red follows source x, blue source y.
        const canvas = document.createElement('canvas');
        canvas.width = 880;
        canvas.height = 700;
        const paint = canvas.getContext('2d')!;
        for (let x = 0; x < 880; x += 4)
          for (let y = 0; y < 700; y += 4) {
            paint.fillStyle = `rgb(${Math.round((x / 880) * 255)}, 128, ${Math.round((y / 700) * 255)})`;
            paint.fillRect(x, y, 4, 4);
          }
        const target = new BufferTarget();
        const output = new Output({ format: new WebMOutputFormat(), target });
        const video = new CanvasSource(canvas, { codec: 'vp9', bitrate: 4000000 });
        output.addVideoTrack(video, { frameRate: 30 });
        await output.start();
        for (let frame = 0; frame < 12; frame++) await video.add(frame / 30, 1 / 30);
        video.close();
        await output.finalize();
        const source = new Blob([target.buffer], { type: 'video/webm' });
        const asset = {
          id: 'gradient',
          name: 'Synthetic gradient',
          kind: 'video',
          width: 880,
          height: 700,
          duration: 12,
          peaks: [],
          hasAudio: false,
          thumbnail: '',
          url: URL.createObjectURL(source),
        };
        const clips = [
          { id: 'take', assetId: 'gradient', track: 'screen', start: 0, duration: 12, offset: 0 },
        ];
        const layout = { radius: 22, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 };
        const zooms = [zoom];
        const edit = { assets: [asset], clips, layout, zooms, tracks: DEFAULT_TRACKS };
        // Stage probe for a mask-local fraction: the screen mask is 880x700 at (10, 10).
        const read = (context: CanvasRenderingContext2D) =>
          probes.map(([u, v]) =>
            Array.from(
              context.getImageData(Math.round(10 + u * 880), Math.round(10 + v * 700), 1, 1).data,
            ),
          );
        let copy, exported;
        try {
          const image = await createImageBitmap(
            await renderFrameImage({ ...edit, frame, width: 1920 }),
          );
          const stage = document.createElement('canvas');
          stage.width = 1280;
          stage.height = 720;
          const context = stage.getContext('2d')!;
          context.drawImage(image, 0, 0, 1280, 720);
          copy = read(context);
          const encoded = await renderVideo({
            ...edit,
            muted: [],
            width: 1920,
            onProgress: () => {},
          });
          const input = new Input({ source: new BlobSource(encoded), formats: ALL_FORMATS });
          try {
            const sink = new CanvasSink(await input.getPrimaryVideoTrack(), { width: 1280 });
            exported = read((await sink.getCanvas((frame + 0.01) / 30)).canvas.getContext('2d'));
          } finally {
            input.dispose();
          }
        } finally {
          URL.revokeObjectURL(asset.url);
        }
        const data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(source);
        });
        return {
          copy,
          exported,
          project: JSON.stringify({
            version: 2,
            fps: 30,
            clips,
            zooms,
            layout,
            muted: [],
            media: [{ id: asset.id, name: asset.name, data }],
          }),
        };
      },
      { probes, zoom, frame },
    );
    await page.getByLabel('Open local project').setInputFiles({
      name: 'edge-zoom.clipper.json',
      mimeType: 'application/json',
      buffer: Buffer.from(fixture.project),
    });
    await page.getByLabel('Timeline playhead', { exact: true }).fill(String(frame));
    const mask = page.getByTestId('screen-mask');
    await expect(mask.locator('video')).toHaveCount(1);
    await page.waitForTimeout(500);
    const box = (await mask.boundingBox())!;
    const shot = await mask.screenshot();
    const preview = await page.evaluate(
      async ({ png, probes }) => {
        const image = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${png}`)).blob(),
        );
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        return probes.map(([u, v]) =>
          Array.from(
            context.getImageData(Math.round(u * image.width), Math.round(v * image.height), 1, 1)
              .data,
          ),
        );
      },
      { png: shot.toString('base64'), probes },
    );
    expect(box.width).toBeGreaterThan(0);
    const expected = probes.map(([u, v]) => [source(u) * 255, 128, source(v) * 255]);
    const worst = { preview: 0, copy: 0, export: 0 };
    for (const [name, pixels] of [
      ['preview', preview],
      ['copy', fixture.copy],
      ['export', fixture.exported],
    ] as const)
      pixels.forEach((pixel, i) => {
        for (let channel = 0; channel < 3; channel++)
          worst[name] = Math.max(worst[name], Math.abs(pixel[channel] - expected[i][channel]));
      });
    test
      .info()
      .annotations.push({ type: 'worst channel difference', description: JSON.stringify(worst) });
    console.log(`worst channel difference ${JSON.stringify(worst)}`);
    // Empty mask is #10181b: any probe on it misses the source green by over 100.
    expect(worst.copy).toBeLessThan(24);
    expect(worst.export).toBeLessThan(24);
    expect(worst.preview).toBeLessThan(24);
    // A ramp read on the smoothstep instead of its curve misses the edge probes by about 35.
    if (smooth)
      for (const pixel of [preview, fixture.copy, fixture.exported].map((pixels) => pixels[1]))
        expect(Math.abs(pixel[0] - smooth(0.95) * 255)).toBeGreaterThan(24);
  });

test('a top-left PiP camera inset lands in the same place in preview, Copy frame and export', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready');
  // Stage points: inside the 420 × 236.25 inset at (20, 20), and on the screen around it.
  const probes = [
    [40, 40],
    [420, 240],
    [470, 140],
    [230, 290],
    [1100, 600],
  ];
  const blue = [true, true, false, false, false];
  const fixture = await page.evaluate(async (probes) => {
    const exportModule = '/src/export.ts';
    const modelModule = '/src/timeline-model.ts';
    const bunnyModule = '/node_modules/mediabunny/dist/bundles/mediabunny.mjs';
    const { renderVideo, renderFrameImage } = await import(exportModule);
    const { DEFAULT_TRACKS } = await import(modelModule);
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
    // A solid 12-frame VP9 source in one colour.
    const solid = async (colour: string, width: number, height: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const paint = canvas.getContext('2d')!;
      paint.fillStyle = colour;
      paint.fillRect(0, 0, width, height);
      const target = new BufferTarget();
      const output = new Output({ format: new WebMOutputFormat(), target });
      const video = new CanvasSource(canvas, { codec: 'vp9', bitrate: 2000000 });
      output.addVideoTrack(video, { frameRate: 30 });
      await output.start();
      for (let frame = 0; frame < 12; frame++) await video.add(frame / 30, 1 / 30);
      video.close();
      await output.finalize();
      return new Blob([target.buffer], { type: 'video/webm' });
    };
    const sources = {
      red: await solid('#ff0000', 1280, 720),
      blue: await solid('#0000ff', 640, 360),
    };
    const assets = Object.entries(sources).map(([id, blob]) => ({
      id,
      name: `${id}.webm`,
      kind: 'video',
      width: id === 'red' ? 1280 : 640,
      height: id === 'red' ? 720 : 360,
      duration: 12,
      peaks: [],
      hasAudio: false,
      thumbnail: '',
      url: URL.createObjectURL(blob),
    }));
    const clips = [
      { id: 'main', assetId: 'red', track: 'screen', start: 0, duration: 12, offset: 0 },
      { id: 'inset', assetId: 'blue', track: 'camera', start: 0, duration: 12, offset: 0 },
    ];
    const layout = {
      mode: 'pip',
      corner: 'top-left',
      radius: 0,
      screenX: 50,
      screenY: 50,
      cameraX: 50,
      cameraY: 50,
    };
    const edit = { assets, clips, layout, zooms: [], tracks: DEFAULT_TRACKS };
    const read = (context: CanvasRenderingContext2D) =>
      probes.map(([x, y]) => Array.from(context.getImageData(x, y, 1, 1).data));
    let copy, exported;
    try {
      const image = await createImageBitmap(
        await renderFrameImage({ ...edit, frame: 6, width: 1920 }),
      );
      const stage = document.createElement('canvas');
      stage.width = 1280;
      stage.height = 720;
      const context = stage.getContext('2d')!;
      context.drawImage(image, 0, 0, 1280, 720);
      copy = read(context);
      const encoded = await renderVideo({ ...edit, muted: [], width: 1920, onProgress: () => {} });
      const input = new Input({ source: new BlobSource(encoded), formats: ALL_FORMATS });
      try {
        const sink = new CanvasSink(await input.getPrimaryVideoTrack(), { width: 1280 });
        exported = read((await sink.getCanvas(6.01 / 30)).canvas.getContext('2d'));
      } finally {
        input.dispose();
      }
    } finally {
      for (const asset of assets) URL.revokeObjectURL(asset.url);
    }
    const data = (blob: Blob) =>
      new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    const media = [];
    for (const asset of assets)
      media.push({ id: asset.id, name: asset.name, data: await data(sources[asset.id as 'red']) });
    return {
      copy,
      exported,
      project: JSON.stringify({ version: 2, fps: 30, clips, zooms: [], layout, muted: [], media }),
    };
  }, probes);
  await page.getByLabel('Open local project').setInputFiles({
    name: 'pip.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(fixture.project),
  });
  await page.getByLabel('Timeline playhead', { exact: true }).fill('6');
  await expect(page.getByTestId('camera-mask').locator('video')).toHaveCount(1);
  await page.waitForTimeout(500);
  // The PiP screen mask is 1260 × 700 at (10, 10), so it locates the whole stage on screen.
  const screen = (await page.getByTestId('screen-mask').boundingBox())!;
  const unit = screen.width / 1260;
  const shot = await page.screenshot({
    clip: {
      x: screen.x - 10 * unit,
      y: screen.y - 10 * unit,
      width: 1280 * unit,
      height: 720 * unit,
    },
    scale: 'css',
  });
  const preview = await page.evaluate(
    async ({ png, probes, unit }) => {
      const image = await createImageBitmap(
        await (await fetch(`data:image/png;base64,${png}`)).blob(),
      );
      const context = new OffscreenCanvas(image.width, image.height).getContext('2d')!;
      context.drawImage(image, 0, 0);
      return probes.map(([x, y]) =>
        Array.from(context.getImageData(Math.round(x * unit), Math.round(y * unit), 1, 1).data),
      );
    },
    { png: shot.toString('base64'), probes, unit },
  );
  for (const [name, pixels] of [
    ['preview', preview],
    ['copy', fixture.copy],
    ['export', fixture.exported],
  ] as const)
    pixels.forEach(([r, , b], i) =>
      expect({
        name,
        probe: probes[i],
        camera: b > 160 && r < 90,
        screen: r > 160 && b < 90,
      }).toEqual({ name, probe: probes[i], camera: blue[i], screen: !blue[i] }),
    );
});
