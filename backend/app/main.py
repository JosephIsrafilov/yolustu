from datetime import datetime, timezone

from fastapi import APIRouter, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

import app.domains.models
from app.core.config import UPLOADS_DIR
from app.core.logging_config import setup_logging
from app.domains.admin.router import router as admin_router
from app.domains.bookings.router import router as bookings_router
from app.domains.engagement.messages_router import router as messages_router
from app.domains.engagement.reviews_router import router as reviews_router
from app.domains.identity.auth_router import router as auth_router
from app.domains.identity.users_router import router as users_router
from app.domains.trips.rides_router import router as rides_router
from app.domains.trips.vehicles_router import router as vehicles_router

# Setup logging
setup_logging()

app = FastAPI(title="Yolustu API")

# Mount uploads directory
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    status_code = 500
    if hasattr(exc, "status_code") and isinstance(exc.status_code, int):
        status_code = exc.status_code

    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": exc.__class__.__name__,
                "message": str(exc),
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
v1_router.include_router(admin_router, prefix="/admin", tags=["admin"])

app.include_router(v1_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to Yolustu API", "version": "v1"}


@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}
