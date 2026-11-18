import { test, expect, type Page } from '@playwright/test';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

async function openEditor(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

const playhead = (page: Page) => page.getByRole('slider', { name: 'Timeline playhead' });
const flags = (page: Page) => page.locator('.chapter-flag');
const undo = (page: Page) => page.getByRole('button', { name: 'Undo', exact: true });
const status = (page: Page) => page.locator('.app-footer [role="status"]');

// Seek with the playhead slider, then mark with M from that same focused slider.
async function markAt(page: Page, frame: number) {
  await playhead(page).fill(String(frame));
  await page.keyboard.press('m');
}

test('M marks chapters at the playhead, one per frame, as flags that seek and select', async ({
  page,
}) => {
  await openEditor(page);
  await markAt(page, 61);
  await markAt(page, 59);
  await expect(flags(page)).toHaveCount(2);
  // Titles number in the order they were added; flags sit in frame order.
  await expect(flags(page).nth(0)).toHaveAttribute('aria-label', 'Chapter Chapter 2 at 00:01:29');
  await expect(flags(page).nth(1)).toHaveAttribute('aria-label', 'Chapter Chapter 1 at 00:02:01');
  // A second M at the same frame adds nothing and says why.
  await page.keyboard.press('m');
  await expect(flags(page)).toHaveCount(2);
  await expect(status(page)).toHaveText(/already sits at this frame/);

  await playhead(page).fill('200');
  await flags(page).nth(1).click();
  await expect(playhead(page)).toHaveValue('61');
  await expect(flags(page).nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Chapter title')).toHaveValue('Chapter 1');
});

test('a held modifier, a repeat and a text field never mark a chapter', async ({ page }) => {
  await openEditor(page);
  await playhead(page).fill('30');
  await page.keyboard.press('Control+m');
  await page.keyboard.press('Shift+m');
  await expect(flags(page)).toHaveCount(0);
  await page.keyboard.press('m');
  await flags(page).first().click();
  const title = page.getByLabel('Chapter title');
  await title.fill('');
  await title.pressSequentially('Demo m');
  await expect(title).toHaveValue('Demo m');
  await expect(flags(page)).toHaveCount(1);
});

test('rename, add and delete are each one undo step, and an empty title keeps the old one', async ({
  page,
}) => {
  await openEditor(page);
  await expect(undo(page)).toBeDisabled();
  await markAt(page, 90);
  const title = page.getByLabel('Chapter title');
  await title.fill('Setup');
  await title.press('Enter');
  await expect(flags(page).first()).toHaveAttribute('aria-label', 'Chapter Setup at 00:03:00');
  await title.fill('   ');
  await title.press('Enter');
  await expect(title).toHaveValue('Setup');
  await expect(flags(page).first()).toHaveAttribute('aria-label', 'Chapter Setup at 00:03:00');

  // Delete acts on the flag that was just clicked, because focus is in the timeline.
  await flags(page).first().click();
  await page.keyboard.press('Delete');
  await expect(flags(page)).toHaveCount(0);
  await undo(page).click();
  await expect(flags(page)).toHaveCount(1);
  await undo(page).click();
  await expect(flags(page).first()).toHaveAttribute('aria-label', 'Chapter Chapter 1 at 00:03:00');
  await undo(page).click();
  await expect(flags(page)).toHaveCount(0);
  await expect(undo(page)).toBeDisabled();
});

test('Copy chapters puts a YouTube list on the clipboard, with 00:00 Start when needed', async ({
  page,
}) => {
  await openEditor(page);
  await markAt(page, 59);
  const copy = page.getByRole('button', { name: 'Copy chapters' });
  await copy.click();
  await expect(status(page)).toHaveText(/Copied 1 chapter\./);
  await markAt(page, 61);
  await copy.click();
  await expect(status(page)).toHaveText(/Copied 2 chapters/);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '00:00 Start\n00:01 Chapter 1\n00:02 Chapter 2',
  );
  await markAt(page, 0);
  await copy.click();
  await expect(status(page)).toHaveText(/Copied 3 chapters/);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '00:00 Chapter 3\n00:01 Chapter 1\n00:02 Chapter 2',
  );
});

test('chapters save with the project and reopen, in order and with their titles', async ({
  page,
}) => {
  await openEditor(page);
  await markAt(page, 120);
  await markAt(page, 30);
  const title = page.getByLabel('Chapter title');
  await title.fill('Intro');
  await title.press('Enter');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const saved = (await (await downloaded).path())!;
  await expect(status(page)).toContainText('Portable project saved');
  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await expect(flags(page)).toHaveCount(0);
  await page.getByLabel('Open local project').setInputFiles(saved);
  await expect(status(page)).toContainText('Project reopened', { timeout: 30000 });
  await expect(flags(page)).toHaveCount(2);
  await expect(flags(page).nth(0)).toHaveAttribute('aria-label', 'Chapter Intro at 00:01:00');
  await expect(flags(page).nth(1)).toHaveAttribute('aria-label', 'Chapter Chapter 1 at 00:04:00');
});
