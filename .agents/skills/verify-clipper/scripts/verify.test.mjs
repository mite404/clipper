import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const cli = fileURLToPath(new URL('./verify.mjs', import.meta.url));

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
