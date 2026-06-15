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

        booking = self.bookings.create(
            ride_id=ride.id,  # type: ignore[arg-type]
            passenger_id=current_user.id,
            seats_booked=booking_in.seats_booked,
            total_price=ride.price_per_seat * booking_in.seats_booked,  # type: ignore[arg-type]
        )
        ride.available_seats -= booking_in.seats_booked  # type: ignore[assignment]
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
            self.bookings.save(booking)
            self.notifications.send_push_notification(
                user_id=booking.passenger_id,  # type: ignore[arg-type]
                title="Rezerv vaxtı bitdi",
                body="Ödəniş edilmədiyi üçün rezerviniz ləğv edildi.",
                data={"booking_id": str(booking.id), "type": "booking_expired"},
            )
