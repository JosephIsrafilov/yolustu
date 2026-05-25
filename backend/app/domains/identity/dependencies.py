from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.domains.identity.models import User
from app.domains.identity.repositories import UserRepository
from app.domains.identity.schemas import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


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
            id=user.id,
            phone=user.phone,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            is_verified=user.is_verified,
            is_blocked=user.is_blocked,
            verification_status=user.verification_status,
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
        phone: str = payload.get("sub")
        if phone is None:
            raise credentials_exception
        token_data = TokenData(phone=phone)
    except JWTError:
        raise credentials_exception

    user = UserRepository(db).get_by_phone(token_data.phone)
    if user is None:
        raise credentials_exception
    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is blocked",
        )
    return CurrentUser.from_model(user)
