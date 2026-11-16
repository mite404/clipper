import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { cursorFixture } from '../src/cursor.fixture';
import { choose } from './choose';

async function openEditor(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

async function savedProject(page: Page) {
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  return JSON.parse(await readFile((await (await downloaded).path())!, 'utf8'));
}

test.describe('toggles', () => {
  test('swap sides is a pressed toggle that keeps its name, its own keys and undo', async ({
    page,
  }) => {
    await openEditor(page);
    const swap = page
      .locator('.inspector')
      .getByRole('button', { name: 'Composition: swap sides' });
    const undo = page.getByRole('button', { name: 'Undo', exact: true });
    await expect(swap).toHaveAttribute('aria-pressed', 'false');

    await swap.click();
    await expect(swap).toHaveAttribute('aria-pressed', 'true');
    expect((await savedProject(page)).layout.swapped).toBe(true);

    // Space and Enter belong to the focused toggle, not to play and pause.
    await swap.focus();
    await page.keyboard.press('Space');
    await expect(swap).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('transport-state')).toHaveText('Paused');
    await page.keyboard.press('Enter');
    await expect(swap).toHaveAttribute('aria-pressed', 'true');
    await expect(swap).toBeFocused();

    await undo.click();
    await expect(swap).toHaveAttribute('aria-pressed', 'false');
    await undo.click();
    await expect(swap).toHaveAttribute('aria-pressed', 'true');
  });

  test('mark mouse position is one pressed toggle whose name never changes', async ({ page }) => {
    await openEditor(page);
    await page.getByRole('button', { name: 'Add zoom at playhead' }).first().click();
    const mark = page.getByRole('button', { name: 'Mark mouse position', exact: true });
    await expect(mark).toHaveAttribute('aria-pressed', 'false');

    await mark.focus();
    await page.keyboard.press('Enter');
    await expect(mark).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Set mouse focus on screen' })).toBeVisible();
    await expect(mark).toBeFocused();
    await page.keyboard.press('Space');
    await expect(mark).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('transport-state')).toHaveText('Paused');

    await mark.click();
    const target = page.getByRole('button', { name: 'Set mouse focus on screen' });
    const box = (await target.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.65);
    await expect(mark).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByLabel('Zoom focus X', { exact: true })).toHaveValue(/^25/);
    expect((await savedProject(page)).zooms[0]).toMatchObject({ x: 25, y: 65 });

    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(page.getByLabel('Zoom focus X', { exact: true })).not.toHaveValue(/^25/);
  });
});

