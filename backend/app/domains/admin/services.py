from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.admin.repositories import AdminRepository, AuditLogRepository
from app.domains.bookings.repositories import BookingRepository
from app.domains.bookings.schemas import booking_to_response
from app.core.security import get_password_hash
from app.domains.identity.dependencies import CurrentUser
from app.domains.identity.repositories import UserRepository
from app.domains.identity.schemas import AdminUserCreate
from app.domains.trips.repositories import RideRepository
from app.domains.trips.schemas import ride_to_response
from app.core.pagination import create_paginated_response
from app.domains.gamification.services import check_and_award_badge
from app.domains.lifecycle import RIDE_CANCELLED, can_transition_ride


class AdminService:
    def __init__(self, db: Session):
        self.db = db
        self.admin = AdminRepository(db)
        self.audit = AuditLogRepository(db)
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

    def get_users(
        self,
        current_user: CurrentUser,
        page: int = 1,
        limit: int = 100,
        role: str | None = None,
        status: str = "all",
        verification: str = "all",
        q: str | None = None,
    ):
        self.require_admin(current_user)
        skip = (page - 1) * limit

        # Translate the API-facing enums into repository filter args.
        role_filter = role if role and role != "all" else None
        is_blocked: bool | None = None
        if status == "active":
            is_blocked = False
        elif status == "blocked":
            is_blocked = True
        verification_filter = (
            verification if verification and verification != "all" else None
        )
        search = q.strip() if q and q.strip() else None

        items = self.users.search_users(
            skip=skip,
            limit=limit,
            role=role_filter,
            is_blocked=is_blocked,
            verification_status=verification_filter,
            q=search,
        )
        total = self.users.count_filtered(
            role=role_filter,
            is_blocked=is_blocked,
            verification_status=verification_filter,
            q=search,
        )
        return create_paginated_response(items, total, page, limit)

    def create_user(self, current_user: CurrentUser, payload: AdminUserCreate):
        self.require_admin(current_user)
        if self.users.get_by_phone(payload.phone):
            raise HTTPException(
                status_code=400, detail="Phone number already registered"
            )
        if payload.email and self.users.get_by_email(payload.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        hashed_password = get_password_hash(payload.password)
        user = self.users.create_by_admin(payload, hashed_password)

        # Audit log
        self.audit.create(
            admin_user_id=current_user.id,
            admin_name=f"{current_user.first_name} {current_user.last_name}",
            action="create_user",
            resource_type="user",
            resource_id=user.id,
            description=f"Created user {payload.first_name} {payload.last_name} ({payload.phone}) with role {payload.role}",
            extra_data={
                "role": payload.role,
                "phone": payload.phone,
                "email": payload.email,
            },
        )

        return user

    def change_user_role(self, current_user: CurrentUser, user_id: UUID, role: str):
        self.require_admin(current_user)
        if role not in {"passenger", "driver", "admin"}:
            raise HTTPException(status_code=400, detail="Invalid role")
        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        # Guard: do not allow demoting the last remaining admin.
        if user.role == "admin" and role != "admin" and self.users.count_admins() <= 1:
            raise HTTPException(status_code=400, detail="Cannot demote the last admin")

        old_role = user.role
        updated_user = self.users.set_role(user, role)

        # Audit log
        self.audit.create(
            admin_user_id=current_user.id,
            admin_name=f"{current_user.first_name} {current_user.last_name}",
            action="change_role",
            resource_type="user",
            resource_id=user_id,
            description=f"Changed role of {user.first_name} {user.last_name} from {old_role} to {role}",
            changes={"role": {"old": old_role, "new": role}},
        )

        return updated_user

    def set_user_blocked(
        self, user_id: UUID, is_blocked: bool, current_user: CurrentUser
    ):
        self.require_admin(current_user)
        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        action = "block_user" if is_blocked else "unblock_user"
        updated_user = self.users.set_blocked(user, is_blocked)

        # Audit log
        self.audit.create(
            admin_user_id=current_user.id,
            admin_name=f"{current_user.first_name} {current_user.last_name}",
            action=action,
            resource_type="user",
            resource_id=user_id,
            description=f"{'Blocked' if is_blocked else 'Unblocked'} user {user.first_name} {user.last_name} ({user.phone})",
            changes={"is_blocked": {"old": not is_blocked, "new": is_blocked}},
        )

        return updated_user

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
        if ride.status != RIDE_CANCELLED:
            if not can_transition_ride(ride.status, RIDE_CANCELLED):  # type: ignore[arg-type]
                raise HTTPException(status_code=400, detail="Ride cannot be cancelled")
            ride.status = RIDE_CANCELLED  # type: ignore[assignment]
            self.rides.save(ride)
        return {"message": "Ride cancelled"}

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

    def get_verification_user(self, user_id: UUID, current_user: CurrentUser):
        self.require_admin(current_user)
        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    def approve_verification(self, user_id: UUID, current_user: CurrentUser):
        self.require_admin(current_user)
        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.verification_status != "pending":
            raise HTTPException(
                status_code=409, detail="Verification request is not pending"
            )
        old_role = user.role
        old_verified = user.is_verified
        user.role = "driver"  # type: ignore[assignment]
        user.is_verified = True  # type: ignore[assignment]
        user.verification_status = "approved"  # type: ignore[assignment]

        # Audit log
        self.audit.create(
            admin_user_id=current_user.id,
            admin_name=f"{current_user.first_name} {current_user.last_name}",
            action="approve_verification",
            resource_type="user",
            resource_id=user_id,
            description=f"Approved driver verification for {user.first_name} {user.last_name}",
            changes={
                "verification_status": {"old": "pending", "new": "approved"},
                "role": {"old": old_role, "new": "driver"},
                "is_verified": {"old": old_verified, "new": True},
            },
        )
        if self.db is not None:
            self.db.commit()
            self.db.refresh(user)

        # Gamification: newcomer badge
        if self.db is not None:
            check_and_award_badge(self.db, user.id, "newcomer")  # type: ignore[arg-type]

        return user

    def reject_verification(self, user_id: UUID, current_user: CurrentUser):
        self.require_admin(current_user)
        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.verification_status != "pending":
            raise HTTPException(
                status_code=409, detail="Verification request is not pending"
            )
        old_role = user.role
        old_verified = user.is_verified
        user.role = "passenger"  # type: ignore[assignment]
        user.is_verified = False  # type: ignore[assignment]
        user.verification_status = "rejected"  # type: ignore[assignment]

        # Audit log
        self.audit.create(
            admin_user_id=current_user.id,
            admin_name=f"{current_user.first_name} {current_user.last_name}",
            action="reject_verification",
            resource_type="user",
            resource_id=user_id,
            description=f"Rejected driver verification for {user.first_name} {user.last_name}",
            changes={
                "verification_status": {"old": "pending", "new": "rejected"},
                "role": {"old": old_role, "new": "passenger"},
                "is_verified": {"old": old_verified, "new": False},
            },
        )
        if self.db is not None:
            self.db.commit()
            self.db.refresh(user)

        return user

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

        driver.total_rides = (driver.total_rides or 0) + 1  # type: ignore[assignment]
        passenger.total_rides = (passenger.total_rides or 0) + 1  # type: ignore[assignment]

        self.db.commit()

        # Gamification
        check_and_award_badge(self.db, driver.id, "first_ride")  # type: ignore[arg-type]
        check_and_award_badge(self.db, driver.id, "5_star")  # type: ignore[arg-type]
        if driver.total_rides >= 10:
            check_and_award_badge(self.db, driver.id, "veteran")  # type: ignore[arg-type]

        return {"message": "Mock journey created successfully", "ride_id": ride.id}
