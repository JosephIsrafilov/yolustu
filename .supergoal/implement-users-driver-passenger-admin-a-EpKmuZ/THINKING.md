# THINKING — Implement users (driver/passenger/admin) + admin panel for MVP

## Goals (from intake)
- All three user-creation paths work end-to-end: seed script, admin-create-user, self-register.
- Admin can manage users with real depth: create, change role, view detail, block/unblock, verify/reject.
- Polish & reliability: no swallowed errors, real loading/empty/error states, toasts on actions.
- Demo-ready for MVP presentation (Supabase DB, Docker available).

## Verified current state (recon)
- **Backend identity**: User model has all 3 roles, block, verification_status, rating, total_rides. UserRepository.create() HARDCODES role to passenger/driver (admin can't be self-registered — correct). No admin create-user. No admin change-role endpoint. update_current_user FORBIDS self-promotion to driver/admin.
- **Backend admin**: stats, users list (paginated), block/unblock, rides, bookings, verifications list + approve(→driver)/reject(→passenger), payouts, simulate_journey. RBAC via get_current_admin (role=="admin").
- **Frontend admin**: AdminLayout (tabs: panel/users/trips/bookings/payments/verifications), dashboard (KPIs/quick actions/overview/recent), users page (client-side filter/sort over ONE page of 100), verifications page, trips/bookings/payments pages.
- **Seed**: backend/scripts/seed_dev_data.py — 541 lines, idempotent (uuid5 namespace), creates driver/passenger/admin with DEV_PASSWORD, guarded against prod.

## Confirmed gaps (the real "raw" parts)
1. **No admin create-user endpoint** — admin cannot create a user of any role from the panel. Needed for "create normal users (driver,passenger,admin)".
2. **No admin change-role endpoint** — admin cannot promote/demote. Only block + verify (verify implicitly sets driver).
3. **Frontend errors swallowed** — every admin handler has `catch { // Error handled silently }`. No user feedback on failure. Reliability gap.
4. **Client-side-only filter/sort over 100 rows** — admin users page filters/sorts a single fetched page; lies past 100 users. Same bug class as the wallet fix.
5. **No user-detail view** — "View" only expands email/phone/city/created. No rides/bookings/reviews, no role editing.
6. **No create-user UI** in admin panel.
7. **Seed not verified runnable** against the environment.

## Constraints
- **Supabase is remote/shared** — NEVER run destructive SQL. Migrations: generate + review; only apply if user explicitly oks. Verify via SQLite/pytest (conftest uses in-memory SQLite).
- DDD boundaries: identity owns user CRUD; admin orchestrates via UserRepository/IdentityService. Don't bypass repository layer.
- Backend client errors via HTTPException + global envelope. mypy relaxed for app.domains.*.
- Frontend: UI talks to services/contracts → services/api, never apiClient directly from components.
- Currency AZN. i18n: az/ru/en — every new string needs all three.
- Admin role must NEVER be self-assignable (register/update). Only an existing admin or seed can mint an admin.

## Top 3 risks
1. **Privilege escalation** — a create-user or change-role endpoint that doesn't enforce admin-only, or that lets the last admin demote themselves, is a security hole. Mitigation: get_current_admin on every new endpoint; guard against self-demotion / last-admin removal; tests for 403 paths.
2. **Supabase damage** — applying an untested migration or destructive op to the shared DB. Mitigation: SQLite/pytest verification only; migration is generated + reviewed, applied only on explicit user go.
3. **Drift / regressions in a mature codebase** — admin pages are large; careless edits break existing flows. Mitigation: surgical changes, run full frontend + backend suites each phase, match existing i18n/service patterns.

## Dependencies (ordering)
- Phase 1 (backend user CRUD + role mgmt + tests) unblocks Phase 2 (service contract + api impl) which unblocks Phase 3 (admin UI: create/detail/role).
- Phase 4 (reliability: error handling, server-side filtering) depends on 2/3 existing.
- Phase 5 (seed verification + demo accounts) is mostly independent but verified last against the real flow.
- Phase 6 (polish & harden) depends on all.

## Memory hits applied
- none — no memory dir existed (fresh project for Supergoal).

## Tools/skills relied on
- No Context7/WebSearch confirmed available this session; planning against training-cutoff knowledge of FastAPI/Next.js (both well within cutoff). Subagent dispatch hit transient 503 — recon done directly.

## Best practices applied
- Server-side filtering/pagination for admin lists (don't repeat the wallet 50-row bug).
- Idempotent, env-guarded seeding.
- Least-privilege RBAC; explicit tests for forbidden transitions.
- Consistent error envelope + surfaced frontend errors (toasts), no silent catches.
