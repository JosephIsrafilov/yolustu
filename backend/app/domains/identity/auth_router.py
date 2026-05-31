from fastapi import (
    APIRouter,
    Depends,
    Request,
    Response,
    BackgroundTasks,
    HTTPException,
)
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.csrf import CSRF_COOKIE_NAME, generate_csrf_token
from app.core.database import get_db
from app.core.redis import get_redis
from app.core.limiter import limiter
from app.domains.identity.schemas import (
    AuthSessionResponse,
    LoginInput,
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
    response: Response,
    user_in: UserCreate,
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
):
    session_data = IdentityService(db).register(user_in, redis_client)
    _set_auth_cookies(
        response, session_data["accessToken"], session_data["refreshToken"]
    )
    return session_data


@router.post("/login", response_model=AuthSessionResponse)
@limiter.limit("10/minute")
def login(
    request: Request,
    response: Response,
    login_data: LoginInput,
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
):
    session_data = IdentityService(db).login(login_data, redis_client)
    _set_auth_cookies(
        response, session_data["accessToken"], session_data["refreshToken"]
    )
    return session_data


@router.post("/refresh", response_model=AuthSessionResponse)
@limiter.limit("20/minute")
def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
):
    refresh_token_cookie = request.cookies.get("refresh_token")
    if not refresh_token_cookie:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    session_data = IdentityService(db).refresh_token(refresh_token_cookie, redis_client)
    _set_auth_cookies(
        response, session_data["accessToken"], session_data["refreshToken"]
    )
    return session_data


@router.post("/logout")
def logout(response: Response):
    secure = _use_secure_cookies()
    response.delete_cookie(
        key="access_token", httponly=True, secure=secure, samesite="lax", path="/"
    )
    response.delete_cookie(
        key="refresh_token", httponly=True, secure=secure, samesite="lax", path="/"
    )
    response.delete_cookie(
        key=CSRF_COOKIE_NAME, secure=secure, samesite="lax", path="/"
    )
    return {"message": "Logged out successfully"}


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    secure = _use_secure_cookies()
    csrf_token = generate_csrf_token()
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
        max_age=15 * 60,  # 15 minutes
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
        max_age=30 * 24 * 60 * 60,  # 30 days
    )
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,
        secure=secure,
        samesite="lax",
        path="/",
        max_age=30 * 24 * 60 * 60,  # 30 days
    )


def _use_secure_cookies() -> bool:
    return settings.ENVIRONMENT.lower() == "production"
