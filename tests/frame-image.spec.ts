import { expect, test } from '@playwright/test';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

type Fixture = {
  asset: unknown;
  clips: unknown[];
  layout: unknown;
};
type FrameWindow = Window & {
  __fx: Fixture;
  __render: (opts: Record<string, unknown>) => Promise<Blob>;
  // Decodes a PNG blob and reads pixels at 1280×720 stage coordinates.
  __read: (
    blob: Blob,
    points: [number, number][],
  ) => Promise<{ w: number; h: number; px: number[][] }>;
};

// Source frame i is a solid colour of hue i*20° with a white band over its 60-70% columns. Frames
// 0..17 are all distinct, so a wrong source frame is visible in one pixel.
const hue = (i: number) => {
  const f = (n: number) => {
    const k = (n + (i * 20) / 30) % 12;
    return Math.round(255 * (0.5 - 0.4 * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
};
const near = (a: number[], b: number[], tol = 32) => b.every((v, i) => Math.abs(a[i] - v) <= tol);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
});

for (const kind of ['png', 'jpeg'])
  test(`copies ${kind} still pixels with cover fit and split offsets at both resolutions`, async ({
    page,
  }) => {
    const result = await page.evaluate(async (kind) => {
      const mediaModule = '/src/media.ts',
        renderModule = '/src/export.ts';
      const { readMedia } = await import(mediaModule);
      const { renderFrameImage } = await import(renderModule);
      const projectModule = '/src/project.ts';
      const { serializeProject } = await import(projectModule);
      const c = document.createElement('canvas');
      c.width = 400;
      c.height = 200;
      const g = c.getContext('2d')!;
      g.fillStyle = '#ff0000';
      g.fillRect(0, 0, 200, 200);
      g.fillStyle = '#0000ff80';
      g.fillRect(200, 0, 100, 200);
      const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), `image/${kind}`));
      const asset = await readMedia(blob, `alpha.${kind}`);
      try {
        const options = {
          assets: [asset],
          clips: [
            { id: 'left', assetId: asset.id, track: 'screen', start: 1, duration: 2, offset: 0 },
            { id: 'right', assetId: asset.id, track: 'screen', start: 3, duration: 2, offset: 2 },
          ],
          zooms: [],
          layout: { radius: 22, screenX: 100, screenY: 50, cameraX: 50, cameraY: 50 },
        };
        const samples = [];
        for (const width of [1920, 3840])
          for (const frame of [0, 1, 3, 4]) {
            const bitmap = await createImageBitmap(
              await renderFrameImage({ ...options, width, frame }),
            );
            c.width = bitmap.width;
            c.height = bitmap.height;
            g.drawImage(bitmap, 0, 0);
            bitmap.close();
            samples.push(
              [25, 400, 850].map((x) =>
                Array.from(
                  g.getImageData(
                    Math.round((x * width) / 1280),
                    Math.round((300 * width) / 1280),
                    1,
                    1,
                  ).data,
                ),
              ),
            );
          }
        const project = await (await serializeProject(options, [asset], [])).file.text();
        return { samples, project };
      } finally {
        URL.revokeObjectURL(asset.url);
      }
    }, kind);
    for (let i = 0; i < result.samples.length; i++) {
      const expected =
        i % 4 === 0
          ? [
              [16, 24, 27],
              [16, 24, 27],
              [16, 24, 27],
            ]
          : [
              [255, 0, 0],
              kind === 'png' ? [8, 12, 141] : [0, 0, 128],
              kind === 'png' ? [16, 24, 27] : [0, 0, 0],
            ];
      result.samples[i].forEach((pixel, j) => expect(near(pixel, expected[j], 2)).toBe(true));
    }
    await page.getByLabel('Open local project').setInputFiles({
      name: 'pixels.clipper.json',
      mimeType: 'application/json',
      buffer: Buffer.from(result.project),
    });
    await expect(page.locator('.app-footer [role="status"]')).toContainText('Project reopened');
    await page.getByLabel('Timeline playhead', { exact: true }).fill('3');
    const mask = page.getByTestId('screen-mask');
    await expect(mask.locator('img').first()).toHaveJSProperty('naturalWidth', 400);
    const preview = (await mask.screenshot()).toString('base64');
    const px = await page.evaluate(async (preview) => {
      const bitmap = await createImageBitmap(
        await (await fetch(`data:image/png;base64,${preview}`)).blob(),
      );
      const c = document.createElement('canvas');
      c.width = bitmap.width;
      c.height = bitmap.height;
      const g = c.getContext('2d')!;
      g.drawImage(bitmap, 0, 0);
      bitmap.close();
      return [25, 400, 850].map((x) =>
        Array.from(
          g.getImageData(
            Math.round(((x - 10) / 880) * c.width),
            Math.round((290 / 700) * c.height),
            1,
            1,
          ).data,
        ),
      );
    }, preview);
    const expected = [
      [255, 0, 0],
      kind === 'png' ? [8, 12, 141] : [0, 0, 128],
      kind === 'png' ? [16, 24, 27] : [0, 0, 0],
    ];
    px.forEach((pixel, i) => expect(near(pixel, expected[i], 3)).toBe(true));
    await page.getByRole('button', { name: 'Copy frame', exact: true }).click();
    await expect(page.locator('.app-footer [role="status"]')).toContainText('copied');
    await expect(page.getByRole('region', { name: 'Notifications' })).toContainText('copied as');
    const copied = await page.evaluate(async () => {
      const [item] = await navigator.clipboard.read();
      const bitmap = await createImageBitmap(await item.getType('image/png'));
      const c = document.createElement('canvas');
      c.width = bitmap.width;
      c.height = bitmap.height;
      const g = c.getContext('2d')!;
      g.drawImage(bitmap, 0, 0);
      bitmap.close();
      return [25, 400, 850].map((x) =>
        Array.from(
          g.getImageData(Math.round((x / 1280) * c.width), Math.round((300 / 720) * c.height), 1, 1)
            .data,
        ),
      );
    });
    copied.forEach((pixel, i) => expect(near(pixel, expected[i], 2)).toBe(true));
  });

