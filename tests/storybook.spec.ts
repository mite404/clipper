import { test, expect } from '@playwright/test';

const storybook = process.env.STORYBOOK_URL || 'http://localhost:6006';

test('shared library handles worst, empty, one and a thousand media items', async ({ page }) => {
  await page.goto(
    `${storybook}/iframe.html?id=clipper-shared-library--worst-case-media-bin&viewMode=story`,
  );
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await expect(page.getByRole('img', { name: 'Video preview unavailable' })).toBeVisible();
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
    await expect(page.getByRole('button', { name: /Select 2026/ })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Select Quarterly product launch/ }),
    ).toBeInViewport();
  }
  await page.getByRole('button', { name: 'Empty', exact: true }).click();
  await expect(page.getByTestId('media-status')).toHaveText('0 assets ready');
  await page.getByRole('button', { name: 'One', exact: true }).click();
  await expect(page.getByTestId('media-status')).toHaveText('1 asset ready');
  await page.getByRole('button', { name: '1,000', exact: true }).click();
  await expect(page.getByTestId('media-status')).toHaveText('1000 assets ready');
  await expect(page.locator('.asset')).toHaveCount(1000);
  await page.getByRole('button', { name: 'Worst case', exact: true }).click();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '24px';
  });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(320);
  await page.getByRole('button', { name: 'Demo data', exact: true }).click();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready');
});

test('composition and timeline records render the actual shared components', async ({ page }) => {
  await page.goto(
    `${storybook}/iframe.html?id=clipper-shared-library--side-by-side-composition&viewMode=story`,
  );
  await expect(page.getByTestId('camera-mask')).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('screen-mask')).toHaveCSS('border-radius', '22px');
  await page.goto(
    `${storybook}/iframe.html?id=clipper-shared-library--crop-and-zoom-inspector&viewMode=story`,
  );
  const preview = page.getByRole('button', { name: 'Composition: swap sides' });
  await expect(preview).toHaveCSS('flex-direction', 'row');
  await preview.click();
  await expect(preview).toHaveCSS('flex-direction', 'row-reverse');
  await preview.press('Space');
  await expect(preview).toHaveCSS('flex-direction', 'row');
  await page.goto(
    `${storybook}/iframe.html?id=clipper-shared-library--multitrack-timeline&viewMode=story`,
  );
  await expect(page.getByTestId('track-music').locator('svg[data-waveform]')).toBeVisible({
    timeout: 30000,
  });
  await page.getByRole('slider', { name: 'Timeline playhead' }).fill('60');
  await expect(page.getByRole('slider', { name: 'Timeline playhead' })).toHaveValue('60');
  const handle = page
    .getByTestId('track-screen')
    .getByRole('slider', { name: 'Trim left edge' })
    .first();
  await handle.focus();
  await page.keyboard.press('Shift+ArrowRight');
  await expect(handle).toHaveAttribute('aria-valuenow', '10');
  await page.goto(
    `${storybook}/iframe.html?id=clipper-shared-library--mouse-centered-zoom&viewMode=story`,
  );
  await expect(page.getByRole('button', { name: 'Set mouse focus on screen' })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.getByText(/Recordings do not contain cursor metadata/)).toBeVisible();
});
