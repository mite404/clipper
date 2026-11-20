import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// CLIP-19's closing unit: arbitrary crop bounds. Each mask's edges move past the proportional
// presets through the Inspector's Screen/Camera rows (X, Y, W, H in edit px), with the same
// draft/commit and label-drag surface as the Stage fields, and one undo step per gesture.

const fields = (page: Page) => ({
  x: page.getByLabel('screen mask x'),
  y: page.getByLabel('screen mask y'),
  width: page.getByLabel('screen mask width'),
  height: page.getByLabel('screen mask height'),
  cameraX: page.getByLabel('camera mask x'),
});

async function saveProject(page: Page) {
  const saving = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  return readFileSync((await (await saving).path())!, 'utf8');
}

test('mask bounds edit by number, keyboard and label drag, clamped on stage, one undo step each', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const { x, y, width, height, cameraX } = fields(page);
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  const mask = page.getByTestId('screen-mask');

  // The defaults reproduce the proportional geometry exactly: 10, 10, 880 × 700 and camera at 908.
  await expect(x).toHaveValue('10');
  await expect(y).toHaveValue('10');
  await expect(width).toHaveValue('880');
  await expect(height).toHaveValue('700');
  await expect(cameraX).toHaveValue('908');
  const before = (await mask.boundingBox())!;

  // A typed commit moves the mask; it is one undo step.
  await x.click();
  await x.press('Control+a');
  await x.pressSequentially('200');
  await x.press('Tab');
  await expect(x).toHaveValue('200');
  expect((await mask.boundingBox())!.x).toBeCloseTo(before.x + (before.width * 190) / 880, 0);
  await undo.click();
  await expect(x).toHaveValue('10');
  await page.waitForTimeout(1000);

  // A keyboard entry commits on Enter (which blurs). The mask is 700 tall, so Y can reach 20.
  await y.click();
  await y.press('Control+a');
  await y.pressSequentially('15');
  await y.press('Enter');
  await expect(y).toHaveValue('15');
  await undo.click();
  await expect(y).toHaveValue('10');
  await page.waitForTimeout(1000);

  // A label drag scrubs live and commits one undo step on release.
  const label = page.locator('.crop-controls label', { has: x });
  const box = (await label.boundingBox())!;
  await page.mouse.move(box.x + 4, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 44, box.y + box.height / 2, { steps: 8 });
  // Live: the value already moved while the gesture holds.
  const dragged = Number(await x.inputValue());
  expect(dragged).toBeGreaterThan(10);
  await page.mouse.up();
  await undo.click();
  await expect(x).toHaveValue('10');
  await page.waitForTimeout(1000);

  // Bounds clamp so a mask can never invert or leave the stage: an origin past the edge pulls
  // back inside (1200 + 500 wide becomes 780), and a side below the minimum grows to it.
  await width.click();
  await width.press('Control+a');
  await width.pressSequentially('500');
  await width.press('Tab');
  await x.click();
  await x.press('Control+a');
  await x.pressSequentially('1200');
  await x.press('Tab');
  await expect(x).toHaveValue('780');
  await height.click();
  await height.press('Control+a');
  await height.pressSequentially('5');
  await height.press('Tab');
  await expect(height).toHaveValue('40');
  await page.waitForTimeout(1000);

  // Bounds set back to the proportional geometry remove the field from the saved file.
  await x.click();
  await x.press('Control+a');
  await x.pressSequentially('10');
  await x.press('Tab');
  await width.click();
  await width.press('Control+a');
  await width.pressSequentially('880');
  await width.press('Tab');
  await height.click();
  await height.press('Control+a');
  await height.pressSequentially('700');
  await height.press('Tab');
  const saved = JSON.parse(await saveProject(page));
  expect(saved.layout.screenMask).toBeUndefined();
});

test('mask bounds survive save and reopen; a legacy file saves byte-identical', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
  const { x, width, cameraX } = fields(page);

  // Commit custom bounds on both masks. The camera mask is 362 wide, so 950 clamps to 918.
  await x.click();
  await x.press('Control+a');
  await x.pressSequentially('200');
  await x.press('Tab');
  await cameraX.click();
  await cameraX.press('Control+a');
  await cameraX.pressSequentially('950');
  await cameraX.press('Tab');
  await expect(cameraX).toHaveValue('918');
  const saved = JSON.parse(await saveProject(page));
  expect(saved.layout.screenMask).toEqual({ x: 200, y: 10, width: 880, height: 700 });
  expect(saved.layout.cameraMask).toMatchObject({ x: 918 });

  // Reopening restores the fields.
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByLabel('Open local project').setInputFiles({
    name: 'bounds.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(saved)),
  });
  await expect(page.locator('.app-footer [role="status"]')).toContainText('Project reopened');
  await expect(x).toHaveValue('200');
  await expect(width).toHaveValue('880');
  await expect(cameraX).toHaveValue('918');

  // A legacy file without the keys opens with the defaults and saves byte-identical.
  const legacy = JSON.parse(await saveProject(page));
  legacy.layout = { radius: 22, screenX: 50, screenY: 50, cameraX: 50, cameraY: 15 };
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByLabel('Open local project').setInputFiles({
    name: 'legacy.clipper.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacy)),
  });
  await expect(page.locator('.app-footer [role="status"]')).toContainText('Project reopened');
  await expect(x).toHaveValue('10');
  await expect(cameraX).toHaveValue('908');
  expect(await saveProject(page)).toBe(JSON.stringify(legacy));
});
