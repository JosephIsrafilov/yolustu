# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> should login successfully with valid credentials
- Location: tests/e2e/auth.spec.ts:4:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/trips/
Received string:  "http://localhost:3000/auth/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × unexpected value "http://localhost:3000/auth/login"

```

```yaml
- banner:
  - link "Yolüstü":
    - /url: /
    - img
    - text: Yolüstü
  - navigation:
    - link "Gediş axtar":
      - /url: /trips
    - link "Gediş təklif et":
      - /url: /driver/create-trip
  - link "Daxil ol":
    - /url: /auth/login
  - link "Qeydiyyat":
    - /url: /auth/register
- text: Yolüstü
- heading "Daxil ol" [level=1]
- paragraph: Hesabınıza daxil olun
- text: Mobil Nömrə
- img
- textbox "+994501234567"
- text: Şifrə
- img
- textbox "Şifrənizi daxil edin": password123
- text: Failed to fetch
- button "Daxil ol"
- paragraph:
  - text: Hesabınız yoxdur?
  - link "Qeydiyyatdan keçin":
    - /url: /auth/register
- contentinfo:
  - link "Yolüstü":
    - /url: /
    - img
    - text: Yolüstü
  - text: © 2026 Yolüstü. Bütün hüquqlar qorunur.
  - navigation:
    - link "Haqqımızda":
      - /url: /
    - link "Yardım Mərkəzi":
      - /url: /
    - link "İstifadə Şərtləri":
      - /url: /
    - link "Məxfilik Siyasəti":
      - /url: /
  - button "AZ" [pressed]
  - text: "|"
  - button "RU"
  - text: "|"
  - button "EN"
  - text: "|"
  - button "Valyuta":
    - text: AZN ₼
    - img
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test.describe('Authentication Flow', () => {
  4  |   test('should login successfully with valid credentials', async ({ page }) => {
  5  |     // Go to login page
  6  |     await page.goto('/auth/login');
  7  |
  8  |     // Fill in phone and password
  9  |     await page.locator('input[type="text"]').fill('+994501234567');
  10 |     await page.locator('input[type="password"]').fill('password123');
  11 |
  12 |     // Submit form
  13 |     await page.locator('button[type="submit"]').click();
  14 |
  15 |     // Verify it redirects to the search/trips page
> 16 |     await expect(page).toHaveURL(/\/trips/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  17 |   });
  18 |
  19 |   test('should show error with invalid password length', async ({ page }) => {
  20 |     await page.goto('/auth/login');
  21 |
  22 |     // Fill in valid phone but too short password (length < 6)
  23 |     await page.locator('input[type="text"]').fill('+994501234567');
  24 |     await page.locator('input[type="password"]').fill('123');
  25 |
  26 |     // Submit form
  27 |     await page.locator('button[type="submit"]').click();
  28 |
  29 |     // It should not redirect
  30 |     await expect(page).toHaveURL(/\/auth\/login/);
  31 |   });
  32 | });
  33 |
```