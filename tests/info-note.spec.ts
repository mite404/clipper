import { test, expect } from '@playwright/test';

const storybookURL = process.env.STORYBOOK_URL || 'http://127.0.0.1:6006';
const NOTE = 'None steps at recorded sample times. Raw motion still interpolates between them.';

test('InfoNote describes its button and toggles on press, Escape and outside press', async ({
  page,
}) => {
  await page.goto(`${storybookURL}/iframe.html?id=ui-infonote--normal&viewMode=story`);
  const info = page.getByRole('button', { name: 'About cursor animation', exact: true });
  await expect(info).toBeVisible();
  await expect(info).toHaveAccessibleDescription(NOTE);
  await expect(info).not.toHaveAttribute('title');
  await expect(page.getByRole('tooltip')).toBeHidden();
  await info.press('Enter');
  await expect(page.getByRole('tooltip')).toHaveText(NOTE);
  await info.press('Space');
  await expect(page.getByRole('tooltip')).toBeHidden();
  await info.click();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toBeHidden();
  await info.click();
  await expect(page.getByRole('tooltip')).toBeVisible();
  // The open tooltip overlays the page to catch an outside press, so press with raw mouse events.
  await page.mouse.click(10, 10);
  await expect(page.getByRole('tooltip')).toBeHidden();
});

test('InfoNote long note fits a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto(`${storybookURL}/iframe.html?id=ui-infonote--stress&viewMode=story`);
  const info = page.getByRole('button', { name: 'About cursor animation', exact: true });
  await info.click();
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  const box = await tooltip.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  expect(await tooltip.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
    true,
  );
});
