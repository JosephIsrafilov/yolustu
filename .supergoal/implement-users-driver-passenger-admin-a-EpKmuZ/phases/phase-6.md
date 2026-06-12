SUPERGOAL_PHASE_START
Phase: 6 of 6 — Polish & Harden
Task: Close UX, error-handling, security, and consistency gaps across the user/admin work so it holds up in a live MVP demo.
Mandatory commands: cd frontend && npm run typecheck && npm run lint && npm test ; cd backend && venv\Scripts\python -m pytest tests/ -q
Acceptance criteria: 10
Evidence required: full command outputs (frontend typecheck/lint/test + backend pytest), a before/after list of swallowed-error sites fixed, a security-review note on the new admin endpoints
Depends on phases: 1, 2, 3, 4, 5

## Why
The existing admin pages swallow every error ("// Error handled silently") and the new create-user / role-change endpoints are privileged operations. Before a presentation, the privileged paths must be authorization-tight and the UI must never fail silently. This phase is how "every aspect is perfect" gets enforced.

## Context (verified during recon)
- Swallowed errors confirmed in: `frontend/src/app/admin/users/page.tsx` (fetch, block, unblock, verify, reject — all `// Error handled silently`), `frontend/src/app/admin/verifications/page.tsx` (fetch). The dashboard uses `.catch(() => emptyish)` fallbacks.
- ESLint reports 38 pre-existing `no-unused-vars` warnings on caught error bindings — many are these swallow sites. Fixing the swallows should also reduce the warning count.
- Admin uses `confirm()` for verification approve/reject (browser-native) — acceptable but inconsistent; destructive new actions (role change, create) should use the app's modal pattern.
- New endpoints from phases 1-2 (`POST /admin/users`, `PATCH /admin/users/:id/role`) are privileged — must be covered by `get_current_admin` and the self-demotion/last-admin guards from phase 1.

## Work
1. **Error surfacing:** Replace every `// Error handled silently` in the admin users + verifications pages with real handling — surface a toast/inline error via the existing `usePushNotifications`/toast pattern, and revert optimistic UI on failure. No empty catch blocks remain in admin user-management code.
2. **Loading/empty/disabled states:** Every admin action button shows a pending state and is disabled while in flight (prevent double-submit). Lists have proper empty states (already mostly present — verify).
3. **Security review (backend):** Confirm `POST /admin/users`, `PATCH /admin/users/:id/role`, block/unblock, and verification endpoints ALL depend on `get_current_admin`. Confirm the phase-1 guards (no self-demotion, no demoting the last admin, role-value validation) are enforced and tested. Write the findings into the evidence.
4. **Consistency:** New destructive/privileged admin actions use the app modal pattern (or an explicit confirm) — no silent mutations. Role labels, badges, and i18n keys (az/ru/en) are present for every new string introduced in phases 3-4.
5. **Regression sweep:** Run the full frontend + backend suites. Fix anything the earlier phases broke. Do not introduce new ESLint errors (warnings count must not increase above the phase-0 baseline of 38; ideally lower).
6. **Cleanliness:** No leftover `console.log`, no `debugger`, no TODO/FIXME added by this run in shipped code. Grep the diff.

## Acceptance criteria
1. Zero `// Error handled silently` (or equivalent empty catch) remain in `frontend/src/app/admin/**` user-management code — verified by grep.
2. Every admin user-management action (block, unblock, verify, reject, create, role-change) surfaces a user-visible error on failure and reverts optimistic state.
3. In-flight admin actions disable their trigger button and show a pending indicator (no double-submit).
4. Backend: `POST /admin/users` and `PATCH /admin/users/:id/role` are provably behind `get_current_admin` (test asserts 403 for non-admin).
5. Phase-1 privilege guards (no self-demotion, last-admin protection, invalid-role rejection) each have a passing test.
6. All new user-facing strings from phases 3-6 have az/ru/en i18n entries (no hardcoded English in the new UI).
7. `npm run typecheck` passes clean.
8. `npm run lint` passes with 0 errors and warning count ≤ 38 (the pre-existing baseline).
9. `npm test` passes all suites.
10. `venv\Scripts\python -m pytest tests/ -q` passes the full backend suite.

## Mandatory commands (run each, surface last ~10 lines + exit code)
- cd frontend && npm run typecheck
- cd frontend && npm run lint
- cd frontend && npm test
- cd backend && venv\Scripts\python -m pytest tests/ -q

## Evidence required
- Full output of frontend typecheck, lint (show the problem count line), and test.
- Full backend pytest summary.
- Grep result proving no swallowed-error sites remain in admin user-management code.
- A short security-review paragraph: which dependency guards each new/privileged endpoint, and the three privilege-guard tests with their pass status.
- Grep result for console.log/debugger/TODO in the run's diff (expect none).

SUPERGOAL_PHASE_VERIFY
SUPERGOAL_PHASE_DONE
