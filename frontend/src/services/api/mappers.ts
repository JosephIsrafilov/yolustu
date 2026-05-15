import type { Trip, Booking, User, Review } from '@/types';

export function mapApiTripToTrip(apiTrip: any): Trip {
  const departureDate = new Date(apiTrip.departure_time);
  return {
    id: apiTrip.id,
    driverId: apiTrip.driver_id,
    departureCity: apiTrip.origin_city,
    arrivalCity: apiTrip.destination_city,
    meetingPoint: '', 
    dropoffPoint: '', 
    date: departureDate.toISOString().split('T')[0],
    time: departureDate.toTimeString().split(' ')[0].substring(0, 5),
    seatsTotal: apiTrip.total_seats,
    seatsAvailable: apiTrip.available_seats,
    pricePerSeat: apiTrip.price_per_seat,
    carModel: '', 
    comment: apiTrip.description,
    status: apiTrip.status,
    createdAt: apiTrip.created_at,
  };
}

export function mapApiBookingToBooking(apiBooking: any): Booking {
  return {
    id: apiBooking.id,
    tripId: apiBooking.ride_id,
    passengerId: apiBooking.passenger_id,
    status: apiBooking.status,
    seatsRequested: apiBooking.seats_booked,
    createdAt: apiBooking.created_at,
  };
}

export function mapApiUserToUser(apiUser: any): User {
  return {
    id: apiUser.id,
    fullName: `${apiUser.first_name} ${apiUser.last_name}`,
    email: '', 
    phone: apiUser.phone,
    city: '', 
    role: 'passenger', 
    rating: apiUser.rating,
    totalTrips: 0, 
    isBlocked: false, 
    createdAt: apiUser.created_at,
  };
}

export function mapApiReviewToReview(apiReview: any): Review {
  return {
    id: apiReview.id,
    tripId: apiReview.ride_id,
    authorId: apiReview.author_id,
    targetUserId: apiReview.target_id,
    rating: apiReview.rating,
    comment: apiReview.comment || '',
    createdAt: apiReview.created_at,
  };
}
