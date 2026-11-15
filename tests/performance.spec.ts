import { test, expect } from '@playwright/test';

test('play starts promptly without monopolizing the browser thread', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Performance.enable');
  const url = process.env.PERF_URL || (process.env.CI ? 'http://127.0.0.1:5173' : '/');
  await page.goto(url);
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page.evaluate(() => {
    performance.mark('ready');
    document.addEventListener(
      'click',
      (event) => {
        if (
          event.target instanceof Element &&
          event.target.closest('[aria-label="Play composition"]')
        )
          performance.mark('play-click');
      },
      true,
    );
  });
  const before = await cdp.send('Performance.getMetrics');
  await page.getByRole('button', { name: 'Play composition', exact: true }).click();
  const result = await page.evaluate(async () => {
    const longTasks: number[] = [];
    const observer = new PerformanceObserver((list) => {
      longTasks.push(...list.getEntries().map((entry) => entry.duration));
    });
    observer.observe({ type: 'longtask', buffered: false });
    const start = performance.getEntriesByName('play-click').at(-1)?.startTime ?? performance.now();
    let firstAdvance = 0;
    let previous = performance.now();
    const frames: number[] = [];
    while (performance.now() - start < 5000) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const now = performance.now();
      frames.push(now - previous);
      previous = now;
      const video = document.querySelector<HTMLVideoElement>('[data-testid="screen-mask"] video');
      if (!firstAdvance && video && !video.paused && video.currentTime > 0.05)
        firstAdvance = now - start;
    }
    observer.disconnect();
    frames.sort((a, b) => a - b);
    return {
      firstAdvance,
      longTasks,
      rafP95: frames[Math.floor(frames.length * 0.95)],
      rafCount: frames.length,
    };
  });
  const after = await cdp.send('Performance.getMetrics');
  const metric = (metrics: { name: string; value: number }[], name: string) =>
    metrics.find((m) => m.name === name)?.value ?? 0;
  console.log(
    JSON.stringify({
      ...result,
      scriptSeconds:
        metric(after.metrics, 'ScriptDuration') - metric(before.metrics, 'ScriptDuration'),
      taskSeconds: metric(after.metrics, 'TaskDuration') - metric(before.metrics, 'TaskDuration'),
      cpuThrottle: 4,
      url: new URL(page.url()).origin,
    }),
  );
  await page.keyboard.press('k');
  expect(result.firstAdvance).toBeGreaterThan(0);
  expect(result.firstAdvance).toBeLessThan(1000);
  expect(result.rafP95).toBeLessThan(100);
});
