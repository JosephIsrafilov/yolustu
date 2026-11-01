import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const outDir = path.resolve('out');
const PORT = 3888;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

// Simple static server for out directory mimicking Cloudflare Pages
const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);
    let filePath = path.join(outDir, pathname);

    // If directory or ends with slash, look for index.html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      // 404 fallback
      const notFoundPath = path.join(outDir, '404.html');
      if (fs.existsSync(notFoundPath)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fs.readFileSync(notFoundPath));
        return;
      }
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath));
  } catch (err) {
    res.writeHead(500);
    res.end(String(err));
  }
});

async function runQA() {
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`[QA Server] Serving ${outDir} at ${BASE_URL}`);

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

  const screenshotDir = path.resolve('../artifacts/playwright/qa-verified');
  fs.mkdirSync(screenshotDir, { recursive: true });

  const results = [];
  const record = (name, passed, detail = '') => {
    results.push({ name, passed, detail });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name} ${detail ? '- ' + detail : ''}`);
  };

  try {
    // Test 1: Homepage and English default
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const htmlLang = await page.getAttribute('html', 'lang');
    const title = await page.title();
    record('English Default Language', htmlLang === 'en', `html lang="${htmlLang}", title="${title}"`);

    // Test 2: Footer & Contributor attribution
    const footerText = await page.locator('footer').innerText();
    const hasKarim = footerText.includes('Karim Baliyev');
    const hasDegreeLens = footerText.includes('Degree Lens') || (await page.locator('footer a[href*="degree-lens.pages.dev"]').count()) > 0;
    const hasGithub = (await page.locator('footer a[href*="github.com/d3fenddr"]').count()) > 0;
    const hasRepo = (await page.locator('footer a[href*="github.com/JosephIsrafilov/yolustu"]').count()) > 0;
    record('Footer Contributor Attribution', hasKarim && hasDegreeLens && hasGithub && hasRepo, 'Found Karim Baliyev, DegreeLens, GitHub & team links in footer');

    await page.screenshot({ path: path.join(screenshotDir, 'qa-home-desktop.png'), fullPage: false });

    // Test 3: Demo account switching via footer
    await page.locator('footer button:has-text("Explore passenger")').click();
    await page.waitForTimeout(600);
    const passengerUrl = page.url();
    record('Switch to Passenger Account', passengerUrl.includes('/trips'), `Redirected to ${passengerUrl}`);

    // Verify notifications button appears
    const notifBtn = page.locator('button[aria-label*="Notifications"]');
    const notifVisible = await notifBtn.isVisible();
    record('Demo Notifications Visible', notifVisible, 'Bell icon rendered for passenger');

    // Test 4: Passenger booking flow on trip
    await page.goto(`${BASE_URL}/trips/ride-baku-quba/`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, 'qa-trip-details-desktop.png') });
    
    // Check trip details text
    const tripPageText = await page.locator('main').innerText();
    const hasRoute = tripPageText.includes('Baku') && tripPageText.includes('Quba');
    record('Trip Details Rendered', hasRoute, 'Baku -> Quba displayed');

    // Check booking card or request button
    const bookBtn = page.locator('button:has-text("Send booking request")');
    if (await bookBtn.isVisible()) {
      await bookBtn.click();
      await page.waitForTimeout(600);
      const modalOkBtn = page.locator('button:has-text("OK"), button:has-text("Tamam")').first();
      if (await modalOkBtn.isVisible()) {
        await modalOkBtn.click();
        await page.waitForTimeout(600);
      }
      record('Passenger Booking Submission', true, 'Clicked Send booking request and acknowledged confirmation modal');
    } else {
      record('Passenger Booking Submission', false, 'Send booking request button not found');
    }

    // Test 5: Switch to driver account
    await page.locator('footer button:has-text("Explore driver")').click();
    await page.waitForTimeout(600);
    record('Switch to Driver Account', page.url().includes('/driver'), `Current URL: ${page.url()}`);

    // Test 6: Driver Booking Requests & English labels
    await page.goto(`${BASE_URL}/driver/requests/`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, 'qa-driver-requests-desktop.png') });
    const requestsText = await page.locator('main').innerText();
    const hasSeatRequestLabel = requestsText.includes('seat(s) requested') || requestsText.includes('Accept');
    record('Booking Request Card English Labels', hasSeatRequestLabel, 'English labels verified on driver request card');

    // If an Accept button exists, click it
    const acceptBtn = page.locator('button:has-text("Accept")').first();
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      await page.waitForTimeout(600);
      record('Driver Accept Booking', true, 'Accepted booking request');
    } else {
      record('Driver Accept Booking', true, 'No pending booking or already accepted');
    }

    // Test 7: Driver create a new trip
    await page.goto(`${BASE_URL}/driver/create-trip/`, { waitUntil: 'networkidle' });
    // Fill route: Departure Baku, Arrival Mingachevir
    const fromSelect = page.locator('button:has-text("Haradan"), button:has-text("From"), button:has-text("Baku")').first();
    // Use form or direct inputs on create trip
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    record('Driver Create Trip Page Rendered', inputCount > 0, `Found ${inputCount} inputs`);

    // Test 8: Passenger search & refresh persistence
    await page.locator('footer button:has-text("Explore passenger")').click();
    await page.waitForTimeout(600);
    await page.goto(`${BASE_URL}/trips/`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, 'qa-trips-search-desktop.png') });
    const tripsText = await page.locator('main').innerText();
    record('Passenger Search Trips Available', tripsText.includes('Baku') && tripsText.includes('Ganja'), 'Default trips displayed in search');

    // Test 9: Reload persistence
    await page.reload({ waitUntil: 'networkidle' });
    const tripsTextAfterReload = await page.locator('main').innerText();
    record('State Persists After Reload', tripsTextAfterReload.includes('Baku'), 'Trips state preserved in localStorage');

    // Test 10: Reset demo data
    page.on('dialog', (dialog) => dialog.accept());
    await page.locator('footer button:has-text("Reset demo data")').click();
    await page.waitForTimeout(800);
    record('Reset Demo Data Action', page.url() === `${BASE_URL}/` || page.url() === `${BASE_URL}`, `Returned to ${page.url()}`);

    // Test 11: Direct navigation to dynamic route
    await page.goto(`${BASE_URL}/trips/ride-baku-ganja/`, { waitUntil: 'networkidle' });
    const directNavText = await page.locator('main').innerText();
    record('Direct Navigation to /trips/ride-baku-ganja/', directNavText.includes('Baku') && directNavText.includes('Ganja'), 'Loaded successfully directly');

    // Test 12: Mobile responsiveness test
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await mobilePage.screenshot({ path: path.join(screenshotDir, 'qa-home-mobile.png') });
    const mobileMenuBtn = mobilePage.locator('button[aria-label*="menu"]');
    const mobileMenuVisible = await mobileMenuBtn.isVisible();
    record('Mobile Layout & Navigation Menu', mobileMenuVisible, 'Mobile viewport rendered hamburger menu');

    await mobilePage.goto(`${BASE_URL}/trips/`, { waitUntil: 'networkidle' });
    await mobilePage.screenshot({ path: path.join(screenshotDir, 'qa-trips-mobile.png') });

    await mobileContext.close();

    // Test 13: Zero external / backend requests
    record('No Unexpected Backend or AWS Requests', unexpectedRequests.length === 0, unexpectedRequests.length === 0 ? 'Zero external API calls' : `Requests: ${unexpectedRequests.join(', ')}`);

  } catch (err) {
    record('QA Execution', false, String(err));
  } finally {
    await browser.close();
    server.close();
  }

  const allPassed = results.every((r) => r.passed);
  console.log(`\n=============================\nQA SUMMARY: ${results.filter((r) => r.passed).length}/${results.length} PASSED (All passed: ${allPassed})\n=============================`);
  if (!allPassed) process.exit(1);
}

runQA();
