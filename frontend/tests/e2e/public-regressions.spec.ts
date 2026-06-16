import { expect, type Page, test } from '@playwright/test';

const BASE_USER = {
  id: 'u-public-1',
  fullName: 'Elvin Mammadov',
  first_name: 'Elvin',
  last_name: 'Mammadov',
  phone: '+994501234567',
  email: 'elvin@example.com',
  city: 'Baki',
  avatarUrl: '',
  rating: 4.8,
  totalTrips: 12,
  total_rides: 12,
  role: 'driver',
  bio: 'Frequent intercity driver',
  verificationStatus: 'approved',
  verification_status: 'approved',
  isEmailVerified: true,
  created_at: '2026-05-23T10:00:00Z',
};

const PHASE = process.env.QA_PHASE ?? 'before';

async function seedStore(page: Page, language: 'az' | 'ru' | 'en', authenticated = false) {
  const cookies: { name: string; value: string; url: string }[] = [
    {
      name: 'NEXT_LOCALE',
      value: language,
      url: 'http://localhost:3000',
    },
  ];

  if (authenticated) {
    cookies.push(
      {
        name: 'access_token',
        value: 'Bearer public-e2e-access',
        url: 'http://localhost:3000',
      },
      {
        name: 'refresh_token',
        value: 'public-e2e-refresh',
        url: 'http://localhost:3000',
      },
      {
        name: 'csrf_token',
        value: 'public-e2e-csrf',
        url: 'http://localhost:3000',
      },
    );
  }

  await page.context().addCookies(cookies);
  await page.addInitScript(
    ({ locale, signedIn, user }) => {
      window.localStorage.setItem(
        'yolustu-storage',
        JSON.stringify({
          state: {
            language: locale,
            isAuthenticated: signedIn,
            currentUser: signedIn ? user : null,
            activeMode: signedIn ? 'driver' : 'passenger',
            activeRole: signedIn ? 'driver' : 'passenger',
            unreadRides: [],
          },
          version: 2,
        }),
      );
    },
    { locale: language, signedIn: authenticated, user: BASE_USER },
  );
}

async function mockApi(page: Page) {
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path.endsWith('/users/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(BASE_USER),
      });
      return;
    }

    if (path.includes('/reviews')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (path.includes('/wallet')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          availableBalance: 0,
          pendingIncome: 0,
          completedIncome: 0,
          totalPayments: 0,
          totalRefunds: 0,
          transactions: [],
        }),
      });
      return;
    }

    if (path.includes('/rides/search') || path.includes('/trips')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (path.includes('/support') || path.includes('/messages') || path.includes('/chats')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'support-thread-1', messages: [] }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

async function saveShot(page: Page, filename: string) {
  await page.screenshot({ path: `../artifacts/playwright/${PHASE}/${filename}`, fullPage: true });
}

test.describe('Public regression QA', () => {
  for (const language of ['en', 'ru', 'az'] as const) {
    test(`public pages look stable in ${language}`, async ({ page }) => {
      await seedStore(page, language, false);
      await mockApi(page);

      await page.goto('/');
      await expect(page.locator('header')).toBeVisible();
      await saveShot(page, `${language}-home.png`);

      const homeFromTrigger = page
        .getByRole('button', { name: new RegExp(`^${language === 'ru' ? 'Откуда' : language === 'az' ? 'Haradan' : 'From'}`, 'i') })
        .first();
      await homeFromTrigger.click();
      await page.waitForTimeout(200);
      await saveShot(page, `${language}-home-dropdown.png`);

      await page.goto('/trips');
      await expect(page.locator('h1')).toBeVisible();
      await saveShot(page, `${language}-trips.png`);

      await page.goto('/auth/login');
      await expect(page.locator('form')).toBeVisible();
      await saveShot(page, `${language}-login.png`);

      await page.goto('/auth/register');
      await expect(page.locator('form')).toBeVisible();
      await saveShot(page, `${language}-register.png`);
    });

    test(`authenticated pages look stable in ${language}`, async ({ page }) => {
      await seedStore(page, language, true);
      await mockApi(page);

      await page.goto('/profile');
      await expect(page.getByText(/Elvin Mammadov/i)).toBeVisible();
      await saveShot(page, `${language}-profile.png`);

      await page.goto('/wallet');
      await expect(page.locator('main')).toBeVisible();
      await saveShot(page, `${language}-wallet.png`);
    });
  }
});
