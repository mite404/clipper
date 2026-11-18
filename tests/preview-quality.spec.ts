import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { choose, expectChoice } from './choice';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

async function openEditor(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

const quality = (page: Page) => page.getByRole('combobox', { name: 'Preview quality' });

// The preview is DOM laid out at the composition size and scaled to the pane, so the layout box of
// the stage is its backing size; the screen mask's share of it is the geometry.
const layout = (page: Page) =>
  page.getByTestId('screen-mask').evaluate((element) => {
    const mask = element as HTMLElement;
    const stage = mask.parentElement!;
    return {
      width: stage.offsetWidth,
      height: stage.offsetHeight,
      mask: mask.offsetWidth / stage.offsetWidth,
    };
  });

// Full is the output size up to 1920 wide, so a 3840 export lays out the same preview as 1920.
for (const output of [1920, 3840])
  test(`lays the preview out at 1, 1/2 and 1/4 of 1920 for a ${output}px export, with the same geometry`, async ({
    page,
  }) => {
    await openEditor(page);
    await choose(page.getByRole('combobox', { name: 'Export resolution' }), String(output));
    await expectChoice(quality(page), 'full');
    const base = 1920;
    const full = await layout(page);
    expect(full).toMatchObject({ width: base, height: (base * 9) / 16 });
    for (const [name, divisor] of [
      ['half', 2],
      ['quarter', 4],
    ] as const) {
      await choose(quality(page), name);
      await expect.poll(() => layout(page).then((l) => l.width)).toBe(base / divisor);
      const shrunk = await layout(page);
      expect(shrunk.height).toBe((base * 9) / 16 / divisor);
      // The mask takes the same share of the stage, to the pixel the smaller layout can hold.
      expect(Math.abs(shrunk.mask - full.mask)).toBeLessThan(0.002);
    }
    await choose(quality(page), 'full');
    await expect.poll(() => layout(page).then((l) => l.width)).toBe(base);
  });

test('Copy frame stays at the full 1920px output size when the preview is Quarter, and the frame holds', async ({
  page,
}) => {
  await openEditor(page);
  await page.getByRole('slider', { name: 'Timeline playhead' }).fill('100');
  const timecode = await page.getByTestId('timecode').textContent();
  await choose(quality(page), 'quarter');
  await expect.poll(() => layout(page).then((l) => l.width)).toBe(480);
  await expect(page.getByTestId('timecode')).toHaveText(timecode!);
  await page.getByRole('button', { name: 'Copy frame', exact: true }).click();
  await expect(page.locator('.app-footer [role="status"]')).toContainText('1920 × 1080', {
    timeout: 30000,
  });
  const size = await page.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    const bitmap = await createImageBitmap(await item.getType('image/png'));
    return [bitmap.width, bitmap.height];
  });
  expect(size).toEqual([1920, 1080]);
});

test('remembers the choice on this device, starts at Full, and ignores a value it does not know', async ({
  page,
}) => {
  await openEditor(page);
  await expectChoice(quality(page), 'full');
  await choose(quality(page), 'half');
  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await expectChoice(quality(page), 'half');
  await expect.poll(() => layout(page).then((l) => l.width)).toBe(960);
  await page.evaluate(() => localStorage.setItem('clipper.previewQuality', 'constructor'));
  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await expectChoice(quality(page), 'full');
  // It is a device setting, never part of the saved project.
  const saved = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const text = (await import('node:fs')).readFileSync((await (await saved).path())!, 'utf8');
  expect(text).not.toMatch(/preview|quality/i);
});

// A 4K export makes no 4K preview, but the file it writes is still 3840 wide.
test('a 3840px export keeps a 1920 wide preview layout and still writes a 3840 wide file', async ({
  page,
}, info) => {
  test.setTimeout(240000);
  await openEditor(page);
  await choose(page.getByRole('combobox', { name: 'Export resolution' }), '3840');
  await expect.poll(() => layout(page).then((l) => l.width)).toBe(1920);
  await page.getByRole('button', { name: 'Export video', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Export video' });
  await choose(dialog.getByRole('combobox', { name: 'Format' }), 'webm');
  await page.getByRole('button', { name: 'Render video', exact: true }).click();
  await expect(page.locator('.app-footer [role="status"]')).toContainText(
    'Video exported at 3840',
    {
      timeout: 200000,
    },
  );
  const downloaded = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Save video', exact: true }).click();
  const file = (await (await downloaded).path())!;
  const probe = execFileSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height',
      '-of',
      'csv=p=0',
      file,
    ],
    { encoding: 'utf8' },
  );
  expect(probe.trim()).toBe('3840,2160');
  // The layout was never 3840 wide at any point of the render.
  expect((await layout(page)).width).toBe(1920);
  info.annotations.push({ type: 'export', description: 'one real 4K WebM render' });
});
