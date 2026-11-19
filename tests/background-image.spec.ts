import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

async function openEditor(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

const undo = (page: Page) => page.getByRole('button', { name: 'Undo', exact: true });
const group = (page: Page) => page.getByRole('group', { name: 'Background image' });
const pick = (page: Page, name: 'Choose' | 'Replace') =>
  page.getByLabel(`${name} background image`, { exact: true });
const remove = (page: Page) => group(page).getByRole('button', { name: 'Remove', exact: true });
// The Background lane is the one with a generated id; its row carries the label's lock button.
const lane = (page: Page) => page.locator('[data-testid^="track-background-"]');
const BACKGROUND_MASK = '[data-testid^="background-"][data-testid$="-mask"]';
const status = (page: Page) => page.locator('.app-footer [role="status"]');

// A picture's file bytes, drawn in the page: a left half of one colour and a right half of another,
// so a swap shows in the pixels. WebP encodes with its alpha.
async function picture(page: Page, type: 'image/webp' | 'image/png', left: string, right: string) {
  const base64 = await page.evaluate(
    async ({ type, left, right }) => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const g = canvas.getContext('2d')!;
      g.fillStyle = left;
      g.fillRect(0, 0, 160, 180);
      g.fillStyle = right;
      g.fillRect(160, 0, 160, 180);
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), type));
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });
    },
    { type, left, right },
  );
  return Buffer.from(base64, 'base64');
}

// How many blob URLs the page still holds, by watching create and revoke.
async function trackUrls(page: Page) {
  await page.addInitScript(() => {
    const live = new Set<string>();
    const make = URL.createObjectURL.bind(URL);
    const drop = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (blob: Blob | MediaSource) => {
      const url = make(blob);
      live.add(url);
      return url;
    };
    URL.revokeObjectURL = (url: string) => {
      live.delete(url);
      drop(url);
    };
    Object.assign(window, { liveUrls: live });
  });
}
const liveUrls = (page: Page) =>
  page.evaluate(() => (window as unknown as { liveUrls: Set<string> }).liveUrls.size);

test('a WebP imports like a PNG, and a file named .webp with other bytes is refused', async ({
  page,
}) => {
  await openEditor(page);
  const webp = await picture(page, 'image/webp', '#ff0000', '#0000ff');
  expect(webp.subarray(0, 4).toString()).toBe('RIFF');
  expect(webp.subarray(8, 12).toString()).toBe('WEBP');
  await page.getByLabel('Import local media').setInputFiles([
    { name: 'wall.webp', mimeType: '', buffer: webp },
    { name: 'fake.webp', mimeType: 'image/webp', buffer: Buffer.from('not a picture at all') },
  ]);
  await expect(page.getByTestId('media-status')).toHaveText('5 assets ready', { timeout: 30000 });
  await expect(status(page)).toContainText('fake.webp');
  await expect(page.getByRole('button', { name: 'Select wall.webp', exact: true })).toBeVisible();
});

test('Choose makes the Background track and a cover clip for the timeline, in one undo step', async ({
  page,
}) => {
  await openEditor(page);
  await expect(group(page)).toContainText('None');
  await expect(remove(page)).toBeDisabled();
  await pick(page, 'Choose').setInputFiles({
    name: 'wall.webp',
    mimeType: '',
    buffer: await picture(page, 'image/webp', '#ff0000', '#0000ff'),
  });
  await expect(group(page)).toContainText('wall.webp');
  await expect(lane(page).getByRole('button')).toHaveCount(1);
  // The preview's first panel behind the pair is the full stage, covering with the image.
  await expect(page.locator(BACKGROUND_MASK)).toHaveCSS('width', /px/);
  await expect(undo(page)).toBeEnabled();
  await undo(page).click();
  await expect(lane(page)).toHaveCount(0);
  await expect(undo(page)).toBeDisabled();
  await expect(group(page)).toContainText('None');
});

