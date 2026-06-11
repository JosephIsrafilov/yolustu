from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, WebSocket, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt  # type: ignore[import-untyped]
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.domains.identity.models import User
from app.domains.identity.repositories import UserRepository
from app.domains.identity.schemas import TokenData
from fastapi import Request


class OAuth2PasswordBearerWithCookie(OAuth2PasswordBearer):
    async def __call__(self, request: Request) -> str | None:
        authorization = request.headers.get("Authorization")
        if authorization:
            scheme, _, param = authorization.partition(" ")
            if scheme.lower() == "bearer":
                return param

        token = request.cookies.get("access_token")
        if not token:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
                )
            return None

        if token.startswith("Bearer "):
            return token.split(" ")[1]
        return token


oauth2_scheme = OAuth2PasswordBearerWithCookie(tokenUrl="api/v1/auth/login")


@dataclass(frozen=True)
class CurrentUser:
    id: UUID
    phone: str
    first_name: str
    last_name: str
    role: str
    is_verified: bool
    is_blocked: bool
    verification_status: str = "approved"

    @classmethod
    def from_model(cls, user: User) -> "CurrentUser":
        return cls(
            id=user.id,  # type: ignore[arg-type]
            phone=user.phone,  # type: ignore[arg-type]
            first_name=user.first_name,  # type: ignore[arg-type]
            last_name=user.last_name,  # type: ignore[arg-type]
            role=user.role,  # type: ignore[arg-type]
            is_verified=user.is_verified,  # type: ignore[arg-type]
            is_blocked=user.is_blocked,  # type: ignore[arg-type]
            verification_status=user.verification_status,  # type: ignore[arg-type]
        )


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> CurrentUser:
    return get_current_user_from_token(token, db)


def get_current_user_from_token(token: str, db: Session) -> CurrentUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception

    user = UserRepository(db).get_by_id(token_data.user_id)  # type: ignore[arg-type]
    if user is None:
        raise credentials_exception
    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is blocked",
        )
    return CurrentUser.from_model(user)


def get_current_user_from_websocket(
    websocket: WebSocket, db: Session, token: str | None = None
) -> CurrentUser:
    websocket_token = token or websocket.cookies.get("access_token")
    if not websocket_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    if websocket_token.startswith("Bearer "):
        websocket_token = websocket_token.split(" ", 1)[1]

    return get_current_user_from_token(websocket_token, db)


def get_current_admin(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """Dependency that ensures the current user has admin role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
