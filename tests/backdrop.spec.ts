import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { choose, expectChoice } from './choice';

test.use({ permissions: ['clipboard-read', 'clipboard-write'], deviceScaleFactor: 2 });

async function openEditor(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
}

const undo = (page: Page) => page.getByRole('button', { name: 'Undo', exact: true });
const style = (page: Page) => page.getByRole('combobox', { name: 'Background style' });
const color = (page: Page, name: string) => page.getByLabel(name, { exact: true });
const slider = (page: Page, name: string) => page.getByRole('slider', { name, exact: true });
// The preview's stage is the screen panel's parent, an AbsoluteFill carrying the backdrop.
const stage = (page: Page) => page.getByTestId('screen-mask').locator('..');
const stageStyle = (page: Page, property: 'backgroundColor' | 'backgroundImage') =>
  stage(page).evaluate((element, name) => getComputedStyle(element)[name], property);

async function savedLayout(page: Page) {
  const saved = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  return JSON.parse(readFileSync((await (await saved).path())!, 'utf8')).layout;
}

// A PNG's pixels at fractions of its size, decoded in the page.
const sample = (page: Page, png: Buffer, points: [number, number][]) =>
  page.evaluate(
    async ({ base64, points }) => {
      const bitmap = await createImageBitmap(
        await (await fetch(`data:image/png;base64,${base64}`)).blob(),
      );
      const g = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d')!;
      g.drawImage(bitmap, 0, 0);
      return points.map(([x, y]) =>
        Array.from(
          g.getImageData(
            Math.min(bitmap.width - 1, Math.floor(x * bitmap.width)),
            Math.min(bitmap.height - 1, Math.floor(y * bitmap.height)),
            1,
            1,
          ).data,
        ).slice(0, 3),
      );
    },
    { base64: png.toString('base64'), points },
  );

// Where the margins and the gap between the two panels are, as fractions of the stage.
const PROBES: [number, number][] = [
  [5 / 1280, 0.5],
  [1275 / 1280, 0.5],
  [899 / 1280, 0.5],
  [0.5, 5 / 720],
  [0.5, 715 / 720],
];

let lastCopy = '';
// The frame Copy frame puts on the clipboard, once it differs from the previous one.
async function copiedFrame(page: Page): Promise<Buffer> {
  await page.getByRole('button', { name: 'Copy frame', exact: true }).click();
  const read = () =>
    page.evaluate(async () => {
      // Mid-write the clipboard holds no PNG yet, which reads as nothing.
      const blob = await navigator.clipboard
        .read()
        .then(([item]) => item.getType('image/png'))
        .catch(() => null);
      if (!blob) return '';
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });
    });
  await expect
    .poll(
      async () => {
        const now = await read();
        return now !== '' && now !== lastCopy;
      },
      { timeout: 30000 },
    )
    .toBe(true);
  lastCopy = await read();
  return Buffer.from(lastCopy, 'base64');
}

const near = (actual: number[], expected: number[], tolerance: number) =>
  actual.every((value, i) => Math.abs(value - expected[i]) <= tolerance);

test('starts as today: a solid #172324 with no shadow, and a saved file carries neither', async ({
  page,
}) => {
  await openEditor(page);
  await expectChoice(style(page), 'solid');
  await expect(color(page, 'Background colour')).toHaveValue('#172324');
  await expect(slider(page, 'Panel shadow')).toHaveValue('0');
  expect(await stageStyle(page, 'backgroundColor')).toBe('rgb(23, 35, 36)');
  await expect(page.getByTestId('screen-mask')).toHaveCSS('box-shadow', 'none');
  await expect(undo(page)).toBeDisabled();
  const layout = await savedLayout(page);
  expect(Object.keys(layout).sort()).toEqual([
    'cameraX',
    'cameraY',
    'radius',
    'screenX',
    'screenY',
  ]);
});

