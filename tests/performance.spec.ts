import { test, expect } from '@playwright/test';
import { motionCursorFixture } from '../src/cursor.fixture';

// Frames land on 16.7 ms vsync steps: a healthy 4x-throttled play is steady 30 fps (33.4 ms). Over
// 30 idle runs the worst frame was 167 ms and the worst long task 135 ms, with one busy neighbour on
// a 2-CPU orb 167 ms and 124 ms, and with two 200 ms and 210 ms. A 300 ms stall at play start gave
// 314 ms and 332 ms at the least, so 250 leaves 40 ms above the worst contention and 64 below it.
const STALL_MS = 250;
// Cadence ceiling for the slowest quarter of frames. It sits between the 2-vsync (33.4 ms) and
// 3-vsync (50 ms) steps, so a play that holds 30 fps passes, and one that adds ~30 ms of work to
// every frame (50 to 66.7 ms) fails. A tail percentile such as p95 sits on a step edge (100 ms), so
// it is logged but not asserted. A busy neighbour on a 2-CPU orb slows the cadence of about one
// play in twenty with no way to tell it from a regression in one run, so a slow play is replayed:
// ATTEMPTS plays, and the cadence must hold in at least one.
const CADENCE_MS = 42;
const ATTEMPTS = 3;

type Frames = { rafP75: number; rafCount: number };
const steady = (r: Frames) => r.rafP75 < CADENCE_MS && r.rafCount > 100;

// Cadence tips over whenever the host steals a burst of frames, so a slow play is replayed from the
// start and fails only when no attempt holds it. A real regression slows every replay. A pass that
// needed a replay is logged and annotated, so a drifting orb never goes unnoticed.
async function replayUntilSteady<T extends Frames>(
  first: T,
  replay: (attempt: number) => Promise<T>,
): Promise<T> {
  let last = first;
  let attempts = 1;
  for (; !steady(last) && attempts < ATTEMPTS; attempts++) last = await replay(attempts + 1);
  const held = steady(last) ? `held on attempt ${attempts}` : 'never held';
  console.log(JSON.stringify({ cadenceAttempts: attempts, cadenceHeld: steady(last) }));
  if (attempts > 1)
    test.info().annotations.push({ type: 'cadence replay', description: `${held} of ${ATTEMPTS}` });
  return last;
}

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
    // Setup, then up to ATTEMPTS five-second plays, which a starved orb stretches past 30 seconds.
    test.setTimeout(60_000);
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
      await page.getByText('Cleanup', { exact: true }).click();
      const stabilize = page.getByLabel('Stabilize recorded shapes', { exact: true });
      await stabilize.check();
      await expect(stabilize).toBeChecked();
      const rotate = page.getByLabel('Rotate with movement', { exact: true });
      await rotate.check();
      await expect(rotate).toBeChecked();
      const animation = page.getByLabel('Cursor animation style', { exact: true });
      await animation.selectOption('rapid');
      await expect(animation).toHaveValue('rapid');
      // Frozen legacy ten-second-hold workload, including its two original source anchors.
      const zooms = [
        {
          id: 'auto-s1-0',
          start: 0,
          duration: 180,
          scale: 1.8,
          x: 50,
          y: 50,
          follow: 'focused',
          source: { assetId: 'landscape', clipId: 's1', start: 0, x: 0.5, y: 0.5 },
        },
        {
          id: 'auto-s2-246',
          start: 216,
          duration: 144,
          scale: 1.8,
          x: 61.64026050666017,
          y: 30.71365766142443,
          follow: 'focused',
          source: {
            assetId: 'landscape',
            clipId: 's2',
            start: 246,
            x: 0.5823132707256684,
            y: 0.3071365766142443,
          },
        },
      ];
      const downloadEvent = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Save project', exact: true }).click();
      const stream = await (await downloadEvent).createReadStream();
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const project = JSON.parse(Buffer.concat(chunks).toString());
      await page.getByLabel('Open local project').setInputFiles({
        name: 'frozen-legacy-performance.clipper.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify({ ...project, zooms })),
      });
      await expect(page.getByRole('button', { name: 'Select zoom', exact: true })).toHaveCount(2);
      await page.getByRole('button', { name: 'Select zoom', exact: true }).first().click();
      await expect(page.getByLabel('Camera follow')).toHaveValue('focused');
    }
    // Sampling is armed before the click, so a stall inside the click itself is measured too.
    const sample = async (attempt: number) => {
      await page.evaluate(() => {
        Reflect.get(window, '__stopPerf')?.(); // → detaches the previous attempt
        const perf: Perf = { start: 0, done: false, firstAdvance: 0, frames: [], longTasks: [] };
        const observer = new PerformanceObserver((list) => {
          perf.longTasks.push(
            ...list.getEntries().map(({ startTime, duration }) => ({ startTime, duration })),
          );
        });
        observer.observe({ type: 'longtask', buffered: false });
        const onClick = (event: MouseEvent) => {
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
        };
        document.addEventListener('click', onClick, true);
        Object.assign(window, {
          __perf: perf,
          __stopPerf: () => {
            observer.disconnect();
            document.removeEventListener('click', onClick, true);
          },
        });
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
          rafP75: sorted[Math.floor(sorted.length * 0.75)],
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
          attempt,
          scriptSeconds:
            metric(after.metrics, 'ScriptDuration') - metric(before.metrics, 'ScriptDuration'),
          taskSeconds:
            metric(after.metrics, 'TaskDuration') - metric(before.metrics, 'TaskDuration'),
          cpuThrottle: 4,
          follow,
          url: new URL(page.url()).origin,
        }),
      );
      await page.keyboard.press('k');
      return result;
    };

    // The first, cold play must start promptly and never stall. A percentile hides one long
    // freeze, so the worst frame and the worst task are bounded too.
    const first = await sample(1);
    expect(first.firstAdvance).toBeGreaterThan(0);
    expect(first.firstAdvance).toBeLessThan(1000);
    expect(first.rafMax).toBeLessThan(STALL_MS);
    expect(first.longTaskMax).toBeLessThan(STALL_MS);
    const cadence = await replayUntilSteady(first, async (attempt) => {
      await page.getByRole('slider', { name: 'Timeline playhead' }).fill('0');
      return sample(attempt);
    });
    expect(cadence.rafP75).toBeLessThan(CADENCE_MS);
    expect(cadence.rafCount).toBeGreaterThan(100);
  });
}

