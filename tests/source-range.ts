import { expect, type Page } from '@playwright/test';

const FPS = 30;
const clock = (frame: number) => {
  const seconds = Math.floor(frame / FPS);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};

/** Moves the source preview to a frame, with the preview bar for video or the element for audio. */
export async function seekSource(page: Page, frame: number) {
  const bar = page.getByRole('slider', { name: 'Source preview position' });
  if (await bar.count()) await bar.fill(String(frame / FPS));
  else
    await page
      .locator('.source-preview audio')
      .evaluate((audio: HTMLAudioElement, time) => (audio.currentTime = time), frame / FPS);
  await expect(page.getByTestId('source-position')).toHaveText(clock(frame));
}

/** Marks the source range the way a person does: park the preview, then Set in or Set out. */
export async function markRange(page: Page, start: number, end: number) {
  await seekSource(page, start);
  await page.getByRole('button', { name: 'Set in', exact: true }).click();
  // Out includes the frame it is set on, so the end frame is one past it.
  await seekSource(page, end - 1);
  await page.getByRole('button', { name: 'Set out', exact: true }).click();
}

export const rangeIn = (page: Page) => page.getByLabel('Source in', { exact: true });
export const rangeOut = (page: Page) => page.getByLabel('Source out', { exact: true });
