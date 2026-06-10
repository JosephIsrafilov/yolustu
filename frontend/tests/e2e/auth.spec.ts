import { expect, type Page, test } from '@playwright/test';

const apiUser = {
  id: 'u-1',
  first_name: 'Elvin',
  last_name: 'Mammadov',
  phone: '+994501234567',
  rating: 4.8,
  total_rides: 12,
  created_at: '2026-05-23T10:00:00Z',
  role: 'driver',
  city: 'Baku',
  verification_status: 'approved',
};

async function mockApi(page: Page) {
  let logoutCsrfHeader: string | null = null;

  await page.context().addCookies([
    {
      name: 'NEXT_LOCALE',
      value: 'en',
      url: 'http://localhost:3000',
    },
  ]);

  await page.addInitScript(() => {
    window.localStorage.setItem(
      'yolustu-storage',
      JSON.stringify({ state: { language: 'en' }, version: 2 }),
    );
  });

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path.endsWith('/auth/login')) {
      await page.context().addCookies([
        {
          name: 'access_token',
          value: 'Bearer access-e2e-token',
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
        {
          name: 'refresh_token',
          value: 'refresh-e2e-token',
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
        {
          name: 'csrf_token',
          value: 'csrf-e2e-token',
          domain: 'localhost',
          path: '/',
          httpOnly: false,
          sameSite: 'Lax',
        },
      ]);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'access-e2e-token',
          refreshToken: 'refresh-e2e-token',
          user: apiUser,
        }),
      });
      return;
    }

    if (path.endsWith('/auth/logout')) {
      logoutCsrfHeader = request.headers()['x-csrf-token'] ?? null;
      await page.context().clearCookies();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Logged out successfully' }),
      });
      return;
    }

    if (path.endsWith('/users/me')) {
      const hasAccessCookie = request.headers().cookie?.includes('access_token=');
      await route.fulfill({
        status: hasAccessCookie ? 200 : 401,
        contentType: 'application/json',
        body: JSON.stringify(hasAccessCookie ? apiUser : { detail: 'Not authenticated' }),
      });
      return;
    }

    if (path.endsWith('/rides/search')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  return {
    getLogoutCsrfHeader: () => logoutCsrfHeader,
  };
}

async function fillPhone(page: Page, phone: string) {
  const phoneInput = page.locator('input[type="tel"]');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate((value) => navigator.clipboard.writeText(value), phone);
  await phoneInput.click();
  await page.keyboard.press('Control+V');
  await expect(phoneInput).toHaveValue(/\+994 50 123 45 67/);
}

test.describe('Authentication Flow', () => {
  test('logs in, sends CSRF on logout, and gates protected pages after logout', async ({ page }) => {
    const api = await mockApi(page);

    await page.goto('/auth/login');
    await fillPhone(page, '+994501234567');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByLabel('Log out')).toBeVisible();

    await page.getByLabel('Log out').click();
    await expect.poll(api.getLogoutCsrfHeader).toBe('csrf-e2e-token');

    await page.goto('/bookings');
    await expect(page.getByRole('heading', { name: /Login required|Daxil olmaq lazımdır|Требуется вход/i })).toBeVisible();
  });

  test('shows validation error with missing password', async ({ page }) => {
    await mockApi(page);
    await page.goto('/auth/login');

    await fillPhone(page, '+994501234567');
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText('Password is required')).toBeVisible();
  });
});
