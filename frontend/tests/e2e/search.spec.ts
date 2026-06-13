import { test, expect } from '@playwright/test';

test.describe('Search and Filters Flow', () => {
  test('should search and filter trips by parameters', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'NEXT_LOCALE',
        value: 'az',
        url: 'http://localhost:3000',
      },
    ]);
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'yolustu-storage',
        JSON.stringify({ state: { language: 'az' }, version: 2 }),
      );
    });

    // Go to search / trips page
    await page.goto('/trips');

    // Let page load
    await expect(page.locator('h1')).toBeVisible();

    const selectCity = async (index: number, city: string) => {
      const trigger = page.locator('button[aria-haspopup="listbox"]').nth(index);
      await expect(trigger).toBeVisible();
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await page.getByRole('option', { name: city, exact: true }).first().click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    };

    // Select departure city (From)
    await selectCity(0, 'Bakı');

    // Select arrival city (To)
    await selectCity(1, 'Gəncə');

    // Verify filter badge for "Bakı" and "Gəncə" is added
    // The filter badges are inside div with flex wrap
    const badges = page.locator('span.rounded-full');
    await expect(badges.first()).toBeVisible();

    // Check one of the preference checkboxes (e.g. Female Only)
    // We target by checkable checkboxes in the sidebar
    const femaleOnlyCheckbox = page.locator('input[type="checkbox"]').first();
    await page.locator('label').filter({ has: page.locator('input[type="checkbox"]') }).first().click();

    // Verify the checkbox becomes checked
    await expect(femaleOnlyCheckbox).toBeChecked();
  });
});
