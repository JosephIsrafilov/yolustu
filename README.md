# Yolüstü — Azerbaijan Carpooling Platform 🚗

**Yolüstü** is a modern car‑pooling prototype tailored for Azerbaijan. It includes:
- **Real‑time chat and notifications** via WebSockets
- **AI Smart Pricing** powered by NVIDIA NIM (LLaMA‑3.1) that suggests optimal seat prices based on route and time
- Full Stripe integration for secure sandbox payments
- Secure JWT authentication with simulated SMS OTP verification
- Interactive Leaflet Maps on OpenStreetMap tiles (no Google Maps API key required)

---

## Project Structure

```text
yolustu/
├── backend/               # FastAPI Python backend
│   ├── alembic/           # DB migrations
│   ├── app/
│   │   ├── core/          # Config, database, security, WebSockets event loop
│   │   ├── domains/       # Feature domains (auth, rides, bookings, engagement, payments, ai)
│   │   │   ├── identity/  # User profile & authentication
│   │   │   ├── trips/     # Rides & Vehicles CRUD, PostGIS geo-queries
│   │   │   ├── bookings/  # Seat reservations
│   │   │   ├── engagement/# Chat messages & ratings
│   │   │   ├── payments/  # Stripe sessions & Webhooks
│   │   │   └── ai/        # AI pricing suggestion
│   │   └── main.py        # FastAPI entry point & lifespan manager
│   ├── requirements.txt   # Python deps
│   └── .env               # Local secrets (NVIDIA_API_KEY, STRIPE_SECRET_KEY, DB URL)
│
├── frontend/              # Next.js 16 (App Router) with TypeScript
│   ├── public/            # Static assets
│   └── src/
│       ├── app/
│       │   ├── driver/
│       │   │   └── create-trip/page.tsx   # Ride‑creation wizard with Leaflet Map & AI Smart Pricing
│       │   └── (dashboard)/rides/create/page.tsx
│       ├── components/    # UI primitives & helpers (TimePicker, CitySelect, Icon, Map)
│       ├── services/      # Axios wrappers for API and AI services
│       └── lib/           # Constants, utils (AZ_CITIES, mapping configs)
│
├── docs/                  # Project roadmap, database schema, API contracts, acceptance criteria
├── docker-compose.yml     # PostgreSQL + PostGIS & Redis container configurations
└── README.md              # ↗️ This file (updated)
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
| **Payments** | Stripe Checkout & Webhooks |

---

## Setup & Development

### 1️⃣ Infrastructure (PostgreSQL & Redis)
```bash
docker-compose up -d   # starts db and redis containers
```

### 2️⃣ Backend (FastAPI)
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\Activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
# Copy .env.example → .env and configure keys (NVIDIA_API_KEY, STRIPE_SECRET_KEY, DB URL)
alembic upgrade head   # apply migrations
uvicorn main:app --reload   # API at http://localhost:8000
```
Visit `http://localhost:8000/docs` for the Swagger UI.

### 3️⃣ Frontend (Next.js)
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

### 4️⃣ Frontend API Mode (Sprint 1 Auth/Profile)
Create `frontend/.env.local`:
```bash
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

Current auth/profile behavior in API mode:
- `POST /auth/register` returns `accessToken`, `refreshToken`, `user`; frontend starts session immediately.
- `POST /auth/login` returns `accessToken`, `refreshToken`, `user`.
- `POST /auth/request-otp` returns `{ message, phone }`.
- `POST /auth/verify-otp` returns `{ message: "Account verified successfully" }` and does not return tokens.
- `POST /auth/refresh` receives `{ refreshToken }` and returns rotated `accessToken`, `refreshToken`, `user`.
- Frontend stores tokens in `localStorage` keys: `token` and `refresh_token`.
- `GET /users/me` is used on app boot to restore session after reload.
- `PUT /users/me` powers profile/profile-setup updates.

Sprint 2 (current) in API mode:
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
