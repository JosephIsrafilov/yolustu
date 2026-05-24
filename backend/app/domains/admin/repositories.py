from sqlalchemy import func
from sqlalchemy.orm import Session

from app.domains.bookings.models import Booking
from app.domains.identity.models import User
from app.domains.trips.models import Ride


class AdminRepository:
    def __init__(self, db: Session):
        self.db = db

    def stats(self) -> dict:
        return {
            "totalUsers": self.db.query(func.count(User.id)).scalar() or 0,
            "blockedUsers": self.db.query(func.count(User.id))
            .filter(User.is_blocked)
            .scalar()
            or 0,
            "totalTrips": self.db.query(func.count(Ride.id)).scalar() or 0,
            "activeTrips": self.db.query(func.count(Ride.id))
            .filter(Ride.status == "active")
            .scalar()
            or 0,
            "totalBookings": self.db.query(func.count(Booking.id)).scalar() or 0,
            "pendingBookings": self.db.query(func.count(Booking.id))
            .filter(Booking.status == "pending")
            .scalar()
            or 0,
            "pendingVerifications": self.db.query(func.count(User.id))
            .filter(User.verification_status == "pending")
            .scalar()
            or 0,
        }

    def count_pending_verifications(self) -> int:
        return self.db.query(User).filter(User.verification_status == "pending").count()

    def list_pending_verifications(self, skip: int = 0, limit: int = 100) -> list[User]:
        return (
            self.db.query(User)
            .filter(User.verification_status == "pending")
            .order_by(User.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
