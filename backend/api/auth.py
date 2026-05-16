import random
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.config import settings
from core.security import create_access_token, get_password_hash, verify_password
from core.redis import get_redis
from models.models import User
from schemas.schemas import Token, UserCreate, UserResponse
from schemas.auth import LoginInput

router = APIRouter()


def _send_otp_simulation(phone: str, rd):
    """Internal helper to generate and 'send' OTP."""
    otp = str(random.randint(100000, 999999))
    rd.setex(f"otp:{phone}", 300, otp)
    print(f"--- [SMS SIMULATION] ---")
    print(f"To: {phone}")
    print(f"Code: {otp}")
    print(f"------------------------")
    return otp


@router.post("/request-otp")
def request_otp(phone: str, rd=Depends(get_redis)):
    """Generates and stores a 6-digit OTP for verification."""
    _send_otp_simulation(phone, rd)
    return {"message": "OTP sent successfully", "phone": phone}


@router.post("/verify-otp")
def verify_otp(phone: str, otp: str, db: Session = Depends(get_db), rd=Depends(get_redis)):
    """Verifies the OTP and activates the user account."""
    stored_otp = rd.get(f"otp:{phone}")

    if not stored_otp or stored_otp != otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )

    
    rd.delete(f"otp:{phone}")

    
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True
    db.commit()

    return {"message": "Account verified successfully"}


@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db), rd=Depends(get_redis)):
    """Registers a new user with password and triggers OTP verification."""
    user = db.query(User).filter(User.phone == user_in.phone).first()
    if user:
        raise HTTPException(status_code=400, detail="Phone already registered")

    new_user = User(
        phone=user_in.phone,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        hashed_password=get_password_hash(user_in.password),
        is_verified=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    
    _send_otp_simulation(new_user.phone, rd)

    return new_user


@router.post("/login", response_model=Token)
def login(login_data: LoginInput, db: Session = Depends(get_db)):
    """Logins user with phone and password. Requires verification."""
    user = db.query(User).filter(User.phone == login_data.phone).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone or password"
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not verified. Please verify your phone via OTP."
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.phone}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
