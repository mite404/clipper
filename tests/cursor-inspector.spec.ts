import { expect, test } from '@playwright/test';
import { cursorFixture } from '../src/cursor.fixture';
import { choose, expectChoice } from './choice';

test('screen selection edits its recording in a scrolling inspector without displacing the sequence', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready');
  const inspector = page.locator('.inspector');
  const controls = inspector.getByRole('region', { name: 'Source cursor data' });
  await expect(controls).toBeVisible();
  await expect(controls).toContainText('Recording settings · affects all uses');
  await page.getByLabel('Attach cursor sidecar').setInputFiles({
    name: 'synthetic.cursor.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(cursorFixture)),
  });
  await expect(controls.getByLabel('Cursor animation style', { exact: true })).toBeVisible();
  await expect(controls.getByLabel('Cursor time offset (ms)')).not.toBeVisible();
  await expect(controls.getByLabel('Remove small shakes', { exact: true })).not.toBeVisible();
  const transport = page.locator('.transport');
  const timeline = page.locator('.timeline-toolbar');
  const before = [await transport.boundingBox(), await timeline.boundingBox()];
  for (const name of ['Cleanup', 'Advanced cursor', 'Source data'])
    await controls.getByText(name, { exact: true }).click();
  await controls.getByLabel('Cursor time offset (ms)').fill('50');
  await expect(transport).toBeInViewport();
  await expect(timeline).toBeInViewport();
  expect([await transport.boundingBox(), await timeline.boundingBox()]).toEqual(before);
  expect(await inspector.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Next frame', exact: true }).click();
  await expect(page.getByTestId('timecode')).toHaveText('00:00:01');
  await page.getByRole('button', { name: 'Select A conversation', exact: true }).click();
  await expect(controls).toContainText('A conversation');
  await expect(controls.getByTestId('cursor-status')).toHaveText('No cursor sidecar');
  await page.locator('.timeline-clip').filter({ hasText: 'Flower study' }).first().click();
  await expect(controls).toContainText('Flower study');
  await controls.getByText('Source data', { exact: true }).click();
  await expect(controls.getByLabel('Cursor time offset (ms)')).toHaveValue('50');
  await expect(page.getByTestId('timecode')).toHaveText('00:00:01');
  await choose(page.getByLabel('Cursor motion', { exact: true }), 'raw');
  await expect(page.getByLabel('Cursor animation style', { exact: true })).toBeDisabled();
  await choose(page.getByLabel('Cursor motion', { exact: true }), 'smooth');
  await choose(page.getByLabel('Cursor animation style', { exact: true }), 'rapid');
  await expect(page.locator('.timeline-clip.selected')).toHaveCount(1);
  await page.locator('.timeline-clip').filter({ hasText: 'Flower study' }).nth(1).click();
  await expectChoice(page.getByLabel('Cursor animation style', { exact: true }), 'rapid');
  await page.getByRole('button', { name: 'Play composition', exact: true }).click();
  await expect(page.getByTestId('transport-state')).toContainText('Playing');
  await page.getByRole('button', { name: 'Pause playback', exact: true }).click();
});