async function buildFixture(page: import('@playwright/test').Page) {
  return page.evaluate(async () => {
    const bunnyModule = '/node_modules/mediabunny/dist/bundles/mediabunny.mjs';
    const exportModule = '/src/export.ts';
    const { Output, WebMOutputFormat, BufferTarget, CanvasSource } = await import(bunnyModule);
    const { renderFrameImage } = await import(exportModule);
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1000;
    const context = canvas.getContext('2d')!;
    const target = new BufferTarget();
    const output = new Output({ format: new WebMOutputFormat(), target });
    const video = new CanvasSource(canvas, { codec: 'vp9', bitrate: 2_000_000 });
    output.addVideoTrack(video);
    await output.start();
    for (let i = 0; i < 18; i++) {
      context.fillStyle = `hsl(${i * 20} 80% 50%)`;
      context.fillRect(0, 0, 1600, 1000);
      context.fillStyle = '#ffffff';
      context.fillRect(960, 0, 160, 1000);
      // Matroska stores whole milliseconds; flooring keeps frame i at or before its i/30 request.
      await video.add(Math.floor((i * 1000) / 30) / 1000, 1 / 30);
    }
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
      { id: 'c', assetId: 'synthetic', track: 'screen', start: 15, duration: 3, offset: 6 },
    ];
    const asset = {
      id: 'synthetic',
      name: 'Synthetic frames',
      kind: 'video',
      width: 1600,
      height: 1000,
      duration: 0.6,
      peaks: [],
      hasAudio: false,
      thumbnail: '',
      url: URL.createObjectURL(source),
      cursor,
    };
    const w = window as unknown as FrameWindow;
    w.__fx = { asset, clips, layout };
    w.__render = (opts) =>
      renderFrameImage({ assets: [asset], clips, layout, zooms: [], width: 1920, ...opts });
    w.__read = async (blob, points) => {
      const image = await createImageBitmap(blob);
      const c = document.createElement('canvas');
      c.width = image.width;
      c.height = image.height;
      const g = c.getContext('2d')!;
      g.drawImage(image, 0, 0);
      const scale = image.width / 1280;
      return {
        w: image.width,
        h: image.height,
        px: points.map(([x, y]) =>
          Array.from(g.getImageData(Math.round(x * scale), Math.round(y * scale), 1, 1).data),
        ),
      };
    };
    const data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(source);
    });
    return JSON.stringify({
      version: 2,
      fps: 30,
      clips,
      zooms: [],
      layout,
      muted: [],
      media: [{ id: 'synthetic', name: asset.name, data, cursor }],
    });
  });
}

const renderAt = (
  page: import('@playwright/test').Page,
  frame: number,
  points: [number, number][],
  extra = {},
) =>
  page.evaluate(
    async ([frame, points, extra]) => {
      const w = window as unknown as FrameWindow;
      return w.__read(
        await w.__render({ frame, ...(extra as object) }),
        points as [number, number][],
      );
    },
    [frame, points, extra] as const,
  );

// Source frame under each output frame, derived by hand from the clips above.
const sourceOf = (frame: number) =>
  frame < 9 ? 3 + frame : frame < 15 ? 6 + (frame - 9) : 6 + (frame - 15);

