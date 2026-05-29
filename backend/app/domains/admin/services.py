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
from app.domains.gamification.services import check_and_award_badge


class AdminService:
    def __init__(self, db: Session):
        self.db = db
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
        user.role = "driver"
        user.is_verified = True
        updated_user = self.users.update_verification_status(user, "approved")

        # Gamification: newcomer badge
        check_and_award_badge(self.db, user.id, "newcomer")

        return updated_user

    def reject_verification(self, user_id: UUID, current_user: CurrentUser):
        self.require_admin(current_user)
        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.role = "passenger"
        user.is_verified = False
        return self.users.update_verification_status(user, "rejected")

    def simulate_journey(self, current_user: CurrentUser):
        self.require_admin(current_user)
        import random
        import uuid
        from datetime import datetime, timedelta
        from app.domains.models import User, Vehicle, Ride, Booking, Review, Message

        drivers = (
            self.db.query(User).filter(User.role == "driver", User.is_verified).all()
        )
        if not drivers:
            raise HTTPException(status_code=400, detail="No verified drivers found.")
        driver = random.choice(drivers)

        vehicle = self.db.query(Vehicle).filter(Vehicle.user_id == driver.id).first()
        if not vehicle:
            vehicle = Vehicle(
                id=uuid.uuid4(),
                user_id=driver.id,
                brand="Hyundai",
                model="Mock",
                year=2020,
                color="White",
                plate_number=f"{random.randint(10, 99)}-MM-{random.randint(100, 999)}",
            )
            self.db.add(vehicle)
            self.db.flush()

        passengers = self.db.query(User).filter(User.role == "passenger").all()
        if not passengers:
            raise HTTPException(status_code=400, detail="No passengers found.")
        passenger = random.choice(passengers)

        routes = [
            ("Bakı", "POINT(49.8671 40.4093)", "Gəncə", "POINT(46.3606 40.6828)"),
            ("Sumqayıt", "POINT(49.6667 40.5897)", "Quba", "POINT(48.5134 41.3643)"),
            ("Bakı", "POINT(49.8671 40.4093)", "Şəki", "POINT(47.1706 41.1919)"),
        ]
        o_city, o_coords, d_city, d_coords = random.choice(routes)

        ride = Ride(
            id=uuid.uuid4(),
            driver_id=driver.id,
            vehicle_id=vehicle.id,
            origin_location=o_coords,
            origin_city=o_city,
            destination_location=d_coords,
            destination_city=d_city,
            departure_time=datetime.now() + timedelta(days=random.randint(1, 3)),
            total_seats=4,
            available_seats=3,
            price_per_seat=random.randint(10, 20),
            status="completed",
        )
        self.db.add(ride)
        self.db.flush()

        booking = Booking(
            id=uuid.uuid4(),
            ride_id=ride.id,
            passenger_id=passenger.id,
            seats_booked=1,
            total_price=ride.price_per_seat,
            status="completed",
        )
        self.db.add(booking)

        msg = Message(
            id=uuid.uuid4(),
            sender_id=passenger.id,
            ride_id=ride.id,
            content="Mən hazıram, gözləyirəm.",
        )
        self.db.add(msg)

        review = Review(
            id=uuid.uuid4(),
            target_id=driver.id,
            author_id=passenger.id,
            ride_id=ride.id,
            rating=5,
            comment="Gözəl gediş idi!",
        )
        self.db.add(review)

        driver.total_rides = (driver.total_rides or 0) + 1
        passenger.total_rides = (passenger.total_rides or 0) + 1

        self.db.commit()

        # Gamification
        check_and_award_badge(self.db, driver.id, "first_ride")
        check_and_award_badge(self.db, driver.id, "5_star")
        if driver.total_rides >= 10:
            check_and_award_badge(self.db, driver.id, "veteran")

        return {"message": "Mock journey created successfully", "ride_id": ride.id}