for (const cpuThrottle of [4, 1]) {
  test(`rewind readouts stay bounded while transport keeps seeking at every speed${cpuThrottle === 1 ? ' without CPU throttling' : ''}`, async ({
    page,
  }) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottle });
    await page.goto(process.env.PERF_URL || (process.env.CI ? 'http://127.0.0.1:5173' : '/'));
    await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
    const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
    for (const presses of [1, 2, 3]) {
      await playhead.fill('330');
      await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
      for (let press = 0; press < presses; press++) await page.keyboard.press('j');
      const speed = 2 ** (presses - 1);
      await expect(page.getByTestId('transport-state')).toHaveText(`Rewinding · ${speed}×`);
      const sample = await page.getByTestId('timecode').evaluate(async (readout) => {
        let changes = 0;
        const observer = new MutationObserver(() => changes++);
        observer.observe(readout, { subtree: true, childList: true, characterData: true });
        const start = performance.now();
        await new Promise((resolve) => setTimeout(resolve, 1500));
        observer.disconnect();
        return { changes, elapsed: performance.now() - start };
      });
      await page.keyboard.press('k');
      await expect(page.getByTestId('transport-state')).toHaveText('Paused');
      const held = Number(await playhead.inputValue());
      expect(held).toBeLessThan(330 - 30 * speed);
      expect(held).toBeGreaterThan(0);
      expect(sample.changes).toBeGreaterThan(5);
      // One in-flight paint may straddle the observation window.
      expect(sample.changes).toBeLessThanOrEqual(Math.ceil(sample.elapsed / 100) + 1);
      await expect
        .poll(() =>
          page
            .locator('[data-testid="camera-mask"] video:visible')
            .evaluate((video: HTMLVideoElement) => Math.round(video.currentTime * 30)),
        )
        .toBe(held);
      console.log(JSON.stringify({ ...sample, speed, held, cpuThrottle }));
    }
  });
}
