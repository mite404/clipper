#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const journeys = {
  editor: {
    specs: [
      'editor.spec.ts',
      'transport-end.spec.ts',
      'transport-lifecycle.spec.ts',
      'refinements.spec.ts',
    ],
    tools: true,
    production: true,
  },
  media: { specs: ['editor.spec.ts'], grep: 'imports', production: true },
  composition: {
    specs: ['editor.spec.ts', 'refinements.spec.ts'],
    grep: 'splice, scrub|swaps frames|marks a mouse',
    production: true,
  },
  delivery: { specs: ['refinements.spec.ts'], grep: 'reopens|malformed', production: true },
  export: { specs: ['export.spec.ts'], tools: true },
  storybook: { specs: ['storybook.spec.ts'], storybook: true },
  performance: { specs: ['performance.spec.ts'], production: true, repeat: 5 },
  all: { specs: [], tools: true, production: true, storybook: true },
};

function help() {
  console.log('Usage: .agents/skills/verify-clipper/scripts/verify.mjs <journey|doctor|list>');
  console.log(`Journeys: ${Object.keys(journeys).join(', ')}`);
  console.log(
    'Each run owns fresh ports, browser contexts, builds and evidence. No shared preview required.',
  );
  console.log(
    'CHROME_PATH optionally selects Chrome. VERIFY_EVIDENCE overrides the evidence parent directory.',
  );
}

async function doctor(needsTools) {
  for (const file of ['landscape.mp4', 'portrait.mp4', 'voice.wav', 'music.wav']) {
    await access(path.join(root, 'public/media', file));
  }
  const { chromium } = await import('@playwright/test');
  const scratch = await mkdtemp(path.join(tmpdir(), 'clipper-doctor-'));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
    const context = await browser.newContext({ recordVideo: { dir: scratch } });
    await context.newPage();
    await context.close();
  } catch (error) {
    throw new Error(
      `Browser launch failed. Install with npx playwright install chromium, or correct CHROME_PATH. ${error.message}`,
    );
  } finally {
    await browser?.close();
    await rm(scratch, { recursive: true, force: true });
  }
  if (needsTools) {
    for (const tool of ['ffmpeg', 'ffprobe']) {
      const result = spawnSync(tool, ['-version'], { encoding: 'utf8' });
      if (result.status !== 0) throw new Error(`Install ${tool} before running export journeys.`);
    }
  }
  console.log('Clipper CLI doctor OK. Real Chromium launches and required media/tools exist.');
}

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

async function run(journey, name) {
  const parent = path.resolve(
    root,
    process.env.VERIFY_EVIDENCE || '.amp/in/artifacts/verification',
  );
  await mkdir(parent, { recursive: true });
  const evidence = await mkdtemp(path.join(parent, `${name}-`));
  const scratch = await mkdtemp(path.join(tmpdir(), 'clipper-build-'));
  const log = createWriteStream(path.join(evidence, 'run.log'));
  const env = {
    ...process.env,
    VERIFY_JOURNEY: name,
    VERIFY_BUILD_DIR: scratch,
    VERIFY_PRODUCTION: journey.production ? '1' : '0',
  };
  const ports = new Set();
  for (const key of ['BASE_URL', 'PERF_URL', 'STORYBOOK_URL']) {
    let port;
    do {
      port = await freePort();
    } while (ports.has(port));
    ports.add(port);
    env[key] = `http://127.0.0.1:${port}`;
  }
  env.PLAYWRIGHT_JSON_OUTPUT_FILE = path.join(evidence, 'results.json');
  let child;
  let signal;
  let interruptTimer;
  const interrupt = (received) => {
    signal = received;
    child?.kill('SIGINT');
    if (!interruptTimer) {
      interruptTimer = setTimeout(() => child?.kill('SIGINT'), 5000);
      interruptTimer.unref();
    }
  };
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', interrupt);
  const command = (args) =>
    new Promise((resolve, reject) => {
      if (signal) return reject(new Error(`Interrupted by ${signal}`));
      child = spawn(process.execPath, args, { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
      for (const [stream, output] of [
        [child.stdout, process.stdout],
        [child.stderr, process.stderr],
      ]) {
        stream.on('data', (chunk) => {
          output.write(chunk);
          log.write(chunk);
        });
      }
      child.once('error', reject);
      child.once('close', (code) => {
        child = undefined;
        resolve(code ?? 1);
      });
    });
  const summary = { journey: name, status: 'failed', ports: [...ports], evidence };
  console.log(`Evidence: ${evidence}`);
  try {
    await doctor(journey.tools || name === 'all');
    if (journey.production) {
      if (
        await command([
          'node_modules/vite/bin/vite.js',
          'build',
          '--outDir',
          path.join(scratch, 'editor'),
        ])
      ) {
        throw new Error('Production build failed. See run.log.');
      }
    }
    if (journey.storybook) {
      if (
        await command([
          'node_modules/.bin/storybook',
          'build',
          '--disable-telemetry',
          '--output-dir',
          path.join(scratch, 'storybook'),
        ])
      ) {
        throw new Error('Storybook build failed. See run.log.');
      }
    }
    const args = [
      'node_modules/@playwright/test/cli.js',
      'test',
      '--config',
      '.agents/skills/verify-clipper/scripts/playwright.config.mjs',
      '--workers=1',
      '--reporter=list,json',
      '--output',
      path.join(evidence, 'browser'),
      ...journey.specs,
    ];
    if (journey.grep) args.push('--grep', journey.grep);
    if (journey.repeat) args.push('--repeat-each', String(journey.repeat));
    const code = await command(args);
    const results = JSON.parse(await readFile(env.PLAYWRIGHT_JSON_OUTPUT_FILE, 'utf8'));
    summary.stats = results.stats;
    if (
      signal ||
      code ||
      !results.stats.expected ||
      results.stats.unexpected ||
      results.stats.skipped ||
      results.stats.flaky
    ) {
      throw new Error(
        'Journey failed, skipped, flaky, or selected zero tests. Inspect results.json and browser traces.',
      );
    }
    summary.status = 'passed';
  } catch (error) {
    summary.error = error.message;
    log.write(error.message + '\n');
    console.error(error.message);
  } finally {
    clearTimeout(interruptTimer);
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', interrupt);
    await rm(scratch, { recursive: true, force: true });
    await new Promise((resolve) => log.end(resolve));
    await writeFile(path.join(evidence, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  }
  console.log(`Clipper ${name}: ${summary.status}. Evidence retained at ${evidence}`);
  return summary.status === 'passed' ? 0 : 1;
}

async function main() {
  const [name = '--help', ...extra] = process.argv.slice(2);
  if (extra.length) throw new Error('Expected one journey. Run --help for usage.');
  if (['--help', '-h', 'list'].includes(name)) {
    help();
    return 0;
  }
  if (name === 'doctor') {
    await doctor(true);
    return 0;
  }
  if (!Object.hasOwn(journeys, name)) {
    console.error(`Unknown journey: ${name}. Run --help.`);
    return 2;
  }
  return run(journeys[name], name);
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
