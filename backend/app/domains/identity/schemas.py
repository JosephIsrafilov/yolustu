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


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_blocked: bool = False
    is_verified: bool = False
    is_email_verified: bool = False
    verification_status: str = "pending"
    document_url: Optional[str] = None
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
    phone: Optional[str] = None


class LoginInput(BaseModel):
    phone: str
    password: str = Field(min_length=8, max_length=72)


class DeviceTokenInput(BaseModel):
    token: str


class PasswordResetRequestInput(BaseModel):
    email: str


class PasswordResetConfirmInput(BaseModel):
    email: str
    code: str
    new_password: str = Field(min_length=8, max_length=72)


class VerifyEmailInput(BaseModel):
    otp: str
