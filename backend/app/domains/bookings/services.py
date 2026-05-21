from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.bookings.models import Booking
from app.domains.bookings.repositories import BookingRepository
from app.domains.bookings.schemas import BookingCreate, BookingResponse, booking_to_response
from app.domains.identity.dependencies import CurrentUser
from app.domains.trips.ports import RideLookupPort
from app.core.notifications import NotificationService


class BookingsService:
    def __init__(self, db: Session):
        self.bookings = BookingRepository(db)
        self.rides = RideLookupPort(db)
        self.notifications = NotificationService(db)

    def create_booking(self, booking_in: BookingCreate, current_user: CurrentUser) -> BookingResponse:
        ride = self.rides.get_ride_for_update(booking_in.ride_id)
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")
        if ride.status != "active":
            raise HTTPException(status_code=400, detail="Ride is not active")
        if ride.available_seats < booking_in.seats_booked:
            raise HTTPException(status_code=400, detail="Not enough available seats")
        if ride.driver_id == current_user.id:
            raise HTTPException(status_code=400, detail="You cannot book your own ride")
        if self.bookings.get_active_for_ride_and_passenger(ride.id, current_user.id):
            raise HTTPException(status_code=400, detail="Booking already exists for this ride")

        booking = self.bookings.create(
            ride_id=ride.id,
            passenger_id=current_user.id,
            seats_booked=booking_in.seats_booked,
            total_price=ride.price_per_seat * booking_in.seats_booked,
        )
        self.notifications.send_push_notification(
            user_id=ride.driver_id,
            title="New Booking Request",
            body=f"{current_user.first_name} requested {booking_in.seats_booked} seats for your ride.",
            data={"booking_id": str(booking.id), "type": "booking_request"}
        )
        return booking_to_response(booking)

    def get_my_bookings(self, current_user: CurrentUser) -> list[BookingResponse]:
        return [booking_to_response(booking) for booking in self.bookings.list_for_passenger(current_user.id)]

    def get_booking_requests(self, current_user: CurrentUser) -> list[BookingResponse]:
        return [booking_to_response(booking) for booking in self.bookings.list_requests_for_driver(current_user.id)]

    def confirm_booking(self, booking_id: UUID, current_user: CurrentUser) -> BookingResponse:
        booking = self._get_booking(booking_id)
        ride = self._get_booking_ride(booking)
        if ride.driver_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the driver can confirm this booking")
        if booking.status != "pending":
            raise HTTPException(status_code=400, detail="Booking is not pending")
        if ride.available_seats < booking.seats_booked:
            raise HTTPException(status_code=400, detail="Not enough seats left")

        booking.status = "accepted"
        ride.available_seats -= booking.seats_booked
        self.bookings.save(booking)
        
        self.notifications.send_push_notification(
            user_id=booking.passenger_id,
            title="Booking Accepted!",
            body="The driver accepted your booking request.",
            data={"booking_id": str(booking.id), "type": "booking_accepted"}
        )
        
        return booking_to_response(booking)

    def reject_booking(self, booking_id: UUID, current_user: CurrentUser) -> BookingResponse:
        booking = self._get_booking(booking_id)
        ride = self._get_booking_ride(booking)
        if ride.driver_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the driver can reject this booking")

        booking.status = "rejected"
        self.bookings.save(booking)
        
        self.notifications.send_push_notification(
            user_id=booking.passenger_id,
            title="Booking Declined",
            body="The driver declined your booking request.",
            data={"booking_id": str(booking.id), "type": "booking_rejected"}
        )

        return booking_to_response(booking)

    def cancel_booking(self, booking_id: UUID, current_user: CurrentUser) -> BookingResponse:
        booking = self._get_booking(booking_id)
        if booking.passenger_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the passenger can cancel this booking")

        if booking.status == "accepted":
            ride = self._get_booking_ride(booking)
            ride.available_seats += booking.seats_booked

        booking.status = "cancelled"
        self.bookings.save(booking)
        
        ride = self._get_booking_ride(booking)
        self.notifications.send_push_notification(
            user_id=ride.driver_id,
            title="Booking Cancelled",
            body="A passenger cancelled their booking.",
            data={"booking_id": str(booking.id), "type": "booking_cancelled"}
        )

        return booking_to_response(booking)

    def _get_booking(self, booking_id: UUID) -> Booking:
        booking = self.bookings.get(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        return booking

    def _get_booking_ride(self, booking: Booking):
        ride = self.rides.get_ride(booking.ride_id)
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")
        return ride
