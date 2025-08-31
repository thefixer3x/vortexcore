import { test, expect } from '@playwright/test';

test.describe('Error and 404 Pages', () => {
  test('navigating to an unknown route shows 404 page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByText(/404/i)).toBeVisible();
    await expect(page.getByText(/Page not found/i)).toBeVisible();
  });
});

