import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
});

test('Add zoom creates a four-second playhead region without cursor metadata and reopens it', async ({
  page,
}, testInfo) => {
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  const regions = page.getByRole('button', { name: 'Select zoom', exact: true });
  await expect(page.getByText('Click-driven zooms', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Automatic zoom amount', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Automatic zoom hold seconds', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /from recorded clicks/ })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Remove automatic zooms', exact: true }),
  ).toHaveCount(0);
  await playhead.fill('45');
  await page.getByRole('button', { name: 'Add zoom', exact: true }).click();
  await expect(regions).toHaveCount(1);
  await expect(page.getByLabel('Zoom start seconds', { exact: true })).toHaveValue('1.5');
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('4');
  await expect(page.getByLabel('Camera follow', { exact: true })).toHaveValue('focused');
  await expect(page.getByLabel('Zoom level', { exact: true })).toHaveValue('1.8');
  await playhead.fill('90');
  await expect(page.getByTestId('screen-content')).toHaveCSS('transform', /matrix\(1\.8,/);
  await page.getByRole('button', { name: 'Add zoom', exact: true }).click();
  await expect(page.locator('.app-footer [role="status"]')).toContainText('Zooms cannot overlap');
  await expect(regions).toHaveCount(1);
  await expect(page.getByLabel('Zoom start seconds', { exact: true })).toHaveValue('1.5');
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('4');

  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const download = await downloadEvent;
  const saved = testInfo.outputPath('playhead.clipper.json');
  await download.saveAs(saved);
  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready');
  await page.getByLabel('Open local project').setInputFiles(saved);
  await expect(regions).toHaveCount(1);
  await regions.click();
  await expect(page.getByLabel('Zoom start seconds', { exact: true })).toHaveValue('1.5');
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('4');
  await expect(page.getByLabel('Camera follow', { exact: true })).toHaveValue('focused');
  await expect(page.getByLabel('Zoom level', { exact: true })).toHaveValue('1.8');
});

test('creation clips only the outpoint, accepts six remaining frames and refuses five', async ({
  page,
}) => {
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  const add = page.getByRole('button', { name: 'Add zoom at playhead', exact: true }).first();
  const regions = page.getByRole('button', { name: 'Select zoom', exact: true });
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  await playhead.fill('300');
  await add.click();
  await expect(page.getByLabel('Zoom start seconds', { exact: true })).toHaveValue('10');
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('2');
  await expect(page.locator('.app-footer [role="status"]')).toContainText(
    /shortened.*2.*sequence end/i,
  );
  await undo.click();
  await expect(regions).toHaveCount(0);
  await playhead.fill('354');
  await add.click();
  await expect(page.getByLabel('Zoom start seconds', { exact: true })).toHaveValue('11.8');
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('0.2');
  await undo.click();
  await playhead.fill('355');
  await add.click();
  await expect(regions).toHaveCount(0);
  await expect(playhead).toHaveValue('355');
  await expect(page.locator('.app-footer [role="status"]')).toContainText(/move.*playhead.*0\.2/i);
  await expect(undo).toBeDisabled();
});

