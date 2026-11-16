import { test, expect } from '@playwright/test';
import { motionCursorFixture } from '../src/cursor.fixture';

// ponytail: generous first bound. Local worst frame is 67 ms and worst task 64 ms under 4x
// throttling; CI logged neither before this change. Tighten towards 250 once CI runs show rafMax.
const STALL_MS = 500;

type Perf = {
  start: number;
  done: boolean;
  firstAdvance: number;
  frames: number[];
  longTasks: { startTime: number; duration: number }[];
};

for (const follow of [false, true]) {
  test(`play starts promptly without monopolizing the browser thread${follow ? ' with cursor follow' : ''}`, async ({
    page,
  }) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Performance.enable');
    const url = process.env.PERF_URL || (process.env.CI ? 'http://127.0.0.1:5173' : '/');
    await page.goto(url);
    await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
    if (follow) {
      await page.getByLabel('Attach cursor sidecar').setInputFiles({
        name: 'synthetic-motion.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(motionCursorFixture)),
      });
      await page.getByText('Advanced cursor', { exact: true }).click();
      const stabilize = page.getByLabel('Stabilize recorded shapes', { exact: true });
      await stabilize.check();
      await expect(stabilize).toBeChecked();
      const rotate = page.getByLabel('Rotate with movement', { exact: true });
      await rotate.check();
      await expect(rotate).toBeChecked();
      const animation = page.getByLabel('Cursor animation style', { exact: true });
      await animation.selectOption('rapid');
      await expect(animation).toHaveValue('rapid');
      await page.getByLabel('Automatic zoom hold seconds').fill('10');
      await page.getByRole('button', { name: 'Generate zooms', exact: true }).click();
      await expect(page.getByLabel('Automatic zoom result')).toContainText('2 automatic');
      await page.getByRole('button', { name: 'Select zoom', exact: true }).first().click();
      await expect(page.getByLabel('Camera follow')).toHaveValue('focused');
    }
    // Sampling is armed before the click, so a stall inside the click itself is measured too.
    await page.evaluate(() => {
      const perf: Perf = { start: 0, done: false, firstAdvance: 0, frames: [], longTasks: [] };
      Object.assign(window, { __perf: perf });
      new PerformanceObserver((list) => {
        perf.longTasks.push(
          ...list.getEntries().map(({ startTime, duration }) => ({ startTime, duration })),
        );
      }).observe({ type: 'longtask', buffered: false });
      document.addEventListener(
        'click',
        (event) => {
          const play =
            event.target instanceof Element &&
            event.target.closest('[aria-label="Play composition"]');
          if (!play || perf.start) return;
          perf.start = performance.now();
          let previous = perf.start;
          const tick = (now: number) => {
            perf.frames.push(now - previous); // → ms since the previous animation frame
            previous = now;
            const video = document.querySelector<HTMLVideoElement>(
              '[data-testid="screen-mask"] video',
            );
            if (!perf.firstAdvance && video && !video.paused && video.currentTime > 0.05)
              perf.firstAdvance = now - perf.start;
            if (now - perf.start < 5000) requestAnimationFrame(tick);
            else perf.done = true;
          };
          requestAnimationFrame(tick);
        },
        true,
      );
    });
    const before = await cdp.send('Performance.getMetrics');
    await page.getByRole('button', { name: 'Play composition', exact: true }).click();
    const result = await page.evaluate(async () => {
      const perf = (window as unknown as { __perf: Perf }).__perf;
      if (!perf.start) throw new Error('The Play click was never observed.');
      while (!perf.done) await new Promise((resolve) => setTimeout(resolve, 100));
      const sorted = [...perf.frames].sort((a, b) => a - b);
      return {
        firstAdvance: perf.firstAdvance,
        rafP95: sorted[Math.floor(sorted.length * 0.95)],
        rafMax: sorted.at(-1) ?? Infinity,
        rafCount: sorted.length,
        // Long tasks that ran during the five seconds after the click, not during page load.
        longTaskMax: Math.max(
          0,
          ...perf.longTasks
            .filter((task) => task.startTime + task.duration > perf.start)
            .map((task) => task.duration),
        ),
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
        follow,
        url: new URL(page.url()).origin,
      }),
    );
    await page.keyboard.press('k');
    expect(result.firstAdvance).toBeGreaterThan(0);
    expect(result.firstAdvance).toBeLessThan(1000);
    expect(result.rafP95).toBeLessThan(100);
    // A percentile hides one long freeze, so the worst frame and the worst task are bounded too.
    expect(result.rafCount).toBeGreaterThan(100);
    expect(result.rafMax).toBeLessThan(STALL_MS);
    expect(result.longTaskMax).toBeLessThan(STALL_MS);
  });
}
