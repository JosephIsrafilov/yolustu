SUPERGOAL_PHASE_START
Phase: 2 of 6 — Server-side user search/filter + admin contract
Task: Move admin user list filtering (role, status, verification, search) server-side with pagination; extend the frontend contract + API service.
Mandatory commands: cd backend && python -m pytest -q | cd backend && python -m mypy app | cd frontend && npm run typecheck
Acceptance criteria: 7
Evidence required: pytest counts; typecheck clean; new query params; filtered-count test
Depends on phases: 1

## Work
The admin users page filters/sorts a single page of 100 client-side — past 100 users the filters lie (same bug class as the wallet fix). Push filtering to the backend.

### Backend
1. **identity/repositories.py** — extend `list_all` (or add `search_users`) accepting optional `role`, `is_blocked`, `verification_status`, and `q` (matches first_name/last_name/email/phone, case-insensitive via `ilike`). Add a matching `count_filtered(...)`. Keep `order_by(created_at desc)`.
2. **admin/services.py** — `get_users` accepts the same optional filters and passes through; still `require_admin` + paginated response.
3. **admin/router.py** — `GET /admin/users` gains query params: `role`, `status` (active|blocked|all), `verification` (none|pending|approved|rejected|all), `q`. Validate enums with `Query(... , pattern=...)`; default "all"/empty. Keep page/limit.
4. **tests/test_admin_user_management.py** (extend) — seed several users; assert `role=driver` returns only drivers; `q=<name>` matches; `status=blocked` filters; `total` reflects the filtered count, not the global count.

### Frontend (contract + service only; UI in phase 3)
5. **services/contracts/admin-service.ts** — extend `getUsers` signature to accept an options object `{ page?, limit?, role?, status?, verification?, q? }` (keep it backward-compatible — all optional).
6. **services/api/api-admin-service.ts** — build the query string from those options; keep mapping via `mapApiUserToUser`.

## Acceptance criteria
1. GET /admin/users?role=driver returns only drivers; `total` = filtered count.
2. `q=` substring matches across name/email/phone, case-insensitive.
3. `status=blocked` and `verification=pending` filter correctly and compose together.
4. Invalid enum values are rejected (422) rather than silently ignored.
5. Non-admin still 403.
6. Frontend `getUsers` accepts the new optional filters and builds the correct query string (typecheck clean).
7. `pytest -q` green, `mypy app` clean, `npm run typecheck` clean.

## Mandatory commands
- `cd backend && python -m pytest -q`
- `cd backend && python -m mypy app`
- `cd frontend && npm run typecheck`

## Evidence required
- pytest last ~15 lines with counts; explicit note the filtered-total test passed.
- `npm run typecheck` clean output.
- The new GET /admin/users query-param signature.

SUPERGOAL_PHASE_VERIFY
SUPERGOAL_PHASE_DONE
