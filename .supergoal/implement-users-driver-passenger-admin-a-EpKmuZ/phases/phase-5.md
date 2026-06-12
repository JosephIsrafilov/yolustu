SUPERGOAL_PHASE_START
Phase: 5 of 6 — Demo seed + role accounts verified
Task: Guarantee a clean, repeatable set of driver/passenger/admin demo accounts the user can log into during the MVP presentation, runnable against Supabase via Docker.
Mandatory commands: cd backend && venv\Scripts\python -m pytest tests/ -q
Acceptance criteria: 7
Evidence required: pytest output, the documented login credentials table, the exact run command, a dry-run/idempotency note
Depends on phases: 1, 2

## Why
The presentation needs known accounts: at least one admin, one verified driver, one passenger, plus a pending-driver to demo the verification flow and a blocked user to demo block/unblock. A 541-line seed script already exists (`backend/scripts/seed_dev_data.py`) and creates exactly these personas with password `StrongPass1!`. This phase verifies it still matches the current schema (after phase 1's model changes), is idempotent, refuses to run against production, and is documented so the user can run it confidently.

## Context (verified during recon)
- Seed script: `backend/scripts/seed_dev_data.py`. Personas include `admin.sanan`, `driver.elvin` (verified+approved), `passenger.aysel`, `driver.pending` (verification_status=pending), `passenger.orxan` (is_blocked=True). Password constant `DEV_PASSWORD = "StrongPass1!"`.
- It has `assert_non_production()` guarding `settings.ENVIRONMENT` — must stay intact.
- DB is **Supabase (remote)**. DO NOT run destructive SQL against it as part of verification. The seed script is the user's tool to run; this phase's automated verification runs against the SQLite/pytest path only.
- Login is by **phone + password** (`LoginInput` has phone+password), NOT email. The credentials doc must list phone numbers.
- If phase 1 added columns to `User` (e.g. role audit fields), the seed `USERS` dicts and any insert must be updated to populate/accept them, or the script will break.

## Work
1. Read the current `seed_dev_data.py` end-to-end. Reconcile every `User` field it sets against the phase-1 model. If phase 1 added non-nullable columns without defaults, update the seed personas to set them.
2. Ensure idempotency: re-running must not crash on duplicate phone/email (it uses deterministic `uuid5` keys — confirm upsert/get-or-create behavior, fix if it would violate the unique constraint on a second run).
3. Confirm `assert_non_production()` covers the Supabase case: since `ENVIRONMENT=development` locally but the DB is remote Supabase, add a clear console warning (not a hard block) that it will write to whatever `DATABASE_URL` points at, and require `ENVIRONMENT` to be a safe value. Do not weaken the production block.
4. Write `backend/scripts/SEED_README.md` (or extend existing docs) with: the exact run command for Docker + Supabase, the env vars required, and a **credentials table** (role, name, phone, password, state) for every demo persona.
5. Add a lightweight pytest (`backend/tests/test_seed_personas.py`) that imports the seed module and asserts the persona list contains the required roles/states (admin present, a verified driver, a passenger, a pending driver, a blocked user) — a static assertion on the `USERS` data, NOT a DB write. This keeps verification safe for the remote DB.
6. Do not execute the seed against Supabase yourself — provide the command for the user to run.

## Acceptance criteria
1. `seed_dev_data.py` field usage matches the current `User` model (no column set that doesn't exist; no non-nullable column left unset). Verify by importing the module under pytest without error.
2. The persona set provably includes: ≥1 admin, ≥1 verified+approved driver, ≥1 passenger, ≥1 pending-verification driver, ≥1 blocked user (asserted by the new test).
3. `assert_non_production()` is intact and still raises on production-like env values (don't break it).
4. `backend/scripts/SEED_README.md` exists with the exact Docker+Supabase run command and a credentials table listing phone + password + state per persona.
5. Re-running the seed logic is idempotent by design (deterministic uuid5 keys + get-or-create) — documented and confirmed by code inspection.
6. `backend/tests/test_seed_personas.py` exists and passes.
7. `cd backend && venv\Scripts\python -m pytest tests/ -q` passes the full suite (no regressions from phases 1-2).

## Mandatory commands (run each, surface last ~10 lines + exit code)
- cd backend && venv\Scripts\python -m pytest tests/ -q

## Evidence required
- Paste the credentials table from SEED_README.md.
- Paste the new test and the pytest summary line (N passed).
- Paste the exact command the user will run against Supabase via Docker.
- One line confirming the production guard is unchanged.

SUPERGOAL_PHASE_VERIFY
SUPERGOAL_PHASE_DONE
