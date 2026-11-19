import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { cursorFixture } from '../src/cursor.fixture';
import { choose, expectChoice } from './choice';
import { markRange, rangeIn, rangeOut } from './source-range';

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
  await markRange(page, 60, 360);
  await attach.setInputFiles({
    name: 'synthetic.mp4.cursor.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(cursorFixture)),
  });
  await expect(page.getByTestId('cursor-status')).toHaveText('5 samples · 1 cursor asset');
  await expect(rangeIn(page)).toHaveText('2 s');
  await expect(rangeOut(page)).toHaveText('12 s');
  await page.getByText('Source data', { exact: true }).click();
  await expect(page.getByLabel('Cursor time offset (ms)')).toHaveValue('0');
  await page.getByLabel('Cursor time offset (ms)').fill('-78');
  await choose(page.getByLabel('Cursor motion', { exact: true }), 'raw');
  await page.getByLabel('Cursor size', { exact: true }).fill('');
  await page.getByLabel('Cursor size', { exact: true }).pressSequentially('2.5');
  await expect(page.getByLabel('Cursor size', { exact: true })).toHaveValue('2.5');
  await page.getByLabel('Hide cursor', { exact: true }).check();
  await choose(page.getByLabel('Cursor style', { exact: true }), 'touch');
  await page.getByText('Advanced cursor', { exact: true }).click();
  const animation = page.getByLabel('Cursor animation style', { exact: true });
  await expectChoice(animation, 'smooth');
  await expect(animation).toBeDisabled();
  await choose(page.getByLabel('Cursor motion', { exact: true }), 'smooth');
  await choose(animation, 'rapid');
  await choose(page.getByLabel('Cursor motion', { exact: true }), 'raw');
  await page.getByLabel('Hide when idle (1 s)', { exact: true }).check();
  await page.getByText('Cleanup', { exact: true }).click();
  await page.getByLabel('Remove small shakes', { exact: true }).check();
  await page.getByLabel('Stabilize recorded shapes', { exact: true }).check();
  await expect(page.getByLabel('Rotate with movement', { exact: true })).not.toBeChecked();
  await page.getByLabel('Rotate with movement', { exact: true }).check();
  await choose(page.getByLabel('Cursor ending', { exact: true }), 'loop');
  await page.getByLabel('Hide cursor from (source seconds)').fill('0.15');
  await page.getByLabel('Hide cursor until (source seconds)').fill('0.1');
  await page.getByRole('button', { name: 'Add hidden range', exact: true }).click();
  expect(
    await page
      .getByLabel('Hide cursor until (source seconds)')
      .evaluate((element: HTMLInputElement) => element.validationMessage),
  ).toBe('End must be after start.');
  await expect(page.getByText('No hidden ranges.', { exact: true })).toBeVisible();
  await page.getByLabel('Hide cursor until (source seconds)').fill('0.3');
  await page.getByRole('button', { name: 'Add hidden range', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Remove hidden range 1', exact: true }),
  ).toBeVisible();
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
  await page.getByText('Source data', { exact: true }).click();
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
      stabilizeShapes: true,
      rotate: true,
      animationStyle: 'rapid',
      ending: 'loop',
      hiddenRanges: [{ startMs: 150, endMs: 300 }],
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
  await page.getByText('Source data', { exact: true }).click();
  await expect(page.getByLabel('Cursor time offset (ms)')).toHaveValue('-78');
  await expectChoice(page.getByLabel('Cursor motion', { exact: true }), 'raw');
  await expect(page.getByLabel('Cursor size', { exact: true })).toHaveValue('2.5');
  await expect(page.getByLabel('Hide cursor', { exact: true })).toBeChecked();
  await expectChoice(page.getByLabel('Cursor style', { exact: true }), 'touch');
  await page.getByText('Advanced cursor', { exact: true }).click();
  await expect(page.getByLabel('Hide when idle (1 s)', { exact: true })).toBeChecked();
  await page.getByText('Cleanup', { exact: true }).click();
  await expect(page.getByLabel('Remove small shakes', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Stabilize recorded shapes', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Rotate with movement', { exact: true })).toBeChecked();
  await expectChoice(animation, 'rapid');
  await expect(animation).toBeDisabled();
  await expectChoice(page.getByLabel('Cursor ending', { exact: true }), 'loop');
  await expect(page.getByText('0.15 to 0.3 s', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Remove hidden range 1', exact: true }).click();
  await expect(page.getByText('No hidden ranges.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Remove cursor sidecar' }).click();
  await expect(page.getByTestId('cursor-status')).toHaveText('No cursor sidecar');
  expect(uploads).toEqual([]);
});

test('cursor controls retain actions with long filenames, empty telemetry and large counts at narrow widths', async ({
  page,
}) => {
  // About 90 menu choices, each waiting out the menu's open and close transitions.
  test.setTimeout(60000);
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
      await page.getByText('Source data', { exact: true }).click();
      await page
        .getByRole('button', { name: 'Attach sidecar', exact: true })
        .scrollIntoViewIfNeeded();
      await expect(
        page.getByRole('button', { name: 'Attach sidecar', exact: true }),
      ).toBeInViewport();
      await page.getByRole('button', { name: 'Remove cursor sidecar' }).scrollIntoViewIfNeeded();
      await expect(page.getByRole('button', { name: 'Remove cursor sidecar' })).toBeInViewport();
      await page.getByText('Advanced cursor', { exact: true }).click();
      await choose(page.getByLabel('Cursor style', { exact: true }), 'touch');
      await choose(page.getByLabel('Cursor ending', { exact: true }), 'stop');
      await page.getByLabel('Hide when idle (1 s)', { exact: true }).scrollIntoViewIfNeeded();
      await expect(page.getByLabel('Hide when idle (1 s)', { exact: true })).toBeInViewport();
      await page.getByText('Cleanup', { exact: true }).click();
      await page.getByLabel('Remove small shakes', { exact: true }).scrollIntoViewIfNeeded();
      await expect(page.getByLabel('Remove small shakes', { exact: true })).toBeInViewport();
      const stabilize = page.getByLabel('Stabilize recorded shapes', { exact: true });
      await stabilize.scrollIntoViewIfNeeded();
      await stabilize.check();
      await expect(stabilize).toBeChecked();
      const rotate = page.getByLabel('Rotate with movement', { exact: true });
      await rotate.scrollIntoViewIfNeeded();
      await rotate.check();
      await expect(rotate).toBeChecked();
      const animation = page.getByLabel('Cursor animation style', { exact: true });
      await animation.scrollIntoViewIfNeeded();
      for (const style of ['smooth', 'medium', 'rapid', 'none']) {
        await choose(animation, style);
        await expectChoice(animation, style);
      }
      await page.getByLabel('Cursor ending', { exact: true }).scrollIntoViewIfNeeded();
      await expect(page.getByLabel('Cursor ending', { exact: true })).toBeInViewport();
      const addRange = page.getByRole('button', { name: 'Add hidden range', exact: true });
      await addRange.scrollIntoViewIfNeeded();
      await expect(addRange).toBeInViewport();
      if (mode === 'Worst case') {
        const removeRange = page.getByRole('button', {
          name: 'Remove hidden range 2',
          exact: true,
        });
        await removeRange.scrollIntoViewIfNeeded();
        await expect(removeRange).toBeInViewport();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
  }
});
