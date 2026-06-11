# Yolmates - Azerbaijan Carpooling Platform

**Yolmates** is a modern car-pooling prototype tailored for Azerbaijan. It includes:
- **Real-time chat and notifications** via WebSockets
- **AI Smart Pricing** powered by NVIDIA NIM (LLaMA-3.1) that suggests optimal seat prices based on route and time
- Payment provider abstraction with mock checkout, wallet ledger, and refund flow
- Secure JWT authentication with simulated SMS OTP verification
- Interactive Leaflet Maps on OpenStreetMap tiles (no Google Maps API key required)

---

## Project Structure

```text
yolustu/
|-- backend/               # FastAPI Python backend
|   |-- alembic/           # DB migrations
|   |-- app/
|   |   |-- core/          # Config, database, security, WebSockets event loop
|   |   |-- domains/       # Feature domains (auth, rides, bookings, engagement, payments, ai)
|   |   |   |-- identity/  # User profile & authentication
|   |   |   |-- trips/     # Rides & Vehicles CRUD, PostGIS geo-queries
|   |   |   |-- bookings/  # Seat reservations
|   |   |   |-- engagement/# Chat messages & ratings
|   |   |   |-- payments/  # payment sessions, webhooks, wallet ledger
|   |   |   `-- ai/        # AI pricing suggestion
|   |   `-- main.py        # FastAPI entry point & lifespan manager
|   |-- requirements.txt   # Python deps
|   `-- .env               # Local secrets (NVIDIA_API_KEY, STRIPE_SECRET_KEY, DB URL)
|
|-- frontend/              # Next.js 16 (App Router) with TypeScript
|   |-- public/            # Static assets
|   `-- src/
|       |-- app/
|       |   |-- driver/
|       |   |   `-- create-trip/page.tsx   # Ride-creation wizard with Leaflet Map & AI Smart Pricing
|       |   `-- (dashboard)/rides/create/page.tsx
|       |-- components/    # UI primitives & helpers (TimePicker, CitySelect, Icon, Map)
|       |-- services/      # Axios wrappers for API and AI services
|       `-- lib/           # Constants, utils (AZ_CITIES, mapping configs)
|
|-- docs/                  # Project roadmap, database schema, API contracts, acceptance criteria
|-- docker-compose.yml     # PostgreSQL + PostGIS & Redis container configurations
`-- README.md              # This file (updated)
```

---

## Technology Stack

| Area | Implementation |
|---|---|
| **Frontend Framework** | Next.js 16 App Router (TypeScript) |
| **Frontend Styling** | Tailwind CSS v4 |
| **Frontend State** | Zustand |
| **Interactive Maps** | Leaflet.js (React-Leaflet) on OpenStreetMap |
| **Backend Framework** | FastAPI (Python 3.11) |
| **AI Integration** | NVIDIA NIM (`meta/llama-3.1-8b-instruct`) via `openai` SDK |
| **Database** | PostgreSQL + PostGIS (via Docker) |
| **Cache/Queue** | Redis (via Docker) |
| **Realtime Layers** | WebSockets (FastAPI + React hooks) |
| **Payments** | Mock provider abstraction for dev/test, Payriff/Kapital stubs, wallet ledger |

---

## Setup & Development

### 1) Infrastructure (PostgreSQL & Redis)
```bash
docker-compose up -d   # starts db and redis containers
```

### 2) Backend (FastAPI)
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\Activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
# Copy backend/.env.example -> backend/.env and configure required keys
alembic upgrade head   # apply migrations
uvicorn app.main:app --reload   # API at http://localhost:8000
```
Visit `http://localhost:8000/docs` for the Swagger UI.

