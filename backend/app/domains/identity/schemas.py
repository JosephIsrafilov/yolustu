from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class UserBase(BaseModel):
    phone: str
    email: Optional[str] = None
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None
    language: Optional[str] = "az"
    role: Optional[str] = "passenger"
    city: Optional[str] = None
    bio: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=72)


_ADMIN_MANAGEABLE_ROLES = {"passenger", "driver", "admin"}


class AdminUserCreate(UserBase):
    password: str = Field(min_length=8, max_length=72)
    role: str = "passenger"

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in _ADMIN_MANAGEABLE_ROLES:
            raise ValueError(f"role must be one of {sorted(_ADMIN_MANAGEABLE_ROLES)}")
        return v


class AdminRoleUpdate(BaseModel):
    role: str

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in _ADMIN_MANAGEABLE_ROLES:
            raise ValueError(f"role must be one of {sorted(_ADMIN_MANAGEABLE_ROLES)}")
        return v


class UserUpdate(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    language: Optional[str] = None
    role: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None


class PublicUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None
    language: Optional[str] = "az"
    role: Optional[str] = "passenger"
    city: Optional[str] = None
    bio: Optional[str] = None
    is_verified: bool = False
    verification_status: str = "pending"
    rating: float = 0.0
    total_rides: int = 0
    created_at: datetime

    @field_validator("is_verified", mode="before")
    @classmethod
    def default_booleans(cls, v: Any) -> bool:
        if v is None:
            return False
        return v

    @field_validator("rating", mode="before")
    @classmethod
    def default_rating(cls, v: Any) -> float:
        if v is None:
            return 0.0
        return v

    @field_validator("total_rides", mode="before")
    @classmethod
    def default_total_rides(cls, v: Any) -> int:
        if v is None:
            return 0
        return v


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_blocked: bool = False
    is_verified: bool = False
    is_email_verified: bool = False
    verification_status: str = "pending"
    document_url: Optional[str] = None
    verification_ai_review: Optional[dict] = None
    rating: float = 0.0
    total_rides: int = 0
    created_at: datetime

    @field_validator("is_blocked", "is_verified", "is_email_verified", mode="before")
    @classmethod
    def default_booleans(cls, v: Any) -> bool:
        if v is None:
            return False
        return v

    @field_validator("rating", mode="before")
    @classmethod
    def default_rating(cls, v: Any) -> float:
        if v is None:
            return 0.0
        return v

    @field_validator("total_rides", mode="before")
    @classmethod
    def default_total_rides(cls, v: Any) -> int:
        if v is None:
            return 0
        return v


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class AuthSessionResponse(BaseModel):
    accessToken: str
    refreshToken: str
    user: UserResponse


class RefreshTokenInput(BaseModel):
    refreshToken: str


class TokenData(BaseModel):
    user_id: Optional[UUID] = None


class LoginInput(BaseModel):
    phone: str
    # No length constraint on login: we verify the credential, we don't
    # re-validate the policy. A min_length here would 422 legacy/short
    # passwords before verification and leak the password policy.
    password: str


class DeviceTokenInput(BaseModel):
    token: str


class PasswordResetRequestInput(BaseModel):
    email: str


class PasswordResetConfirmInput(BaseModel):
    email: str
    code: str
    new_password: str = Field(min_length=8, max_length=72)


class PhonePasswordResetRequestInput(BaseModel):
    phone: str


class PhonePasswordResetConfirmInput(BaseModel):
    phone: str
    code: str
    new_password: str = Field(min_length=8, max_length=72)


class VerifyEmailInput(BaseModel):
    otp: str
