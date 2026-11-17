import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const cli = fileURLToPath(new URL('./verify.mjs', import.meta.url));
const root = fileURLToPath(new URL('../../../../', import.meta.url));

test('CI and isolated projects send UI journeys to production and source fixtures to dev', () => {
  for (const config of [
    'playwright.config.ts',
    '.agents/skills/verify-clipper/scripts/playwright.config.mjs',
  ]) {
    const env = {
      ...process.env,
      CI: '1',
      BASE_URL: 'http://127.0.0.1:4317',
      PERF_URL: 'http://127.0.0.1:4318',
      STORYBOOK_URL: 'http://127.0.0.1:4319',
      VERIFY_JOURNEY: 'all',
      VERIFY_BUILD_DIR: '/tmp/clipper-target-test',
      VERIFY_PRODUCTION: '1',
    };
    const loaded = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `const {default: config} = await import(${JSON.stringify(path.join(root, config))}); console.log(JSON.stringify(config.projects.map(project => ({...project, use: {...config.use, ...project.use}}))));`,
      ],
      { encoding: 'utf8', env },
    );
    assert.equal(loaded.status, 0, loaded.stderr);
    const projects = JSON.parse(loaded.stdout);
    const listed = spawnSync(
      process.execPath,
      [
        'node_modules/@playwright/test/cli.js',
        'test',
        '--config',
        config,
        '--list',
        '--reporter=json',
      ],
      { cwd: root, encoding: 'utf8', env },
    );
    assert.equal(listed.status, 0, listed.stderr);
    const report = JSON.parse(listed.stdout);
    const fixtures = [
      'export',
      'framing',
      'auto-zoom',
      'cursor-render',
      'cursor-shapes',
      'cursor-rotation',
      'cursor-speeds',
      'frame-image',
    ];
    const visit = (suite) => {
      for (const spec of suite.specs || []) {
        assert.equal(spec.tests.length, 1, `${config}: duplicated ${spec.title}`);
        const project = projects.find((entry) => entry.name === spec.tests[0].projectName);
        const name = spec.file.replace('.spec.ts', '');
        const expected = fixtures.includes(name)
          ? env.BASE_URL
          : name === 'storybook'
            ? env.STORYBOOK_URL
            : env.PERF_URL;
        assert.equal(project.use?.baseURL, expected, `${config}: ${spec.file}: ${spec.title}`);
      }
      for (const child of suite.suites || []) visit(child);
    };
    for (const suite of report.suites) visit(suite);
    assert.ok(report.suites.some((suite) => suite.file === 'cursor.spec.ts'));
  }
});

test('CI refuses missing or stale production output when the fresh build fails', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'clipper-ci-build-test-'));
  try {
    const loaded = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `const {default: config} = await import(${JSON.stringify(path.join(root, 'playwright.config.ts'))}); console.log(JSON.stringify(config.webServer.find(server => server.url === 'http://127.0.0.1:4318')));`,
      ],
      { encoding: 'utf8', env: { ...process.env, CI: '1', PERF_URL: 'http://127.0.0.1:4318' } },
    );
    assert.equal(loaded.status, 0, loaded.stderr);
    const server = JSON.parse(loaded.stdout);
    await writeFile(
      path.join(workspace, 'package.json'),
      JSON.stringify({ scripts: { build: 'node -e "process.exit(23)"' } }),
    );
    for (const stale of [false, true]) {
      if (stale) {
        await mkdir(path.join(workspace, 'dist'));
        await writeFile(path.join(workspace, 'dist/index.html'), '<h1>Stale production</h1>');
      }
      const result = spawnSync(server.command, {
        cwd: workspace,
        shell: true,
        encoding: 'utf8',
        timeout: 10000,
      });
      assert.equal(result.status, 23, result.stdout + result.stderr);
    }
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('isolated editor refuses a failed fresh build even with a stale production bundle', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'clipper-stale-test-'));
  try {
    const scripts = path.join(workspace, '.agents/skills/verify-clipper/scripts');
    await mkdir(scripts, { recursive: true });
    await cp(cli, path.join(scripts, 'verify.mjs'));
    await symlink(path.join(root, 'node_modules'), path.join(workspace, 'node_modules'));
    await symlink(path.join(root, 'public'), path.join(workspace, 'public'));
    await mkdir(path.join(workspace, 'dist'));
    await writeFile(path.join(workspace, 'dist/index.html'), '<h1>Stale production</h1>');
    await writeFile(
      path.join(workspace, 'vite.config.mjs'),
      'throw new Error("REF18 fresh build refused");',
    );
    await writeFile(
      path.join(scripts, 'playwright.config.mjs'),
      `export default { testDir: ${JSON.stringify(workspace)} };`,
    );
    await writeFile(
      path.join(workspace, 'editor.spec.ts'),
      'import { test } from "@playwright/test"; test("stale bundle must not reach tests", () => {});',
    );
    const result = spawnSync(process.execPath, [path.join(scripts, 'verify.mjs'), 'editor'], {
      encoding: 'utf8',
      env: { ...process.env, VERIFY_EVIDENCE: path.join(workspace, 'evidence') },
      timeout: 30000,
    });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /REF18 fresh build refused/);
    assert.match(result.stderr, /Production build failed/);
    assert.doesNotMatch(result.stdout, /Running \d+ tests/);
    const [run] = await readdir(path.join(workspace, 'evidence'));
    const summary = JSON.parse(
      await readFile(path.join(workspace, 'evidence', run, 'summary.json')),
    );
    assert.equal(summary.status, 'failed');
    assert.equal(summary.stats, undefined);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('lists runnable journeys without launching services', () => {
  const result = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /media/);
  assert.match(result.stdout, /performance/);
  assert.match(result.stdout, /doctor/);
});

