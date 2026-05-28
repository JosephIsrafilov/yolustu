import secrets
from datetime import datetime, timezone

from fastapi import Request
from fastapi.responses import JSONResponse

CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "x-csrf-token"
UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
EXEMPT_PATHS = {
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/request-otp",
    "/api/v1/auth/verify-otp",
    "/api/v1/auth/request-password-reset",
    "/api/v1/auth/reset-password",
}


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def validate_csrf_request(request: Request) -> JSONResponse | None:
    if request.method not in UNSAFE_METHODS:
        return None

    if request.url.path in EXEMPT_PATHS:
        return None

    authorization = request.headers.get("Authorization", "")
    if authorization.lower().startswith("bearer "):
        return None

    if not (
        request.cookies.get("access_token") or request.cookies.get("refresh_token")
    ):
        return None

    csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)
    csrf_header = request.headers.get(CSRF_HEADER_NAME)
    if csrf_cookie and csrf_header and secrets.compare_digest(csrf_cookie, csrf_header):
        return None

    return JSONResponse(
        status_code=403,
        content={
            "success": False,
            "error": {
                "code": "CSRFError",
                "message": "Invalid CSRF token",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        },
    )
