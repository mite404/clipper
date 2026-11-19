import { test, expect, type Locator, type Page } from '@playwright/test';
import { expectChoice } from './choice';

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
  // A native field's value, or a ui-sdk select trigger's chosen value.
  const read = () =>
    control.evaluate((el) =>
      el instanceof HTMLInputElement || el instanceof HTMLSelectElement
        ? el.value
        : el.getAttribute('data-value'),
    );
  const before = value ? await read() : '';
  await page.keyboard.press('Space');
  await expect(state).toHaveText('Playing · 1×');
  await page.keyboard.press('Space');
  await expect(state).toHaveText('Paused');
  await expect(control).toBeFocused();
  if (value) await expect.poll(read).toBe(before);
  await expect(page.locator('[data-slot="select-content"][data-open]')).toHaveCount(0);
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
  if (await track.evaluate((el) => el.tagName === 'SELECT')) {
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => (window as unknown as PickerWindow).pickerCalls)).toBe(1);
    await page.keyboard.press('Escape');
    await expect(state).toHaveText('Paused');
    await page.evaluate(() => Object.assign(window, { pickerThrows: true }));
    await track.focus();
    await page.keyboard.press('Enter');
    await expect(track).toHaveValue('screen');
    // Targets list like the timeline rows, frontmost visual first, so Screen's next option is audio.
    await page.keyboard.press('ArrowDown');
    await expect(track).toHaveValue('voice');
  } else {
    // The ui-sdk list is the picker: Enter opens it, Escape closes it and keeps the choice.
    const list = page.locator('[data-slot="select-content"][data-open]');
    await page.keyboard.press('Enter');
    await expect(list).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(list).toHaveCount(0);
    await expect(track).toBeFocused();
    await expectChoice(track, 'screen');
    await expect(state).toHaveText('Paused');
    // Targets list like the timeline rows, frontmost visual first, so Screen's next option is audio.
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(list).toHaveCount(0);
    await expectChoice(track, 'voice');
    await expect(track).toBeFocused();
  }
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

  const source = page.getByLabel('Place at seconds');
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
  // The preset's --ring token.
  expect(ring).toEqual({ width: 2, style: 'solid', color: 'oklch(0.552 0.016 285.938)' });
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

test('Delete and Backspace remove the selection only from inside the timeline', async ({
  page,
}) => {
  await open(page);
  const clips = page.getByTestId('track-screen').getByRole('button');
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  // The editor claims a key with preventDefault; read its final state after dispatch ends.
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
  await expect(clips).toHaveCount(2);
  await clips.first().click();
  await expect(clips.first()).toHaveAttribute('aria-pressed', 'true');

  // Focus outside the timeline: media pool, source monitor, inspector, header and the page body.
  const outside = [
    page.getByRole('button', { name: 'Select A conversation', exact: true }),
    page.getByRole('button', { name: 'Insert source at playhead', exact: true }),
    page.getByRole('button', { name: 'Composition: swap sides' }),
    page.getByRole('button', { name: 'Save project', exact: true }),
  ];
  for (const control of outside) {
    await control.focus();
    for (const key of ['Delete', 'Backspace']) {
      await page.keyboard.press(key);
      await expect(clips).toHaveCount(2);
      await expect(undo).toBeDisabled();
    }
  }
  await page.locator('body').click({ position: { x: 2, y: 400 } });
  for (const key of ['Delete', 'Backspace']) await page.keyboard.press(key);
  await expect(clips).toHaveCount(2);
  expect((await claimed()).filter(([, prevented]) => prevented)).toEqual([]);

  // A pointer selection leaves focus in the timeline, so both keys remove it.
  for (const key of ['Delete', 'Backspace']) {
    await clips.first().click();
    expect(await page.evaluate(() => !!document.activeElement?.closest('#sequence-pane'))).toBe(
      true,
    );
    await page.keyboard.press(key);
    await expect(clips).toHaveCount(1);
    await undo.click();
    await expect(clips).toHaveCount(2);
  }

  // A focused trim grip is inside the timeline too.
  await clips.first().click();
  await page.getByRole('slider', { name: 'Trim left edge' }).first().focus();
  await page.keyboard.press('Delete');
  await expect(clips).toHaveCount(1);
});

