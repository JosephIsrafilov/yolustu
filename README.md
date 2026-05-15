# Yolüstü — Azerbaijan Carpooling Prototype

Yolüstü is a carpooling product for Azerbaijan. The project has transitioned from a Sprint 0 mock prototype to a structured setup with separate frontend and backend directories, preparing for full database integration.

## Project Structure

The codebase is divided into frontend and backend applications, along with a containerized database setup.

```text
yolustu/
├── backend/            # FastAPI Python backend
│   ├── alembic/        # Database migrations
│   ├── api/            # API endpoints
│   ├── core/           # Configuration and security
│   ├── models/         # SQLAlchemy database models
│   ├── schemas/        # Pydantic schemas
│   └── main.py         # FastAPI application entry point
├── frontend/           # Next.js 16 frontend
│   ├── public/         # Static assets
│   └── src/            # Next.js App Router source code
├── docs/               # Project documentation and specifications
└── docker-compose.yml  # Docker infrastructure (PostgreSQL, Redis)
```

## Technology Stack

| Area | Current implementation |
|---|---|
| Frontend Framework | Next.js 16 App Router (TypeScript) |
| Frontend Styling | Tailwind CSS v4 |
| Frontend State | Zustand |
| Backend Framework | FastAPI (Python) |
| Database | PostgreSQL (via Docker) |
| ORM & Migrations | SQLAlchemy, Alembic |
| Cache/Queue | Redis (via Docker) |

## How To Run

To run the full stack locally, you need to start the database, the backend API, and the frontend server.

### 1. Infrastructure (Database & Redis)

Start the PostgreSQL and Redis containers using Docker:

```bash
docker-compose up -d
```

### 2. Backend (FastAPI)

Open a new terminal and navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment (Windows example):

```bash
python -m venv venv
.\venv\Scripts\Activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Run database migrations to create the tables:

```bash
alembic upgrade head
```
*Note: If `alembic` is not recognized, run `python -m alembic upgrade head` instead.*

Start the backend server:

```bash
uvicorn main:app --reload
```
The API documentation (Swagger UI) is available at `http://127.0.0.1:8000/docs`.

### 3. Frontend (Next.js)

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies and start the development server:

```bash
npm install
npm run dev
```
The frontend application is available at `http://localhost:3000`.

## Demo Users

**Important Note for Developers:** Previously, the Sprint 0 prototype used hardcoded mock users in the frontend (`elvin@example.com`, `aysel@example.com`, etc.). Now that the real PostgreSQL database is connected, **the database is initially empty**. 

You will need to register new users through the application interface or API to test the flows. The old mock users will no longer work until you create them in your local database.

## API Integration Status

We are currently in Sprint 1, replacing mock-only behavior with server-backed functionality:
- Backend project structure is set up.
- Database schema and migrations are ready.
- **Pending:** Replacing frontend mock Zustand stores with real API calls using Axios/Fetch to the local backend.

## License

MIT
