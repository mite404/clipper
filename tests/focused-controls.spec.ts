import { test, expect, type Locator, type Page } from '@playwright/test';

type PickerWindow = Window & { pickerCalls: number; pickerThrows: boolean };

async function open(page: Page) {
  await page.addInitScript(() => {
    const picker = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'showPicker')!
      .value as (this: HTMLSelectElement) => void;
    Object.assign(window, { pickerCalls: 0, pickerThrows: false });
    HTMLSelectElement.prototype.showPicker = function () {
      const w = window as unknown as PickerWindow;
      w.pickerCalls++;
      if (w.pickerThrows) throw new DOMException('Picker unavailable', 'NotSupportedError');
      picker.call(this);
    };
  });
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

// Reach the control the way a keyboard user does: from its neighbour with Tab.
async function tabTo(page: Page, control: Locator) {
  await control.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(control).toBeFocused();
}

// One unmodified Space press is one play/pause transition, and never the control's own action.
async function spaceToggles(page: Page, control: Locator, value = true) {
  const state = page.getByTestId('transport-state');
  await expect(state).toHaveText('Paused');
  const before = value ? await control.inputValue() : '';
  await page.keyboard.press('Space');
  await expect(state).toHaveText('Playing · 1×');
  await page.keyboard.press('Space');
  await expect(state).toHaveText('Paused');
  await expect(control).toBeFocused();
  if (value) await expect(control).toHaveValue(before);
}

test('Space plays and pauses from focused sliders, buttons and separators', async ({ page }) => {
  await open(page);
  const ranges = [
    page.getByRole('slider', { name: 'Timeline scale' }),
    page.getByRole('slider', { name: 'Source preview position' }),
    page.getByRole('slider', { name: 'Corner radius' }),
  ];
  for (const range of ranges) {
    await tabTo(page, range);
    await spaceToggles(page, range);
    await range.click();
    await spaceToggles(page, range);
  }
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  await tabTo(page, playhead);
  await spaceToggles(page, playhead, false);
  await playhead.click();
  await spaceToggles(page, playhead, false);
  await playhead.fill('60');
  await playhead.focus();
  const state = page.getByTestId('transport-state');
  await page.keyboard.down('Space');
  for (let repeat = 0; repeat < 3; repeat++) await page.keyboard.down('Space');
  await page.keyboard.up('Space');
  await expect(state).toHaveText('Playing · 1×');
  await page.keyboard.press('Space');
  await expect(state).toHaveText('Paused');
  for (const control of [
    page.getByRole('button', { name: /media pool pane/ }),
    page.getByRole('slider', { name: 'Trim left edge' }).first(),
    page.getByRole('separator', { name: 'Resize timeline' }),
  ]) {
    await tabTo(page, control);
    await spaceToggles(page, control, false);
  }
});

test('checkbox Enter toggles, select Enter opens its picker, and Space stays transport', async ({
  page,
}) => {
  await open(page);
  const state = page.getByTestId('transport-state');
  const track = page.getByLabel('Insert onto track');
  await tabTo(page, track);
  await spaceToggles(page, track);
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => (window as unknown as PickerWindow).pickerCalls)).toBe(1);
  await page.keyboard.press('Escape');
  await expect(state).toHaveText('Paused');
  await page.evaluate(() => Object.assign(window, { pickerThrows: true }));
  await track.focus();
  await page.keyboard.press('Enter');
  await expect(track).toHaveValue('screen');
  await page.keyboard.press('ArrowDown');
  await expect(track).toHaveValue('camera');
  await expect(state).toHaveText('Paused');

  await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
  await page.keyboard.press('b');
  const instant = page.getByRole('checkbox', { name: 'Instant zoom' });
  await tabTo(page, instant);
  await expect(instant).not.toBeChecked();
  await page.keyboard.press('Enter');
  await expect(instant).toBeChecked();
  await expect(state).toHaveText('Paused');
  await page.keyboard.press('Enter');
  await expect(instant).not.toBeChecked();
  // A held Enter is one toggle, not one undo step per auto-repeat; a chord is not a toggle.
  for (let repeat = 0; repeat < 4; repeat++) await page.keyboard.down('Enter');
  await page.keyboard.up('Enter');
  await expect(instant).toBeChecked();
  await page.keyboard.press('Control+Enter');
  await expect(instant).toBeChecked();
  await page.keyboard.press('Enter');
  await expect(instant).not.toBeChecked();
  await spaceToggles(page, instant, false);
  await expect(instant).not.toBeChecked();
  await instant.click();
  await expect(instant).toBeChecked();
  await spaceToggles(page, instant, false);
  await expect(instant).toBeChecked();

  const source = page.getByLabel('Source in seconds');
  await tabTo(page, source);
  await page.keyboard.press('Space');
  await expect(state).toHaveText('Paused');
  await page.keyboard.press('Control+a');
  await page.keyboard.type('2');
  await expect(state).toHaveText('Paused');
  await expect(source).toHaveValue('2');
});

test('Space plays and pauses from the focused Import media file input without opening the chooser', async ({
  page,
}) => {
  await open(page);
  const state = page.getByTestId('transport-state');
  const input = page.getByLabel('Import local media');
  let choosers = 0;
  page.on('filechooser', () => choosers++);
  await tabTo(page, input);
  await expect(state).toHaveText('Paused');
  await page.keyboard.press('Space');
  await expect(state).toHaveText('Playing · 1×');
  await page.keyboard.press('Space');
  await expect(state).toHaveText('Paused');
  await expect(input).toBeFocused();
  // The chooser would open on the key's release, so wait for it before counting.
  await page.waitForTimeout(300);
  expect(choosers).toBe(0);

  await page.keyboard.press('Enter');
  await expect.poll(() => choosers).toBe(1);
  await expect(state).toHaveText('Paused');
});