test.describe('Delete follows the last clicked or focused panel', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });
  const clips = (page: Page) => page.getByTestId('track-screen').getByRole('button');
  const pool = (page: Page) =>
    page.getByRole('button', { name: 'Select A conversation', exact: true });

  test('survives the app taking focus away, by Undo and by a disabling Undo', async ({ page }) => {
    const undo = page.getByRole('button', { name: 'Undo', exact: true });
    await clips(page).nth(1).click();
    await page.keyboard.press('Delete');
    await expect(clips(page)).toHaveCount(1);
    await page.keyboard.press('ControlOrMeta+z');
    await expect(clips(page)).toHaveCount(2);
    await expect(clips(page).nth(1)).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Delete');
    await expect(clips(page)).toHaveCount(1);
    await undo.click();
    await expect(clips(page)).toHaveCount(2);

    // Cut at a mid frame, then Undo disables itself and drops focus to the page body.
    await page.getByRole('slider', { name: 'Timeline playhead' }).fill('90');
    await clips(page).first().click();
    await page.keyboard.press('Alt+KeyK');
    await expect(clips(page)).toHaveCount(3);
    await undo.click();
    await expect(undo).toBeDisabled();
    await expect(clips(page)).toHaveCount(2);
    await expect(clips(page).first()).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Delete');
    await expect(clips(page)).toHaveCount(1);
  });

  test('a click on the panel title or timecode keeps Delete live', async ({ page }) => {
    for (const target of [
      page.getByText('Main sequence', { exact: true }),
      page.getByTestId('timecode'),
    ]) {
      await clips(page).first().click();
      await pool(page).focus();
      await target.click();
      await page.keyboard.press('Delete');
      await expect(clips(page)).toHaveCount(1);
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      await expect(clips(page)).toHaveCount(2);
    }
  });

  test('a real drag on a trim grip, or a click that never focuses, leaves the timeline active', async ({
    page,
  }) => {
    await clips(page).first().click();
    await pool(page).focus();
    // The selected screen clip's own grip: rows list frontmost first, so Talking head comes first.
    const grip = page
      .getByTestId('track-screen')
      .getByRole('slider', { name: 'Trim right edge' })
      .first();
    const box = (await grip.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 40, box.y + box.height / 2, { steps: 4 });
    await page.mouse.up();
    await page.keyboard.press('Delete');
    await expect(clips(page)).toHaveCount(1);
    await page.getByRole('button', { name: 'Undo', exact: true }).first().click();

    // Safari fires pointerdown on the clip but does not focus a clicked button.
    await clips(page)
      .first()
      .evaluate((el: HTMLElement) => {
        document.body.focus();
        el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
        el.click();
      });
    await pool(page).evaluate((el: HTMLElement) => el.blur());
    await page.keyboard.press('Delete');
    await expect(clips(page)).toHaveCount(1);
  });

  test('moving focus out of the timeline by Tab hands Delete back to the page', async ({
    page,
  }) => {
    await clips(page).first().click();
    await expect(clips(page).first()).toBeFocused();
    const where = () =>
      page.evaluate(() => {
        const el = document.activeElement;
        return el?.closest('#sequence-pane')
          ? 'timeline'
          : el?.closest('.inspector')
            ? 'inspector'
            : 'other';
      });
    let reached = false;
    for (const key of ['Tab', 'Shift+Tab']) {
      for (let press = 0; press < 80 && !reached; press++) {
        await page.keyboard.press(key);
        reached = (await where()) === 'inspector';
      }
      if (reached) break;
      await clips(page).first().focus();
    }
    expect(reached).toBe(true);
    await page.keyboard.press('Delete');
    await page.keyboard.press('Backspace');
    await expect(clips(page)).toHaveCount(2);
  });
});

test('tabbing through the still duration field reports nothing until it really changes', async ({
  page,
}) => {
  await open(page);
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    canvas.getContext('2d')!.fillRect(0, 0, 400, 200);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.getByLabel('Import local media').setInputFiles({
    name: 'still.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png, 'base64'),
  });
  await expect(page.getByTestId('media-status')).toHaveText('5 assets ready', { timeout: 30000 });
  await page.getByRole('button', { name: 'Select still.png', exact: true }).click();
  await page.getByRole('button', { name: 'Insert source at playhead', exact: true }).click();
  const field = page.getByLabel('Selected still duration seconds');
  const status = page.locator('.app-footer [role="status"]');
  await expect(field).toHaveValue('5');
  const inserted = await status.textContent();
  expect(inserted).not.toContain('Still duration updated');

  // Tab in and straight out, and Enter on the unchanged value: no change, no message.
  await field.focus();
  await page.keyboard.press('Tab');
  await expect(field).not.toBeFocused();
  await field.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  await expect(status).toHaveText(inserted!);
  await expect(field).toHaveValue('5');
  await expect(
    page.getByRole('region', { name: 'Still image clip' }).getByRole('status'),
  ).toHaveCount(0);

  // A real change still reports and can be committed with Enter.
  await field.fill('2');
  await field.press('Enter');
  await expect(status).toContainText('Still duration updated.');
  await expect(field).toHaveValue('2');
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeEnabled();

  // An invalid value still shows its error, and an unchanged blur afterwards clears it.
  await field.fill('0');
  await field.press('Enter');
  const error = page.getByRole('region', { name: 'Still image clip' }).getByRole('status');
  await expect(error).toContainText('at least one frame');
  await expect(field).toHaveValue('2');
  await field.focus();
  await page.keyboard.press('Tab');
  await expect(error).toHaveCount(0);
});
