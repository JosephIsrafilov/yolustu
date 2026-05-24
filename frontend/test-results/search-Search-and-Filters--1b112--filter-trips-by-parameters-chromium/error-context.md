# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search.spec.ts >> Search and Filters Flow >> should search and filter trips by parameters
- Location: tests/e2e/search.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h1')

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
- main:
  - complementary:
    - heading "Filtrlər" [level=2]
    - button "Sıfırla"
    - heading "Haradan" [level=3]
    - img
    - combobox:
      - option "Bütün şəhərlər" [selected]
      - option "Bakı"
      - option "Gəncə"
      - option "Sumqayıt"
      - option "Şəki"
      - option "Quba"
      - option "Lənkəran"
      - option "Şamaxı"
      - option "Mingəçevir"
      - option "Naftalan"
    - heading "Haraya" [level=3]
    - img
    - combobox:
      - option "Bütün şəhərlər" [selected]
      - option "Bakı"
      - option "Gəncə"
      - option "Sumqayıt"
      - option "Şəki"
      - option "Quba"
      - option "Lənkəran"
      - option "Şamaxı"
      - option "Mingəçevir"
      - option "Naftalan"
    - heading "Tarix" [level=3]
    - textbox
    - heading "Sərnişin sayı" [level=3]
    - button "Sərnişin -": −
    - text: "1"
    - button "Sərnişin +": +
    - heading "Səyahət seçimləri" [level=3]
    - checkbox "Yalnız xanımlar üçün"
    - text: Yalnız xanımlar üçün
    - checkbox "Siqaret çəkmək olar"
    - text: Siqaret çəkmək olar
    - checkbox "Heyvan aparmaq olar"
    - text: Heyvan aparmaq olar
    - checkbox "Musiqi dinləmək olar"
    - text: Musiqi dinləmək olar İndi şəhər, tarix, sərnişin sayı və rahatlıq seçimlərinə (Xanımlara özəl, siqaret, ev heyvanı, musiqi) görə axtarış edə bilərsiniz.
  - text: Bütün
  - img
  - text: Bütün
  - img
  - text: Bütün tarixlər
  - button "Siyahı":
    - img
    - text: Siyahı
  - button "Xəritə":
    - img
    - text: Xəritə
  - text: 0 nəticə tapıldı
  - img
  - heading "Gediş tapılmadı" [level=3]
  - paragraph: Failed to fetch
  - button "Bağla"
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
  3  | test.describe('Search and Filters Flow', () => {
  4  |   test('should search and filter trips by parameters', async ({ page }) => {
  5  |     // Go to search / trips page
  6  |     await page.goto('/trips');
  7  |
  8  |     // Let page load
> 9  |     await expect(page.locator('h1')).toBeVisible();
     |                                      ^ Error: expect(locator).toBeVisible() failed
  10 |
  11 |     // Select departure city (From)
  12 |     const fromSelect = page.locator('select').first();
  13 |     await fromSelect.selectOption('Bakı');
  14 |
  15 |     // Select arrival city (To)
  16 |     const toSelect = page.locator('select').nth(1);
  17 |     await toSelect.selectOption('Gəncə');
  18 |
  19 |     // Verify filter badge for "Bakı" and "Gəncə" is added
  20 |     // The filter badges are inside div with flex wrap
  21 |     const badges = page.locator('span.rounded-full');
  22 |     await expect(badges.first()).toBeVisible();
  23 |
  24 |     // Check one of the preference checkboxes (e.g. Female Only)
  25 |     // We target by checkable checkboxes in the sidebar
  26 |     const femaleOnlyCheckbox = page.locator('input[type="checkbox"]').first();
  27 |     await femaleOnlyCheckbox.check();
  28 |
  29 |     // Verify the checkbox becomes checked
  30 |     await expect(femaleOnlyCheckbox).toBeChecked();
  31 |   });
  32 | });
  33 |
```