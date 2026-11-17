import { test, expect, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// The demo timeline is 360 frames. Every lane is full, so a free span comes from a delete.
const FRAMES = 360;
const status = (page: Page) => page.locator('.app-footer [role="status"]');
const pool = (page: Page, name: string) =>
  page.getByRole('button', { name: `Select ${name}`, exact: true });
const undo = (page: Page) => page.getByRole('button', { name: 'Undo', exact: true });
// A track row's lane, found by its header label, so generated track IDs never appear in tests.
const lane = (page: Page, label: string) =>
  page
    .locator('.track-row', { has: page.getByText(label, { exact: true }) })
    .locator('.timeline-lane');
// Header labels and numbers top to bottom, as a person reads them.
const headers = (page: Page) =>
  page
    .locator('.track-row:not(.create-row) .track-label')
    .evaluateAll((rows) =>
      rows.map(
        (r) => `${r.querySelector('.track-code')!.textContent} ${r.children[2].textContent}`,
      ),
    );
const starts = (target: Locator) =>
  target
    .locator('.timeline-clip')
    .evaluateAll((clips) => clips.map((c) => c.getAttribute('aria-label')!.split(' at ')[1]));

async function open(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

// The pointer position of a timeline frame inside a lane as it is laid out right now.
async function at(target: Locator, frame: number) {
  const box = (await target.boundingBox())!;
  return { x: box.x + ((frame + 0.5) / FRAMES) * box.width, y: box.y + box.height / 2 };
}

// Bring a pool item and a lane into view, then measure both: either scroll can move the other.
async function aim(page: Page, name: string, target?: Locator, frame = 0) {
  await pool(page, name).scrollIntoViewIfNeeded();
  await target?.scrollIntoViewIfNeeded();
  // Centre the frame horizontally, so it is never under the sticky track labels.
  if (target)
    await page.getByTestId('timeline-scroll').evaluate(
      (el, x) => {
        const box = el.getBoundingClientRect();
        el.scrollLeft += x - box.left - box.width / 2;
      },
      (await at(target, frame)).x,
    );
  const from = (await pool(page, name).boundingBox())!;
  expect(from.y).toBeGreaterThanOrEqual(0);
  return {
    from: { x: from.x + from.width / 2, y: from.y + from.height / 2 },
    to: target ? await at(target, frame) : { x: 700, y: 120 },
  };
}

// A real pointer drag from a pool item, released over a lane frame or outside every lane.
async function drag(
  page: Page,
  name: string,
  target?: Locator,
  frame = 0,
  during?: () => Promise<void>,
) {
  const { from, to } = await aim(page, name, target, frame);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x - 30, to.y - 20, { steps: 6 });
  await page.mouse.move(to.x, to.y, { steps: 4 });
  await during?.();
  await page.mouse.up();
}

async function removeSecondScreenClip(page: Page) {
  await page.getByRole('button', { name: 'Flower study at 6.0 seconds', exact: true }).click();
  await page.keyboard.press('Delete');
  await expect(lane(page, 'Screen recording').locator('.timeline-clip')).toHaveCount(1);
}

test('a pool drop lands at the release frame on a scrolled, rescaled lane, and adjacency is allowed', async ({
  page,
}) => {
  await open(page);
  await removeSecondScreenClip(page);
  const screen = lane(page, 'Screen recording');
  await drag(page, 'Flower study', screen, 180);
  expect(await starts(screen)).toEqual(['0.0 seconds', '6.0 seconds']);
  await expect(status(page)).toContainText(
    'Placed Flower study on Screen recording at 6.0 seconds',
  );
  // A drop is a timeline action, so Delete removes the clip it placed and selected.
  await page.keyboard.press('Delete');
  expect(await starts(screen)).toEqual(['0.0 seconds']);

  // A different scale and a horizontal scroll move the lane; the release point still decides.
  const scale = page.getByLabel('Timeline scale');
  await scale.fill(String(Number(await scale.getAttribute('max')) / 4));
  // Scroll the frame to the middle of the viewport, then aim at where it is now.
  const scroll = page.getByTestId('timeline-scroll');
  const before = await at(screen, 300);
  expect(before.x).toBeGreaterThan(0);
  await scroll.evaluate((el, x) => {
    const box = el.getBoundingClientRect();
    el.scrollLeft += x - box.left - box.width / 2;
  }, before.x);
  expect(await scroll.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await drag(page, 'Flower study', screen, 300);
  expect(await starts(screen)).toEqual(['0.0 seconds', '10.0 seconds']);
});

test('drops refuse occupied spans, the wrong media kind, Escape, the outside and outside files', async ({
  page,
}) => {
  await open(page);
  const camera = lane(page, 'Talking head');
  const voice = lane(page, 'Voiceover');
  await drag(page, 'Flower study', camera, 100);
  await expect(status(page)).toContainText('Talking head already has a clip there');
  await drag(page, 'Voiceover', camera, 359);
  await expect(status(page)).toContainText('Talking head takes video or still media');
  await drag(page, 'Flower study', voice, 359);
  await expect(status(page)).toContainText('Voiceover takes audio media');
  await expect(undo(page)).toBeDisabled();

  // While dragging, the lane names why it would refuse.
  const { from, to } = await aim(page, 'Flower study', camera, 100);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x - 30, to.y - 20, { steps: 6 });
  await page.mouse.move(to.x, to.y, { steps: 4 });
  await expect(camera).toHaveAttribute('data-drop', 'occupied');
  await expect(camera.locator('.drop-hint')).toHaveText('Talking head already has a clip there.');
  // Escape over a row that would take the drop cancels it.
  const create = page.getByTestId('create-background');
  // Same frame as the camera aim, so it is never under the sticky labels.
  const free = await at(create, 100);
  await page.mouse.move(free.x, free.y, { steps: 4 });
  await expect(create).toHaveAttribute('data-drop', 'ok');
  await page.keyboard.press('Escape');
  await page.mouse.up();
  expect(await headers(page)).toHaveLength(4);
  await drag(page, 'Flower study');
  await expect(undo(page)).toBeDisabled();

  // A file dragged in from the desktop is import's job, never a placement.
  await camera.evaluate((el) => {
    const data = new DataTransfer();
    data.items.add(new File(['x'], 'x.png', { type: 'image/png' }));
    for (const type of ['dragover', 'drop'])
      el.dispatchEvent(
        new DragEvent(type, { dataTransfer: data, bubbles: true, cancelable: true }),
      );
  });
  await expect(undo(page)).toBeDisabled();
  expect(await headers(page)).toHaveLength(4);
});

test('a lock set mid-drag refuses the drop with no clip, step or success', async ({ page }) => {
  await open(page);
  await removeSecondScreenClip(page);
  const screen = lane(page, 'Screen recording');
  await drag(page, 'Flower study', screen, 200, () =>
    page
      .getByRole('button', { name: 'Lock Screen recording', exact: true })
      .evaluate((el: HTMLElement) => el.click()),
  );
  expect(await starts(screen)).toEqual(['0.0 seconds']);
  await expect(status(page)).toContainText('Screen recording is locked.');
  await expect(status(page)).not.toContainText('Placed');
  await undo(page).click();
  await expect(undo(page)).toBeDisabled();
});

test('creation rows add a background beneath the pair, a masked screen and audio, each one undo step', async ({
  page,
}) => {
  await open(page);
  expect(await headers(page)).toEqual([
    'V2 Talking head',
    'V1 Screen recording',
    'A1 Voiceover',
    'A2 Music',
  ]);
  await drag(page, 'Flower study', page.getByTestId('create-background'), 60);
  expect(await headers(page)).toEqual([
    'V3 Talking head',
    'V2 Screen recording',
    'V1 Background · Full frame',
    'A1 Voiceover',
    'A2 Music',
  ]);
  expect(await starts(lane(page, 'Background · Full frame'))).toEqual(['2.0 seconds']);
  // Audio dropped on a visual creation row still makes an audio track.
  await drag(page, 'Ambient bed', page.getByTestId('create-screen'), 0);
  // Video dropped on the audio creation row makes a masked screen, never a background.
  await drag(page, 'Flower study', page.getByTestId('create-audio'), 30);
  expect(await headers(page)).toEqual([
    'V4 Screen 2 · Masked',
    'V3 Talking head',
    'V2 Screen recording',
    'V1 Background · Full frame',
    'A1 Voiceover',
    'A2 Music',
    'A3 Audio 3',
  ]);
  for (let step = 0; step < 3; step++) await undo(page).click();
  expect(await headers(page)).toHaveLength(4);
  await expect(undo(page)).toBeDisabled();
});

test('the keyboard places on existing and new tracks, reorders, and v4 files reopen by stable ID', async ({
  page,
}) => {
  await open(page);
  await pool(page, 'A conversation').focus();
  await page.keyboard.press('Enter');
  const target = page.getByLabel('Place onto');
  await target.selectOption({ label: 'New V1 background · Full frame' });
  // Save refuses an edit past 24 hours, so placement refuses it first and adds nothing.
  const clips = await page.locator('.timeline-clip').count();
  await page.getByLabel('Place at seconds').fill('100000');
  await page.getByRole('button', { name: 'Place on timeline' }).press('Enter');
  await expect(status(page)).toContainText(
    'That would pass the 24-hour timeline. Nothing was placed.',
  );
  await expect(page.locator('.timeline-clip')).toHaveCount(clips);
  await expect(undo(page)).toBeDisabled();
  await page.getByLabel('Place at seconds').fill('6.12');
  await page.getByRole('button', { name: 'Place on timeline' }).press('Enter');
  expect(await starts(lane(page, 'Background · Full frame'))).toEqual(['6.1 seconds']);
  await expect(target.locator('option')).toContainText(['V1 · Background · Full frame']);

  // Raise the background in front of the screen, then lock it by its stable identity.
  await page.getByRole('button', { name: 'Move Background · Full frame up' }).press('Enter');
  expect((await headers(page)).slice(0, 3)).toEqual([
    'V3 Talking head',
    'V2 Background · Full frame',
    'V1 Screen recording',
  ]);
  await page.getByRole('button', { name: 'Lock Background · Full frame', exact: true }).click();
  const saving = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const saved = JSON.parse(await readFile((await (await saving).path())!, 'utf8'));
  expect(saved.version).toBe(4);
  expect(saved.locked).toEqual([saved.tracks[1].id]);

  await undo(page).click();
  expect((await headers(page)).slice(0, 3)).toEqual([
    'V3 Talking head',
    'V2 Screen recording',
    'V1 Background · Full frame',
  ]);
  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page.getByLabel('Open local project').setInputFiles({
    name: 'tracks.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(saved)),
  });
  await expect(status(page)).toContainText('Project reopened');
  expect((await headers(page)).slice(0, 3)).toEqual([
    'V3 Talking head',
    'V2 Background · Full frame',
    'V1 Screen recording',
  ]);
  await expect(
    page.getByRole('button', { name: 'Lock Background · Full frame', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(await starts(lane(page, 'Background · Full frame'))).toEqual(['6.1 seconds']);
});

test('Insert and Place start on the same track and fall back when Undo removes the chosen one', async ({
  page,
}) => {
  await open(page);
  await pool(page, 'Flower study').click();
  const insertOnto = page.getByLabel('Insert onto track');
  await expect(page.getByLabel('Place onto')).toHaveValue('screen');
  await expect(insertOnto).toHaveValue('screen');
  await page.getByLabel('Place onto').selectOption({ label: 'New screen track · Masked' });
  await page.getByRole('button', { name: 'Place on timeline' }).click();
  await expect(status(page)).toContainText('Placed Flower study on Screen 2 · Masked');
  await insertOnto.selectOption({ label: 'V3 · Screen 2 · Masked' });
  await undo(page).click();
  // The chosen track is gone, so Insert targets the default track the select now shows.
  await expect(insertOnto).toHaveValue('screen');
  await page.getByRole('button', { name: 'Insert source at playhead' }).click();
  await expect(status(page)).toContainText('Inserted Flower study onto Screen recording.');
  expect(await headers(page)).toHaveLength(4);
});
