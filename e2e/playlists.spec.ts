import { expect, test } from '@playwright/test';

test('playlists page lists Favorites and new playlist form', async ({ page }) => {
  await page.goto('/playlists');

  await expect(page.getByRole('heading', { level: 1, name: 'Playlists' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Favorites/ })).toBeVisible();
  await expect(page.getByRole('form', { name: 'Create playlist' })).toBeVisible();
});
