import secrets
from datetime import timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
)
from app.domains.identity.dependencies import CurrentUser
from app.domains.identity.models import User
from app.domains.identity.repositories import UserRepository
from app.domains.identity.schemas import LoginInput, UserCreate, UserUpdate


class IdentityService:
    def __init__(self, db: Session):
        self.users = UserRepository(db)

    def request_otp(self, phone: str, redis_client):
        self._send_otp_simulation(phone, redis_client)
        return {"message": "OTP sent successfully", "phone": phone}

    def verify_otp(self, phone: str, otp: str, redis_client):
        stored_otp = redis_client.get(f"otp:{phone}")
        if not stored_otp or stored_otp != otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP"
            )

        redis_client.delete(f"otp:{phone}")
        user = self.users.get_by_phone(phone)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        self.users.mark_verified(user)
        return {"message": "Account verified successfully"}

    def register(self, user_in: UserCreate, redis_client):
        if self.users.get_by_phone(user_in.phone):
            raise HTTPException(status_code=400, detail="Phone already registered")

        user = self.users.create(user_in, get_password_hash(user_in.password))
        self._send_otp_simulation(user.phone, redis_client)
        return self._create_auth_session(user, redis_client)

    def login(self, login_data: LoginInput, redis_client):
        user = self.users.get_by_phone(login_data.phone)
        if not user or not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect phone or password",
            )

        return self._create_auth_session(user, redis_client)

    def refresh_token(self, refresh_token: str, redis_client):
        phone = redis_client.get(f"refresh_token:{refresh_token}")
        if not phone:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        redis_client.delete(f"refresh_token:{refresh_token}")

        normalized_phone = (
            phone.decode("utf-8") if isinstance(phone, bytes) else str(phone)
        )
        user = self.users.get_by_phone(normalized_phone)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        return self._create_auth_session(user, redis_client)

    def _create_auth_session(self, user: User, redis_client):
        tokens = self._create_tokens(user.phone, redis_client)
        return {
            "accessToken": tokens["access_token"],
            "refreshToken": tokens["refresh_token"],
            "user": user,
        }

    def _create_tokens(self, phone: str, redis_client):
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": phone}, expires_delta=access_token_expires
        )

        refresh_token = create_refresh_token()
        redis_client.setex(f"refresh_token:{refresh_token}", 30 * 24 * 60 * 60, phone)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    def get_user(self, user_id: UUID) -> User:
        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    def get_current_user_model(self, current_user: CurrentUser) -> User:
        return self.get_user(current_user.id)

    def update_current_user(
        self, current_user: CurrentUser, user_in: UserUpdate
    ) -> User:
        user = self.get_current_user_model(current_user)
        if user_in.role is not None:
            if user_in.role in {"driver", "admin"} and user_in.role != user.role:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid role",
                )
            if user_in.role not in {"passenger", "driver", "admin"}:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role"
                )
        if (
            user_in.phone
            and user_in.phone != user.phone
            and self.users.get_by_phone(user_in.phone)
        ):
            raise HTTPException(status_code=400, detail="Phone already registered")
        return self.users.update(user, user_in)

    def submit_verification(self, current_user: CurrentUser, document_url: str) -> User:
        user = self.get_current_user_model(current_user)
        return self.users.update_verification_status(user, "pending", document_url)

    def register_device_token(self, current_user: CurrentUser, token: str):
        self.users.add_device_token(current_user.id, token)

    @staticmethod
    def _send_otp_simulation(phone: str, redis_client):
        otp = str(secrets.randbelow(900000) + 100000)
        redis_client.setex(f"otp:{phone}", 300, otp)
        print("--- [SMS SIMULATION] ---")
        print(f"To: {phone}")
        print(f"Code: {otp}")
        print("------------------------")
        return otp
