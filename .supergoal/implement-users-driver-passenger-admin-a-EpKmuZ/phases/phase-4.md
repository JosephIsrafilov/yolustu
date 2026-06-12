SUPERGOAL_PHASE_START
Phase: 4 of 6 — Reliable data loading + error states
Task: Fix the swallowed-error / client-only-pagination anti-patterns across the admin panel so it is demo-reliable.
Mandatory commands: cd frontend && npm run typecheck, cd frontend && npm run lint, cd frontend && npm test
Acceptance criteria: 8
Evidence required: typecheck/lint/test output, grep showing no remaining silent catches in admin pages, list of files changed
Depends on phases: 3

## Why
Every admin page currently does `catch (error) { // Error handled silently }` and loads a single page of up to 100 rows, then filters/sorts client-side. In a live demo a failed call shows an empty table with no explanation, and filters silently lie once data exceeds one page. This phase makes loading states honest and errors visible.

## Context (verified during recon)
- Affected pages (all under `frontend/src/app/admin/`): `page.tsx` (dashboard), `users/page.tsx`, `trips/page.tsx`, `bookings/page.tsx`, `verifications/page.tsx`, `payments/page.tsx`.
- Pattern to fix: `catch (error) { // Error handled silently }` (confirmed in users + verifications; assume present in the others — grep to confirm).
- React Query IS available and used elsewhere (`@tanstack/react-query`, `QueryProvider` wraps the app; wallet + 5 other pages use it). Prefer migrating admin data loading to `useQuery`/`useMutation` for consistent loading/error/refetch — but if a page's logic is heavy, a minimal `error` state + retry button is an acceptable smaller change. Decide per-page; document which approach per page in the VERIFY block.
- `ApiError` is the typed error from `apiClient` (`frontend/src/services/api-error.ts`).
- Shared UI: `LoadingState`, `EmptyState` (`frontend/src/components/ui/`). Use `EmptyState` for the genuinely-empty case and a distinct error banner for the failure case — they must not look identical.

## Work
1. **Inventory:** `grep -rn "Error handled silently\|catch (error) {}\|catch {}" frontend/src/app/admin` and list every hit.
2. **Per page**, replace silent catch with one of:
   - (preferred) `useQuery` with `isLoading` / `isError` / `error` / `refetch`, rendering: skeleton/loading while loading, an **error banner with a Retry button** on error, `EmptyState` only when the query succeeded with zero rows.
   - (minimal) keep the imperative fetch but add an `error` state; on catch, set it and render the error banner + Retry.
3. **Mutations** (block/unblock/verify/reject/role/create): on failure surface an inline error (toast via the existing `usePushNotifications` pattern on the dashboard, or an inline message) — never swallow. On success keep the optimistic/refetch behavior.
4. **i18n:** add error-banner + retry copy to each page's existing i18n object for az/ru/en.
5. **Do NOT** redesign layouts or change the table markup beyond what's needed for the loading/error/empty states. Surgical changes only.
6. **Test:** add/extend a jest test that asserts the admin-service error path rejects with `ApiError` (or that a mapper throws on bad shape) — at least one test proving errors propagate rather than vanish. Reuse existing test patterns.

## Acceptance criteria
1. `grep -rn "Error handled silently" frontend/src/app/admin` returns ZERO matches.
2. `grep -rn "catch (error) {}\|catch {}" frontend/src/app/admin` returns ZERO empty-catch matches (every catch does something visible).
3. Each admin list page (`users`, `trips`, `bookings`, `verifications`, `payments`) renders a distinct error state with a Retry affordance when its load fails (verifiable in code: an `isError`/`error` branch exists separate from the empty branch).
4. Empty state and error state are visually distinct (different component/branch), not the same "No results" text.
5. Mutation failures surface a visible message (toast or inline), confirmed by code inspection of each handler.
6. New error/retry copy exists in az, ru, en for each touched page.
7. `cd frontend && npm run typecheck` exits 0 and `cd frontend && npm run lint` exits 0 (no new errors).
8. `cd frontend && npm test` passes, including the new error-propagation test.

## Mandatory commands (run each, surface last ~10 lines + exit code)
- cd frontend && npm run typecheck
- cd frontend && npm run lint
- cd frontend && npm test

## Evidence required
- Paste the before/after grep for "Error handled silently" (zero after).
- Per-page one-liner: which approach (useQuery vs minimal error state) was used.
- Paste typecheck/lint/test output.
- Paste the new/extended error-path test and its pass line.

SUPERGOAL_PHASE_VERIFY
SUPERGOAL_PHASE_DONE
