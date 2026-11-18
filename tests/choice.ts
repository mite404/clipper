import { expect, type Locator } from '@playwright/test';

// Drives a dropdown the way a person does, whether it is a native <select> or a ui-sdk Select.

const isNative = (control: Locator) => control.evaluate((el) => el.tagName === 'SELECT');

const openList = (control: Locator) =>
  control.page().locator('[data-slot="select-content"][data-open]');

/** Chooses an option by value, or by its visible label. */
export async function choose(control: Locator, option: string | { label: string }) {
  if (await isNative(control)) {
    await control.selectOption(option);
    return;
  }
  await control.click();
  const list = openList(control);
  const item =
    typeof option === 'string'
      ? list.locator(`[data-slot="select-item"][data-value="${option}"]`)
      : list.getByRole('option', { name: option.label, exact: true });
  await item.click();
  await expect(list).toHaveCount(0);
}

/** Asserts the chosen value. */
export async function expectChoice(control: Locator, value: string) {
  if (await isNative(control)) await expect(control).toHaveValue(value);
  else await expect(control).toHaveAttribute('data-value', value);
}

/** The option labels in order, read without changing the choice. */
export async function choiceLabels(control: Locator): Promise<string[]> {
  if (await isNative(control)) return control.locator('option').allTextContents();
  await control.click();
  const list = openList(control);
  const labels = await list.locator('[data-slot="select-item-text"]').allTextContents();
  await control.page().keyboard.press('Escape');
  await expect(list).toHaveCount(0);
  return labels;
}

/** Asserts the label the closed control shows. */
export async function expectChoiceLabel(control: Locator, label: string) {
  if (await isNative(control)) await expect(control.locator('option:checked')).toHaveText(label);
  else await expect(control.locator('[data-slot="select-value"]')).toHaveText(label);
}
