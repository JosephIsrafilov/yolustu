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
npm run dev   # http://localhost:3000
```

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
