import random
from datetime import timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
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
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")

        redis_client.delete(f"otp:{phone}")
        user = self.users.get_by_phone(phone)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        self.users.mark_verified(user)
        return {"message": "Account verified successfully"}

    def register(self, user_in: UserCreate, redis_client) -> User:
        if self.users.get_by_phone(user_in.phone):
            raise HTTPException(status_code=400, detail="Phone already registered")

        user = self.users.create(user_in, get_password_hash(user_in.password))
        self._send_otp_simulation(user.phone, redis_client)
        return user

    def login(self, login_data: LoginInput):
        user = self.users.get_by_phone(login_data.phone)
        if not user or not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect phone or password")

        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account not verified. Please verify your phone via OTP.",
            )

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(data={"sub": user.phone}, expires_delta=access_token_expires)
        return {"access_token": access_token, "token_type": "bearer"}

    def get_user(self, user_id: UUID) -> User:
        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    def get_current_user_model(self, current_user: CurrentUser) -> User:
        return self.get_user(current_user.id)

    def update_current_user(self, current_user: CurrentUser, user_in: UserUpdate) -> User:
        user = self.get_current_user_model(current_user)
        if user_in.phone and user_in.phone != user.phone and self.users.get_by_phone(user_in.phone):
            raise HTTPException(status_code=400, detail="Phone already registered")
        return self.users.update(user, user_in)

    @staticmethod
    def _send_otp_simulation(phone: str, redis_client):
        otp = str(random.randint(100000, 999999))
        redis_client.setex(f"otp:{phone}", 300, otp)
        print("--- [SMS SIMULATION] ---")
        print(f"To: {phone}")
        print(f"Code: {otp}")
        print("------------------------")
        return otp
