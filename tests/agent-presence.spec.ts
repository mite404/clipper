import { test, expect, type Page } from '@playwright/test';

// CLIP-51: once an agent connects, the Assistant button becomes a presence chip whose popover
// shows the session's live tool-call count; disconnect reverts it to the plain button. The model
// host is mocked; no real model is called, and no presence ever shows while disconnected.

const CHAT = 'https://openrouter.ai/api/v1/chat/completions';
const KEY_CHECK = 'https://openrouter.ai/api/v1/auth/key';
const CHIP = /Claude Sonnet 5\.5/;

function gate() {
  let resolve = () => {};
  const promise = new Promise<void>((done) => (resolve = done));
  return { promise, resolve };
}

async function open(page: Page) {
  await page.goto('/?agent-test');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

function mockKeyCheck(page: Page, ok = true) {
  return page.route(KEY_CHECK, (route) =>
    ok
      ? route.fulfill({ json: { data: { label: 'clipper' } } })
      : route.fulfill({ status: 401, json: { error: { message: 'bad key' } } }),
  );
}

async function connect(page: Page) {
  await page.getByRole('button', { name: 'Assistant', exact: true }).click();
  await page.getByLabel('OpenRouter key').fill('sk-test');
  await page.getByRole('button', { name: 'Connect', exact: true }).click();
  await expect(page.getByRole('button', { name: CHIP })).toBeVisible();
}

test('connect turns the Assistant button into a presence chip with the live call count', async ({
  page,
}) => {
  await mockKeyCheck(page);
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
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
    {
      tool_calls: [{ id: '3', type: 'function', function: { name: 'snapshot', arguments: '{}' } }],
    },
    { content: 'Split A conversation at 6 seconds.' },
  ];
  let calls = 0;
  await page.route(CHAT, async (route) => {
    calls += 1;
    if (calls === 3) await held;
    const message = { role: 'assistant', content: null, ...replies[calls - 1] };
    await route.fulfill({ json: { choices: [{ message }] } });
  });

  await open(page);
  // Never connected: the plain delivered button, and no presence chrome.
  await expect(page.getByRole('button', { name: 'Assistant', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: CHIP })).toHaveCount(0);
  await expect(page.locator('.presence-dot')).toHaveCount(0);

  await page.getByRole('button', { name: 'Assistant', exact: true }).click();
  await page.getByLabel('OpenRouter key').fill('sk-test');
  // A request cannot run before an agent connects.
  await page.getByRole('textbox', { name: 'Request' }).fill('Cut the talking head at 6 seconds');
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Connect', exact: true }).click();

  // Connected: the button becomes the chip, with the agent's name and a presence dot.
  const chip = page.getByRole('button', { name: CHIP });
  await expect(chip).toBeVisible();
  await expect(chip.locator('.presence-dot')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Assistant', exact: true })).toHaveCount(0);

  // The popover carries the name card and the session's count, announced live.
  await chip.click();
  const popover = page.getByRole('dialog', { name: /Claude Sonnet 5\.5 \(AI\)/ });
  await expect(popover).toBeVisible();
  const count = popover.getByText(/^\d+ calls?$/);
  await expect(count).toHaveText('0 calls');
  await expect(count).toHaveAttribute('aria-live', 'polite');
  await page.keyboard.press('Escape');
  await expect(popover).toHaveCount(0);

  // The count follows the session's tool calls as they finish, while the request still runs.
  await page.getByRole('textbox', { name: 'Request' }).press('Enter');
  await expect.poll(() => calls).toBe(3);
  await chip.click();
  await expect(count).toHaveText('2 calls');
  release();
  await expect(page.getByText('Split A conversation at 6 seconds.')).toBeVisible();
  await expect(count).toHaveText('3 calls');

  // Disconnect reverts to the plain delivered button.
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Assistant', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: CHIP })).toHaveCount(0);
});

test('a refused key keeps the plain button and says why', async ({ page }) => {
  await mockKeyCheck(page, false);
  await open(page);
  await page.getByRole('button', { name: 'Assistant', exact: true }).click();
  await page.getByLabel('OpenRouter key').fill('sk-bad');
  await page.getByRole('button', { name: 'Connect', exact: true }).click();
  await expect(page.locator('.assistant-connect [role="alert"]')).toContainText(/refused|reach/i);
  await expect(page.getByRole('button', { name: 'Assistant', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: CHIP })).toHaveCount(0);
});

test('editing the model config ends the session', async ({ page }) => {
  await mockKeyCheck(page);
  await open(page);
  await connect(page);
  await page.getByLabel('Model id').fill('openai/gpt-6.1-sol');
  await expect(page.getByRole('button', { name: 'Assistant', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: CHIP })).toHaveCount(0);
});

test('a probe for a previous model cannot connect the edited configuration', async ({ page }) => {
  const arrived = gate();
  const release = gate();
  await page.route(KEY_CHECK, async (route) => {
    arrived.resolve();
    await release.promise;
    await route.fulfill({ json: { data: { label: 'clipper' } } });
  });
  await open(page);
  await page.getByRole('button', { name: 'Assistant', exact: true }).click();
  await page.getByLabel('OpenRouter key').fill('sk-test');
  await page.getByRole('textbox', { name: 'Request' }).fill('Cut the talking head');
  const connectButton = page.getByRole('button', { name: 'Connect', exact: true });
  await connectButton.click();
  await arrived.promise;
  await page.getByLabel('Model id').fill('openai/gpt-6.1-sol');
  release.resolve();
  await expect(connectButton).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: CHIP })).toHaveCount(0);
  await connectButton.click();
  await expect(page.getByRole('button', { name: 'Gpt 6.1 Sol', exact: true })).toBeVisible();
});

test('disconnect prevents a pending model reply from editing the timeline', async ({ page }) => {
  const arrived = gate();
  const release = gate();
  let posts = 0;
  await mockKeyCheck(page);
  await page.route(CHAT, async (route) => {
    const first = ++posts === 1;
    if (first) {
      arrived.resolve();
      await release.promise;
    }
    const toolCalls = [
      {
        id: 'edit',
        type: 'function',
        function: {
          name: 'act',
          arguments: JSON.stringify({
            steps: [{ ref: 'A conversation', action: 'split', args: [6] }],
          }),
        },
      },
    ];
    const message = first
      ? { role: 'assistant', content: null, tool_calls: toolCalls }
      : { role: 'assistant', content: 'Split the clip' };
    await route.fulfill({ json: { choices: [{ message }] } });
  });
  await open(page);
  await connect(page);
  const input = page.getByRole('textbox', { name: 'Request' });
  await input.fill('Split the talking head at six seconds');
  await input.press('Enter');
  await arrived.promise;
  await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
  release.resolve();
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
  expect(posts).toBe(1);
});
