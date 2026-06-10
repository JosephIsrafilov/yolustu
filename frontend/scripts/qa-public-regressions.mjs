import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const phase = process.env.QA_PHASE ?? 'before';
const baseDir = path.resolve('../artifacts/playwright', phase);
const baseUrl = 'http://127.0.0.1:3000';

const baseUser = {
  id: 'u-public-1',
  fullName: 'Elvin Mammadov',
  first_name: 'Elvin',
  last_name: 'Mammadov',
  phone: '+994501234567',
  email: 'elvin@example.com',
  city: 'Bakı',
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

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function seedStore(context, language, authenticated = false) {
  await context.addInitScript(
    ({ language, authenticated, user }) => {
      window.localStorage.setItem(
        'yolustu-storage',
        JSON.stringify({
          state: {
            language,
            isAuthenticated: authenticated,
            currentUser: authenticated ? user : null,
            activeMode: authenticated ? 'driver' : 'passenger',
            activeRole: authenticated ? 'driver' : 'passenger',
            unreadRides: [],
          },
          version: 2,
        }),
      );
    },
    { language, authenticated, user: baseUser },
  );
}

async function mockApi(page) {
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname } = url;

    if (pathname.endsWith('/auth/login')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'access-e2e-token',
          refreshToken: 'refresh-e2e-token',
          user: baseUser,
        }),
      });
      return;
    }

    if (pathname.endsWith('/users/me')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(baseUser) });
      return;
    }

    if (pathname.includes('/reviews')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      return;
    }

    if (pathname.includes('/wallet')) {
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

    if (pathname.includes('/rides/search') || pathname.includes('/trips')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      return;
    }

    if (pathname.includes('/support') || pathname.includes('/messages')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'support-thread-1', messages: [] }),
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
}

async function shot(page, file) {
  await page.screenshot({ path: path.join(baseDir, file), fullPage: true });
}

async function getFirstVisible(page, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.count()) {
      return locator;
    }
  }
  return null;
}

async function runLanguage(language) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  await seedStore(context, language, false);
  const page = await context.newPage();
  await mockApi(page);

  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await shot(page, `${language}-home.png`);

  const openDropdown = await page.evaluate(() => {
    const candidates = [...document.querySelectorAll('button')];
    const trigger = candidates.find((button) => {
      const label = button.textContent?.trim() ?? '';
      return label.includes('From') || label.includes('Откуда') || label.includes('Haradan');
    });
    trigger?.click();
    return Boolean(trigger);
  });
  if (openDropdown) {
    await page.waitForTimeout(300);
    await shot(page, `${language}-home-dropdown.png`);
  }

  const supportButton = await getFirstVisible(page, [
    'button[aria-label*="support" i]',
    'button[aria-label*="поддерж" i]',
    'button[aria-label*="dəstək" i]',
  ]);
  if (supportButton) {
    await supportButton.hover();
    await page.waitForTimeout(250);
    await shot(page, `${language}-home-support-hover.png`);
  }

  await page.goto(`${baseUrl}/trips`, { waitUntil: 'networkidle' });
  await shot(page, `${language}-trips.png`);

  await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle' });
  await shot(page, `${language}-login.png`);

  await page.goto(`${baseUrl}/auth/register`, { waitUntil: 'networkidle' });
  await shot(page, `${language}-register.png`);

  await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle' });
  await page.locator('input').first().fill('+994501234567');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(500);

  await page.goto(`${baseUrl}/profile`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await shot(page, `${language}-profile.png`);

  await page.goto(`${baseUrl}/wallet`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await shot(page, `${language}-wallet.png`);

  await context.close();
  await browser.close();
}

await ensureDir(baseDir);

for (const language of ['en', 'ru', 'az']) {
  console.log(`Capturing ${phase} screenshots for ${language}`);
  await runLanguage(language);
}
