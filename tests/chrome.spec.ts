import { test, expect, type Page } from '@playwright/test';

// The owner-directed chrome batch: media-bin add hints on hover or focus, true fullscreen for the
// compose canvas, and track selection from the layer names with a one-step Delete.
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

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
