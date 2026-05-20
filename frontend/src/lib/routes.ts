

export const ROUTES = {
  home: '/',
  register: '/auth/register',
  login: '/auth/login',
  profileSetup: '/profile/setup',
  profile: '/profile',
  search: '/search',
  trips: '/trips',
  tripDetails: (id: string) => `/trips/${id}`,
  bookings: '/bookings',
  bookingRequests: '/bookings/requests',
  driverDashboard: '/driver',
  createTrip: '/driver/create-trip',
  myTrips: '/driver/my-trips',
  createReview: '/reviews/create',
  admin: '/admin',
  adminUsers: '/admin/users',
  adminTrips: '/admin/trips',
  adminBookings: '/admin/bookings',
  adminVerifications: '/admin/verifications',
} as const;