test('Tab reaches Open project, Enter opens one chooser and Space plays without one', async ({
  page,
}, info) => {
  await open(page);
  const state = page.getByTestId('transport-state');
  const input = page.getByLabel('Open local project');
  let choosers = 0;
  page.on('filechooser', () => choosers++);
  await page.locator('.app-header').click({ position: { x: 4, y: 4 } });
  let presses = 0;
  while (presses < 12 && !(await input.evaluate((el) => el === document.activeElement))) {
    await page.keyboard.press('Tab');
    presses++;
  }
  await expect(input).toBeFocused();
  // Chromium reports a 3px width with style none when there is no outline, so check the style.
  const ring = await page.locator('.project-open').evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      width: parseFloat(style.outlineWidth),
      style: style.outlineStyle,
      color: style.outlineColor,
    };
  });
  expect(ring).toEqual({ width: 2, style: 'solid', color: 'rgb(194, 180, 255)' });
  await page.locator('.app-header').screenshot({
    path: info.outputPath('open-project-focus.png'),
  });
  await page.keyboard.press('Space');
  await expect(state).toHaveText('Playing · 1×');
  await page.keyboard.press('Space');
  await expect(state).toHaveText('Paused');
  await page.waitForTimeout(300);
  expect(choosers).toBe(0);
  await page.keyboard.press('Enter');
  await expect.poll(() => choosers).toBe(1);
});

test('Open project looks and acts disabled while an export runs', async ({ page }, info) => {
  await open(page);
  await page.getByRole('button', { name: 'Export video', exact: true }).click();
  await page.getByRole('button', { name: 'Render video', exact: true }).click();
  await expect(page.getByRole('progressbar', { name: 'Video export progress' })).toBeVisible();
  const label = page.locator('.project-open');
  await expect(page.getByLabel('Open local project')).toBeDisabled();
  // The same disabled look as Save project, from the shared button:disabled rule.
  const save = page.getByRole('button', { name: 'Save project', exact: true });
  await expect(save).toBeDisabled();
  const look = (el: Locator) =>
    el.evaluate((node) => {
      const style = getComputedStyle(node);
      return [style.opacity, style.cursor];
    });
  expect(await look(label)).toEqual(await look(save));
  expect((await look(label))[0]).toBe('0.35');
  // Only the input ignores the pointer, so hovering the label still shows not-allowed.
  await expect(page.getByLabel('Open local project')).toHaveCSS('pointer-events', 'none');
  await expect(label).toHaveCSS('pointer-events', 'auto');
  let choosers = 0;
  page.on('filechooser', () => choosers++);
  await label.click({ force: true });
  await page.waitForTimeout(300);
  expect(choosers).toBe(0);
  await expect(page.getByLabel('Open local project')).not.toBeFocused();
  expect(await look(label)).toEqual(await look(save));
  await page
    .locator('.app-header')
    .screenshot({ path: info.outputPath('open-project-disabled.png') });
  await page.getByRole('button', { name: 'Cancel export', exact: true }).click();
  await expect(page.getByLabel('Open local project')).toBeEnabled();
  await expect(label).toHaveCSS('opacity', '1');
});

test('Open project is a filled button directly right of Save project in the same row', async ({
  page,
}) => {
  await open(page);
  for (const width of [1440, 960, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    const save = page.getByRole('button', { name: 'Save project', exact: true });
    const label = page.locator('.project-open');
    const [s, o] = [(await save.boundingBox())!, (await label.boundingBox())!];
    expect(Math.abs(o.y - s.y), `row at ${width}`).toBeLessThan(1);
    expect(Math.abs(o.height - s.height), `height at ${width}`).toBeLessThan(1);
    expect(o.x - (s.x + s.width), `gap at ${width}`).toBeGreaterThanOrEqual(0);
    expect(o.x - (s.x + s.width), `gap at ${width}`).toBeLessThan(24);
    const fill = (el: Locator) => el.evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(await fill(label)).toBe(await fill(save));
    // Save, Open, then the right-hand group in DOM order: nothing sits between them.
    const order = await page
      .locator('.app-header')
      .evaluate((header) => [...header.children].map((child) => child.className.split(' ')[0]));
    expect(order.slice(1, 4)).toEqual(['save-button', 'save-button', 'header-actions']);
  }
});

test('a mouse click on Open project leaves no ring and a press scales it like Save', async ({
  page,
}) => {
  await open(page);
  const label = page.locator('.project-open');
  const save = page.getByRole('button', { name: 'Save project', exact: true });
  let choosers = 0;
  page.on('filechooser', () => choosers++);
  await label.click();
  await expect.poll(() => choosers).toBe(1);
  expect(await label.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none');

  // Press and hold, read the transform, then release away from the label so no chooser opens.
  const pressed = async (el: Locator) => {
    const box = (await el.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const transform = await el.evaluate((node) => getComputedStyle(node).transform);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height + 200);
    await page.mouse.up();
    return transform;
  };
  const scale = 'matrix(0.97, 0, 0, 0.97, 0, 0)';
  expect(await pressed(save)).toBe(scale);
  await expect(label).toHaveCSS('transform', 'none');
  expect(await pressed(label)).toBe(scale);
  expect(choosers).toBe(1);
});
