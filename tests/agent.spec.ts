import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// CLIP-49: the in-app assistant drives clips through ui-sdk's bridge. No real model is called:
// the model host is mocked, and every other request outside the app's origin fails the test.

// The fake microphone plays the public JFK fixture, as 16 kHz mono WAV Chromium can read.
const speech = path.join(mkdtempSync(path.join(tmpdir(), 'clip49-')), 'jfk.wav');
execFileSync('ffmpeg', [
  '-v',
  'error',
  '-y',
  '-i',
  'tests/fixtures/jfk.m4a',
  '-ac',
  '1',
  '-ar',
  '16000',
  speech,
]);
test.use({
  launchOptions: {
    executablePath: process.env.CHROME_PATH,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${speech}`,
    ],
  },
});

type Snap = {
  ref: string;
  component: string;
  label?: string;
  start?: number;
  end?: number;
  offPage?: boolean;
}[];
const snapshot = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { clipperAgent: { snapshot(): Snap } }).clipperAgent.snapshot(),
  );
const act = (page: Page, steps: { ref: string; action: string; args?: unknown[] }[]) =>
  page.evaluate(
    (s) =>
      (
        window as unknown as { clipperAgent: { act(i: unknown): Promise<{ ok: boolean }> } }
      ).clipperAgent.act({ steps: s }),
    steps,
  );
const spans = async (page: Page) =>
  (await snapshot(page))
    .filter((c) => c.component === 'clip' && !c.offPage)
    .map((c) => [c.label, c.start, c.end]);

async function open(page: Page) {
  await page.goto('/?agent-test');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

test('the bridge trims and splits clips, one undo step per action, and a lock refuses', async ({
  page,
}) => {
  await open(page);
  const start = await spans(page);
  const head = (await snapshot(page)).find(
    (c) => c.label === 'A conversation at 0.0 seconds' && !c.offPage,
  )!;
  expect(head).toMatchObject({ component: 'clip', start: 0, end: 12 });

  expect((await act(page, [{ ref: head.ref, action: 'split', args: [6] }])).ok).toBe(true);
  const split = await spans(page);
  expect(split).toContainEqual(['A conversation at 6.0 seconds', 6, 12]);
  // Two agent edits on one clip within 800 ms stay two undo steps.
  expect((await act(page, [{ ref: head.ref, action: 'trimStart', args: ['0.5'] }])).ok).toBe(true);
  await expect.poll(() => spans(page)).toContainEqual(['A conversation at 0.5 seconds', 0.5, 6]);
  // Only the three clip actions run.
  expect((await act(page, [{ ref: head.ref, action: 'setValue', args: [1] }])).ok).toBe(false);

  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  await undo.click();
  await expect.poll(() => spans(page)).toEqual(split);
  await undo.click();
  await expect.poll(() => spans(page)).toEqual(start);

  await page.getByRole('button', { name: 'Lock Talking head', exact: true }).click();
  const locked = (await snapshot(page)).find(
    (c) => c.label === 'A conversation at 0.0 seconds' && !c.offPage,
  )!;
  expect((await act(page, [{ ref: locked.ref, action: 'split', args: [6] }])).ok).toBe(false);
  await expect.poll(() => spans(page)).toEqual(start);
});

test('a mocked model cuts through the drawer, sending only text, transcript only when ticked', async ({
  page,
}) => {
  const bodies: string[] = [];
  const outside: string[] = [];
  await page.route(
    (url) => !['127.0.0.1', 'localhost', 'openrouter.ai'].includes(url.hostname),
    (route) => {
      outside.push(route.request().url());
      return route.abort();
    },
  );
  const replies = [
    {
      tool_calls: [{ id: '1', type: 'function', function: { name: 'snapshot', arguments: '{}' } }],
    },
    {
      tool_calls: [
        {
          id: '2',
          type: 'function',
          function: {
            name: 'act',
            arguments: JSON.stringify({
              steps: [{ ref: 'A conversation', action: 'split', args: [6] }],
            }),
          },
        },
      ],
    },
    { content: 'Split A conversation at 6 seconds.' },
  ];
  await page.route('https://openrouter.ai/api/v1/chat/completions', async (route) => {
    const request = route.request();
    expect(request.headers()['content-type']).toBe('application/json');
    expect(request.headers().authorization).toBe('Bearer sk-test');
    bodies.push(request.postData() ?? '');
    const message = { role: 'assistant', content: null, ...replies[bodies.length - 1] };
    await route.fulfill({ json: { choices: [{ message }] } });
  });

  await open(page);
  await page.getByRole('button', { name: 'Assistant', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Request' })).toBeFocused();
  await expect(page.getByText('Sends control names only to OpenRouter.')).toBeVisible();
  await page.getByLabel('OpenRouter key').fill('sk-test');
  await page.getByRole('textbox', { name: 'Request' }).fill('Cut the talking head at 6 seconds');
  await page.getByRole('textbox', { name: 'Request' }).press('Enter');
  await expect(page.locator('.assistant-model')).toBeVisible();
  await expect(page.getByText('Split A conversation at 6 seconds.')).toBeVisible();
  await expect.poll(() => spans(page)).toContainEqual(['A conversation at 6.0 seconds', 6, 12]);

  expect(bodies).toHaveLength(3);
  for (const body of bodies) {
    const parsed = JSON.parse(body) as { tools: { function: { name: string } }[] };
    expect(parsed.tools.map((t) => t.function.name)).not.toContain('transcript');
    // Text only: no media URLs, data URIs or binary payloads ever reach the model.
    expect(body).not.toMatch(/blob:|data:|\.mp4|\.m4a|\.webm/);
  }
  await page.getByLabel('Send transcript text with this request').check();
  await expect(page.getByText('Sends transcript text and control names')).toBeVisible();
  expect(outside).toEqual([]);

  // Esc inside the drawer closes it and returns focus to its toggle.
  await page.getByRole('textbox', { name: 'Request' }).press('Escape');
  await expect(page.locator('#assistant-pane')).not.toHaveAttribute('data-open');
  await expect(page.getByRole('button', { name: 'Assistant', exact: true })).toBeFocused();
});

test('dictation transcribes a fake microphone in the page and inserts the words', async ({
  page,
}) => {
  test.slow();
  const outside: string[] = [];
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route(
    (url) => !['127.0.0.1', 'localhost'].includes(url.hostname),
    (route) => {
      outside.push(route.request().url());
      return route.abort();
    },
  );
  await open(page);
  await page.getByRole('button', { name: 'Assistant', exact: true }).click();
  const request = page.getByRole('textbox', { name: 'Request' });
  await request.fill('Trim this:');
  await page.getByRole('button', { name: 'Dictate' }).click();
  const modal = page.locator('dialog.dictation');
  await expect(modal).toBeVisible();
  await expect(request).toBeDisabled();
  // The live preview updates per chunk from Whisper in the page.
  await expect(modal.locator('.dictation-text')).toContainText(/country/i, { timeout: 60000 });
  await modal.getByRole('button', { name: 'Done' }).click();
  // Done runs one last Whisper pass over the whole take before it closes.
  await expect(modal).toHaveCount(0, { timeout: 60000 });
  await expect(request).toHaveValue(/^Trim this: .*country/i, { timeout: 60000 });
  await expect(request).toBeFocused();
  expect(outside).toEqual([]);

  // Esc cancels and leaves the draft as it was.
  const draft = await request.inputValue();
  await page.getByRole('button', { name: 'Dictate' }).click();
  await expect(modal).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
  await expect(request).toHaveValue(draft);
  // Done-then-cleanup used to reject with "Cannot close a closed AudioContext".
  expect(pageErrors).toEqual([]);
});
