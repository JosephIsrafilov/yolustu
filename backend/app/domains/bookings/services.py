from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.bookings.models import Booking
from app.domains.bookings.repositories import BookingRepository
from app.domains.bookings.schemas import (
    BookingCreate,
    BookingResponse,
    booking_to_response,
)
from app.domains.identity.dependencies import CurrentUser
from app.domains.payments.services import PaymentService, money
from app.domains.lifecycle import (
    BOOKING_ACCEPTED,
    BOOKING_BOARDED,
    BOOKING_CANCELLED,
    BOOKING_COMPLETED,
    BOOKING_NO_SHOW,
    BOOKING_PAID,
    BOOKING_PENDING,
    BOOKING_REJECTED,
    BOOKING_EXPIRED,
    RIDE_ACTIVE,
    RIDE_COMPLETED,
    can_transition_booking,
)
from app.domains.trips.ports import RideLookupPort
from app.core.notifications import NotificationService

SEAT_SPOTS = ("front_right", "back_left", "back_middle", "back_right")


class BookingsService:
    def __init__(self, db: Session):
        self.db = db
        self.bookings = BookingRepository(db)
        self.rides = RideLookupPort(db)
        self.notifications = NotificationService(db)

    def create_booking(
        self, booking_in: BookingCreate, current_user: CurrentUser
    ) -> BookingResponse:
        if booking_in.seats_booked < 1:
            raise HTTPException(
                status_code=400, detail="seats_booked must be at least 1"
            )

        ride = self.rides.get_ride_for_update(booking_in.ride_id)
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")
        if ride.status != RIDE_ACTIVE:
            raise HTTPException(status_code=400, detail="Ride is not active")
        if ride.departure_time <= datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400, detail="Cannot book a ride that has already departed"
            )
        if ride.available_seats < booking_in.seats_booked:
            raise HTTPException(status_code=400, detail="Not enough available seats")
        if current_user.role == "admin":
            raise HTTPException(status_code=403, detail="Admin cannot book rides")
        if ride.driver_id == current_user.id:
            raise HTTPException(status_code=403, detail="You cannot book your own ride")
        if self.bookings.get_active_for_ride_and_passenger(ride.id, current_user.id):  # type: ignore[arg-type]
            raise HTTPException(
                status_code=400, detail="Booking already exists for this ride"
            )

        selected_spots = self._validate_and_reserve_spots(
            ride, booking_in.seats_booked, booking_in.selected_spots
        )

        from app.core.config import settings

        amount = money(ride.price_per_seat * booking_in.seats_booked)
        if self.db is not None:
            payment_service = PaymentService(self.db)
            wallet = payment_service.wallets.get_or_create_for_update(
                current_user.id, settings.PAYMENT_CURRENCY
            )
            if wallet.available_balance < amount:
                raise HTTPException(
                    status_code=400,
                    detail="Insufficient wallet balance for this booking",
                )

            # Hold the funds
            wallet.available_balance = money(wallet.available_balance - amount)
            wallet.pending_balance = money(wallet.pending_balance + amount)

        booking = self.bookings.create(
            ride_id=ride.id,  # type: ignore[arg-type]
            passenger_id=current_user.id,
            seats_booked=booking_in.seats_booked,
            total_price=amount,  # type: ignore[arg-type]
            selected_spots=selected_spots,
        )

        # Record wallet transaction for the hold
        if self.db is not None:
            payment_service._ledger(
                user_id=current_user.id,
                payment=None,
                booking_id=booking.id,  # type: ignore[arg-type]
                ride_id=ride.id,  # type: ignore[arg-type]
                tx_type="reservation_hold",
                direction="debit",
                amount=amount,
                status="pending",
                description="Funds reserved for booking",
                idempotency_key=f"booking:{booking.id}:reservation_hold",
            )

        ride.available_seats -= booking_in.seats_booked  # type: ignore[assignment]
        ride.available_spots = self._available_spots_after(ride, selected_spots)  # type: ignore[assignment]
        if self.db is not None:
            self.db.commit()
            self.db.refresh(booking)
        self.notifications.send_push_notification(
            user_id=ride.driver_id,  # type: ignore[arg-type]
            title="New Booking Request",
            body=f"{current_user.first_name} requested {booking_in.seats_booked} seats for your ride.",
            data={"booking_id": str(booking.id), "type": "booking_request"},
        )
        return booking_to_response(booking)

    def get_my_bookings(self, current_user: CurrentUser) -> list[BookingResponse]:
        bookings = self.bookings.list_for_passenger(current_user.id)
        self._lazy_expire_bookings(bookings)
        return [booking_to_response(booking) for booking in bookings]

    def get_booking_requests(self, current_user: CurrentUser) -> list[BookingResponse]:
        bookings = self.bookings.list_requests_for_driver(current_user.id)
        self._lazy_expire_bookings(bookings)
        return [booking_to_response(booking) for booking in bookings]

    def confirm_booking(
        self, booking_id: UUID, current_user: CurrentUser
    ) -> BookingResponse:
        booking = self._get_booking_for_update(booking_id)
        ride = self._get_booking_ride_for_update(booking)
        if ride.driver_id != current_user.id:
            raise HTTPException(
                status_code=403, detail="Only the driver can confirm this booking"
            )
        if booking.status != BOOKING_PENDING:
            raise HTTPException(status_code=400, detail="Booking is not pending")
        if ride.status != RIDE_ACTIVE:
            raise HTTPException(status_code=400, detail="Ride is not active")
        if not can_transition_booking(booking.status, BOOKING_ACCEPTED):  # type: ignore[arg-type]
            raise HTTPException(status_code=400, detail="Invalid booking transition")

        booking.status = BOOKING_ACCEPTED  # type: ignore[assignment]
        booking.payment_deadline = datetime.now(timezone.utc) + timedelta(hours=24)  # type: ignore[assignment]
        self.bookings.save(booking)

        self.notifications.send_push_notification(
            user_id=booking.passenger_id,  # type: ignore[arg-type]
            title="Booking Accepted!",
            body="The driver accepted your booking request.",
            data={"booking_id": str(booking.id), "type": "booking_accepted"},
        )

        return booking_to_response(booking)

    def reject_booking(
        self, booking_id: UUID, current_user: CurrentUser
    ) -> BookingResponse:
        booking = self._get_booking_for_update(booking_id)
        ride = self._get_booking_ride_for_update(booking)
        if ride.driver_id != current_user.id:
            raise HTTPException(
                status_code=403, detail="Only the driver can reject this booking"
            )
        if booking.status != BOOKING_PENDING:
            raise HTTPException(status_code=400, detail="Booking is not pending")
        if not can_transition_booking(booking.status, BOOKING_REJECTED):  # type: ignore[arg-type]
            raise HTTPException(status_code=400, detail="Invalid booking transition")

        booking.status = BOOKING_REJECTED  # type: ignore[assignment]
        if ride.status != RIDE_COMPLETED:
            ride.available_seats = min(  # type: ignore[assignment,arg-type]
                ride.total_seats, ride.available_seats + booking.seats_booked
            )
            ride.available_spots = self._available_spots_after(ride)  # type: ignore[assignment]

        # Release held funds
        if self.db is not None:
            from app.domains.payments.services import PaymentService, money

            payment_service = PaymentService(self.db)
            wallet = payment_service.wallets.get_or_create_for_update(
                booking.passenger_id,
                "AZN",  # type: ignore[arg-type]
            )
            amount = money(booking.total_price or 0)  # type: ignore[arg-type]
            wallet.available_balance = money(wallet.available_balance + amount)
            wallet.pending_balance = money(wallet.pending_balance - amount)

            payment_service._ledger(
                user_id=booking.passenger_id,  # type: ignore[arg-type]
                payment=None,
                booking_id=booking.id,  # type: ignore[arg-type]
                ride_id=ride.id,  # type: ignore[arg-type]
                tx_type="reservation_release",
                direction="credit",
                amount=amount,
                status="posted",
                description="Funds released due to rejected booking",
                idempotency_key=f"booking:{booking.id}:reservation_release_reject",
            )

        self.bookings.save(booking)

        self.notifications.send_push_notification(
            user_id=booking.passenger_id,  # type: ignore[arg-type]
            title="Booking Declined",
            body="The driver declined your booking request.",
            data={"booking_id": str(booking.id), "type": "booking_rejected"},
        )

        return booking_to_response(booking)

    def cancel_booking(
        self, booking_id: UUID, current_user: CurrentUser
    ) -> BookingResponse:
        booking = self._get_booking_for_update(booking_id)
        if booking.passenger_id != current_user.id:
            raise HTTPException(
                status_code=403, detail="Only the passenger can cancel this booking"
            )

        if booking.status in [
            BOOKING_CANCELLED,
            BOOKING_REJECTED,
            BOOKING_COMPLETED,
            BOOKING_EXPIRED,
        ]:
            raise HTTPException(
                status_code=400, detail="Booking cannot be cancelled in current status"
            )
        if not can_transition_booking(booking.status, BOOKING_CANCELLED):  # type: ignore[arg-type]
            raise HTTPException(status_code=400, detail="Invalid booking transition")

        if booking.status == BOOKING_PAID and self.db is not None:
            from app.domains.payments.services import PaymentService

            payment = PaymentService(self.db).payments.get_succeeded_for_booking(
                booking.id  # type: ignore[arg-type]
            )
            if payment:
                PaymentService(self.db).refund_payment(payment.id, None)  # type: ignore[arg-type]
                return booking_to_response(self._get_booking(booking_id))

        if booking.status in [BOOKING_PENDING, BOOKING_ACCEPTED, BOOKING_PAID]:
            ride = self._get_booking_ride_for_update(booking)
            if ride.status != RIDE_COMPLETED:
                ride.available_seats = min(  # type: ignore[assignment,arg-type]
                    ride.total_seats, ride.available_seats + booking.seats_booked
                )
                ride.available_spots = self._available_spots_after(
                    ride, released_booking_id=booking.id
                )  # type: ignore[assignment]

        if booking.status in [BOOKING_PENDING, BOOKING_ACCEPTED]:
            # Release held funds
            if self.db is not None:
                from app.domains.payments.services import PaymentService, money

                payment_service = PaymentService(self.db)
                wallet = payment_service.wallets.get_or_create_for_update(
                    booking.passenger_id,
                    "AZN",  # type: ignore[arg-type]
                )
                amount = money(booking.total_price or 0)  # type: ignore[arg-type]
                wallet.available_balance = money(wallet.available_balance + amount)
                wallet.pending_balance = money(wallet.pending_balance - amount)

                payment_service._ledger(
                    user_id=booking.passenger_id,  # type: ignore[arg-type]
                    payment=None,
                    booking_id=booking.id,  # type: ignore[arg-type]
                    ride_id=ride.id,  # type: ignore[arg-type]
                    tx_type="reservation_release",
                    direction="credit",
                    amount=amount,
                    status="posted",
                    description="Funds released due to cancelled booking",
                    idempotency_key=f"booking:{booking.id}:reservation_release_cancel",
                )

        booking.status = BOOKING_CANCELLED  # type: ignore[assignment]
        self.bookings.save(booking)

        ride = self._get_booking_ride(booking)
        self.notifications.send_push_notification(
            user_id=ride.driver_id,  # type: ignore[arg-type]
            title="Booking Cancelled",
            body="A passenger cancelled their booking.",
            data={"booking_id": str(booking.id), "type": "booking_cancelled"},
        )

        return booking_to_response(booking)

    def mark_boarded(
        self, booking_id: UUID, current_user: CurrentUser
    ) -> BookingResponse:
        """Driver marks a passenger as physically in the car."""
        return self._set_boarding_status(booking_id, current_user, BOOKING_BOARDED)

    def mark_no_show(
        self, booking_id: UUID, current_user: CurrentUser
    ) -> BookingResponse:
        """Driver marks a passenger as a no-show."""
        return self._set_boarding_status(booking_id, current_user, BOOKING_NO_SHOW)

    def _set_boarding_status(
        self, booking_id: UUID, current_user: CurrentUser, target: str
    ) -> BookingResponse:
        booking = self._get_booking_for_update(booking_id)
        ride = self._get_booking_ride_for_update(booking)
        if ride.driver_id != current_user.id and current_user.role != "admin":
            raise HTTPException(
                status_code=403, detail="Only the driver can update boarding status"
            )
        if booking.status == target:
            return booking_to_response(booking)
        if not can_transition_booking(booking.status, target):  # type: ignore[arg-type]
            raise HTTPException(
                status_code=400,
                detail=f"Cannot mark booking as {target} from {booking.status}",
            )
        booking.status = target  # type: ignore[assignment]
        self.bookings.save(booking)
        return booking_to_response(booking)

    def _get_booking(self, booking_id: UUID) -> Booking:
        booking = self.bookings.get(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        self._lazy_expire_bookings([booking])
        return booking

    def _get_booking_for_update(self, booking_id: UUID) -> Booking:
        booking = self.bookings.get_for_update(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        self._lazy_expire_bookings([booking])
        return booking

    def _get_booking_ride(self, booking: Booking):
        ride = self.rides.get_ride(booking.ride_id)  # type: ignore[arg-type]
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")
        return ride

    def _get_booking_ride_for_update(self, booking: Booking):
        ride = self.rides.get_ride_for_update(booking.ride_id)  # type: ignore[arg-type]
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")
        return ride

    def _lazy_expire_bookings(self, bookings: list[Booking]) -> None:
        now = datetime.now(timezone.utc)
        expired = []
        for booking in bookings:
            if (
                booking.status == BOOKING_ACCEPTED
                and booking.payment_deadline
                and booking.payment_deadline < now
            ):
                expired.append(booking)

        for booking in expired:
            booking.status = BOOKING_EXPIRED  # type: ignore[assignment]
            ride = self.rides.get_ride_for_update(booking.ride_id)  # type: ignore[arg-type]
            if ride and ride.status != RIDE_COMPLETED:
                ride.available_seats = min(  # type: ignore[assignment,arg-type]
                    ride.total_seats,
                    ride.available_seats + booking.seats_booked,  # type: ignore[arg-type]
                )
                ride.available_spots = self._available_spots_after(ride)  # type: ignore[assignment]

            # Release held funds
            if self.db is not None:
                from app.domains.payments.services import PaymentService, money

                payment_service = PaymentService(self.db)
                wallet = payment_service.wallets.get_or_create_for_update(
                    booking.passenger_id,
                    "AZN",  # type: ignore[arg-type]
                )
                amount = money(booking.total_price or 0)  # type: ignore[arg-type]
                wallet.available_balance = money(wallet.available_balance + amount)
                wallet.pending_balance = money(wallet.pending_balance - amount)

                payment_service._ledger(
                    user_id=booking.passenger_id,  # type: ignore[arg-type]
                    payment=None,
                    booking_id=booking.id,  # type: ignore[arg-type]
                    ride_id=ride.id if ride else booking.ride_id,  # type: ignore[arg-type]
                    tx_type="reservation_release",
                    direction="credit",
                    amount=amount,
                    status="posted",
                    description="Funds released due to expired booking",
                    idempotency_key=f"booking:{booking.id}:reservation_release_expire",
                )

            self.bookings.save(booking)
            self.notifications.send_push_notification(
                user_id=booking.passenger_id,  # type: ignore[arg-type]
                title="Rezerv vaxtı bitdi",
                body="Ödəniş edilmədiyi üçün rezerviniz ləğv edildi.",
                data={"booking_id": str(booking.id), "type": "booking_expired"},
            )

    def _seat_layout(self, ride) -> list[str]:
        return list(SEAT_SPOTS[: ride.total_seats])

    def _taken_spots(self, ride, exclude_booking_id: UUID | None = None) -> set[str]:
        taken: set[str] = set()
        for booking in self.bookings.list_active_for_ride(ride.id):  # type: ignore[arg-type]
            if exclude_booking_id is not None and booking.id == exclude_booking_id:
                continue
            taken.update(booking.selected_spots or [])
        return taken

    def _available_spots_after(
        self,
        ride,
        newly_selected: list[str] | None = None,
        released_booking_id: UUID | None = None,
    ) -> list[str]:
        taken = self._taken_spots(ride, exclude_booking_id=released_booking_id)
        taken.update(newly_selected or [])
        return [spot for spot in self._seat_layout(ride) if spot not in taken]

    def _validate_and_reserve_spots(
        self, ride, seats_booked: int, selected_spots: list[str] | None
    ) -> list[str]:
        layout = self._seat_layout(ride)
        selected = list(selected_spots or [])
        if selected and len(selected) != seats_booked:
            raise HTTPException(
                status_code=400,
                detail="selected_spots count must match seats_booked",
            )
        if len(selected) != len(set(selected)):
            raise HTTPException(status_code=400, detail="Duplicate seat selection")
        unknown = [spot for spot in selected if spot not in layout]
        if unknown:
            raise HTTPException(status_code=400, detail="Invalid seat selection")

        taken = self._taken_spots(ride)
        if any(spot in taken for spot in selected):
            raise HTTPException(
                status_code=400, detail="Selected seat is not available"
            )

        if selected:
            return selected

        available = [spot for spot in layout if spot not in taken]
        if len(available) < seats_booked:
            raise HTTPException(status_code=400, detail="Not enough available seats")
        return available[:seats_booked]
