// REF-21 probe: what does Chromium do when an imported file changes on disk? Run from the worktree:
//   BASE_URL=http://127.0.0.1:5199 npx playwright test <copied into tests/> --project editor
import { expect, test } from '@playwright/test';
import { copyFile, mkdtemp, utimes, writeFile, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

for (const change of ['touch', 'rewrite'] as const)
  test(`probe ${change}`, async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30000 });
    const dir = await mkdtemp(path.join(os.tmpdir(), 'ref21-'));
    const file = path.join(dir, 'take.mp4');
    await copyFile('public/media/landscape.mp4', file);
    await page.getByLabel('Import local media').setInputFiles(file);
    await expect(page.getByTestId('media-status')).toHaveText('5 assets ready', { timeout: 30000 });
    if (change === 'touch') await utimes(file, new Date(), new Date(Date.now() + 60000));
    else await writeFile(file, Buffer.concat([await readFile(file), Buffer.from('x')]));
    const probe = await page.evaluate(async () => {
      const video = [...document.querySelectorAll('video')].map((v) => v.src);
      const out: string[] = [];
      for (const url of new Set(video.filter((u) => u.startsWith('blob:')))) {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          out.push(`ok ${response.status} ${blob.size} len=${response.headers.get('content-length')}`);
        } catch (error) {
          out.push(`fail ${String(error)}`);
        }
      }
      return out;
    });
    console.log(change, 'video blobs', probe);
    await page.getByRole('button', { name: 'Save project', exact: true }).click();
    await expect(page.locator('[role="status"]')).not.toContainText('ready', { timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log(change, 'status:', await page.locator('[role="status"]').allTextContents());
  });
