from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    phone: str
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None
    language: Optional[str] = "az"
    role: Optional[str] = "passenger"
    city: Optional[str] = None
    bio: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    phone: Optional[str] = None
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
    is_blocked: bool
    is_verified: bool
    verification_status: str
    document_url: Optional[str] = None
    rating: float
    total_rides: int
    created_at: datetime


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenData(BaseModel):
    phone: Optional[str] = None


class LoginInput(BaseModel):
    phone: str
    password: str
