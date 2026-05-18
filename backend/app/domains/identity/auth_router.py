from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.redis import get_redis
from app.domains.identity.schemas import LoginInput, Token, UserCreate, UserResponse
from app.domains.identity.services import IdentityService

router = APIRouter()


@router.post("/request-otp")
def request_otp(phone: str, db: Session = Depends(get_db), redis_client=Depends(get_redis)):
    return IdentityService(db).request_otp(phone, redis_client)


@router.post("/verify-otp")
def verify_otp(phone: str, otp: str, db: Session = Depends(get_db), redis_client=Depends(get_redis)):
    return IdentityService(db).verify_otp(phone, otp, redis_client)


@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db), redis_client=Depends(get_redis)):
    return IdentityService(db).register(user_in, redis_client)


@router.post("/login", response_model=Token)
def login(login_data: LoginInput, db: Session = Depends(get_db)):
    return IdentityService(db).login(login_data)