test('rejects unknown journeys instead of reporting a zero-test success', () => {
  const result = spawnSync(process.execPath, [cli, 'imaginary'], { encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Unknown journey/);
});

test('doctor diagnoses an invalid browser executable', () => {
  const result = spawnSync(process.execPath, [cli, 'doctor'], {
    encoding: 'utf8',
    env: { ...process.env, CHROME_PATH: '/missing/clipper-chrome' },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Browser launch failed/);
  assert.match(result.stderr, /CHROME_PATH/);
});

test('editor journey runs the transport lifecycle spec and no unrelated spec', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'clipper-select-test-'));
  try {
    const scripts = path.join(workspace, '.agents/skills/verify-clipper/scripts');
    await mkdir(scripts, { recursive: true });
    await cp(cli, path.join(scripts, 'verify.mjs'));
    await symlink(path.join(root, 'node_modules'), path.join(workspace, 'node_modules'));
    await symlink(path.join(root, 'public'), path.join(workspace, 'public'));
    await writeFile(path.join(workspace, 'index.html'), '<h1>Selection stub</h1>');
    await writeFile(
      path.join(scripts, 'playwright.config.mjs'),
      `export default { testDir: ${JSON.stringify(workspace)} };`,
    );
    for (const spec of [
      'editor',
      'transport-end',
      'refinements',
      'transport-lifecycle',
      'controls',
    ]) {
      await writeFile(
        path.join(workspace, `${spec}.spec.ts`),
        `import { test } from "@playwright/test"; test("${spec} ran", () => {});`,
      );
    }
    const result = spawnSync(process.execPath, [path.join(scripts, 'verify.mjs'), 'editor'], {
      encoding: 'utf8',
      env: { ...process.env, VERIFY_EVIDENCE: path.join(workspace, 'evidence') },
      timeout: 60000,
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const [run] = await readdir(path.join(workspace, 'evidence'));
    const results = JSON.parse(
      await readFile(path.join(workspace, 'evidence', run, 'results.json')),
    );
    assert.deepEqual(results.suites.map((suite) => suite.file).sort(), [
      'editor.spec.ts',
      'refinements.spec.ts',
      'transport-end.spec.ts',
      'transport-lifecycle.spec.ts',
    ]);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('native tab test launches the CHROME_PATH executable', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'clipper-native-path-test-'));
  try {
    const { chromium } = await import('@playwright/test');
    const launched = path.join(workspace, 'launched.txt');
    const wrapper = path.join(workspace, 'chrome-wrapper.sh');
    await writeFile(
      wrapper,
      '#!/bin/sh\nprintf "%s\\n" "$@" >> "$WRAPPER_LOG"\nexec "$WRAPPED_CHROME" "$@"\n',
      { mode: 0o755 },
    );
    const closed = createServer();
    await new Promise((resolve) => closed.listen(0, '127.0.0.1', resolve));
    const { port } = closed.address();
    await new Promise((resolve) => closed.close(resolve));
    const config = path.join(workspace, 'playwright.config.mjs');
    await writeFile(
      config,
      `export default { testDir: ${JSON.stringify(path.join(root, 'tests'))}, outputDir: ${JSON.stringify(path.join(workspace, 'results'))}, workers: 1, retries: 0, use: { baseURL: 'http://127.0.0.1:${port}' } };`,
    );
    const result = spawnSync(
      process.execPath,
      [
        'node_modules/@playwright/test/cli.js',
        'test',
        '--config',
        config,
        '--reporter=json',
        'transport-lifecycle',
        '--grep',
        'hiding the native tab',
      ],
      {
        cwd: root,
        encoding: 'utf8',
        env: {
          ...process.env,
          CHROME_PATH: wrapper,
          WRAPPED_CHROME: process.env.CHROME_PATH || chromium.executablePath(),
          WRAPPER_LOG: launched,
        },
        timeout: 60000,
      },
    );
    // The app is deliberately unreachable: the test must fail at navigation, after the browser
    // it launched has connected.
    assert.match(result.stdout, /ERR_CONNECTION_REFUSED/, result.stdout + result.stderr);
    const args = await readFile(launched, 'utf8');
    assert.match(args, /--remote-debugging-port=0/);
    assert.match(args, /clipper-visibility-/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('interruption retains a failed verdict and releases test server ports', async () => {
  const evidence = await mkdtemp(path.join(tmpdir(), 'clipper-cli-test-'));
  try {
    let output = '';
    let interrupted = false;
    const started = Date.now();
    const child = spawn(process.execPath, [cli, 'editor'], {
      env: { ...process.env, VERIFY_EVIDENCE: evidence },
      timeout: 30000,
    });
    child.stdout.on('data', (chunk) => {
      output += chunk;
      if (!interrupted && output.includes('Running ')) {
        interrupted = true;
        child.kill('SIGTERM');
      }
    });
    child.stderr.on('data', (chunk) => {
      output += chunk;
    });
    const code = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', resolve);
    });
    assert.equal(interrupted, true, output);
    assert.equal(code, 1, output);
    assert.ok(Date.now() - started < 25000, output);
    const [directory] = await readdir(evidence);
    const summary = JSON.parse(await readFile(path.join(evidence, directory, 'summary.json')));
    assert.equal(summary.status, 'failed');
    assert.ok(summary.error);
    assert.equal(summary.ports.length, 3);
    assert.equal(new Set(summary.ports).size, 3);
    assert.ok((await readFile(path.join(evidence, directory, 'run.log'))).length);
    for (const port of summary.ports) {
      await assert.rejects(
        fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(1000) }),
      );
    }
  } finally {
    await rm(evidence, { recursive: true, force: true });
  }
});
