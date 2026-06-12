# ROADMAP — Implement users (driver/passenger/admin) + full admin panel

**Goal:** Make all three user roles real and admin-manageable for the MVP demo: admin can create users of any role, change roles, view user detail, and every action gives feedback. Close the reliability gaps (swallowed errors, client-only filtering). Verify the three creation paths (seed, admin-create, self-register) end-to-end.

**Baseline ref:** 46fc04bd0abae8f1f60ffebec2075f0979d285b1

**Environment:** Backend = FastAPI + SQLAlchemy; tests = in-memory SQLite (pytest). Frontend = Next.js 16 / React 19 (npm). DB = Supabase (REMOTE — no destructive ops; migrations reviewed, applied only on explicit user go). Docker available.

**Stack:** backend `pytest` / `mypy app` / `black app`; frontend `npm run typecheck` / `npm run lint` / `npm test`.

---

## Phase 1 — Backend: admin user CRUD + role management
**Why:** Admin currently cannot create a user or change a role; these are the core missing capabilities.
**Deliverables:**
- `backend/app/domains/identity/schemas.py` — `AdminUserCreate`, `AdminRoleUpdate` schemas.
- `backend/app/domains/identity/repositories.py` — `create_by_admin` (any role), `set_role`.
- `backend/app/domains/admin/services.py` — `create_user`, `change_user_role` with RBAC + guards (no last-admin demotion, valid roles only).
- `backend/app/domains/admin/router.py` — `POST /admin/users`, `PATCH /admin/users/{id}/role`.
- `backend/tests/test_admin_user_management.py` — new tests.
**Acceptance criteria:**
- `POST /admin/users` creates a user with role in {passenger,driver,admin}, hashed password, returns `UserResponse`.
- Duplicate phone/email → 400; non-admin caller → 403; invalid role → 400/422.
- `PATCH /admin/users/{id}/role` changes role; demoting the last remaining admin → 400.
- `pytest backend/tests/test_admin_user_management.py` passes; full `pytest` green.
- `mypy app` clean on touched core files (domains relaxed).
**Mandatory commands:** `cd backend && python -m pytest -q` · `cd backend && python -m mypy app`
**Evidence required:** test output (counts), the new endpoint signatures, a 403 + last-admin-guard test passing.
**Depends on phases:** none

## Phase 2 — Frontend service layer for user management
**Why:** UI must reach the new endpoints through the contract/api seam, never raw apiClient.
**Deliverables:**
- `frontend/src/services/contracts/admin-service.ts` — `createUser`, `changeUserRole`, (and `getUsers` filter params).
- `frontend/src/services/api/api-admin-service.ts` — implementations.
- `frontend/src/__tests__/api-admin-service.test.ts` — extended coverage.
**Acceptance criteria:**
- Contract additions are typed; `createUser`/`changeUserRole` map API↔domain via existing mappers.
- `getUsers` accepts optional `{ role, status, verification, search }` and forwards as query params.
- `npm run typecheck` clean; `npm test` green incl. extended admin-service test.
**Mandatory commands:** `cd frontend && npm run typecheck` · `cd frontend && npm test`
**Evidence required:** contract diff, api impl diff, test names + pass output.
**Depends on phases:** 1

## Phase 3 — Admin UI: create user, user detail, role editing
**Why:** The visible admin-panel depth the demo needs.
**Deliverables:**
- `frontend/src/app/admin/users/CreateUserModal.tsx` (new).
- `frontend/src/app/admin/users/page.tsx` — "Create user" button + modal; role-change control in row/detail; richer detail panel.
- i18n (az/ru/en) for all new strings.
**Acceptance criteria:**
- "Create user" opens a modal with role select (passenger/driver/admin), required fields validated client-side; success refreshes list + toast.
- Admin can change a user's role from the UI; reflects after refresh.
- All new copy exists in az/ru/en (no hard-coded English).
- `npm run typecheck` + `npm run lint` clean (no new warnings); `npm test` green.
**Mandatory commands:** `cd frontend && npm run typecheck` · `cd frontend && npm run lint` · `cd frontend && npm test`
**Evidence required:** modal component, page diff for create/role, grep showing 3-language keys for new strings.
**Depends on phases:** 2

## Phase 4 — Reliability: surface errors + server-side filtering
**Why:** Silent catches and client-only filtering are correctness/UX bugs across admin pages.
**Deliverables:**
- `backend/app/domains/admin/services.py` + repo + router — `get_users` accepts `role`/`status`/`verification`/`search` filters, applied in SQL.
- `frontend/src/app/admin/users/page.tsx` + `verifications/page.tsx` — replace `// Error handled silently` with toast/error surfacing; wire server-side filters.
- Tests for filtered user listing.
**Acceptance criteria:**
- `GET /admin/users?role=driver&search=...` filters in the query (verified by test), not just client-side.
- No remaining `// Error handled silently` in admin pages (grep returns zero).
- Failed admin actions show a visible error/toast.
- Full backend `pytest` + frontend `typecheck`/`lint`/`test` all green.
**Mandatory commands:** `cd backend && python -m pytest -q` · `cd frontend && npm run typecheck` · `cd frontend && npm run lint` · `cd frontend && npm test`
**Evidence required:** filter test passing, grep proof of zero silent catches, error-surfacing diff.
**Depends on phases:** 3

## Phase 5 — Seed & demo accounts verified
**Why:** The presentation needs known-good driver/passenger/admin logins that actually work.
**Deliverables:**
- `backend/scripts/seed_dev_data.py` — confirmed/extended to guarantee one clean login per role; documented credentials.
- A short `docs` note or printed summary of demo credentials (no secrets committed beyond the existing dev password convention).
**Acceptance criteria:**
- Seed script runs against a SQLite/throwaway DB in verification without error (dry path), creating ≥1 driver, ≥1 passenger, ≥1 admin.
- Idempotent: running twice doesn't duplicate (uuid5 keys).
- Demo credentials printed in evidence; prod-guard intact.
- Backend `pytest` still green.
**Mandatory commands:** `cd backend && python -m pytest -q`
**Evidence required:** seed run output (created/updated counts) against a non-prod DB, the per-role demo credentials, prod-guard confirmation. (Supabase NOT targeted unless user explicitly approves.)
**Depends on phases:** 1

## Phase 6 — Polish & Harden
**Why:** Enforce "every aspect is perfect" — security, edge cases, states, full-suite green.
**Deliverables:**
- Security pass on the new endpoints (RBAC, self-demotion, last-admin, input validation).
- Loading/empty/error states verified on create-user + user list.
- Final aggregated test/lint/typecheck run.
**Acceptance criteria:**
- Every new endpoint enforces `get_current_admin`; verified by tests returning 403 for non-admin.
- Last-admin demotion and self-demotion guarded; tested.
- No new lint warnings vs baseline; `mypy app` clean on core.
- Full `pytest` + `npm run typecheck` + `npm run lint` + `npm test` all green; counts surfaced.
**Mandatory commands:** `cd backend && python -m pytest -q` · `cd backend && python -m mypy app` · `cd frontend && npm run typecheck` · `cd frontend && npm run lint` · `cd frontend && npm test`
**Evidence required:** aggregated command exit codes + last lines, RBAC/guard test names, lint warning count vs baseline (38).
**Depends on phases:** 1,2,3,4,5
