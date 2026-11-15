// Screenshot the composition preview at a held 2x zoom, unswapped and swapped.
// Usage: node zoom-shot.mjs <checkout dir> <port> <output prefix>
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const [dir, port, prefix] = process.argv.slice(2);
const { chromium } = createRequire(`${dir}/package.json`)('@playwright/test');
const server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', port, '--strictPort'], { cwd: dir, stdio: 'ignore', detached: true });
try {
  const url = `http://127.0.0.1:${port}/`;
  for (let i = 0; i < 60; i++) {
    if (await fetch(url).then((r) => r.ok, () => false)) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(url);
  await page.getByTestId('media-status').filter({ hasText: '4 assets ready' }).waitFor({ timeout: 30000 });
  await page.getByRole('button', { name: 'Add zoom at playhead' }).first().click();
  await page.getByRole('button', { name: 'Mark mouse position' }).click();
  const box = await page.getByRole('button', { name: 'Set mouse focus on screen' }).boundingBox();
  await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.65);
  await page.getByRole('slider', { name: 'Zoom level' }).fill('2');
  await page.getByRole('slider', { name: 'Timeline playhead' }).fill('60');
  await page.waitForTimeout(1500);
  const stage = page.getByTestId('screen-mask').locator('xpath=..');
  await stage.screenshot({ path: `${prefix}-zoomed.png` });
  await page.getByRole('button', { name: 'Composition: swap sides' }).click();
  await page.waitForTimeout(1500);
  await stage.screenshot({ path: `${prefix}-zoomed-swapped.png` });
  await page.getByRole('button', { name: 'Mark mouse position' }).click();
  await page.waitForTimeout(300);
  await page.locator('.mouse-target').locator('xpath=..').screenshot({ path: `${prefix}-marking-swapped.png` });
  await browser.close();
} finally {
  process.kill(-server.pid);
}
