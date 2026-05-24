import { test, expect } from '@playwright/test';

test.describe('Search and Filters Flow', () => {
  test('should search and filter trips by parameters', async ({ page }) => {
    // Go to search / trips page
    await page.goto('/trips');

    // Let page load
    await expect(page.locator('h1')).toBeVisible();

    // Select departure city (From)
    const fromSelect = page.locator('select').first();
    await fromSelect.selectOption('Bakı');

    // Select arrival city (To)
    const toSelect = page.locator('select').nth(1);
    await toSelect.selectOption('Gəncə');

    // Verify filter badge for "Bakı" and "Gəncə" is added
    // The filter badges are inside div with flex wrap
    const badges = page.locator('span.rounded-full');
    await expect(badges.first()).toBeVisible();

    // Check one of the preference checkboxes (e.g. Female Only)
    // We target by checkable checkboxes in the sidebar
    const femaleOnlyCheckbox = page.locator('input[type="checkbox"]').first();
    await femaleOnlyCheckbox.check();

    // Verify the checkbox becomes checked
    await expect(femaleOnlyCheckbox).toBeChecked();
  });
});