### 3) Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev:lowmem   # http://localhost:3000 (recommended on Windows)
```

`npm run dev` uses Turbopack and can fail with `JavaScript heap out of memory` on some Windows machines.

If frontend becomes slow or hits OOM on Windows:

```powershell
taskkill /F /IM node.exe
Remove-Item -Recurse -Force .next
npm run dev:lowmem
```

### 4) Frontend API Configuration
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

For a local port override (e.g., if port `8000` is already in use and backend is running on port `8010`), create or modify `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8010/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8010
```

Do not commit `.env.local`.

Current auth/profile behavior:
- `POST /auth/register` returns `accessToken`, `refreshToken`, `user`; frontend starts session immediately.
- `POST /auth/login` returns `accessToken`, `refreshToken`, `user`.
- `POST /auth/request-otp` returns `{ message, phone }`.
- `POST /auth/verify-otp` returns `{ message: "Account verified successfully" }` and does not return tokens.
- `POST /auth/refresh` uses `refresh_token` HttpOnly cookie and returns rotated `accessToken`, `refreshToken`, `user`.
- Frontend treats `localStorage` auth keys as legacy only and clears them; session restore relies on cookies plus `GET /users/me`.
- `GET /users/me` is used on app boot to restore session after reload.
- `PUT /users/me` powers profile/profile-setup updates.

Sprint 2 (current):
- Driver creates ride via `POST /rides/`.
- Passenger searches rides via `GET /rides/search` and opens details via `GET /rides/{id}`.
- Passenger creates booking request via `POST /bookings/`.
- Driver sees requests via `GET /bookings/requests` and confirms/rejects via `POST /bookings/{id}/confirm|reject`.
- Passenger cancels via `POST /bookings/{id}/cancel`.
- Seat accounting is backend-driven (`pending` does not decrement, `accepted` decrements, cancel of accepted/paid restores seats before trip completion).

---

## Local development quick start

Run everything with one command from the repo root:

```powershell
.\start-dev.ps1
```

Or double-click:

```text
start-dev.bat
```

What it does:
- starts Docker infrastructure (`db`, `redis`)
- runs backend migrations (`alembic upgrade head`)
- starts backend dev server (`uvicorn app.main:app --reload`)
- ensures frontend API-mode env keys exist in `frontend/.env.local`
- installs frontend dependencies if `frontend/node_modules` is missing
- starts frontend dev server (`npm run dev:lowmem`, webpack mode by default)

Useful options:
- `-FrontendBundler webpack|turbo` (default: `webpack`)
- `-NoFrontend`
- `-FrontendOnly`
- `-BackendOnly`
- `-InfraOnly`
- `-Full`

URLs:
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Frontend: `http://localhost:3000`

Optional seed:

```powershell
.\start-dev.ps1 -Seed
```

Stop:
- close the backend/frontend PowerShell windows started by the script
- stop infra when needed: `docker compose down`

---

## Local Cleanup

Generated folders can become large during normal backend, frontend, and Flutter work. Use targeted cleanup only; do not use `git clean -fdx` because it can remove local env files and other untracked work.

Safe PowerShell cleanup from repo root:

```powershell
Remove-Item -Recurse -Force frontend/.next, frontend/.next-build-*, frontend/playwright-report, frontend/test-results, frontend/coverage -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force backend/.pytest_cache, backend/.mypy_cache, backend/.ruff_cache, backend/htmlcov -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force mobile/yolmates_app/build, mobile/yolmates_app/.dart_tool -ErrorAction SilentlyContinue
Get-ChildItem -Recurse -Directory -Filter __pycache__ | Remove-Item -Recurse -Force
Remove-Item -Force *.log, tmp_backend_*.log, tmp_frontend_*.log -ErrorAction SilentlyContinue
```

These commands target generated caches, reports, logs, and build output only. They intentionally do not remove `.env`, `.env.local`, source files, migrations, committed platform files, or Flutter plugin registrant files.

---

## Demo Users

To populate your local PostgreSQL database with demo data (users, vehicles, trips), run:
```bash
cd backend
python seed.py
```
This will create standard test users with the password `password123` and `is_verified=True`:
- Elvin (Driver): `+994501234567`
- Murad (Driver): `+994703456789`
- Kamran (Driver): `+994775678901`
- Aysel (Passenger): `+994552345678`
- Sanan (Admin): `+994708901234`

