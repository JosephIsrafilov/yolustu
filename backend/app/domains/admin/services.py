from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.admin.repositories import AdminRepository
from app.domains.bookings.repositories import BookingRepository
from app.domains.bookings.schemas import booking_to_response
from app.domains.identity.dependencies import CurrentUser
from app.domains.identity.repositories import UserRepository
from app.domains.trips.repositories import RideRepository
from app.domains.trips.schemas import ride_to_response
from app.core.pagination import create_paginated_response


class AdminService:
    def __init__(self, db: Session):
        self.admin = AdminRepository(db)
        self.users = UserRepository(db)
        self.rides = RideRepository(db)
        self.bookings = BookingRepository(db)

    @staticmethod
    def require_admin(current_user: CurrentUser):
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")

    def get_stats(self, current_user: CurrentUser) -> dict:
        self.require_admin(current_user)
        return self.admin.stats()

    def get_users(self, current_user: CurrentUser, page: int = 1, limit: int = 100):
        self.require_admin(current_user)
        skip = (page - 1) * limit
        items = self.users.list_all(skip=skip, limit=limit)
        total = self.users.count_all()
        return create_paginated_response(items, total, page, limit)

    def set_user_blocked(
        self, user_id: UUID, is_blocked: bool, current_user: CurrentUser
    ):
        self.require_admin(current_user)
        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return self.users.set_blocked(user, is_blocked)

    def get_rides(self, current_user: CurrentUser, page: int = 1, limit: int = 100):
        self.require_admin(current_user)
        skip = (page - 1) * limit
        items = [
            ride_to_response(ride)
            for ride in self.rides.list_all(skip=skip, limit=limit)
        ]
        total = self.rides.count_all()
        return create_paginated_response(items, total, page, limit)

    def delete_ride(self, ride_id: UUID, current_user: CurrentUser):
        self.require_admin(current_user)
        ride = self.rides.get(ride_id)
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")
        self.rides.delete(ride)
        return {"message": "Ride deleted"}

    def get_bookings(self, current_user: CurrentUser, page: int = 1, limit: int = 100):
        self.require_admin(current_user)
        skip = (page - 1) * limit
        items = [
            booking_to_response(booking)
            for booking in self.bookings.list_all(skip=skip, limit=limit)
        ]
        total = self.bookings.count_all()
        return create_paginated_response(items, total, page, limit)

    def get_pending_verifications(
        self, current_user: CurrentUser, page: int = 1, limit: int = 100
    ):
        self.require_admin(current_user)
        skip = (page - 1) * limit
        items = self.admin.list_pending_verifications(skip=skip, limit=limit)
        total = self.admin.count_pending_verifications()
        return create_paginated_response(items, total, page, limit)

    def approve_verification(self, user_id: UUID, current_user: CurrentUser):
        self.require_admin(current_user)
        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return self.users.update_verification_status(user, "approved")

    def reject_verification(self, user_id: UUID, current_user: CurrentUser):
        self.require_admin(current_user)
        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return self.users.update_verification_status(user, "rejected")
