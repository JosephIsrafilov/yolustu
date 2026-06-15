import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import APIRouter, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.core.config import UPLOADS_DIR, settings
from app.core.database import engine
from app.core.redis import get_redis
from app.core.csrf import validate_csrf_request
from app.core.logging_config import setup_logging
from app.core.limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from app.core.websocket import manager
from app.core.scheduler import start_scheduler, shutdown_scheduler
from app.domains.admin.router import router as admin_router
from app.domains.bookings.router import router as bookings_router
from app.domains.engagement.chats_router import router as chats_router
from app.domains.engagement.messages_router import router as messages_router
from app.domains.engagement.notifications_router import router as notifications_router
from app.domains.engagement.reviews_router import router as reviews_router
from app.domains.identity.auth_router import router as auth_router
from app.domains.identity.users_router import router as users_router
from app.domains.trips.rides_router import router as rides_router
from app.domains.trips.tracking_router import router as tracking_router
from app.domains.trips.vehicles_router import router as vehicles_router
from app.domains.payments.router import router as payments_router
from app.domains.payments.wallet_router import router as wallet_router
from app.domains.ai.router import router as ai_router
from app.domains.gamification.router import router as gamification_router

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    manager.loop = asyncio.get_running_loop()
    await manager.start()
    start_scheduler()
    yield
    shutdown_scheduler()
    await manager.stop()


app = FastAPI(title="Yolmates API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,  # type: ignore[arg-type]
)

# Mount local uploads directory in development only.
# Production serves files from Supabase Storage.
if settings.ENVIRONMENT != "production":
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

if settings.ENVIRONMENT == "production":
    # Production: only allow the configured frontend URL
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Development: allow localhost and 127.0.0.1 on any port
    origins = [
        settings.FRONTEND_URL,
        "http://127.0.0.1:3000",
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.middleware("http")
async def csrf_middleware(request: Request, call_next):
    csrf_error = validate_csrf_request(request)
    if csrf_error is not None:
        return csrf_error
    return await call_next(request)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.__class__.__name__,
                "message": str(exc.detail),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        },
        headers=exc.headers,
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.exception(f"Unhandled error: {exc}")
    status_code = 500
    if hasattr(exc, "status_code") and isinstance(exc.status_code, int):
        status_code = exc.status_code

    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": exc.__class__.__name__,
                "message": "Internal server error",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        },
    )


# API Versioning (v1)
v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(auth_router, prefix="/auth", tags=["auth"])
v1_router.include_router(users_router, prefix="/users", tags=["users"])
v1_router.include_router(rides_router, prefix="/rides", tags=["rides"])
v1_router.include_router(tracking_router, tags=["tracking"])
v1_router.include_router(bookings_router, prefix="/bookings", tags=["bookings"])
v1_router.include_router(vehicles_router, prefix="/vehicles", tags=["vehicles"])
v1_router.include_router(reviews_router, prefix="/reviews", tags=["reviews"])
v1_router.include_router(messages_router, prefix="/messages", tags=["messages"])
v1_router.include_router(chats_router, prefix="/chats", tags=["chats"])
v1_router.include_router(
    notifications_router, prefix="/notifications", tags=["notifications"]
)
v1_router.include_router(admin_router, prefix="/admin", tags=["admin"])
v1_router.include_router(payments_router, prefix="/payments", tags=["payments"])
v1_router.include_router(wallet_router, prefix="/wallet", tags=["wallet"])
v1_router.include_router(ai_router, prefix="/ai", tags=["ai"])
v1_router.include_router(
    gamification_router, prefix="/gamification", tags=["gamification"]
)

app.include_router(v1_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to Yolmates API", "version": "v1"}


@app.get("/health")
def health_check():
    checks: dict[str, dict[str, object]] = {
        "api": {"status": "ok"},
        "database": {"status": "ok"},
        "redis": {"status": "ok"},
        "configuration": {"status": "ok", "warnings": []},
    }

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        logging.exception("Database health check failed")
        checks["database"] = {"status": "unavailable"}

    try:
        get_redis().ping()
    except Exception:
        logging.exception("Redis health check failed")
        checks["redis"] = {"status": "unavailable"}

    warnings = checks["configuration"].get("warnings")
    if isinstance(warnings, list):
        if not settings.NVIDIA_API_KEY:
            warnings.append(
                "NVIDIA_API_KEY is not configured; deterministic AI fallback is active."
            )
        if settings.ENVIRONMENT.lower() == "production":
            if not settings.STRIPE_SECRET_KEY:
                warnings.append("STRIPE_SECRET_KEY is not configured.")
            if not settings.STRIPE_WEBHOOK_SECRET:
                warnings.append("STRIPE_WEBHOOK_SECRET is not configured.")
        if warnings:
            checks["configuration"]["status"] = "degraded"

    overall_status = "ok"
    if any(check.get("status") == "unavailable" for check in checks.values()):
        overall_status = "degraded"
    return {
        "status": overall_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": checks,
    }
