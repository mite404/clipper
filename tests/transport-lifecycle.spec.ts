import { test, expect, chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Raster capture itself keeps Chromium visible; retain action/DOM/network traces instead.
test.use({ trace: { mode: 'on', screenshots: false }, video: 'off' });

test('held Space toggles once until released and pressed again', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page.getByRole('slider', { name: 'Timeline playhead' }).fill('60');
  await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
  const state = page.getByTestId('transport-state');
  await page.keyboard.down('Space');
  await expect(state).toHaveText('Playing · 1×');
  await expect
    .poll(() =>
      page
        .locator('[data-testid="camera-mask"] video:visible')
        .evaluate((video: HTMLVideoElement) => video.currentTime),
    )
    .toBeGreaterThan(2);
  for (let repeat = 0; repeat < 3; repeat++) {
    await page.keyboard.down('Space');
    await expect(state).toHaveText('Playing · 1×');
  }
  await page.keyboard.up('Space');
  await page.keyboard.down('Space');
  await expect(state).toHaveText('Paused');
  const held = await page.getByRole('slider', { name: 'Timeline playhead' }).inputValue();
  for (let repeat = 0; repeat < 3; repeat++) {
    await page.keyboard.down('Space');
    await expect(state).toHaveText('Paused');
  }
  await page.keyboard.up('Space');
  await expect(page.getByRole('slider', { name: 'Timeline playhead' })).toHaveValue(held);
  await page.keyboard.press('Space');
  await expect(state).toHaveText('Playing · 1×');
  await page.keyboard.press('k');
});

test('hiding the native tab pauses rewind and returning holds its frame', async ({
  baseURL,
}, info) => {
  test.setTimeout(60000);
  const profile = await mkdtemp(path.join(tmpdir(), 'clipper-visibility-'));
  // Playwright's normal page session emulates focus and keeps background tabs visible.
  const process = spawn(
    chromium.executablePath(),
    ['--headless=new', '--no-sandbox', '--remote-debugging-port=0', `--user-data-dir=${profile}`],
    { stdio: 'ignore' },
  );
  const exited = new Promise((resolve) => process.once('exit', resolve));
  let browser;
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    await expect
      .poll(() => readFile(portFile, 'utf8').catch(() => ''), { timeout: 30000 })
      .toMatch(/^\d+\n/);
    const port = (await readFile(portFile, 'utf8')).split('\n')[0];
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { noDefaults: true });
    const context = browser.contexts()[0];
    const page = await context.newPage();
    const other = await context.newPage();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.bringToFront();
    await page.goto(baseURL!);
    await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', {
      timeout: 30000,
    });
    const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
    const state = page.getByTestId('transport-state');
    for (const presses of [1, 3]) {
      await playhead.fill('150');
      await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
      for (let press = 0; press < presses; press++) await page.keyboard.press('j');
      await expect.poll(async () => Number(await playhead.inputValue())).toBeLessThan(140);
      await other.bringToFront();
      await expect.poll(() => page.evaluate(() => document.visibilityState)).toBe('hidden');
      await expect.poll(() => page.evaluate(() => document.hidden)).toBe(true);
      await info.attach(`native-hidden-${presses}`, {
        body: JSON.stringify(
          await page.evaluate(() => ({
            hidden: document.hidden,
            visibility: document.visibilityState,
            transport: document.querySelector('[data-testid="transport-state"]')?.textContent,
          })),
        ),
        contentType: 'application/json',
      });
      await expect(state).toHaveText('Paused');
      const held = Number(await playhead.inputValue());
      expect(held).toBeGreaterThan(0);
      await page.waitForTimeout(1000);
      await expect(playhead).toHaveValue(String(held));
      await page.bringToFront();
      await expect.poll(() => page.evaluate(() => document.visibilityState)).toBe('visible');
      await expect.poll(() => page.evaluate(() => document.hidden)).toBe(false);
      const paints = await page.evaluate(
        () =>
          new Promise<number[]>((resolve) => {
            const frames: number[] = [];
            const sample = () => {
              frames.push(
                Number(
                  document.querySelector<HTMLInputElement>('[aria-label="Timeline playhead"]')!
                    .value,
                ),
              );
              if (frames.length === 20) resolve(frames);
              else requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          }),
      );
      expect(paints).toEqual(Array(20).fill(held));
      await expect(state).toHaveText('Paused');
      const seconds = Math.floor(held / 30);
      await expect(page.getByTestId('timecode')).toHaveText(
        `00:${String(seconds).padStart(2, '0')}:${String(held % 30).padStart(2, '0')}`,
      );
      for (const track of ['camera', 'screen']) {
        await expect
          .poll(() =>
            page
              .locator(`[data-testid="${track}-mask"] video:visible`)
              .evaluate((video: HTMLVideoElement) => Math.round(video.currentTime * 30)),
          )
          .toBe(held);
      }
      const restart = await page.evaluate(() => performance.now());
      await page.keyboard.press('j');
      await expect(state).toHaveText('Rewinding · 1×');
      await expect.poll(async () => Number(await playhead.inputValue())).toBeLessThan(held - 3);
      const resumed = await page.evaluate(() => ({
        now: performance.now(),
        frame: Number(
          document.querySelector<HTMLInputElement>('[aria-label="Timeline playhead"]')!.value,
        ),
      }));
      expect(resumed.frame).toBeGreaterThanOrEqual(
        held - Math.ceil(((resumed.now - restart) * 30) / 1000),
      );
      await page.keyboard.press('k');
      expect(Number(await playhead.inputValue())).toBeGreaterThan(0);
    }
  } finally {
    await browser?.close();
    process.kill();
    await exited;
    await rm(profile, { recursive: true, force: true, maxRetries: 5 });
  }
});

test('shortcut guards, JKL shuttle and repeated arrow stepping stay intact', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  const state = page.getByTestId('transport-state');
  await playhead.fill('150');
  await playhead.focus();
  await page.keyboard.press('Space');
  await expect(state).toHaveText('Paused');
  await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
  for (const chord of ['Control+Space', 'Meta+Space', 'Alt+Space']) {
    await page.keyboard.press(chord);
    await expect(state).toHaveText('Paused');
  }
  for (const [key, label] of [
    ['j', 'Rewinding'],
    ['l', 'Playing'],
  ] as const) {
    for (const speed of [1, 2, 4]) {
      await page.keyboard.down(key);
      await expect(state).toHaveText(`${label} · ${speed}×`);
    }
    await page.keyboard.up(key);
    await page.keyboard.press('k');
    await expect(state).toHaveText('Paused');
  }
  await playhead.fill('150');
  await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
  for (let repeat = 0; repeat < 3; repeat++) await page.keyboard.down('ArrowRight');
  await page.keyboard.up('ArrowRight');
  await expect(playhead).toHaveValue('153');
  for (let repeat = 0; repeat < 2; repeat++) await page.keyboard.down('ArrowLeft');
  await page.keyboard.up('ArrowLeft');
  await expect(playhead).toHaveValue('151');
  await page.getByRole('button', { name: 'Shortcuts', exact: true }).click();
  await page.getByRole('heading', { name: 'Stay in the flow.' }).click();
  await page.keyboard.press('Space');
  await expect(state).toHaveText('Paused');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
