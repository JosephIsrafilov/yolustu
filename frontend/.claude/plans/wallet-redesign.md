# Wallet Redesign — Modern Fintech Card

## Goal
Transform the wallet page from a flat dashboard into a polished, modern-fintech experience: a layered "payment card" balance object, refined metrics, a grouped/searchable transaction feed, proper skeleton loading, and real error handling (no more `alert()`). Frontend-only, no backend changes.

## Current State (verified)
- `src/app/wallet/page.tsx` — gradient hero with available balance + top-up button, 4 metric cards (pending/earned/spent/refunded), filterable flat transaction list. Loading = generic `LoadingState` spinner. Top-up failure = browser `alert('Top up failed')`.
- `src/app/wallet/TopUpModal.tsx` — 3-step modal (amount → mock payment → success). Functional, lightly styled.
- Data available (`Wallet` type): `availableBalance`, `pendingBalance`, `totalEarned`, `totalSpent`, `totalRefunded`, `currency`. Transactions have `type`, `direction`, `amount`, `status` (`pending`/`posted`/`reversed`), `createdAt`, optional `description`/`bookingId`/`rideId`.
- Reusable pieces to lean on: `Card`, `Button`, `Badge`, `Icon`, `EmptyState`, `Skeleton`, `AnimatedCounter`, `SuccessModal`, `formatPrice`, `formatPriceParts`.
- **Payout is out of scope**: `PayoutRequest` exists as a DB model only — no router endpoint and no service method. There is nothing to wire a functional payout button to. Plan treats payout as a clearly-disabled "coming soon" affordance only (or omit entirely — see open item).

## Design Direction (chosen): Modern Fintech Card
The balance becomes a tangible card object, not a banner: layered glass/gradient surface, EMV-style chip, masked account label derived from `userId` (e.g. `•••• 4F2A`), currency code, prominent animated available balance, pending balance as a secondary line, and floating action(s) anchored to the card.

---

## Implementation

All work lives under `src/app/wallet/`. I'll extract presentational pieces into small co-located components to keep `page.tsx` readable, matching the existing per-feature-folder convention.

### 1. `components/WalletCard.tsx` (new)
The hero "payment card".
- Aspect-ratio card (e.g. `aspect-[1.9/1]` capped max-width) with the existing teal gradient base, plus a layered glass overlay (`backdrop-blur`, subtle inner highlight, soft noise/sheen via gradient — reuse the SpotlightCard aurora idea but static for perf).
- Top row: brand mark ("Yolüstü") + currency code badge (`AZN`).
- EMV chip glyph (small rounded rect with gold gradient) — pure CSS/SVG, no new asset.
- Masked account label: `•••• ` + last 4 of `userId` uppercased. Label text from copy (`cardLabel`).
- Available balance: large, using `AnimatedCounter` on the numeric part + `formatPriceParts` so the `₼` symbol sits as a smaller superscript. Caption = `copy.available`.
- Pending balance: secondary line on the card (`copy.pending`) so the most relevant figures live on the card itself.
- Floating action area: primary **Top up** button (white-on-teal as today). Payout shown as a `disabled` ghost/outline button with a "coming soon" tooltip/caption — visually present per the chosen direction but explicitly non-functional.
- Respects `prefers-reduced-motion` (skip counter animation → render final value).

### 2. `components/WalletMetricCard.tsx` (new)
Refines the 4 metric tiles.
- Keep the existing `METRIC_META` (pending/earned/spent/refunded) icon + accent system.
- Use `AnimatedCounter` for the value, tighter typographic hierarchy, hover lift (`Card hoverable`).
- Note: `pending` also appears on the card — keep it in the grid too for at-a-glance parity, or drop it from the grid and show only 3 (earned/spent/refunded). **Recommend keeping all 4** for grid symmetry; the card's pending line is the "live" emphasis.

