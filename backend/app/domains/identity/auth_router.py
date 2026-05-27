from fastapi import APIRouter, Depends, Request, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.redis import get_redis
from app.core.limiter import limiter
from app.domains.identity.schemas import (
    AuthSessionResponse,
    LoginInput,
    RefreshTokenInput,
    UserCreate,
    PasswordResetRequestInput,
    PasswordResetConfirmInput,
    VerifyEmailInput,
    UserResponse,
)
from app.domains.identity.services import IdentityService
from app.domains.identity.dependencies import get_current_user, CurrentUser

router = APIRouter()


@router.post("/request-password-reset")
@limiter.limit("5/minute")
def request_password_reset(
    request: Request,
    reset_data: PasswordResetRequestInput,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
):
    return IdentityService(db).request_password_reset(
        reset_data.email, redis_client, background_tasks
    )


@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(
    request: Request,
    reset_data: PasswordResetConfirmInput,
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
):
    return IdentityService(db).reset_password(
        reset_data.email, reset_data.code, reset_data.new_password, redis_client
    )


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


@router.post("/request-email-verification")
@limiter.limit("5/minute")
def request_email_verification(
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
):
    return IdentityService(db).request_email_verification(
        current_user, redis_client, background_tasks
    )


@router.post("/verify-email", response_model=UserResponse)
@limiter.limit("10/minute")
def verify_email(
    request: Request,
    verify_data: VerifyEmailInput,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
):
    return IdentityService(db).verify_email(current_user, verify_data.otp, redis_client)


@router.post("/register", response_model=AuthSessionResponse)
@limiter.limit("10/minute")
def register(
    request: Request,
    user_in: UserCreate,
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
):
    return IdentityService(db).register(user_in, redis_client)


@router.post("/login", response_model=AuthSessionResponse)
@limiter.limit("10/minute")
def login(
    request: Request,
    login_data: LoginInput,
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
):
    return IdentityService(db).login(login_data, redis_client)


@router.post("/refresh", response_model=AuthSessionResponse)
@limiter.limit("20/minute")
def refresh_token(
    request: Request,
    refresh_input: RefreshTokenInput,
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
):
    return IdentityService(db).refresh_token(refresh_input.refreshToken, redis_client)