---

## Technical Improvements & React 19 Compatibility

### 1. React 19 Strict Typing
- **CitySelect.tsx**: Upgraded to handle `readonly string[]` arrays for Azerbaijan cities, preventing client-side array mutations.
- **TimePicker.tsx**: Upgraded to typed `RefObject` interfaces and refactored state management to utilize `useRef` to store debouncing timer IDs, avoiding state mutations and duplicated API requests on re-renders.

### 2. Leaflet Overlay & Map Fixes
- Added `z-index` layering styles (`z-index: 10` for Leaflet container, `z-[1000]` for layout dropdowns) to prevent the map container from covering route inputs.
- Integrated map click handlers to automatically synchronize coordinates with "Meeting Point" and "Dropoff Point" inputs.

### 3. FastAPI Lifecycle Stability
- Replaced legacy startup/shutdown event handlers with the `lifespan` context manager in `backend/app/main.py`. This correctly binds the WebSocket manager's event loop in the context of the running asyncio loop, ensuring real-time messages are dispatched concurrently without hanging.

---

## Supabase Postgres Setup (Managed DB)

The project keeps backend-owned auth (HttpOnly cookies + CSRF + JWT + Redis) and uses Supabase only as managed Postgres.

### 1) Create Supabase project
- Create project in Supabase dashboard.
- Set a strong DB password.
- Enable PostGIS in SQL editor:

```sql
create extension if not exists postgis;
```

### 2) Configure connection strings
- `DATABASE_URL`: pooled runtime connection for backend traffic.
- `DIRECT_DATABASE_URL`: direct connection for Alembic migrations.
- Both URLs should include `sslmode=require`.

Example placeholders:

```bash
DATABASE_URL=postgresql://<pooled-user>:<password>@<pooled-host>:<pooled-port>/postgres?sslmode=require
DIRECT_DATABASE_URL=postgresql://postgres:<password>@<direct-host>:5432/postgres?sslmode=require
```

### 3) Run migrations

```bash
cd backend
python -m alembic upgrade head
```

### 4) Local fallback (Docker PostGIS + Redis)
- For local-only development, keep using `docker compose up -d` (db + redis).
- With no external `DATABASE_URL`, compose defaults to local PostGIS (`db` service).
- With external `DATABASE_URL` set, backend can target remote DB while local services remain available.

### 5) CI/CD guidance
- PR checks should not depend on production Supabase secrets.
- Production migration/deploy should be controlled (manual/protected environment).
- Use direct migration URL only for migration jobs.

Recommended GitHub Secrets (deploy environments):
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `SECRET_KEY`
- `REDIS_URL` (if remote Redis is used)
- `FRONTEND_URL`
- `BACKEND_URL`
- `PAYMENT_PROVIDER`
- `PAYRIFF_MERCHANT_ID` / `PAYRIFF_SECRET_KEY` or Kapital credentials when real acquiring is enabled

### 6) Security notes
- Do not commit real secrets to git.
- `SUPABASE_SERVICE_ROLE_KEY` is not required when Supabase is used only as Postgres.
- Never expose service-role secrets to frontend bundles.
- Frontend should keep using backend API (no direct frontend-to-Supabase DB integration in current architecture).

---

## Mobile app foundation

- Read the readiness audit and integration contract notes in [docs/mobile-app-readiness.md](docs/mobile-app-readiness.md).
- Flutter scaffold now lives in `mobile/yolmates_app/`.
- Current mobile status: foundation is real, but real auth/search/booking flows are still being aligned with backend contracts.

---

## Running Tests & Linting

**Backend**
```bash
pytest          # unit tests
```

**Frontend**
```bash
npm run lint    # ESLint
npm run typecheck   # TypeScript compiler check
```

---

## License

MIT
