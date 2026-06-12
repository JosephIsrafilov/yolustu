# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
Guidance for working in this repository.

## Project

Yolmates ("yolustu") — a ride-sharing / carpooling platform for Azerbaijan. Monorepo with a FastAPI backend and a Next.js frontend.

- `backend/` — FastAPI + SQLAlchemy + PostgreSQL (PostGIS via GeoAlchemy2), Redis, Alembic.
- `frontend/` — Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand, TanStack Query.

## Commands

### Backend (run from `backend/`)

The backend uses a virtualenv at `backend/venv`. Activate it or call its executables directly.

- Run dev server: `uvicorn app.main:app --reload`
- Run tests: `pytest` (tests use an in-memory SQLite DB, see `tests/conftest.py`)
- Run one test: `pytest tests/test_auth.py`
- Type check: `mypy app`
- Format: `black app`
- DB migrations: `alembic upgrade head` / `alembic revision --autogenerate -m "msg"`

### Frontend (run from `frontend/`)

- Dev server: `npm run dev` (Turbopack) or `npm run dev:webpack`
- Build: `npm run build`
- Lint: `npm run lint`
- Type check: `npm run typecheck`
- Unit tests: `npm test` (Jest)
- E2E tests: `npm run test:e2e` (Playwright)

## Architecture

### Backend — domain-driven

Code is organized by domain under `backend/app/domains/`. Each domain typically contains:

- `models.py` — SQLAlchemy ORM models
- `schemas.py` — Pydantic request/response models
- `repositories.py` — data access layer
- `services.py` — business logic (raises `HTTPException` for client errors)
- `*_router.py` / `router.py` — FastAPI routes
- `ports.py` / `dependencies.py` — DI interfaces and FastAPI dependencies

Domains: `identity` (auth/users), `trips` (rides/vehicles), `bookings`, `engagement` (reviews/messages/chats/notifications), `payments` (incl. wallet), `admin`, `ai`, `gamification`.

Cross-cutting infra is in `backend/app/core/`: `config.py` (Pydantic settings), `database.py` (engine/session), `security.py` (JWT/passwords), `redis.py`, `cache.py`, `csrf.py`, `limiter.py` (slowapi), `websocket.py`, `scheduler.py` (APScheduler), `email.py`, `notifications.py`.

- Entry point: `app/main.py`. All routes are mounted under `/api/v1`.
- Errors return a consistent envelope: `{ "success": false, "error": { code, message, timestamp } }` (see exception handlers in `main.py`).
- A CSRF middleware validates unsafe cookie-auth requests against the `X-CSRF-Token` header.
- `models.py` at `app/domains/` level aggregates models; migrations live in `backend/alembic/versions/`.

### Frontend — service abstraction

UI/store code never talks to transport directly. It goes through a service layer (`frontend/src/services/`, see its `README.md`):

- `services/contracts/*` — TypeScript interfaces (the stable surface UI depends on).
- `services/api/*` — concrete implementations calling the backend via `apiClient`.
- `services/index.ts` — binds each contract to its API implementation.

App Router pages are in `src/app/`, shared components in `src/components/`, global state in `src/store/` (Zustand slices), hooks in `src/hooks/`, types in `src/types/`.

### Auth lifecycle

- `register`/`login` rely on HttpOnly auth cookies (access + refresh).
- Expired access token triggers `/auth/refresh` using the refresh cookie.
- Unsafe cookie-auth requests send `X-CSRF-Token` from the readable `csrf_token` cookie.
- Refresh failure clears the session and redirects to `/auth/login`.

## Conventions

- Backend client errors: raise `HTTPException` from the service layer; let the global handlers format the response.
- Keep frontend UI decoupled from transport — add/extend a contract in `services/contracts` and implement it in `services/api`, don't call `fetch`/`apiClient` from components.
- Currency is AZN; platform fee is configurable (`PLATFORM_FEE_PERCENT`).
- Backend type checking is relaxed for `app.domains.*` (see `mypy.ini`) but enforced elsewhere — keep core typed.
- Tests: backend uses pytest with SQLite in-memory and a seeded user; rate limiting is disabled in tests.

## Config

Backend settings come from environment / `.env` (see `app/core/config.py`). Key vars: `DATABASE_URL`, `SECRET_KEY`, `REDIS_URL`, `ENVIRONMENT`, `FRONTEND_URL`, payment provider keys, SMTP, `NVIDIA_API_KEY`. In production a non-default `SECRET_KEY` is required (startup fails otherwise).

