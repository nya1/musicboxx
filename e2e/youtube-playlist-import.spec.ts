import { expect, test } from '@playwright/test';

test('YouTube playlist URL opens import modal after Invidious responds', async ({ page }) => {
  await page.route('**/api/v1/playlists/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        title: 'E2E test playlist',
        videos: [{ videoId: 'dQw4w9WgXcQ' }],
        continuation: null,
      }),
    });
  });

  await page.goto('/add');

  await page.getByRole('textbox', { name: /^track url$/i }).fill(
    'https://www.youtube.com/playlist?list=PLe2eplaylist'
  );
  await page.getByRole('button', { name: /save to default playlist/i }).click();

  await expect(page.getByRole('heading', { name: /import youtube playlist/i })).toBeVisible();
  await expect(page.getByText(/E2E test playlist/)).toBeVisible();
});
