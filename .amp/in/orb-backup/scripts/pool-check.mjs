// Throwaway check for REF-3: a pooled CanvasSink must hand the export loop the same pixels as an
// unpooled one, with two clips decoded in lockstep exactly as renderVideo consumes them.
// Usage: node pool-check.mjs <checkout dir> <port>
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const [dir, port] = process.argv.slice(2);
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
  await page.route('**/pool-fixture', (route) => route.fulfill({ contentType: 'text/html', body: '<html><body>pool</body></html>' }));
  await page.goto(`${url}pool-fixture`);
  const result = await page.evaluate(async () => {
    const { loadDemo } = await import('/src/media.ts');
    const { Input, BlobSource, ALL_FORMATS, CanvasSink } = await import('/node_modules/mediabunny/dist/bundles/mediabunny.mjs');
    const assets = await loadDemo();
    const times = Array.from({ length: 90 }, (_, i) => (20 + i) / 30); // frames 20..109, offset like a trimmed clip
    const open = async (id, options) => {
      const blob = await (await fetch(assets.find((a) => a.id === id).url)).blob();
      const track = await new Input({ source: new BlobSource(blob), formats: ALL_FORMATS }).getPrimaryVideoTrack();
      return new CanvasSink(track, options).canvasesAtTimestamps(times);
    };
    const ids = ['landscape', 'portrait'];
    const pooled = await Promise.all(ids.map((id) => open(id, { poolSize: 2 })));
    const fresh = await Promise.all(ids.map((id) => open(id, undefined)));
    const probe = new OffscreenCanvas(160, 90).getContext('2d', { willReadFrequently: true });
    const read = (canvas) => {
      probe.drawImage(canvas, 0, 0, 160, 90);
      return probe.getImageData(0, 0, 160, 90).data;
    };
    const out = { frames: 0, mismatched: 0, changedFromPrevious: 0, distinctPooledCanvases: [0, 0] };
    const seen = [new Set(), new Set()];
    const previous = [null, null];
    for (let frame = 0; frame < times.length; frame++) {
      for (let v = 0; v < ids.length; v++) {
        const a = (await pooled[v].next()).value;
        const b = (await fresh[v].next()).value;
        seen[v].add(a.canvas);
        const pa = read(a.canvas);
        const pb = read(b.canvas);
        out.frames++;
        if (pa.some((value, i) => value !== pb[i])) out.mismatched++;
        if (previous[v] && pa.some((value, i) => Math.abs(value - previous[v][i]) > 8)) out.changedFromPrevious++;
        previous[v] = pa;
      }
    }
    out.distinctPooledCanvases = seen.map((s) => s.size);
    return out;
  });
  console.log(JSON.stringify(result));
  await browser.close();
} finally {
  process.kill(-server.pid);
}
