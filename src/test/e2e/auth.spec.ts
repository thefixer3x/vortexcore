import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test('should display login form on home page', async ({ page }) => {
    // Check if login form elements are present
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should redirect to home/login
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/sign in/i)).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    // Fill invalid email
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show email format error
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    // Fill form with invalid credentials
    await page.getByLabel('Email').fill('test@invalid.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid login credentials/i)).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    // Click sign up link
    await page.getByRole('link', { name: /sign up/i }).click();
    
    // Should navigate to sign up
    await expect(page).toHaveURL(/signup|register/);
  });

  test('should show forgot password option', async ({ page }) => {
    // Check for forgot password link
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
  });

  // Note: Actual login test would require test credentials
  // This would be implemented in a real test environment
  test.skip('should login with valid credentials', async ({ page }) => {
    // This test requires actual test user credentials
    // Implementation would depend on your test environment setup
    
    await page.getByLabel('Email').fill('test@vortexcore.app');
    await page.getByLabel('Password').fill('validpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test.skip('should logout successfully', async ({ page }) => {
    // This test requires being logged in first
    // Implementation would follow successful login
    
    // Perform logout
    await page.getByRole('button', { name: /logout/i }).click();
    
    // Should redirect to login
    await expect(page).toHaveURL('/');
  });
});