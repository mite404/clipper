import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
});

test('Generate zooms creates a four-second playhead region without cursor metadata and reopens it', async ({
  page,
}, testInfo) => {
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  const regions = page.getByRole('button', { name: 'Select zoom', exact: true });
  await expect(page.getByText('Click-driven zooms', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Automatic zoom amount', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Automatic zoom hold seconds', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /from recorded clicks/ })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Remove automatic zooms', exact: true }),
  ).toHaveCount(0);
  await playhead.fill('45');
  await page.getByRole('button', { name: 'Generate zooms', exact: true }).click();
  await expect(regions).toHaveCount(1);
  await expect(page.getByLabel('Zoom start seconds', { exact: true })).toHaveValue('1.5');
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('4');
  await expect(page.getByLabel('Camera follow', { exact: true })).toHaveValue('focused');
  await expect(page.getByLabel('Zoom level', { exact: true })).toHaveValue('1.8');
  await playhead.fill('90');
  await expect(page.getByTestId('screen-content')).toHaveCSS('transform', /matrix\(1\.8,/);
  await page.getByRole('button', { name: 'Generate zooms', exact: true }).click();
  await expect(page.locator('.app-footer [role="status"]')).toContainText('Zooms cannot overlap');
  await expect(regions).toHaveCount(1);
  await expect(page.getByLabel('Zoom start seconds', { exact: true })).toHaveValue('1.5');
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('4');

  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const download = await downloadEvent;
  const saved = testInfo.outputPath('playhead.clipper.json');
  await download.saveAs(saved);
  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready');
  await page.getByLabel('Open local project').setInputFiles(saved);
  await expect(regions).toHaveCount(1);
  await regions.click();
  await expect(page.getByLabel('Zoom start seconds', { exact: true })).toHaveValue('1.5');
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('4');
  await expect(page.getByLabel('Camera follow', { exact: true })).toHaveValue('focused');
  await expect(page.getByLabel('Zoom level', { exact: true })).toHaveValue('1.8');
});

test('creation clips only the outpoint, accepts six remaining frames and refuses five', async ({
  page,
}) => {
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  const add = page.getByRole('button', { name: 'Add zoom at playhead', exact: true }).first();
  const regions = page.getByRole('button', { name: 'Select zoom', exact: true });
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  await playhead.fill('300');
  await add.click();
  await expect(page.getByLabel('Zoom start seconds', { exact: true })).toHaveValue('10');
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('2');
  await expect(page.locator('.app-footer [role="status"]')).toContainText(
    /shortened.*2.*sequence end/i,
  );
  await undo.click();
  await expect(regions).toHaveCount(0);
  await playhead.fill('354');
  await add.click();
  await expect(page.getByLabel('Zoom start seconds', { exact: true })).toHaveValue('11.8');
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('0.2');
  await undo.click();
  await playhead.fill('355');
  await add.click();
  await expect(regions).toHaveCount(0);
  await expect(playhead).toHaveValue('355');
  await expect(page.locator('.app-footer [role="status"]')).toContainText(/move.*playhead.*0\.2/i);
  await expect(undo).toBeDisabled();
});

test('B creates once per press, ignores editable targets and modifier chords, and advertises its shortcut', async ({
  page,
}) => {
  const regions = page.getByRole('button', { name: 'Select zoom', exact: true });
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  const add = page.getByRole('button', { name: 'Add zoom at playhead', exact: true }).first();
  await playhead.fill('30');
  await page.getByLabel('Source in seconds', { exact: true }).press('b');
  await page.getByLabel('Insert onto track', { exact: true }).press('b');
  await add.focus();
  for (const key of ['Control+b', 'Meta+b', 'Alt+b', 'Shift+B']) await page.keyboard.press(key);
  await expect(regions).toHaveCount(0);
  await page.keyboard.down('b');
  await expect(regions).toHaveCount(1);
  await expect(page.getByLabel('Zoom start seconds', { exact: true })).toHaveValue('1');
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('4');
  await expect(page.getByLabel('Camera follow', { exact: true })).toHaveValue('focused');
  await playhead.fill('210');
  await add.focus();
  await page.keyboard.down('b');
  await expect(regions).toHaveCount(1);
  await page.keyboard.up('b');
  await page.keyboard.press('b');
  await expect(regions).toHaveCount(2);
  await expect(page.getByLabel('Zoom start seconds', { exact: true })).toHaveValue('7');
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('4');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(regions).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Generate zooms', exact: true })).toContainText(
    'B',
  );
  await page.getByRole('button', { name: 'Shortcuts', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toContainText(
    'Create zoom at playhead',
  );
  await page.keyboard.press('b');
  await expect(regions).toHaveCount(1);
});
