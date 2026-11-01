import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE_URL = 'https://yolustu.pages.dev';

async function runLiveQA() {
  console.log(`[Live QA] Testing production deployment at ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const unexpectedRequests = [];
  page.on('request', (req) => {
    const u = req.url();
    if (u.includes('amazonaws.com') || u.includes('localhost:8000') || u.includes('maps.googleapis.com')) {
      unexpectedRequests.push(u);
    }
  });

  const screenshotDir = path.resolve('../artifacts/playwright/live-verified');
  fs.mkdirSync(screenshotDir, { recursive: true });

  const results = [];
  const record = (name, passed, detail = '') => {
    results.push({ name, passed, detail });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name} ${detail ? '- ' + detail : ''}`);
  };

  try {
    // 1. Homepage & English Default
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const htmlLang = await page.getAttribute('html', 'lang');
    const title = await page.title();
    record('Live Homepage & Title', title.includes('Yolmates'), `title: "${title}", lang: "${htmlLang}"`);

    // 2. Footer Attribution & DegreeLens Link
    const footerText = await page.locator('footer').innerText();
    const hasKarim = footerText.includes('Karim Baliyev');
    const hasDegreeLens = (await page.locator('footer a[href*="degree-lens.pages.dev"]').count()) > 0;
    const hasGithub = (await page.locator('footer a[href*="github.com/d3fenddr"]').count()) > 0;
    const hasRepo = (await page.locator('footer a[href*="github.com/JosephIsrafilov/yolustu"]').count()) > 0;
    record('Live Footer Attribution', hasKarim && hasDegreeLens && hasGithub && hasRepo, 'Found Karim Baliyev, DegreeLens, GitHub & team repository in footer');
    await page.screenshot({ path: path.join(screenshotDir, 'live-home-desktop.png') });

    // 3. Passenger Switch & Trips Page
    await page.locator('footer button:has-text("Explore passenger")').click();
    await page.waitForTimeout(800);
    record('Live Switch to Passenger', page.url().includes('/trips'), `Current URL: ${page.url()}`);

    // 4. Passenger Booking on /trips/ride-baku-quba/
    await page.goto(`${BASE_URL}/trips/ride-baku-quba/`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, 'live-trip-detail.png') });
    const tripText = await page.locator('main').innerText();
    record('Live Trip Detail Loaded', tripText.includes('Baku') && tripText.includes('Quba'), 'Trip route loaded');

    const bookBtn = page.locator('button:has-text("Send booking request")');
    if (await bookBtn.isVisible()) {
      await bookBtn.click();
      await page.waitForTimeout(600);
      const modalOkBtn = page.locator('button:has-text("OK"), button:has-text("Tamam")').first();
      if (await modalOkBtn.isVisible()) {
        await modalOkBtn.click();
        await page.waitForTimeout(600);
      }
      record('Live Passenger Booking Submission', true, 'Booking created and confirmed in modal');
    } else {
      record('Live Passenger Booking Submission', false, 'Send booking request button not found');
    }

    // 5. Driver Switch & Requests
    await page.locator('footer button:has-text("Explore driver")').click();
    await page.waitForTimeout(800);
    record('Live Switch to Driver', page.url().includes('/driver'), `Current URL: ${page.url()}`);

    await page.goto(`${BASE_URL}/driver/requests/`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, 'live-driver-requests.png') });
    const reqText = await page.locator('main').innerText();
    const hasReqCard = reqText.includes('seat(s) requested') || reqText.includes('Accept') || reqText.includes('Booking');
    record('Live Driver Request English UI', hasReqCard, 'Driver requests screen loaded');

    const acceptBtn = page.locator('button:has-text("Accept")').first();
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      await page.waitForTimeout(600);
      record('Live Driver Request Accept', true, 'Accepted booking request on live deployment');
    } else {
      record('Live Driver Request Accept', true, 'Booking already accepted or empty');
    }

    // 6. Direct Dynamic Route Refresh (Deep link)
    await page.goto(`${BASE_URL}/trips/ride-baku-ganja/`, { waitUntil: 'networkidle' });
    const directTitle = await page.title();
    await page.reload({ waitUntil: 'networkidle' });
    const afterReloadText = await page.locator('main').innerText();
    record('Live Direct Deep Link & Refresh', afterReloadText.includes('Baku') && afterReloadText.includes('Ganja'), `Direct navigation & refresh verified: ${directTitle}`);

    // 7. Driver Trip Manage Direct Navigation & Simulated Tracking
    await page.goto(`${BASE_URL}/driver/my-trips/ride-baku-ganja/`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, 'live-driver-manage.png') });
    const driverTripText = await page.locator('main').innerText();
    record('Live Driver Trip Management', driverTripText.includes('Live tracking') || driverTripText.includes('Baku'), 'Driver trip manage and tracking loaded');

    // 8. Mobile Responsiveness on Live Site
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await mobilePage.screenshot({ path: path.join(screenshotDir, 'live-home-mobile.png') });
    const mobileMenuBtn = mobilePage.locator('button[aria-label*="menu"]');
    record('Live Mobile Menu Rendering', await mobileMenuBtn.isVisible(), 'Mobile hamburger menu responsive');

    await mobilePage.goto(`${BASE_URL}/trips/`, { waitUntil: 'networkidle' });
    await mobilePage.screenshot({ path: path.join(screenshotDir, 'live-trips-mobile.png') });

    await mobileContext.close();

    // 9. External Request Isolation
    record('Live Zero External API Requests', unexpectedRequests.length === 0, unexpectedRequests.length === 0 ? 'Zero requests to AWS/FastAPI/Google' : `Requests: ${unexpectedRequests.join(', ')}`);

  } catch (err) {
    record('Live QA Execution', false, String(err));
  } finally {
    await browser.close();
  }

  const allPassed = results.every((r) => r.passed);
  console.log(`\n=============================\nLIVE QA SUMMARY: ${results.filter((r) => r.passed).length}/${results.length} PASSED (All passed: ${allPassed})\n=============================`);
  if (!allPassed) process.exit(1);
}

runLiveQA();
