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
  // UI-10: no scope line, and no visible legend; the group keeps its accessible name.
  await expect(controls).not.toContainText('Recording settings');
  await page.getByLabel('Attach cursor sidecar').setInputFiles({
    name: 'synthetic.cursor.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(cursorFixture)),
  });
  const group = controls.getByRole('group', { name: 'Appearance & behavior' });
  await expect(group).toBeVisible();
  await expect(group.locator('legend')).toHaveCount(0);
  // Every control is visible without opening anything: basics first, then behavior.
  const names = [
    'Cursor animation style',
    'Cursor style',
    'Cursor size',
    'Hide cursor',
    'Cursor motion',
    'Hide when idle (1 s)',
    'Remove small shakes',
    'Stabilize recorded shapes',
    'Rotate with movement',
    'Cursor ending',
  ];
  const tops: number[] = [];
  for (const name of names) {
    const control = controls.getByLabel(name, { exact: true });
    await expect(control).toBeVisible();
    tops.push((await control.boundingBox())!.y);
  }
  expect(tops).toEqual([...tops].sort((a, b) => a - b));
  // The five checkboxes share one left edge.
  const lefts = new Set<number>();
  for (const name of names.filter((name) => !name.startsWith('Cursor')))
    lefts.add((await controls.getByLabel(name, { exact: true }).boundingBox())!.x);
  expect(lefts.size).toBe(1);
  for (const name of ['Cleanup', 'Advanced cursor'])
    await expect(controls.getByText(name, { exact: true })).toHaveCount(0);
  // The animation and ending notes sit behind toggleable info tooltips.
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await controls.getByRole('button', { name: 'About cursor animation' }).click();
  await expect(page.getByRole('tooltip')).toContainText('None steps at recorded sample times');
  await expect(page.locator('[data-slot="select-content"][data-open]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await controls.getByRole('button', { name: 'About cursor ending' }).click();
  await expect(page.getByRole('tooltip')).toContainText('Ending effects use the last 0.5 s');
  await controls.getByRole('button', { name: 'About cursor ending' }).click();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await expect(controls.getByLabel('Cursor time offset (ms)')).not.toBeVisible();
  const transport = page.locator('.transport');
  const timeline = page.locator('.timeline-toolbar');
  const before = [await transport.boundingBox(), await timeline.boundingBox()];
  await controls.getByText('Source data', { exact: true }).click();
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
