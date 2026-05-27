import type { CreateTripData, Trip, Booking, User, Review, Vehicle } from '@/types';

export interface ApiUser {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  rating: number;
  total_rides: number;
  created_at: string;
  avatar_url?: string | null;
  role?: User['role'] | null;
  city?: string | null;
  bio?: string | null;
  email?: string | null;
  is_blocked?: boolean | null;
  is_verified?: boolean | null;
  is_email_verified?: boolean | null;
  verification_status?: User['verificationStatus'] | null;
  document_url?: string | null;
}

export interface ApiVehicle {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  plate_number: string;
  created_at: string;
}

export interface ApiTrip {
  id: string;
  driver_id: string;
  origin_city: string;
  destination_city: string;
  departure_time: string;
  total_seats: number;
  available_seats: number;
  price_per_seat: number;
  description?: string | null;
  status: Trip['status'];
  created_at: string;
  meeting_point?: string | null;
  dropoff_point?: string | null;
  origin_location?: { lat: number; lon: number };
  destination_location?: { lat: number; lon: number };
  vehicle?: ApiVehicle | null;
  driver?: ApiUser | null;
  smoking_allowed?: boolean;
  pets_allowed?: boolean;
  music_allowed?: boolean;
  female_only?: boolean;
}

export interface ApiBooking {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: Booking['status'];
  seats_booked: number;
  created_at: string;
  ride?: ApiTrip | null;
  passenger?: ApiUser | null;
}

export interface ApiReview {
  id: string;
  ride_id: string;
  author_id: string;
  target_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export interface ApiRideCreateInput {
  departure_time: string;
  total_seats: number;
  available_seats: number;
  price_per_seat: number;
  origin_city: string;
  destination_city: string;
  vehicle_id: string;
  origin: { lat: number; lon: number };
  destination: { lat: number; lon: number };
  car_model?: string;
  description?: string;
  smoking_allowed?: boolean;
  pets_allowed?: boolean;
  music_allowed?: boolean;
  female_only?: boolean;
}

export function mapApiVehicleToVehicle(apiVehicle: ApiVehicle): Vehicle {
  return {
    id: apiVehicle.id,
    userId: apiVehicle.user_id,
    brand: apiVehicle.brand,
    model: apiVehicle.model,
    year: apiVehicle.year,
    color: apiVehicle.color,
    plateNumber: apiVehicle.plate_number,
    createdAt: apiVehicle.created_at,
  };
}

export function mapApiTripToTrip(apiTrip: ApiTrip): Trip {
  const departureDate = new Date(apiTrip.departure_time);
  const vehicle = apiTrip.vehicle ? mapApiVehicleToVehicle(apiTrip.vehicle) : undefined;
  const meetingPoint = apiTrip.meeting_point?.trim() || apiTrip.origin_city;
  const dropoffPoint = apiTrip.dropoff_point?.trim() || apiTrip.destination_city;

  return {
    id: apiTrip.id,
    driverId: apiTrip.driver_id,
    departureCity: apiTrip.origin_city,
    arrivalCity: apiTrip.destination_city,
    meetingPoint,
    dropoffPoint,
    date: departureDate.toISOString().split('T')[0],
    time: departureDate.toTimeString().split(' ')[0].substring(0, 5),
    seatsTotal: apiTrip.total_seats,
    seatsAvailable: apiTrip.available_seats,
    pricePerSeat: apiTrip.price_per_seat,
    carModel: vehicle ? `${vehicle.brand} ${vehicle.model}`.trim() : '', 
    comment: apiTrip.description ?? undefined,
    status: apiTrip.status,
    createdAt: apiTrip.created_at,
    origin: apiTrip.origin_location ? { lat: apiTrip.origin_location.lat, lng: apiTrip.origin_location.lon } : undefined,
    destination: apiTrip.destination_location ? { lat: apiTrip.destination_location.lat, lng: apiTrip.destination_location.lon } : undefined,
    driver: apiTrip.driver ? mapApiUserToUser(apiTrip.driver) : undefined,
    vehicle,
    smokingAllowed: apiTrip.smoking_allowed ?? false,
    petsAllowed: apiTrip.pets_allowed ?? false,
    musicAllowed: apiTrip.music_allowed ?? true,
    femaleOnly: apiTrip.female_only ?? false,
  };
}

export function mapCreateTripToApiRideCreate(
  input: CreateTripData,
  vehicleId: string,
  origin: { lat: number; lon: number },
  destination: { lat: number; lon: number },
): ApiRideCreateInput {
  return {
    departure_time: `${input.date}T${input.time}:00`,
    total_seats: input.seatsTotal,
    available_seats: input.seatsTotal,
    price_per_seat: input.pricePerSeat,
    origin_city: input.departureCity,
    destination_city: input.arrivalCity,
    vehicle_id: vehicleId,
    origin,
    destination,
    car_model: input.carModel || undefined,
    description: input.comment || undefined,
    smoking_allowed: input.smokingAllowed,
    pets_allowed: input.petsAllowed,
    music_allowed: input.musicAllowed,
    female_only: input.femaleOnly,
  };
}

export function mapApiBookingToBooking(apiBooking: ApiBooking): Booking {
  return {
    id: apiBooking.id,
    tripId: apiBooking.ride_id,
    passengerId: apiBooking.passenger_id,
    status: apiBooking.status,
    seatsRequested: apiBooking.seats_booked,
    createdAt: apiBooking.created_at,
    trip: apiBooking.ride ? mapApiTripToTrip(apiBooking.ride) : undefined,
    passenger: apiBooking.passenger ? mapApiUserToUser(apiBooking.passenger) : undefined,
  };
}

export function mapApiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    fullName: `${apiUser.first_name} ${apiUser.last_name}`,
    email: apiUser.email ?? '', 
    phone: apiUser.phone,
    city: apiUser.city ?? '', 
    avatarUrl: apiUser.avatar_url ?? undefined,
    role: apiUser.role ?? 'passenger', 
    rating: apiUser.rating,
    totalTrips: apiUser.total_rides, 
    isBlocked: apiUser.is_blocked ?? false, 
    verificationStatus: apiUser.verification_status ?? 'none',
    isEmailVerified: apiUser.is_email_verified ?? false,
    documentUrl: apiUser.document_url ?? undefined,
    bio: apiUser.bio ?? undefined,
    createdAt: apiUser.created_at,
  };
}

export function mapApiReviewToReview(apiReview: ApiReview): Review {
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
