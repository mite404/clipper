import { test, expect, type Page } from '@playwright/test';

async function openEditor(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

const playhead = (page: Page) => page.getByRole('slider', { name: 'Timeline playhead' });
const undo = (page: Page) => page.getByRole('button', { name: 'Undo', exact: true });
const status = (page: Page) => page.locator('.app-footer [role="status"]');
const clipAt = (page: Page, track: string, i: number) =>
  page.getByTestId(`track-${track}`).getByRole('button').nth(i);
const edge = (page: Page, track: string, i: number, side: 'left' | 'right') =>
  clipAt(page, track, i).getByRole('slider', { name: `Trim ${side} edge` });

// The demo: screen 0..180 and 180..360, camera 0..360, voice and music 0..360.
async function at(page: Page, frame: number) {
  await playhead(page).fill(String(frame));
}

test('X selects the topmost video clip, or the clip on a selected track, and nothing over a gap', async ({
  page,
}) => {
  await openEditor(page);
  await at(page, 90);
  await page.keyboard.press('x');
  await expect(clipAt(page, 'camera', 0)).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Select Screen recording track' }).click();
  await playhead(page).focus();
  await page.keyboard.press('x');
  await expect(clipAt(page, 'screen', 0)).toHaveAttribute('aria-pressed', 'true');
  await at(page, 200);
  await page.keyboard.press('x');
  await expect(clipAt(page, 'screen', 1)).toHaveAttribute('aria-pressed', 'true');
  await expect(undo(page)).toBeDisabled();

  // Cut the video short to make a gap from 100 to 180 on both video tracks.
  await at(page, 50);
  await page.keyboard.press('x');
  await at(page, 100);
  await page.keyboard.press(']');
  await page.getByRole('button', { name: 'Select Screen recording track' }).click();
  await page.getByRole('button', { name: 'Select Talking head track' }).click();
  await playhead(page).focus();
  await page.keyboard.press('x');
  await expect(clipAt(page, 'camera', 0)).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press(']');
  await expect(edge(page, 'camera', 0, 'right')).toHaveAttribute('aria-valuenow', '100');
  await at(page, 150);
  await page.keyboard.press('x');
  // Nothing is under the playhead: the selection stays where it was.
  await expect(clipAt(page, 'camera', 0)).toHaveAttribute('aria-pressed', 'true');
});

test('[ and ] trim the selected clip to the playhead as one undo step, never outside the clip', async ({
  page,
}) => {
  await openEditor(page);
  await clipAt(page, 'screen', 0).click();
  await at(page, 60);
  await page.keyboard.press(']');
  await expect(edge(page, 'screen', 0, 'right')).toHaveAttribute('aria-valuenow', '60');
  await expect(undo(page)).toBeEnabled();
  // The playhead is past the end of the trimmed clip: nothing happens, and no step is added.
  await at(page, 100);
  await page.keyboard.press(']');
  await page.keyboard.press('[');
  await expect(edge(page, 'screen', 0, 'right')).toHaveAttribute('aria-valuenow', '60');
  await expect(edge(page, 'screen', 0, 'left')).toHaveAttribute('aria-valuenow', '0');
  await at(page, 20);
  await page.keyboard.press('[');
  await expect(edge(page, 'screen', 0, 'left')).toHaveAttribute('aria-valuenow', '20');
  await undo(page).click();
  await expect(edge(page, 'screen', 0, 'left')).toHaveAttribute('aria-valuenow', '0');
  await expect(edge(page, 'screen', 0, 'right')).toHaveAttribute('aria-valuenow', '60');
  await undo(page).click();
  await expect(edge(page, 'screen', 0, 'right')).toHaveAttribute('aria-valuenow', '180');
  await expect(undo(page)).toBeDisabled();
});

test('a quick [ then ] is two undo steps, whatever the order or the timing', async ({ page }) => {
  await openEditor(page);
  await clipAt(page, 'screen', 0).click();
  // Back to back, well inside the 800 ms a slider drag folds into one step.
  await at(page, 20);
  await page.keyboard.press('[');
  await at(page, 120);
  await page.keyboard.press(']');
  await expect(edge(page, 'screen', 0, 'left')).toHaveAttribute('aria-valuenow', '20');
  await expect(edge(page, 'screen', 0, 'right')).toHaveAttribute('aria-valuenow', '120');
  await undo(page).click();
  await expect(edge(page, 'screen', 0, 'right')).toHaveAttribute('aria-valuenow', '180');
  await expect(edge(page, 'screen', 0, 'left')).toHaveAttribute('aria-valuenow', '20');
  await undo(page).click();
  await expect(edge(page, 'screen', 0, 'left')).toHaveAttribute('aria-valuenow', '0');
  await expect(undo(page)).toBeDisabled();
});

test('a locked lane refuses the trim, and modifiers or a text field never trim or select', async ({
  page,
}) => {
  await openEditor(page);
  await clipAt(page, 'camera', 0).click();
  await page.getByRole('button', { name: 'Lock Talking head', exact: true }).click();
  await at(page, 100);
  await page.keyboard.press(']');
  await expect(status(page)).toHaveText(/locked/);
  await expect(undo(page)).toBeDisabled();
  // A locked lane draws no trim grips; unlocked, the clip is as it was.
  await page.getByRole('button', { name: 'Lock Talking head', exact: true }).click();
  await expect(edge(page, 'camera', 0, 'right')).toHaveAttribute('aria-valuenow', '360');
  await playhead(page).focus();
  await page.keyboard.press('Control+]');
  await page.keyboard.press('Alt+[');
  await expect(edge(page, 'camera', 0, 'right')).toHaveAttribute('aria-valuenow', '360');
  await expect(undo(page)).toBeDisabled();
  // Shift+X is not X: with the screen clip selected, the camera clip on top stays unselected.
  await clipAt(page, 'screen', 0).click();
  await at(page, 100);
  await page.keyboard.press('Shift+x');
  await expect(clipAt(page, 'screen', 0)).toHaveAttribute('aria-pressed', 'true');
  await expect(clipAt(page, 'camera', 0)).toHaveAttribute('aria-pressed', 'false');
});

test('Up and Down step to the previous and next edit point and leave sliders, fields and Shift alone', async ({
  page,
}) => {
  await openEditor(page);
  // The demo's edit points: 0, the screen splice at 180, and the last frame, 359.
  await at(page, 100);
  // A focused slider keeps its own arrow keys.
  await page.keyboard.press('ArrowUp');
  await expect(playhead(page)).toHaveValue('101');
  const crop = page.getByRole('spinbutton', { name: 'screen horizontal crop' });
  await crop.focus();
  await page.keyboard.press('ArrowUp');
  await expect(crop).toHaveValue('51');
  await expect(playhead(page)).toHaveValue('101');

  // Before the timeline has been pressed, the arrows are the page's: a focused Inspector button
  // scrolls its panel and the playhead stays.
  const inspector = page.locator('#inspector-pane');
  await inspector.getByRole('button').first().focus();
  const scrolled = await inspector.evaluate((el) => el.scrollTop);
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => inspector.evaluate((el) => el.scrollTop)).toBeGreaterThan(scrolled);
  await expect(playhead(page)).toHaveValue('101');
  // A press on a clip puts focus in the timeline, where the arrows jump.
  await clipAt(page, 'screen', 0).click();
  await page.keyboard.press('Shift+ArrowDown');
  await expect(playhead(page)).toHaveValue('101');
  // The editor takes the key, so the page must not also scroll: a later listener sees it prevented.
  await page.evaluate(() =>
    window.addEventListener('keydown', (event) =>
      Object.assign(window, { lastKeyPrevented: event.defaultPrevented }),
    ),
  );
  for (const [key, frame] of [
    ['ArrowDown', '180'],
    ['ArrowDown', '359'],
    ['ArrowDown', '359'],
    ['ArrowUp', '180'],
    ['ArrowUp', '0'],
    ['ArrowUp', '0'],
  ]) {
    await page.keyboard.press(key);
    await expect(playhead(page)).toHaveValue(frame);
    expect(
      await page.evaluate(() => (window as { lastKeyPrevented?: boolean }).lastKeyPrevented),
    ).toBe(true);
  }
  await expect(undo(page)).toBeEnabled(); // only the crop field edit; the jumps are not edits
});

test("a locked track's clip edges are not edit points", async ({ page }) => {
  await openEditor(page);
  await at(page, 100);
  await page.getByRole('button', { name: 'Lock Screen recording', exact: true }).click();
  await page.keyboard.press('ArrowDown');
  // The screen splice at 180 is skipped; the other tracks' next edge is the last frame.
  await expect(playhead(page)).toHaveValue('359');
});
