import { expect, test } from '@playwright/test';

test('add song page shows form and rejects an invalid URL', async ({ page }) => {
  await page.goto('/add');

  await expect(page.getByRole('heading', { level: 1, name: 'Add song' })).toBeVisible();
  await expect(page.getByRole('form', { name: 'Add song from music URL' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Track URL' }).fill('https://example.com/not-music');
  await page.getByRole('button', { name: 'Add song' }).click();

  await expect(page.getByRole('alert')).toContainText(
    'That doesn\u2019t look like a supported YouTube, Spotify, or Apple Music track link.'
  );
});
