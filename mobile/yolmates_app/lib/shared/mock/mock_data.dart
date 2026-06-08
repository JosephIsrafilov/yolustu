import '../models/booking.dart';
import '../models/review.dart';
import '../models/ride.dart';
import '../models/user.dart';

const User mockCurrentUser = User(
  id: 'user-passenger-1',
  fullName: 'Aysel Mammadova',
  phoneNumber: '+994552345678',
  city: 'Bakı',
  rating: 4.9,
  completedTrips: 18,
  verificationStatus: VerificationStatus.verified,
  role: UserRole.passenger,
  bio: 'Passenger profile placeholder for MVP flows.',
);

const User mockDriverOne = User(
  id: 'driver-1',
  fullName: 'Elvin Huseynov',
  phoneNumber: '+994501234567',
  city: 'Bakı',
  rating: 4.8,
  completedTrips: 124,
  verificationStatus: VerificationStatus.verified,
  role: UserRole.driver,
);

const User mockDriverTwo = User(
  id: 'driver-2',
  fullName: 'Murad Aliyev',
  phoneNumber: '+994703456789',
  city: 'Gəncə',
  rating: 4.7,
  completedTrips: 88,
  verificationStatus: VerificationStatus.verified,
  role: UserRole.driver,
);

final List<Ride> mockRides = <Ride>[
  Ride(
    id: 'ride-1',
    driver: mockDriverOne,
    fromCity: 'Bakı',
    toCity: 'Gəncə',
    departureTime: DateTime(2026, 6, 5, 8, 30),
    priceAzn: 18,
    availableSeats: 3,
    totalSeats: 4,
    meetingPoint: '20 Yanvar metro',
    dropoffPoint: 'Gəncə avtovağzalı',
    description: 'Comfortable sedan with AC.',
    status: RideStatus.active,
  ),
  Ride(
    id: 'ride-2',
    driver: mockDriverTwo,
    fromCity: 'Bakı',
    toCity: 'Lənkəran',
    departureTime: DateTime(2026, 6, 6, 9, 0),
    priceAzn: 16,
    availableSeats: 2,
    totalSeats: 3,
    meetingPoint: 'Koroğlu metro',
    dropoffPoint: 'Lənkəran şəhər mərkəzi',
    description: 'Calm ride with luggage room.',
    status: RideStatus.active,
  ),
  Ride(
    id: 'ride-3',
    driver: mockDriverOne,
    fromCity: 'Bakı',
    toCity: 'Şəki',
    departureTime: DateTime(2026, 6, 7, 7, 45),
    priceAzn: 20,
    availableSeats: 1,
    totalSeats: 3,
    meetingPoint: 'Avtovagzal metro',
    dropoffPoint: 'Şəki avtovağzalı',
    description: 'Morning departure with one short stop.',
    status: RideStatus.active,
  ),
];

final List<Booking> mockBookings = <Booking>[
  Booking(
    id: 'booking-1',
    rideId: mockRides[0].id,
    passengerId: mockCurrentUser.id,
    ride: mockRides[0],
    status: BookingStatus.pending,
    seats: 1,
    totalPrice: mockRides[0].priceAzn,
    createdAt: DateTime(2026, 6, 3, 10, 15),
  ),
  Booking(
    id: 'booking-2',
    rideId: mockRides[1].id,
    passengerId: mockCurrentUser.id,
    ride: mockRides[1],
    status: BookingStatus.accepted,
    seats: 2,
    totalPrice: mockRides[1].priceAzn * 2,
    createdAt: DateTime(2026, 6, 2, 16, 40),
  ),
];

final List<Review> mockReviews = <Review>[
  Review(
    id: 'review-1',
    author: mockCurrentUser,
    rating: 5,
    comment: 'Driver arrived on time and the ride was smooth.',
    createdAt: DateTime(2026, 5, 21),
  ),
  Review(
    id: 'review-2',
    author: mockDriverTwo,
    rating: 4.5,
    comment: 'Friendly passenger and no issues during the ride.',
    createdAt: DateTime(2026, 5, 18),
  ),
];
