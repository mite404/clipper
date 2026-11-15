// REF-15 scratch check: export a short timeline with a trimmed, delayed compressed-audio clip plus
// the demo music, and save the encoded file so two builds can be compared sample by sample.
// Usage: node mix-export.mjs <checkout dir> <port> <audio file> <output file>
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const [dir, port, audioPath, outPath] = process.argv.slice(2);
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
  const base64 = await page.evaluate(async () => {
    const { readMedia, loadDemo } = await import('/src/media.ts');
    const { renderVideo } = await import('/src/export.ts');
    const demo = await loadDemo();
    const asset = await readMedia(await (await fetch('/long-audio')).blob(), 'long', 'long');
    const blob = await renderVideo({
      assets: [...demo, asset],
      clips: [
        { id: 'v', assetId: 'long', track: 'voice', start: 7, duration: 53, offset: 41 },
        { id: 'v2', assetId: 'long', track: 'voice', start: 60, duration: 30, offset: 200 },
        { id: 'm', assetId: 'music', track: 'music', start: 0, duration: 90, offset: 30 },
      ],
      zooms: [],
      layout: { radius: 16, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
      muted: [],
      width: 1920,
      onProgress: () => {},
    });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let text = '';
    for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(text);
  });
  writeFileSync(outPath, Buffer.from(base64, 'base64'));
  await browser.close();
} finally {
  process.kill(-server.pid);
}
