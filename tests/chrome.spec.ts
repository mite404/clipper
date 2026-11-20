import { test, expect, type Page } from '@playwright/test';

// The owner-directed chrome batch: media-bin add hints on hover or focus, true fullscreen for the
// compose canvas, and track selection from the layer names with a one-step Delete.
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

test('a track name selects its track and Delete removes it with its clips as one undo step', async ({
  page,
}) => {
  await ready(page);
  const name = page.getByRole('button', { name: 'Select Voiceover track', exact: true });
  await name.click();
  await expect(name).toHaveAttribute('aria-pressed', 'true');

  // The click left the name focused in the timeline pane, so Delete owns the key.
  await page.keyboard.press('Delete');
  await expect(page.getByTestId('track-voice')).toHaveCount(0);
  await expect(name).toHaveCount(0);
  await expect(page.locator('.app-footer [role="status"]')).toContainText(
    'Voiceover and its clips removed',
  );

  // One undo brings the track and its clips back together.
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByTestId('track-voice')).toHaveCount(1);
  await expect(page.getByTestId('track-voice').locator('.timeline-clip')).toHaveCount(1);
});

test('a media card shows its add hint only while hovered or focused', async ({ page }) => {
  await ready(page);
  const card = page.getByRole('button', { name: 'Select Flower study' }).first();
  const hint = card.locator('.asset-name > svg:last-child');
  await card.scrollIntoViewIfNeeded();
  // Neither hovered nor focused: hidden but still laid out, so the row never shifts.
  await expect(hint).toHaveCSS('opacity', '0');
  await card.hover();
  await expect(hint).toHaveCSS('opacity', '1');
  await page.mouse.move(0, 0);
  await expect(hint).toHaveCSS('opacity', '0');
  await card.focus();
  await expect(hint).toHaveCSS('opacity', '1');
});

test('the Fit button plays the compose canvas fullscreen until Esc', async ({ page }) => {
  await ready(page);
  const stage = page.getByTestId('compose-monitor');
  const fit = page.getByRole('button', { name: 'Fit' });
  const pill = stage.locator('.esc-pill');
  // Hovered in the main view: the pill belongs to fullscreen only.
  await stage.hover();
  await expect(pill).toHaveCount(0);
  await fit.click();
  await expect(fit).toHaveAttribute('aria-pressed', 'true');
  await page.waitForFunction(
    () => document.fullscreenElement?.getAttribute('data-testid') === 'compose-monitor',
  );
  // Hovering the fullscreen video shows the pill; it stays rendered until Esc exits.
  const box = await stage.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(pill).toBeVisible();
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.fullscreenElement === null);
  await expect(fit).toHaveAttribute('aria-pressed', 'false');
  await expect(pill).toHaveCount(0);
});

test('the Fit caption stays static when the Fullscreen API is unavailable', async ({ page }) => {
  // Deleting on the prototype survives the document swap; an own property set this early does not.
  await page.addInitScript(() => {
    Reflect.deleteProperty(Element.prototype, 'requestFullscreen');
  });
  await ready(page);
  await expect(page.getByRole('button', { name: 'Fit' })).toHaveCount(0);
  await expect(page.locator('.compose-caption').getByText('Fit', { exact: true })).toBeVisible();
});
