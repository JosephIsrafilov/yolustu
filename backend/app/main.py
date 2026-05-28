import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import APIRouter, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

import app.domains.models as _domain_models  # noqa: F401
from app.core.config import UPLOADS_DIR, settings
from app.core.csrf import validate_csrf_request
from app.core.logging_config import setup_logging
from app.core.limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from app.core.websocket import manager
from app.domains.admin.router import router as admin_router
from app.domains.bookings.router import router as bookings_router
from app.domains.engagement.messages_router import router as messages_router
from app.domains.engagement.notifications_router import router as notifications_router
from app.domains.engagement.reviews_router import router as reviews_router
from app.domains.identity.auth_router import router as auth_router
from app.domains.identity.users_router import router as users_router
from app.domains.trips.rides_router import router as rides_router
from app.domains.trips.vehicles_router import router as vehicles_router
from app.domains.payments.router import router as payments_router
from app.domains.ai.router import router as ai_router
from app.domains.gamification.router import router as gamification_router

# Setup logging
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    manager.loop = asyncio.get_running_loop()
    yield


app = FastAPI(title="Yolmates API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,  # type: ignore[arg-type]
)

# Mount uploads directory
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

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


# Global Exception Handler
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
v1_router.include_router(bookings_router, prefix="/bookings", tags=["bookings"])
v1_router.include_router(vehicles_router, prefix="/vehicles", tags=["vehicles"])
v1_router.include_router(reviews_router, prefix="/reviews", tags=["reviews"])
v1_router.include_router(messages_router, prefix="/messages", tags=["messages"])
v1_router.include_router(
    notifications_router, prefix="/notifications", tags=["notifications"]
)
v1_router.include_router(admin_router, prefix="/admin", tags=["admin"])
v1_router.include_router(payments_router, prefix="/payments", tags=["payments"])
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
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}
