import { expect, test } from '@playwright/test';

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
      await page.getByRole('combobox', { name: 'Export resolution' }).selectOption(String(width));
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
      await page.getByLabel('Camera follow').selectOption('smooth');
      await expect(content).not.toHaveCSS('transform', transform);
      await page.getByLabel('Camera follow').selectOption('fixed');
      await page.getByLabel('Instant zoom').uncheck();
      await scrub.fill('0');
      await expect(content).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
    });
  }
}
