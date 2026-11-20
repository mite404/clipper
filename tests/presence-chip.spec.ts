import { test, expect } from '@playwright/test';

const storybookURL = process.env.STORYBOOK_URL || 'http://127.0.0.1:6006';

test('PresenceChip shows the agent and opens its live session popover', async ({ page }) => {
  await page.goto(`${storybookURL}/iframe.html?id=ui-presencechip--normal&viewMode=story`);
  const chip = page.getByRole('button', { name: 'Claude Sonnet 5.5', exact: true });
  await expect(chip).toBeVisible();
  await expect(chip.locator('.presence-dot')).toBeVisible();

  await chip.press('Enter');
  const popover = page.getByRole('dialog', { name: 'Claude Sonnet 5.5 (AI)', exact: true });
  await expect(popover).toBeVisible();
  await expect(popover.getByText('2 calls')).toHaveAttribute('aria-live', 'polite');
  await expect(popover.getByRole('button', { name: 'Open assistant' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(popover).toHaveCount(0);

  await chip.click();
  await expect(popover).toBeVisible();
  await page.mouse.click(10, 10);
  await expect(popover).toHaveCount(0);
});

test('PresenceChip long name and count fit a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto(`${storybookURL}/iframe.html?id=ui-presencechip--stress&viewMode=story`);
  const chip = page.getByRole('button', { name: /ClaudeSonnet5\.5/ });
  await expect(chip).toBeVisible();
  await chip.click();
  const popover = page.getByRole('dialog', { name: /\(AI\)/ });
  await expect(popover).toBeVisible();
  await expect(popover.getByText('12345 calls')).toBeVisible();
  const box = await popover.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  expect(await popover.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
    true,
  );
});