test('renders exact source frames across offsets, repeated cuts and reverse seeks', async ({
  page,
}) => {
  await buildFixture(page);
  // 1200,600 is inside the screen mask, clear of the cursor and of the 60-70% white band.
  for (const frame of [12, 2, 17, 0, 9, 14, 2, 15, 8]) {
    const { w, h, px } = await renderAt(page, frame, [
      [1200, 600],
      [3, 3],
      [200, 400],
    ]);
    expect([w, h]).toEqual([1920, 1080]);
    expect(near(px[0], hue(sourceOf(frame))), `frame ${frame} source ${sourceOf(frame)}`).toBe(
      true,
    );
    // Backdrop outside every mask, then the empty camera mask's own fill.
    expect(near(px[1], [23, 35, 36], 6)).toBe(true);
    expect(near(px[2], [16, 24, 27], 6)).toBe(true);
  }
});

test('applies crop position and zoom, and the 4K width', async ({ page }) => {
  await buildFixture(page);
  // With crop position 25% the white band covers x 1002..1114 un-zoomed and 1174..1398 at 2× zoom.
  const probe: [number, number][] = [
    [1050, 360],
    [1220, 360],
  ];
  const plain = await renderAt(page, 4, probe);
  expect(near(plain.px[0], [255, 255, 255], 12)).toBe(true);
  expect(near(plain.px[1], hue(7))).toBe(true);
  const zoomed = await renderAt(page, 4, probe, {
    zooms: [{ id: 'z', start: 0, duration: 18, scale: 2, x: 50, y: 50 }],
  });
  expect(near(zoomed.px[0], hue(7))).toBe(true);
  expect(near(zoomed.px[1], [255, 255, 255], 12)).toBe(true);
  const uhd = await renderAt(page, 4, probe, { width: 3840 });
  expect([uhd.w, uhd.h]).toEqual([3840, 2160]);
  expect(near(uhd.px[0], [255, 255, 255], 12)).toBe(true);
});

test('draws the rotated cursor about its hotspot and nothing without rotation', async ({
  page,
}) => {
  await buildFixture(page);
  // Same probes as the encoded-video rotation spec: only the rotated bar covers them.
  const rotated: [number, number, number][] = [
    [2, 1056, 260],
    [4, 832, 200],
  ];
  for (const width of [1920, 3840]) {
    for (const [frame, x, y] of rotated) {
      const { w, h, px } = await renderAt(page, frame, [[x, y]], { width });
      expect([w, h]).toEqual([width, (width * 9) / 16]);
      expect(near(px[0], [255, 0, 255], 40), `rotated frame ${frame} at ${width}`).toBe(true);
    }
  }
  const flat = await page.evaluate(async () => {
    const w = window as unknown as FrameWindow;
    const fx = w.__fx as { asset: { cursor: { settings: object } } };
    const asset = {
      ...fx.asset,
      cursor: { ...fx.asset.cursor, settings: { ...fx.asset.cursor.settings, rotate: false } },
    };
    const out: number[][] = [];
    for (const [frame, x, y] of [
      [2, 1056, 260],
      [4, 832, 200],
    ]) {
      const blob = await w.__render({ frame, assets: [asset] });
      out.push((await w.__read(blob, [[x, y]])).px[0]);
    }
    return out;
  });
  for (const pixel of flat) expect(near(pixel, [255, 0, 255], 40)).toBe(false);
});

test('copies the held frame to the clipboard through the Copy frame button', async ({ page }) => {
  test.setTimeout(90000);
  const project = await buildFixture(page);
  await page.getByLabel('Open local project').setInputFiles({
    name: 'frames.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(project),
  });
  await expect(
    page.locator('.app-footer [role="status"]').filter({ hasText: 'Project reopened' }),
  ).toBeVisible();
  const next = page.getByRole('button', { name: 'Next frame', exact: true });
  for (let i = 0; i < 11; i++) await next.click();
  const button = page.getByRole('button', { name: 'Copy frame', exact: true });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.locator('.app-footer [role="status"]').filter({ hasText: 'Frame 11 copied' }),
  ).toContainText('1920 × 1080');
  await expect(button).toBeEnabled();
  await expect(button).toBeFocused();
  const copied = await page.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    const w = window as unknown as FrameWindow;
    return {
      types: item.types,
      ...(await w.__read(await item.getType('image/png'), [
        [1200, 600],
        [1100, 360],
      ])),
    };
  });
  expect(copied.types).toEqual(['image/png']);
  expect([copied.w, copied.h]).toEqual([1920, 1080]);
  // Output frame 11 sits in clip b, source frame 8, not the preview's source thumbnail or frame 0.
  expect(near(copied.px[0], hue(8))).toBe(true);
  expect(near(copied.px[0], hue(3))).toBe(false);
});