### 3. `components/TransactionRow.tsx` + `components/TransactionGroup.tsx` (new)
Richer transaction feed.
- **Per-type icon + accent** instead of just credit/debit plus/minus: map each `WalletTransactionType` to an icon (`passenger_payment`→`credit-card`, `platform_fee`→`banknote`, `driver_pending_earning`→`clock`, `driver_available_earning`→`banknote`, `refund`→`refresh-cw`, `payout`→`send`, `adjustment`→`plus`).
- **Status** rendered with `Badge` (variant by status: `posted`→success/neutral, `pending`→warning, `reversed`→muted) instead of raw uppercase text. Add localized status labels to copy.
- **Relative, localized timestamps** (e.g. "2 hours ago" / "2 saat əvvəl" / "2 часа назад") with absolute date on hover/title. Small `formatRelativeTime(date, language)` helper added to `lib/utils.ts`.
- **Date grouping**: group transactions under `Today` / `Yesterday` / `DD MMM` headers (localized). `TransactionGroup` renders a sticky-ish header + its rows.
- Amount keeps `+`/`-` color coding (credit green / debit ink).

### 4. `components/WalletSkeleton.tsx` (new)
Replaces the generic spinner during initial load with a layout-matched skeleton: card placeholder + 4 metric placeholders + a few row placeholders, built from the existing `Skeleton` component. Keeps perceived performance high and avoids layout shift.

### 5. `page.tsx` (rewrite the presentational layer)
- Compose the above: `WalletCard`, metric grid, then a `Card` containing the history header, **segmented-control filters** (restyled pill group → cleaner segmented look), and the grouped transaction feed.
- **Search input** (optional, recommended): filter transactions client-side by localized type label / amount. Small, sits next to filters.
- **Error handling**: remove `alert()`. Add an inline error banner state on the page for wallet/transaction load failure (with a retry button) and surface top-up failures through the modal (see #6). Keep the existing `Promise.all` load + cancellation pattern.
- Per-filter contextual empty states (e.g. "No refunds yet" vs the generic empty) via copy.
- Keep `Suspense` + `searchParams` topup deep-link behavior intact.

### 6. `TopUpModal.tsx` (polish + error handling)
- Replace the parent's `alert('Top up failed')` path: modal gains an `error` state and renders an inline error message on the mock-payment step with a retry, instead of throwing to an alert. (`handleTopup` in `page.tsx` updated to surface the error to the modal rather than `alert`.)
- Fintech polish on the mock payment step: card-styled summary already exists — tighten it to echo the new `WalletCard` styling (chip, masked number) for visual continuity.
- Preset amounts: keep `[5,10,20,50,100]`; improve selected-state affordance and the custom input.
- Success step: optionally route through the shared `SuccessModal` look (already portal-based) — or keep inline; **recommend keeping inline** to preserve the multi-step flow without a portal swap.

### 7. Copy / i18n (`page.tsx` `WALLET_COPY` + `TopUpModal` `TOPUP_COPY`)
Add keys for all three languages (az/ru/en):
- `cardLabel` (masked-account caption), `payout` + `payoutSoon` (coming-soon caption), `search` (placeholder), `loadError` + `retry`, relative-time units, transaction `status` labels (`pending`/`posted`/`reversed`), date-group labels (`today`/`yesterday`), and per-filter empty messages.

### 8. `lib/utils.ts` (small additions)
- `formatRelativeTime(dateStr, lang)` — localized relative time (minutes/hours/days, falls back to `formatDate`).
- Optional `maskAccount(id)` helper for the card label (or inline in `WalletCard`).

---

## Out of Scope / Won't Do
- No backend changes (no payout endpoint, no new fields).
- No real payment provider integration (mock top-up stays).
- No changes to `WalletPaymentModal` (booking-time payment) beyond shared-style consistency if trivial.

## Verification
- `npm run lint` and `npm run build` (Next.js typecheck) must pass.
- Manual check at `/wallet`: skeleton on load, animated balance, grouped transactions, each filter (incl. empty states), top-up happy path + simulated failure (inline error, no alert), all three languages, and `prefers-reduced-motion`.
- Confirm the `?topup=` / `returnTo` deep-link still opens the modal and redirects after success.

## Open Items (will use sensible defaults unless you say otherwise)
1. **Payout button**: show as disabled "coming soon" on the card (per chosen direction) — or omit entirely until a backend exists? Default: show disabled.
2. **Search box** in history: include it? Default: include (cheap, useful).
3. **Pending in metric grid**: keep all 4 tiles or drop pending (since it's on the card)? Default: keep all 4.
