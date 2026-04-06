import { expect, test } from '@playwright/test';

test('playlist detail page shows seeded Favorites playlist', async ({ page }) => {
  await page.goto('/playlist/favorites');

  await expect(page.getByRole('heading', { level: 1, name: /Favorites/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sub-playlists' })).toBeVisible();
  await expect(page.getByRole('link', { name: '← Playlists' })).toBeVisible();
});
