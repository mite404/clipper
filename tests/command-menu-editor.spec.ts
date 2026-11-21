import { expect, test } from '@playwright/test';

test('dispatches editor commands and returns focus without leaking timeline keys', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30_000 });
  const trigger = page.getByRole('button', { name: 'Search commands' });
  const menu = page.getByRole('dialog', { name: 'Command menu' });
  const search = menu.getByRole('combobox', { name: 'Search commands' });
  const row = (name: string) => menu.getByRole('option', { name });
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  const screen = page.getByTestId('track-screen').locator('.timeline-clip');

  await page.getByRole('button', { name: 'Select Flower study', exact: true }).click();
  await page.keyboard.press('Shift+Slash');
  await expect(menu).toBeHidden();
  await trigger.press('Space');
  await expect(search).toBeFocused();
  await expect(row('Undo')).toHaveAttribute('aria-disabled', 'true');
  await expect(row('Split selected clip')).toHaveAttribute('aria-disabled', 'true');
  await search.fill('undo');
  await search.press('Enter');
  await expect(menu).toBeVisible();
  await search.fill('not a command');
  await expect(menu.getByText('No matching commands')).toBeVisible();
  await search.press('Enter');
  await expect(menu).toBeVisible();
  await search.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(undo).toBeDisabled();

  await screen.first().click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+Slash');
  await expect(search).toBeFocused();
  await page.keyboard.press('Delete');
  await expect(screen).toHaveCount(2);
  await search.fill('split');
  await search.press('Enter');
  await expect(screen).toHaveCount(3);
  await expect(screen.first()).toBeFocused();

  await trigger.click();
  await search.fill('undo');
  await search.press('Enter');
  await expect(screen).toHaveCount(2);
  await expect(undo).toBeDisabled();

  await trigger.click();
  await search.fill('save');
  const saving = page.waitForEvent('download');
  await search.press('Enter');
  const saved = await saving;
  expect(saved.suggestedFilename()).toMatch(/\.clipper\.json$/);

  await trigger.click();
  await search.fill('open');
  const choosing = page.waitForEvent('filechooser');
  await search.press('Enter');
  await (await choosing).setFiles(await saved.path());
  await expect(
    page
      .getByText('Project reopened. Embedded media restored locally; no relinking or upload.', {
        exact: true,
      })
      .first(),
  ).toBeVisible();

  await trigger.click();
  await search.fill('export');
  await search.press('Enter');
  const exportDialog = page.getByRole('dialog', { name: 'Export video' });
  await expect(exportDialog).toBeVisible();
  await expect(exportDialog.locator(':focus')).toBeVisible();
  await exportDialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(trigger).toBeFocused();
  await expect(page.getByLabel('Video export progress')).toHaveCount(0);

  await page.getByRole('button', { name: 'Shortcuts', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
});

test('does not open the command menu while demo media is loading', async ({ page }) => {
  await page.route('**/media/landscape.mp4', () => {});
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Search commands' });
  await expect(trigger).toHaveAttribute('aria-disabled', 'true');
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Command menu' })).toBeHidden();
});
