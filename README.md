# Yolüstü — Azerbaijan Carpooling Platform 🚗

**Yolüstü** is a modern car‑pooling prototype tailored for Azerbaijan. It now includes:
- **Real‑time push notifications** via WebSockets
- **AI Smart Pricing** powered by NVIDIA NIM (LLaMA‑3.1) that suggests optimal seat prices based on route and time
- Full Stripe integration for secure payments
- Secure JWT authentication for drivers and passengers

---

## Project Structure

```text
yolustu/
├── backend/               # FastAPI Python backend
│   ├── alembic/           # DB migrations
│   ├── app/
│   │   ├── core/          # Config, security, env vars
│   │   ├── domains/       # Feature routers (auth, rides, ai, …)
│   │   │   └── ai/        # AI pricing endpoint
│   │   └── main.py        # FastAPI entry point
│   ├── requirements.txt   # Python deps (incl. openai)
│   └── .env               # Local secrets (NVIDIA_API_KEY, DB URL)
│
├── frontend/              # Next.js 16 (App Router) with TypeScript
│   ├── public/            # Static assets
│   └── src/
│       ├── app/
│       │   ├── driver/
│       │   │   └── create-trip/page.tsx   # Ride‑creation wizard with AI button
│       │   └── (dashboard)/rides/create/page.tsx  # Legacy UI (still works)
│       ├── components/    # UI primitives (Card, Button, Input, …)
│       ├── services/
│       │   ├── api/api-client.ts            # Axios wrapper
│       │   └── api/api-ai-service.ts        # Calls /ai/pricing-suggestion
│       └── lib/            # Constants, utils (AZ_CITIES, routes, env)
│
├── docs/                  # Additional documentation
├── docker-compose.yml     # PostgreSQL + Redis containers
└── README.md              # ↗️ This file (updated)
```

---

## Technology Stack

| Area | Implementation |
|---|---|
| **Frontend Framework** | Next.js 16 App Router (TypeScript) |
| **Frontend Styling** | Tailwind CSS v4 |
| **Frontend State** | Zustand |
| **Backend Framework** | FastAPI (Python 3.11) |
| **AI Integration** | NVIDIA NIM (`meta/llama-3.1-8b-instruct`) via `openai` SDK |
| **Database** | PostgreSQL (via Docker) |
| **Cache/Queue** | Redis (via Docker) |
| **Realtime** | WebSockets (FastAPI + React hook) |
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
# Copy .env.example → .env and add your NVIDIA_API_KEY (free on build.nvidia.com)
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

## AI Smart Pricing (NVIDIA NIM)

### Backend Endpoint
- **Path:** `POST /api/v1/ai/pricing-suggestion`
- **Request:** `{ "origin": "Bakı", "destination": "Gəncə", "departure_time": "12:00" }`
- **Response:** `{ "suggested_price": 15, "reasoning": "Friday afternoon rides from Baku to Ganja have high demand..." }`

### Frontend UI
- Integrates seamlessly in Step 2 of the Trip Creation flow (`frontend/src/app/driver/create-trip/page.tsx`).
- Offers a simple button to fetch pricing recommendations and auto-fills the price per seat while showing AI-driven reasoning context.

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
