import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const status = (page: Page) => page.locator('.app-footer [role="status"]');
const fixture = (name: string) => ({
  name,
  mimeType: 'audio/mp4',
  buffer: readFileSync(`tests/fixtures/${name}`),
});

// Audio and model files must never leave the browser: every request outside the app's own origin
// fails the test.
async function guardNetwork(page: Page) {
  const outside: string[] = [];
  await page.route(
    (url) => !['127.0.0.1', 'localhost'].includes(url.hostname),
    (route) => {
      outside.push(route.request().url());
      return route.abort();
    },
  );
  return outside;
}

// Records each confirm the app raises and answers no, so nothing is discarded.
function refusePrompts(page: Page) {
  const prompts: string[] = [];
  page.on('dialog', (dialog) => {
    prompts.push(dialog.message());
    void dialog.dismiss();
  });
  return prompts;
}

const tryOpen = (page: Page) =>
  page.getByLabel('Open local project').setInputFiles({
    name: 'other.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{}'),
  });

async function importSource(page: Page, name: string) {
  await page.getByLabel('Import local media').setInputFiles([fixture(name)]);
  await page.getByRole('button', { name: `Select ${name}`, exact: true }).click();
}

test('transcribes a public-domain speech locally, keeps playback moving and saves the transcript', async ({
  page,
}) => {
  test.setTimeout(120000);
  const outside = await guardNetwork(page);
  const prompts = refusePrompts(page);
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await importSource(page, 'jfk.m4a');
  const panel = page.getByRole('region', { name: 'Transcript' });
  // The timeline keeps playing while the worker transcribes.
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  await page.getByRole('button', { name: 'Play composition', exact: true }).click();
  await panel.getByRole('button', { name: 'Transcribe', exact: true }).click();
  const progress = panel.getByRole('progressbar', { name: 'Transcription progress' });
  await expect(progress).toBeVisible();
  const before = Number(await playhead.inputValue());
  await expect.poll(async () => Number(await playhead.inputValue())).toBeGreaterThan(before + 15);
  await expect(status(page)).toHaveText('Transcribed jfk.m4a.', { timeout: 60000 });
  const segments = panel.getByRole('listitem');
  await expect(panel).toContainText(/ask not what your country can do for you/i);
  await expect(segments.first()).toContainText('00:00');
  // A segment seeks the source preview to its start.
  await segments.last().getByRole('button').click();
  const start = await segments.last().locator('time').textContent();
  const seconds = await page
    .locator('.source-audio audio')
    .evaluate((a: HTMLAudioElement) => a.currentTime);
  expect(seconds).toBeGreaterThan(5);
  expect(seconds).toBeLessThan(11);
  expect(start).toBe(`00:0${Math.floor(seconds)}`);
  // A new transcript is unsaved work, so opening another project asks first.
  await tryOpen(page);
  await expect.poll(() => prompts).toEqual(['Open this project and discard your unsaved edits?']);

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const saved = JSON.parse(readFileSync(await (await download).path(), 'utf8'));
  const media = saved.media.find((item: { name: string }) => item.name === 'jfk.m4a');
  expect(media.transcript.model).toBe('whisper-tiny.en@794207f');
  expect(media.transcript.segments.at(-1).end).toBeLessThanOrEqual(11);
  // Saving clears it, so reopening the saved project asks nothing.
  await page.getByLabel('Open local project').setInputFiles({
    name: 'speech.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(saved)),
  });
  await page.getByRole('button', { name: 'Select jfk.m4a', exact: true }).click();
  await expect(panel).toContainText(/ask not what your country can do for you/i);
  await expect(panel.getByRole('button', { name: 'Transcribe again' })).toBeEnabled();
  expect(prompts).toHaveLength(1);
  // Opening a project over a running job stops it, so its result never lands in the new project.
  await panel.getByRole('button', { name: 'Transcribe again' }).click();
  await expect.poll(() => page.workers().length).toBe(1);
  page.removeAllListeners('dialog');
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByLabel('Open local project').setInputFiles({
    name: 'speech.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(saved)),
  });
  const reopened = 'Project reopened. Embedded media restored locally; no relinking or upload.';
  await expect(status(page)).toHaveText(reopened);
  await expect.poll(() => page.workers().length).toBe(0);
  await page.waitForTimeout(5000);
  await expect(status(page)).toHaveText(reopened);
  expect(outside).toEqual([]);
});

test('cancels without a result, reruns, and reports silence and a source with no audio', async ({
  page,
}) => {
  test.setTimeout(120000);
  const outside = await guardNetwork(page);
  const prompts = refusePrompts(page);
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await importSource(page, 'jfk.m4a');
  const panel = page.getByRole('region', { name: 'Transcript' });
  await panel.getByRole('button', { name: 'Transcribe', exact: true }).click();
  // Cancel once the worker runs, so cancelling has to stop it.
  await expect(panel.getByText(/^(Loading transcription model|Transcribing)/)).toBeVisible();
  await expect.poll(() => page.workers().length).toBe(1);
  // A running transcription is work in progress, so opening a project asks first.
  await tryOpen(page);
  await expect.poll(() => prompts).toHaveLength(1);
  await panel.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(status(page)).toHaveText('Transcription cancelled.');
  await expect.poll(() => page.workers().length).toBe(0);
  await expect(panel.getByRole('listitem')).toHaveCount(0);
  await panel.getByRole('button', { name: 'Transcribe', exact: true }).click();
  await expect(status(page)).toHaveText('Transcribed jfk.m4a.', { timeout: 60000 });

  await importSource(page, 'silence.m4a');
  await panel.getByRole('button', { name: 'Transcribe', exact: true }).click();
  await expect(status(page)).toHaveText('No speech found in silence.m4a.', { timeout: 60000 });
  await expect(panel).toContainText('No speech found.');
  // The demo's screen take has no audio track, so it cannot be transcribed.
  await page.getByRole('button', { name: 'Select Flower study', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Transcribe', exact: true })).toBeDisabled();
  await expect(panel).toContainText('This source has no audio track.');
  expect(outside).toEqual([]);
});

test('reports a missing model as not installed and any other model failure by its cause', async ({
  page,
}) => {
  test.setTimeout(60000);
  const outside = await guardNetwork(page);
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await importSource(page, 'jfk.m4a');
  const panel = page.getByRole('region', { name: 'Transcript' });
  const files = page.context();
  await files.route('**/models/**/config.json', (route) => route.fulfill({ status: 404 }));
  await panel.getByRole('button', { name: 'Transcribe', exact: true }).click();
  await expect(status(page)).toHaveText(
    'Could not transcribe jfk.m4a. The transcription model is not installed. Run npm run fetch:whisper.',
  );
  await files.unrouteAll();
  await files.route('**/models/**/*.onnx', (route) => route.fulfill({ status: 500 }));
  await panel.getByRole('button', { name: 'Transcribe', exact: true }).click();
  await expect(status(page)).toContainText('Could not transcribe jfk.m4a.', { timeout: 30000 });
  await expect(status(page)).not.toContainText('not installed');
  expect(outside).toEqual([]);
});