test.describe('number fields', () => {
  test('zoom fields show their unit, step with the keyboard and commit typed values', async ({
    page,
  }) => {
    await openEditor(page);
    const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
    await playhead.fill('60');
    await page.getByRole('button', { name: 'Add zoom at playhead' }).first().click();
    const start = page.getByRole('spinbutton', { name: 'Zoom start seconds', exact: true });
    const length = page.getByRole('spinbutton', { name: 'Zoom duration seconds', exact: true });
    const focusX = page.getByRole('spinbutton', { name: 'Zoom focus X', exact: true });
    const focusY = page.getByRole('spinbutton', { name: 'Zoom focus Y', exact: true });
    await expect(start).toHaveValue('2s');
    await expect(length).toHaveValue('4s');
    await expect(focusX).toHaveValue('50%');
    await expect(focusY).toHaveValue('50%');

    // Arrow keys step the field and stay in it: they never step the playhead.
    await start.focus();
    await page.keyboard.press('ArrowUp');
    await expect(start).toHaveValue('2.1s');
    await page.keyboard.press('ArrowLeft');
    await expect(playhead).toHaveValue('60');
    await page.keyboard.press('Shift+ArrowDown');
    await expect(start).toHaveValue('1.1s');

    // Typed text is committed by Enter, clamped to what the timeline can hold.
    await length.fill('2.5');
    await length.press('Enter');
    await expect(length).toHaveValue('2.5s');
    await start.fill('99');
    await start.press('Enter');
    await expect(start).toHaveValue('9.5s');
    await focusX.fill('250');
    await focusX.press('Enter');
    await expect(focusX).toHaveValue('100%');
    await expect(page.getByRole('button', { name: 'Increase Focus X' })).toBeDisabled();
    await page.getByRole('button', { name: 'Decrease Focus X' }).click();
    await expect(focusX).toHaveValue('99%');
    await focusX.fill('100');
    await focusX.press('Enter');
    await focusY.fill('20');
    await focusY.press('Tab');
    await expect(focusY).toHaveValue('20%');
    expect((await savedProject(page)).zooms[0]).toMatchObject({
      start: 285,
      duration: 75,
      x: 100,
      y: 20,
    });

    await length.fill('0.1');
    await length.press('Enter');
    await expect(length).toHaveValue('0.2s');
  });

  test('undo returns a typed zoom focus to its previous value', async ({ page }) => {
    await openEditor(page);
    await page.getByRole('button', { name: 'Add zoom at playhead' }).first().click();
    const focusX = page.getByRole('spinbutton', { name: 'Zoom focus X', exact: true });
    await expect(focusX).toHaveValue('50%');
    await focusX.fill('20');
    await focusX.press('Enter');
    await expect(focusX).toHaveValue('20%');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(focusX).toHaveValue('50%');
  });

  test('cursor time offset is a millisecond field saved with the project', async ({ page }) => {
    await openEditor(page);
    await page.getByLabel('Attach cursor sidecar').setInputFiles({
      name: 'synthetic.mp4.cursor.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(cursorFixture)),
    });
    const offset = page.getByRole('spinbutton', { name: 'Cursor time offset (ms)', exact: true });
    await expect(offset).toHaveValue('0ms');
    await offset.fill('-78');
    await offset.press('Enter');
    await expect(offset).toHaveValue('-78ms');
    await page.keyboard.press('ArrowUp');
    await expect(offset).toHaveValue('-77ms');
    await page.keyboard.press('Shift+ArrowUp');
    await expect(offset).toHaveValue('-67ms');
    const saved = await savedProject(page);
    expect(
      saved.media.find((asset: { id: string }) => asset.id === 'landscape').cursor.offsetMs,
    ).toBe(-67);
  });
});

