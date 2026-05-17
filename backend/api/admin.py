from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID

from core.database import get_db
from api.deps import get_current_user
from models.models import Booking, Ride, User
from schemas.schemas import BookingResponse, RideResponse, UserResponse

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    blocked_users = db.query(func.count(User.id)).filter(User.is_blocked == True).scalar() or 0
    total_rides = db.query(func.count(Ride.id)).scalar() or 0
    active_rides = db.query(func.count(Ride.id)).filter(Ride.status == "active").scalar() or 0
    total_bookings = db.query(func.count(Booking.id)).scalar() or 0
    pending_bookings = db.query(func.count(Booking.id)).filter(Booking.status == "pending").scalar() or 0

    return {
        "totalUsers": total_users,
        "blockedUsers": blocked_users,
        "totalTrips": total_rides,
        "activeTrips": active_rides,
        "totalBookings": total_bookings,
        "pendingBookings": pending_bookings,
    }


@router.get("/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}/block", response_model=UserResponse)
def block_user(user_id: UUID, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_blocked = True
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/unblock", response_model=UserResponse)
def unblock_user(user_id: UUID, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_blocked = False
    db.commit()
    db.refresh(user)
    return user


@router.get("/rides", response_model=list[RideResponse])
def get_rides(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(Ride).order_by(Ride.created_at.desc()).all()


@router.delete("/rides/{ride_id}")
def delete_ride(ride_id: UUID, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    db.delete(ride)
    db.commit()
    return {"message": "Ride deleted"}


@router.get("/bookings", response_model=list[BookingResponse])
def get_bookings(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(Booking).order_by(Booking.created_at.desc()).all()
