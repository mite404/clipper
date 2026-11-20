import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Spy = {
  nodes: { node: GainNode }[];
};

// Records every GainNode the page makes, so a test can read what the preview's audio path really
// holds: the Web Audio gain each clip plays at.
async function spyOnAudio(page: Page) {
  await page.addInitScript(() => {
    const spy: Spy = { nodes: [] };
    Object.assign(window, { audioSpy: spy });
    const Gain = window.GainNode;
    window.GainNode = class extends Gain {
      constructor(context: BaseAudioContext, options?: GainOptions) {
        super(context, options);
        spy.nodes.push({ node: this });
      }
    };
    // The scrub slice pool builds its nodes with the factory, not the constructor.
    // oxlint-disable-next-line typescript/unbound-method -- the spy holds the original to wrap it, calling it with the receiver
    const createGain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function () {
      const node = createGain.call(this);
      spy.nodes.push({ node });
      return node;
    };
  });
}

const gains = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { audioSpy: Spy }).audioSpy.nodes.map(({ node }) => node.gain.value),
  );
const has = (values: number[], wanted: number) => values.some((v) => Math.abs(v - wanted) < 1e-3);

async function openEditor(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

async function savedProject(page: Page) {
  const saved = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  return JSON.parse(readFileSync((await (await saved).path())!, 'utf8'));
}

test('the master gain slider drives the recording gain and stays outside undo', async ({
  page,
}) => {
  await spyOnAudio(page);
  await openEditor(page);
  // An undoable step the slider must not join: a zoom at the playhead.
  await page.getByRole('button', { name: 'Add zoom at playhead' }).click();
  const slider = page.getByRole('slider', { name: 'Master gain' });
  await slider.focus();
  for (let i = 0; i < 4; i++) await slider.press('ArrowUp');
  await expect(slider).toHaveAttribute('aria-valuetext', '2 dB');
  // Preview parity: the voice node carries track 1 x recording 10^(2/20).
  await expect.poll(async () => has(await gains(page), 10 ** (2 / 20))).toBe(true);
  // Undo takes the zoom, not the slider's gain.
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(slider).toHaveAttribute('aria-valuetext', '2 dB');
  // The value persists through the project file like the field always did.
  expect((await savedProject(page)).gain).toBe(2);
});
