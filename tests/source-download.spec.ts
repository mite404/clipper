import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('downloads the selected original bytes by pointer and keyboard before and after reopen', async ({
  page,
}, info) => {
  const muxed = info.outputPath('Screen with audio.mp4');
  execFileSync('ffmpeg', [
    '-v',
    'error',
    '-y',
    '-i',
    'public/media/landscape.mp4',
    '-i',
    'tests/fixtures/jfk.m4a',
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c',
    'copy',
    '-t',
    '1',
    muxed,
  ]);
  const sources = [
    { name: 'Screen with audio.mp4', bytes: await readFile(muxed), mimeType: 'video/mp4' },
    { name: 'Voice.wav', bytes: await readFile('public/media/voice.wav'), mimeType: 'audio/wav' },
  ];
  await page.goto('/');
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30_000 });
  await page
    .getByLabel('Import local media')
    .setInputFiles(sources.map(({ name, bytes, mimeType }) => ({ name, buffer: bytes, mimeType })));
  await expect(page.getByTestId('media-status')).toHaveText('6 assets ready');

  const checkDownloads = async () => {
    for (const { name, bytes } of sources) {
      await page.getByRole('button', { name: `Select ${name}`, exact: true }).click();
      const link = page.getByRole('link', { name: 'Download original', exact: true });
      await expect(link).toBeVisible();
      const started = page.waitForEvent('download');
      if (name.endsWith('.mp4')) await link.click();
      else await link.press('Enter');
      const downloaded = await started;
      expect(downloaded.suggestedFilename()).toBe(name);
      expect(await readFile(await downloaded.path())).toEqual(bytes);
    }
    await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
  };
  await checkDownloads();

  const saving = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const saved = await saving;
  await page.reload();
  await expect(page.getByTestId('media-status')).toHaveText('4 assets ready', { timeout: 30_000 });
  await page.getByLabel('Open local project').setInputFiles({
    name: saved.suggestedFilename(),
    buffer: await readFile(await saved.path()),
    mimeType: 'application/json',
  });
  await expect(page.getByTestId('media-status')).toHaveText('6 assets ready');
  await checkDownloads();
});