test('Replace swaps the picture and keeps the clip; Remove deletes it; Undo brings each back', async ({
  page,
}) => {
  await trackUrls(page);
  await openEditor(page);
  const first = await picture(page, 'image/webp', '#ff0000', '#0000ff');
  const second = await picture(page, 'image/png', '#00ff00', '#ffff00');
  await pick(page, 'Choose').setInputFiles({ name: 'one.webp', mimeType: '', buffer: first });
  await expect(group(page)).toContainText('one.webp');
  const clip = lane(page).getByRole('button').first();
  const before = await clip.boundingBox();
  await pick(page, 'Replace').setInputFiles({ name: 'two.png', mimeType: '', buffer: second });
  await expect(group(page)).toContainText('two.png');
  await expect(lane(page).getByRole('button')).toHaveCount(1);
  const after = await lane(page).getByRole('button').first().boundingBox();
  expect([after!.x, after!.width]).toEqual([before!.x, before!.width]);
  await remove(page).click();
  await expect(lane(page).getByRole('button')).toHaveCount(0);
  await expect(group(page)).toContainText('None');
  // Each step undoes by itself: the removal, then the replacement, then the choice.
  await undo(page).click();
  await expect(group(page)).toContainText('two.png');
  await undo(page).click();
  await expect(group(page)).toContainText('one.webp');
  await undo(page).click();
  await expect(group(page)).toContainText('None');
});

