import { expect, test } from '@playwright/test';

test('opens legacy click shots, undoes manual edits and keeps source anchors on save and reopen', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const fixtureDownloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const fixtureStream = await (await fixtureDownloadEvent).createReadStream();
  const fixtureChunks = [];
  for await (const chunk of fixtureStream) fixtureChunks.push(chunk);
  const fixture = JSON.parse(Buffer.concat(fixtureChunks).toString());
  fixture.zooms = [
    {
      id: 'legacy-first',
      start: 18,
      duration: 117,
      scale: 1.8,
      x: 60,
      y: 30,
      follow: 'focused',
      source: { assetId: 'landscape', clipId: 's1', start: 18, x: 0.6, y: 0.3 },
    },
    {
      id: 'legacy-second',
      start: 198,
      duration: 102,
      scale: 1.8,
      x: 30,
      y: 70,
      follow: 'focused',
      source: { assetId: 'landscape', clipId: 's2', start: 228, x: 0.3, y: 0.7 },
    },
  ];
  await page.getByLabel('Open local project').setInputFiles({
    name: 'legacy-clicks.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  const regions = page.getByRole('button', { name: 'Select zoom', exact: true });
  await expect(regions).toHaveCount(2);
  await regions.first().click();
  await expect(page.getByLabel('Zoom start seconds', { exact: true })).toHaveValue('0.6');
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('3.9');
  await page.getByLabel('Zoom level', { exact: true }).press('ArrowRight');
  await expect(page.getByLabel('Zoom level', { exact: true })).toHaveValue('1.9');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByLabel('Zoom level', { exact: true })).toHaveValue('1.8');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const project = JSON.parse(Buffer.concat(chunks).toString());
  expect(project.zooms).toHaveLength(2);
  expect(project.zooms[0].source).toMatchObject({
    assetId: 'landscape',
    clipId: 's1',
    start: 18,
    x: 0.6,
    y: 0.3,
  });
  expect(project.zooms[0].scale).toBe(1.8);
  expect(project.zooms[1].source).toMatchObject({ clipId: 's2', start: 228, x: 0.3, y: 0.7 });
  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready');
  await page.getByLabel('Open local project').setInputFiles({
    name: 'clicks.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(project)),
  });
  await expect(regions).toHaveCount(2);
  await regions.first().click();
  await page.getByLabel('Zoom level', { exact: true }).press('ArrowLeft');
  await expect(page.getByLabel('Zoom level', { exact: true })).toHaveValue('1.7');
  const editedDownloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const editedStream = await (await editedDownloadEvent).createReadStream();
  const editedChunks = [];
  for await (const chunk of editedStream) editedChunks.push(chunk);
  const edited = JSON.parse(Buffer.concat(editedChunks).toString());
  expect(edited.zooms[0].source).toBeUndefined();
  expect(edited.zooms[0].scale).toBe(1.7);
  expect(edited.zooms[1]).toEqual(project.zooms[1]);
  await page.getByRole('button', { name: 'Remove zoom', exact: true }).click();
  await expect(regions).toHaveCount(1);
  await regions.click();
  await expect(page.getByLabel('Zoom start seconds', { exact: true })).toHaveValue('6.6');
});

test('centers a source-offset click identically in preview and decoded export', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready');
  const result = await page.evaluate(async () => {
    const mediaModule = '/src/media.ts',
      exportModule = '/src/export.ts';
    const zoomModule = '/src/zoom-generation.ts';
    const modelModule = '/src/timeline-model.ts';
    const bunnyModule = '/node_modules/mediabunny/dist/bundles/mediabunny.mjs';
    const { loadDemo } = await import(mediaModule);
    const { renderVideo } = await import(exportModule);
    const { resolveZooms } = await import(zoomModule);
    const { DEFAULT_TRACKS } = await import(modelModule);
    const { Input, BlobSource, ALL_FORMATS, CanvasSink } = await import(bunnyModule);
    const assets = await loadDemo();
    const asset = assets[0];
    const bitmap = document.createElement('canvas');
    bitmap.width = 16;
    bitmap.height = 16;
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
        samples: Array.from({ length: 61 }, (_, frame) => ({
          timeMs: (frame * 1000) / 30,
          cx: 0.6,
          cy: 0.3,
          assetId: 'arrow',
          interactionType: frame === 30 ? 'click' : frame === 31 ? 'mouseup' : 'move',
        })),
      },
    };
    asset.cursor = cursor;
    const clips = [
      { id: 'take', assetId: asset.id, track: 'screen', start: 0, offset: 30, duration: 30 },
    ];
    const layout = { radius: 22, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 };
    const zooms = resolveZooms(
      [
        {
          id: 'legacy-offset',
          start: 0,
          duration: 30,
          scale: 2,
          x: 50,
          y: 50,
          follow: 'focused',
          source: { assetId: asset.id, clipId: 'take', start: 30, x: 0.6, y: 0.3 },
        },
      ],
      clips,
      assets,
      layout,
      DEFAULT_TRACKS,
    );
    const encoded = await renderVideo({
      assets,
      clips,
      layout,
      zooms,
      muted: [],
      width: 1920,
      onProgress: () => {},
    });
    const input = new Input({ source: new BlobSource(encoded), formats: ALL_FORMATS });
    let pixel;
    try {
      const track = await input.getPrimaryVideoTrack();
      const decoded = await new CanvasSink(track, { width: 1280 }).getCanvas(15.01 / 30);
      // At full hold the focus is the mask centre: x = 10 + 880/2, y = 10 + 700/2.
      pixel = Array.from(decoded.canvas.getContext('2d').getImageData(452, 362, 1, 1).data);
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
  });
  expect(result.pixel[0]).toBeGreaterThan(220);
  expect(result.pixel[1]).toBeLessThan(50);
  expect(result.pixel[2]).toBeGreaterThan(220);
  await page.getByLabel('Open local project').setInputFiles({
    name: 'synthetic-click-export.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(result.project),
  });
  await expect(page.getByRole('button', { name: 'Select zoom', exact: true })).toHaveCount(1);
  await page.getByLabel('Timeline playhead', { exact: true }).fill('15');
  const mask = await page.getByTestId('screen-mask').boundingBox();
  const cursor = await page.getByTestId('cursor-preview').boundingBox();
  expect(cursor!.x - mask!.x).toBeCloseTo(mask!.width / 2, 0);
  expect(cursor!.y - mask!.y).toBeCloseTo(mask!.height / 2, 0);
});
