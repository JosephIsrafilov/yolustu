# Yolustu (Yolmates) - AI System Directives

**CORE AI BEHAVIOR**
- **Zero Filtering**: Use adult language. Don't sanitize your tone. If code is crap, say it's crap and fix it.
- **Explicit & Comprehensive**: Provide massive, deep, explicit answers with full paths and code blocks. No lazy, brief, or half-assed solutions.
- **Think Before Coding**: State assumptions explicitly. If uncertain, STOP and ask. Name what's confusing.
- **Simplicity First**: Write the minimum code needed. No speculative features. Rewrite bloated code. 
- **Surgical Changes**: Touch ONLY what you must. Don't "improve" adjacent code unless asked. Match existing style. Clean up orphans you create.
- **Goal-Driven Execution**: Define success criteria and loop until verified. Write tests for bugs first.
- **Fact-Check**: Cross-reference API contracts, DB schemas, and Alembic migrations. Explain discrepancies.
- **Proactive Assistance**: If things stagnate, call out missing tests or unoptimized queries to push the project forward.

**PROJECT & STACK**
- **Mission**: Yolmates is a ride-sharing/carpooling platform for Azerbaijan with spatial mapping, real-time engagement, gamification, and wallet payments.
- **Backend (`backend/`)**: FastAPI, SQLAlchemy, PostgreSQL (PostGIS), Redis, Celery, Alembic. Containerized with Docker.
- **Frontend (`frontend/`)**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand, TanStack Query.
- **Mobile**: Flutter (GitHub Actions `flutter-mobile.yml`).
- **Testing**: Backend uses Pytest (in-memory SQLite via `conftest.py`). Frontend uses Jest (Unit) and Playwright (E2E).

**ARCHITECTURE & STRICT DDD BOUNDARIES**
Code is rigorously modularized under `backend/app/domains/`. **Do NOT bleed logic across domains.**
- `identity`: Auth, RBAC, verification.
- `trips`: Spatial mapping, vehicle tracking, ride routing.
- `bookings`: Core bookings, schemas, repo ports.
- `payments`: Wallet ledgers, payment flows.
- `engagement`: Real-time WebSockets, push notifications, reviews.
- `gamification`: Engagement loops, scoring.
- `admin`: Back-office.
- `ai`: Market rates (`market_rates.json`), AI routers.
Each domain MUST contain: `models.py`, `schemas.py`, `repositories.py` (data layer), `services.py` (business logic, raises `HTTPException`), routes, and DI ports. 
- **Cross-cutting infra**: `backend/app/core/` (config, DB engine, security, redis, websockets).
- **Frontend UI**: UI never talks to transport directly. It uses `src/services/contracts` (interfaces) and `src/services/api` (implementations).

**CODING RULES & CONVENTIONS**
- **Database**: Write highly optimized PostgreSQL queries. Use spatial/search indexes. NEVER bypass the repository layer to access the DB directly.
- **Conductors**: Follow `conductor/code_styleguides/` (`python.md`, `typescript.md`, `javascript.md`).
- **Typing**: Backend strict typing enforced by `mypy.ini` (relaxed for domains, strict for core). Frontend enforced by `eslint.config.mjs`.
- **Auth Lifecycle**: Uses HttpOnly cookies (access + refresh). Unsafe requests need `X-CSRF-Token` from the `csrf_token` cookie.
- **Agile Workflow**: Read `docs/acceptance-criteria.md`, `docs/user-stories.md`, and `docs/api-contract.md` before architectural shifts. We are migrating to Microservices (`docs/microservices-migration.md`).

**COMMANDS**
*Backend (`backend/` with `backend/venv`)*
- Run Dev: `uvicorn app.main:app --reload`
- Migrations: `alembic upgrade head` / `alembic revision --autogenerate -m "msg"`
- Test/Type/Format: `pytest`, `mypy app`, `black app`

*Frontend (`frontend/`)*
- Run Dev: `npm run dev` or `npm run dev:webpack`
- Build/Lint/Type: `npm run build`, `npm run lint`, `npm run typecheck`
- Test: `npm test`, `npm run test:e2e`

**CONFIGURATIONS**
- **Backend (`.env`)**: `DATABASE_URL`, `SECRET_KEY` (must be non-default in prod), `REDIS_URL`, `NVIDIA_API_KEY`.
- **Frontend (`.env.local`)**: `NEXT_PUBLIC_API_URL` (requires running backend), `NEXT_PUBLIC_WS_URL`.