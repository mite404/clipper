import { expect, test, type Page } from '@playwright/test';

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

const region = '[data-slot="toast-region"]';
const NOT_JSON = 'Could not open project. Project is not valid JSON.';
const regionVisibility = (page: Page) =>
  page.locator(region).evaluate((element) => getComputedStyle(element).visibility);

test('a save toast never covers the command menu: Export stays clickable at 320x480', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30_000 });
  const saving = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  await saving;
  const toast = page.locator('[data-slot="toast"]');
  await expect(toast).toBeVisible();
  await page.getByTestId('track-screen').locator('.timeline-clip').first().focus();
  await page.keyboard.press('Shift+Slash');
  const menu = page.getByRole('dialog', { name: 'Command menu' });
  const item = menu.getByRole('option', { name: 'Export video', exact: true });
  await expect(item).toBeVisible();
  // The toast is drawn nowhere over the open menu.
  expect(await regionVisibility(page)).toBe('hidden');
  const hit = await item.evaluate((option) => {
    const box = option.getBoundingClientRect();
    return option.contains(
      document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2),
    );
  });
  expect(hit).toBe(true);
  // A short timeout: a toast that takes the click would otherwise clear before Playwright gives up.
  await item.click({ timeout: 1500 });
  await expect(page.getByRole('dialog', { name: 'Export video' })).toBeVisible();
});

test('an error toast stays until dismissed, and its Dismiss cannot run a command under the menu', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30_000 });
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByLabel('Open local project').setInputFiles({
    name: 'invalid.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{}'),
  });
  const error = page.locator('.toast[data-type="error"]');
  await expect(error).toBeVisible();
  // The announcement goes through ui-sdk's own live region, apart from the toast list.
  await expect(
    page.locator('[data-ui-sdk-announcer]').filter({ hasText: 'Could not open project' }),
  ).toHaveCount(1);
  await page.waitForTimeout(5500); // past the success-toast lifetime: only an error is left
  await page.getByTestId('track-screen').locator('.timeline-clip').first().focus();
  await page.keyboard.press('Shift+Slash');
  const menu = page.getByRole('dialog', { name: 'Command menu' });
  await expect(menu).toBeVisible();
  // The error is still pending, and nothing of the toast, its Dismiss included, is drawn, clickable
  // or in the accessibility tree over the menu.
  await expect(error).toHaveCount(1);
  expect(await regionVisibility(page)).toBe('hidden');
  await expect(page.getByRole('button', { name: 'Dismiss' })).toHaveCount(0);
  // A fresh error raised while the menu is open still lands in the announcer, though its toast is
  // hidden. Only the app's own message for this file proves it: the shared prefix alone would also
  // match the first announcement, or a truncated one.
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByLabel('Open local project').setInputFiles({
    name: 'broken.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from('not json at all'),
  });
  await expect(page.locator('[data-ui-sdk-announcer]').filter({ hasText: NOT_JSON })).toHaveCount(
    1,
  );
  const dismissHit = await error
    .first()
    .locator('.toast-close')
    .evaluate((close) => {
      const box = close.getBoundingClientRect();
      return close.contains(
        document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2),
      );
    });
  expect(dismissHit).toBe(false);
  // Closing the menu brings the errors back, still undismissed.
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect.poll(() => regionVisibility(page)).toBe('visible');
  await expect(page.getByRole('dialog', { name: 'Export video' })).toBeHidden();
  // Both errors are back, still undismissed, and each Dismiss works.
  await expect(error).toHaveCount(2);
  await error.first().getByRole('button', { name: 'Dismiss' }).click();
  await expect(error).toHaveCount(1);
  await error.getByRole('button', { name: 'Dismiss' }).click();
  await expect(error).toHaveCount(0);
});

test('F6 and Tab cannot reach a pending error toast while the command menu is open', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30_000 });
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByLabel('Open local project').setInputFiles({
    name: 'invalid.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{}'),
  });
  const error = page.locator('.toast[data-type="error"]');
  await expect(error).toBeVisible();
  await page.getByTestId('track-screen').locator('.timeline-clip').first().focus();
  await page.keyboard.press('Shift+Slash');
  const menu = page.getByRole('dialog', { name: 'Command menu' });
  await expect(menu).toBeVisible();
  const inToasts = () =>
    page.evaluate((selector) => !!document.activeElement?.closest(selector), region);
  // F6 is the SDK's Notifications shortcut; Tab would then land on Dismiss and Enter dismiss it.
  await page.keyboard.press('F6');
  expect(await inToasts()).toBe(false);
  await page.keyboard.press('Tab');
  expect(await inToasts()).toBe(false);
  await expect(error).toHaveCount(1);
  await expect(menu).toBeVisible();
  // Closing the menu restores it, still pending.
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(error).toBeVisible();
});
