import { expect, type Page } from '@playwright/test';

/** Pick an option of a ui-sdk Select by pointer, then wait for its popup to finish closing. */
export async function choose(page: Page, name: string, option: string) {
  await page.getByRole('combobox', { name, exact: true }).click();
  await page.getByRole('listbox').getByRole('option', { name: option, exact: true }).click();
  await expect(page.getByRole('listbox')).toHaveCount(0);
}
