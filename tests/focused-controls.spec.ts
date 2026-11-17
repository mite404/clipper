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

// The Open project input is display:none, so it can never hold keyboard focus.
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
