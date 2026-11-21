import { expect, test } from '@playwright/test';

const storybookURL = process.env.STORYBOOK_URL || 'http://127.0.0.1:6006';
const story = `${storybookURL}/iframe.html?id=ui-commandmenu--editor-actions&viewMode=story`;

test('opens from the keyboard, filters commands, and runs only the selected action', async ({
  page,
}) => {
  await page.goto(story);
  const trigger = page.getByRole('button', { name: 'Search commands' });
  const menu = page.getByRole('dialog', { name: 'Command menu' });
  const search = menu.getByRole('combobox', { name: 'Search commands' });
  await trigger.press('Enter');
  await expect(search).toBeFocused();
  await search.fill('project');
  await expect(menu.getByRole('option')).toHaveText(['Save project', 'Open project']);
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('log')).toHaveText('Open project');
});

test('empty search cannot dispatch and Escape returns focus and resets search', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto(story);
  const trigger = page.getByRole('button', { name: 'Search commands' });
  const menu = page.getByRole('dialog', { name: 'Command menu' });
  const search = menu.getByRole('combobox', { name: 'Search commands' });
  await trigger.click();
  await search.fill('zzzz');
  await expect(menu.getByText('No matching commands')).toBeVisible();
  await expect(menu.getByRole('option')).toHaveCount(0);
  await search.press('Enter');
  await expect(search).toBeFocused();
  await search.press('Escape');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('log')).toBeEmpty();
  await trigger.click();
  await expect(search).toHaveValue('');
  await expect(menu.getByRole('option', { name: 'Export video' })).toBeInViewport();
});
