// Worst-case footer status: many unreadable files with long names. Usage: node import-fail-shot.mjs <baseURL> <outDir>
import { chromium } from '@playwright/test';
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
for (const [label, width, height] of [['desktop', 1440, 1000], ['narrow', 390, 900]]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  await page.goto(base);
  await page.getByTestId('media-status').filter({ hasText: '4 assets ready' }).waitFor({ state: 'attached', timeout: 30000 });
  console.log(label, 'footer before', JSON.stringify(await page.locator('.app-footer').boundingBox()));
  await page.getByTestId('media-status').filter({ hasText: '4 assets ready' }).waitFor({ state: 'attached', timeout: 30000 });
  await page.getByLabel('Import local media').setInputFiles(
    Array.from({ length: 6 }, (_, i) => ({
      name: `2026-11-15_Quarterly_Platform_Walkthrough_Review_v${i}_screen_recording_Chrome_1440p_Final.mp4`,
      mimeType: 'video/mp4',
      buffer: Buffer.from('not a video'),
    })),
  );
  await page.locator('.app-footer [role="status"]').filter({ hasText: 'Could not import' }).waitFor();
  console.log(label, 'scrollWidth', await page.evaluate(() => document.documentElement.scrollWidth),
    'footer', JSON.stringify(await page.locator('.app-footer').boundingBox()));
  console.log(await page.locator('.app-footer [role="status"]').innerText());
  await page.locator('.app-footer').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${out}/ref11-import-failures-${label}.png` });
  await page.close();
}
await browser.close();