test('shows a visible error and recovers when the clipboard or media fails', async ({ page }) => {
  test.setTimeout(90000);
  const project = await buildFixture(page);
  await page.getByLabel('Open local project').setInputFiles({
    name: 'frames.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(project),
  });
  await expect(
    page.locator('.app-footer [role="status"]').filter({ hasText: 'Project reopened' }),
  ).toBeVisible();
  const button = page.getByRole('button', { name: 'Copy frame', exact: true });
  const timecode = await page.getByTestId('timecode').textContent();
  const failure = page
    .locator('.app-footer [role="status"]')
    .filter({ hasText: 'Could not copy frame' });
  const settle = async () => {
    await expect(failure).toBeVisible();
    await expect(button).toBeEnabled();
    await expect(page.getByTestId('timecode')).toHaveText(timecode!);
    expect(await failure.textContent()).not.toContain('blob:');
  };

  await page.evaluate(() => {
    navigator.clipboard.write = () =>
      Promise.reject(new DOMException('Write permission denied.', 'NotAllowedError'));
  });
  await button.click();
  await settle();
  await expect(failure).toContainText('denied');

  await page.evaluate(() => {
    Object.defineProperty(window, 'ClipboardItem', { value: undefined, configurable: true });
  });
  await button.click();
  await expect(failure).toContainText('cannot copy images');
  await settle();
  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page.getByLabel('Open local project').setInputFiles({
    name: 'frames.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(project),
  });
  await expect(
    page.locator('.app-footer [role="status"]').filter({ hasText: 'Project reopened' }),
  ).toBeVisible();
  await page.evaluate(() => {
    const original = window.fetch;
    window.fetch = (input, init) =>
      (input instanceof Request ? input.url : input.toString()).startsWith('blob:')
        ? Promise.reject(new TypeError('unreadable'))
        : original(input, init);
  });
  await button.click();
  await expect(failure).toContainText('Could not read local media Synthetic frames');
  await expect(button).toBeEnabled();
  expect(await failure.textContent()).not.toContain('blob:');
});

