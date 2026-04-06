import { expect, test } from '@playwright/test';

test('share target page shows error when no recognizable music link is shared', async ({
  page,
}) => {
  await page.goto('/share');

  await expect(page.getByRole('heading', { level: 1, name: 'Add from share' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText(
    'That doesn\u2019t look like a supported YouTube, Spotify, or Apple Music track link.'
  );
});
