import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const LANES = ['screen', 'camera', 'voice', 'music'] as const;
const NAMES = {
  screen: 'Screen recording',
  camera: 'Talking head',
  voice: 'Voiceover',
  music: 'Music',
} as const;

async function open(page: Page, platform = 'Win32') {
  await page.addInitScript((value) => {
    Object.defineProperty(navigator, 'platform', { get: () => value });
  }, platform);
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

// Clip start times per lane, read from the clips' accessible names.
async function lanes(page: Page) {
  const result: Record<string, string[]> = {};
  for (const lane of LANES)
    result[lane] = await page
      .getByTestId(`track-${lane}`)
      .locator('.timeline-clip')
      .evaluateAll((clips) => clips.map((c) => c.getAttribute('aria-label')!.split(' at ')[1]));
  return result;
}

async function seek(page: Page, frame: number) {
  await page.getByRole('slider', { name: 'Timeline playhead' }).fill(String(frame));
  await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
}

// A real pointer click on a lane at a timeline frame, plus a pixel nudge.
async function clickLane(page: Page, lane: string, frame: number, nudge = 0) {
  const box = (await page.getByTestId(`track-${lane}`).boundingBox())!;
  await page.mouse.move(box.x + 2, box.y + 2);
  await page.mouse.click(box.x + (frame / 360) * box.width + nudge, box.y + box.height / 2);
}

// A pointer jump straight onto a lane at a timeline frame, so only that position is hovered.
async function hoverLane(page: Page, lane: string, frame: number, nudge = 0) {
  const box = (await page.getByTestId(`track-${lane}`).boundingBox())!;
  await page.mouse.move(box.x + (frame / 360) * box.width + nudge, box.y + box.height / 2);
}

// A key pressed right after "assets ready" appears is dropped: the shortcut handler's effect has
// not yet re-registered with busy=false (same on base). The header click gives it that time.
async function armRazor(page: Page) {
  await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
  await page.keyboard.press('c');
  await expect(page.getByRole('button', { name: 'Razor tool', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
}

const status = (page: Page) => page.locator('.app-footer [role="status"]');
const toggle = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const ORIGINAL = {
  screen: ['0.0 seconds', '6.0 seconds'],
  camera: ['0.0 seconds'],
  voice: ['0.0 seconds'],
  music: ['0.0 seconds'],
};

test('Split cuts the selected clip and selected unlocked tracks, and one undo restores them', async ({
  page,
}) => {
  await open(page);
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  await seek(page, 45);
  await toggle(page, `Select ${NAMES.camera} track`).click();
  await toggle(page, `Select ${NAMES.voice} track`).click();
  await toggle(page, `Lock ${NAMES.voice}`).click();
  await expect(toggle(page, `Lock ${NAMES.voice}`)).toHaveAttribute('aria-pressed', 'true');
  await expect(undo).toBeDisabled();
  await page.getByRole('button', { name: 'Split selected clip', exact: true }).click();
  expect(await lanes(page)).toEqual({
    screen: ['0.0 seconds', '1.5 seconds', '6.0 seconds'],
    camera: ['0.0 seconds', '1.5 seconds'],
    voice: ['0.0 seconds'],
    music: ['0.0 seconds'],
  });
  await expect(
    page.getByRole('button', { name: 'Flower study at 0.0 seconds', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle(page, `Select ${NAMES.camera} track`)).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await toggle(page, `Lock ${NAMES.camera}`).click();
  await undo.click();
  expect(await lanes(page)).toEqual(ORIGINAL);
  await expect(undo).toBeDisabled();
  await toggle(page, `Select ${NAMES.camera} track`).click();
  await toggle(page, `Select ${NAMES.voice} track`).click();
  await seek(page, 180);
  await page.getByRole('button', { name: 'Split selected clip', exact: true }).click();
  expect(await lanes(page)).toEqual(ORIGINAL);
  await expect(undo).toBeDisabled();
  await expect(status(page)).toContainText('No unlocked clip');
});

for (const [platform, cut, ignored] of [
  ['MacIntel', 'Meta+KeyK', ['Alt+KeyK', 'Control+KeyK', 'Meta+Shift+KeyK']],
  ['Win32', 'Alt+KeyK', ['Meta+KeyK', 'Control+KeyK', 'Alt+Shift+KeyK']],
] as const) {
  test(`${cut} on ${platform} cuts every unlocked track regardless of selection`, async ({
    page,
  }) => {
    await open(page, platform);
    await toggle(page, `Lock ${NAMES.music}`).click();
    await seek(page, 45);
    for (const chord of ignored) {
      await page.keyboard.press(chord);
      expect(await lanes(page)).toEqual(ORIGINAL);
    }
    await page.getByLabel('Source in seconds').focus();
    await page.keyboard.press(cut);
    expect(await lanes(page)).toEqual(ORIGINAL);
    await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
    await page.keyboard.press(cut);
    expect(await lanes(page)).toEqual({
      screen: ['0.0 seconds', '1.5 seconds', '6.0 seconds'],
      camera: ['0.0 seconds', '1.5 seconds'],
      voice: ['0.0 seconds', '1.5 seconds'],
      music: ['0.0 seconds'],
    });
    await page.keyboard.press(cut);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    expect(await lanes(page)).toEqual(ORIGINAL);
    await page.keyboard.press('s');
    expect(await lanes(page)).toEqual(ORIGINAL);
  });
}

test('C picks Razor and V picks Selection; Razor cuts at the clicked frame, snapping and refusing locks', async ({
  page,
}) => {
  await open(page);
  const razor = toggle(page, 'Razor tool');
  const selection = toggle(page, 'Selection tool');
  await expect(selection).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Source in seconds').focus();
  await page.keyboard.press('c');
  await expect(selection).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
  for (const chord of ['Control+c', 'Meta+c', 'Alt+c', 'Shift+c']) await page.keyboard.press(chord);
  await expect(selection).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('c');
  await expect(razor).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Shift+v');
  await page.keyboard.press('Escape');
  await expect(razor).toHaveAttribute('aria-pressed', 'true');
  const camera = page.getByTestId('track-camera').locator('.timeline-clip').first();
  await expect(camera).toHaveCSS('cursor', /^url\(.+\) 2 20, crosshair$/);

  await seek(page, 45);
  await clickLane(page, 'camera', 100);
  // The playhead is no snap target any more (a hover seek would make it circular), so this
  // click snaps to the camera cut's edge at 100.
  await clickLane(page, 'voice', 100, 6);
  expect(await lanes(page)).toEqual({
    ...ORIGINAL,
    camera: ['0.0 seconds', '3.3 seconds'],
    voice: ['0.0 seconds', '3.3 seconds'],
  });
  await expect(
    page.getByRole('button', { name: 'Flower study at 0.0 seconds', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await clickLane(page, 'music', 180, -6);
  expect((await lanes(page)).music).toEqual(['0.0 seconds', '6.0 seconds']);
  await clickLane(page, 'screen', 180, -2);
  expect((await lanes(page)).screen).toEqual(ORIGINAL.screen);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect(await lanes(page)).toEqual(ORIGINAL);

  const cameraClip = page.getByTestId('track-camera').locator('.timeline-clip');
  const before = await cameraClip.getAttribute('style');
  const grip = page.getByTestId('track-camera').getByRole('slider', { name: 'Trim right edge' });
  const box = (await grip.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - 200, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  expect(await lanes(page)).toEqual(ORIGINAL);
  await expect(cameraClip).toHaveAttribute('style', before!);

  await toggle(page, `Lock ${NAMES.voice}`).click();
  const voice = page.getByTestId('track-voice').locator('.timeline-clip').first();
  await expect(voice).toHaveCSS('cursor', 'not-allowed');
  await clickLane(page, 'voice', 100);
  expect(await lanes(page)).toEqual(ORIGINAL);
  await expect(status(page)).toContainText('Voiceover is locked.');

  await page.keyboard.press('v');
  await expect(selection).toHaveAttribute('aria-pressed', 'true');
  await clickLane(page, 'camera', 100);
  expect(await lanes(page)).toEqual(ORIGINAL);
  await expect(
    page.getByRole('button', { name: 'A conversation at 0.0 seconds', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('locks refuse delete, trim and insert, while toggles save, dirty and reopen without undo steps', async ({
  page,
}) => {
  await open(page);
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  // An unpressed toggle draws a different icon, not a pressed-looking one in another colour.
  const icon = (name: string) => toggle(page, name).locator('svg');
  const unlocked = await icon(`Lock ${NAMES.screen}`).getAttribute('class');
  await toggle(page, `Lock ${NAMES.screen}`).click();
  await expect(icon(`Lock ${NAMES.screen}`)).not.toHaveAttribute('class', unlocked!);
  await expect(page.getByTestId('track-screen').getByRole('slider')).toHaveCount(0);
  await page.getByRole('button', { name: 'Flower study at 0.0 seconds', exact: true }).click();
  await page.keyboard.press('Delete');
  expect(await lanes(page)).toEqual(ORIGINAL);
  await expect(status(page)).toContainText('Screen recording is locked.');
  await page.getByRole('button', { name: 'Insert source at playhead' }).click();
  expect(await lanes(page)).toEqual(ORIGINAL);
  await expect(status(page)).toContainText('Screen recording is locked.');
  await expect(status(page)).not.toContainText('Inserted');
  await expect(undo).toBeDisabled();

  const unselected = await icon(`Select ${NAMES.camera} track`).getAttribute('class');
  await toggle(page, `Select ${NAMES.camera} track`).click();
  await expect(icon(`Select ${NAMES.camera} track`)).not.toHaveAttribute('class', unselected!);
  let prompts = 0;
  page.on('dialog', (dialog) => {
    prompts++;
    void dialog.dismiss();
  });
  const opener = page.getByLabel('Open local project');
  const junk = { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{}') };
  await opener.setInputFiles(junk);
  expect(prompts).toBe(1);
  const saving = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const saved = JSON.parse(await readFile((await (await saving).path())!, 'utf8'));
  expect(saved).toMatchObject({ version: 2, locked: ['screen'], selectedTracks: ['camera'] });
  await opener.setInputFiles(junk);
  expect(prompts).toBe(1);
  await expect(status(page)).toContainText('Could not open');
  await toggle(page, `Lock ${NAMES.screen}`).click();
  await opener.setInputFiles(junk);
  expect(prompts).toBe(2);
  await toggle(page, `Lock ${NAMES.screen}`).click();
  await expect(undo).toBeDisabled();

  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await expect(toggle(page, `Lock ${NAMES.screen}`)).toHaveAttribute('aria-pressed', 'false');
  await opener.setInputFiles({
    name: 'locked.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(saved)),
  });
  await expect(status(page)).toContainText('Project reopened');
  await expect(toggle(page, `Lock ${NAMES.screen}`)).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle(page, `Select ${NAMES.camera} track`)).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(toggle(page, `Lock ${NAMES.voice}`)).toHaveAttribute('aria-pressed', 'false');
  await expect(undo).toBeDisabled();

  // Mute is saved with the project like a lock: it makes the project unsaved, Save and Open set
  // the baseline, and toggling back to the saved state is saved again. It is not an undo step.
  const prompted = async () => {
    const before = prompts;
    await opener.setInputFiles(junk);
    return prompts > before;
  };
  expect(await prompted()).toBe(false);
  await toggle(page, `Mute ${NAMES.voice}`).click();
  await expect(undo).toBeDisabled();
  expect(await prompted()).toBe(true);
  const savingMuted = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const savedMuted = JSON.parse(await readFile((await (await savingMuted).path())!, 'utf8'));
  expect(savedMuted.muted).toEqual(['voice']);
  expect(await prompted()).toBe(false);
  await toggle(page, `Unmute ${NAMES.voice}`).click();
  expect(await prompted()).toBe(true);
  await toggle(page, `Mute ${NAMES.voice}`).click();
  expect(await prompted()).toBe(false);

  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await opener.setInputFiles({
    name: 'muted.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(savedMuted)),
  });
  await expect(status(page)).toContainText('Project reopened');
  await expect(toggle(page, `Unmute ${NAMES.voice}`)).toBeVisible();
  expect(await prompted()).toBe(false);
});

for (const [platform, cut] of [
  ['MacIntel', 'Meta+KeyK'],
  ['Win32', 'Alt+KeyK'],
] as const)
  test(`after a real ruler scrub the playhead keeps its arrow keys and gives ${cut} on ${platform}, L, K, C and V to the editor`, async ({
    page,
  }) => {
    await open(page, platform);
    const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
    const box = (await playhead.boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.1, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.4, y, { steps: 8 });
    await page.mouse.up();
    await expect(playhead).toBeFocused();
    const scrubbed = Number(await playhead.inputValue());
    expect(scrubbed).toBeGreaterThan(30);
    expect(scrubbed).toBeLessThan(170);

    // Whether the editor claimed a key is its final defaultPrevented, read after dispatch ends.
    await page.evaluate(() => {
      const w = window as unknown as { claimed: [string, boolean][] };
      w.claimed = [];
      window.addEventListener(
        'keydown',
        (event) => setTimeout(() => w.claimed.push([event.code, event.defaultPrevented]), 0),
        true,
      );
    });
    const claimed = () =>
      page.evaluate(() => (window as unknown as { claimed: [string, boolean][] }).claimed);
    const clips = async () => Object.values(await lanes(page)).flat().length;
    const state = page.getByTestId('transport-state');

    await page.keyboard.press('ArrowRight');
    await expect(playhead).toHaveValue(String(scrubbed + 1));
    await expect(state).toHaveText('Paused');
    expect(await clips()).toBe(5);
    await expect.poll(claimed).toEqual([['ArrowRight', false]]);

    // Deletion keys do nothing on a focused slider, even with a clip selected.
    const undo = page.getByRole('button', { name: 'Undo', exact: true });
    await expect(page.locator('.timeline-clip.selected')).toHaveCount(1);
    for (const deletion of ['Delete', 'Backspace']) {
      await page.keyboard.press(deletion);
      expect(await clips()).toBe(5);
      await expect(undo).toBeDisabled();
    }
    await page.getByRole('slider', { name: 'Corner radius' }).focus();
    for (const deletion of ['Delete', 'Backspace']) {
      await page.keyboard.press(deletion);
      expect(await clips()).toBe(5);
      await expect(undo).toBeDisabled();
    }
    await playhead.focus();

    await page.keyboard.press(cut);
    expect(await clips()).toBeGreaterThan(5);
    await undo.click();
    expect(await clips()).toBe(5);

    await page.keyboard.press('KeyL');
    await expect(state).toHaveText('Playing · 1×');
    await page.keyboard.press('KeyK');
    await expect(state).toHaveText('Paused');
    await page.keyboard.press('KeyC');
    await expect(toggle(page, 'Razor tool')).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('KeyV');
    await expect(toggle(page, 'Selection tool')).toHaveAttribute('aria-pressed', 'true');
    await playhead.focus();
    await page.keyboard.press('Enter');
    await expect(state).toHaveText('Paused');
    await expect.poll(async () => (await claimed()).at(-1)).toEqual(['Enter', false]);

    // A source-monitor slider keeps its arrows too, so the timeline playhead does not move.
    const held = await playhead.inputValue();
    const source = page.getByRole('slider', { name: 'Source preview position' });
    await source.focus();
    const before = await source.inputValue();
    await page.keyboard.press('ArrowRight');
    await expect(source).not.toHaveValue(before);
    await expect(playhead).toHaveValue(held);
    await expect.poll(async () => (await claimed()).at(-1)).toEqual(['ArrowRight', false]);
    await page.keyboard.press('KeyL');
    await expect(state).toHaveText('Playing · 1×');
    await page.keyboard.press('KeyK');
  });

test.describe('Razor hover seeks the real playhead to the frame a click would cut', () => {
  const playhead = (page: Page) => page.getByRole('slider', { name: 'Timeline playhead' });
  const undo = (page: Page) => page.getByRole('button', { name: 'Undo', exact: true });

  test('it follows the pointer onto cuttable clips, stays after it leaves and edits nothing', async ({
    page,
  }) => {
    await open(page);
    await armRazor(page);
    await hoverLane(page, 'camera', 100);
    await expect(playhead(page)).toHaveValue('100');
    await expect(page.locator('.transport-readout')).toContainText('00:03:10');
    await page.locator('.app-header').hover({ position: { x: 4, y: 4 } });
    await expect(playhead(page)).toHaveValue('100');
    // The playhead is not a snap target: a hover a few pixels from it moves it on, never sticks.
    await hoverLane(page, 'camera', 100, 6);
    await expect.poll(async () => Number(await playhead(page).inputValue())).toBeGreaterThan(100);
    // Any cuttable clip seeks, audio included, and a neighbour's edge snaps within reach.
    await hoverLane(page, 'voice', 250);
    await expect(playhead(page)).toHaveValue('250');
    await hoverLane(page, 'camera', 180, -3);
    await expect(playhead(page)).toHaveValue('180');
    // Near the clip's own edge the snap lands on the edge, which is no cut and does not seek.
    await hoverLane(page, 'camera', 0, 2);
    await expect(playhead(page)).toHaveValue('180');
    expect(await lanes(page)).toEqual(ORIGINAL);
    await expect(undo(page)).toBeDisabled();
  });

  test('a locked lane, a gap, the Selection tool and playback do not seek', async ({ page }) => {
    await open(page);
    await armRazor(page);
    await toggle(page, `Lock ${NAMES.voice}`).click();
    await hoverLane(page, 'voice', 120);
    await expect(playhead(page)).toHaveValue('0');
    // Shorten the camera clip by 30 frames so the end of its lane is a gap.
    const grip = page.getByTestId('track-camera').getByRole('slider', { name: 'Trim right edge' });
    await page.keyboard.press('v');
    await grip.focus();
    for (let i = 0; i < 3; i++) await page.keyboard.press('Shift+ArrowLeft');
    await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
    await page.keyboard.press('c');
    await hoverLane(page, 'camera', 345);
    await expect(playhead(page)).toHaveValue('0');
    await page.keyboard.press('v');
    await hoverLane(page, 'camera', 100);
    await expect(playhead(page)).toHaveValue('0');
    await page.keyboard.press('c');
    // Touch never hover-seeks; the same event from a mouse does (checked at the end).
    const camera = page.getByTestId('track-camera');
    const lane = (await camera.boundingBox())!;
    const point = (frame: number) => ({
      clientX: lane.x + (frame / 360) * lane.width,
      clientY: lane.y + lane.height / 2,
    });
    const clip = camera.locator('.timeline-clip').first();
    await clip.dispatchEvent('pointermove', { pointerType: 'touch', ...point(100) });
    await expect(playhead(page)).toHaveValue('0');
    await page.keyboard.press('l');
    await expect(page.getByTestId('transport-state')).toHaveText('Playing · 1×');
    await hoverLane(page, 'camera', 300);
    await page.waitForTimeout(250);
    expect(Number(await playhead(page).inputValue())).toBeLessThan(100);
    await page.keyboard.press('k');
    await hoverLane(page, 'camera', 300, 1);
    await expect(playhead(page)).toHaveValue('300');
    await clip.dispatchEvent('pointermove', { pointerType: 'mouse', ...point(200) });
    await expect(playhead(page)).toHaveValue('200');
  });

  test('a click with no hover before it cuts and leaves the playhead on the cut frame', async ({
    page,
  }) => {
    await open(page);
    await armRazor(page);
    const camera = page.getByTestId('track-camera');
    const lane = (await camera.boundingBox())!;
    const at = { clientX: lane.x + (100 / 360) * lane.width, clientY: lane.y + lane.height / 2 };
    const clip = camera.locator('.timeline-clip').first();
    await clip.dispatchEvent('pointerdown', at);
    await clip.dispatchEvent('click', { detail: 1, ...at });
    expect((await lanes(page)).camera).toEqual(['0.0 seconds', '3.3 seconds']);
    await expect(playhead(page)).toHaveValue('100');
  });

  test('a click cuts at the hovered frame and leaves the playhead there through undo', async ({
    page,
  }) => {
    await open(page);
    await armRazor(page);
    await hoverLane(page, 'camera', 100);
    await expect(playhead(page)).toHaveValue('100');
    await expect(undo(page)).toBeDisabled();
    await page.mouse.down();
    await page.mouse.up();
    expect((await lanes(page)).camera).toEqual(['0.0 seconds', '3.3 seconds']);
    await expect(playhead(page)).toHaveValue('100');
    await undo(page).click();
    expect((await lanes(page)).camera).toEqual(['0.0 seconds']);
    await expect(undo(page)).toBeDisabled();
    await expect(playhead(page)).toHaveValue('100');
  });
});
