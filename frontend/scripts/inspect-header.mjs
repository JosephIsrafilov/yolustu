import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });
  
  const page = await context.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

  // Set unauthenticated state
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'yolustu-storage',
      JSON.stringify({
        state: {
          language: 'ru',
          isAuthenticated: false,
          currentUser: null,
          activeMode: 'passenger',
          activeRole: 'passenger',
        },
        version: 2,
      }),
    );
  });

  // Mock API including OSRM if any
  await page.route('**', async (route) => {
    const url = route.request().url();
    if (url.includes('router.project-osrm.org') || url.includes('osrm')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ routes: [] }),
      });
      return;
    }
    if (url.includes('/api/v1/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }
    await route.continue();
  });

  console.log('Visiting /trips...');
  await page.goto('http://127.0.0.1:3000/trips', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Evaluate classes and styles of FadeInOnScroll elements
  const info = await page.evaluate(() => {
    const elts = Array.from(document.querySelectorAll('.transition-all'));
    return elts.map(el => ({
      tagName: el.tagName,
      className: el.className,
      opacity: window.getComputedStyle(el).opacity,
      height: el.getBoundingClientRect().height,
      visible: el.getBoundingClientRect().height > 0
    }));
  });

  console.log('FadeInOnScroll elements info:', info.slice(0, 10));

  await browser.close();
}

run().catch(console.error);
