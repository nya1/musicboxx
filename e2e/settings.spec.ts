import { expect, test } from '@playwright/test';

test('settings page shows appearance and library data sections', async ({ page }) => {
  await page.goto('/settings');

  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Library data' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export library…' })).toBeVisible();
});
