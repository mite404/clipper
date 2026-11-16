import { test, expect } from '@playwright/test';

const storybookURL = process.env.STORYBOOK_URL || 'http://127.0.0.1:6006';

test('IconButton keyboard labels preserve focus, activation and native disabled behavior', async ({
  page,
}) => {
  await page.goto(`${storybookURL}/iframe.html?id=ui-iconbutton--normal&viewMode=story`);
  const play = page.getByRole('button', { name: 'Play', exact: true });
  await expect(play).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(play).toBeFocused();
  await expect(page.getByRole('tooltip')).toHaveText('Play', { timeout: 300 });
  await expect(page.getByRole('tooltip')).toHaveCSS('transition-duration', '0s');
  await expect(play).toHaveAccessibleName('Play');
  await expect(play).toHaveAccessibleDescription('');
  await expect(play).not.toHaveAttribute('title');
  await expect(play).toHaveAttribute('type', 'button');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toBeHidden();
  await expect(play).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(page.getByRole('status')).toHaveText('2 presses, 0 submits');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Next frame', exact: true })).toBeFocused();
  await expect(page.getByRole('tooltip')).toHaveText('Next frame', { timeout: 300 });
  await expect(page.getByRole('button', { name: 'Delete unavailable' })).toBeDisabled();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tooltip')).toBeHidden();
});

test('IconButton hover delay, neighbor handoff and hoverable content', async ({ page }) => {
  await page.goto(`${storybookURL}/iframe.html?id=ui-iconbutton--normal&viewMode=story`);
  const play = page.getByRole('button', { name: 'Play', exact: true });
  await expect(play).toBeVisible();
  await play.hover();
  await page.waitForTimeout(150);
  await expect(page.getByRole('tooltip')).toBeHidden();
  await page.mouse.move(400, 300);
  await page.waitForTimeout(450);
  await expect(page.getByRole('tooltip')).toBeHidden();
  await play.hover();
  await expect(page.getByRole('tooltip')).toHaveText('Play');
  await page.getByRole('tooltip').hover();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.getByRole('button', { name: 'Next frame', exact: true }).hover();
  const nextTip = page.getByRole('tooltip', { name: 'Next frame', exact: true });
  await expect(nextTip).toBeVisible({ timeout: 300 });
  await expect(nextTip).toHaveCSS('transition-duration', '0s');
  await page.keyboard.press('Escape');
  await expect(nextTip).toBeHidden();
  await play.click();
  await expect(page.getByRole('status')).toHaveText('1 presses, 0 submits');
});

test('IconButton long label fits a narrow viewport with reduced-motion fade only', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${storybookURL}/iframe.html?id=ui-iconbutton--stress&viewMode=story`);
  const trigger = page.getByRole('button').first();
  await trigger.hover();
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveCSS('transition-property', 'opacity');
  await expect(tooltip).toHaveCSS('scale', 'none');
  const box = await tooltip.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(480);
  expect(await tooltip.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
    true,
  );
  const closing = tooltip.evaluate(async (element) => {
    const samples = [];
    for (let frame = 0; frame < 12; frame++) {
      await new Promise(requestAnimationFrame);
      if (element.hasAttribute('data-ending-style')) samples.push(getComputedStyle(element).scale);
    }
    return samples;
  });
  await page.mouse.move(310, 460);
  const scales = await closing;
  expect(scales.length).toBeGreaterThan(0);
  expect(scales.every((scale) => scale === 'none')).toBe(true);
});

test('production editor IconButton tooltip preserves transport and accessible names', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const next = page.getByRole('button', { name: 'Next frame', exact: true });
  await next.hover();
  await expect(page.getByRole('tooltip')).toHaveText('Next frame');
  await expect(next).toHaveAccessibleDescription('');
  await next.click();
  await expect(page.getByTestId('timecode')).toHaveText('00:00:01');
  await expect(page.getByRole('tooltip')).toBeHidden();
});
