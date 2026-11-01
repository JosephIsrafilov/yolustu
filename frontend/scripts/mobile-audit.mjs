import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const logFile = 'audit.log';
fs.writeFileSync(logFile, 'Audit Log Started\n');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
}

const BASE_USER = {
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

const DEMO_TRIP = {
  id: 'demo-trip-id',
  driver_id: 'u-public-1',
  origin_city: 'Bakı',
  destination_city: 'Gəncə',
  departure_time: '2026-06-12T10:00:00Z',
  total_seats: 4,
  available_seats: 3,
  price_per_seat: 15,
  description: 'Traveling to Ganja. Luggage welcome.',
  status: 'active',
  created_at: '2026-06-10T10:00:00Z',
  meeting_point: '28 May Metro',
  dropoff_point: 'Ganja City Center',
  vehicle: {
    id: 'v-1',
    user_id: 'u-public-1',
    brand: 'Toyota',
    model: 'Prius',
    year: 2018,
    color: 'Silver',
    plate_number: '99-XX-999',
    created_at: '2026-05-23T10:00:00Z'
  },
  driver: {
    id: 'u-public-1',
    first_name: 'Elvin',
    last_name: 'Mammadov',
    phone: '+994501234567',
    rating: 4.8,
    total_rides: 12,
    created_at: '2026-05-23T10:00:00Z'
  },
  smoking_allowed: false,
  pets_allowed: true,
  music_allowed: true,
  female_only: false
};

async function seedStore(page, language, authenticated = false) {
  await page.addInitScript(
    ({ language, authenticated, user }) => {
      window.localStorage.setItem(
        'yolustu-storage',
        JSON.stringify({
          state: {
            language,
            isAuthenticated: authenticated,
            currentUser: authenticated ? user : null,
            activeMode: authenticated ? 'passenger' : 'passenger',
            activeRole: authenticated ? 'passenger' : 'passenger',
            unreadRides: [],
          },
          version: 2,
        }),
      );
    },
    { language, authenticated, user: BASE_USER },
  );
}

async function mockApi(page) {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathName = url.pathname;

    if (pathName.endsWith('/users/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(BASE_USER),
      });
      return;
    }

    if (pathName.includes('/rides/demo-trip-id') || pathName.includes('/trips/demo-trip-id') || pathName.endsWith('/rides/demo-trip-id')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DEMO_TRIP),
      });
      return;
    }

    if (pathName.includes('/reviews')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (pathName.includes('/wallet')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          availableBalance: 25.5,
          pendingIncome: 0,
          completedIncome: 0,
          totalPayments: 0,
          totalRefunds: 0,
          transactions: [],
        }),
      });
      return;
    }

    if (pathName.includes('/rides/search') || pathName.includes('/trips')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([DEMO_TRIP]),
      });
      return;
    }

    if (pathName.includes('/support') || pathName.includes('/messages')) {
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

const viewports = [
  { name: 'iPhone_SE', width: 375, height: 667 },
  { name: 'iPhone_12', width: 390, height: 844 },
  { name: 'iPhone_14ProMax', width: 430, height: 932 },
  { name: 'Android_412', width: 412, height: 915 }
];

const allRoutes = [
  { path: '/', name: 'home', auth: false },
  { path: '/auth/login', name: 'login', auth: false },
  { path: '/auth/register', name: 'register', auth: false },
  { path: '/trips', name: 'trips', auth: false },
  { path: '/trips/demo-trip-id', name: 'trip-details', auth: false },
  { path: '/about', name: 'about', auth: false },
  { path: '/help', name: 'help', auth: false },
  { path: '/terms', name: 'terms', auth: false },
  { path: '/privacy', name: 'privacy', auth: false },
  { path: '/profile', name: 'profile', auth: true },
  { path: '/wallet', name: 'wallet', auth: true },
  { path: '/bookings', name: 'bookings', auth: true },
  { path: '/bookings/requests', name: 'bookings-requests', auth: true },
  { path: '/driver', name: 'driver', auth: true },
  { path: '/driver/create-trip', name: 'driver-create-trip', auth: true },
  { path: '/driver/my-trips', name: 'driver-my-trips', auth: true }
];

const keyRoutes = [
  { path: '/', name: 'home', auth: false },
  { path: '/auth/login', name: 'login', auth: false },
  { path: '/trips', name: 'trips', auth: false },
  { path: '/trips/demo-trip-id', name: 'trip-details', auth: false },
  { path: '/wallet', name: 'wallet', auth: true },
  { path: '/bookings', name: 'bookings', auth: true },
  { path: '/driver/create-trip', name: 'driver-create-trip', auth: true }
];

async function run() {
  const browser = await chromium.launch();
  const phase = process.env.AUDIT_PHASE || 'after';
  const baseDir = path.join('playwright-screenshots', phase);
  fs.mkdirSync(baseDir, { recursive: true });

  log(`Starting mobile audit screenshots for phase: ${phase}...`);

  for (const vp of viewports) {
    log(`Processing viewport: ${vp.name} (${vp.width}x${vp.height})`);
    
    // For iPhone_12, audit ALL routes. For other viewports, audit only key routes.
    // Also, only check 'en' on iPhone_12.
    const isMainViewport = vp.name === 'iPhone_12';
    const routesToRun = isMainViewport ? allRoutes : keyRoutes;
    const languages = isMainViewport ? ['az', 'ru', 'en'] : ['ru', 'az'];

    for (const lang of languages) {
      log(`  Language: ${lang}`);
      
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
      });

      await context.addCookies([
        {
          name: 'NEXT_LOCALE',
          value: lang,
          domain: '127.0.0.1',
          path: '/'
        }
      ]);

      for (const route of routesToRun) {
        const page = await context.newPage();
        try {
          await seedStore(page, lang, route.auth);
          await mockApi(page);
          log(`    Going to ${route.auth ? 'auth' : 'public'}: ${route.path}`);
          await page.goto(`http://127.0.0.1:3000${route.path}`, { waitUntil: 'networkidle', timeout: 15000 });
          await page.waitForTimeout(500); // stable animation
          const dir = path.join(baseDir, vp.name);
          fs.mkdirSync(dir, { recursive: true });
          
          // Screenshot specific components or the viewport
          await page.screenshot({ path: path.join(dir, `${lang}-${route.name}.png`), fullPage: false });
          log(`      Saved ${lang}-${route.name}.png`);
        } catch (e) {
          log(`      Error on route ${route.path} (${lang}): ${e.message}`);
        } finally {
          await page.close();
        }
      }

      await context.close();
    }
  }

  await browser.close();
  log('Mobile audit screenshots completed!');
}

run().catch(err => {
  log(`Audit failed: ${err.message}\nStack: ${err.stack}`);
  process.exit(1);
});
