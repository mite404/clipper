import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { cursorFixture } from '../src/cursor.fixture';

test('attaches source-local cursor telemetry, rejects bad replacements and restores it after reload', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const uploads: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') uploads.push(request.url());
  });
  const attach = page.getByLabel('Attach cursor sidecar');
  await page.getByLabel('Source in seconds').fill('2');
  await page.getByLabel('Source out seconds').fill('12');
  await attach.setInputFiles({
    name: 'synthetic.mp4.cursor.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(cursorFixture)),
  });
  await expect(page.getByTestId('cursor-status')).toHaveText('5 samples · 1 cursor asset');
  await expect(page.getByLabel('Source in seconds')).toHaveValue('2');
  await expect(page.getByLabel('Source out seconds')).toHaveValue('12');
  await expect(page.getByLabel('Cursor time offset (ms)')).toHaveValue('0');
  await page.getByLabel('Cursor time offset (ms)').fill('-78');
  await page.getByLabel('Cursor motion', { exact: true }).selectOption('raw');
  await page.getByLabel('Cursor size', { exact: true }).fill('');
  await page.getByLabel('Cursor size', { exact: true }).pressSequentially('2.5');
  await expect(page.getByLabel('Cursor size', { exact: true })).toHaveValue('2.5');
  await page.getByLabel('Hide cursor', { exact: true }).check();
  await page.getByLabel('Cursor style', { exact: true }).selectOption('touch');
  await page.getByText('Advanced cursor', { exact: true }).click();
  await page.getByLabel('Hide when idle (1 s)', { exact: true }).check();
  await page.getByLabel('Remove small shakes', { exact: true }).check();
  await page.getByLabel('Cursor ending', { exact: true }).selectOption('loop');
  await attach.setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{'),
  });
  await expect(page.getByRole('alert')).toContainText('Could not attach cursor');
  await expect(page.getByTestId('cursor-status')).toHaveText('5 samples · 1 cursor asset');
  await expect(page.getByLabel('Cursor time offset (ms)')).toHaveValue('-78');
  const corrupt = { ...cursorFixture, assets: [{ ...cursorFixture.assets[0], width: 2 }] };
  await attach.setInputFiles({
    name: 'corrupt.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(corrupt)),
  });
  await expect(page.getByRole('alert')).toContainText('dimensions');
  await expect(page.getByTestId('cursor-status')).toHaveText('5 samples · 1 cursor asset');
  const pngHeader = Buffer.from(
    cursorFixture.assets[0].imageDataUrl.split(',')[1],
    'base64',
  ).subarray(0, 24);
  await attach.setInputFiles({
    name: 'undecodable.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        ...cursorFixture,
        assets: [
          {
            ...cursorFixture.assets[0],
            imageDataUrl: `data:image/png;base64,${pngHeader.toString('base64')}`,
          },
        ],
      }),
    ),
  });
  await expect(page.getByRole('alert')).toContainText('Could not attach cursor');
  await expect(page.getByLabel('Cursor time offset (ms)')).toHaveValue('-78');
  await page.getByRole('button', { name: 'Select A conversation' }).click();
  await expect(page.getByTestId('cursor-status')).toHaveText('No cursor sidecar');
  await page.getByRole('button', { name: 'Select Flower study' }).click();
  await expect(page.getByLabel('Cursor time offset (ms)')).toHaveValue('-78');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const path = (await (await downloaded).path())!;
  const saved = JSON.parse(await readFile(path, 'utf8'));
  expect(saved.media.find((asset: { id: string }) => asset.id === 'landscape').cursor).toEqual({
    recording: cursorFixture,
    offsetMs: -78,
    settings: {
      mode: 'raw',
      size: 2.5,
      hidden: true,
      style: 'touch',
      hideIdle: true,
      removeShakes: true,
      ending: 'loop',
    },
  });
  expect(
    saved.media.find((asset: { id: string }) => asset.id === 'portrait').cursor,
  ).toBeUndefined();
  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page.getByLabel('Open local project').setInputFiles(path);
  await expect(page.locator('.app-footer [role="status"]')).toContainText('Project reopened', {
    timeout: 30000,
  });
  await expect(page.getByTestId('cursor-status')).toHaveText('5 samples · 1 cursor asset');
  await expect(page.getByLabel('Cursor time offset (ms)')).toHaveValue('-78');
  await expect(page.getByLabel('Cursor motion', { exact: true })).toHaveValue('raw');
  await expect(page.getByLabel('Cursor size', { exact: true })).toHaveValue('2.5');
  await expect(page.getByLabel('Hide cursor', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Cursor style', { exact: true })).toHaveValue('touch');
  await page.getByText('Advanced cursor', { exact: true }).click();
  await expect(page.getByLabel('Hide when idle (1 s)', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Remove small shakes', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Cursor ending', { exact: true })).toHaveValue('loop');
  await page.getByRole('button', { name: 'Remove cursor sidecar' }).click();
  await expect(page.getByTestId('cursor-status')).toHaveText('No cursor sidecar');
  expect(uploads).toEqual([]);
});

test('cursor controls retain actions with long filenames, empty telemetry and large counts at narrow widths', async ({
  page,
}) => {
  const storybook = process.env.STORYBOOK_URL || 'http://localhost:6006';
  await page.goto(
    `${storybook}/iframe.html?id=clipper-shared-library--cursor-sidecar&viewMode=story`,
  );
  for (const [width, zoom] of [
    [1440, 1],
    [320, 1],
    [640, 2],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate((value) => {
      document.documentElement.style.zoom = String(value);
    }, zoom);
    for (const [mode, status] of [
      ['Demo data', '5 samples · 1 cursor asset'],
      ['Worst case', '8,001 samples · 1 cursor asset'],
      ['Empty', '0 samples · 1 cursor asset'],
      ['One', '1 sample · 1 cursor asset'],
      ['Idle and shakes', '280 samples · 1 cursor asset'],
    ]) {
      await page.getByRole('button', { name: mode, exact: true }).click();
      await expect(page.getByTestId('cursor-status')).toHaveText(status);
      await expect(
        page.getByRole('button', { name: 'Attach sidecar', exact: true }),
      ).toBeInViewport();
      await expect(page.getByRole('button', { name: 'Remove cursor sidecar' })).toBeInViewport();
      await page.getByText('Advanced cursor', { exact: true }).click();
      await page.getByLabel('Cursor style', { exact: true }).selectOption('touch');
      await page.getByLabel('Cursor ending', { exact: true }).selectOption('stop');
      await expect(page.getByLabel('Hide when idle (1 s)', { exact: true })).toBeInViewport();
      await expect(page.getByLabel('Remove small shakes', { exact: true })).toBeInViewport();
      await expect(page.getByLabel('Cursor ending', { exact: true })).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
  }
});