test('a colour pick is one undo step, shows its hex, and is reachable by keyboard', async ({
  page,
}) => {
  await openEditor(page);
  const field = color(page, 'Background colour');
  await field.fill('#336699');
  await expect(field.locator('xpath=following-sibling::output')).toHaveText('#336699');
  await expect.poll(() => stageStyle(page, 'backgroundColor')).toBe('rgb(51, 102, 153)');
  await expect(undo(page)).toBeEnabled();
  await undo(page).click();
  await expect(field).toHaveValue('#172324');
  expect(await stageStyle(page, 'backgroundColor')).toBe('rgb(23, 35, 36)');
  await expect(undo(page)).toBeDisabled();
  // Dragging through the picker reports many colours and commits none until it applies one.
  await field.evaluate((input: HTMLInputElement) => {
    for (const value of ['#112233', '#223344', '#334455']) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await expect(field).toHaveValue('#334455');
  await expect(undo(page)).toBeDisabled();
  expect(await stageStyle(page, 'backgroundColor')).toBe('rgb(23, 35, 36)');
  await field.evaluate((input: HTMLInputElement) =>
    input.dispatchEvent(new Event('change', { bubbles: true })),
  );
  await expect.poll(() => stageStyle(page, 'backgroundColor')).toBe('rgb(51, 68, 85)');
  await undo(page).click();
  await expect(undo(page)).toBeDisabled();
  await expect(field).toHaveValue('#172324');
  // Tab reaches the picker, which a person can open from the keyboard.
  await style(page).focus();
  await page.keyboard.press('Tab');
  await expect(field).toBeFocused();
});

test('Gradient starts from #3b2a6b to #172324 at 135 degrees, edits each part, and goes back to solid', async ({
  page,
}) => {
  await openEditor(page);
  await choose(style(page), 'gradient');
  await expect(color(page, 'Gradient start')).toHaveValue('#3b2a6b');
  await expect(color(page, 'Gradient end')).toHaveValue('#172324');
  await expect(slider(page, 'Gradient angle')).toHaveValue('135');
  await expect
    .poll(() => stageStyle(page, 'backgroundImage'))
    .toBe('linear-gradient(135deg, rgb(59, 42, 107), rgb(23, 35, 36))');
  await slider(page, 'Gradient angle').fill('90');
  await color(page, 'Gradient end').fill('#ff0000');
  await expect
    .poll(() => stageStyle(page, 'backgroundImage'))
    .toBe('linear-gradient(90deg, rgb(59, 42, 107), rgb(255, 0, 0))');
  // Back to solid keeps the start colour and drops the rest.
  await choose(style(page), 'solid');
  await expect(color(page, 'Background colour')).toHaveValue('#3b2a6b');
  expect(await stageStyle(page, 'backgroundImage')).toBe('none');
  expect(await stageStyle(page, 'backgroundColor')).toBe('rgb(59, 42, 107)');
  expect(await savedLayout(page)).toMatchObject({ fill: '#3b2a6b' });
  expect(await savedLayout(page)).not.toHaveProperty('fillTo');
  expect(await savedLayout(page)).not.toHaveProperty('fillAngle');
});

test('Panel shadow draws under the panels, and 0 takes it off the saved file again', async ({
  page,
}) => {
  await openEditor(page);
  await slider(page, 'Panel shadow').fill('50');
  // Strength 50 at the 1920 preview: blur 30 and a 10 px drop in stage pixels, times 1.5.
  await expect(page.getByTestId('screen-mask')).toHaveCSS(
    'box-shadow',
    'rgba(0, 0, 0, 0.5) 0px 15px 45px 0px',
  );
  expect(await savedLayout(page)).toMatchObject({ shadow: 50 });
  await slider(page, 'Panel shadow').fill('0');
  await expect(page.getByTestId('screen-mask')).toHaveCSS('box-shadow', 'none');
  expect(await savedLayout(page)).not.toHaveProperty('shadow');
});

test('Copy frame matches the preview and the CSS angle for a gradient, with and without shadow', async ({
  page,
}) => {
  await openEditor(page);
  await choose(style(page), 'gradient');
  await color(page, 'Gradient start').fill('#ff0000');
  await color(page, 'Gradient end').fill('#0000ff');
  await slider(page, 'Gradient angle').fill('90');
  await page.getByRole('slider', { name: 'Timeline playhead' }).fill('1');
  const probes = async () => ({
    preview: await sample(page, await stage(page).screenshot(), PROBES),
    copy: await sample(page, await copiedFrame(page), PROBES),
  });
  // 90 degrees runs left to right, so the colour at a stage x is its share of red to blue.
  const flat = await probes();
  PROBES.forEach(([x], i) => {
    const expected = [255 * (1 - x), 0, 255 * x];
    expect(
      near(flat.copy[i], expected, 3),
      `copy ${i} ${JSON.stringify(flat.copy[i])} vs ${JSON.stringify(expected)}`,
    ).toBe(true);
    expect(
      near(flat.preview[i], expected, 6),
      `preview ${i} ${JSON.stringify(flat.preview[i])}`,
    ).toBe(true);
  });
  await slider(page, 'Panel shadow').fill('100');
  const shaded = await probes();
  // The shadow darkens the gap between the panels, in the preview and the copy alike.
  expect(shaded.copy[2][0] + shaded.copy[2][2]).toBeLessThan(
    flat.copy[2][0] + flat.copy[2][2] - 40,
  );
  PROBES.forEach((_, i) =>
    expect(
      near(shaded.preview[i], shaded.copy[i], 14),
      `shadow ${i} preview ${JSON.stringify(shaded.preview[i])} copy ${JSON.stringify(shaded.copy[i])}`,
    ).toBe(true),
  );
});

test('a saved project reopens with its backdrop and shadow', async ({ page }) => {
  await openEditor(page);
  await choose(style(page), 'gradient');
  await color(page, 'Gradient start').fill('#112233');
  await slider(page, 'Gradient angle').fill('200');
  await slider(page, 'Panel shadow').fill('35');
  const saved = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const file = readFileSync((await (await saved).path())!);
  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  await expectChoice(style(page), 'solid');
  await page
    .getByLabel('Open local project')
    .setInputFiles({ name: 'backdrop.clipper.json', mimeType: 'application/json', buffer: file });
  await expectChoice(style(page), 'gradient');
  await expect(color(page, 'Gradient start')).toHaveValue('#112233');
  await expect(color(page, 'Gradient end')).toHaveValue('#172324');
  await expect(slider(page, 'Gradient angle')).toHaveValue('200');
  await expect(slider(page, 'Panel shadow')).toHaveValue('35');
});
