import { test, expect, type Page } from '@playwright/test';

// Continuous raster capture competes with media decoding on two-core runners.
test.use({ trace: { mode: 'on', screenshots: false }, video: 'off' });

type Spy = {
  nodes: { node: GainNode }[];
  contexts: AudioContext[];
};

// Records every GainNode and AudioContext the page makes, the same probe clip-gain uses, so a test
// can read the scrub slice's monitoring gain and whether its context is really running.
async function spyOnAudio(page: Page) {
  await page.addInitScript(() => {
    const spy: Spy = { nodes: [], contexts: [] };
    Object.assign(window, { audioSpy: spy });
    const Gain = window.GainNode;
    window.GainNode = class extends Gain {
      constructor(context: BaseAudioContext, options?: GainOptions) {
        super(context, options);
        spy.nodes.push({ node: this });
      }
    };
    const Context = window.AudioContext;
    window.AudioContext = class extends Context {
      constructor(options?: AudioContextOptions) {
        super(options);
        spy.contexts.push(this);
      }
    };
  });
}

const gains = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { audioSpy: Spy }).audioSpy.nodes.map(({ node }) => node.gain.value),
  );
const contextStates = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { audioSpy: Spy }).audioSpy.contexts.map((context) => context.state),
  );
const has = (values: number[], wanted: number) => values.some((v) => Math.abs(v - wanted) < 1e-3);

async function openEditor(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

const playhead = (page: Page) => page.getByRole('slider', { name: 'Timeline playhead' });
const slice = (page: Page, name: string) =>
  page.locator(`[data-testid="scrub-slice"][data-asset="${name}"]`);
const currentTime = (page: Page, name: string) =>
  slice(page, name).evaluate((element: HTMLAudioElement) => element.currentTime);
const paused = (page: Page, name: string) =>
  slice(page, name).evaluate((element: HTMLAudioElement) => element.paused);

// A trusted click on the playhead slider's track: the thumb jumps there, as a ruler scrub does.
async function clickRuler(page: Page, fraction: number): Promise<number> {
  const box = (await page.locator('input[aria-label="Timeline playhead"]').boundingBox())!;
  await page.mouse.click(box.x + box.width * fraction, box.y + box.height / 2);
  return Number(await playhead(page).inputValue());
}

test('a paused ruler scrub sounds the mix at the pointer, at mix gain, and stops by itself', async ({
  page,
}) => {
  await spyOnAudio(page);
  await openEditor(page);
  const frame = await clickRuler(page, 0.25);
  // Voice and Music both span the demo timeline; both sound from the frame the pointer landed on.
  await expect(slice(page, 'Voiceover')).toHaveCount(1);
  await expect(slice(page, 'Ambient bed')).toHaveCount(1);
  const at = frame / 30;
  expect(await currentTime(page, 'Voiceover')).toBeGreaterThan(at - 0.05);
  expect(await currentTime(page, 'Voiceover')).toBeLessThan(at + 0.6);
  // Track gain 1 for Voiceover, 0.22 for Music: the slice nodes carry the mix, not a monitor guess.
  expect(has(await gains(page), 0.22)).toBe(true);
  expect(has(await gains(page), 1)).toBe(true);
  await expect.poll(async () => (await contextStates(page)).includes('running')).toBe(true);
  // The slice ends itself: shortly after the scrub, everything is paused again.
  await expect.poll(async () => paused(page, 'Voiceover')).toBe(true);
  await expect.poll(async () => paused(page, 'Ambient bed')).toBe(true);
});

test('an arrow step sounds one slice at the stepped frame', async ({ page }) => {
  await openEditor(page);
  await page.keyboard.press('ArrowRight');
  await expect(playhead(page)).toHaveValue('1');
  await expect(slice(page, 'Voiceover')).toHaveCount(1);
  const at = await currentTime(page, 'Voiceover');
  expect(at).toBeGreaterThanOrEqual(1 / 30 - 0.02);
  expect(at).toBeLessThan(0.5);
  await expect.poll(async () => paused(page, 'Voiceover')).toBe(true);
});

test('a clip removed from under the head falls silent', async ({ page }) => {
  await openEditor(page);
  await page.getByTestId('track-voice').getByRole('button').first().click();
  await page.keyboard.press('Delete');
  await expect(page.getByTestId('track-voice').getByRole('button')).toHaveCount(0);
  await clickRuler(page, 0.25);
  await expect(slice(page, 'Ambient bed')).toHaveCount(1);
  await expect(slice(page, 'Voiceover')).toHaveCount(0);
});

test('a muted track stays silent under the scrub head', async ({ page }) => {
  await openEditor(page);
  await page.getByRole('button', { name: 'Mute Voiceover', exact: true }).click();
  await clickRuler(page, 0.25);
  await expect(slice(page, 'Ambient bed')).toHaveCount(1);
  await expect(slice(page, 'Voiceover')).toHaveCount(0);
});

test('starting playback stops every slice, so nothing rings over the transport', async ({
  page,
}) => {
  await openEditor(page);
  await clickRuler(page, 0.25);
  await expect(slice(page, 'Voiceover')).toHaveCount(1);
  await page.getByRole('button', { name: 'Play composition', exact: true }).click();
  await expect(page.getByTestId('transport-state')).toHaveText('Playing · 1×');
  await expect.poll(async () => paused(page, 'Voiceover')).toBe(true);
  await expect.poll(async () => paused(page, 'Ambient bed')).toBe(true);
});

test('L at the end wraps to the start without a chirp', async ({ page }) => {
  await openEditor(page);
  // A seek near the end sounds from there; the wrap that playback follows must not re-sound at 0.
  await playhead(page).fill('350');
  await expect(slice(page, 'Voiceover')).toHaveCount(1);
  await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
  await page.keyboard.press('l');
  await expect(page.getByTestId('transport-state')).toHaveText('Playing · 1×');
  expect(await currentTime(page, 'Voiceover')).toBeGreaterThan(10);
  await expect.poll(async () => paused(page, 'Voiceover')).toBe(true);
});
