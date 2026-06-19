import type { CreateTripData, Trip, Booking, User, AiDocumentReview, Review, Vehicle } from '@/types';
import { buildApiAssetUrl } from '@/lib/env';

export interface ApiAiDocumentReview {
  recommendation?: string | null;
  confidence?: number | null;
  is_document?: boolean | null;
  is_azerbaijani?: boolean | null;
  document_type?: string | null;
  extracted_name?: string | null;
  expiry_date?: string | null;
  name_matches_profile?: boolean | null;
  is_expired?: boolean | null;
  portrait_present?: boolean | null;
  document_number_present?: boolean | null;
  license_title_present?: boolean | null;
  license_categories?: string[] | null;
  image_dimensions?: { width?: number; height?: number } | null;
  image_geometry_plausible?: boolean | null;
  visible_text?: string[] | null;
  issues?: string[] | null;
  model?: string | null;
  reviewed_at?: string | null;
}

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
  verification_ai_review?: ApiAiDocumentReview | null;
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
  share_token?: string | null;
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
  available_spots?: string[];
}

export interface ApiBooking {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: Booking['status'];
  seats_booked: number;
  total_price?: number | string;
  created_at: string;
  payment_deadline?: string | null;
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
  available_spots?: string[];
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
    pricePerSeat: Number(apiTrip.price_per_seat || 0),
    carModel: vehicle ? `${vehicle.brand} ${vehicle.model}`.trim() : '', 
    comment: apiTrip.description ?? undefined,
    status: apiTrip.status,
    createdAt: apiTrip.created_at,
    shareToken: apiTrip.share_token ?? undefined,
    origin: apiTrip.origin_location ? { lat: apiTrip.origin_location.lat, lng: apiTrip.origin_location.lon } : undefined,
    destination: apiTrip.destination_location ? { lat: apiTrip.destination_location.lat, lng: apiTrip.destination_location.lon } : undefined,
    driver: apiTrip.driver ? mapApiUserToUser(apiTrip.driver) : undefined,
    vehicle,
    smokingAllowed: apiTrip.smoking_allowed ?? false,
    petsAllowed: apiTrip.pets_allowed ?? false,
    musicAllowed: apiTrip.music_allowed ?? true,
    femaleOnly: apiTrip.female_only ?? false,
    availableSpots: apiTrip.available_spots ?? [],
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
    available_spots: input.availableSpots,
  };
}

export function mapApiBookingToBooking(apiBooking: ApiBooking): Booking {
  return {
    id: apiBooking.id,
    tripId: apiBooking.ride_id,
    passengerId: apiBooking.passenger_id,
    status: apiBooking.status,
    seatsRequested: apiBooking.seats_booked,
    totalPrice: apiBooking.total_price ? Number(apiBooking.total_price) : undefined,
    createdAt: apiBooking.created_at,
    paymentDeadline: apiBooking.payment_deadline ?? undefined,
    trip: apiBooking.ride ? mapApiTripToTrip(apiBooking.ride) : undefined,
    passenger: apiBooking.passenger ? mapApiUserToUser(apiBooking.passenger) : undefined,
  };
}

const VALID_AI_RECOMMENDATIONS = ['approve', 'needs_review', 'reject'] as const;

function mapAiReview(raw?: ApiAiDocumentReview | null): AiDocumentReview | undefined {
  if (!raw) return undefined;
  let recommendation = VALID_AI_RECOMMENDATIONS.includes(
    raw.recommendation as AiDocumentReview['recommendation'],
  )
    ? (raw.recommendation as AiDocumentReview['recommendation'])
    : 'needs_review';
  const hasApprovalEvidence =
    raw.is_document === true &&
    raw.is_azerbaijani === true &&
    raw.document_type === 'drivers_license' &&
    raw.name_matches_profile === true &&
    raw.is_expired === false &&
    raw.portrait_present === true &&
    raw.document_number_present === true &&
    raw.license_title_present === true &&
    Array.isArray(raw.license_categories) &&
    raw.license_categories.length > 0 &&
    raw.image_geometry_plausible === true &&
    Array.isArray(raw.visible_text) &&
    raw.visible_text.length > 0 &&
    typeof raw.confidence === 'number' &&
    raw.confidence >= 0.9;
  const issues = Array.isArray(raw.issues) ? [...raw.issues] : [];

  if (recommendation === 'approve' && !hasApprovalEvidence) {
    recommendation = 'needs_review';
    if (!issues.includes('insufficient_evidence')) {
      issues.push('insufficient_evidence');
    }
  }
  const confidence =
    recommendation === 'needs_review' && issues.includes('insufficient_evidence')
      ? 0
      : typeof raw.confidence === 'number'
        ? raw.confidence
        : 0;

  return {
    recommendation,
    confidence,
    isDocument: raw.is_document ?? undefined,
    isAzerbaijani: raw.is_azerbaijani ?? undefined,
    documentType: raw.document_type ?? undefined,
    extractedName: raw.extracted_name ?? undefined,
    expiryDate: raw.expiry_date ?? undefined,
    nameMatchesProfile: raw.name_matches_profile ?? undefined,
    isExpired: raw.is_expired ?? undefined,
    portraitPresent: raw.portrait_present ?? undefined,
    documentNumberPresent: raw.document_number_present ?? undefined,
    licenseTitlePresent: raw.license_title_present ?? undefined,
    licenseCategories: Array.isArray(raw.license_categories) ? raw.license_categories : [],
    imageDimensions:
      typeof raw.image_dimensions?.width === 'number' &&
      typeof raw.image_dimensions?.height === 'number'
        ? { width: raw.image_dimensions.width, height: raw.image_dimensions.height }
        : undefined,
    imageGeometryPlausible: raw.image_geometry_plausible ?? undefined,
    visibleText: Array.isArray(raw.visible_text) ? raw.visible_text : [],
    issues,
    model: raw.model ?? undefined,
    reviewedAt: raw.reviewed_at ?? undefined,
  };
}

export function mapApiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    fullName: `${apiUser.first_name} ${apiUser.last_name}`,
    email: apiUser.email ?? '',
    phone: apiUser.phone,
    city: apiUser.city ?? '',
    avatarUrl: apiUser.avatar_url ? buildApiAssetUrl(apiUser.avatar_url) : undefined,
    role: apiUser.role ?? 'passenger',
    rating: apiUser.rating,
    totalTrips: apiUser.total_rides,
    isBlocked: apiUser.is_blocked ?? false,
    isVerified: apiUser.is_verified ?? false,
    verificationStatus: apiUser.verification_status ?? 'none',
    isEmailVerified: apiUser.is_email_verified ?? false,
    documentUrl: apiUser.document_url ? buildApiAssetUrl(apiUser.document_url) : undefined,
    aiReview: mapAiReview(apiUser.verification_ai_review),
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
