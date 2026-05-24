import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    // Go to login page
    await page.goto('/auth/login');

    // Fill in phone and password
    await page.locator('input[type="text"]').fill('+994501234567');
    await page.locator('input[type="password"]').fill('password123');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Verify it redirects to the search/trips page
    await expect(page).toHaveURL(/\/trips/);
  });

  test('should show error with invalid password length', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill in valid phone but too short password (length < 6)
    await page.locator('input[type="text"]').fill('+994501234567');
    await page.locator('input[type="password"]').fill('123');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // It should not redirect
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
