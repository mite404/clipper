// REF-15 measurement: time from renderVideo start to the end of the audio mix (first progress
// >= 0.1), through the real exporter, for compressed audio clips of growing length.
// Usage: node mix-timing.mjs <checkout dir> <port> <audio file> <seconds,seconds,...>
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const [dir, port, audioPath, list] = process.argv.slice(2);
const { chromium } = createRequire(`${dir}/package.json`)('@playwright/test');
const server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', port, '--strictPort'], { cwd: dir, stdio: 'ignore', detached: true });
try {
  const url = `http://127.0.0.1:${port}/`;
  for (let i = 0; i < 60; i++) {
    if (await fetch(url).then((r) => r.ok, () => false)) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const audio = readFileSync(audioPath);
  await page.route('**/mix-fixture', (route) => route.fulfill({ contentType: 'text/html', body: '<html><body>mix</body></html>' }));
  await page.route('**/long-audio', (route) => route.fulfill({ contentType: 'application/octet-stream', body: audio }));
  await page.goto(`${url}mix-fixture`);
  for (const seconds of list.split(',').map(Number)) {
    const result = await page.evaluate(async (seconds) => {
      const { readMedia } = await import('/src/media.ts');
      const { renderVideo } = await import('/src/export.ts');
      const blob = await (await fetch('/long-audio')).blob();
      const asset = await readMedia(blob, 'long', 'long');
      const controller = new AbortController();
      const started = performance.now();
      let mixed = 0;
      try {
        await renderVideo({
          assets: [asset],
          clips: [{ id: 'v', assetId: 'long', track: 'voice', start: 0, duration: seconds * 30, offset: 30 }],
          zooms: [],
          layout: { radius: 16, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
          muted: [],
          width: 1920,
          signal: controller.signal,
          onProgress: (value) => {
            if (value >= 0.1 && !mixed) {
              mixed = performance.now() - started;
              controller.abort();
            }
          },
        });
      } catch (error) {
        if (!mixed) return { seconds, error: String(error) };
      }
      return { seconds, mixMs: Math.round(mixed) };
    }, seconds);
    console.log(JSON.stringify(result));
  }
  await browser.close();
} finally {
  process.kill(-server.pid);
}
