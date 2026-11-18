import { test, expect, type Locator, type Page } from '@playwright/test';

async function openEditor(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

const radiusLabel = (page: Page) =>
  page.locator('label.slider-label', { hasText: 'Corner radius' });
const undo = (page: Page) => page.getByRole('button', { name: 'Undo', exact: true });

// Press on the start of a label's text, move `dx` px right in two halves with `between` run after
// the first, and release. `between` is where a test pauses, presses Escape or reads mid-drag.
async function drag(page: Page, label: Locator, dx: number, between?: () => Promise<void>) {
  await label.scrollIntoViewIfNeeded();
  const box = (await label.boundingBox())!;
  const [x, y] = [box.x + 6, box.y + 6];
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 2, y, { steps: 6 });
  await between?.();
  await page.mouse.move(x + dx, y, { steps: 6 });
  await page.mouse.up();
}

test('dragging a label changes the value, 2 px a step, Shift ten times and Alt a tenth as far', async ({
  page,
}) => {
  await openEditor(page);
  const radius = page.getByRole('slider', { name: 'Corner radius' });
  await expect(radius).toHaveValue('22');
  await drag(page, radiusLabel(page), 40);
  await expect(radius).toHaveValue('42');
  await drag(page, radiusLabel(page), -10);
  await expect(radius).toHaveValue('37');
  // The bounds hold: 60 px more would be 30 steps past 60.
  await drag(page, radiusLabel(page), 60);
  await expect(radius).toHaveValue('60');
  await page.keyboard.down('Shift');
  await drag(page, radiusLabel(page), -4);
  await page.keyboard.up('Shift');
  await expect(radius).toHaveValue('40');
  await page.keyboard.down('Alt');
  await drag(page, radiusLabel(page), 20);
  await page.keyboard.up('Alt');
  await expect(radius).toHaveValue('41');
  // A label press leaves the value where the drag put it, on the radius's whole-number grid.
  await expect(page.getByText('41px')).toBeVisible();
});

test('one drag is one undo step however long it pauses, and a second drag is another', async ({
  page,
}) => {
  await openEditor(page);
  const radius = page.getByRole('slider', { name: 'Corner radius' });
  await expect(undo(page)).toBeDisabled();
  // The pause outlasts the 800 ms window that ends a typed or slider step.
  await drag(page, radiusLabel(page), 40, () => page.waitForTimeout(1200));
  await expect(radius).toHaveValue('42');
  await drag(page, radiusLabel(page), 20);
  await expect(radius).toHaveValue('52');
  await undo(page).click();
  await expect(radius).toHaveValue('42');
  await undo(page).click();
  await expect(radius).toHaveValue('22');
  await expect(undo(page)).toBeDisabled();
});

test('Escape puts the value back and leaves no undo entry', async ({ page }) => {
  await openEditor(page);
  const radius = page.getByRole('slider', { name: 'Corner radius' });
  await radius.fill('30');
  await expect(undo(page)).toBeEnabled();
  await drag(page, radiusLabel(page), 40, async () => {
    await expect(radius).toHaveValue('40');
    await page.keyboard.press('Escape');
    await expect(radius).toHaveValue('30');
  });
  // The rest of the drag after Escape changes nothing.
  await expect(radius).toHaveValue('30');
  // One Undo reverts the typed edit, not a leftover of the cancelled drag.
  await undo(page).click();
  await expect(radius).toHaveValue('22');
  await expect(undo(page)).toBeDisabled();
});

test('a drag that comes back to where it started leaves no undo entry', async ({ page }) => {
  await openEditor(page);
  const radius = page.getByRole('slider', { name: 'Corner radius' });
  const label = radiusLabel(page);
  await label.scrollIntoViewIfNeeded();
  const box = (await label.boundingBox())!;
  const [x, y] = [box.x + 6, box.y + 6];
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 40, y, { steps: 6 });
  await expect(radius).toHaveValue('42');
  await page.mouse.move(x, y, { steps: 6 });
  await page.mouse.up();
  await expect(radius).toHaveValue('22');
  await expect(undo(page)).toBeDisabled();
});

