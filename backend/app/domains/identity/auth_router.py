from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.redis import get_redis
from app.core.limiter import limiter
from app.domains.identity.schemas import (
    AuthSessionResponse,
    LoginInput,
    RefreshTokenInput,
    UserCreate,
)
from app.domains.identity.services import IdentityService

router = APIRouter()


@router.post("/request-otp")
@limiter.limit("5/minute")
def request_otp(
    request: Request,
    phone: str,
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
):
    return IdentityService(db).request_otp(phone, redis_client)


@router.post("/verify-otp")
@limiter.limit("10/minute")
def verify_otp(
    request: Request,
    phone: str,
    otp: str,
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
):
    return IdentityService(db).verify_otp(phone, otp, redis_client)


@router.post("/register", response_model=AuthSessionResponse)
def register(
    user_in: UserCreate, db: Session = Depends(get_db), redis_client=Depends(get_redis)
):
    return IdentityService(db).register(user_in, redis_client)


@router.post("/login", response_model=AuthSessionResponse)
def login(
    login_data: LoginInput,
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
):
    return IdentityService(db).login(login_data, redis_client)


@router.post("/refresh", response_model=AuthSessionResponse)
def refresh_token(
    refresh_input: RefreshTokenInput,
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
):
    return IdentityService(db).refresh_token(refresh_input.refreshToken, redis_client)
