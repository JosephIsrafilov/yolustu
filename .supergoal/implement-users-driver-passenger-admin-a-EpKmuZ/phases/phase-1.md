SUPERGOAL_PHASE_START
Phase: 1 of 6 — Backend admin user CRUD + role management
Task: Add admin endpoints to create users of any role and change a user's role, with RBAC + guards.
Mandatory commands: cd backend && python -m pytest -q | cd backend && python -m mypy app
Acceptance criteria: 6
Evidence required: pytest counts; new endpoint signatures; 403 non-admin test; last-admin guard test
Depends on phases: none

## Work
The identity domain has block/unblock and verification approve/reject, but NO way for an admin to create a user or change a role. `UserRepository.create` hardcodes role to passenger/driver. Add admin-only capabilities.

1. **schemas.py** — add:
   - `AdminUserCreate(UserBase)` with `password: str = Field(min_length=8, max_length=72)` and `role` constrained to {passenger,driver,admin}.
   - `AdminRoleUpdate(BaseModel)` with `role: str` (validated against the 3 roles).
2. **repositories.py** — add `create_by_admin(user_in, hashed_password)` that honors any of the 3 roles (do NOT reuse the passenger/driver-only `create`), and `set_role(user, role)`. Add `count_admins()` for the last-admin guard.
3. **admin/services.py** — add:
   - `create_user(current_user, payload)` — `require_admin`; duplicate phone/email -> 400; create via `create_by_admin`; return user.
   - `change_user_role(current_user, user_id, role)` — `require_admin`; 404 if missing; invalid role -> 400; if target is currently admin and new role != admin and `count_admins() <= 1` -> 400 "Cannot demote the last admin".
4. **admin/router.py** — `POST /admin/users` (response_model=UserResponse) and `PATCH /admin/users/{user_id}/role` (response_model=UserResponse), both `Depends(get_current_admin)`.
5. **tests/test_admin_user_management.py** — cover: admin creates each role; duplicate phone->400; non-admin->403; role change works; last-admin demotion->400.

Follow existing patterns (service raises HTTPException; router thin; repo does DB). Keep core typed.

## Acceptance criteria
1. POST /admin/users creates a user with any of the 3 roles, hashed password, returns UserResponse (201/200).
2. Duplicate phone or email on create -> 400.
3. Non-admin caller on either endpoint -> 403.
4. PATCH /admin/users/{id}/role changes the role and persists.
5. Demoting the last remaining admin -> 400 with a clear message.
6. `python -m pytest -q` fully green incl. the new test file; `python -m mypy app` clean.

## Mandatory commands
- `cd backend && python -m pytest -q`
- `cd backend && python -m mypy app`

## Evidence required
- Last ~15 lines of pytest with pass counts.
- The two new endpoint function signatures.
- Explicit mention that the 403-non-admin and last-admin-guard tests passed.
