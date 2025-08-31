import { test, expect } from '@playwright/test';

test.describe('Protected Routes', () => {
  test('unauthenticated user is redirected from /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/sign in/i)).toBeVisible();
  });

  test('unauthenticated user is redirected from /settings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/sign in/i)).toBeVisible();
  });
});

