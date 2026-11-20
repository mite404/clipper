import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

type Spy = {
  nodes: { node: GainNode }[];
  contexts: AudioContext[];
};

// Records every GainNode and AudioContext the page makes, so a test can read what the preview's
// audio path really holds: the Web Audio gain for each clip, and whether the context is running.
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
    // The scrub slice pool builds its nodes with the factory, not the constructor.
    // oxlint-disable-next-line typescript/unbound-method -- the spy holds the original to wrap it, calling it with the receiver
    const createGain = Context.prototype.createGain;
    Context.prototype.createGain = function () {
      const node = createGain.call(this);
      spy.nodes.push({ node });
      return node;
    };
  });
}

// The gain value of each clip-level node (the master node is also 1 when playing, so tests look for
// values that only a clip carries).
const gains = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { audioSpy: Spy }).audioSpy.nodes.map(({ node }) => node.gain.value),
  );
const contextStates = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { audioSpy: Spy }).audioSpy.contexts.map((context) => context.state),
  );

async function openEditor(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

const voiceClip = (page: Page) => page.getByTestId('track-voice').getByRole('button').first();
const field = (page: Page) => page.getByRole('spinbutton', { name: 'Clip gain dB' });
const undo = (page: Page) => page.getByRole('button', { name: 'Undo', exact: true });
const has = (values: number[], wanted: number) => values.some((v) => Math.abs(v - wanted) < 1e-3);

// The Inspector no longer renders the recording gain row, so a non-zero gain comes from a saved
// project: save the demo, set the root gain the parse path still honours, and reopen the file.
async function seedGain(page: Page, db: number) {
  const saved = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const file = JSON.parse(readFileSync((await (await saved).path())!, 'utf8'));
  file.gain = db;
  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page.getByLabel('Open local project').setInputFiles({
    name: 'gain.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(file)),
  });
}

test('the gain field appears for an audio-track clip with sound only, and commits one undo step', async ({
  page,
}) => {
  await openEditor(page);
  // A video clip on the screen track plays no audio of its own, so it has no gain.
  await page.getByTestId('track-screen').getByRole('button').first().click();
  await expect(field(page)).toHaveCount(0);
  await voiceClip(page).click();
  await expect(field(page)).toHaveValue('0');
  await expect(undo(page)).toBeDisabled();

  // Typed commits closer than 800 ms fold into one step, like a drag, so each waits that out.
  const commit = async (text: string) => {
    await field(page).fill(text);
    await field(page).press('Enter');
    await page.waitForTimeout(850);
  };
  await commit('-6');
  await expect(field(page)).toHaveValue('-6');
  await expect(undo(page)).toBeEnabled();
  // Snapped to 0.5 dB and held inside -24..+12.
  await commit('3.3');
  await expect(field(page)).toHaveValue('3.5');
  await commit('99');
  await expect(field(page)).toHaveValue('12');
  await commit('-99');
  await expect(field(page)).toHaveValue('-24');
  // Empty text puts the gain back, and the same value adds no step.
  await commit('');
  await expect(field(page)).toHaveValue('-24');
  await commit('-24');

  // Four commits (-6, 3.5, 12, -24) are four steps; undo walks back through them to 0.
  for (const back of ['12', '3.5', '-6', '0']) {
    await undo(page).click();
    await expect(field(page)).toHaveValue(back);
  }
  await expect(undo(page)).toBeDisabled();
});

test('the timeline waveform grows with the gain and stops at the lane edge', async ({ page }) => {
  await openEditor(page);
  await voiceClip(page).click();
  const wave = page.getByTestId('track-voice').locator('svg[data-waveform] path').first();
  // The path is mirrored about y = 24 in a 48-unit lane; its top is the smallest y.
  const top = async () =>
    Math.min(
      ...[...((await wave.getAttribute('d')) ?? '').matchAll(/,(-?[\d.]+)/g)].map((m) => +m[1]),
    );
  const base = await top();
  expect(base).toBeGreaterThan(0);
  await field(page).fill('-12');
  await field(page).press('Enter');
  await expect.poll(top).toBeGreaterThan(base);
  await field(page).fill('12');
  await field(page).press('Enter');
  // The loudest bin of the clip is +12 dB (x4) against the lane, so it fills the lane to its edge.
  await expect.poll(top).toBe(0);
});

test('a locked lane refuses a gain change', async ({ page }) => {
  await openEditor(page);
  await voiceClip(page).click();
  await page.getByRole('button', { name: 'Lock Voiceover', exact: true }).click();
  await field(page).fill('6');
  await field(page).press('Enter');
  await expect(page.locator('.app-footer [role="status"]')).toContainText('locked');
  await expect(field(page)).toHaveValue('0');
  await expect(undo(page)).toBeDisabled();
});

test('the preview plays a boosted clip through Web Audio at the same factor as export', async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (/AudioContext|autoplay|not allowed/i.test(message.text())) warnings.push(message.text());
  });
  await spyOnAudio(page);
  await openEditor(page);
  await voiceClip(page).click();
  await field(page).fill('6');
  await field(page).press('Enter');
  // The Voiceover track has gain 1, so its clip carries exactly 10^(6/20); Music keeps 0.22.
  await expect.poll(async () => has(await gains(page), 10 ** (6 / 20))).toBe(true);
  expect(has(await gains(page), 0.22)).toBe(true);

  await page.getByRole('button', { name: 'Play composition', exact: true }).click();
  await expect(page.getByTestId('transport-state')).toHaveText('Playing · 1×');
  // The Play click resumed the context; a refused resume would leave it suspended.
  await expect.poll(async () => (await contextStates(page)).includes('running')).toBe(true);

  // Mute wins over any gain: the clip's node drops to 0.
  await page.getByRole('button', { name: 'Mute Voiceover', exact: true }).click();
  await expect.poll(async () => has(await gains(page), 10 ** (6 / 20))).toBe(false);
  expect(has(await gains(page), 0)).toBe(true);
  await page.getByRole('button', { name: 'Unmute Voiceover', exact: true }).click();
  await expect.poll(async () => has(await gains(page), 10 ** (6 / 20))).toBe(true);

  // Pausing suspends the audio context, so nothing is left playing.
  await page.getByRole('button', { name: 'Pause playback', exact: true }).click();
  await expect(page.getByTestId('transport-state')).toHaveText('Paused');
  await expect
    .poll(async () => (await contextStates(page)).every((state) => state !== 'running'))
    .toBe(true);
  expect(warnings).toEqual([]);
});