test.describe('selects', () => {
  test('camera follow is a listbox select that keeps its keys, saves the choice and undoes', async ({
    page,
  }) => {
    await openEditor(page);
    const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
    await playhead.fill('60');
    await page.getByRole('button', { name: 'Add zoom at playhead' }).first().click();
    const follow = page.getByRole('combobox', { name: 'Camera follow', exact: true });
    await expect(follow).toHaveText(/Fixed focus/);

    // The keyboard opens and drives the list. None of its keys reach the timeline.
    await follow.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('listbox').getByRole('option')).toHaveText([
      /Fixed focus/,
      /Focused/,
      /Smooth/,
    ]);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(follow).toHaveText(/Smooth/);
    await expect(follow).toBeFocused();
    expect((await savedProject(page)).zooms[0].follow).toBe('smooth');

    // Closed, the trigger still owns the arrow keys, Space, S and Delete.
    await follow.focus();
    for (const key of ['ArrowLeft', 'ArrowRight', 'Space', 's', 'Escape', 'Delete']) {
      await page.keyboard.press(key);
      await page.keyboard.press('Escape');
    }
    await expect(playhead).toHaveValue('60');
    await expect(page.getByTestId('transport-state')).toHaveText('Paused');
    await expect(page.getByRole('button', { name: 'Select zoom' })).toHaveCount(1);

    await choose(page, 'Camera follow', 'Focused · quick reading holds');
    expect((await savedProject(page)).zooms[0].follow).toBe('focused');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(follow).toHaveText(/Smooth/);
  });

  test('insert onto track offers only audio tracks for audio and inserts onto the choice', async ({
    page,
  }) => {
    await openEditor(page);
    await page.getByRole('button', { name: 'Select Ambient bed' }).click();
    const track = page.getByRole('combobox', { name: 'Insert onto track', exact: true });
    await track.click();
    const options = page.getByRole('listbox').getByRole('option');
    await expect(options).toHaveCount(2);
    await expect(options.first()).toContainText('Voice');
    await page.getByRole('listbox').getByRole('option', { name: /Music/ }).click();
    await expect(track).toContainText('Music');
    await page.getByRole('button', { name: 'Insert source at playhead' }).click();
    await expect(page.getByTestId('track-music').getByRole('button')).toHaveCount(2);
  });

  test('cursor style, motion and ending are selects whose choices reach the project', async ({
    page,
  }) => {
    await openEditor(page);
    await page.getByLabel('Attach cursor sidecar').setInputFiles({
      name: 'synthetic.mp4.cursor.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(cursorFixture)),
    });
    const style = page.getByRole('combobox', { name: 'Cursor style', exact: true });
    await expect(style).toHaveText(/Recorded shapes/);
    await style.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(style).toHaveText(/Touch/);
    await choose(page, 'Cursor motion', 'Raw');
    await page.getByText('Advanced cursor', { exact: true }).click();
    await choose(page, 'Cursor ending', 'Return to start');
    await expect(page.getByRole('combobox', { name: 'Cursor ending' })).toHaveText(
      /Return to start/,
    );
    const settings = (await savedProject(page)).media.find(
      (asset: { id: string }) => asset.id === 'landscape',
    ).cursor.settings;
    expect(settings).toMatchObject({ style: 'touch', mode: 'raw', ending: 'loop' });
  });
});

test.describe('collapsible', () => {
  test('advanced cursor is a disclosure button with its own keys that keeps drafts and animates by pointer only', async ({
    page,
  }) => {
    await openEditor(page);
    await page.getByLabel('Attach cursor sidecar').setInputFiles({
      name: 'synthetic.mp4.cursor.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(cursorFixture)),
    });
    const trigger = page.getByRole('button', { name: 'Advanced cursor', exact: true });
    const rotate = page.getByLabel('Rotate with movement', { exact: true });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(rotate).toBeHidden();

    // Enter and Space belong to the trigger. Space never plays the timeline.
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(rotate).toBeVisible();
    await expect(trigger).toBeFocused();
    await page.getByLabel('Hide cursor from (source seconds)').fill('1.5');
    await trigger.focus();
    await page.keyboard.press('Space');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('transport-state')).toHaveText('Paused');
    await expect(rotate).toBeHidden();
    await page.keyboard.press('Space');
    await expect(rotate).toBeVisible();
    await expect(page.getByLabel('Hide cursor from (source seconds)')).toHaveValue('1.5');

    await rotate.check();
    expect(
      (await savedProject(page)).media.find((asset: { id: string }) => asset.id === 'landscape')
        .cursor.settings.rotate,
    ).toBe(true);

    // Pointer: the panel runs CSS transitions as it opens. Keyboard: it runs none.
    const panel = page.locator('[data-slot="collapsible-panel"]');
    const transitions = () =>
      panel.evaluate(async (element) => {
        let most = 0;
        const start = performance.now();
        while (performance.now() - start < 400) {
          const running = element.getAnimations().filter((a) => a instanceof CSSTransition);
          most = Math.max(most, running.length);
          await new Promise(requestAnimationFrame);
        }
        return most;
      });
    await trigger.click();
    await expect(rotate).toBeHidden();
    const [pointerOpen] = await Promise.all([transitions(), trigger.click()]);
    expect(pointerOpen).toBeGreaterThan(0);
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(rotate).toBeHidden();
    const [keyboardOpen] = await Promise.all([transitions(), page.keyboard.press('Enter')]);
    expect(keyboardOpen).toBe(0);
    await expect(rotate).toBeVisible();
  });
});