test('a shortcut pressed mid-drag changes nothing and the undo chain stays intact', async ({
  page,
}) => {
  await openEditor(page);
  const radius = page.getByRole('slider', { name: 'Corner radius' });
  await radius.fill('30');
  await expect(radius).toHaveValue('30');
  // Wait out the 800 ms window so the drag below is not a continuation of the typed step.
  await page.waitForTimeout(900);
  await drag(page, radiusLabel(page), 40, async () => {
    await expect(radius).toHaveValue('40');
    await page.keyboard.press('Control+z');
    await expect(radius).toHaveValue('40');
  });
  await expect(radius).toHaveValue('50');
  // One Undo takes back the drag, the next the typed edit: no step was lost or added.
  await undo(page).click();
  await expect(radius).toHaveValue('30');
  await undo(page).click();
  await expect(radius).toHaveValue('22');
  await expect(undo(page)).toBeDisabled();
});

test('a click on a label still focuses its input, and a press on the input does not scrub', async ({
  page,
}) => {
  await openEditor(page);
  const crop = page.getByRole('spinbutton', { name: 'screen horizontal crop' });
  const label = page.locator('.crop-controls label', { has: crop });
  const value = await crop.inputValue();
  await label.scrollIntoViewIfNeeded();
  const box = (await label.boundingBox())!;
  await page.mouse.click(box.x + 4, box.y + 4);
  await expect(crop).toBeFocused();
  await expect(crop).toHaveValue(value);
  await expect(undo(page)).toBeDisabled();
  // A 3 px wobble is still a click: it focuses, changes nothing and records nothing.
  await crop.blur();
  await page.mouse.move(box.x + 4, box.y + 4);
  await page.mouse.down();
  await page.mouse.move(box.x + 7, box.y + 4, { steps: 3 });
  await page.mouse.up();
  await expect(crop).toBeFocused();
  await expect(crop).toHaveValue(value);
  await expect(undo(page)).toBeDisabled();
  // Dragging across the field itself selects text as before and moves nothing.
  const field = (await crop.boundingBox())!;
  await page.mouse.move(field.x + 8, field.y + field.height / 2);
  await page.mouse.down();
  await page.mouse.move(field.x + 48, field.y + field.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(crop).toHaveValue(value);
  await expect(undo(page)).toBeDisabled();
  // Shift with the arrows steps ten; a plain arrow keeps the native single step.
  await crop.focus();
  await page.keyboard.press('Shift+ArrowUp');
  await expect(crop).toHaveValue(String(Number(value) + 10));
  await page.keyboard.press('ArrowUp');
  await expect(crop).toHaveValue(String(Number(value) + 11));
});

test('a zoom scrubs by frames, stops at its neighbour and says so once', async ({ page }) => {
  await openEditor(page);
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  const start = page.getByLabel('Zoom start seconds', { exact: true });
  const addZoom = page.getByRole('button', { name: 'Add zoom at playhead' }).first();
  await playhead.fill('0');
  await addZoom.click();
  await expect(start).toHaveValue('0');
  await playhead.fill('180');
  await addZoom.click();
  await expect(start).toHaveValue('6');
  const label = page.locator('.numeric-pair label', { has: start });
  // The field steps by 0.1 s, so 20 px is ten steps: a whole second, three frames each.
  await drag(page, label, 20);
  await expect(start).toHaveValue('7');
  await drag(page, label, -20);
  await expect(start).toHaveValue('6');

  // The first zoom ends at 4 s. Dragging far past it stops short of it and reports it, one time.
  await page.evaluate(() => {
    const status = document.querySelector('.app-footer [role="status"]')!;
    const seen: string[] = [];
    Object.assign(window, { seen });
    new MutationObserver(() => seen.push(status.textContent ?? '')).observe(status, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  });
  await drag(page, label, -400);
  const stopped = Number(await start.inputValue());
  expect(stopped).toBeGreaterThanOrEqual(4);
  expect(stopped).toBeLessThan(6);
  await expect(page.getByText('Zooms cannot overlap.')).toBeVisible();
  const seen = await page.evaluate(() => (window as unknown as { seen: string[] }).seen);
  expect(seen.filter((text) => text.includes('Zooms cannot overlap.'))).toHaveLength(1);
  // The whole drag, from 6 s to where it stopped, is one undo step.
  await undo(page).click();
  await expect(start).toHaveValue('6');
});