test('the recording gain scales preview and paused scrub by one factor, and mute still wins', async ({
  page,
}) => {
  await spyOnAudio(page);
  await openEditor(page);
  // The Inspector renders without the recording gain row.
  await expect(page.getByRole('spinbutton', { name: 'Recording gain dB' })).toHaveCount(0);
  await seedGain(page, 6);
  const factor = 10 ** (6 / 20);
  // Preview: every clip node carries track x clip x recording, the 0.22 music lane included.
  await expect.poll(async () => has(await gains(page), factor)).toBe(true);
  expect(has(await gains(page), 0.22 * factor)).toBe(true);
  // Mute still wins over the recording gain: the voice node drops to 0.
  await page.getByRole('button', { name: 'Mute Voiceover', exact: true }).click();
  await expect.poll(async () => has(await gains(page), factor)).toBe(false);
  expect(has(await gains(page), 0)).toBe(true);
  await page.getByRole('button', { name: 'Unmute Voiceover', exact: true }).click();
  await expect.poll(async () => has(await gains(page), factor)).toBe(true);
  // A paused seek pools one new slice node per clip under the head, at the same product.
  const carrying = (values: number[], wanted: number) =>
    values.filter((value) => Math.abs(value - wanted) < 1e-3).length;
  const before = await gains(page);
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(async () => carrying(await gains(page), factor))
    .toBe(carrying(before, factor) + 1);
  expect(carrying(await gains(page), 0.22 * factor)).toBe(carrying(before, 0.22 * factor) + 1);
});

test('export scales the whole mix by the recording gain', async ({ page }, info) => {
  test.setTimeout(240000);
  await openEditor(page);
  await seedGain(page, -6);
  await page.getByRole('button', { name: 'Export video', exact: true }).click();
  await page.getByRole('button', { name: 'Render video', exact: true }).click();
  await expect(page.locator('.app-footer [role="status"]')).toContainText('Video exported', {
    timeout: 180000,
  });
  const downloaded = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Save video', exact: true }).click();
  const download = await downloaded;
  const file = info.outputPath(download.suggestedFilename());
  await download.saveAs(file);
  const pcm = (args: string[]) =>
    execFileSync(
      'ffmpeg',
      ['-v', 'error', ...args, '-f', 'f32le', '-ac', '2', '-ar', '48000', '-'],
      { maxBuffer: 64 * 1024 * 1024 },
    );
  const audio = pcm(['-i', file]);
  let energy = 0;
  for (let i = 0; i + 4 <= audio.length; i += 4) energy += audio.readFloatLE(i) ** 2;
  expect(Math.sqrt(energy / (audio.length / 4))).toBeGreaterThan(0.001);
  // Voice and Music span the 12 s demo timeline at full length; the reference is the same mix at
  // the recording gain (-6 dB), the way the preview played it. The demo sources are mono, so the
  // pan duplicates each at full gain: ffmpeg's own mono-to-stereo upmix would halve the power.
  const cut = 10 ** (-6 / 20);
  const reference = pcm([
    '-i',
    'public/media/voice.wav',
    '-i',
    'public/media/music.wav',
    '-filter_complex',
    `[0:a]atrim=start=0:end=12,asetpts=PTS-STARTPTS,volume=${cut},pan=stereo|c0=c0|c1=c0[v];` +
      `[1:a]atrim=start=0:end=12,asetpts=PTS-STARTPTS,volume=${0.22 * cut},pan=stereo|c0=c0|c1=c0[m];` +
      '[v][m]amix=inputs=2:normalize=0:duration=longest',
  ]);
  let squaredError = 0,
    referenceEnergy = 0;
  for (let i = 0; i + 4 <= Math.min(audio.length, reference.length); i += 4) {
    const expected = reference.readFloatLE(i);
    squaredError += (audio.readFloatLE(i) - expected) ** 2;
    referenceEnergy += expected ** 2;
  }
  console.log(`recording gain audio error ${Math.sqrt(squaredError / referenceEnergy)}`);
  expect(Math.sqrt(squaredError / referenceEnergy)).toBeLessThan(0.12);
});