test('releases a replaced background only once no edit in history can bring it back', async ({
  page,
}) => {
  test.setTimeout(120000);
  await trackUrls(page);
  await openEditor(page);
  const base = await liveUrls(page);
  const one = await picture(page, 'image/webp', '#ff0000', '#0000ff');
  const two = await picture(page, 'image/png', '#00ff00', '#ffff00');
  await pick(page, 'Choose').setInputFiles({ name: 'one.webp', mimeType: '', buffer: one });
  await expect(group(page)).toContainText('one.webp');
  await pick(page, 'Replace').setInputFiles({ name: 'two.png', mimeType: '', buffer: two });
  await expect(group(page)).toContainText('two.png');
  // History can still restore one.webp, so it stays in the library with its URL.
  await expect(page.getByRole('button', { name: 'Select one.webp', exact: true })).toBeVisible();
  await expect.poll(() => liveUrls(page)).toBe(base + 2);
  // Undo brings one.webp back, and it draws.
  await undo(page).click();
  await expect(group(page)).toContainText('one.webp');
  await expect(page.locator(BACKGROUND_MASK).locator('img')).toHaveJSProperty('complete', true);
  // two.png was the edit Undo just left, which no edit now references, so it was released.
  await expect(page.getByRole('button', { name: 'Select two.png', exact: true })).toHaveCount(0);
  // Replace again, then keep editing past the fifty steps history holds: one.webp is no longer in
  // any edit Undo can reach, so it goes, while the current image stays.
  await pick(page, 'Replace').setInputFiles({ name: 'three.png', mimeType: '', buffer: two });
  await expect(group(page)).toContainText('three.png');
  const shadow = page.getByRole('slider', { name: 'Panel shadow' });
  for (let i = 1; i <= 52; i++) {
    await shadow.fill(String(i % 2 ? 10 : 20));
    await page.waitForTimeout(850); // past the 800 ms fold, so each is its own step
  }
  await expect(page.getByRole('button', { name: 'Select one.webp', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Select three.png', exact: true })).toBeVisible();
  await expect(group(page)).toContainText('three.png');
  await expect.poll(() => liveUrls(page)).toBe(base + 1);
});

test('an asset the user imported is never released by replace or remove', async ({ page }) => {
  await trackUrls(page);
  await openEditor(page);
  await page.getByLabel('Import local media').setInputFiles({
    name: 'mine.webp',
    mimeType: '',
    buffer: await picture(page, 'image/webp', '#ff0000', '#0000ff'),
  });
  await expect(page.getByTestId('media-status')).toHaveText('5 assets ready', { timeout: 30000 });
  // Drop it on the Background creation row, so a lone still is the background.
  await page.getByRole('button', { name: 'Select mine.webp', exact: true }).click();
  await page.getByRole('combobox', { name: 'Place onto' }).click();
  await page
    .locator('[data-slot="select-item"]')
    .filter({ hasText: /New .*background/i })
    .click();
  await page.getByRole('button', { name: 'Place on timeline', exact: true }).click();
  await expect(group(page)).toContainText('mine.webp');
  const urls = await liveUrls(page);
  await remove(page).click();
  await expect(group(page)).toContainText('None');
  await expect(page.getByRole('button', { name: 'Select mine.webp', exact: true })).toBeVisible();
  expect(await liveUrls(page)).toBe(urls);
});

test('a corrupt picture leaves the previous background, the library and the message as they were', async ({
  page,
}) => {
  await trackUrls(page);
  await openEditor(page);
  await pick(page, 'Choose').setInputFiles({
    name: 'one.webp',
    mimeType: '',
    buffer: await picture(page, 'image/webp', '#ff0000', '#0000ff'),
  });
  await expect(group(page)).toContainText('one.webp');
  const urls = await liveUrls(page);
  await pick(page, 'Replace').setInputFiles({
    name: 'bad.webp',
    mimeType: 'image/webp',
    buffer: Buffer.from('RIFF\x00\x00\x00\x00WEBPgarbage'),
  });
  await expect(status(page)).toContainText('bad.webp');
  await expect(group(page)).toContainText('one.webp');
  await expect(page.getByTestId('media-status')).toHaveText('5 assets ready');
  expect(await liveUrls(page)).toBe(urls);
});

test('a locked Background track refuses, and a video background is left to the timeline', async ({
  page,
}) => {
  await openEditor(page);
  await pick(page, 'Choose').setInputFiles({
    name: 'one.webp',
    mimeType: '',
    buffer: await picture(page, 'image/webp', '#ff0000', '#0000ff'),
  });
  await expect(group(page)).toContainText('one.webp');
  const lock = page.getByRole('button', { name: 'Lock Background · Full frame', exact: true });
  await lock.click();
  await expect(lock).toHaveAttribute('aria-pressed', 'true');
  await pick(page, 'Replace').setInputFiles({
    name: 'two.png',
    mimeType: '',
    buffer: await picture(page, 'image/png', '#00ff00', '#ffff00'),
  });
  await expect(status(page)).toContainText('locked');
  await expect(group(page)).toContainText('one.webp');
  await lock.click();
  // A second clip on the track makes it the timeline's own.
  await page.getByRole('button', { name: 'Select Flower study', exact: true }).click();
  const target = lane(page);
  const clipBox = (await target.getByRole('button').first().boundingBox())!;
  const asset = (await page
    .getByRole('button', { name: 'Select Flower study', exact: true })
    .boundingBox())!;
  await page.mouse.move(asset.x + 20, asset.y + 20);
  await page.mouse.down();
  await page.mouse.move(clipBox.x + clipBox.width - 10, clipBox.y + clipBox.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(group(page)).toContainText('Background track in use');
  // The input itself must refuse a file: aria-disabled on its label would not stop the chooser.
  await expect(pick(page, 'Choose')).toHaveJSProperty('disabled', true);
  await expect(remove(page)).toBeDisabled();
});

test('a saved project keeps the WebP background and reopens it', async ({ page }) => {
  await openEditor(page);
  const webp = await picture(page, 'image/webp', '#ff0000', '#0000ff');
  await pick(page, 'Choose').setInputFiles({ name: 'one.webp', mimeType: '', buffer: webp });
  await expect(group(page)).toContainText('one.webp');
  const saved = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const file = readFileSync((await (await saved).path())!);
  const project = JSON.parse(file.toString());
  // A created Background track puts the registry in the file, which is version 4.
  expect(project.version).toBe(4);
  const embedded = project.media.find((m: { name: string }) => m.name === 'one.webp');
  expect(embedded).toMatchObject({ kind: 'image' });
  expect(embedded.data).toMatch(/^data:image\/webp;base64,/);
  expect(Buffer.from(embedded.data.split(',')[1], 'base64').equals(webp)).toBe(true);
  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page
    .getByLabel('Open local project')
    .setInputFiles({ name: 'wall.clipper.json', mimeType: 'application/json', buffer: file });
  await expect(status(page)).toContainText('Project reopened');
  await expect(group(page)).toContainText('one.webp');
});