Frontend env (`.env.local`): `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8000/api/v1`), `NEXT_PUBLIC_WS_URL` (e.g. `ws://localhost:8000`). A running backend is required; without it, calls fail with `ApiError`.

. Project Overview & Mission

This repository houses the codebase for Yolustu, a comprehensive ride-sharing, carpooling, and trip-booking platform. The system handles complex spatial mapping, real-time engagement, gamification, wallet-based payments, and strict identity verification.  

When assisting in this repository, your primary goal is to write robust, scalable, and highly decoupled code. Do not write lazy, brief, or half-assed solutions. Give big, explicit, and precise answers. If you spot a problem, point that shit out immediately.
2. Tech Stack & Architecture

You must strictly adhere to the established technologies across our stack. Do not introduce new frameworks without explicit permission.

    Backend: Python-based architecture organized strictly by Domain-Driven Design (DDD). It utilizes Alembic for database migrations, Redis for caching, Celery/Schedulers for background tasks, and WebSockets for real-time communication. Everything is containerized using Docker (Dockerfile, docker-compose.yml).  

    Frontend: Built heavily with Next.js and TypeScript. Styling relies on PostCSS.  

    Mobile: Developed using Flutter, supported by dedicated GitHub Action workflows (flutter-mobile.yml).  

    Testing: Jest is configured for unit and component testing, while Playwright handles end-to-end (E2E) testing on the frontend. Backend testing relies heavily on Pytest (conftest.py).  

3. Domain-Driven Design (DDD) Strict Boundaries

The backend is rigorously modularized into distinct domains. Do not bleed logic across these boundaries. Each domain has its own models, schemas, repositories, and services.

    Admin: Back-office services, repositories, and routing.  

    AI: Market rate calculations (market_rates.json) and AI-driven routers.  

    Bookings: Core booking models, schema definitions, and repository ports.  

    Engagement: Real-time infrastructure handling chats, WebSocket messages, push notifications, and user reviews.  

    Gamification: User engagement loops, scoring models, and schemas.  

    Identity: Authentication, user management, and authorization workflows, including RBAC audit rules and verification processes.  

    Payments: Financial core including wallet ledgers, payment flows, and third-party providers.  

    Trips: The heavy lifter handling spatial mapping, vehicle tracking, ride routing, and trip search algorithms.  

4. Coding Rules & Standards

Don't write garbage. We have documented standards, and you are expected to follow them to the letter.

    Follow the Conductors: Adhere entirely to the guidelines found in the conductor/code_styleguides/ directory for python.md, typescript.md, and javascript.md.  

    Typing & Linting: Ensure strict Python typing verified by mypy.ini, and keep the frontend clean according to eslint.config.mjs.  

    Database Performance: Write highly optimized PostgreSQL queries. Pay special attention to spatial indexes and search performance indexes when modifying Alembic migrations. Never bypass the repository layer to access the database directly.  

5. Agile Workflow & Documentation

    Context is King: We operate using Scrum. Before proposing massive architectural shifts, read the acceptance criteria (docs/acceptance-criteria.md), user stories (docs/user-stories.md), and sprint reports (docs/sprint-0-report.md).  

    Microservices: We are actively migrating toward a microservices architecture (docs/microservices-migration.md). Keep modules isolated and cleanly decoupled.  

    Contracts: Always reference the API Contract (docs/api-contract.md) and Database Schema (docs/database-schema.md) when altering backend endpoints or SQLAlchemy models.  

6. AI Assistant Core Directives

When generating code or providing advice in this repository, you must obey the following rules:

    Zero Filtering: Use adult language. Don't sanitize your tone. If a piece of code is fundamentally broken, call it out as crap and fix it.

    Explicit Answers: Prefer massive, explicit, and comprehensive answers over brief summaries. Give full file paths, complete code blocks, and deep architectural explanations.

    Fact-Check Everything: Always double-check your own logic. If you find inconsistencies between the API contract, database schema, or Alembic migrations, provide both answers and explain the discrepancy clearly.

    External Sources: Always provide direct URLs if you are referencing external documentation, web pages, or library updates to solve a problem.

    Proactive Assistance: If the conversation feels stagnant, take the initiative. Bring up relevant topics, missing tests, or unoptimized database queries to keep the project moving forward.

    