from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from core.database import get_db
from core.config import settings
from core.security import create_access_token
from models.models import User
from schemas.schemas import Token, UserCreate, UserResponse
from schemas.auth import LoginInput

router = APIRouter()

@router.post("/request-otp")
def request_otp(phone: str):
    # Mocking OTP request - in production, this would send an SMS
    return {"message": "success", "phone": phone}

@router.post("/verify-otp", response_model=Token)
def verify_otp(phone: str, otp: str, db: Session = Depends(get_db)):
    # Mocking OTP verification - in production, this would check against a cache (Redis)
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please register first.")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.phone}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == user_in.phone).first()
    if user:
        raise HTTPException(status_code=400, detail="Phone already registered")
    
    new_user = User(
        phone=user_in.phone,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(login_data: LoginInput, db: Session = Depends(get_db)):
    # The current login schema uses 'email' but the model uses 'phone'
    user = db.query(User).filter(User.phone == login_data.phone).first()
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect phone or password")
    
    # Password verification should happen here if we used passwords
    # For Yolüstü (OTP-based), login is usually verify-otp.
    # Keeping this for compatibility if the user wants standard login.
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.phone}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
