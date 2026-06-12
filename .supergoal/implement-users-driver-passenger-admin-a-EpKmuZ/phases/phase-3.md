SUPERGOAL_PHASE_START
Phase: 3 of 6 — Admin user-create + role UI
Task: Build the frontend admin "create user" and "edit role" flows on top of the new backend endpoints.
Mandatory commands: cd frontend && npm run typecheck, cd frontend && npm run lint, cd frontend && npm test
Acceptance criteria: 8
Evidence required: typecheck output, lint output, jest output, new test file contents, new component file list
Depends on phases: 2

## Why
The admin panel can block/unblock and approve/reject verifications, but cannot create a user or change a role. The MVP demo needs an admin who can spin up a driver/passenger/admin on the spot. Phase 2 added the backend; this phase adds the UI and the service layer to reach it.

## Context (verified during recon)
- Service contract: `frontend/src/services/contracts/admin-service.ts` — interface `AdminService`. Add methods here first (UI depends on the contract, never on the transport).
- Implementation: `frontend/src/services/api/api-admin-service.ts` — uses `apiClient` + `mapApiUserToUser` from `./mappers`.
- Admin users page: `frontend/src/app/admin/users/page.tsx` — already has search/filter/sort, expandable row, block/verify actions, full az/ru/en i18n via `USERS_I18N`.
- UI primitives available: `Button`, `Input`, `Select`, `Badge`, `Icon`, `Card`, `Pagination`, `LoadingState` under `frontend/src/components/ui/`. A modal pattern exists at `frontend/src/app/wallet/TopUpModal.tsx` (fixed overlay + Card) — follow it; there is no shared `<Modal>` primitive, so build the create/edit modal inline in a co-located component matching that pattern.
- Types: `frontend/src/types/index.ts` — `User`, `UserRole`.

## Work
1. **Service contract + impl:**
   - Add to `AdminService`: `createUser(input: AdminCreateUserInput): Promise<User>` and `updateUserRole(userId: string, role: UserRole): Promise<User>`. Define `AdminCreateUserInput` (firstName, lastName, phone, email?, password, role, city?) in the contract file.
   - Implement both in `api-admin-service.ts`: POST `/admin/users` and PATCH `/admin/users/{id}/role`. Map request camel→snake for the body, map response via `mapApiUserToUser`. Confirm the request body shape matches the Phase 2 Pydantic schema exactly (snake_case field names).
2. **Create-user modal** (`frontend/src/app/admin/users/CreateUserModal.tsx`, co-located): form with first/last name, phone, email (optional), password, role (Select: passenger/driver/admin), city (optional). Client-side validation (required fields, password min 8 to match backend). Loading + inline error state (surface `ApiError.message`, do NOT swallow). On success, close and trigger a refetch.
3. **Edit-role control:** in the expandable user-detail row of `page.tsx`, add a role `Select` + Save button (or a small "Change role" action) that calls `updateUserRole`. Inline error + success; refetch on success.
4. **Wire into page:** add a "Create user" button in the header of `admin/users/page.tsx`. Add all new copy to `USERS_I18N` for az/ru/en (modal labels, validation messages, create/edit actions). No hardcoded English.
5. **Test:** add `frontend/src/__tests__/api-admin-service.test.ts` cases (extend the existing file) asserting `createUser` POSTs to `/admin/users` with snake_case body and maps the response, and `updateUserRole` PATCHes `/admin/users/{id}/role`. Mock `apiClient` as the existing tests in that file do.

## Acceptance criteria
1. `AdminService` contract declares `createUser` and `updateUserRole` with explicit input/return types; `AdminCreateUserInput` is exported.
2. `api-admin-service.ts` implements both, POST `/admin/users` and PATCH `/admin/users/{id}/role`, with camel→snake request mapping and `mapApiUserToUser` response mapping.
3. `CreateUserModal.tsx` exists, renders the form, validates required fields + password length client-side, and shows an inline error (no silent catch, no `alert()`).
4. `admin/users/page.tsx` has a "Create user" header button that opens the modal; on success the list refetches and the new user appears.
5. The expandable detail row exposes a role change control that calls `updateUserRole` and refetches on success.
6. All new strings are in `USERS_I18N` for az, ru, and en — `grep` shows no new hardcoded user-facing English in the JSX.
7. `cd frontend && npm run typecheck` exits 0.
8. `cd frontend && npm run lint` exits 0 (no NEW errors; pre-existing warnings tolerated) AND `cd frontend && npm test` passes including the new admin-service cases.

## Mandatory commands (run each, surface last ~10 lines + exit code)
- `cd frontend && npm run typecheck`
- `cd frontend && npm run lint`
- `cd frontend && npm test`

## Evidence required
- Paste `npm run typecheck`, `npm run lint`, `npm test` output (exit codes + summary).
- Paste the new `CreateUserModal.tsx` and the contract/impl diffs.
- Paste the added jest cases and their pass lines.
- `grep -n "createUser\|updateUserRole" frontend/src/services/contracts/admin-service.ts frontend/src/services/api/api-admin-service.ts`.

SUPERGOAL_PHASE_VERIFY
SUPERGOAL_PHASE_DONE
