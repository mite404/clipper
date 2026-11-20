import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Spy = {
  nodes: { node: GainNode }[];
  analysers: AnalyserNode[];
};

// Records every GainNode and AnalyserNode the page makes, so a test can read what the preview's
// audio path really holds: the Web Audio gain each clip plays at, and the meter's tap.
async function spyOnAudio(page: Page) {
  await page.addInitScript(() => {
    const spy: Spy = { nodes: [], analysers: [] };
    Object.assign(window, { audioSpy: spy });
    const Gain = window.GainNode;
    window.GainNode = class extends Gain {
      constructor(context: BaseAudioContext, options?: GainOptions) {
        super(context, options);
        spy.nodes.push({ node: this });
      }
    };
    const Analyser = window.AnalyserNode;
    window.AnalyserNode = class extends Analyser {
      constructor(context: BaseAudioContext, options?: AnalyserOptions) {
        super(context, options);
        spy.analysers.push(this);
      }
    };
    // The scrub slice pool and the meter tap build their nodes with factories, not constructors.
    // oxlint-disable-next-line typescript/unbound-method -- the spy holds the original to wrap it, calling it with the receiver
    const createGain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function () {
      const node = createGain.call(this);
      spy.nodes.push({ node });
      return node;
    };
    // oxlint-disable-next-line typescript/unbound-method -- the spy holds the original to wrap it, calling it with the receiver
    const createAnalyser = AudioContext.prototype.createAnalyser;
    AudioContext.prototype.createAnalyser = function () {
      const node = createAnalyser.call(this);
      spy.analysers.push(node);
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

test('the transport toggles the timeline into an audio mixer in place', async ({ page }) => {
  await spyOnAudio(page);
  await openEditor(page);
  const toggle = page.getByRole('button', { name: 'Audio mixer', exact: true });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  // The mixer takes the timeline's place: both audio lanes, no timeline grid.
  await expect(page.getByTestId('mixer-voice')).toBeVisible();
  await expect(page.getByTestId('mixer-music')).toBeVisible();
  await expect(page.getByTestId('timeline-scroll')).toHaveCount(0);

  // A fader drag edits live and commits one undo step on release.
  const fader = page.getByRole('slider', { name: 'Music gain' });
  await expect(fader).toHaveAttribute('aria-valuetext', '-13.2 dB');
  const box = (await fader.boundingBox())!;
  const thumb = box.x + ((-13.2 + 24) / 36) * box.width;
  await page.mouse.move(thumb, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(thumb + box.width * 0.2, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  const readout = await page.getByTestId('mixer-music').locator('output').textContent();
  const db = Number(readout!.replace(' dB', ''));
  expect(db).toBeGreaterThan(-13.2);
  const marker = 10 ** (db / 20);
  await expect.poll(async () => has(await gains(page), marker)).toBe(true);

  // The mixer's mute and solo are the header's: solo Voiceover silences the music node.
  await page.getByTestId('mixer-voice').getByRole('button', { name: 'Solo Voiceover' }).click();
  await expect.poll(async () => has(await gains(page), marker)).toBe(false);
  await page.getByTestId('mixer-voice').getByRole('button', { name: 'Unsolo Voiceover' }).click();
  await expect.poll(async () => has(await gains(page), marker)).toBe(true);
  // Mute wins the same way.
  await page.getByTestId('mixer-music').getByRole('button', { name: 'Mute Music' }).click();
  await expect.poll(async () => has(await gains(page), marker)).toBe(false);
  await page.getByTestId('mixer-music').getByRole('button', { name: 'Unmute Music' }).click();
  await expect.poll(async () => has(await gains(page), marker)).toBe(true);

  // The toggles left no undo steps: one Undo restores only the fader's 0.22.
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(fader).toHaveAttribute('aria-valuetext', '-13.2 dB');
  await expect.poll(async () => has(await gains(page), 0.22)).toBe(true);

  // Toggling back restores the timeline.
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('timeline-scroll')).toBeVisible();
  await expect(page.getByTestId('mixer')).toHaveCount(0);
});

test('a locked lane refuses the mixer fader by keyboard and by drag', async ({ page }) => {
  await spyOnAudio(page);
  await openEditor(page);
  await page.getByRole('button', { name: 'Lock Music', exact: true }).click();
  await page.getByRole('button', { name: 'Audio mixer', exact: true }).click();
  const fader = page.getByRole('slider', { name: 'Music gain' });
  await expect(fader).toBeDisabled();
  await expect(fader).toHaveAttribute('aria-valuetext', '-13.2 dB');

  // Keyboard: focus() no-ops on a disabled control, so the key lands nowhere.
  await fader.focus();
  await page.keyboard.press('ArrowUp');
  await expect(fader).toHaveAttribute('aria-valuetext', '-13.2 dB');

  // Drag: the same gesture that moves an unlocked fader.
  const box = (await fader.boundingBox())!;
  const thumb = box.x + ((-13.2 + 24) / 36) * box.width;
  await page.mouse.move(thumb, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(thumb + box.width * 0.2, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(fader).toHaveAttribute('aria-valuetext', '-13.2 dB');

  // Neither attempt left an undo step, and the lane's gain node is untouched (0.22).
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
  expect(has(await gains(page), 0.22)).toBe(true);
});

test('the transport meter taps the preview mix and holds peaks five seconds', async ({ page }) => {
  test.setTimeout(60000);
  await spyOnAudio(page);
  await openEditor(page);
  const meter = page.locator('.audio-meter');
  await expect(meter).toBeVisible();
  const lit = () =>
    page
      .locator('.audio-meter i')
      .evaluateAll((leds) => leds.filter((led) => getComputedStyle(led).opacity === '1').length);
  expect(await lit()).toBe(0);

  await page.getByRole('button', { name: 'Play composition', exact: true }).click();
  await expect(page.getByTestId('transport-state')).toHaveText('Playing · 1×');
  // The Composition tapped the player mix's shared path with an AnalyserNode.
  await expect
    .poll(async () =>
      page.evaluate(() => (window as unknown as { audioSpy: Spy }).audioSpy.analysers.length),
    )
    .toBeGreaterThan(0);
  await expect.poll(lit).toBeGreaterThan(0);
  await expect(meter).toHaveAttribute('aria-label', /Audio level -?\d+ dB/);

  // Pausing reads silence at once, but the held peak keeps one LED lit.
  await page.getByRole('button', { name: 'Pause playback', exact: true }).click();
  await expect(page.getByTestId('transport-state')).toHaveText('Paused');
  expect(await lit()).toBeGreaterThan(0);
  // ...and the bar empties once the five-second hold lapses.
  await expect.poll(lit, { timeout: 9000 }).toBe(0);
});
