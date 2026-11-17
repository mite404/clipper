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
  for (const chord of ['Control+c', 'Meta+c', 'Alt+c']) await page.keyboard.press(chord);
  await expect(selection).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('c');
  await expect(razor).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(razor).toHaveAttribute('aria-pressed', 'true');
  const camera = page.getByTestId('track-camera').locator('.timeline-clip').first();
  await expect(camera).toHaveCSS('cursor', /^url\(.+\) 2 20, crosshair$/);

  await seek(page, 45);
  await clickLane(page, 'camera', 100);
  await clickLane(page, 'voice', 45, 6);
  expect(await lanes(page)).toEqual({
    ...ORIGINAL,
    camera: ['0.0 seconds', '3.3 seconds'],
    voice: ['0.0 seconds', '1.5 seconds'],
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
  await toggle(page, `Lock ${NAMES.screen}`).click();
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

  await toggle(page, `Select ${NAMES.camera} track`).click();
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
});