test('B creates once per press, ignores editable targets and modifier chords, and advertises its shortcut', async ({
  page,
}) => {
  const regions = page.getByRole('button', { name: 'Select zoom', exact: true });
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  const add = page.getByRole('button', { name: 'Add zoom at playhead', exact: true }).first();
  await playhead.fill('30');
  await page.getByLabel('Source in seconds', { exact: true }).press('b');
  await page.getByLabel('Insert onto track', { exact: true }).press('b');
  await add.focus();
  for (const key of ['Control+b', 'Meta+b', 'Alt+b', 'Shift+B']) await page.keyboard.press(key);
  await expect(regions).toHaveCount(0);
  await page.keyboard.down('b');
  await expect(regions).toHaveCount(1);
  await expect(page.getByLabel('Zoom start seconds', { exact: true })).toHaveValue('1');
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('4');
  await expect(page.getByLabel('Camera follow', { exact: true })).toHaveValue('focused');
  await playhead.fill('210');
  await add.focus();
  await page.keyboard.down('b');
  await expect(regions).toHaveCount(1);
  await page.keyboard.up('b');
  await page.keyboard.press('b');
  await expect(regions).toHaveCount(2);
  await expect(page.getByLabel('Zoom start seconds', { exact: true })).toHaveValue('7');
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('4');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(regions).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Add zoom', exact: true })).toContainText('B');
  await page.getByRole('button', { name: 'Shortcuts', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toContainText(
    'Create zoom at playhead',
  );
  await page.keyboard.press('b');
  await expect(regions).toHaveCount(1);
});

test('dragging a zoom draws it over its neighbours and overwrites them on release, and keys nudge it', async ({
  page,
}) => {
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  const add = page.getByRole('button', { name: 'Add zoom', exact: true });
  const regions = page.getByRole('button', { name: 'Select zoom', exact: true });
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  const start = page.getByLabel('Zoom start seconds', { exact: true });
  // Two 4 s zooms on the 12 s demo: A at 0 and B at 8 s, leaving a 4 s gap between them.
  await playhead.fill('0');
  await add.click();
  await playhead.fill('240');
  await add.click();
  await expect(regions).toHaveCount(2);
  const a = regions.nth(0);
  // The lane is measured on every read: the Inspector's content can change the timeline width.
  const lane = async () => (await page.locator('.zoom-lane').boundingBox())!;
  // The block's start frame, read from its left offset: a pressed block scales about its centre.
  const frameOf = async (block = a) =>
    Math.round(
      (parseFloat(await block.evaluate((e) => (e as HTMLElement).style.left)) / 100) * 360,
    );
  const drag = async (frames: number, before?: () => Promise<void>) => {
    const perFrame = (await lane()).width / 360;
    const box = (await a.boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + 20, y);
    await page.mouse.down();
    await page.mouse.move(box.x + 20 + frames * perFrame, y, { steps: 8 });
    await before?.();
    await page.mouse.up();
  };

  // A press that travels under 4 px is a click: it selects and moves nothing.
  // 2.5 px at the current lane scale.
  await drag((2.5 * 360) / (await lane()).width);
  await expect(start).toHaveValue('0');
  await expect.poll(() => frameOf()).toBe(0);
  await expect(a).toHaveClass(/selected/);

  // Dragged 2 s right, A keeps its 4 s duration; one Undo puts it back.
  await drag(60);
  await expect(start).toHaveValue('2');
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('4');
  await undo.click();
  await expect(start).toHaveValue('0');

  // Dragging an unselected zoom selects it, even when the pointer leaves it. Released over A's
  // tail, B overwrites it: A keeps 0..2 s, and one Undo restores both.
  const b = regions.nth(1);
  const bBox = (await b.boundingBox())!;
  await page.mouse.move(bBox.x + 20, bBox.y + bBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(bBox.x + 20 - (180 * (await lane()).width) / 360, bBox.y + 5, { steps: 6 });
  await page.mouse.up();
  await expect(b).toHaveClass(/selected/);
  await expect(start).toHaveValue('2');
  await a.click();
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('2');
  await undo.click();
  await expect(regions).toHaveCount(2);
  await expect(page.getByLabel('Zoom duration seconds', { exact: true })).toHaveValue('4');

  // Held over B, A draws on top and B stays whole; released, A overwrites B's head.
  await drag(180, async () => {
    await expect.poll(() => frameOf()).toBe(180);
    await expect.poll(() => frameOf(b)).toBe(240);
  });
  await expect(start).toHaveValue('6');
  await expect.poll(() => frameOf(b)).toBe(300);
  await undo.click();
  await expect(start).toHaveValue('0');
  // Dragged up to B's edge, A touches it and B is left whole.
  await drag(120);
  await expect(start).toHaveValue('4');
  await expect.poll(() => frameOf()).toBe(120);
  await expect.poll(() => frameOf(b)).toBe(240);

  // Only the primary button drags: a right-button drag leaves A where it is.
  const held = (await a.boundingBox())!;
  await page.mouse.move(held.x + 20, held.y + held.height / 2);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(held.x - 100, held.y + held.height / 2, { steps: 6 });
  await page.mouse.up({ button: 'right' });
  await expect.poll(() => frameOf()).toBe(120);
  await expect(start).toHaveValue('4');

  // Escape mid-drag cancels the move.
  await drag(-60, async () => {
    await expect.poll(() => frameOf()).toBe(60);
    await page.keyboard.press('Escape');
  });
  await expect(start).toHaveValue('4');
  await expect.poll(() => frameOf()).toBe(120);

  // With the block focused, arrows nudge it a frame, or ten with Shift, and the playhead stays.
  await playhead.fill('30');
  await a.focus();
  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => frameOf()).toBe(119);
  await page.keyboard.press('Shift+ArrowLeft');
  await expect.poll(() => frameOf()).toBe(109);
  await expect(playhead).toHaveValue('30');
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => frameOf()).toBe(110);
  await expect(playhead).toHaveValue('30');
  // Arrows with Alt, Ctrl or Meta are left to the editor and never move the zoom.
  for (const chord of ['Alt+ArrowRight', 'Control+ArrowRight', 'Meta+ArrowLeft']) {
    await a.focus();
    await page.keyboard.press(chord);
    await expect.poll(() => frameOf()).toBe(110);
  }
});

test('a zoom dropped inside another splits it, and the right piece keeps its look through Open', async ({
  page,
}, testInfo) => {
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  const add = page.getByRole('button', { name: 'Add zoom', exact: true });
  const regions = page.getByRole('button', { name: 'Select zoom', exact: true });
  const field = (label: string) => page.getByLabel(label, { exact: true });
  // A: 0..8 s at 2.5× on 30%, 70% with smooth follow. B: 8..12 s at the default look.
  await playhead.fill('0');
  await add.click();
  await field('Zoom duration seconds').fill('8');
  await field('Zoom level').fill('2.5');
  await field('Zoom focus X').fill('30');
  await field('Zoom focus Y').fill('70');
  await field('Camera follow').selectOption('smooth');
  await playhead.fill('240');
  await add.click();
  await expect(regions).toHaveCount(2);
  // B dragged to 2 s lands inside A, leaving A at 0..2 s and a piece of it at 6..8 s.
  const lane = (await page.locator('.zoom-lane').boundingBox())!;
  const b = (await regions.nth(1).boundingBox())!;
  await page.mouse.move(b.x + 20, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + 20 - (180 * lane.width) / 360, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(regions).toHaveCount(3);
  const look = async (index: number) => {
    await regions.nth(index).click();
    return Promise.all(
      [
        'Zoom start seconds',
        'Zoom duration seconds',
        'Zoom level',
        'Zoom focus X',
        'Zoom focus Y',
        'Camera follow',
      ].map((label) => field(label).inputValue()),
    );
  };
  const left = ['0', '2', '2.5', '30', '70', 'smooth'];
  const right = ['6', '2', '2.5', '30', '70', 'smooth'];
  expect(await look(0)).toEqual(left);
  expect(await look(1)).toEqual(right);

  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const saved = testInfo.outputPath('split.clipper.json');
  await (await downloaded).saveAs(saved);
  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await page.getByLabel('Open local project').setInputFiles(saved);
  await expect(regions).toHaveCount(3);
  expect(await look(0)).toEqual(left);
  expect(await look(1)).toEqual(right);
  // Every zoom, the right piece included, has its own ID.
  const { zooms } = JSON.parse(await readFile(saved, 'utf8')) as { zooms: { id: string }[] };
  expect(new Set(zooms.map((z) => z.id)).size).toBe(3);
});

test('dragging either edge of a zoom draws over its neighbours and overwrites them on release, and keys resize it', async ({
  page,
}) => {
  const playhead = page.getByRole('slider', { name: 'Timeline playhead' });
  const add = page.getByRole('button', { name: 'Add zoom', exact: true });
  const regions = page.getByRole('button', { name: 'Select zoom', exact: true });
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  const start = page.getByLabel('Zoom start seconds', { exact: true });
  const length = page.getByLabel('Zoom duration seconds', { exact: true });
  // Two 4 s zooms on the 12 s demo: A at 0 and B at 8 s.
  await playhead.fill('0');
  await add.click();
  await playhead.fill('240');
  await add.click();
  await expect(regions).toHaveCount(2);
  const [a, b] = [regions.nth(0), regions.nth(1)];
  const grip = (zoom: typeof a, edge: 'left' | 'right') =>
    zoom.getByRole('slider', { name: `Resize zoom ${edge} edge` });
  const lane = async () => (await page.locator('.zoom-lane').boundingBox())!;
  // The block's frames, read from its inline geometry: a pressed block must not scale.
  const framesOf = async (zoom: typeof a) =>
    zoom.evaluate((e) => {
      const { left, width } = (e as HTMLElement).style;
      return [
        Math.round((parseFloat(left) / 100) * 360),
        Math.round((parseFloat(width) / 100) * 360),
      ];
    });
  const dragEdge = async (
    zoom: typeof a,
    edge: 'left' | 'right',
    frames: number,
    before?: () => Promise<void>,
  ) => {
    const perFrame = (await lane()).width / 360;
    const box = (await grip(zoom, edge).boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + frames * perFrame, y, { steps: 8 });
    await before?.();
    await page.mouse.up();
  };

  // Each block carries two grips, and pressing one selects the zoom without changing its size.
  await expect(grip(a, 'left')).toHaveCount(1);
  await expect(grip(a, 'right')).toHaveCount(1);
  const idle = (await a.boundingBox())!;
  const held = (await grip(a, 'right').boundingBox())!;
  await page.mouse.move(held.x + held.width / 2, held.y + held.height / 2);
  await page.mouse.down();
  expect(await a.boundingBox()).toEqual(idle);
  await page.mouse.up();
  expect(await a.boundingBox()).toEqual(idle);
  await expect(a).toHaveClass(/selected/);
  await expect(length).toHaveValue('4');

  // Dragging an edge of the unselected zoom selects it, as a clip's grip does: the drag swallows
  // the click that would.
  await b.click();
  await expect(a).not.toHaveClass(/selected/);
  await dragEdge(a, 'right', 30);
  await expect(a).toHaveClass(/selected/);
  await undo.click();
  await expect(length).toHaveValue('4');

  // The right edge drags 1 s out into free space, keeping the start and every other field.
  await dragEdge(a, 'right', 30);
  await expect(start).toHaveValue('0');
  await expect(length).toHaveValue('5');
  await expect(page.getByLabel('Camera follow', { exact: true })).toHaveValue('focused');
  await undo.click();
  await expect(length).toHaveValue('4');

  // Held over B's head, A draws on top and B stays whole; released, A overwrites B's head, and
  // one Undo restores both.
  await dragEdge(a, 'right', 150, async () => {
    expect(await framesOf(a)).toEqual([0, 270]);
    expect(await framesOf(b)).toEqual([240, 120]);
    await expect(a).toHaveCSS('z-index', '1');
  });
  await expect(regions).toHaveCount(2);
  expect(await framesOf(a)).toEqual([0, 270]);
  expect(await framesOf(b)).toEqual([270, 90]);
  await undo.click();
  expect(await framesOf(a)).toEqual([0, 120]);
  expect(await framesOf(b)).toEqual([240, 120]);

  // Dragged past the sequence end, the edge stops there and B, covered whole, is removed.
  await dragEdge(a, 'right', 600);
  await expect(regions).toHaveCount(1);
  await expect(length).toHaveValue('12');
  await undo.click();
  await expect(regions).toHaveCount(2);
  await expect(length).toHaveValue('4');

  // B's left edge dragged over A's tail trims it; dragged to frame 0 it covers A and removes it.
  await b.click();
  await dragEdge(b, 'left', -150);
  expect(await framesOf(a)).toEqual([0, 90]);
  expect(await framesOf(b)).toEqual([90, 270]);
  await undo.click();
  await dragEdge(b, 'left', -600);
  await expect(regions).toHaveCount(1);
  await expect(start).toHaveValue('0');
  await expect(length).toHaveValue('12');
  await undo.click();
  await expect(regions).toHaveCount(2);
  await expect(start).toHaveValue('8');
  await expect(length).toHaveValue('4');

  // Dragged across the other edge, a zoom stops at the six-frame minimum.
  await a.click();
  await dragEdge(a, 'right', -300);
  expect(await framesOf(a)).toEqual([0, 6]);
  // A block that short shows only its grips, never clipped text under them; it keeps its name.
  const label = a.locator('span:not(.zoom-grip)');
  await expect(label).toBeHidden();
  await expect(a).toHaveAttribute('aria-label', 'Select zoom');
  await undo.click();
  await expect(label).toBeVisible();
  expect(await framesOf(a)).toEqual([0, 120]);

  // Escape mid-drag cancels the resize, even over a neighbour.
  await dragEdge(a, 'right', 150, async () => {
    expect(await framesOf(a)).toEqual([0, 270]);
    await page.keyboard.press('Escape');
  });
  expect(await framesOf(a)).toEqual([0, 120]);
  expect(await framesOf(b)).toEqual([240, 120]);
  await expect(length).toHaveValue('4');

  // A focused grip resizes its edge by a frame, ten with Shift, and the playhead stays.
  await playhead.fill('30');
  await grip(a, 'right').focus();
  await page.keyboard.press('ArrowRight');
  expect(await framesOf(a)).toEqual([0, 121]);
  await page.keyboard.press('Shift+ArrowLeft');
  expect(await framesOf(a)).toEqual([0, 111]);
  await expect(playhead).toHaveValue('30');
  await grip(b, 'left').focus();
  await page.keyboard.press('Shift+ArrowLeft');
  expect(await framesOf(b)).toEqual([230, 130]);
  // Arrows with Alt, Ctrl or Meta are left to the editor and never resize.
  for (const chord of ['Alt+ArrowRight', 'Control+ArrowRight', 'Meta+ArrowLeft']) {
    await grip(b, 'left').focus();
    await page.keyboard.press(chord);
    expect(await framesOf(b)).toEqual([230, 130]);
  }

  // The body still drags the whole zoom and a click on it still selects.
  await a.click();
  const body = (await a.boundingBox())!;
  const perFrame = (await lane()).width / 360;
  await page.mouse.move(body.x + body.width / 2, body.y + body.height / 2);
  await page.mouse.down();
  await page.mouse.move(body.x + body.width / 2 + 20 * perFrame, body.y + body.height / 2, {
    steps: 6,
  });
  await page.mouse.up();
  expect(await framesOf(a)).toEqual([20, 111]);

  // The keys follow the same rule: pushing A's edge into B trims B's head.
  await grip(a, 'right').focus();
  for (let press = 0; press < 12; press++) await page.keyboard.press('Shift+ArrowRight');
  expect(await framesOf(a)).toEqual([20, 231]);
  expect(await framesOf(b)).toEqual([251, 109]);
});
