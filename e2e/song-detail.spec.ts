import { expect, test } from '@playwright/test';

test('song detail page shows not-found for a missing id', async ({ page }) => {
  await page.goto('/song/999999999');

  await expect(page.getByText('Song not found.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to library' })).toBeVisible();
});