test('held preview and copied PNG show the same stored-time frame at WebM boundaries', async ({
  page,
}) => {
  test.setTimeout(120000);
  // 18 solid-hue frames written at exactly i/30 s with no frame-rate hint. Matroska stores whole
  // milliseconds, so frames 2, 5, 8... are stored after i/30 and a request at i/30 selects the one
  // before. The expected frame is derived from the stored millisecond times, not from the renderer.
  const project = await page.evaluate(async () => {
    const bunnyModule = '/node_modules/mediabunny/dist/bundles/mediabunny.mjs';
    const { Output, WebMOutputFormat, BufferTarget, CanvasSource } = await import(bunnyModule);
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const g = canvas.getContext('2d')!;
    const target = new BufferTarget();
    const output = new Output({ format: new WebMOutputFormat(), target });
    const video = new CanvasSource(canvas, { codec: 'vp9', bitrate: 1_000_000 });
    output.addVideoTrack(video);
    await output.start();
    for (let i = 0; i < 18; i++) {
      g.fillStyle = `hsl(${i * 20} 80% 50%)`;
      g.fillRect(0, 0, 320, 180);
      await video.add(i / 30, 1 / 30);
    }
    video.close();
    await output.finalize();
    const data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(new Blob([target.buffer], { type: 'video/webm' }));
    });
    return JSON.stringify({
      version: 2,
      fps: 30,
      clips: [{ id: 'a', assetId: 'w', track: 'screen', start: 0, duration: 18, offset: 0 }],
      zooms: [],
      layout: { radius: 0, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
      muted: [],
      media: [{ id: 'w', name: 'w', data }],
    });
  });
  await page.getByLabel('Open local project').setInputFiles({
    name: 'w.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(project),
  });
  await expect(
    page.locator('.app-footer [role="status"]').filter({ hasText: 'Project reopened' }),
  ).toBeVisible();
  const player = page.getByTestId('compose-monitor').locator('video');
  await expect(player).toHaveCount(1);
  const next = page.getByRole('button', { name: 'Next frame', exact: true });
  const previous = page.getByRole('button', { name: 'Previous frame', exact: true });
  const button = page.getByRole('button', { name: 'Copy frame', exact: true });
  const storedMs = (k: number) => Math.round((k * 1000) / 30);
  const expectedMarker = (frame: number) => {
    let found = 0;
    for (let k = 0; k < 18; k++) if (storedMs(k) <= (frame * 1000) / 30 + 1e-6) found = k;
    return found;
  };
  // The frame the held-preview or PNG pixel shows, as the nearest of the 18 known hues.
  const markerOf = (rgb: number[]) => {
    let best = -1;
    let least = Infinity;
    for (let k = 0; k < 18; k++) {
      const [r, g, b] = hue(k);
      const error = Math.abs(rgb[0] - r) + Math.abs(rgb[1] - g) + Math.abs(rgb[2] - b);
      if (error < least) [least, best] = [error, k];
    }
    return least < 90 ? best : -1;
  };
  let at = 0;
  const seen: [number, number, number][] = [];
  for (const frame of [2, 5, 4, 5, 2]) {
    for (; at < frame; at++) await next.click();
    for (; at > frame; at--) await previous.click();
    await expect(page.getByTestId('timecode')).toContainText(String(frame).padStart(2, '0'));
    await page.waitForTimeout(500);
    const preview = await player.evaluate((video: HTMLVideoElement) => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 36;
      const g = c.getContext('2d')!;
      g.drawImage(video, 0, 0, 64, 36);
      return Array.from(g.getImageData(32, 18, 1, 1).data);
    });
    await button.click();
    await expect(
      page.locator('.app-footer [role="status"]').filter({ hasText: `Frame ${frame} copied` }),
    ).toBeVisible();
    const copied = await page.evaluate(async () => {
      const [item] = await navigator.clipboard.read();
      const image = await createImageBitmap(await item.getType('image/png'));
      const c = document.createElement('canvas');
      c.width = image.width;
      c.height = image.height;
      const g = c.getContext('2d')!;
      g.drawImage(image, 0, 0);
      const scale = image.width / 1280;
      return Array.from(g.getImageData(300 * scale, 360 * scale, 1, 1).data);
    });
    seen.push([frame, markerOf(preview), markerOf(copied)]);
  }
  // Nominal frames 2 and 5 select source frames 1 and 4; 4 selects 4 itself.
  expect(seen.map(([frame]) => expectedMarker(frame))).toEqual([1, 4, 4, 4, 1]);
  expect(seen.map(([, preview]) => preview)).toEqual([1, 4, 4, 4, 1]);
  expect(seen.map(([, , copy]) => copy)).toEqual([1, 4, 4, 4, 1]);
});

test('copies the frame and edit held at activation, not what changed while it rendered', async ({
  page,
}) => {
  test.setTimeout(90000);
  const project = await buildFixture(page);
  await page.getByLabel('Open local project').setInputFiles({
    name: 'frames.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(project),
  });
  await expect(
    page.locator('.app-footer [role="status"]').filter({ hasText: 'Project reopened' }),
  ).toBeVisible();
  const next = page.getByRole('button', { name: 'Next frame', exact: true });
  for (let i = 0; i < 11; i++) await next.click();
  // Stall the render's media read so the edit and playhead can change before it decodes.
  await page.evaluate(() => {
    const original = window.fetch;
    window.fetch = async (input, init) => {
      if ((input instanceof Request ? input.url : input.toString()).startsWith('blob:'))
        await new Promise<void>((resolve) => {
          (window as unknown as { __release: () => void }).__release = resolve;
        });
      return original(input, init);
    };
  });
  await page.getByRole('button', { name: 'Copy frame', exact: true }).click();
  await page.waitForFunction(() => '__release' in window);
  await next.click();
  await next.click();
  // Clip b (output frames 9-14, the clip being rendered) starts at 0.3 s on the timeline.
  const clipB = page.getByRole('button', { name: 'Synthetic frames at 0.3 seconds' });
  await clipB.click();
  await expect(clipB).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Delete selected clip or zoom' }).click();
  await expect(clipB).toHaveCount(0);
  await expect(page.getByTestId('timecode')).toContainText('13');
  await page.evaluate(() => (window as unknown as { __release: () => void }).__release());
  await expect(
    page.locator('.app-footer [role="status"]').filter({ hasText: 'Frame 11 copied' }),
  ).toBeVisible();
  const pixel = await page.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    const image = await createImageBitmap(await item.getType('image/png'));
    const c = document.createElement('canvas');
    c.width = image.width;
    c.height = image.height;
    const g = c.getContext('2d')!;
    g.drawImage(image, 0, 0);
    return Array.from(g.getImageData(1200, 600, 1, 1).data);
  });
  // Output frame 11 is source frame 8 of clip b; clip b was deleted and the playhead moved to 13 during the render.
  expect(near(pixel, hue(8))).toBe(true);
});
